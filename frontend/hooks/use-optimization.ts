/**
 * Custom hook for managing prompt optimization flow.
 */

import { useCallback, useEffect, useRef } from "react";
import { useOptimizationStore } from "@/stores/optimization-store";
import { SSEClient } from "@/lib/streaming";
import { apiClient } from "@/lib/api-client";
import { OptimizeRequest, SSEEvent } from "@/lib/types";
import { toast } from "@/stores/toast-store";

/**
 * Hook for orchestrating optimization flow with SSE streaming.
 */
export function useOptimization() {
  const store = useOptimizationStore();
  const sseClientRef = useRef<SSEClient | null>(null);

  /**
   * Start optimization with current store configuration.
   */
  const startOptimization = useCallback(async () => {
    console.log("🟡 [useOptimization] startOptimization called!");
    console.log("📊 [useOptimization] Store state:");
    console.log("  - prompt:", store.prompt ? `"${store.prompt.substring(0, 50)}..."` : "(empty)");
    console.log("  - framework:", store.framework);
    console.log("  - techniques:", store.techniques);
    console.log("  - parameters:", store.parameters);
    console.log("  - datasetConfig:", store.datasetConfig);
    
    // Build request from store state
    const request: OptimizeRequest = {
      prompt: store.prompt,
      selected_framework: store.framework,
      techniques_enabled: store.techniques,
      parameters: store.parameters,
      dataset_config: store.datasetConfig,
      iteration_count: store.iterationCount, // 1-3 iterations for speed control
    };
    
    console.log("📦 [useOptimization] Built request:", request);

    // Reset and start optimization
    console.log("🚀 [useOptimization] Calling store.startOptimization()...");
    store.startOptimization();

    /**
     * Handle incoming SSE events.
     */
    const handleEvent = (event: SSEEvent) => {
      console.log("📡 [SSE Event]", event.type, event.data);

      switch (event.type) {
        case "optimization_start":
          store.setTotalIterations(event.data.total_iterations);
          store.setCurrentStep("Generating synthetic dataset...");
          toast.info("Optimization Started", `${event.data.total_iterations} iteration(s)`, 2000);
          break;

        case "dataset_generated":
          store.setDatasetInfo(event.data.example_count, event.data.domain);
          store.setCurrentStep("Building framework-structured prompt...");
          toast.success(
            "Dataset Generated",
            `${event.data.example_count} examples for ${event.data.domain}`,
            3000
          );
          break;

        case "iteration_start":
          store.setCurrentStep(`Iteration ${event.data.iteration}: Running tests...`);
          toast.info(`Iteration ${event.data.iteration}`, "Starting evaluation", 2000);
          break;

        case "executing_tests":
          store.setCurrentStep(`Iteration ${event.data.iteration}: Executing ${event.data.count} tests...`);
          store.setTestProgress(0, event.data.count);
          break;

        case "test_progress":
          store.setTestProgress(event.data.current, event.data.total);
          store.setCurrentStep(`Iteration ${event.data.iteration}: Test ${event.data.current}/${event.data.total}`);
          break;

        case "applying_technique":
          store.setCurrentTechnique(event.data.technique);
          store.setCurrentStep(`Iteration ${event.data.iteration}: Applying ${event.data.technique}...`);
          break;

        case "evaluating_metrics":
          store.setCurrentStep(`Iteration ${event.data.iteration}: Evaluating metrics...`);
          store.setTestProgress(null, 0);
          break;

        case "metrics_calculated":
          store.setCurrentStep(`Iteration ${event.data.iteration}: Metrics calculated`);
          toast.info(`Metrics Calculated`, `Score: ${event.data.metrics.aggregate_score.toFixed(1)}`, 2000);
          break;

        case "applying_rsip":
          store.setCurrentStep(`Iteration ${event.data.iteration}: Applying RSIP...`);
          break;

        case "prompt_improved":
          store.setCurrentStep(`Iteration ${event.data.iteration}: Prompt improved via RSIP`);
          toast.success("Prompt Improved", `RSIP applied for iteration ${event.data.iteration + 1}`, 2000);
          break;

        case "iteration_complete":
          const iterResult: IterationResult = {
            iteration: event.data.iteration,
            prompt: event.data.prompt_version,
            metrics: {
              relevance: event.data.metrics.relevance,
              accuracy: event.data.metrics.accuracy,
              consistency: event.data.metrics.consistency,
              efficiency: event.data.metrics.efficiency,
              readability: event.data.metrics.readability,
              aggregate: event.data.metrics.aggregate_score,
            },
            version_id: `v${event.data.iteration}`,
            breakdown: event.data.evaluation_details || [],
            techniques: event.data.techniques as Technique[],
            parameters: store.parameters,
            tokens_used: 0,
            duration_seconds: event.data.duration_seconds,
            created_at: new Date().toISOString(),
          };
          store.updateIteration(iterResult);
          toast.success(
            `Iteration ${event.data.iteration} Complete`,
            `Score: ${event.data.metrics.aggregate_score.toFixed(1)}/100`,
            3000
          );
          break;

        case "optimization_complete":
          const completedResult: OptimizationComplete = {
            prompt_id: `opt_${Date.now()}`,
            best_version: event.data.best_version.iteration,
            all_iterations: event.data.all_versions.map((v: any, i: number) => ({
              iteration: v.iteration,
              prompt: v.prompt,
              metrics: {
                relevance: v.metrics.relevance,
                accuracy: v.metrics.accuracy,
                consistency: v.metrics.consistency,
                efficiency: v.metrics.efficiency,
                readability: v.metrics.readability,
                aggregate: v.metrics.aggregate_score,
              },
              version_id: `v${v.iteration}`,
              breakdown: [],
              techniques: store.techniques,
              parameters: store.parameters,
              tokens_used: 0,
              duration_seconds: event.data.total_time_seconds,
              created_at: new Date().toISOString(),
            })),
            improvement_percentage: 0,
            total_duration_seconds: event.data.total_time_seconds,
            total_tokens_used: 0,
          };
          store.completeOptimization(completedResult);
          store.setBestVersion(event.data.best_version.iteration);
          toast.success(
            "Optimization Complete! 🎉",
            `Best: Iteration ${event.data.best_version.iteration} (${event.data.best_version.metrics.aggregate_score.toFixed(1)}/100)`,
            5000
          );
          break;

        case "error":
          console.error("❌ [Optimization Error]", event.data.message);
          toast.error(
            "Optimization Failed",
            event.data.message || "An unexpected error occurred",
            5000
          );
          store.resetOptimization();
          break;
      }
    };

    /**
     * Handle SSE connection errors.
     */
    const handleError = (error: Error) => {
      console.error("SSE error:", error);
      toast.error(
        "Connection Error",
        "Lost connection to optimization server. Please try again.",
        5000
      );
      store.resetOptimization();
    };

    /**
     * Handle SSE stream completion.
     */
    const handleComplete = () => {
      console.log("Optimization stream complete");
    };

    // Create and connect SSE client
    const url = apiClient.getOptimizeSSEUrl(request);
    const requestBody = apiClient.getOptimizeRequestBody(request);
    
    console.log("=== STARTING OPTIMIZATION ===");
    console.log("URL:", url);
    console.log("Request:", JSON.parse(requestBody));
    
    sseClientRef.current = new SSEClient(
      url,
      requestBody,
      handleEvent,
      handleError,
      handleComplete
    );
    
    // Connect (async but we don't await - errors handled in SSEClient)
    sseClientRef.current.connect().catch((error) => {
      console.error("Failed to start SSE connection:", error);
      handleError(error);
    });
  }, [store]);

  /**
   * Stop optimization and disconnect SSE.
   */
  const stopOptimization = useCallback(() => {
    if (sseClientRef.current) {
      sseClientRef.current.disconnect();
      sseClientRef.current = null;
    }
    store.resetOptimization();
  }, [store]);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      if (sseClientRef.current) {
        sseClientRef.current.disconnect();
      }
    };
  }, []);

  return {
    startOptimization,
    stopOptimization,
    isOptimizing: store.isOptimizing,
    currentIteration: store.currentIteration,
    iterations: store.iterations,
    completedResult: store.completedResult,
  };
}


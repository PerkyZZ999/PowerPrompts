/**
 * Optimization Progress Component
 * Real-time progress tracking with detailed step information
 */

"use client";

import { useOptimizationStore } from "@/stores/optimization-store";
import { useOptimization } from "@/hooks/use-optimization";
import { Activity, CheckCircle2, Loader2, AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function OptimizationProgress() {
  const { startOptimization } = useOptimization();
  const {
    prompt,
    framework,
    techniques,
    isOptimizing,
    currentIteration,
    totalIterations,
    currentStep,
    testProgress,
    currentTechnique,
    datasetInfo,
    iterations,
  } = useOptimizationStore();

  const canStartOptimization = prompt.trim().length > 0 && !isOptimizing;

  return (
    <div className="glass p-6 rounded-lg border border-zinc-700/50 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Live Progress</h2>
        </div>
        {isOptimizing && (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Optimizing...</span>
          </div>
        )}
      </div>

      {/* Optimization Button */}
      {!isOptimizing && iterations.length === 0 && (
        <button
          onClick={startOptimization}
          disabled={!canStartOptimization}
          className={cn(
            "w-full py-4 px-6 rounded-lg font-semibold text-base transition-all duration-200",
            "flex items-center justify-center gap-2",
            canStartOptimization
              ? "bg-primary text-black hover:bg-primary/90 animated-border"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          )}
        >
          <Zap className="w-5 h-5" />
          Start Optimization
        </button>
      )}

      {/* Progress Indicator */}
      {isOptimizing && (
        <div className="space-y-4">
          {/* Iteration Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Iteration Progress</span>
              <span className="text-white font-mono">
                {currentIteration}/{totalIterations}
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 neon-glow"
                style={{
                  width: `${(currentIteration / totalIterations) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700/30">
            <div className="flex items-start gap-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin mt-0.5" />
              <div className="flex-1">
                <p className="text-white font-medium">{currentStep}</p>
                
                {/* Test Progress Bar */}
                {testProgress && testProgress.total > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Running tests</span>
                      <span className="font-mono">
                        {testProgress.current}/{testProgress.total}
                      </span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${(testProgress.current / testProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Active Technique */}
                {currentTechnique && (
                  <div className="mt-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm text-zinc-400">
                      Technique: <span className="text-white">{currentTechnique}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dataset Info */}
          {datasetInfo && (
            <div className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-700/30">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>
                  Dataset: <span className="text-white">{datasetInfo.count} examples</span> ({datasetInfo.domain})
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed Iterations */}
      {iterations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-400">Completed Iterations</h3>
          <div className="space-y-2">
            {iterations.map((iter) => (
              <div
                key={iter.iteration}
                className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-700/30 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-white font-medium">Iteration {iter.iteration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400">Score:</span>
                    <span className="font-mono text-primary font-semibold">
                      {iter.metrics.aggregate.toFixed(1)}
                    </span>
                  </div>
                </div>
                
                {/* Mini metrics */}
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center justify-between px-2 py-1 bg-zinc-800/50 rounded">
                    <span className="text-zinc-500">Rel</span>
                    <span className="text-white font-mono">{iter.metrics.relevance.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 bg-zinc-800/50 rounded">
                    <span className="text-zinc-500">Acc</span>
                    <span className="text-white font-mono">{iter.metrics.accuracy.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 bg-zinc-800/50 rounded">
                    <span className="text-zinc-500">Cons</span>
                    <span className="text-white font-mono">{iter.metrics.consistency.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isOptimizing && iterations.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">
            Enter a prompt and click "Start Optimization" to begin
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Optimization Service
 * Orchestrates the complete prompt optimization pipeline
 */

import { frameworkBuilder } from './framework-builder.js';
import { datasetGenerator } from './dataset-generator.js';
import { evaluator, type Metrics } from './evaluator.js';
import { techniqueApplier } from './technique-applier.js';
import { llmClient } from '../core/llm-client.js';
import { createPrompt, createVersion } from '../db/crud.js';
import type { EventQueue } from '../utils/streaming.js';

/**
 * Optimization request interface
 */
export interface OptimizationRequest {
  prompt: string;
  selected_framework: 'RACE' | 'COSTAR' | 'APE' | 'CREATE';
  techniques_enabled: string[];
  parameters: {
    temperature: number;
    top_p: number;
    max_tokens: number;
    model: string;
  };
  dataset_config: {
    example_count: number;
    difficulty_levels: string[];
  };
}

/**
 * Optimization result interface
 */
export interface OptimizationResult {
  prompt_id: string;
  best_version: {
    iteration: number;
    prompt: string;
    metrics: Metrics;
  };
  all_versions: Array<{
    iteration: number;
    prompt: string;
    metrics: Metrics;
  }>;
  total_time_seconds: number;
}

/**
 * Optimization Service class
 */
export class OptimizationService {
  /**
   * Run the complete optimization pipeline
   */
  async optimize(
    request: OptimizationRequest,
    eventQueue: EventQueue
  ): Promise<OptimizationResult> {
    const startTime = Date.now();

    console.log('[OPTIMIZATION] Starting optimization pipeline...');

    // Emit start event
    eventQueue.push({
      type: 'optimization_start',
      data: { total_iterations: 5 },
    });

    try {
      // Step 1: Store original prompt
      const promptId = await createPrompt({
        originalPrompt: request.prompt,
        selectedFramework: request.selected_framework,
        techniquesEnabled: request.techniques_enabled,
        parameters: request.parameters,
      });

      console.log(`[OPTIMIZATION] Prompt stored with ID: ${promptId}`);

      // Step 2: Generate synthetic dataset
      console.log('[OPTIMIZATION] Generating synthetic dataset...');
      const dataset = await datasetGenerator.generate(
        promptId,
        request.prompt,
        {
          exampleCount: request.dataset_config.example_count,
          difficultyLevels: request.dataset_config.difficulty_levels,
        }
      );

      eventQueue.push({
        type: 'dataset_generated',
        data: {
          example_count: dataset.examples.length,
          domain: dataset.domain,
        },
      });

      // Step 3: Build initial framework-structured prompt
      console.log('[OPTIMIZATION] Building framework-structured prompt...');
      let currentPrompt = await frameworkBuilder.build(
        request.prompt,
        request.selected_framework
      );

      // Apply initial techniques (CoT if enabled)
      if (request.techniques_enabled.includes('cot')) {
        currentPrompt = techniqueApplier.applyChainOfThought(currentPrompt);
      }

      console.log('[OPTIMIZATION] Initial prompt built');

      // Step 4: Run configurable iteration optimization loop (1-3 iterations)
      const iterationCount = request.iteration_count || 1;
      const versions: Array<{
        iteration: number;
        prompt: string;
        metrics: Metrics;
      }> = [];

      for (let iteration = 1; iteration <= iterationCount; iteration++) {
        const iterationStart = Date.now();

        console.log(`\n[OPTIMIZATION] === Iteration ${iteration}/${iterationCount} ===`);

        eventQueue.push({
          type: 'iteration_start',
          data: {
            iteration,
            prompt: currentPrompt,
          },
        });

        // Execute prompt on a sample of examples (for speed)
        // Sample 5 examples randomly for evaluation (instead of all 15+)
        const sampleSize = Math.min(5, dataset.examples.length);
        const sampledExamples = dataset.examples
          .sort(() => Math.random() - 0.5)
          .slice(0, sampleSize);

        console.log(`[OPTIMIZATION] Evaluating ${sampleSize} sampled examples (out of ${dataset.examples.length} total)`);

        const outputs: string[] = [];
        const evaluationExamples: Array<{
          input: string;
          expectedOutput: string;
          actualOutput: string;
        }> = [];

        // Push executing_tests event
        eventQueue.push({
          type: 'executing_tests',
          data: { count: sampleSize, iteration },
        });

        for (let i = 0; i < sampledExamples.length; i++) {
          const example = sampledExamples[i];
          if (!example) continue;

          console.log(`[OPTIMIZATION] Executing example ${i + 1}/${sampleSize}...`);
          
          // Push progress event
          eventQueue.push({
            type: 'test_progress',
            data: { current: i + 1, total: sampleSize, iteration },
          });
          
          let output: string;

          // Apply technique-specific execution
          if (request.techniques_enabled.includes('self_consistency')) {
            // Self-consistency: Generate multiple paths and select best (3 LLM calls per example)
            console.log(`[OPTIMIZATION] Applying self-consistency (3 paths) for example ${i + 1}...`);
            
            eventQueue.push({
              type: 'applying_technique',
              data: { technique: 'self_consistency', iteration },
            });
            
            output = await techniqueApplier.applySelfConsistency(
              currentPrompt,
              example.input,
              3 // 3 paths
            );
          } else if (request.techniques_enabled.includes('tot')) {
            eventQueue.push({
              type: 'applying_technique',
              data: { technique: 'tree_of_thoughts', iteration },
            });
            
            const totResult = await techniqueApplier.applyTreeOfThoughts(
              currentPrompt,
              example.input
            );
            output = totResult.output;
          } else {
            // Standard execution (1 LLM call per example)
            const fullPrompt = `${currentPrompt}\n\nInput: ${example.input}`;
            output = await llmClient.complete(fullPrompt, request.parameters);
          }

          outputs.push(output);
          evaluationExamples.push({
            input: example.input,
            expectedOutput: example.expected_output,
            actualOutput: output,
          });
        }

        // Evaluate
        console.log('[OPTIMIZATION] Evaluating iteration...');
        
        eventQueue.push({
          type: 'evaluating_metrics',
          data: { iteration },
        });
        
        const { metrics, evaluations } = await evaluator.evaluateDataset(
          currentPrompt,
          evaluationExamples
        );
        
        eventQueue.push({
          type: 'metrics_calculated',
          data: { metrics, iteration },
        });

        // Store version
        await createVersion({
          promptId,
          iterationNumber: iteration,
          promptText: currentPrompt,
          metrics,
          evaluationDetails: evaluations,
          techniquesApplied: request.techniques_enabled,
        });

        versions.push({
          iteration,
          prompt: currentPrompt,
          metrics,
        });

        const iterationDuration = (Date.now() - iterationStart) / 1000;

        // Emit iteration complete
        eventQueue.push({
          type: 'iteration_complete',
          data: {
            iteration,
            prompt_version: currentPrompt,
            metrics,
            evaluation_details: evaluations,
            techniques: request.techniques_enabled,
            duration_seconds: iterationDuration,
          },
        });

        console.log(`[OPTIMIZATION] Iteration ${iteration} complete in ${iterationDuration.toFixed(2)}s`);
        console.log(`[OPTIMIZATION] Metrics:`, metrics);

        // Apply RSIP for next iteration (except on last iteration)
        if (iteration < iterationCount && request.techniques_enabled.includes('rsip')) {
          console.log('[OPTIMIZATION] Applying RSIP for next iteration...');
          
          eventQueue.push({
            type: 'applying_rsip',
            data: { iteration },
          });
          
          const { improved, critique } = await techniqueApplier.applyRSIP(
            currentPrompt,
            metrics
          );
          currentPrompt = improved;
          
          eventQueue.push({
            type: 'prompt_improved',
            data: { iteration, critique, improved_prompt: improved },
          });
        }
      }

      // Step 5: Select best version
      const bestVersion = versions.reduce((best, current) =>
        current.metrics.aggregate_score > best.metrics.aggregate_score
          ? current
          : best
      );

      console.log(`\n[OPTIMIZATION] Best version: Iteration ${bestVersion.iteration}`);
      console.log(`[OPTIMIZATION] Best score: ${bestVersion.metrics.aggregate_score}`);

      const totalTime = (Date.now() - startTime) / 1000;

      // Emit completion
      eventQueue.push({
        type: 'optimization_complete',
        data: {
          best_version: bestVersion,
          all_versions: versions,
          total_time_seconds: totalTime,
        },
      });

      console.log(`[OPTIMIZATION] Pipeline complete in ${totalTime.toFixed(2)}s`);

      // Close queue
      eventQueue.close();

      return {
        prompt_id: promptId,
        best_version: bestVersion,
        all_versions: versions,
        total_time_seconds: totalTime,
      };
    } catch (error) {
      console.error('[OPTIMIZATION ERROR]', error);

      // Emit error event
      eventQueue.push({
        type: 'error',
        data: {
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        },
      });

      eventQueue.close();

      throw error;
    }
  }
}

/**
 * Global optimization service instance
 */
export const optimizationService = new OptimizationService();


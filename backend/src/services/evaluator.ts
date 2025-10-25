/**
 * Evaluator Service
 * Calculates evaluation metrics for prompt outputs
 */

import { llmClient } from "../core/llm-client.js";
import {
  RELEVANCE_EVALUATION_PROMPT,
  ACCURACY_EVALUATION_PROMPT,
  READABILITY_EVALUATION_PROMPT,
} from "../prompts/evaluation-prompts.js";

/**
 * Metrics interface
 */
export interface Metrics {
  relevance: number;
  accuracy: number;
  consistency: number;
  efficiency: number;
  readability: number;
  aggregate_score: number;
}

/**
 * Example evaluation result
 */
export interface ExampleEvaluation {
  input: string;
  output: string;
  metrics: Metrics;
}

/**
 * Evaluator class
 */
export class Evaluator {
  /**
   * Calculate relevance score using LLM-as-judge
   */
  private async calculateRelevance(
    input: string,
    output: string,
  ): Promise<number> {
    const prompt = RELEVANCE_EVALUATION_PROMPT.replace(
      "{input}",
      input,
    ).replace("{output}", output);

    try {
      const response = await llmClient.complete(prompt, {
        temperature: 0.1,
        maxTokens: 4000, // High limit for detailed evaluation
      });

      const score = parseFloat(response.trim());
      return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error("[EVALUATOR] Relevance calculation failed:", error);
      return 50;
    }
  }

  /**
   * Calculate accuracy score using LLM-as-judge with expected output
   */
  private async calculateAccuracy(
    input: string,
    expectedOutput: string,
    actualOutput: string,
  ): Promise<number> {
    const prompt = ACCURACY_EVALUATION_PROMPT.replace("{input}", input)
      .replace("{expected_output}", expectedOutput)
      .replace("{actual_output}", actualOutput);

    try {
      const response = await llmClient.complete(prompt, {
        temperature: 0.1,
        maxTokens: 4000, // High limit for detailed evaluation
      });

      const score = parseFloat(response.trim());
      return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error("[EVALUATOR] Accuracy calculation failed:", error);
      return 50;
    }
  }

  /**
   * Calculate consistency score (variance across multiple outputs)
   */
  private calculateConsistency(outputs: string[]): number {
    if (outputs.length < 2) {
      return 100;
    }

    // Calculate average length
    const lengths = outputs.map((o) => o.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

    // Calculate variance in length
    const variance =
      lengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) /
      lengths.length;

    // Convert variance to consistency score (lower variance = higher consistency)
    const coefficientOfVariation = Math.sqrt(variance) / avgLength;
    const consistency = Math.max(0, 100 - coefficientOfVariation * 100);

    return Math.min(100, consistency);
  }

  /**
   * Calculate efficiency score (token usage vs output quality)
   */
  private calculateEfficiency(prompt: string, output: string): number {
    const promptTokens = llmClient.countTokens(prompt);
    const outputTokens = llmClient.countTokens(output);

    // Efficiency = output quality per token used
    // Penalize very long prompts and very short outputs
    const ratio = outputTokens / Math.max(1, promptTokens);

    // Ideal ratio is around 0.5-2.0
    let efficiency: number;
    if (ratio < 0.5) {
      // Too little output for the prompt
      efficiency = ratio * 100;
    } else if (ratio > 2.0) {
      // Too much output (possibly verbose)
      efficiency = Math.max(50, 100 - (ratio - 2.0) * 10);
    } else {
      // Good ratio
      efficiency = 80 + (1 - Math.abs(ratio - 1)) * 20;
    }

    return Math.min(100, Math.max(0, efficiency));
  }

  /**
   * Calculate readability score using LLM-as-judge
   */
  private async calculateReadability(output: string): Promise<number> {
    const prompt = READABILITY_EVALUATION_PROMPT.replace("{output}", output);

    try {
      const response = await llmClient.complete(prompt, {
        temperature: 0.1,
        maxTokens: 4000, // High limit for detailed evaluation
      });

      const score = parseFloat(response.trim());
      return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error("[EVALUATOR] Readability calculation failed:", error);
      return 50;
    }
  }

  /**
   * Calculate aggregate score (weighted average)
   */
  private calculateAggregateScore(
    metrics: Omit<Metrics, "aggregate_score">,
  ): number {
    const weights = {
      relevance: 1.2,
      accuracy: 1.5,
      consistency: 0.8,
      efficiency: 0.7,
      readability: 1.0,
    };

    const totalWeight =
      weights.relevance +
      weights.accuracy +
      weights.consistency +
      weights.efficiency +
      weights.readability;

    const weightedSum =
      metrics.relevance * weights.relevance +
      metrics.accuracy * weights.accuracy +
      metrics.consistency * weights.consistency +
      metrics.efficiency * weights.efficiency +
      metrics.readability * weights.readability;

    return Math.round((weightedSum / totalWeight) * 10) / 10;
  }

  /**
   * Evaluate a single example
   */
  async evaluateExample(
    prompt: string,
    input: string,
    expectedOutput: string,
    actualOutput: string,
    allOutputs: string[] = [actualOutput],
  ): Promise<Metrics> {
    console.log("[EVALUATOR] Evaluating example...");

    // Calculate all metrics
    const [relevance, accuracy, readability] = await Promise.all([
      this.calculateRelevance(input, actualOutput),
      this.calculateAccuracy(input, expectedOutput, actualOutput),
      this.calculateReadability(actualOutput),
    ]);

    const consistency = this.calculateConsistency(allOutputs);
    const efficiency = this.calculateEfficiency(prompt, actualOutput);

    const metrics: Omit<Metrics, "aggregate_score"> = {
      relevance,
      accuracy,
      consistency,
      efficiency,
      readability,
    };

    const aggregate_score = this.calculateAggregateScore(metrics);

    return {
      ...metrics,
      aggregate_score,
    };
  }

  /**
   * Evaluate multiple examples and return average
   */
  async evaluateDataset(
    prompt: string,
    examples: Array<{
      input: string;
      expectedOutput: string;
      actualOutput: string;
    }>,
  ): Promise<{ metrics: Metrics; evaluations: ExampleEvaluation[] }> {
    console.log(`[EVALUATOR] Evaluating ${examples.length} examples...`);

    const evaluations: ExampleEvaluation[] = [];

    // Evaluate each example
    for (const example of examples) {
      const metrics = await this.evaluateExample(
        prompt,
        example.input,
        example.expectedOutput,
        example.actualOutput,
      );

      evaluations.push({
        input: example.input,
        output: example.actualOutput,
        metrics,
      });
    }

    // Calculate average metrics
    const avgMetrics: Metrics = {
      relevance: 0,
      accuracy: 0,
      consistency: 0,
      efficiency: 0,
      readability: 0,
      aggregate_score: 0,
    };

    for (const evaluation of evaluations) {
      avgMetrics.relevance += evaluation.metrics.relevance;
      avgMetrics.accuracy += evaluation.metrics.accuracy;
      avgMetrics.consistency += evaluation.metrics.consistency;
      avgMetrics.efficiency += evaluation.metrics.efficiency;
      avgMetrics.readability += evaluation.metrics.readability;
      avgMetrics.aggregate_score += evaluation.metrics.aggregate_score;
    }

    const count = evaluations.length;
    avgMetrics.relevance = Math.round((avgMetrics.relevance / count) * 10) / 10;
    avgMetrics.accuracy = Math.round((avgMetrics.accuracy / count) * 10) / 10;
    avgMetrics.consistency =
      Math.round((avgMetrics.consistency / count) * 10) / 10;
    avgMetrics.efficiency =
      Math.round((avgMetrics.efficiency / count) * 10) / 10;
    avgMetrics.readability =
      Math.round((avgMetrics.readability / count) * 10) / 10;
    avgMetrics.aggregate_score =
      Math.round((avgMetrics.aggregate_score / count) * 10) / 10;

    console.log("[EVALUATOR] Average metrics:", avgMetrics);

    return {
      metrics: avgMetrics,
      evaluations,
    };
  }
}

/**
 * Global evaluator instance
 */
export const evaluator = new Evaluator();

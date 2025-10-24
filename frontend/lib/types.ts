/**
 * TypeScript type definitions matching backend Pydantic models.
 */

// Enums
export enum Framework {
  RACE = "RACE",
  COSTAR = "COSTAR",
  APE = "APE",
  CREATE = "CREATE",
}

export enum Technique {
  COT = "cot",
  SELF_CONSISTENCY = "self_consistency",
  TOT = "tot",
  RSIP = "rsip",
  RAG = "rag",
  PROMPT_CHAINING = "prompt_chaining",
}

// LLM Parameters
export interface LLMParameters {
  temperature: number;
  top_p: number;
  max_tokens: number;
  model: string;
}

// Dataset Configuration
export interface DatasetConfig {
  dataset_id?: string;
  example_count: number;
  domain_hints?: string[];
  difficulty_levels: string[];
}

// Optimization Request
export interface OptimizeRequest {
  prompt: string;
  selected_framework?: Framework;
  techniques_enabled: Technique[];
  parameters: LLMParameters;
  dataset_config: DatasetConfig;
  iteration_count?: number; // 1-3 iterations
}

// Metrics
export interface Metrics {
  relevance: number;
  accuracy: number;
  consistency: number;
  efficiency: number;
  readability: number;
  aggregate: number;
}

// Example Breakdown
export interface ExampleBreakdown {
  example_id: string;
  input: string;
  output: string;
  expected_output?: string;
  metrics: Metrics;
  tokens_used: number;
  latency_ms: number;
}

// Iteration Result
export interface IterationResult {
  iteration: number;
  version_id: string;
  prompt: string;
  critique?: string;
  metrics: Metrics;
  breakdown: ExampleBreakdown[];
  techniques: Technique[];
  parameters: LLMParameters;
  tokens_used: number;
  duration_seconds: number;
  created_at: string;
}

// Optimization Complete
export interface OptimizationComplete {
  prompt_id: string;
  best_version: number;
  all_iterations: IterationResult[];
  improvement_percentage: number;
  total_duration_seconds: number;
  total_tokens_used: number;
}

// SSE Event Types (Discriminated Union) - Matches Backend
export type SSEEvent =
  | { type: "optimization_start"; data: { total_iterations: number } }
  | { type: "dataset_generated"; data: { example_count: number; domain: string } }
  | { type: "iteration_start"; data: { iteration: number; prompt: string } }
  | { type: "executing_tests"; data: { count: number; iteration: number } }
  | { type: "test_progress"; data: { current: number; total: number; iteration: number } }
  | { type: "applying_technique"; data: { technique: string; iteration: number } }
  | { type: "evaluating_metrics"; data: { iteration: number } }
  | { type: "metrics_calculated"; data: { metrics: Metrics; iteration: number } }
  | { type: "applying_rsip"; data: { iteration: number } }
  | { type: "prompt_improved"; data: { iteration: number; critique: string; improved_prompt: string } }
  | { type: "iteration_complete"; data: { iteration: number; prompt_version: string; metrics: Metrics; evaluation_details: any; techniques: string[]; duration_seconds: number } }
  | { type: "optimization_complete"; data: { best_version: { iteration: number; prompt: string; metrics: Metrics }; all_versions: Array<{ iteration: number; prompt: string; metrics: Metrics }>; total_time_seconds: number } }
  | { type: "error"; data: { message: string; details?: any } };

// Framework Info
export interface FrameworkInfo {
  name: string;
  description: string;
  sections: string[];
  use_cases: string[];
}

// Technique Info
export interface TechniqueInfo {
  name: string;
  description: string;
  full_description: string;
  requires: string[];
  incompatible_with: string[];
  parameters: Record<string, any>;
  performance: {
    improvement: string;
    best_for: string[];
    overhead: string;
  };
  use_cases: string[];
}


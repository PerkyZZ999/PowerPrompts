/**
 * Zod schemas for prompt optimization requests and responses
 */

import { z } from "zod";
import { appConfig } from "../../config.js";

/**
 * Framework enum
 */
export const FrameworkSchema = z.enum(["RACE", "COSTAR", "APE", "CREATE"]);

/**
 * Technique enum
 */
export const TechniqueSchema = z.enum([
  "cot",
  "self_consistency",
  "tot",
  "rsip",
  "rag",
  "prompt_chaining",
]);

/**
 * LLM Parameters schema
 */
export const LLMParametersSchema = z.object({
  temperature: z.number().min(0).max(2).default(0.7),
  top_p: z.number().min(0).max(1).default(1.0),
  max_tokens: z.number().int().min(1).max(128000).default(16000), // High default for modern models
  model: z.string().default(appConfig.defaultModel),
});

/**
 * Dataset configuration schema
 */
export const DatasetConfigSchema = z.object({
  example_count: z.number().int().min(5).max(50).default(15),
  difficulty_levels: z
    .array(z.enum(["easy", "medium", "hard"]))
    .default(["easy", "medium", "hard"]),
});

/**
 * Optimize request schema
 */
export const OptimizeRequestSchema = z.object({
  prompt: z.string().min(10).max(100000),
  selected_framework: FrameworkSchema,
  techniques_enabled: z.array(TechniqueSchema).default([]),
  parameters: LLMParametersSchema.default({}),
  dataset_config: DatasetConfigSchema.default({}),
  iteration_count: z.number().int().min(1).max(3).default(1), // Configurable iterations (1-3)
});

export type OptimizeRequest = z.infer<typeof OptimizeRequestSchema>;
export type Framework = z.infer<typeof FrameworkSchema>;
export type Technique = z.infer<typeof TechniqueSchema>;
export type LLMParameters = z.infer<typeof LLMParametersSchema>;
export type DatasetConfig = z.infer<typeof DatasetConfigSchema>;

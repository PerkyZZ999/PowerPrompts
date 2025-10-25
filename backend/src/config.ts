/**
 * Application configuration with type-safe environment variable loading
 */

import { config } from "dotenv";
import { z } from "zod";

// Load environment variables
config();

/**
 * Environment configuration schema
 */
const ConfigSchema = z.object({
  // LLM Provider Configuration
  llmProvider: z.enum(["openai", "openrouter"]).default("openai"),

  // OpenAI Configuration
  openaiApiKey: z.string().optional(),

  // OpenRouter Configuration
  openrouterApiKey: z.string().optional(),

  // OpenRouter Provider Routing (USD per 1M tokens)
  openrouterMaxPromptPrice: z.coerce.number().default(0.2), // $0.20 per 1M tokens (allows Google Vertex: $0.15)
  openrouterMaxCompletionPrice: z.coerce.number().default(1.0), // $1.00 per 1M tokens (allows Google Vertex: $0.60)

  // Server Configuration
  port: z.coerce.number().int().min(1000).max(65535).default(8000),
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),

  // Database Configuration
  databasePath: z.string().default("./data/powerprompts.db"),

  // API Authentication
  apiKey: z.string().min(1, "API_KEY is required"),

  // ChromaDB Configuration
  chromaPath: z.string().default("./data/chroma"),

  // Application Configuration
  appName: z.string().default("PowerPrompts"),
  appVersion: z.string().default("1.0.0"),

  // LLM Models Configuration
  availableModels: z.string().default(""),
  defaultModel: z.string().default("openai/gpt-4o"),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * LLM Model interface
 */
export interface LLMModel {
  id: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Parse and validate environment variables
 */
function loadConfig(): Config {
  try {
    const config = ConfigSchema.parse({
      llmProvider: process.env["LLM_PROVIDER"],
      openaiApiKey: process.env["OPENAI_API_KEY"],
      openrouterApiKey: process.env["OPENROUTER_API_KEY"],
      openrouterMaxPromptPrice: process.env["OPENROUTER_MAX_PROMPT_PRICE"],
      openrouterMaxCompletionPrice:
        process.env["OPENROUTER_MAX_COMPLETION_PRICE"],
      port: process.env["PORT"],
      nodeEnv: process.env["NODE_ENV"],
      databasePath: process.env["DATABASE_PATH"],
      apiKey: process.env["API_KEY"],
      chromaPath: process.env["CHROMA_PATH"],
      appName: process.env["APP_NAME"],
      appVersion: process.env["APP_VERSION"],
      availableModels: process.env["AVAILABLE_MODELS"],
      defaultModel: process.env["DEFAULT_MODEL"],
    });

    // Validate that the correct API key is set for the provider
    if (config.llmProvider === "openai" && !config.openaiApiKey) {
      throw new Error(
        'OPENAI_API_KEY is required when LLM_PROVIDER is set to "openai"',
      );
    }
    if (config.llmProvider === "openrouter" && !config.openrouterApiKey) {
      throw new Error(
        'OPENROUTER_API_KEY is required when LLM_PROVIDER is set to "openrouter"',
      );
    }

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[CONFIG ERROR] Invalid environment configuration:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    } else {
      console.error("[CONFIG ERROR]", error);
    }
    process.exit(1);
  }
}

/**
 * Generate display name from model ID
 * Handles both OpenAI (gpt-4o) and OpenRouter (openai/gpt-4o) formats
 */
function generateModelName(modelId: string): string {
  // Remove provider prefix for OpenRouter models (e.g., "openai/gpt-4o" -> "gpt-4o")
  const modelName = modelId.includes("/")
    ? modelId.split("/")[1] || modelId
    : modelId;

  // GPT-OSS (OpenRouter's optimized model)
  if (modelName.includes("gpt-oss-120b")) return "GPT-OSS-120B";

  // GPT-5
  if (modelName.includes("gpt-5")) return "GPT-5";

  // GPT-4 variants
  if (modelName === "gpt-4o") return "GPT-4o";
  if (modelName === "gpt-4o-mini") return "GPT-4o Mini";
  if (modelName.includes("gpt-4-turbo")) return "GPT-4 Turbo";
  if (modelName.includes("gpt-4")) return "GPT-4";

  // O1/O3 reasoning models
  if (modelName === "o1") return "O1";
  if (modelName === "o1-mini") return "O1 Mini";
  if (modelName === "o1-preview") return "O1 Preview";
  if (modelName === "o3-mini") return "O3 Mini";

  // Claude models
  if (modelName.includes("claude-3.5-sonnet")) return "Claude 3.5 Sonnet";
  if (modelName.includes("claude-3-opus")) return "Claude 3 Opus";
  if (modelName.includes("claude-3-sonnet")) return "Claude 3 Sonnet";
  if (modelName.includes("claude-3-haiku")) return "Claude 3 Haiku";
  if (modelName.includes("claude")) return "Claude";

  // Gemini models
  if (modelName.includes("gemini-pro-1.5")) return "Gemini Pro 1.5";
  if (modelName.includes("gemini-pro")) return "Gemini Pro";
  if (modelName.includes("gemini")) return "Gemini";

  // Llama models
  if (modelName.includes("llama-3.1-70b")) return "Llama 3.1 70B";
  if (modelName.includes("llama-3.1")) return "Llama 3.1";
  if (modelName.includes("llama")) return "Llama";

  // GPT-3.5
  if (modelName.includes("gpt-3.5-turbo")) return "GPT-3.5 Turbo";

  // Fallback: capitalize and format
  return modelName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Generate description from model ID
 */
function generateModelDescription(modelId: string): string {
  const modelName = modelId.includes("/")
    ? modelId.split("/")[1] || modelId
    : modelId;

  // GPT models
  if (modelName.includes("gpt-oss-120b"))
    return "Fast, open-source model with high throughput (Google Vertex: 547.8 TPS)";
  if (modelName.includes("gpt-5"))
    return "Most capable model for complex tasks";
  if (modelName === "gpt-4o") return "High-intelligence flagship model";
  if (modelName === "gpt-4o-mini")
    return "Affordable and intelligent small model";
  if (modelName.includes("gpt-4-turbo"))
    return "Previous high-intelligence model";
  if (modelName.includes("gpt-3.5")) return "Fast and efficient model";

  // Reasoning models
  if (modelName === "o1")
    return "Reasoning model designed to solve hard problems";
  if (modelName === "o1-mini") return "Faster and cheaper reasoning model";
  if (modelName === "o1-preview") return "Preview of O1 reasoning capabilities";
  if (modelName === "o3-mini") return "Advanced reasoning model";

  // Claude models
  if (modelName.includes("claude-3.5-sonnet"))
    return "Most intelligent Claude model";
  if (modelName.includes("claude-3-opus"))
    return "Powerful model for complex tasks";
  if (modelName.includes("claude-3-sonnet"))
    return "Balanced intelligence and speed";
  if (modelName.includes("claude-3-haiku")) return "Fast and compact model";
  if (modelName.includes("claude")) return "Anthropic language model";

  // Gemini models
  if (modelName.includes("gemini")) return "Google's multimodal AI model";

  // Llama models
  if (modelName.includes("llama")) return "Meta's open-source language model";

  return "AI language model";
}

/**
 * Determine category from model ID
 */
function generateModelCategory(modelId: string): string {
  const modelName = modelId.includes("/")
    ? modelId.split("/")[1] || modelId
    : modelId;

  if (modelName.includes("gpt-oss-120b")) return "Open-Source";
  if (modelName.includes("gpt-5")) return "Flagship";
  if (modelName.includes("gpt-4")) return "GPT-4";
  if (modelName.includes("o1") || modelName.includes("o3")) return "Reasoning";
  if (modelName.includes("gpt-3.5")) return "GPT-3.5";
  if (modelName.includes("claude")) return "Claude";
  if (modelName.includes("gemini")) return "Gemini";
  if (modelName.includes("llama")) return "Llama";

  return "General";
}

/**
 * Parse available models from environment variable
 * Format: Comma-separated model IDs (e.g., gpt-5-2025-08-07,gpt-4o,o1)
 */
export function parseAvailableModels(): LLMModel[] {
  const modelsString = appConfig.availableModels;

  if (!modelsString || modelsString.trim() === "") {
    // Return default models if not configured
    return [
      {
        id: "gpt-5-2025-08-07",
        name: "GPT-5",
        description: "Most capable model for complex tasks",
        category: "Flagship",
      },
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "High-intelligence flagship model",
        category: "GPT-4",
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Affordable and intelligent small model",
        category: "GPT-4",
      },
    ];
  }

  try {
    const modelIds = modelsString
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (modelIds.length === 0) {
      return parseAvailableModels(); // Fallback to defaults
    }

    const models: LLMModel[] = modelIds.map((id) => ({
      id,
      name: generateModelName(id),
      description: generateModelDescription(id),
      category: generateModelCategory(id),
    }));

    return models;
  } catch (error) {
    console.error("[CONFIG ERROR] Failed to parse AVAILABLE_MODELS:", error);
    return parseAvailableModels(); // Return defaults on error
  }
}

/**
 * Validated application configuration
 */
export const appConfig = loadConfig();

/**
 * Check if running in development mode
 */
export const isDevelopment = appConfig.nodeEnv === "development";

/**
 * Check if running in production mode
 */
export const isProduction = appConfig.nodeEnv === "production";

/**
 * Check if running in test mode
 */
export const isTest = appConfig.nodeEnv === "test";

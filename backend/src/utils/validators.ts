/**
 * Validation utilities for input validation
 */

/**
 * Validate prompt text
 */
export function validatePrompt(prompt: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if prompt is empty
  if (!prompt || prompt.trim().length === 0) {
    errors.push("Prompt cannot be empty");
  }

  // Check minimum length
  if (prompt.trim().length < 10) {
    errors.push("Prompt must be at least 10 characters long");
  }

  // Check maximum length (100k characters)
  if (prompt.length > 100000) {
    errors.push("Prompt cannot exceed 100,000 characters");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate LLM parameters
 */
export function validateLLMParameters(params: {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate temperature
  if (params.temperature !== undefined) {
    if (params.temperature < 0 || params.temperature > 2) {
      errors.push("Temperature must be between 0 and 2");
    }
  }

  // Validate top_p
  if (params.topP !== undefined) {
    if (params.topP < 0 || params.topP > 1) {
      errors.push("Top-P must be between 0 and 1");
    }
  }

  // Validate max_tokens
  if (params.maxTokens !== undefined) {
    if (params.maxTokens < 1 || params.maxTokens > 128000) {
      errors.push("Max tokens must be between 1 and 128,000");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check technique compatibility
 */
export function checkTechniqueCompatibility(techniques: string[]): {
  compatible: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Tree of Thoughts requires Chain-of-Thought
  if (techniques.includes("tot") && !techniques.includes("cot")) {
    warnings.push(
      "Tree of Thoughts (ToT) works best with Chain-of-Thought (CoT) enabled",
    );
  }

  // Self-Consistency works well with CoT
  if (techniques.includes("self_consistency") && !techniques.includes("cot")) {
    warnings.push(
      "Self-Consistency works best with Chain-of-Thought (CoT) enabled",
    );
  }

  // RAG + Prompt Chaining can be very token-heavy
  if (techniques.includes("rag") && techniques.includes("prompt_chaining")) {
    warnings.push(
      "Using RAG with Prompt Chaining may consume many tokens. Monitor your usage.",
    );
  }

  return {
    compatible: true, // All techniques can technically work together
    warnings,
  };
}

/**
 * Validate framework selection
 */
export function validateFramework(framework: string): {
  valid: boolean;
  error?: string;
} {
  const validFrameworks = ["RACE", "COSTAR", "APE", "CREATE"];

  if (!validFrameworks.includes(framework)) {
    return {
      valid: false,
      error: `Invalid framework. Must be one of: ${validFrameworks.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Validate dataset configuration
 */
export function validateDatasetConfig(config: {
  exampleCount?: number;
  difficultyLevels?: string[];
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate example count
  if (config.exampleCount !== undefined) {
    if (config.exampleCount < 5 || config.exampleCount > 50) {
      errors.push("Example count must be between 5 and 50");
    }
  }

  // Validate difficulty levels
  if (config.difficultyLevels) {
    const validLevels = ["easy", "medium", "hard"];
    const invalidLevels = config.difficultyLevels.filter(
      (level) => !validLevels.includes(level),
    );

    if (invalidLevels.length > 0) {
      errors.push(
        `Invalid difficulty levels: ${invalidLevels.join(", ")}. Must be one of: ${validLevels.join(", ")}`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

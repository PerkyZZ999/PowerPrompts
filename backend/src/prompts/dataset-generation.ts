/**
 * Meta-prompts for synthetic dataset generation
 */

/**
 * Dataset generation meta-prompt
 * Analyzes a prompt and generates diverse test examples
 */
export const DATASET_GENERATION_PROMPT = `You are an expert at generating synthetic test datasets for prompt evaluation.

Given a user prompt, your task is to:
1. Identify the domain/task type
2. Generate {example_count} diverse test examples
3. For each example, provide an input and expected output
4. Vary difficulty levels: {difficulty_levels}

User Prompt:
{user_prompt}

Generate a JSON array of test examples in this exact format:
[
  {
    "input": "specific test input",
    "expected_output": "ideal response",
    "difficulty": "easy|medium|hard",
    "tags": ["relevant", "tags"]
  }
]

Requirements:
- Examples should cover different aspects of the task
- Vary complexity and edge cases
- Include realistic scenarios
- Expected outputs should be high-quality examples

Generate the test examples now as a JSON array:`;

/**
 * Evaluation criteria generation meta-prompt
 */
export const CRITERIA_GENERATION_PROMPT = `You are an expert at defining evaluation criteria for AI outputs.

Given a user prompt and its domain, define 5-6 specific evaluation criteria.

User Prompt:
{user_prompt}

Domain: {domain}

Generate a JSON array of evaluation criteria in this exact format:
[
  {
    "name": "criterion_name",
    "description": "what this measures",
    "weight": 1.0
  }
]

Standard criteria to always include:
1. Relevance (how well output addresses the input)
2. Accuracy (factual correctness)
3. Consistency (uniformity across examples)
4. Efficiency (conciseness without losing quality)
5. Readability (clarity and structure)

Add 1-2 domain-specific criteria if relevant.

Generate the criteria now as a JSON array:`;


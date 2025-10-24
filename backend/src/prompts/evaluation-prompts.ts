/**
 * Meta-prompts for LLM-as-judge evaluation
 */

/**
 * Relevance evaluation prompt
 */
export const RELEVANCE_EVALUATION_PROMPT = `You are an expert evaluator. Rate how well the output addresses the input on a scale of 0-100.

Input: {input}

Output: {output}

Consider:
- Does the output directly address the input?
- Is it on-topic and focused?
- Does it answer what was asked?

Respond with ONLY a number between 0 and 100. No explanation.

Score:`;

/**
 * Accuracy evaluation prompt (with expected output)
 */
export const ACCURACY_EVALUATION_PROMPT = `You are an expert evaluator. Rate the factual accuracy of the output compared to the expected output on a scale of 0-100.

Input: {input}

Expected Output: {expected_output}

Actual Output: {actual_output}

Consider:
- Factual correctness
- Alignment with expected output
- No hallucinations or errors

Respond with ONLY a number between 0 and 100. No explanation.

Score:`;

/**
 * Readability evaluation prompt
 */
export const READABILITY_EVALUATION_PROMPT = `You are an expert evaluator. Rate the readability and clarity of this output on a scale of 0-100.

Output: {output}

Consider:
- Clear structure and organization
- Easy to understand
- Good grammar and formatting
- Appropriate tone and style

Respond with ONLY a number between 0 and 100. No explanation.

Score:`;


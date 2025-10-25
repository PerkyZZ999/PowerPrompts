/**
 * RSIP (Recursive Self-Improvement Prompting) meta-prompts
 */

/**
 * RSIP Critique prompt
 * Analyzes a prompt and identifies weaknesses
 */
export const RSIP_CRITIQUE_PROMPT = `You are an expert prompt engineer performing a critical analysis.

Analyze this prompt and identify 3-5 specific weaknesses or areas for improvement:

<prompt>
{prompt}
</prompt>

Current Metrics:
- Relevance: {relevance}/100
- Accuracy: {accuracy}/100
- Consistency: {consistency}/100
- Efficiency: {efficiency}/100
- Readability: {readability}/100

Focus on:
1. Clarity and specificity
2. Missing context or constraints
3. Ambiguous instructions
4. Potential for better structure
5. Opportunities for improvement

Provide a structured critique with specific, actionable points.

Critique:`;

/**
 * RSIP Improvement prompt
 * Generates an improved version based on critique
 */
export const RSIP_IMPROVEMENT_PROMPT = `You are an expert prompt engineer. Improve this prompt based on the critique while preserving its XML structure.

Original Prompt:
<prompt>
{prompt}
</prompt>

Critique:
{critique}

Instructions:
1. Address each point in the critique
2. PRESERVE the XML tag structure (do not change tag names)
3. Improve clarity, specificity, and effectiveness
4. Add missing context or constraints
5. Fix ambiguities and structural issues

Generate the improved prompt with the SAME XML structure:`;

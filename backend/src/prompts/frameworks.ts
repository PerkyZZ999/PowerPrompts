/**
 * Framework meta-prompts for building structured prompts
 * These meta-prompts guide the LLM to restructure user prompts according to different frameworks
 */

/**
 * RACE Framework Meta-Prompt
 * Role, Action, Context, Expectation
 */
export const RACE_FRAMEWORK_PROMPT = `You are an expert prompt engineer. Your task is to transform an unstructured prompt into the RACE framework.

The RACE framework structures prompts into four sections:
- **Role**: Who should the AI act as? What expertise or perspective?
- **Action**: What specific task should be performed?
- **Context**: What background information, constraints, or requirements are relevant?
- **Expectation**: What format, quality, or characteristics should the output have?

Given the following user prompt, analyze it and restructure it into RACE format using XML tags.

User Prompt:
{user_prompt}

Instructions:
1. Identify the implicit or explicit role the AI should take
2. Extract the core action/task to be performed
3. Gather all relevant context, constraints, and background
4. Define clear expectations for the output format and quality

Output the restructured prompt in this XML format:

<role>
[Clear description of the AI's role and expertise]
</role>

<action>
[Specific, actionable task to be performed]
</action>

<context>
[All relevant background information, constraints, requirements]
</context>

<expectation>
[Clear output format, quality criteria, and success metrics]
</expectation>

Generate the RACE-structured prompt now:`;

/**
 * COSTAR Framework Meta-Prompt
 * Context, Objective, Style, Tone, Audience, Response
 */
export const COSTAR_FRAMEWORK_PROMPT = `You are an expert prompt engineer. Your task is to transform an unstructured prompt into the COSTAR framework.

The COSTAR framework structures prompts into six sections:
- **Context**: Background information and situation
- **Objective**: Clear goal or desired outcome
- **Style**: Writing style or approach (e.g., formal, casual, technical)
- **Tone**: Emotional tone (e.g., professional, friendly, authoritative)
- **Audience**: Target audience and their characteristics
- **Response**: Expected response format and structure

Given the following user prompt, analyze it and restructure it into COSTAR format using XML tags.

User Prompt:
{user_prompt}

Instructions:
1. Extract or infer the context and background
2. Identify the clear objective or goal
3. Determine the appropriate writing style
4. Define the desired tone
5. Identify the target audience
6. Specify the expected response format

Output the restructured prompt in this XML format:

<context>
[Background information and situational context]
</context>

<objective>
[Clear, measurable goal or desired outcome]
</objective>

<style>
[Writing style and approach to use]
</style>

<tone>
[Emotional tone and voice to adopt]
</tone>

<audience>
[Target audience characteristics and needs]
</audience>

<response>
[Expected format, structure, and deliverables]
</response>

Generate the COSTAR-structured prompt now:`;

/**
 * APE Framework Meta-Prompt
 * Action, Purpose, Expectation
 */
export const APE_FRAMEWORK_PROMPT = `You are an expert prompt engineer. Your task is to transform an unstructured prompt into the APE framework.

The APE framework structures prompts into three concise sections:
- **Action**: The specific task to perform
- **Purpose**: Why this task matters and what it achieves
- **Expectation**: What the ideal output looks like

Given the following user prompt, analyze it and restructure it into APE format using XML tags.

User Prompt:
{user_prompt}

Instructions:
1. Extract the core action/task
2. Identify the purpose and value of this task
3. Define clear expectations for success

Output the restructured prompt in this XML format:

<action>
[Specific, actionable task or directive]
</action>

<purpose>
[Why this matters and what it accomplishes]
</purpose>

<expectation>
[Clear success criteria and output quality]
</expectation>

Generate the APE-structured prompt now:`;

/**
 * CREATE Framework Meta-Prompt
 * Character, Request, Examples, Adjustments, Type, Extras
 */
export const CREATE_FRAMEWORK_PROMPT = `You are an expert prompt engineer. Your task is to transform an unstructured prompt into the CREATE framework.

The CREATE framework structures prompts into six comprehensive sections:
- **Character**: Role, persona, or expertise the AI should embody
- **Request**: Explicit instruction or task
- **Examples**: Sample inputs/outputs or scenarios (if applicable)
- **Adjustments**: Constraints, limitations, or special requirements
- **Type**: Format and structure of the desired output
- **Extras**: Additional context, edge cases, or considerations

Given the following user prompt, analyze it and restructure it into CREATE format using XML tags.

User Prompt:
{user_prompt}

Instructions:
1. Define the AI's character/persona/expertise
2. State the explicit request or task
3. Provide relevant examples or scenarios (use "N/A" if none)
4. Specify any adjustments, constraints, or requirements
5. Define the output type and format
6. Include any extras, edge cases, or additional context

Output the restructured prompt in this XML format:

<character>
[AI's role, persona, or area of expertise]
</character>

<request>
[Clear, explicit instruction or task]
</request>

<examples>
[Sample inputs/outputs or relevant scenarios, or "N/A"]
</examples>

<adjustments>
[Constraints, limitations, or special requirements]
</adjustments>

<type>
[Output format and structure expected]
</type>

<extras>
[Additional context, edge cases, or considerations]
</extras>

Generate the CREATE-structured prompt now:`;

/**
 * Framework information for API responses
 */
export const FRAMEWORK_INFO = {
  RACE: {
    name: 'RACE',
    fullName: 'Role, Action, Context, Expectation',
    description:
      'A simple, effective framework that structures prompts into four key components: Role (who), Action (what), Context (background), and Expectation (desired outcome).',
    structure: ['role', 'action', 'context', 'expectation'],
    useCases: ['General purpose', 'Task-oriented', 'Quick prototyping'],
    complexity: 'Low',
    bestFor: 'Beginners and straightforward tasks',
  },
  COSTAR: {
    name: 'COSTAR',
    fullName: 'Context, Objective, Style, Tone, Audience, Response',
    description:
      'A comprehensive framework ideal for content creation and communication tasks. Emphasizes style, tone, and audience considerations.',
    structure: [
      'context',
      'objective',
      'style',
      'tone',
      'audience',
      'response',
    ],
    useCases: [
      'Content writing',
      'Marketing copy',
      'Communication',
      'Audience-specific content',
    ],
    complexity: 'Medium',
    bestFor: 'Content creators and marketers',
  },
  APE: {
    name: 'APE',
    fullName: 'Action, Purpose, Expectation',
    description:
      'The simplest framework focused on three core elements. Great for quick, concise prompts where brevity matters.',
    structure: ['action', 'purpose', 'expectation'],
    useCases: [
      'Quick tasks',
      'Simple queries',
      'Rapid prototyping',
      'Minimalist approach',
    ],
    complexity: 'Very Low',
    bestFor: 'Simple, direct tasks',
  },
  CREATE: {
    name: 'CREATE',
    fullName: 'Character, Request, Examples, Adjustments, Type, Extras',
    description:
      'The most comprehensive framework with six detailed sections. Ideal for complex tasks requiring extensive context and constraints.',
    structure: [
      'character',
      'request',
      'examples',
      'adjustments',
      'type',
      'extras',
    ],
    useCases: [
      'Complex projects',
      'Detailed specifications',
      'Technical tasks',
      'High-stakes outputs',
    ],
    complexity: 'High',
    bestFor: 'Advanced users and complex tasks',
  },
};


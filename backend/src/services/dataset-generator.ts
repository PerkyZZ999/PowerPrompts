/**
 * Dataset Generator Service
 * Generates synthetic test datasets for prompt evaluation
 */

import { llmClient } from '../core/llm-client.js';
import {
  DATASET_GENERATION_PROMPT,
  CRITERIA_GENERATION_PROMPT,
} from '../prompts/dataset-generation.js';
import { createDataset, createExample } from '../db/crud.js';

/**
 * Example interface
 */
export interface Example {
  input: string;
  expected_output: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

/**
 * Evaluation criterion interface
 */
export interface Criterion {
  name: string;
  description: string;
  weight: number;
}

/**
 * Dataset result interface
 */
export interface DatasetResult {
  id: string;
  domain: string;
  examples: Example[];
  criteria: Criterion[];
}

/**
 * Dataset Generator class
 */
export class DatasetGenerator {
  /**
   * Identify the domain/task type from a prompt
   */
  private async identifyDomain(prompt: string): Promise<string> {
    const domainPrompt = `Analyze this prompt and identify its domain/task type in 2-3 words (e.g., "code generation", "content writing", "data analysis"):

Prompt: ${prompt}

Domain:`;

    const domain = await llmClient.complete(domainPrompt, {
      temperature: 0.3,
      maxTokens: 4000, // High limit for reasoning models (GPT-5: 128K available)
    });

    return domain.trim();
  }

  /**
   * Generate test examples
   */
  private async generateExamples(
    prompt: string,
    exampleCount: number,
    difficultyLevels: string[]
  ): Promise<Example[]> {
    const metaPrompt = DATASET_GENERATION_PROMPT.replace(
      '{user_prompt}',
      prompt
    )
      .replace('{example_count}', exampleCount.toString())
      .replace('{difficulty_levels}', difficultyLevels.join(', '));

    const response = await llmClient.complete(metaPrompt, {
      temperature: 0.8,
      maxTokens: 32000, // Very high for complex dataset generation
    });

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const examples: Example[] = JSON.parse(jsonMatch[0]);

      // Validate examples
      if (!Array.isArray(examples) || examples.length === 0) {
        throw new Error('Invalid examples format');
      }

      return examples;
    } catch (error) {
      console.error('[DATASET GENERATOR] Failed to parse examples:', error);
      // Return fallback examples
      return this.getFallbackExamples(prompt, exampleCount);
    }
  }

  /**
   * Generate evaluation criteria
   */
  private async generateCriteria(
    prompt: string,
    domain: string
  ): Promise<Criterion[]> {
    const metaPrompt = CRITERIA_GENERATION_PROMPT.replace(
      '{user_prompt}',
      prompt
    ).replace('{domain}', domain);

    const response = await llmClient.complete(metaPrompt, {
      temperature: 0.5,
      maxTokens: 16000, // High limit for criteria generation
    });

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const criteria: Criterion[] = JSON.parse(jsonMatch[0]);

      // Validate criteria
      if (!Array.isArray(criteria) || criteria.length === 0) {
        throw new Error('Invalid criteria format');
      }

      return criteria;
    } catch (error) {
      console.error('[DATASET GENERATOR] Failed to parse criteria:', error);
      // Return default criteria
      return this.getDefaultCriteria();
    }
  }

  /**
   * Generate complete dataset
   */
  async generate(
    promptId: string,
    userPrompt: string,
    config: {
      exampleCount: number;
      difficultyLevels: string[];
    }
  ): Promise<DatasetResult> {
    console.log(`[DATASET GENERATOR] Generating dataset for prompt ${promptId}...`);

    // Identify domain
    const domain = await this.identifyDomain(userPrompt);
    console.log(`[DATASET GENERATOR] Domain identified: ${domain}`);

    // Generate examples
    const examples = await this.generateExamples(
      userPrompt,
      config.exampleCount,
      config.difficultyLevels
    );
    console.log(`[DATASET GENERATOR] Generated ${examples.length} examples`);

    // Generate criteria
    const criteria = await this.generateCriteria(userPrompt, domain);
    console.log(`[DATASET GENERATOR] Generated ${criteria.length} criteria`);

    // Store in database
    const datasetId = await createDataset({
      promptId,
      domain,
      exampleCount: examples.length,
      difficultyLevels: config.difficultyLevels,
      criteria,
    });

    // Store examples
    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      if (!example) continue; // Skip undefined examples
      
      await createExample({
        datasetId,
        inputText: example.input || 'No input provided',
        expectedOutput: example.expected_output || 'No expected output provided',
        difficulty: example.difficulty || 'medium',
        metadata: { tags: example.tags || [] },
      });
    }

    console.log(`[DATASET GENERATOR] Dataset ${datasetId} created successfully`);

    return {
      id: datasetId,
      domain,
      examples,
      criteria,
    };
  }

  /**
   * Get fallback examples if generation fails
   */
  private getFallbackExamples(
    prompt: string,
    count: number
  ): Example[] {
    const examples: Example[] = [];
    const difficulties: Array<'easy' | 'medium' | 'hard'> = [
      'easy',
      'medium',
      'hard',
    ];

    for (let i = 0; i < count; i++) {
      examples.push({
        input: `Test case ${i + 1} for: ${prompt.substring(0, 50)}...`,
        expected_output: 'Expected output for this test case',
        difficulty: difficulties[i % 3] || 'medium',
        tags: ['fallback'],
      });
    }

    return examples;
  }

  /**
   * Get default evaluation criteria
   */
  private getDefaultCriteria(): Criterion[] {
    return [
      {
        name: 'relevance',
        description: 'How well the output addresses the input',
        weight: 1.0,
      },
      {
        name: 'accuracy',
        description: 'Factual correctness of the output',
        weight: 1.2,
      },
      {
        name: 'consistency',
        description: 'Uniformity and coherence across outputs',
        weight: 0.8,
      },
      {
        name: 'efficiency',
        description: 'Conciseness without sacrificing quality',
        weight: 0.9,
      },
      {
        name: 'readability',
        description: 'Clarity and structure of the output',
        weight: 1.0,
      },
    ];
  }
}

/**
 * Global dataset generator instance
 */
export const datasetGenerator = new DatasetGenerator();


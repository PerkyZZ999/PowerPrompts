/**
 * Framework Builder Service
 * Transforms unstructured prompts into framework-specific structured prompts
 */

import { llmClient } from '../core/llm-client.js';
import {
  RACE_FRAMEWORK_PROMPT,
  COSTAR_FRAMEWORK_PROMPT,
  APE_FRAMEWORK_PROMPT,
  CREATE_FRAMEWORK_PROMPT,
} from '../prompts/frameworks.js';
import { cleanXml, validateXml } from '../utils/delimiters.js';

/**
 * Framework Builder class
 */
export class FrameworkBuilder {
  /**
   * Build prompt using RACE framework
   */
  async buildRace(userPrompt: string): Promise<string> {
    const metaPrompt = RACE_FRAMEWORK_PROMPT.replace(
      '{user_prompt}',
      userPrompt
    );

    const structuredPrompt = await llmClient.complete(metaPrompt, {
      temperature: 0.7,
      maxTokens: 32000, // High limit for framework generation
    });

    // Validate XML structure (lenient - only warns on actual errors)
    const validation = validateXml(structuredPrompt);
    if (!validation.valid) {
      console.warn(
        '[FRAMEWORK BUILDER] XML validation warning in RACE output (auto-fixing):',
        validation.errors
      );
    }

    return cleanXml(structuredPrompt);
  }

  /**
   * Build prompt using COSTAR framework
   */
  async buildCostar(userPrompt: string): Promise<string> {
    const metaPrompt = COSTAR_FRAMEWORK_PROMPT.replace(
      '{user_prompt}',
      userPrompt
    );

    const structuredPrompt = await llmClient.complete(metaPrompt, {
      temperature: 0.7,
      maxTokens: 32000, // High limit for framework generation
    });

    const validation = validateXml(structuredPrompt);
    if (!validation.valid) {
      console.warn(
        '[FRAMEWORK BUILDER] XML validation warning in COSTAR output (auto-fixing):',
        validation.errors
      );
    }

    return cleanXml(structuredPrompt);
  }

  /**
   * Build prompt using APE framework
   */
  async buildApe(userPrompt: string): Promise<string> {
    const metaPrompt = APE_FRAMEWORK_PROMPT.replace(
      '{user_prompt}',
      userPrompt
    );

    const structuredPrompt = await llmClient.complete(metaPrompt, {
      temperature: 0.7,
      maxTokens: 32000, // High limit for framework generation
    });

    const validation = validateXml(structuredPrompt);
    if (!validation.valid) {
      console.warn(
        '[FRAMEWORK BUILDER] XML validation warning in APE output (auto-fixing):',
        validation.errors
      );
    }

    return cleanXml(structuredPrompt);
  }

  /**
   * Build prompt using CREATE framework
   */
  async buildCreate(userPrompt: string): Promise<string> {
    const metaPrompt = CREATE_FRAMEWORK_PROMPT.replace(
      '{user_prompt}',
      userPrompt
    );

    const structuredPrompt = await llmClient.complete(metaPrompt, {
      temperature: 0.7,
      maxTokens: 32000, // High limit for framework generation
    });

    const validation = validateXml(structuredPrompt);
    if (!validation.valid) {
      console.warn(
        '[FRAMEWORK BUILDER] XML validation warning in CREATE output (auto-fixing):',
        validation.errors
      );
    }

    return cleanXml(structuredPrompt);
  }

  /**
   * Build prompt using specified framework
   */
  async build(
    userPrompt: string,
    framework: 'RACE' | 'COSTAR' | 'APE' | 'CREATE'
  ): Promise<string> {
    console.log(`[FRAMEWORK BUILDER] Building ${framework} prompt...`);

    switch (framework) {
      case 'RACE':
        return await this.buildRace(userPrompt);
      case 'COSTAR':
        return await this.buildCostar(userPrompt);
      case 'APE':
        return await this.buildApe(userPrompt);
      case 'CREATE':
        return await this.buildCreate(userPrompt);
      default:
        throw new Error(`Unsupported framework: ${framework}`);
    }
  }
}

/**
 * Global framework builder instance
 */
export const frameworkBuilder = new FrameworkBuilder();


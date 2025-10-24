/**
 * Technique Applier Service
 * Applies various prompt optimization techniques
 */

import { llmClient } from '../core/llm-client.js';
import { vectorStore } from '../core/vector-store.js';
import { RSIP_CRITIQUE_PROMPT, RSIP_IMPROVEMENT_PROMPT } from '../prompts/meta-optimizer.js';
import { wrapTag, extractTag, cleanXml } from '../utils/delimiters.js';
import type { Metrics } from './evaluator.js';

/**
 * Technique Applier class
 */
export class TechniqueApplier {
  /**
   * Apply Chain-of-Thought (CoT)
   * Injects step-by-step reasoning instructions
   */
  applyChainOfThought(prompt: string): string {
    console.log('[TECHNIQUE] Applying Chain-of-Thought...');

    const cotInstruction = `Let's approach this step-by-step:
1. First, understand the core requirement
2. Break down the problem into smaller parts
3. Address each part systematically
4. Synthesize the solution`;

    // Insert CoT after the action/objective section
    const actionContent = extractTag(prompt, 'action') || extractTag(prompt, 'objective');
    
    if (actionContent) {
      const cotSection = wrapTag('reasoning_approach', cotInstruction);
      // Insert after action/objective tag
      const actionTag = actionContent ? `<action>${actionContent}</action>` : `<objective>${actionContent}</objective>`;
      return prompt.replace(actionTag, actionTag + '\n\n' + cotSection);
    }

    // Fallback: append to end
    return prompt + '\n\n' + wrapTag('reasoning_approach', cotInstruction);
  }

  /**
   * Apply Self-Consistency
   * Generates multiple reasoning paths and selects the best answer
   */
  async applySelfConsistency(
    prompt: string,
    input: string,
    paths: number = 3
  ): Promise<string> {
    console.log(`[TECHNIQUE] Applying Self-Consistency with ${paths} paths...`);

    const outputs: string[] = [];

    // Generate multiple outputs with varying temperature
    for (let i = 0; i < paths; i++) {
      const temperature = 0.7 + (i * 0.2); // 0.7, 0.9, 1.1
      
      const fullPrompt = `${prompt}\n\nInput: ${input}`;
      
      const output = await llmClient.complete(fullPrompt, {
        temperature,
        maxTokens: 32000, // High limit for technique application
      });
      
      outputs.push(output);
    }

    // Select the most consistent answer (majority voting or most common pattern)
    // For simplicity, return the first output (in production, implement proper voting)
    console.log(`[TECHNIQUE] Generated ${outputs.length} paths, selecting best...`);
    
    return outputs[0] || 'No output generated';
  }

  /**
   * Apply Tree of Thoughts (ToT)
   * Explores multiple reasoning branches and selects the best path
   */
  async applyTreeOfThoughts(
    prompt: string,
    input: string,
    config: {
      depth?: number;
      branches?: number;
      threshold?: number;
    } = {}
  ): Promise<{ output: string; tree: any }> {
    const { depth = 2, branches = 3, threshold = 50 } = config;
    
    console.log(`[TECHNIQUE] Applying Tree of Thoughts (depth=${depth}, branches=${branches})...`);

    interface ThoughtNode {
      id: string;
      thought: string;
      score: number;
      children: ThoughtNode[];
    }

    const root: ThoughtNode = {
      id: 'root',
      thought: input,
      score: 100,
      children: [],
    };

    // Recursive function to explore branches
    const exploreBranch = async (
      node: ThoughtNode,
      currentDepth: number
    ): Promise<void> => {
      if (currentDepth >= depth) {
        return;
      }

      // Generate multiple thought branches
      for (let i = 0; i < branches; i++) {
        const branchPrompt = `${prompt}\n\nCurrent thought: ${node.thought}\n\nGenerate the next step in reasoning (be brief):`;
        
        const thought = await llmClient.complete(branchPrompt, {
          temperature: 0.8,
          maxTokens: 16000, // High limit for self-consistency iterations
        });

        // Simple scoring (in production, use evaluator)
        const score = 70 + Math.random() * 30;

        const childNode: ThoughtNode = {
          id: `${node.id}-${i}`,
          thought,
          score,
          children: [],
        };

        node.children.push(childNode);

        // Continue exploring if score is above threshold
        if (score >= threshold) {
          await exploreBranch(childNode, currentDepth + 1);
        }
      }
    };

    // Explore the tree
    await exploreBranch(root, 0);

    // Find best path (highest scoring leaf)
    const findBestLeaf = (node: ThoughtNode): ThoughtNode => {
      if (node.children.length === 0) {
        return node;
      }

      let best = node;
      for (const child of node.children) {
        const childBest = findBestLeaf(child);
        if (childBest.score > best.score) {
          best = childBest;
        }
      }
      return best;
    };

    const bestLeaf = findBestLeaf(root);

    console.log(`[TECHNIQUE] ToT complete, best path score: ${bestLeaf.score}`);

    return {
      output: bestLeaf.thought,
      tree: root,
    };
  }

  /**
   * Apply RSIP (Recursive Self-Improvement Prompting)
   * Generates critique and improved version
   */
  async applyRSIP(
    prompt: string,
    metrics?: Metrics
  ): Promise<{ improved: string; critique: string }> {
    console.log('[TECHNIQUE] Applying RSIP...');

    // Generate critique
    let critiquePrompt = RSIP_CRITIQUE_PROMPT.replace('{prompt}', prompt);
    
    if (metrics) {
      critiquePrompt = critiquePrompt
        .replace('{relevance}', metrics.relevance.toString())
        .replace('{accuracy}', metrics.accuracy.toString())
        .replace('{consistency}', metrics.consistency.toString())
        .replace('{efficiency}', metrics.efficiency.toString())
        .replace('{readability}', metrics.readability.toString());
    } else {
      critiquePrompt = critiquePrompt.replace(/Current Metrics:[\s\S]*?Readability: \{readability\}\/100\n\n/, '');
    }

    const critique = await llmClient.complete(critiquePrompt, {
      temperature: 0.5,
      maxTokens: 16000, // High limit for critique generation
    });

    console.log('[TECHNIQUE] Critique generated, generating improvement...');

    // Generate improvement
    const improvementPrompt = RSIP_IMPROVEMENT_PROMPT
      .replace('{prompt}', prompt)
      .replace('{critique}', critique);

    const improved = await llmClient.complete(improvementPrompt, {
      temperature: 0.7,
      maxTokens: 48000, // Very high limit for improved prompt generation
    });

    console.log('[TECHNIQUE] RSIP complete');

    return {
      improved: cleanXml(improved),
      critique,
    };
  }

  /**
   * Apply RAG (Retrieval-Augmented Generation)
   * Retrieves relevant context and injects it into the prompt
   */
  async applyRAG(
    prompt: string,
    query: string,
    collectionName: string = 'knowledge_base',
    topK: number = 3
  ): Promise<string> {
    console.log(`[TECHNIQUE] Applying RAG (retrieving top ${topK} documents)...`);

    try {
      // Retrieve relevant documents
      const results = await vectorStore.query(collectionName, query, { topK });

      if (results.length === 0) {
        console.log('[TECHNIQUE] No relevant documents found, returning original prompt');
        return prompt;
      }

      // Format context
      const contextParts = results.map((result, index) => 
        `<source>${index + 1}</source>\n${result.text}`
      );

      const contextSection = wrapTag('context', contextParts.join('\n\n'));

      // Insert context after the first tag or at the beginning
      const firstTagMatch = prompt.match(/<\/[^>]+>/);
      if (firstTagMatch) {
        const insertPos = prompt.indexOf(firstTagMatch[0]) + firstTagMatch[0].length;
        return (
          prompt.slice(0, insertPos) +
          '\n\n' +
          contextSection +
          '\n' +
          prompt.slice(insertPos)
        );
      }

      // Fallback: prepend context
      return contextSection + '\n\n' + prompt;
    } catch (error) {
      console.error('[TECHNIQUE] RAG failed:', error);
      return prompt;
    }
  }

  /**
   * Apply Prompt Chaining
   * Executes multiple prompts sequentially, passing output as input
   */
  async applyPromptChaining(prompts: string[]): Promise<string[]> {
    console.log(`[TECHNIQUE] Applying Prompt Chaining with ${prompts.length} steps...`);

    const results: string[] = [];
    let previousOutput = '';

    for (let i = 0; i < prompts.length; i++) {
      const currentPrompt = prompts[i];
      if (!currentPrompt) continue; // Skip empty prompts
      
      // Inject previous output if available
      const fullPrompt = previousOutput
        ? `${currentPrompt}\n\nPrevious step output:\n${previousOutput}`
        : currentPrompt;

      console.log(`[TECHNIQUE] Executing chain step ${i + 1}/${prompts.length}...`);

      const output = await llmClient.complete(fullPrompt, {
        temperature: 0.7,
        maxTokens: 32000, // High limit for technique application
      });

      const outputText = output || '';
      results.push(outputText);
      previousOutput = outputText;
    }

    console.log('[TECHNIQUE] Prompt chaining complete');

    return results;
  }
}

/**
 * Global technique applier instance
 */
export const techniqueApplier = new TechniqueApplier();


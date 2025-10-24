/**
 * Techniques API routes
 */

import { FastifyInstance } from 'fastify';

/**
 * Technique information
 */
const TECHNIQUES_INFO = {
  cot: {
    id: 'cot',
    name: 'Chain-of-Thought',
    description: 'Breaks down complex reasoning into step-by-step logical progressions',
    enabled: true,
    compatible_with: ['self_consistency', 'tot', 'rsip'],
    performance_impact: 'Low',
  },
  self_consistency: {
    id: 'self_consistency',
    name: 'Self-Consistency',
    description: 'Generates multiple reasoning paths and selects the most consistent answer',
    enabled: true,
    compatible_with: ['cot', 'rsip'],
    performance_impact: 'High',
  },
  tot: {
    id: 'tot',
    name: 'Tree of Thoughts',
    description: 'Explores multiple reasoning branches in a tree structure',
    enabled: true,
    compatible_with: ['cot', 'rsip'],
    performance_impact: 'Very High',
  },
  rsip: {
    id: 'rsip',
    name: 'Recursive Self-Improvement',
    description: 'Iteratively critiques and improves the prompt based on metrics',
    enabled: true,
    compatible_with: ['cot', 'self_consistency', 'tot', 'rag', 'prompt_chaining'],
    performance_impact: 'Medium',
  },
  rag: {
    id: 'rag',
    name: 'Retrieval-Augmented Generation',
    description: 'Retrieves relevant context from a knowledge base',
    enabled: true,
    compatible_with: ['rsip', 'prompt_chaining'],
    performance_impact: 'Medium',
  },
  prompt_chaining: {
    id: 'prompt_chaining',
    name: 'Prompt Chaining',
    description: 'Executes multiple prompts sequentially, passing outputs as inputs',
    enabled: true,
    compatible_with: ['rag', 'rsip'],
    performance_impact: 'High',
  },
};

/**
 * Register techniques routes
 */
export async function techniquesRoutes(server: FastifyInstance) {
  /**
   * GET /api/techniques
   * Get all available techniques with metadata
   */
  server.get('/api/techniques', async () => {
    return {
      techniques: Object.values(TECHNIQUES_INFO),
      compatibility_matrix: {
        cot: ['self_consistency', 'tot', 'rsip'],
        self_consistency: ['cot', 'rsip'],
        tot: ['cot', 'rsip'],
        rsip: ['cot', 'self_consistency', 'tot', 'rag', 'prompt_chaining'],
        rag: ['rsip', 'prompt_chaining'],
        prompt_chaining: ['rag', 'rsip'],
      },
    };
  });
}


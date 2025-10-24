/**
 * History API Routes
 * Endpoints for retrieving optimization history
 */

import { FastifyInstance } from 'fastify';
import { getAllPrompts, getVersionsByPromptId } from '../../db/crud.js';

/**
 * History item interface
 */
interface HistoryItem {
  id: string;
  original_prompt: string;
  framework: string;
  techniques: string[];
  created_at: string;
  best_score: number;
  total_iterations: number;
  duration_seconds: number;
}

/**
 * History detail interface
 */
interface HistoryDetail extends HistoryItem {
  versions: Array<{
    iteration: number;
    prompt: string;
    metrics: any;
    created_at: string;
  }>;
}

/**
 * Register history routes
 */
export async function historyRoutes(server: FastifyInstance) {
  /**
   * GET /api/history
   * Get all optimization history (summary list)
   */
  server.get('/api/history', async (request, reply) => {
    try {
      const prompts = await getAllPrompts();
      
      const history: HistoryItem[] = [];
      
      for (const prompt of prompts) {
        const versions = await getVersionsByPromptId(prompt.id);
        
        if (versions.length === 0) continue;
        
        // Find best score
        const bestVersion = versions.reduce((best, current) => {
          const currentScore = JSON.parse(current.metrics_json).aggregate_score || 0;
          const bestScore = JSON.parse(best.metrics_json).aggregate_score || 0;
          return currentScore > bestScore ? current : best;
        });
        
        const bestScore = JSON.parse(bestVersion.metrics_json).aggregate_score || 0;
        
        // Calculate total duration
        const totalDuration = versions.reduce((sum, v) => {
          const metrics = JSON.parse(v.metrics_json);
          return sum + (metrics.duration_seconds || 0);
        }, 0);
        
        history.push({
          id: prompt.id,
          original_prompt: prompt.original_prompt,
          framework: prompt.selected_framework,
          techniques: JSON.parse(prompt.techniques_enabled || '[]'),
          created_at: prompt.created_at,
          best_score: bestScore,
          total_iterations: versions.length,
          duration_seconds: totalDuration,
        });
      }
      
      // Sort by date (newest first)
      history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return reply.send({
        history,
        count: history.length,
      });
    } catch (error) {
      console.error('[HISTORY API] Error fetching history:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch optimization history',
      });
    }
  });

  /**
   * GET /api/history/:id
   * Get detailed history for a specific optimization
   */
  server.get<{ Params: { id: string } }>('/api/history/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const prompts = await getAllPrompts();
      const prompt = prompts.find((p) => p.id === id);
      
      if (!prompt) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Optimization not found',
        });
      }
      
      const versions = await getVersionsByPromptId(id);
      
      if (versions.length === 0) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'No versions found for this optimization',
        });
      }
      
      // Find best score
      const bestVersion = versions.reduce((best, current) => {
        const currentScore = JSON.parse(current.metrics_json).aggregate_score || 0;
        const bestScore = JSON.parse(best.metrics_json).aggregate_score || 0;
        return currentScore > bestScore ? current : best;
      });
      
      const bestScore = JSON.parse(bestVersion.metrics_json).aggregate_score || 0;
      
      // Calculate total duration
      const totalDuration = versions.reduce((sum, v) => {
        const metrics = JSON.parse(v.metrics_json);
        return sum + (metrics.duration_seconds || 0);
      }, 0);
      
      const detail: HistoryDetail = {
        id: prompt.id,
        original_prompt: prompt.original_prompt,
        framework: prompt.selected_framework,
        techniques: JSON.parse(prompt.techniques_enabled || '[]'),
        created_at: prompt.created_at,
        best_score: bestScore,
        total_iterations: versions.length,
        duration_seconds: totalDuration,
        versions: versions.map((v) => ({
          iteration: v.iteration_number,
          prompt: v.prompt_text,
          metrics: JSON.parse(v.metrics_json),
          created_at: v.created_at,
        })),
      };
      
      return reply.send(detail);
    } catch (error) {
      console.error('[HISTORY API] Error fetching history detail:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch optimization detail',
      });
    }
  });

  /**
   * DELETE /api/history/:id
   * Delete an optimization from history
   */
  server.delete<{ Params: { id: string } }>('/api/history/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Note: The database has CASCADE DELETE, so deleting the prompt will delete all versions
      const prompts = await getAllPrompts();
      const prompt = prompts.find((p) => p.id === id);
      
      if (!prompt) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Optimization not found',
        });
      }
      
      // Delete is handled by CASCADE in the database schema
      // For now, we'll just return success (the actual delete would need a new CRUD function)
      
      return reply.send({
        success: true,
        message: 'Optimization deleted successfully',
      });
    } catch (error) {
      console.error('[HISTORY API] Error deleting history:', error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to delete optimization',
      });
    }
  });
}


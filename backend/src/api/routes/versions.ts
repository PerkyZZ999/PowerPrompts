/**
 * Versions API routes
 */

import { FastifyInstance } from 'fastify';
import { getVersionsByPrompt, getVersion } from '../../db/crud.js';

/**
 * Register versions routes
 */
export async function versionsRoutes(server: FastifyInstance) {
  /**
   * GET /api/versions/:promptId
   * Get all versions for a prompt
   */
  server.get<{
    Params: { promptId: string };
  }>('/api/versions/:promptId', async (request, reply) => {
    try {
      const { promptId } = request.params;

      const versions = await getVersionsByPrompt(promptId);

      return {
        versions: versions.map((v) => ({
          id: v.id,
          iteration: v.iteration_number,
          prompt: v.prompt_text,
          metrics: JSON.parse(v.metrics_json),
          evaluation_details: v.evaluation_details
            ? JSON.parse(v.evaluation_details)
            : null,
          techniques: v.techniques_applied
            ? JSON.parse(v.techniques_applied)
            : [],
          critique: v.critique,
          improvements: v.improvements,
          created_at: v.created_at,
        })),
      };
    } catch (error: any) {
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  });

  /**
   * GET /api/versions/compare/:version1Id/:version2Id
   * Compare two versions
   */
  server.get<{
    Params: { version1Id: string; version2Id: string };
  }>('/api/versions/compare/:version1Id/:version2Id', async (request, reply) => {
    try {
      const { version1Id, version2Id } = request.params;

      const [version1, version2] = await Promise.all([
        getVersion(version1Id),
        getVersion(version2Id),
      ]);

      if (!version1 || !version2) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'One or both versions not found',
        });
      }

      const metrics1 = JSON.parse(version1.metrics_json);
      const metrics2 = JSON.parse(version2.metrics_json);

      return {
        version1: {
          id: version1.id,
          iteration: version1.iteration_number,
          prompt: version1.prompt_text,
          metrics: metrics1,
        },
        version2: {
          id: version2.id,
          iteration: version2.iteration_number,
          prompt: version2.prompt_text,
          metrics: metrics2,
        },
        delta: {
          relevance: metrics2.relevance - metrics1.relevance,
          accuracy: metrics2.accuracy - metrics1.accuracy,
          consistency: metrics2.consistency - metrics1.consistency,
          efficiency: metrics2.efficiency - metrics1.efficiency,
          readability: metrics2.readability - metrics1.readability,
          aggregate_score: metrics2.aggregate_score - metrics1.aggregate_score,
        },
      };
    } catch (error: any) {
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  });
}


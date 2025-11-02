/**
 * Models API routes
 * Returns available LLM models configured via environment variables
 */

import { FastifyInstance } from "fastify";
import { parseAvailableModels, appConfig } from "../../config.js";

/**
 * Register models routes
 */
export async function modelsRoutes(server: FastifyInstance) {
  /**
   * GET /api/models
   * Get all available LLM models
   */
  server.get("/api/models", async () => {
    const models = parseAvailableModels();

    return {
      models,
      defaultModel: appConfig.defaultModel,
      count: models.length,
    };
  });
}

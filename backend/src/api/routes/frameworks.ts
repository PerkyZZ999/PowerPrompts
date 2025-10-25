/**
 * Frameworks API routes
 */

import { FastifyInstance } from "fastify";
import { FRAMEWORK_INFO } from "../../prompts/frameworks.js";

/**
 * Register framework routes
 */
export async function frameworksRoutes(server: FastifyInstance) {
  /**
   * GET /api/frameworks
   * Get all available frameworks with metadata
   */
  server.get("/api/frameworks", async () => {
    return {
      frameworks: Object.values(FRAMEWORK_INFO),
    };
  });
}

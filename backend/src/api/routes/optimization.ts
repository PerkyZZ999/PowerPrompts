/**
 * Optimization API routes
 */

import { FastifyInstance } from "fastify";
import { optimizationService } from "../../services/optimization-service.js";
import { OptimizeRequestSchema } from "../schemas/prompt.js";
import { EventQueue, createSSEResponse } from "../../utils/streaming.js";

/**
 * Register optimization routes
 */
export async function optimizationRoutes(server: FastifyInstance) {
  /**
   * POST /api/optimize
   * Start prompt optimization with SSE streaming
   */
  server.post("/api/optimize", async (request, reply) => {
    console.log("\n===========================================");
    console.log("[API] POST /api/optimize called");
    console.log("===========================================\n");

    try {
      // Validate request body
      const data = OptimizeRequestSchema.parse(request.body);

      console.log("[API] Request validated:");
      console.log(`  - Prompt length: ${data.prompt.length}`);
      console.log(`  - Framework: ${data.selected_framework}`);
      console.log(`  - Techniques: ${data.techniques_enabled.join(", ")}`);
      console.log(`  - Parameters:`, data.parameters);

      // Create event queue for SSE
      const eventQueue = new EventQueue();

      // Start optimization in background
      setImmediate(() => {
        optimizationService.optimize(data, eventQueue).catch((error) => {
          console.error("[API] Optimization error:", error);
          eventQueue.push({
            type: "error",
            data: {
              message: error instanceof Error ? error.message : "Unknown error",
              details: error,
            },
          });
          eventQueue.close();
        });
      });

      // Return SSE stream
      return createSSEResponse(reply, eventQueue);
    } catch (error: any) {
      console.error("[API] Request validation or setup error:", error);

      return reply.code(400).send({
        error: "Bad Request",
        message: error.message || "Invalid request",
        details: error.issues || error,
      });
    }
  });
}

/**
 * PowerPrompts FastAPI Backend
 * Main server entry point
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { appConfig, isDevelopment } from "./config.js";
import { authMiddleware } from "./api/middleware/auth.js";
import { initDatabase } from "./db/database.js";
import { frameworksRoutes } from "./api/routes/frameworks.js";
import { techniquesRoutes } from "./api/routes/techniques.js";
import { optimizationRoutes } from "./api/routes/optimization.js";
import { versionsRoutes } from "./api/routes/versions.js";
import { ragRoutes } from "./api/routes/rag.js";
import { modelsRoutes } from "./api/routes/models.js";
import { historyRoutes } from "./api/routes/history.js";

/**
 * Create and configure Fastify instance
 */
const server = Fastify({
  logger: {
    level: isDevelopment ? "debug" : "info",
    transport: isDevelopment
      ? {
          target: "pino-pretty",
          options: {
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  },
});

/**
 * Register CORS middleware
 */
await server.register(cors, {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
});

/**
 * Register authentication middleware
 */
server.addHook("onRequest", authMiddleware);

/**
 * Health check endpoint
 */
server.get("/health", async () => {
  return {
    status: "healthy",
    version: appConfig.appVersion,
    appName: appConfig.appName,
    timestamp: new Date().toISOString(),
  };
});

/**
 * Root endpoint
 */
server.get("/", async () => {
  return {
    message: "Welcome to PowerPrompts API",
    version: appConfig.appVersion,
    docs: "/docs",
  };
});

/**
 * Register API routes
 */
await server.register(frameworksRoutes);
await server.register(techniquesRoutes);
await server.register(modelsRoutes);
await server.register(optimizationRoutes);
await server.register(versionsRoutes);
await server.register(ragRoutes);
await server.register(historyRoutes);

console.log("[SERVER] All routes registered");

/**
 * Start the server
 */
async function start() {
  try {
    // Initialize database
    await initDatabase();
    console.log("[STARTUP] Database initialized");

    // Start listening
    const address = await server.listen({
      port: appConfig.port,
      host: "0.0.0.0",
    });

    console.log(
      "================================================================================",
    );
    console.log("[STARTUP] PowerPrompts API Starting Up!");
    console.log(`[STARTUP] Version: ${appConfig.appVersion}`);
    console.log(`[STARTUP] Environment: ${appConfig.nodeEnv}`);
    console.log(`[STARTUP] Server listening at: ${address}`);
    console.log(
      "================================================================================",
    );
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on("SIGINT", async () => {
  console.log("\n[SHUTDOWN] Received SIGINT, closing server...");
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n[SHUTDOWN] Received SIGTERM, closing server...");
  await server.close();
  process.exit(0);
});

// Start the server
start();

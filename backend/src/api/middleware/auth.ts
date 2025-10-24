/**
 * API Key Authentication Middleware for Fastify
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { appConfig } from '../../config.js';

/**
 * List of routes that don't require authentication
 */
const PUBLIC_ROUTES = ['/health', '/', '/docs'];

/**
 * Authentication middleware
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Skip auth for public routes
  if (PUBLIC_ROUTES.includes(request.url)) {
    return;
  }

  // Get API key from header
  const apiKey = request.headers['x-api-key'];

  // Check if API key is provided
  if (!apiKey) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'API key is required. Please provide X-API-Key header.',
    });
  }

  // Validate API key
  if (apiKey !== appConfig.apiKey) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid API key.',
    });
  }

  // API key is valid, continue
}


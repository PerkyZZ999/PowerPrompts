/**
 * Type-safe API client for PowerPrompts backend.
 */

import { OptimizeRequest, FrameworkInfo, TechniqueInfo } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

/**
 * Custom API error class.
 */
export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Fetch with automatic retry logic and exponential backoff.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new APIError(
          response.status,
          errorText || `HTTP ${response.status}`,
        );
      }

      return response;
    } catch (error) {
      // If last retry or non-retryable error, throw
      if (i === retries - 1 || error instanceof APIError) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000),
      );
    }
  }

  throw new Error("Max retries exceeded");
}

/**
 * API client with type-safe methods for all endpoints.
 */
export const apiClient = {
  /**
   * Health check endpoint.
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetchWithRetry(`${API_BASE_URL}/health`, {
      method: "GET",
    });
    return response.json();
  },

  /**
   * Get all available frameworks with metadata.
   */
  async getFrameworks(): Promise<{
    frameworks: Record<string, FrameworkInfo>;
    count: number;
    default: string;
  }> {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/frameworks`, {
      method: "GET",
    });
    return response.json();
  },

  /**
   * Get all available techniques with compatibility info.
   */
  async getTechniques(): Promise<{
    techniques: Record<string, TechniqueInfo>;
    count: number;
    compatibility_matrix: Record<string, any>;
  }> {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/techniques`, {
      method: "GET",
    });
    return response.json();
  },

  /**
   * Get SSE URL for optimization stream.
   * Note: SSE connection handled separately in streaming.ts
   */
  getOptimizeSSEUrl(request: OptimizeRequest): string {
    return `${API_BASE_URL}/api/optimize`;
  },

  /**
   * Get optimization request body as JSON string.
   */
  getOptimizeRequestBody(request: OptimizeRequest): string {
    return JSON.stringify(request);
  },
};

/**
 * Server-Sent Events (SSE) utilities for real-time streaming
 */

import { FastifyReply } from "fastify";

/**
 * SSE Event types (discriminated union)
 */
export type SSEEvent =
  | { type: "optimization_start"; data: { total_iterations: number } }
  | {
      type: "dataset_generated";
      data: { example_count: number; domain: string };
    }
  | { type: "iteration_start"; data: { iteration: number; prompt: string } }
  | { type: "executing_tests"; data: { count: number; iteration: number } }
  | {
      type: "test_progress";
      data: { current: number; total: number; iteration: number };
    }
  | {
      type: "applying_technique";
      data: { technique: string; iteration: number };
    }
  | { type: "evaluating_metrics"; data: { iteration: number } }
  | { type: "metrics_calculated"; data: { metrics: any; iteration: number } }
  | { type: "applying_rsip"; data: { iteration: number } }
  | {
      type: "prompt_improved";
      data: { iteration: number; critique: string; improved_prompt: string };
    }
  | {
      type: "iteration_complete";
      data: {
        iteration: number;
        prompt_version: string;
        metrics: {
          relevance: number;
          accuracy: number;
          consistency: number;
          efficiency: number;
          readability: number;
          aggregate_score: number;
        };
        evaluation_details: any;
        techniques: string[];
        duration_seconds: number;
      };
    }
  | {
      type: "optimization_complete";
      data: {
        best_version: {
          iteration: number;
          prompt: string;
          metrics: any;
        };
        all_versions: Array<{
          iteration: number;
          prompt: string;
          metrics: any;
        }>;
        total_time_seconds: number;
      };
    }
  | { type: "error"; data: { message: string; details?: any } };

/**
 * Event queue for SSE streaming
 */
export class EventQueue {
  private events: SSEEvent[] = [];
  private listeners: Array<(event: SSEEvent) => void> = [];
  private closed = false;

  /**
   * Push an event to the queue
   */
  push(event: SSEEvent): void {
    if (this.closed) {
      return;
    }

    this.events.push(event);

    // Notify all listeners
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Subscribe to events
   */
  subscribe(listener: (event: SSEEvent) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Close the queue
   */
  close(): void {
    this.closed = true;
    this.listeners = [];
    this.events = [];
  }

  /**
   * Check if closed
   */
  isClosed(): boolean {
    return this.closed;
  }
}

/**
 * Format SSE event
 */
function formatSSEEvent(event: SSEEvent): string {
  const lines: string[] = [];

  // Event type
  lines.push(`event: ${event.type}`);

  // Event data (JSON)
  lines.push(`data: ${JSON.stringify(event.data)}`);

  // Empty line to separate events
  lines.push("");

  return lines.join("\n") + "\n";
}

/**
 * Create SSE stream from event queue
 */
export async function* createSSEStream(
  queue: EventQueue,
): AsyncGenerator<string, void, unknown> {
  // Send initial connection message
  yield formatSSEEvent({
    type: "optimization_start",
    data: { total_iterations: 5 },
  });

  // Create promise that resolves when an event is available
  let resolveNext: ((event: SSEEvent) => void) | null = null;
  const eventPromises: Promise<SSEEvent>[] = [];

  // Subscribe to queue events
  const unsubscribe = queue.subscribe((event) => {
    if (resolveNext) {
      resolveNext(event);
      resolveNext = null;
    } else {
      eventPromises.push(Promise.resolve(event));
    }
  });

  try {
    // Stream events as they arrive
    while (!queue.isClosed()) {
      // Wait for next event
      const event = await (eventPromises.length > 0
        ? eventPromises.shift()!
        : new Promise<SSEEvent>((resolve) => {
            resolveNext = resolve;
          }));

      // Format and yield event
      yield formatSSEEvent(event);

      // Stop streaming if optimization complete or error
      if (event.type === "optimization_complete" || event.type === "error") {
        break;
      }
    }
  } finally {
    unsubscribe();
  }
}

/**
 * Create SSE response for Fastify
 */
export function createSSEResponse(
  reply: FastifyReply,
  queue: EventQueue,
): FastifyReply {
  // Set SSE headers with CORS support
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Disable nginx buffering
    "Access-Control-Allow-Origin": "http://localhost:3000", // CORS for frontend
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  });

  // Create stream
  const stream = createSSEStream(queue);

  // Stream events
  (async () => {
    try {
      for await (const chunk of stream) {
        reply.raw.write(chunk);
      }
    } catch (error) {
      console.error("[SSE ERROR] Stream error:", error);
    } finally {
      reply.raw.end();
    }
  })();

  return reply;
}

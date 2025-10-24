/**
 * SSE (Server-Sent Events) client for real-time optimization updates.
 */

import { SSEEvent } from "./types";

/**
 * SSE client with auto-reconnect and error handling.
 * Uses fetch API to support POST requests with body.
 */
export class SSEClient {
  private abortController: AbortController | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isIntentionallyClosed = false;

  constructor(
    private url: string,
    private requestBody: string,
    private onEvent: (event: SSEEvent) => void,
    private onError: (error: Error) => void,
    private onComplete: () => void
  ) {}

  /**
   * Connect to SSE stream using fetch API.
   */
  async connect() {
    try {
      this.isIntentionallyClosed = false;
      this.abortController = new AbortController();

      const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

      console.log("🔌 Connecting to SSE:", this.url);
      console.log("🔑 API Key:", API_KEY ? "✓ Present" : "✗ Missing");
      console.log("📦 Request Body Length:", this.requestBody.length, "bytes");

      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
          Accept: "text/event-stream",
        },
        body: this.requestBody,
        signal: this.abortController.signal,
        mode: "cors",
        credentials: "include",
      });

      console.log("📡 Response Status:", response.status, response.statusText);
      console.log("📋 Response Headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("❌ Request failed:", errorBody);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorBody}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      console.log("SSE connection opened");
      this.reconnectAttempts = 0;

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("SSE stream complete");
          this.onComplete();
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        let eventType = "";
        let eventData = "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            eventData = line.slice(5).trim();
          } else if (line === "" && eventType && eventData) {
            // Complete event received
            try {
              const data = JSON.parse(eventData);
              this.onEvent({ type: eventType, data } as SSEEvent);

              // Close connection on completion or error
              if (eventType === "optimization_complete" || eventType === "error") {
                this.disconnect();
                this.onComplete();
                return;
              }
            } catch (error) {
              console.error(`Failed to parse SSE event: ${eventType}`, error, eventData);
            }

            // Reset for next event
            eventType = "";
            eventData = "";
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("SSE connection aborted");
        return;
      }
      
      console.error("SSE connection error:", error);
      
      if (!this.isIntentionallyClosed) {
        this.handleError(error);
      }
    }
  }

  /**
   * Handle SSE connection errors with exponential backoff.
   */
  private handleError(error: Error) {
    console.error("SSE connection error:", error);

    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isIntentionallyClosed) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.isIntentionallyClosed) {
          this.disconnect();
          this.connect();
        }
      }, delay);
    } else if (!this.isIntentionallyClosed) {
      this.onError(new Error("Max reconnection attempts reached"));
      this.disconnect();
    }
  }

  /**
   * Disconnect from SSE stream.
   */
  disconnect() {
    this.isIntentionallyClosed = true;
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Check if currently connected.
   */
  isConnected(): boolean {
    return this.abortController !== null && !this.isIntentionallyClosed;
  }
}


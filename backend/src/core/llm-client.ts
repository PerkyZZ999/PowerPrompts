/**
 * LLM Client with support for OpenAI and OpenRouter
 * Handles retry logic and error handling
 */

import OpenAI from 'openai';
import { encoding_for_model, type TiktokenModel } from 'tiktoken';
import { appConfig } from '../config.js';

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * LLM Client class for OpenAI and OpenRouter interactions
 */
export class LLMClient {
  private client: OpenAI;
  private retryConfig: RetryConfig;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    // Configure client based on provider
    if (appConfig.llmProvider === 'openrouter') {
      console.log('[LLM CLIENT] Initializing OpenRouter client');
      this.client = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: appConfig.openrouterApiKey,
        defaultHeaders: {
          'HTTP-Referer': 'https://powerprompts.app', // Optional for OpenRouter rankings
          'X-Title': 'PowerPrompts', // Optional for OpenRouter rankings
        },
      });
    } else {
      console.log('[LLM CLIENT] Initializing OpenAI client');
      this.client = new OpenAI({
        apiKey: appConfig.openaiApiKey,
      });
    }

    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...retryConfig,
    };
  }

  /**
   * Complete a prompt with exponential backoff retry
   */
  async complete(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      stop?: string[];
    } = {}
  ): Promise<string> {
    const {
      model = appConfig.defaultModel,
      temperature = 0.7,
      maxTokens = 16000, // Increased default for modern models (GPT-5: 128K, GPT-4: 16K)
      topP = 1.0,
      stop,
    } = options;

    // OpenRouter Provider Preferences: Optimize for high throughput + mid-price
    // Targets providers like Google Vertex, Groq, SambaNova that have excellent throughput/price ratio
    const providerPreferences = appConfig.llmProvider === 'openrouter' ? {
      sort: 'throughput', // Prioritize high throughput (Google Vertex: 547.8 TPS, Groq: 674.3 TPS)
      allow_fallbacks: true, // Allow backup providers for reliability
      max_price: {
        prompt: appConfig.openrouterMaxPromptPrice, // Max input price per 1M tokens
        completion: appConfig.openrouterMaxCompletionPrice, // Max output price per 1M tokens
      },
    } : undefined;

    let lastError: Error | null = null;
    let delay = this.retryConfig.initialDelay;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`[LLM CLIENT] Attempting completion with model: ${model}`);
        console.log(`[LLM CLIENT] Request details:`, {
          provider: appConfig.llmProvider,
          baseURL: appConfig.llmProvider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1',
          model,
          promptLength: prompt.length,
          temperature,
          maxTokens,
          providerPreferences: providerPreferences || 'none',
        });
        
        const response = await this.client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          stop,
          ...(providerPreferences && { provider: providerPreferences }), // Add OpenRouter provider preferences
        } as any); // Type assertion needed for OpenRouter-specific fields

        const message = response.choices[0]?.message;
        const content = message?.content;
        const reasoning = (message as any)?.reasoning; // GPT-5/O1/O3 reasoning models

        console.log('[LLM CLIENT] Response received:', {
          id: response.id,
          model: response.model,
          choices: response.choices?.length,
          hasContent: !!content,
          hasReasoning: !!reasoning,
          finishReason: response.choices[0]?.finish_reason,
        });

        // For reasoning models (GPT-5, O1, O3), use reasoning field as fallback
        if (!content && reasoning) {
          console.log('[LLM CLIENT] Using reasoning field for reasoning model (content was empty)');
          return reasoning.trim();
        }

        if (!content) {
          console.error('[LLM CLIENT] Empty response - Full response:', JSON.stringify(response, null, 2));
          throw new Error(`Empty response from LLM. Model: ${model}, Response ID: ${response.id}`);
        }

        return content.trim();
      } catch (error: any) {
        lastError = error;

        // Log detailed error information including OpenRouter-specific error structure
        console.error('[LLM CLIENT] Error during completion:', {
          attempt: attempt + 1,
          model,
          message: error.message,
          status: error.status,
          type: error.type,
          code: error.code,
          // OpenRouter-specific error metadata
          metadata: error.metadata,
          // Full error object for debugging
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
        });

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);
        const isLastAttempt = attempt === this.retryConfig.maxRetries;

        if (!isRetryable || isLastAttempt) {
          // Throw a more descriptive error for OpenRouter
          const errorMessage = error.message || 'Unknown error';
          const statusCode = error.status || 'unknown';
          throw new Error(
            `[LLM Client] ${errorMessage} (Status: ${statusCode}, Model: ${model}, Provider: ${appConfig.llmProvider})`
          );
        }

        // Log retry attempt
        console.log(
          `[LLM CLIENT] Retry attempt ${attempt + 1}/${this.retryConfig.maxRetries} after ${delay}ms`
        );

        // Wait before retrying
        await this.sleep(delay);

        // Exponential backoff
        delay = Math.min(
          delay * this.retryConfig.backoffMultiplier,
          this.retryConfig.maxDelay
        );
      }
    }

    throw lastError || new Error('LLM completion failed');
  }

  /**
   * Generate embeddings for text
   */
  async embed(
    text: string,
    options: {
      model?: string;
    } = {}
  ): Promise<number[]> {
    const { model = 'text-embedding-ada-002' } = options;

    try {
      const response = await this.client.embeddings.create({
        model,
        input: text,
      });

      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error('[LLM CLIENT ERROR] Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Count tokens in text
   */
  countTokens(text: string, model: string = 'gpt-4'): number {
    try {
      const encoding = encoding_for_model(model as TiktokenModel);
      const tokens = encoding.encode(text);
      encoding.free();
      return tokens.length;
    } catch (error) {
      // Fallback: rough estimate (1 token ≈ 4 characters)
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on rate limits
    if (error?.status === 429) {
      return true;
    }

    // Retry on server errors (5xx)
    if (error?.status >= 500 && error?.status < 600) {
      return true;
    }

    // Retry on timeout errors
    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
      return true;
    }

    // Don't retry on client errors (4xx) except rate limits
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }

    // Retry on unknown errors (could be network issues)
    return true;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Global LLM client instance
 */
export const llmClient = new LLMClient();


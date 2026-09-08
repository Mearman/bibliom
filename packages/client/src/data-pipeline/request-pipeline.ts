/**
 * Request Pipeline - Composable middleware system for API requests
 * Provides cache lookup, deduplication, retry, logging, and error classification
 */

import { logger } from "@bibgraph/utils";

import { calculateRetryDelay,RETRY_CONFIG } from "../internal/rate-limit";

/**
 * Request context passed through the pipeline
 */
export interface RequestContext {
  /**
  Unique request identifier
   */
  requestId: string;
  /**
  Request URL
   */
  url: string;
  /**
  HTTP method
   */
  method: string;
  /**
  Request options
   */
  options: RequestInit;
  /**
  Request start timestamp
   */
  startTime: number;
  /**
  Request metadata
   */
  metadata: Record<string, unknown>;
}

/**
 * Response context from pipeline execution
 */
export interface ResponseContext {
  /**
  Response object
   */
  response: Response;
  /**
  Response time in milliseconds
   */
  responseTime: number;
  /**
  Whether response came from cache
   */
  fromCache: boolean;
  /**
  Error if request failed
   */
  error?: Error;
  /**
  Error classification if applicable
   */
  errorClassification?: ErrorClassification;
  /**
  Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Error classification types
 */
export enum ErrorType {
  NETWORK = "network",
  RATE_LIMIT = "rate_limit",
  SERVER = "server",
  CLIENT = "client",
  TIMEOUT = "timeout",
  UNKNOWN = "unknown",
}

/**
 * Error classification result
 */
export interface ErrorClassification {
  type: ErrorType;
  retryable: boolean;
  retryDelay?: number;
  userMessage: string;
  internalMessage: string;
}

/**
 * Pipeline middleware function signature
 */
export type PipelineMiddleware = (
  context: RequestContext,
  next: () => Promise<ResponseContext>,
) => Promise<ResponseContext>;

/**
 * Cache entry for request caching
 */
interface CacheEntry {
  response: Response;
  timestamp: number;
  ttl: number;
}

/**
 * Request deduplication entry
 */
interface DeduplicationEntry {
  cacheKey: string;
  timestamp: number;
  count: number;
  lastRequestId: string;
}

type MiddlewareFunction = (arguments_: {
  context: RequestContext;
  next: () => Promise<ResponseContext>;
}) => Promise<ResponseContext>;

/**
 * Pipeline configuration options
 */
export interface PipelineOptions {
  /**
  Enable caching
   */
  enableCache?: boolean;
  /**
  Cache TTL in milliseconds
   */
  cacheTtl?: number;
  /**
  Enable request deduplication
   */
  enableDedupe?: boolean;
  /**
  Deduplication window in milliseconds
   */
  dedupeWindow?: number;
  /**
  Maximum deduplication entries
   */
  maxDedupeEntries?: number;
  /**
  Enable retry logic
   */
  enableRetry?: boolean;
  /**
  Maximum retry attempts
   */
  maxRetries?: number;
  /**
  Enable logging
   */
  enableLogging?: boolean;
  /**
  Enable error classification
   */
  enableErrorClassification?: boolean;
  /**
  Custom cache key generator
   */
  cacheKeyGenerator?: (context: RequestContext) => string;
  /**
  Custom error classifier
   */
  errorClassifier?: (error: Error, response?: Response) => ErrorClassification;
}

/**
 * Default pipeline options
 */
const DEFAULT_OPTIONS: Required<PipelineOptions> = {
  enableCache: true,
  cacheTtl: 5 * 60 * 1000, // 5 minutes
  enableDedupe: true,
  dedupeWindow: 5 * 60 * 1000, // 5 minutes
  maxDedupeEntries: 1000,
  enableRetry: true,
  maxRetries: 3,
  enableLogging: true,
  enableErrorClassification: true,
  cacheKeyGenerator: (context: RequestContext) => {
    // Generate cache key from URL and relevant options
    const url = new URL(context.url);
    const parameters = new URLSearchParams(url.search);
    // Sort params for consistent keys
    const sortedParameters = [...parameters].sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const parameterString = sortedParameters.map(([k, v]) => `${k}=${v}`).join("&");
    return `${context.method}:${url.origin}${url.pathname}?${parameterString}`;
  },
  errorClassifier: (error: Error, response?: Response) => classifyError(error, response),
};

/**
 * Request pipeline with composable middleware
 */
export class RequestPipeline {
  private cache = new Map<string, CacheEntry>();
  private dedupeMap = new Map<string, DeduplicationEntry>();
  private options: Required<PipelineOptions>;

  constructor(options: PipelineOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute a request through the pipeline
   * @param url
   * @param options
   */
  async execute(url: string, options: RequestInit = {}): Promise<Response> {
    const context: RequestContext = {
      requestId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      url,
      method: options.method ?? "GET",
      options,
      startTime: Date.now(),
      metadata: {},
    };

    const middlewares: MiddlewareFunction[] = [];

    if (this.options.enableLogging) {
      middlewares.push(this.loggingMiddleware.bind(this));
    }
    if (this.options.enableCache) {
      middlewares.push(this.cacheMiddleware.bind(this));
    }
    if (this.options.enableDedupe) {
      middlewares.push(this.dedupeMiddleware.bind(this));
    }
    if (this.options.enableRetry) {
      middlewares.push(this.retryMiddleware.bind(this));
    }
    if (this.options.enableErrorClassification) {
      middlewares.push(this.errorClassificationMiddleware.bind(this));
    }

    const dispatch = (index: number): Promise<ResponseContext> => {
      if (index === middlewares.length) {
        return this.executionMiddleware({ context });
      }

      const middleware = middlewares[index];
      return middleware({ context, next: () => dispatch(index + 1) });
    };

    const result = await dispatch(0);

    if (result.error) {
      throw result.error;
    }

    return result.response;
  }

  /**
   * Logging middleware
   * @param root0
   * @param root0.context
   * @param root0.next
   */
  private async loggingMiddleware({
    context,
    next,
  }: {
    context: RequestContext;
    next: () => Promise<ResponseContext>;
  }): Promise<ResponseContext> {
    logger.debug("pipeline", "Request started", {
      requestId: context.requestId,
      method: context.method,
      url: context.url.slice(0, 100),
    });

    const result = await next();

    logger.debug("pipeline", "Request completed", {
      requestId: context.requestId,
      status: result.response?.status,
      responseTime: result.responseTime,
      fromCache: result.fromCache,
      error: result.error?.message,
    });

    return result;
  }

  /**
   * Cache lookup middleware
   * @param root0
   * @param root0.context
   * @param root0.next
   */
  private async cacheMiddleware({
    context,
    next,
  }: {
    context: RequestContext;
    next: () => Promise<ResponseContext>;
  }): Promise<ResponseContext> {
    const cacheKey = this.options.cacheKeyGenerator(context);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      logger.debug("pipeline", "Cache hit", {
        requestId: context.requestId,
        cacheKey,
      });

      // Clone the cached response since Response can only be read once
      const clonedResponse = new Response(cached.response.body, {
        status: cached.response.status,
        statusText: cached.response.statusText,
        headers: cached.response.headers,
      });

      return {
        response: clonedResponse,
        responseTime: 0, // Cached response has no network time
        fromCache: true,
      };
    }

    const result = await next();

    // Cache successful responses
    if (result.response.ok && !result.fromCache) {
      this.cache.set(cacheKey, {
        response: result.response.clone(), // Clone to preserve the original
        timestamp: Date.now(),
        ttl: this.options.cacheTtl,
      });

      logger.debug("pipeline", "Response cached", {
        requestId: context.requestId,
        cacheKey,
      });
    }

    return result;
  }

  /**
   * Request deduplication middleware
   * @param root0
   * @param root0.context
   * @param root0.next
   */
  private async dedupeMiddleware({
    context,
    next,
  }: {
    context: RequestContext;
    next: () => Promise<ResponseContext>;
  }): Promise<ResponseContext> {
    const cacheKey = this.options.cacheKeyGenerator(context);
    const now = Date.now();
    const entry = this.dedupeMap.get(cacheKey);

    if (
      entry &&
      entry.lastRequestId !== context.requestId &&
      now - entry.timestamp < this.options.dedupeWindow
    ) {
      entry.count++;
      logger.debug("pipeline", "Request deduplicated", {
        requestId: context.requestId,
        cacheKey,
        dedupeCount: entry.count,
      });

      // Return a synthetic response indicating deduplication
      const dedupeResponse = Response.json(
        { message: "Request deduplicated", deduplicated: true },
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );

      return {
        response: dedupeResponse,
        responseTime: 0,
        fromCache: false,
        metadata: { deduplicated: true, dedupeCount: entry.count },
      };
    }

    // Clean up expired entries
    this.cleanupExpiredDedupeEntries();

    // Add to deduplication map
    this.dedupeMap.set(cacheKey, {
      cacheKey,
      timestamp: now,
      count: 1,
      lastRequestId: context.requestId,
    });

    // Limit deduplication map size
    if (this.dedupeMap.size > this.options.maxDedupeEntries) {
      this.cleanupExpiredDedupeEntries();
    }

    const result = await next();

    const storedEntry = this.dedupeMap.get(cacheKey);
    if (storedEntry) {
      storedEntry.timestamp = Date.now();
      storedEntry.lastRequestId = context.requestId;
    }

    return result;
  }

  /**
   * Retry middleware with exponential backoff
   * @param root0
   * @param root0.context
   * @param root0.next
   */
  private async retryMiddleware({
    context,
    next,
  }: {
    context: RequestContext;
    next: () => Promise<ResponseContext>;
  }): Promise<ResponseContext> {
    let lastResult: ResponseContext | undefined;
    let attempt = 0;

    while (attempt <= this.options.maxRetries) {
      try {
        const result = await next();

        if (result.error) {
          throw result.error;
        }

        // If we get here, the request succeeded
        if (attempt > 0) {
          logger.debug("pipeline", "Retry successful", {
            requestId: context.requestId,
            attempt: attempt + 1,
          });
        }

        return result;
      } catch (error) {
        const pipelineError =
          error instanceof Error ? error : new Error("Unknown error");

        // Classify the error to determine if it's retryable
        const classification = classifyError(pipelineError);

        if (!classification.retryable || attempt >= this.options.maxRetries) {
          logger.debug("pipeline", "Retry exhausted or non-retryable error", {
            requestId: context.requestId,
            attempt: attempt + 1,
            errorType: classification.type,
            retryable: classification.retryable,
          });

          // Return error result
          return {
            response: new Response(null, { status: 0 }),
            responseTime: 0,
            fromCache: false,
            error: pipelineError,
            errorClassification: classification,
          };
        }

        // Calculate retry delay
        const delay =
          classification.retryDelay ??
          calculateRetryDelay(attempt, RETRY_CONFIG.network);

        logger.debug("pipeline", "Retrying request", {
          requestId: context.requestId,
          attempt: attempt + 1,
          delay,
          errorType: classification.type,
        });

        await this.sleep(delay);
        attempt++;
      }
    }

    throw lastResult?.error ?? new Error("Retry logic failed");
  }

  /**
   * Error classification middleware
   * @param root0
   * @param root0.context
   * @param root0.next
   */
  private async errorClassificationMiddleware({
    context,
    next,
  }: {
    context: RequestContext;
    next: () => Promise<ResponseContext>;
  }): Promise<ResponseContext> {
    const result = await next();

    if (result.error) {
      const classification = this.options.errorClassifier(result.error);

      logger.debug("pipeline", "Error classified", {
        requestId: context.requestId,
        errorType: classification.type,
        retryable: classification.retryable,
        userMessage: classification.userMessage,
      });

      result.errorClassification = classification;
    }

    return result;
  }

  /**
   * Actual request execution middleware
   * @param root0
   * @param root0.context
   * @param root0.next
   */
  private async executionMiddleware({
    context,
  }: {
    context: RequestContext;
    next?: () => Promise<ResponseContext>;
  }): Promise<ResponseContext> {
    const startTime = Date.now();

    try {
      logger.debug("pipeline", "Executing request", {
        requestId: context.requestId,
        method: context.method,
        url: context.url.slice(0, 100),
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30_000); // 30 second timeout

      const response = await fetch(context.url, {
        ...context.options,
        method: context.method,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        response,
        responseTime,
        fromCache: false,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const pipelineError =
        error instanceof Error ? error : new Error("Request failed");

      return {
        response: new Response(null, { status: 0 }), // Empty response for errors
        responseTime,
        fromCache: false,
        error: pipelineError,
      };
    }
  }

  /**
   * Clean up expired deduplication entries
   */
  private cleanupExpiredDedupeEntries(): void {
    const now = Date.now();
    const expired: string[] = [];

    this.dedupeMap.forEach((entry, key) => {
      if (now - entry.timestamp >= this.options.dedupeWindow) {
        expired.push(key);
      }
    });

    for (const key of expired) this.dedupeMap.delete(key);

    if (expired.length > 0) {
      logger.debug("pipeline", "Cleaned up expired deduplication entries", {
        count: expired.length,
      });
    }
  }

  /**
   * Sleep utility for delays
   * @param ms
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.dedupeMap.clear();
    logger.debug("pipeline", "All caches cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    cacheEntries: number;
    dedupeEntries: number;
  } {
    return {
      cacheEntries: this.cache.size,
      dedupeEntries: this.dedupeMap.size,
    };
  }
}

/**
 * Classify an error into categories with retry recommendations
 * @param error
 * @param response
 */
export const classifyError = (error: Error, response?: Response): ErrorClassification => {
  // Network errors
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return {
      type: ErrorType.NETWORK,
      retryable: true,
      retryDelay: calculateRetryDelay(0, RETRY_CONFIG.network),
      userMessage:
        "Network connection error. Please check your internet connection.",
      internalMessage: "Fetch network error - likely connectivity issue",
    };
  }

  // Timeout errors
  if (error.name === "AbortError" || error.message.includes("timeout")) {
    return {
      type: ErrorType.TIMEOUT,
      retryable: true,
      retryDelay: calculateRetryDelay(0, RETRY_CONFIG.network),
      userMessage: "Request timed out. Please try again.",
      internalMessage: "Request timeout - abort signal triggered",
    };
  }

  // Rate limit errors
  if (response?.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const retryDelay = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : undefined;

    return {
      type: ErrorType.RATE_LIMIT,
      retryable: true,
      retryDelay:
        retryDelay ?? calculateRetryDelay(0, RETRY_CONFIG.rateLimited),
      userMessage:
        "Too many requests. Please wait a moment before trying again.",
      internalMessage: `Rate limited (HTTP 429) - retry after ${retryAfter ?? "unknown"} seconds`,
    };
  }

  // Server errors (5xx)
  if (response && response.status >= 500) {
    return {
      type: ErrorType.SERVER,
      retryable: true,
      retryDelay: calculateRetryDelay(0, RETRY_CONFIG.server),
      userMessage: "Server error. Please try again later.",
      internalMessage: `Server error (HTTP ${response.status})`,
    };
  }

  // Client errors (4xx)
  if (response && response.status >= 400 && response.status < 500) {
    return {
      type: ErrorType.CLIENT,
      retryable: false,
      userMessage: "Request error. Please check your request parameters.",
      internalMessage: `Client error (HTTP ${response.status})`,
    };
  }

  // Unknown errors
  return {
    type: ErrorType.UNKNOWN,
    retryable: false,
    userMessage: "An unexpected error occurred. Please try again.",
    internalMessage: `Unknown error: ${error.message}`,
  };
};

/**
 * Create a new request pipeline with the specified options
 * @param options
 */
export const createRequestPipeline = (options: PipelineOptions = {}): RequestPipeline => new RequestPipeline(options);

/**
 * Default pipeline instance
 */
export const defaultPipeline = createRequestPipeline();

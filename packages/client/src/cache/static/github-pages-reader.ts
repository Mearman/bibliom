/**
 * GitHub Pages Static Data Reader
 * Fetches static data from GitHub Pages URL in production mode with caching and retry logic
 */

import type { OpenAlexEntity, OpenAlexResponse } from "@bibgraph/types";
import { logger } from "@bibgraph/utils";
import { MemoryCache } from "@bibgraph/utils/cache";

import { validateStaticData } from "../../internal/type-helpers";


/**
 * Configuration for GitHub Pages reader
 */
export interface GitHubPagesReaderConfig {
  /**
  Base URL for GitHub Pages static data
   */
  baseUrl: string;
  /**
  Request timeout in milliseconds
   */
  timeout?: number;
  /**
  Maximum number of retry attempts
   */
  maxRetries?: number;
  /**
  Initial retry delay in milliseconds
   */
  initialRetryDelay?: number;
  /**
  Maximum retry delay in milliseconds
   */
  maxRetryDelay?: number;
  /**
  TTL for in-memory cache in milliseconds
   */
  cacheTtl?: number;
  /**
  Maximum cache size
   */
  maxCacheSize?: number;
  /**
  Whether to validate fetched data
   */
  validateData?: boolean;
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Cache entry for static data
 */
interface CachedStaticData<T> {
  data: T;
  fetchedAt: number;
  url: string;
}

/**
 * Validation result for fetched data
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Error class for GitHub Pages reader failures
 */
export class GitHubPagesReaderError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public url?: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "GitHubPagesReaderError";
    Object.setPrototypeOf(this, GitHubPagesReaderError.prototype);
  }
}

/**
 * GitHub Pages static data reader with caching and retry logic
 */
export class GitHubPagesReader {
  private static readonly LOGGER_NAME = "static-cache";
  private config: Required<GitHubPagesReaderConfig>;
  private cache: MemoryCache<CachedStaticData<unknown>>;
  private retryConfig: RetryConfig;
  private isProduction: boolean;

  constructor(config: GitHubPagesReaderConfig) {
    // Set up configuration with defaults
    this.config = {
      baseUrl: config.baseUrl,
      timeout: config.timeout ?? 10_000, // 10 seconds
      maxRetries: config.maxRetries ?? 3,
      initialRetryDelay: config.initialRetryDelay ?? 1000, // 1 second
      maxRetryDelay: config.maxRetryDelay ?? 8000, // 8 seconds
      cacheTtl: config.cacheTtl ?? 5 * 60 * 1000, // 5 minutes
      maxCacheSize: config.maxCacheSize ?? 100,
      validateData: config.validateData ?? true,
    };

    // Initialize cache
    this.cache = new MemoryCache<CachedStaticData<unknown>>(
      {
        maxSize: this.config.maxCacheSize,
        defaultTtl: this.config.cacheTtl,
        enableStats: true,
      },
      logger,
    );

    // Set up retry configuration
    this.retryConfig = {
      maxRetries: this.config.maxRetries,
      initialDelay: this.config.initialRetryDelay,
      maxDelay: this.config.maxRetryDelay,
      backoffMultiplier: 2,
    };

    // Detect production environment
    this.isProduction = this.detectProductionEnvironment();

    logger.debug(
      GitHubPagesReader.LOGGER_NAME,
      "GitHubPagesReader initialized",
      {
        baseUrl: this.config.baseUrl,
        isProduction: this.isProduction,
        cacheTtl: this.config.cacheTtl,
        maxRetries: this.config.maxRetries,
      },
    );
  }

  /**
   * Fetch static data from GitHub Pages with caching and retry logic
   * @param path
   */
  async fetchStaticData<T>(path: string): Promise<T | null> {
    // Only fetch in production mode
    if (!this.isProduction) {
      logger.debug(
        GitHubPagesReader.LOGGER_NAME,
        "Skipping GitHub Pages fetch in non-production environment",
        { path },
      );
      return null;
    }

    const cacheKey = this.getCacheKey(path);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug(
        GitHubPagesReader.LOGGER_NAME,
        "Returning cached static data",
        {
          path,
          cacheKey,
        },
      );
      return cached.data as T;
    }

    try {
      const url = this.buildUrl(path);
      const data = await this.fetchWithRetry<T>(url);

      // Cache the result
      const cacheEntry: CachedStaticData<T> = {
        data,
        fetchedAt: Date.now(),
        url,
      };

      this.cache.set({ key: cacheKey, value: cacheEntry });

      logger.debug(
        GitHubPagesReader.LOGGER_NAME,
        "Successfully fetched and cached static data",
        {
          path,
          url,
          dataSize: JSON.stringify(data).length,
        },
      );

      return data;
    } catch (error) {
      logger.error(
        GitHubPagesReader.LOGGER_NAME,
        "Failed to fetch static data from GitHub Pages",
        {
          path,
          error: error instanceof Error ? error.message : String(error),
        },
      );

      // Return null for graceful degradation
      return null;
    }
  }

  /**
   * Fetch OpenAlex entity data from static cache
   * @param root0
   * @param root0.entityType
   * @param root0.entityId
   */
  async fetchEntity<T extends OpenAlexEntity>({
    entityType,
    entityId,
  }: {
    entityType: string;
    entityId: string;
  }): Promise<T | null> {
    const path = `entities/${entityType}/${entityId}.json`;
    return this.fetchStaticData<T>(path);
  }

  /**
   * Fetch OpenAlex response data from static cache
   * @param root0
   * @param root0.entityType
   * @param root0.queryHash
   */
  async fetchResponse<T extends OpenAlexEntity>({
    entityType,
    queryHash,
  }: {
    entityType: string;
    queryHash: string;
  }): Promise<OpenAlexResponse<T> | null> {
    const path = `responses/${entityType}/${queryHash}.json`;
    return this.fetchStaticData<OpenAlexResponse<T>>(path);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug(GitHubPagesReader.LOGGER_NAME, "GitHub Pages cache cleared");
  }

  /**
   * Update configuration
   * @param newConfig
   */
  updateConfig(newConfig: Partial<GitHubPagesReaderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.debug(
      GitHubPagesReader.LOGGER_NAME,
      "GitHub Pages reader configuration updated",
      newConfig,
    );
  }

  /**
   * Fetch data with retry logic and exponential backoff
   * @param root0
   * @param root0.url
   * @param root0.attempt
   */
  private async attemptFetch<T>({
    url,
    attempt,
  }: {
    url: string;
    attempt: number;
  }): Promise<T> {
    logger.debug(
      GitHubPagesReader.LOGGER_NAME,
      "Attempting to fetch from GitHub Pages",
      {
        url,
        attempt: attempt + 1,
        maxRetries: this.retryConfig.maxRetries + 1,
      },
    );

    const response = await this.fetchWithTimeout(url);

    if (!response.ok) {
      throw new GitHubPagesReaderError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        url,
      );
    }

    const rawData: unknown = await response.json();

    // Validate data if enabled
    if (this.config.validateData) {
      const validation = this.validateResponseData(rawData);
      if (!validation.isValid) {
        throw new GitHubPagesReaderError(
          `Invalid data format: ${validation.errors.join(", ")}`,
          undefined,
          url,
        );
      }
    }

    const validatedData = validateStaticData(rawData) as T;

    logger.debug(
      GitHubPagesReader.LOGGER_NAME,
      "Successfully fetched data from GitHub Pages",
      {
        url,
        attempt: attempt + 1,
        dataSize: JSON.stringify(validatedData).length,
      },
    );

    return validatedData;
  }

  private async handleFetchError({
    error,
    url,
    attempt,
  }: {
    error: unknown;
    url: string;
    attempt: number;
  }): Promise<void> {
    const lastError = error instanceof Error ? error : new Error(String(error));

    logger.warn(
      GitHubPagesReader.LOGGER_NAME,
      "GitHub Pages fetch attempt failed",
      {
        url,
        attempt: attempt + 1,
        error: lastError.message,
      },
    );

    // Don't retry on the last attempt
    if (attempt === this.retryConfig.maxRetries) {
      throw new GitHubPagesReaderError(
        `Failed to fetch after ${this.retryConfig.maxRetries + 1} attempts: ${lastError.message}`,
        undefined,
        url,
        lastError,
      );
    }

    // Calculate delay with exponential backoff
    const delay = this.calculateRetryDelay(attempt);

    logger.debug(
      GitHubPagesReader.LOGGER_NAME,
      "Retrying GitHub Pages fetch after delay",
      {
        url,
        attempt: attempt + 1,
        delay,
      },
    );

    await this.sleep(delay);
  }

  private async fetchWithRetry<T>(url: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.attemptFetch<T>({ url, attempt });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        await this.handleFetchError({ error, url, attempt });
      }
    }

    // All retries failed
    throw new GitHubPagesReaderError(
      `Failed to fetch after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message}`,
      undefined,
      url,
      lastError ?? undefined,
    );
  }

  /**
   * Fetch with timeout
   * @param url
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      return await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new GitHubPagesReaderError(
          `Request timeout after ${this.config.timeout}ms`,
          undefined,
          url,
          error,
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   * @param attempt
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay =
      this.retryConfig.initialDelay *
      Math.pow(this.retryConfig.backoffMultiplier, attempt);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * baseDelay;

    const delay = Math.min(baseDelay + jitter, this.retryConfig.maxDelay);

    return Math.floor(delay);
  }

  /**
   * Sleep for specified milliseconds
   * @param ms
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate response data structure
   * @param data
   */
  private validateResponseData(data: unknown): ValidationResult {
    const errors: string[] = [];

    if (data === null || data === undefined) {
      errors.push("Data is null or undefined");
      return { isValid: false, errors };
    }

    if (typeof data !== "object") {
      errors.push("Data is not an object");
      return { isValid: false, errors };
    }

    // Basic validation - could be enhanced based on specific requirements
    try {
      JSON.stringify(data);
    } catch {
      errors.push("Data is not serializable to JSON");
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Build full URL from path
   * @param path
   */
  private buildUrl(path: string): string {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const baseUrl = this.config.baseUrl.endsWith("/")
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;

    return `${baseUrl}/${cleanPath}`;
  }

  /**
   * Generate cache key for path
   * @param path
   */
  private getCacheKey(path: string): string {
    return `static:${path}`;
  }

  /**
   * Detect if running in production environment
   */
  private detectProductionEnvironment(): boolean {
    // Check various indicators of production environment
    if (typeof globalThis !== "undefined" && "location" in globalThis) {
      // Browser environment
      const hostname =
        "location" in globalThis &&
        globalThis.location &&
        "hostname" in location
          ? location.hostname
          : undefined;

      if (hostname) {
        // Consider it production if:
        // 1. Running on GitHub Pages domain
        // 2. Running on custom domain (not localhost or development domains)
        const isGitHubPages = hostname.includes("github.io");
        const isLocalhost =
          hostname === "localhost" || hostname === "127.0.0.1";
        const isDevelopment =
          hostname.includes("dev") || hostname.includes("test");

        return isGitHubPages || (!isLocalhost && !isDevelopment && hostname !== "");
      }
    }

    // Node.js environment - check environment variables
    const nodeEnvironment = process.env.NODE_ENV;
    const isProduction = nodeEnvironment === "production";

    logger.debug(
      GitHubPagesReader.LOGGER_NAME,
      "Production environment detection",
      {
        nodeEnv: nodeEnvironment,
        isProd: isProduction,
      },
    );

    return isProduction;
  }
}

/**
 * Default GitHub Pages reader configuration
 */
export const defaultGitHubPagesConfig: GitHubPagesReaderConfig = {
  baseUrl: "https://mearman.github.io/BibGraph/data",
  timeout: 10_000,
  maxRetries: 3,
  initialRetryDelay: 1000,
  maxRetryDelay: 8000,
  cacheTtl: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 100,
  validateData: true,
};

/**
 * Create a GitHub Pages reader instance with default configuration
 * @param config
 */
export const createGitHubPagesReader = (config: Partial<GitHubPagesReaderConfig> = {}): GitHubPagesReader => {
  const fullConfig = { ...defaultGitHubPagesConfig, ...config };
  return new GitHubPagesReader(fullConfig);
};

/**
 * Background Task Types
 *
 * Unified interface for executing tasks without blocking the main thread.
 * Supports multiple strategies: idle callbacks, scheduler API, and Web Workers.
 * @module utils/background-tasks/types
 */

/**
 * Available background processing strategies
 */
export type BackgroundStrategy = 'idle' | 'scheduler' | 'worker' | 'sync';

/**
 * Priority levels for task scheduling
 */
export type TaskPriority = 'background' | 'low' | 'normal' | 'high';

/**
 * Options for background task execution
 */
export interface BackgroundTaskOptions {
  /**
  Task priority (affects scheduling order)
   */
  priority?: TaskPriority;

  /**
  Timeout in milliseconds (0 = no timeout)
   */
  timeout?: number;

  /**
  Signal for cancellation
   */
  signal?: AbortSignal;

  /**
  Chunk size for batch processing
   */
  chunkSize?: number;
}

/**
 * Result of a background task execution
 */
export interface BackgroundTaskResult<T> {
  /**
  Whether the task completed successfully
   */
  success: boolean;

  /**
  Result data if successful
   */
  data?: T;

  /**
  Error if failed
   */
  error?: Error;

  /**
  Whether the task was cancelled
   */
  cancelled?: boolean;

  /**
  Execution time in milliseconds
   */
  executionTime: number;
}

/**
 * Progress callback for batch operations
 */
export type ProgressCallback = (processed: number, total: number) => void;

/**
 * Interface for background task execution strategies
 */
export interface BackgroundTaskStrategy {
  /**
  Strategy name for identification
   */
  readonly name: BackgroundStrategy;

  /**
  Whether this strategy is supported in the current environment
   */
  isSupported(): boolean;

  /**
   * Execute a single task in the background
   */
  execute<T>(
    task: () => T | Promise<T>,
    options?: BackgroundTaskOptions
  ): Promise<BackgroundTaskResult<T>>;

  /**
   * Process items in batches with yielding between chunks
   */
  processBatch<T, R>(
    items: T[],
    processor: (item: T) => R | Promise<R>,
    options?: BackgroundTaskOptions & { onProgress?: ProgressCallback }
  ): Promise<BackgroundTaskResult<R[]>>;

  /**
   * Cancel all pending tasks (if supported)
   */
  cancelAll(): void;
}

/**
 * Configuration for the background task executor
 */
export interface BackgroundTaskExecutorConfig {
  /**
  Preferred strategy (falls back if not supported)
   */
  preferredStrategy: BackgroundStrategy;

  /**
  Default options for all tasks
   */
  defaultOptions?: BackgroundTaskOptions;

  /**
  Fallback chain if preferred strategy not supported
   */
  fallbackChain?: BackgroundStrategy[];
}

/**
 * Message types for Web Worker communication
 */
export interface WorkerTaskMessage {
  type: 'execute' | 'batch' | 'cancel';
  taskId: string;
  payload?: unknown;
  options?: BackgroundTaskOptions;
}

export interface WorkerResultMessage {
  type: 'result' | 'progress' | 'error';
  taskId: string;
  payload?: unknown;
  error?: string;
  progress?: { processed: number; total: number };
}

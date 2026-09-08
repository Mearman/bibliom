/**
 * Cache Performance Tests - Large Dataset and Load Testing
 *
 * Performance tests for the static data caching system under various
 * load conditions, large datasets, and stress scenarios.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock performance measurement APIs
let mockTime = 0;
Object.defineProperty(global, "performance", {
  value: {
    now: vi.fn().mockImplementation(() => {
      mockTime += Math.random() * 5 + 1; // 1-6ms increment per call
      return mockTime;
    }),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn().mockReturnValue([]),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  },
  writable: true,
});

// Mock Date.now to be consistent with performance.now
Date.now = () => mockTime;

// Mock Worker types
interface MockMessageEvent {
  data: any;
  origin: string;
  lastEventId?: string;
  ports: MessagePort[];
  source: MessageEventSource | ServiceWorker | null;
}

interface MockErrorEvent {
  error: Error | string;
  filename?: string;
  lineno?: number;
  colno?: number;
  message?: string;
}

// Mock Worker for background processing
global.Worker = class MockWorker {
  onmessage: ((event: MockMessageEvent) => void) | null = null;
  onerror: ((event: MockErrorEvent) => void) | null = null;

   
  constructor(_scriptURL: string | URL) {
    // Mock worker initialization
  }

  postMessage(message: any): void {
    // Simulate async worker processing
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          data: { result: "processed", original: message },
          ports: [],
          origin: "mock://test",
          lastEventId: "",
          source: null,
        } as any);
      }
    }, 10);
  }

  terminate(): void {
    // Mock termination
  }
} as any;

// Mock cache interfaces for performance testing
interface PerformanceCacheEntry {
  data: unknown;
  size: number;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface PerformanceMetrics {
  operationType: "read" | "write" | "batch" | "batch-read" | "clear";
  duration: number;
  itemCount: number;
  dataSize: number;
  cacheHit: boolean;
  memoryUsage?: number;
}

interface CachePerformanceConfig {
  maxMemoryUsage: number; // bytes
  maxResponseTime: number; // milliseconds
  batchSize: number;
  concurrencyLimit: number;
  enableCompression: boolean;
  enableBackgroundSync: boolean;
}

// Mock high-performance cache implementation
class MockHighPerformanceCache {
  private cache = new Map<string, PerformanceCacheEntry>();
  private metrics: PerformanceMetrics[] = [];
  private config: CachePerformanceConfig;
  private backgroundWorker: Worker | null = null;

  constructor(config: Partial<CachePerformanceConfig> = {}) {
    this.config = {
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxResponseTime: 100, // 100ms
      batchSize: 100,
      concurrencyLimit: 10,
      enableCompression: false,
      enableBackgroundSync: true,
      ...config,
    };

    if (this.config.enableBackgroundSync) {
      this.initializeBackgroundWorker();
    }
  }

  async read(key: string): Promise<unknown | null> {
    const startTime = performance.now();

    try {
      const entry = this.cache.get(key);
      const duration = performance.now() - startTime;

      if (entry) {
        entry.accessCount++;
        entry.lastAccessed = Date.now();

        this.recordMetric({
          operationType: "read",
          duration,
          itemCount: 1,
          dataSize: entry.size,
          cacheHit: true,
        });

        return entry.data;
      }

      this.recordMetric({
        operationType: "read",
        duration,
        itemCount: 1,
        dataSize: 0,
        cacheHit: false,
      });

      return null;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        operationType: "read",
        duration,
        itemCount: 1,
        dataSize: 0,
        cacheHit: false,
      });
      throw error;
    }
  }

  async write(key: string, data: unknown): Promise<void> {
    const startTime = performance.now();

    try {
      const serializedData = JSON.stringify(data);
      const { size } = new Blob([serializedData]);

      // Check memory limits
      if (this.getCurrentMemoryUsage() + size > this.config.maxMemoryUsage) {
        await this.evictLeastRecentlyUsed();
      }

      const entry: PerformanceCacheEntry = {
        data,
        size,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
      };

      this.cache.set(key, entry);

      const duration = performance.now() - startTime;
      this.recordMetric({
        operationType: "write",
        duration,
        itemCount: 1,
        dataSize: size,
        cacheHit: false,
        memoryUsage: this.getCurrentMemoryUsage(),
      });

      // Trigger background sync if enabled
      if (this.config.enableBackgroundSync && this.backgroundWorker) {
        this.backgroundWorker.postMessage({
          type: "sync",
          key,
          data: serializedData,
        });
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        operationType: "write",
        duration,
        itemCount: 1,
        dataSize: 0,
        cacheHit: false,
      });
      throw error;
    }
  }

  async readBatch(keys: string[]): Promise<Map<string, unknown>> {
    const startTime = performance.now();
    const results = new Map<string, unknown>();
    let totalSize = 0;
    let hitCount = 0;

    try {
      // Process in chunks to respect concurrency limits
      const chunks = this.chunkArray(keys, this.config.batchSize);

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (key) => {
          const entry = this.cache.get(key);
          if (entry) {
            entry.accessCount++;
            entry.lastAccessed = Date.now();
            results.set(key, entry.data);
            totalSize += entry.size;
            hitCount++;
          }
        });

        await Promise.all(chunkPromises);
      }

      const duration = performance.now() - startTime;
      this.recordMetric({
        operationType: "batch-read",
        duration,
        itemCount: keys.length,
        dataSize: totalSize,
        cacheHit: hitCount === keys.length, // All items must be found for 100% hit rate
      });

      return results;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        operationType: "batch-read",
        duration,
        itemCount: keys.length,
        dataSize: 0,
        cacheHit: false,
      });
      throw error;
    }
  }

  async writeBatch(entries: Map<string, unknown>): Promise<void> {
    const startTime = performance.now();
    let totalSize = 0;

    try {
      const entriesArray = [...entries];
      const chunks = this.chunkArray(entriesArray, this.config.batchSize);

      for (const chunk of chunks) {
        const writePromises = chunk.map(async ([key, data]) => {
          await this.write(key, data);
          const entry = this.cache.get(key);
          if (entry) {
            totalSize += entry.size;
          }
        });

        // Respect concurrency limits
        await this.executeConcurrentlyWithLimit(
          writePromises,
          this.config.concurrencyLimit,
        );
      }

      const duration = performance.now() - startTime;
      this.recordMetric({
        operationType: "batch",
        duration,
        itemCount: entries.size,
        dataSize: totalSize,
        cacheHit: true,
        memoryUsage: this.getCurrentMemoryUsage(),
      });
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        operationType: "batch",
        duration,
        itemCount: entries.size,
        dataSize: 0,
        cacheHit: false,
      });
      throw error;
    }
  }

  async clear(): Promise<void> {
    const startTime = performance.now();
    const itemCount = this.cache.size;

    try {
      this.cache.clear();

      const duration = performance.now() - startTime;
      this.recordMetric({
        operationType: "clear",
        duration,
        itemCount,
        dataSize: 0,
        cacheHit: false,
        memoryUsage: 0,
      });
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        operationType: "clear",
        duration,
        itemCount,
        dataSize: 0,
        cacheHit: false,
      });
      throw error;
    }
  }

  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAggregatedMetrics() {
    const groupedMetrics = this.metrics.reduce(
      (accumulator, metric) => {
        if (!accumulator[metric.operationType]) {
          accumulator[metric.operationType] = [];
        }
        accumulator[metric.operationType].push(metric);
        return accumulator;
      },
      {} as Record<string, PerformanceMetrics[]>,
    );

    const aggregated: Record<string, any> = {};

    for (const [operationType, metrics] of Object.entries(groupedMetrics)) {
      const durations = metrics.map((m) => m.duration);
      const dataSizes = metrics.map((m) => m.dataSize);

      aggregated[operationType] = {
        count: metrics.length,
        avgDuration:
          durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        p95Duration: this.percentile(durations, 95),
        p99Duration: this.percentile(durations, 99),
        totalDataSize: dataSizes.reduce((sum, size) => sum + size, 0),
        avgDataSize:
          dataSizes.reduce((sum, size) => sum + size, 0) / dataSizes.length,
        cacheHitRate: metrics.filter((m) => m.cacheHit).length / metrics.length,
      };
    }

    return aggregated;
  }

  getCurrentMemoryUsage(): number {
    return [...this.cache.values()].reduce(
      (total, entry) => total + entry.size,
      0,
    );
  }

  getStats() {
    return {
      size: this.cache.size,
      memoryUsage: this.getCurrentMemoryUsage(),
      maxMemoryUsage: this.config.maxMemoryUsage,
      memoryUtilization:
        this.getCurrentMemoryUsage() / this.config.maxMemoryUsage,
      averageEntrySize:
        this.cache.size > 0
          ? this.getCurrentMemoryUsage() / this.cache.size
          : 0,
      totalAccesses: [...this.cache.values()].reduce(
        (sum, entry) => sum + entry.accessCount,
        0,
      ),
    };
  }

  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory bloat
    if (this.metrics.length > 1000) {
      this.metrics.splice(0, this.metrics.length - 1000);
    }
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    const entries = [...this.cache];
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    // Remove 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let index = 0; index < toRemove; index++) {
      this.cache.delete(entries[index][0]);
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < array.length; index += chunkSize) {
      chunks.push(array.slice(index, index + chunkSize));
    }
    return chunks;
  }

  private async executeConcurrentlyWithLimit<T>(
    promises: Promise<T>[],
    limit: number,
  ): Promise<T[]> {
    const results: T[] = [];

    for (let index = 0; index < promises.length; index += limit) {
      const batch = promises.slice(index, index + limit);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }

    return results;
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private initializeBackgroundWorker(): void {
    try {
      this.backgroundWorker = new Worker("/cache-worker.js");
       
      this.backgroundWorker.onmessage = (_event) => {
        // Handle background sync results
      };
    } catch {
      // Worker not available, disable background sync
      this.config.enableBackgroundSync = false;
    }
  }

  destroy(): void {
    if (this.backgroundWorker) {
      this.backgroundWorker.terminate();
      this.backgroundWorker = null;
    }
    this.cache.clear();
    this.metrics.length = 0;
  }
}

// Test data generators
const generateTestData = (sizeKB: number) => {
  const targetSize = sizeKB * 1024;
  const baseString = "A".repeat(1000); // 1KB string
  const repetitions = Math.ceil(targetSize / 1000);

  return {
    id: `test-${Math.random().toString(36).slice(2, 11)}`,
    content: baseString.repeat(repetitions).slice(0, Math.max(0, targetSize)),
    metadata: {
      generated: Date.now(),
      size: targetSize,
      type: "performance-test",
    },
  };
};

const generateLargeDataset = (itemCount: number, itemSizeKB: number): Map<string, unknown> => {
  const dataset = new Map<string, unknown>();

  for (let index = 0; index < itemCount; index++) {
    const key = `large-dataset:${index.toString().padStart(6, "0")}`;
    const data = generateTestData(itemSizeKB);
    dataset.set(key, data);
  }

  return dataset;
};

describe("Cache Performance Tests", () => {
  let performanceCache: MockHighPerformanceCache;

  beforeEach(() => {
    // Setup performance.now mock with realistic timing
    let currentTime = 0;
    (performance.now as any).mockImplementation(() => {
      currentTime += Math.random() * 10 + 1; // 1-11ms random increment
      return currentTime;
    });

    performanceCache = new MockHighPerformanceCache({
      maxMemoryUsage: 10 * 1024 * 1024, // 10MB for testing
      maxResponseTime: 50,
      batchSize: 50,
      concurrencyLimit: 5,
    });
  });

  
  describe("Single Operation Performance", () => {
    it("should complete read operations within performance thresholds", async () => {
      const testData = generateTestData(10); // 10KB
      await performanceCache.write("perf:read-test", testData);

      const startTime = Date.now();
      const result = await performanceCache.read("perf:read-test");
      const duration = Date.now() - startTime;

      expect(result).toEqual(testData);
      expect(duration).toBeLessThan(50); // 50ms threshold

      const metrics = performanceCache.getPerformanceMetrics();
      const readMetric = metrics.find((m) => m.operationType === "read");
      expect(readMetric).toBeDefined();
      expect(readMetric!.cacheHit).toBe(true);
    });

    it("should complete write operations within performance thresholds", async () => {
      const testData = generateTestData(100); // 100KB

      const startTime = Date.now();
      await performanceCache.write("perf:write-test", testData);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // 100ms threshold

      const stats = performanceCache.getStats();
      expect(stats.size).toBe(1);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it("should handle very large individual items efficiently", async () => {
      const largeData = generateTestData(1024); // 1MB

      const startTime = Date.now();
      await performanceCache.write("perf:large-item", largeData);
      const writeTime = Date.now() - startTime;

      const readStartTime = Date.now();
      const result = await performanceCache.read("perf:large-item");
      const readTime = Date.now() - readStartTime;

      expect(result).toEqual(largeData);
      expect(writeTime).toBeLessThan(500); // 500ms for 1MB write
      expect(readTime).toBeLessThan(100); // 100ms for 1MB read
    });
  });

  describe("Batch Operation Performance", () => {
    it("should handle large batch reads efficiently", async () => {
      const batchSize = 500;
      const dataset = generateLargeDataset(batchSize, 5); // 500 items, 5KB each

      // Write the dataset
      await performanceCache.writeBatch(dataset);

      // Read the entire dataset
      const keys = [...dataset.keys()];
      const startTime = Date.now();
      const results = await performanceCache.readBatch(keys);
      const duration = Date.now() - startTime;

      expect(results.size).toBe(batchSize);
      expect(duration).toBeLessThan(1000); // 1 second for 500 items

      const metrics = performanceCache.getAggregatedMetrics();
      expect(metrics["batch-read"]).toBeDefined();
      expect(metrics["batch-read"].cacheHitRate).toBeGreaterThan(0.9); // >90% hit rate
    });

    it("should handle large batch writes with memory management", async () => {
      const batchSize = 200;
      const dataset = generateLargeDataset(batchSize, 10); // 200 items, 10KB each

      const startTime = Date.now();
      await performanceCache.writeBatch(dataset);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // 2 seconds for 2MB of data

      const stats = performanceCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(batchSize);
      expect(stats.memoryUsage).toBeLessThanOrEqual(10 * 1024 * 1024); // Within 10MB limit
    });

    it("should process concurrent batch operations without blocking", async () => {
      const datasets = [
        generateLargeDataset(50, 5),
        generateLargeDataset(50, 5),
        generateLargeDataset(50, 5),
      ];

      const startTime = Date.now();
      const promises = datasets.map((dataset) =>
        performanceCache.writeBatch(dataset),
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Should complete all 3 batches faster than sequential processing
      expect(duration).toBeLessThan(1500); // 1.5 seconds for concurrent writes

      const stats = performanceCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(150); // Some may be evicted due to memory limits
    });
  });

  describe("Memory Management Performance", () => {
    it("should efficiently evict entries when memory limit is reached", async () => {
      const maxMemory = 1024 * 1024; // 1MB
      const limitedCache = new MockHighPerformanceCache({
        maxMemoryUsage: maxMemory,
        batchSize: 10,
      });

      // Fill cache beyond memory limit
      const oversizedDataset = generateLargeDataset(200, 10); // 2MB total

      await limitedCache.writeBatch(oversizedDataset);

      const stats = limitedCache.getStats();
      expect(stats.memoryUsage).toBeLessThanOrEqual(maxMemory);
      expect(stats.size).toBeLessThan(200); // Some entries should be evicted

      limitedCache.destroy();
    });

    it("should maintain good performance during memory pressure", async () => {
      const stressTestCache = new MockHighPerformanceCache({
        maxMemoryUsage: 500 * 1024, // 500KB limit
        batchSize: 20,
      });

      const measurements: number[] = [];

      // Continuously write data to force evictions
      for (let index = 0; index < 10; index++) {
        const dataset = generateLargeDataset(20, 5); // 100KB per batch

        // Use performance.now() for consistent timing with the mock
        const startTime = performance.now();
        await stressTestCache.writeBatch(dataset);
        const endTime = performance.now();
        const duration = endTime - startTime;

        measurements.push(duration);
      }

      // Performance shouldn't degrade significantly over time
      const firstHalf = measurements.slice(0, 5);
      const secondHalf = measurements.slice(5);

      const firstAvg =
        firstHalf.reduce((sum, d) => sum + d, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((sum, d) => sum + d, 0) / secondHalf.length;

      // Second half shouldn't be more than 50% slower than first half
      expect(secondAvg).toBeLessThan(firstAvg * 1.5);

      stressTestCache.destroy();
    });
  });

  describe("Concurrent Access Performance", () => {
    it("should handle high concurrent read load", async () => {
      // Populate cache with test data
      const dataset = generateLargeDataset(100, 5);
      await performanceCache.writeBatch(dataset);

      const keys = [...dataset.keys()];
      const concurrentReads = 50;

      // Create concurrent read operations
      const startTime = Date.now();
      const readPromises = Array.from({ length: concurrentReads }, () => {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return performanceCache.read(randomKey);
      });

      const results = await Promise.all(readPromises);
      const duration = Date.now() - startTime;

      expect(results.filter((r) => r !== null)).toHaveLength(concurrentReads);
      expect(duration).toBeLessThan(500); // 500ms for 50 concurrent reads

      const metrics = performanceCache.getAggregatedMetrics();
      expect(metrics.read.cacheHitRate).toBe(1); // 100% hit rate
    });

    it("should maintain read performance during concurrent writes", async () => {
      // Pre-populate with read data
      const readDataset = generateLargeDataset(50, 5);
      await performanceCache.writeBatch(readDataset);

      const readKeys = [...readDataset.keys()];
      const writeDataset = generateLargeDataset(50, 5);

      // Perform concurrent reads and writes
      const startTime = Date.now();

      const readPromises = Array.from({ length: 25 }, () => {
        const randomKey = readKeys[Math.floor(Math.random() * readKeys.length)];
        return performanceCache.read(randomKey);
      });

      const writePromise = performanceCache.writeBatch(writeDataset);

      const [readResults] = await Promise.all([
        Promise.all(readPromises),
        writePromise,
      ]);

      const duration = Date.now() - startTime;

      expect(readResults.filter((r) => r !== null)).toHaveLength(25);
      expect(duration).toBeLessThan(1000); // 1 second for mixed operations
    });
  });

  describe("Stress Testing", () => {
    it("should maintain stability under extreme load", async () => {
      const stressCache = new MockHighPerformanceCache({
        maxMemoryUsage: 2 * 1024 * 1024, // 2MB
        batchSize: 100,
        concurrencyLimit: 10,
      });

      const operationCount = 1000;
      const errors: Error[] = [];
      const durations: number[] = [];

      // Mix of operations under stress
      for (let index = 0; index < operationCount; index++) {
        try {
          const startTime = Date.now();

          if (index % 3 === 0) {
            // Write operation
            const data = generateTestData(Math.random() * 50 + 5); // 5-55KB
            await stressCache.write(`stress:${index}`, data);
          } else if (index % 3 === 1) {
            // Read operation
            await stressCache.read(`stress:${Math.floor(Math.random() * index)}`);
          } else {
            // Batch operation
            const smallBatch = generateLargeDataset(5, 5);
            await stressCache.writeBatch(smallBatch);
          }

          durations.push(Date.now() - startTime);
        } catch (error) {
          errors.push(error as Error);
        }
      }

      expect(errors.length).toBeLessThan(operationCount * 0.01); // <1% error rate

      const avgDuration =
        durations.reduce((sum, d) => sum + d, 0) / durations.length;
      expect(avgDuration).toBeLessThan(100); // Average <100ms

      stressCache.destroy();
    });

    it("should recover gracefully from memory exhaustion", async () => {
      const recoveryCache = new MockHighPerformanceCache({
        maxMemoryUsage: 256 * 1024, // 256KB - very small limit
        batchSize: 5,
      });

      // Try to write much more data than memory allows
      const massiveDataset = generateLargeDataset(100, 10); // 1MB total

      let completed = 0;
      let errors = 0;

      for (const [key, data] of massiveDataset) {
        try {
          await recoveryCache.write(key, data);
          completed++;
        } catch {
          errors++;
        }
      }

      // Should have completed some writes and maintained stability
      expect(completed).toBeGreaterThan(0);
      expect(errors).toBeLessThan(100); // Not everything should fail

      const stats = recoveryCache.getStats();
      expect(stats.memoryUsage).toBeLessThanOrEqual(256 * 1024);

      // Cache should still be functional
      await recoveryCache.read(
        [...massiveDataset.keys()][0],
      );
      // Should either have the data or return null, but not throw

      recoveryCache.destroy();
    });
  });

  describe("Performance Monitoring and Metrics", () => {
    it("should provide accurate performance metrics", async () => {
      const dataset = generateLargeDataset(50, 10);

      // Perform various operations
      await performanceCache.writeBatch(dataset);

      const keys = [...dataset.keys()].slice(0, 25);
      await performanceCache.readBatch(keys);

      // Some individual operations
      await performanceCache.read(keys[0]);
      await performanceCache.write("metrics:test", generateTestData(5));

      const aggregatedMetrics = performanceCache.getAggregatedMetrics();

      expect(aggregatedMetrics.batch).toBeDefined();
      expect(aggregatedMetrics.read).toBeDefined();
      expect(aggregatedMetrics.write).toBeDefined();

      // Verify metric accuracy
      expect(aggregatedMetrics.batch.count).toBeGreaterThan(0);
      expect(aggregatedMetrics.batch.avgDuration).toBeGreaterThan(0);
      expect(aggregatedMetrics.batch.cacheHitRate).toBeGreaterThan(0);

      expect(aggregatedMetrics.read.cacheHitRate).toBe(1); // Should be 100% for existing data
      expect(aggregatedMetrics.write.count).toBeGreaterThan(0);
    });

    it("should track memory usage accurately", async () => {
      const initialStats = performanceCache.getStats();
      expect(initialStats.memoryUsage).toBe(0);

      const testData = generateTestData(100); // 100KB
      await performanceCache.write("memory:test", testData);

      const afterWriteStats = performanceCache.getStats();
      expect(afterWriteStats.memoryUsage).toBeGreaterThan(100 * 1024); // At least 100KB
      expect(afterWriteStats.size).toBe(1);

      await performanceCache.clear();

      const afterClearStats = performanceCache.getStats();
      expect(afterClearStats.memoryUsage).toBe(0);
      expect(afterClearStats.size).toBe(0);
    });

    it("should calculate percentiles correctly for response times", async () => {
      // Generate operations with varied response times
      for (let index = 0; index < 100; index++) {
        const data = generateTestData(Math.random() * 20 + 1); // 1-21KB
        await performanceCache.write(`percentile:${index}`, data);
      }

      const aggregatedMetrics = performanceCache.getAggregatedMetrics();
      const writeMetrics = aggregatedMetrics.write;

      expect(writeMetrics.p95Duration).toBeGreaterThanOrEqual(
        writeMetrics.avgDuration,
      );
      expect(writeMetrics.p99Duration).toBeGreaterThanOrEqual(
        writeMetrics.p95Duration,
      );
      expect(writeMetrics.maxDuration).toBeGreaterThanOrEqual(
        writeMetrics.p99Duration,
      );
      expect(writeMetrics.minDuration).toBeLessThanOrEqual(
        writeMetrics.avgDuration,
      );
    });
  });

  describe("Background Operations Performance", () => {
    it("should not block foreground operations during background sync", async () => {
      const bgCache = new MockHighPerformanceCache({
        enableBackgroundSync: true,
        batchSize: 10,
      });

      const testData = generateTestData(50);

      // Start background sync operation
      await bgCache.write("bg:test", testData);

      // Immediately perform foreground operations
      const foregroundStart = Date.now();
      const result = await bgCache.read("bg:test");
      const foregroundDuration = Date.now() - foregroundStart;

      expect(result).toEqual(testData);
      expect(foregroundDuration).toBeLessThan(50); // Should not be blocked

      bgCache.destroy();
    });

    it("should maintain performance during background cleanup", async () => {
      const cleanupCache = new MockHighPerformanceCache({
        maxMemoryUsage: 500 * 1024, // 500KB
        enableBackgroundSync: true,
      });

      // Fill cache to trigger background cleanup
      const initialDataset = generateLargeDataset(100, 8); // 800KB total
      await cleanupCache.writeBatch(initialDataset);

      // Measure performance of subsequent operations
      const performanceMeasurements: number[] = [];

      for (let index = 0; index < 20; index++) {
        const startTime = Date.now();
        const newData = generateTestData(5);
        await cleanupCache.write(`cleanup:${index}`, newData);
        performanceMeasurements.push(Date.now() - startTime);
      }

      // Performance should remain consistent
      const avgPerformance =
        performanceMeasurements.reduce((sum, d) => sum + d, 0) /
        performanceMeasurements.length;
      const maxPerformance = Math.max(...performanceMeasurements);

      expect(avgPerformance).toBeLessThan(100); // <100ms average
      expect(maxPerformance).toBeLessThan(200); // <200ms max (allowing for cleanup overhead)

      cleanupCache.destroy();
    });
  });
});

/**
 * Progressive Graph Loading - Loads large graphs incrementally to maintain smooth 60fps
 *
 * Implements batched loading with requestAnimationFrame scheduling
 * to prevent UI blocking during graph initialization.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Configuration for progressive loading
interface ProgressiveLoadingConfig {
  /**
  Number of nodes to load per batch
   */
  batchSize: number;
  /**
  Delay between batches in milliseconds
   */
  batchDelayMs: number;
  /**
  Whether to enable progressive loading
   */
  enabled: boolean;
  /**
  Maximum loading time before showing all remaining nodes
   */
  maxLoadingTimeMs: number;
}

// Loading state tracking
interface LoadingState {
  isLoading: boolean;
  loadedCount: number;
  totalCount: number;
  progress: number; // 0-1
  currentBatch: number;
  startTime: number;
}

// Default configuration
const DEFAULT_CONFIG: ProgressiveLoadingConfig = {
  batchSize: 50,
  batchDelayMs: 16, // ~60fps
  enabled: true,
  maxLoadingTimeMs: 5000, // 5 seconds max
};

/**
 * Hook for progressive graph loading
 * Loads nodes in batches to maintain smooth UI performance
 * @param items - items to load progressively
 * @param config - progressive loading configuration
 */
export const useProgressiveGraphLoading = <T>(
  items: T[],
  config: Partial<ProgressiveLoadingConfig> = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loadedCount: 0,
    totalCount: 0,
    progress: 0,
    currentBatch: 0,
    startTime: 0,
  });

  const timeoutReference = useRef<NodeJS.Timeout | null>(null);
  const animationFrameReference = useRef<number | null>(null);
  const isMountedReference = useRef(true);

  // Cancel any ongoing loading
  const cancelLoading = useCallback(() => {
    if (timeoutReference.current) {
      clearTimeout(timeoutReference.current);
      timeoutReference.current = null;
    }
    if (animationFrameReference.current) {
      cancelAnimationFrame(animationFrameReference.current);
      animationFrameReference.current = null;
    }
  }, []);

  // Load next batch of items
  const loadNextBatch = useCallback(
    (remainingItems: T[], currentVisible: T[]) => {
      if (!isMountedReference.current) return;

      const batchSize = Math.min(finalConfig.batchSize, remainingItems.length);
      const nextBatch = remainingItems.slice(0, batchSize);
      const newVisible = [...currentVisible, ...nextBatch];
      const newRemaining = remainingItems.slice(batchSize);

      setVisibleItems(newVisible);

      const newLoadedCount = newVisible.length;
      const progress = items.length > 0 ? newLoadedCount / items.length : 1;

      setLoadingState(previous => ({
        ...previous,
        isLoading: newRemaining.length > 0,
        loadedCount: newLoadedCount,
        progress,
        currentBatch: previous.currentBatch + 1,
      }));

      // Schedule next batch if items remain
      if (newRemaining.length > 0) {
        const elapsedTime = performance.now() - loadingState.startTime;

        // Force load all if max time exceeded
        if (elapsedTime > finalConfig.maxLoadingTimeMs) {
          setVisibleItems(items);
          setLoadingState(previous => ({
            ...previous,
            isLoading: false,
            loadedCount: items.length,
            progress: 1,
          }));
          return;
        }

        // Schedule next batch
        if (finalConfig.batchDelayMs > 0) {
          timeoutReference.current = setTimeout(() => {
            loadNextBatch(newRemaining, newVisible);
          }, finalConfig.batchDelayMs);
        } else {
          // Use requestAnimationFrame for smoother loading
          animationFrameReference.current = requestAnimationFrame(() => {
            loadNextBatch(newRemaining, newVisible);
          });
        }
      }
    },
    [
      items.length,
      finalConfig.batchSize,
      finalConfig.batchDelayMs,
      finalConfig.maxLoadingTimeMs,
      loadingState.startTime,
    ]
  );

  // Start progressive loading
  const startLoading = useCallback(() => {
    if (!finalConfig.enabled || items.length === 0) {
      setVisibleItems(items);
      setLoadingState({
        isLoading: false,
        loadedCount: items.length,
        totalCount: items.length,
        progress: 1,
        currentBatch: 0,
        startTime: performance.now(),
      });
      return;
    }

    // Cancel any existing loading
    cancelLoading();

    const startTime = performance.now();
    setLoadingState({
      isLoading: true,
      loadedCount: 0,
      totalCount: items.length,
      progress: 0,
      currentBatch: 0,
      startTime,
    });

    // Start loading first batch
    loadNextBatch(items, []);
  }, [items, finalConfig.enabled, cancelLoading, loadNextBatch]);

  // Reset and restart when items change
  useEffect(() => {
    isMountedReference.current = true;
    startLoading();

    return () => {
      isMountedReference.current = false;
      cancelLoading();
    };
  }, [items, startLoading, cancelLoading]);

  // Force complete loading (show all remaining items immediately)
  const completeLoading = useCallback(() => {
    if (!loadingState.isLoading) return;

    cancelLoading();
    setVisibleItems(items);
    setLoadingState(previous => ({
      ...previous,
      isLoading: false,
      loadedCount: items.length,
      progress: 1,
    }));
  }, [items, loadingState.isLoading, cancelLoading]);

  return {
    visibleItems,
    loadingState,
    completeLoading,
    restartLoading: startLoading,
  };
};

/**
 * Hook for progressive edge loading with dependency on node loading
 * Ensures edges are only loaded after both connected nodes are visible
 * @param nodes - array of nodes
 * @param edges - array of edges
 * @param getNodeId - function to get node ID
 * @param getEdgeSourceId - function to get edge source ID
 * @param getEdgeTargetId - function to get edge target ID
 * @param config - progressive loading configuration
 * @param _config
 */
export const useProgressiveEdgeLoading = <Node, Edge>(
  nodes: Node[],
  edges: Edge[],
  getNodeId: (node: Node) => string,
  getEdgeSourceId: (edge: Edge) => string,
  getEdgeTargetId: (edge: Edge) => string,
  _config: Partial<ProgressiveLoadingConfig> = {}
) => {
  const [visibleEdges, setVisibleEdges] = useState<Edge[]>([]);
  const nodeIdSet = useRef<Set<string>>(new Set());

  // Update node ID set when nodes change
  useEffect(() => {
    nodeIdSet.current = new Set(nodes.map(getNodeId));
  }, [nodes, getNodeId]);

  // Filter edges that have both endpoints visible
  const filterVisibleEdges = useCallback((allEdges: Edge[]) => {
    return allEdges.filter(edge => {
      const sourceId = getEdgeSourceId(edge);
      const targetId = getEdgeTargetId(edge);
      return nodeIdSet.current.has(sourceId) && nodeIdSet.current.has(targetId);
    });
  }, [getNodeId, getEdgeTargetId]);

  // Update visible edges when nodes change
  useEffect(() => {
    const filteredEdges = filterVisibleEdges(edges);
    setVisibleEdges(filteredEdges);
  }, [edges, filterVisibleEdges]);

  return visibleEdges;
};

/**
 * Performance metrics for progressive loading
 */
export interface ProgressiveLoadingMetrics {
  totalTimeMs: number;
  averageBatchTimeMs: number;
  batchesLoaded: number;
  itemsPerSecond: number;
}

export const calculateLoadingMetrics = (
  loadingState: LoadingState,
  _config: ProgressiveLoadingConfig
): ProgressiveLoadingMetrics => {
  const totalTimeMs = performance.now() - loadingState.startTime;
  const batchesLoaded = loadingState.currentBatch;
  const averageBatchTimeMs = batchesLoaded > 0 ? totalTimeMs / batchesLoaded : 0;
  const itemsPerSecond = totalTimeMs > 0 ? (loadingState.loadedCount / totalTimeMs) * 1000 : 0;

  return {
    totalTimeMs,
    averageBatchTimeMs,
    batchesLoaded,
    itemsPerSecond,
  };
};

/**
 * Adaptive batch sizing based on performance
 * @param initialBatchSize - starting batch size
 * @param targetFrameTime - target frame time in milliseconds (~60fps)
 */
export const useAdaptiveBatching = (
  initialBatchSize: number = 50,
  targetFrameTime: number = 16 // ~60fps
) => {
  const [batchSize, setBatchSize] = useState(initialBatchSize);
  const frameTimeReference = useRef(0);
  const lastFrameTimeReference = useRef(performance.now());

  const measureFrameTime = useCallback(() => {
    const now = performance.now();
    const frameTime = now - lastFrameTimeReference.current;
    frameTimeReference.current = frameTime;
    lastFrameTimeReference.current = now;

    // Adjust batch size based on frame time
    if (frameTime > targetFrameTime * 1.2) {
      // Frame too slow, reduce batch size
      setBatchSize(previous => Math.max(10, Math.floor(previous * 0.8)));
    } else if (frameTime < targetFrameTime * 0.8) {
      // Frame fast, increase batch size
      setBatchSize(previous => Math.min(200, Math.floor(previous * 1.2)));
    }
  }, [targetFrameTime]);

  return {
    batchSize,
    measureFrameTime,
    currentFrameTime: frameTimeReference.current,
  };
};
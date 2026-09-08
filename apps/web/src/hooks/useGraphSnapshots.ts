/**
 * useGraphSnapshots - Hook for managing graph snapshots
 *
 * Provides CRUD operations for graph snapshots:
 * - Save current graph state
 * - Load snapshot
 * - Auto-save functionality
 * - Share via URL
 *
 * @module hooks/use-graph-snapshots
 */

import type { GraphEdge, GraphNode } from '@bibgraph/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useStorageProvider } from '@/contexts/storage-provider-context';

interface GraphSnapshot {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isAutoSave: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
  zoom: number;
  panX: number;
  panY: number;
  layoutType: string;
  nodePositions?: Map<string, { x: number; y: number }>;
  annotations?: unknown[];
  shareToken?: string;
}

const MAX_AUTO_SAVE_COUNT = 5;

/**
 * Hook for managing graph snapshots
 */
export const useGraphSnapshots = () => {
  const storageProvider = useStorageProvider();
  const [snapshots, setSnapshots] = useState<GraphSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load snapshots on mount
  useEffect(() => {
    const loadSnapshots = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedSnapshots = await storageProvider.getSnapshots();

        // Deserialize snapshots
        const deserialized = loadedSnapshots.map(snapshot => {
          let parsedNodes: GraphNode[] = [];
          let parsedEdges: GraphEdge[] = [];
          let parsedNodePositions: Map<string, { x: number; y: number }> | undefined;
          let parsedAnnotations: unknown[] | undefined;

          try {
            parsedNodes = JSON.parse(snapshot.nodes) as GraphNode[];
            parsedEdges = JSON.parse(snapshot.edges) as GraphEdge[];

            if (snapshot.nodePositions) {
              const positions = JSON.parse(snapshot.nodePositions) as Array<[string, { x: number; y: number }]>;
              parsedNodePositions = new Map(positions);
            }

            if (snapshot.annotations) {
              parsedAnnotations = JSON.parse(snapshot.annotations) as unknown[];
            }
          } catch (parseError) {
            console.error('Failed to parse snapshot data:', parseError);
          }

          return {
            id: snapshot.id ?? '',
            name: snapshot.name,
            createdAt: snapshot.createdAt,
            updatedAt: snapshot.updatedAt,
            isAutoSave: snapshot.isAutoSave,
            nodes: parsedNodes,
            edges: parsedEdges,
            zoom: snapshot.zoom,
            panX: snapshot.panX,
            panY: snapshot.panY,
            layoutType: snapshot.layoutType,
            nodePositions: parsedNodePositions,
            annotations: parsedAnnotations,
            shareToken: snapshot.shareToken,
          };
        });

        setSnapshots(deserialized);
      } catch (error_) {
        const errorObject = error_ instanceof Error ? error_ : new Error(String(error_));
        setError(errorObject);
        console.error('Failed to load snapshots:', error_);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSnapshots();
  }, []);

  /**
   * Create a new snapshot
   */
  const saveSnapshot = useCallback(async (parameters: {
    name: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
    zoom: number;
    panX: number;
    panY: number;
    layoutType: string;
    nodePositions?: Map<string, { x: number; y: number }>;
    annotations?: unknown[];
    isAutoSave?: boolean;
  }) => {
    try {
      const serializedPositions = parameters.nodePositions
        ? JSON.stringify([...parameters.nodePositions])
        : undefined;

      const serializedAnnotations = parameters.annotations
        ? JSON.stringify(parameters.annotations)
        : undefined;

      const id = await storageProvider.addSnapshot({
        name: parameters.name,
        nodes: JSON.stringify(parameters.nodes),
        edges: JSON.stringify(parameters.edges),
        zoom: parameters.zoom,
        panX: parameters.panX,
        panY: parameters.panY,
        layoutType: parameters.layoutType,
        nodePositions: serializedPositions,
        annotations: serializedAnnotations,
        isAutoSave: parameters.isAutoSave ?? false,
      });

      // Prune old auto-saves if this is a manual save
      if (!parameters.isAutoSave) {
        await storageProvider.pruneAutoSaveSnapshots(MAX_AUTO_SAVE_COUNT);
      }

      // Refresh snapshots from storage
      const updatedSnapshots = await storageProvider.getSnapshots();
      const deserialized = updatedSnapshots.map(snapshot => {
        let parsedNodes: GraphNode[] = [];
        let parsedEdges: GraphEdge[] = [];
        let parsedNodePositions: Map<string, { x: number; y: number }> | undefined;
        let parsedAnnotations: unknown[] | undefined;

        try {
          parsedNodes = JSON.parse(snapshot.nodes) as GraphNode[];
          parsedEdges = JSON.parse(snapshot.edges) as GraphEdge[];

          if (snapshot.nodePositions) {
            const positions = JSON.parse(snapshot.nodePositions) as Array<[string, { x: number; y: number }]>;
            parsedNodePositions = new Map(positions);
          }

          if (snapshot.annotations) {
            parsedAnnotations = JSON.parse(snapshot.annotations) as unknown[];
          }
        } catch (parseError) {
          console.error('Failed to parse snapshot data:', parseError);
        }

        return {
          id: snapshot.id ?? '',
          name: snapshot.name,
          createdAt: snapshot.createdAt,
          updatedAt: snapshot.updatedAt,
          isAutoSave: snapshot.isAutoSave,
          nodes: parsedNodes,
          edges: parsedEdges,
          zoom: snapshot.zoom,
          panX: snapshot.panX,
          panY: snapshot.panY,
          layoutType: snapshot.layoutType,
          nodePositions: parsedNodePositions,
          annotations: parsedAnnotations,
          shareToken: snapshot.shareToken,
        };
      });

      setSnapshots(deserialized);

      return id;
    } catch (error_) {
      const errorObject = error_ instanceof Error ? error_ : new Error(String(error_));
      setError(errorObject);
      console.error('Failed to save snapshot:', error_);
      throw errorObject;
    }
  }, []);

  /**
   * Auto-save current graph state
   */
  const autoSave = useCallback(async (parameters: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    zoom: number;
    panX: number;
    panY: number;
    layoutType: string;
    nodePositions?: Map<string, { x: number; y: number }>;
    annotations?: unknown[];
  }) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    return saveSnapshot({
      ...parameters,
      name: `Auto-save ${timeString}`,
      isAutoSave: true,
    });
  }, [saveSnapshot]);

  /**
   * Delete a snapshot
   */
  const deleteSnapshot = useCallback(async (id: string) => {
    try {
      await storageProvider.deleteSnapshot(id);

      // Remove from local state
      setSnapshots(previous => previous.filter(s => s.id !== id));
    } catch (error_) {
      const errorObject = error_ instanceof Error ? error_ : new Error(String(error_));
      setError(errorObject);
      console.error('Failed to delete snapshot:', error_);
      throw errorObject;
    }
  }, []);

  /**
   * Load snapshot by ID
   */
  const loadSnapshot = useCallback(async (id: string): Promise<GraphSnapshot | null> => {
    try {
      const snapshot = await storageProvider.getSnapshot(id);

      if (!snapshot) return null;

      let parsedNodes: GraphNode[] = [];
      let parsedEdges: GraphEdge[] = [];
      let parsedNodePositions: Map<string, { x: number; y: number }> | undefined;
      let parsedAnnotations: unknown[] | undefined;

      try {
        parsedNodes = JSON.parse(snapshot.nodes) as GraphNode[];
        parsedEdges = JSON.parse(snapshot.edges) as GraphEdge[];

        if (snapshot.nodePositions) {
          const positions = JSON.parse(snapshot.nodePositions) as Array<[string, { x: number; y: number }]>;
          parsedNodePositions = new Map(positions);
        }

        if (snapshot.annotations) {
          parsedAnnotations = JSON.parse(snapshot.annotations) as unknown[];
        }
      } catch (parseError) {
        console.error('Failed to parse snapshot data:', parseError);
      }

      return {
        id: snapshot.id ?? '',
        name: snapshot.name,
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.updatedAt,
        isAutoSave: snapshot.isAutoSave,
        nodes: parsedNodes,
        edges: parsedEdges,
        zoom: snapshot.zoom,
        panX: snapshot.panX,
        panY: snapshot.panY,
        layoutType: snapshot.layoutType,
        nodePositions: parsedNodePositions,
        annotations: parsedAnnotations,
        shareToken: snapshot.shareToken,
      };
    } catch (error_) {
      const errorObject = error_ instanceof Error ? error_ : new Error(String(error_));
      setError(errorObject);
      console.error('Failed to load snapshot:', error_);
      throw errorObject;
    }
  }, []);

  /**
   * Manual snapshots (non-auto-save)
   */
  const manualSnapshots = useMemo(() => {
    return snapshots.filter(s => !s.isAutoSave);
  }, [snapshots]);

  /**
   * Auto-save snapshots
   */
  const autoSaveSnapshots = useMemo(() => {
    return snapshots.filter(s => s.isAutoSave);
  }, [snapshots]);

  return {
    // State
    snapshots,
    manualSnapshots,
    autoSaveSnapshots,
    isLoading,
    error,

    // CRUD operations
    saveSnapshot,
    autoSave,
    deleteSnapshot,
    loadSnapshot,

    // Helpers
    refresh: useCallback(async () => {
      const updatedSnapshots = await storageProvider.getSnapshots();
      const deserialized = updatedSnapshots.map(snapshot => {
        let parsedNodes: GraphNode[] = [];
        let parsedEdges: GraphEdge[] = [];
        let parsedNodePositions: Map<string, { x: number; y: number }> | undefined;
        let parsedAnnotations: unknown[] | undefined;

        try {
          parsedNodes = JSON.parse(snapshot.nodes) as GraphNode[];
          parsedEdges = JSON.parse(snapshot.edges) as GraphEdge[];

          if (snapshot.nodePositions) {
            const positions = JSON.parse(snapshot.nodePositions) as Array<[string, { x: number; y: number }]>;
            parsedNodePositions = new Map(positions);
          }

          if (snapshot.annotations) {
            parsedAnnotations = JSON.parse(snapshot.annotations) as unknown[];
          }
        } catch (parseError) {
          console.error('Failed to parse snapshot data:', parseError);
        }

        return {
          id: snapshot.id ?? '',
          name: snapshot.name,
          createdAt: snapshot.createdAt,
          updatedAt: snapshot.updatedAt,
          isAutoSave: snapshot.isAutoSave,
          nodes: parsedNodes,
          edges: parsedEdges,
          zoom: snapshot.zoom,
          panX: snapshot.panX,
          panY: snapshot.panY,
          layoutType: snapshot.layoutType,
          nodePositions: parsedNodePositions,
          annotations: parsedAnnotations,
          shareToken: snapshot.shareToken,
        };
      });

      setSnapshots(deserialized);
    }, []),
  };
};

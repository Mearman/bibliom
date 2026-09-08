/**
 * PersistentGraphAdapter
 *
 * Adapter that makes PersistentGraph work with the algorithms package.
 * Provides filtered, weighted access to graph data with lazy evaluation.
 *
 * Features:
 * - Node type filtering during traversal
 * - Edge property filtering (via EdgePropertyFilter)
 * - Configurable weight calculation (property mapping or custom function)
 * - Bidirectional traversal support
 * @module cache/dexie/graph-adapter
 */

import type {
  EntityType,
  GraphEdgeRecord,
  GraphNodeRecord,
  TraversalOptions,
  WeightConfig,
  WeightFunction,
} from '@bibgraph/types';

import type { PersistentGraph } from './persistent-graph';

/**
 * Weight function type for graph adapter
 */
type AdapterWeightFunction = WeightFunction<GraphNodeRecord, GraphEdgeRecord>;

/**
 * Build a weight function from WeightConfig
 * @param config
 */
const buildWeightFunction = (
	config?: WeightConfig<GraphNodeRecord, GraphEdgeRecord>
): AdapterWeightFunction => {
  if (!config) {
    return () => 1;
  }

  // Custom weight function takes precedence
  if (config.weightFn) {
    const baseFunction = config.weightFn;
    if (config.invert) {
      return (edge, source, target) => {
        const weight = baseFunction(edge, source, target);
        return 1 / Math.max(weight, 0.001);
      };
    }
    return baseFunction;
  }

  // Property-based weight
  if (config.property) {
    const property = config.property;
    const defaultWeight = config.defaultWeight ?? 1;

    if (config.invert) {
      return (edge) => {
        const value = (edge[property] as number | undefined) ?? defaultWeight;
        return 1 / Math.max(value, 0.001);
      };
    }

    return (edge) => {
      return (edge[property] as number | undefined) ?? defaultWeight;
    };
  }

  return () => config.defaultWeight ?? 1;
};

/**
 * PersistentGraphAdapter - Filtered, weighted access to PersistentGraph
 *
 * This adapter wraps a PersistentGraph and provides:
 * - Node filtering by entity type
 * - Edge filtering by properties (score, authorPosition, etc.)
 * - Weight calculation from edge properties or custom functions
 * - Direction-aware traversal
 * @example
 * ```typescript
 * const graph = getPersistentGraph();
 * const adapter = new PersistentGraphAdapter(graph, {
 *   weight: { property: 'score' },
 *   nodeTypes: ['work', 'author'],
 *   edgeFilter: { type: 'AUTHORSHIP' },
 *   direction: 'both',
 * });
 *
 * // Use with algorithms
 * const path = dijkstra(adapter, sourceId, targetId, adapter.getWeightFunction());
 * ```
 */
export class PersistentGraphAdapter {
  private readonly graph: PersistentGraph;
  private readonly options: TraversalOptions<GraphNodeRecord, GraphEdgeRecord>;
  private readonly weightFn: AdapterWeightFunction;
  private readonly nodeTypeSet: Set<EntityType> | null;

  constructor(
    graph: PersistentGraph,
    options?: TraversalOptions<GraphNodeRecord, GraphEdgeRecord>
  ) {
    this.graph = graph;
    this.options = options ?? {};
    this.weightFn = buildWeightFunction(this.options.weight);
    this.nodeTypeSet = this.options.nodeTypes?.length
      ? new Set(this.options.nodeTypes)
      : null;
  }

  // ===========================================================================
  // Graph-like Interface (for algorithms package compatibility)
  // ===========================================================================

  /**
   * Get a node by ID (filtered by node types if configured)
   * @param id
   */
  getNode(id: string): GraphNodeRecord | undefined {
    const node = this.graph.getNode(id);
    if (!node) return undefined;

    // Apply node type filter
    if (this.nodeTypeSet && !this.nodeTypeSet.has(node.entityType)) {
      return undefined;
    }

    return node;
  }

  /**
   * Check if node exists (respecting filters)
   * @param id
   */
  hasNode(id: string): boolean {
    return this.getNode(id) !== undefined;
  }

  /**
   * Get all nodes (filtered by node types if configured)
   */
  getAllNodes(): GraphNodeRecord[] {
    const nodes = this.graph.getAllNodes();

    if (!this.nodeTypeSet) {
      return nodes;
    }

    const nodeTypeSet = this.nodeTypeSet;
    return nodes.filter((node) => nodeTypeSet.has(node.entityType));
  }

  /**
   * Get all edges (filtered by edge properties if configured)
   */
  getAllEdges(): GraphEdgeRecord[] {
    const edges = this.graph.getAllEdges();

    if (!this.options.edgeFilter) {
      return edges;
    }

    return this.applyEdgeFilter(edges);
  }

  /**
   * Get neighbor node IDs (filtered and direction-aware)
   * @param id
   */
  getNeighbors(id: string): string[] {
    const direction = this.options.direction ?? 'both';

    // Get neighbors from underlying graph
    let neighbors = this.graph.getNeighbors(id, {
      direction,
      // Types filter is separate from edgeFilter
    });

    // Apply node type filter
    if (this.nodeTypeSet) {
      const nodeTypeSet = this.nodeTypeSet;
      neighbors = neighbors.filter((neighborId) => {
        const node = this.graph.getNode(neighborId);
        return node && nodeTypeSet.has(node.entityType);
      });
    }

    return neighbors;
  }

  /**
   * Get outgoing edges from a node (filtered)
   * @param id
   */
  getOutgoingEdges(id: string): GraphEdgeRecord[] {
    const direction = this.options.direction ?? 'both';
    let edges: GraphEdgeRecord[] = [];

    if (direction === 'outbound' || direction === 'both') {
      edges = [...edges, ...this.graph.getEdgesFrom(id)];
    }

    if (direction === 'inbound' || direction === 'both') {
      edges = [...edges, ...this.graph.getEdgesTo(id)];
    }

    // Apply edge filter
    if (this.options.edgeFilter) {
      edges = this.applyEdgeFilter(edges);
    }

    // Apply node type filter to targets
    if (this.nodeTypeSet) {
      const nodeTypeSet = this.nodeTypeSet;
      edges = edges.filter((edge) => {
        const targetId = edge.source === id ? edge.target : edge.source;
        const targetNode = this.graph.getNode(targetId);
        return targetNode && nodeTypeSet.has(targetNode.entityType);
      });
    }

    return edges;
  }

  /**
   * Get node count (respecting filters)
   */
  getNodeCount(): number {
    return this.getAllNodes().length;
  }

  /**
   * Get edge count (respecting filters)
   */
  getEdgeCount(): number {
    return this.getAllEdges().length;
  }

  /**
   * Check if graph is directed
   */
  isDirected(): boolean {
    return this.options.directed ?? true;
  }

  // ===========================================================================
  // Weight Methods
  // ===========================================================================

  /**
   * Get the weight function for use with algorithms
   */
  getWeightFunction(): AdapterWeightFunction {
    return this.weightFn;
  }

  /**
   * Calculate weight for an edge
   * @param edge
   */
  getEdgeWeight(edge: GraphEdgeRecord): number {
    const source = this.graph.getNode(edge.source);
    const target = this.graph.getNode(edge.target);

    if (!source || !target) {
      return this.options.weight?.defaultWeight ?? 1;
    }

    return this.weightFn(edge, source, target);
  }

  // ===========================================================================
  // Configuration Access
  // ===========================================================================

  /**
   * Get current traversal options
   */
  getOptions(): TraversalOptions<GraphNodeRecord, GraphEdgeRecord> {
    return this.options;
  }

  /**
   * Get underlying PersistentGraph
   */
  getGraph(): PersistentGraph {
    return this.graph;
  }

  /**
   * Create a new adapter with modified options
   * @param newOptions
   */
  withOptions(
    newOptions: Partial<TraversalOptions<GraphNodeRecord, GraphEdgeRecord>>
  ): PersistentGraphAdapter {
    return new PersistentGraphAdapter(this.graph, {
      ...this.options,
      ...newOptions,
    });
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  /**
   * Apply edge property filter to edges
   * @param edges
   */
  private applyEdgeFilter(edges: GraphEdgeRecord[]): GraphEdgeRecord[] {
    const filter = this.options.edgeFilter;
    if (!filter) return edges;

    return edges.filter((edge) => {
      if (filter.authorPosition !== undefined && edge.authorPosition !== filter.authorPosition) {
        return false;
      }
      if (filter.isCorresponding !== undefined && edge.isCorresponding !== filter.isCorresponding) {
        return false;
      }
      if (filter.isOpenAccess !== undefined && edge.isOpenAccess !== filter.isOpenAccess) {
        return false;
      }
      if (filter.version !== undefined && edge.version !== filter.version) {
        return false;
      }
      if (
        	filter.scoreMin !== undefined &&
        	(edge.score === undefined || edge.score < filter.scoreMin)
        ) {
        return false;
      }
      if (
        	filter.scoreMax !== undefined &&
        	(edge.score === undefined || edge.score > filter.scoreMax)
        ) {
        return false;
      }
      if (
          filter.yearsInclude !== undefined &&
          filter.yearsInclude.length > 0 &&
          (!edge.years || filter.yearsInclude.every((year) => !edge.years?.includes(year)))
        ) {
          return false;
        }
      if (filter.awardId !== undefined && edge.awardId !== filter.awardId) {
        return false;
      }
      if (filter.role !== undefined && edge.role !== filter.role) {
        return false;
      }
      return true;
    });
  }
}

/**
 * Factory function to create a PersistentGraphAdapter
 * @param graph - PersistentGraph instance to wrap
 * @param options - Traversal options (weight, filtering, direction)
 * @returns Configured adapter
 * @example
 * ```typescript
 * const adapter = createGraphAdapter(persistentGraph, {
 *   weight: { property: 'score', invert: true },
 *   nodeTypes: ['author'],
 * });
 * ```
 */
export const createGraphAdapter = (
	graph: PersistentGraph,
	options?: TraversalOptions<GraphNodeRecord, GraphEdgeRecord>
): PersistentGraphAdapter => new PersistentGraphAdapter(graph, options);

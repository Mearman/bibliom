/**
 * useRepositoryGraph - Hook for loading bookmarked entities as graph data
 *
 * Bridges the catalogue storage (bookmarks) to graph visualization components.
 * Converts CatalogueEntity[] to GraphNode[] and extracts relationships as GraphEdge[].
 * @module hooks/use-repository-graph
 */

import {
  getAuthorById,
  getFunderById,
  getInstitutionById,
  getPublisherById,
  getSourceById,
  getTopicById,
  getWorkById,
} from '@bibgraph/client';
import type { EntityType,GraphEdge, GraphNode } from '@bibgraph/types';
import { RelationType } from '@bibgraph/types';
import type { CatalogueEntity } from '@bibgraph/utils';
import { catalogueEventEmitter, logger } from '@bibgraph/utils';
import { useCallback, useEffect, useRef,useState } from 'react';

import { useStorageProvider } from '@/contexts/storage-provider-context';

/**
 * Normalize an OpenAlex ID by extracting the short ID from a URL if needed.
 * e.g., "https://openalex.org/A5048491430" -> "A5048491430"
 * @param id
 */
const normalizeOpenAlexId = (id: string): string => {
  if (!id) return id;
  // If it's a URL, extract just the ID part
  const urlMatch = id.match(/openalex\.org\/([ACDFIKPQSTW]\d+)$/i);
  if (urlMatch) {
    return urlMatch[1].toUpperCase();
  }
  // Already a short ID
  return id.toUpperCase();
};

/**
 * Result of fetching a bookmark's entity data and extracting relationships
 */
interface BookmarkFetchResult {
  label: string;
  entityData: Record<string, unknown>;
  relationships: Array<{
    targetId: string;
    targetType: EntityType;
    relationType: RelationType;
  }>;
}

/**
 * Fetch entity data and extract relationships for a Work bookmark
 * @param entityId
 */
const fetchWorkBookmark = async (entityId: string): Promise<BookmarkFetchResult | null> => {
  try {
    const work = await getWorkById(entityId);
    const relationships: BookmarkFetchResult['relationships'] = [];

    // Authorships -> Authors
    for (const auth of work.authorships ?? []) {
      if (auth.author?.id) {
        relationships.push({
          targetId: normalizeOpenAlexId(auth.author.id),
          targetType: 'authors',
          relationType: RelationType.AUTHORSHIP,
        });
      }
    }

    // Primary location -> Source
    if (work.primary_location?.source?.id) {
      relationships.push({
        targetId: normalizeOpenAlexId(work.primary_location.source.id),
        targetType: 'sources',
        relationType: RelationType.PUBLICATION,
      });
    }

    // Referenced works
    for (const referenceId of work.referenced_works ?? []) {
      relationships.push({
        targetId: normalizeOpenAlexId(referenceId),
        targetType: 'works',
        relationType: RelationType.REFERENCE,
      });
    }

    // Topics
    for (const topic of work.topics ?? []) {
      if (topic.id) {
        relationships.push({
          targetId: normalizeOpenAlexId(topic.id),
          targetType: 'topics',
          relationType: RelationType.TOPIC,
        });
      }
    }

    // Grants -> Funders
    for (const grant of work.grants ?? []) {
      if (grant.funder) {
        relationships.push({
          targetId: normalizeOpenAlexId(grant.funder),
          targetType: 'funders',
          relationType: RelationType.FUNDED_BY,
        });
      }
    }

    return {
      label: work.title ?? work.display_name ?? entityId,
      entityData: work,
      relationships,
    };
  } catch (error) {
    logger.debug('repository-graph', 'Failed to fetch work', { entityId, error });
    return null;
  }
};

/**
 * Fetch entity data and extract relationships for an Author bookmark
 * @param entityId
 */
const fetchAuthorBookmark = async (entityId: string): Promise<BookmarkFetchResult | null> => {
  try {
    const author = await getAuthorById(entityId);
    const relationships: BookmarkFetchResult['relationships'] = [];

    // Affiliations -> Institutions
    for (const aff of author.affiliations ?? []) {
      if (aff.institution?.id) {
        relationships.push({
          targetId: normalizeOpenAlexId(aff.institution.id),
          targetType: 'institutions',
          relationType: RelationType.AFFILIATION,
        });
      }
    }

    // Topics
    for (const topic of author.topics ?? []) {
      if (topic.id) {
        relationships.push({
          targetId: normalizeOpenAlexId(topic.id),
          targetType: 'topics',
          relationType: RelationType.AUTHOR_RESEARCHES,
        });
      }
    }

    return {
      label: author.display_name ?? entityId,
      entityData: author,
      relationships,
    };
  } catch (error) {
    logger.debug('repository-graph', 'Failed to fetch author', { entityId, error });
    return null;
  }
};

/**
 * Fetch entity data and extract relationships for an Institution bookmark
 * @param entityId
 */
const fetchInstitutionBookmark = async (entityId: string): Promise<BookmarkFetchResult | null> => {
  try {
    const institution = await getInstitutionById(entityId);
    const relationships: BookmarkFetchResult['relationships'] = [];

    // Topics
    for (const topic of institution.topics ?? []) {
      if (topic.id) {
        relationships.push({
          targetId: normalizeOpenAlexId(topic.id),
          targetType: 'topics',
          relationType: RelationType.TOPIC,
        });
      }
    }

    // Lineage -> Parent institutions
    for (const parentId of institution.lineage ?? []) {
      if (parentId !== institution.id) {
        relationships.push({
          targetId: normalizeOpenAlexId(parentId),
          targetType: 'institutions',
          relationType: RelationType.LINEAGE,
        });
      }
    }

    return {
      label: institution.display_name ?? entityId,
      entityData: institution,
      relationships,
    };
  } catch (error) {
    logger.debug('repository-graph', 'Failed to fetch institution', { entityId, error });
    return null;
  }
};

/**
 * Fetch entity data and extract relationships for a Source bookmark
 * @param entityId
 */
const fetchSourceBookmark = async (entityId: string): Promise<BookmarkFetchResult | null> => {
  try {
    const source = await getSourceById(entityId);
    const relationships: BookmarkFetchResult['relationships'] = [];

    // Host organization -> Publisher
    if (source.host_organization) {
      relationships.push({
        targetId: normalizeOpenAlexId(source.host_organization),
        targetType: 'publishers',
        relationType: RelationType.HOST_ORGANIZATION,
      });
    }

    // Topics
    for (const topic of source.topics ?? []) {
      if (topic.id) {
        relationships.push({
          targetId: normalizeOpenAlexId(topic.id),
          targetType: 'topics',
          relationType: RelationType.TOPIC,
        });
      }
    }

    return {
      label: source.display_name ?? entityId,
      entityData: source,
      relationships,
    };
  } catch (error) {
    logger.debug('repository-graph', 'Failed to fetch source', { entityId, error });
    return null;
  }
};

/**
 * Fetch entity data and extract relationships for a Topic bookmark
 * @param entityId
 */
const fetchTopicBookmark = async (entityId: string): Promise<BookmarkFetchResult | null> => {
  try {
    const topic = await getTopicById(entityId);
    const relationships: BookmarkFetchResult['relationships'] = [];

    // Field
    if (topic.field?.id) {
      relationships.push({
        targetId: normalizeOpenAlexId(topic.field.id),
        targetType: 'fields',
        relationType: RelationType.TOPIC_PART_OF_FIELD,
      });
    }

    // Domain
    if (topic.domain?.id) {
      relationships.push({
        targetId: normalizeOpenAlexId(topic.domain.id),
        targetType: 'domains',
        relationType: RelationType.FIELD_PART_OF_DOMAIN,
      });
    }

    return {
      label: topic.display_name ?? entityId,
      entityData: topic,
      relationships,
    };
  } catch (error) {
    logger.debug('repository-graph', 'Failed to fetch topic', { entityId, error });
    return null;
  }
};

/**
 * Fetch entity data for a Funder bookmark (no relationships extracted)
 * @param entityId
 */
const fetchFunderBookmark = async (entityId: string): Promise<BookmarkFetchResult | null> => {
  try {
    const funder = await getFunderById(entityId);
    return {
      label: funder.display_name ?? entityId,
      entityData: funder,
      relationships: [],
    };
  } catch (error) {
    logger.debug('repository-graph', 'Failed to fetch funder', { entityId, error });
    return null;
  }
};

/**
 * Fetch entity data for a Publisher bookmark (no relationships extracted)
 * @param entityId
 */
const fetchPublisherBookmark = async (entityId: string): Promise<BookmarkFetchResult | null> => {
  try {
    const publisher = await getPublisherById(entityId);
    return {
      label: publisher.display_name ?? entityId,
      entityData: publisher,
      relationships: [],
    };
  } catch (error) {
    logger.debug('repository-graph', 'Failed to fetch publisher', { entityId, error });
    return null;
  }
};

/**
 * Fetch entity data and relationships for a bookmark based on entity type
 * @param bookmark
 */
const fetchBookmarkData = async (bookmark: CatalogueEntity): Promise<BookmarkFetchResult | null> => {
  switch (bookmark.entityType) {
    case 'works':
      return fetchWorkBookmark(bookmark.entityId);
    case 'authors':
      return fetchAuthorBookmark(bookmark.entityId);
    case 'institutions':
      return fetchInstitutionBookmark(bookmark.entityId);
    case 'sources':
      return fetchSourceBookmark(bookmark.entityId);
    case 'topics':
      return fetchTopicBookmark(bookmark.entityId);
    case 'funders':
      return fetchFunderBookmark(bookmark.entityId);
    case 'publishers':
      return fetchPublisherBookmark(bookmark.entityId);
    default:
      return null;
  }
};

/**
 * Return type of the useRepositoryGraph hook
 */
export interface UseRepositoryGraphResult {
  /**
  Array of graph nodes from the repository
   */
  nodes: GraphNode[];

  /**
  Array of graph edges from the repository
   */
  edges: GraphEdge[];

  /**
  True while initial data is being loaded
   */
  loading: boolean;

  /**
  True when repository contains no entities
   */
  isEmpty: boolean;

  /**
  Error object if data loading failed
   */
  error: Error | null;

  /**
  Timestamp of last successful data refresh
   */
  lastUpdated: Date | null;

  /**
  Force refresh data from repository store
   */
  refresh: () => Promise<void>;
}

/**
 * Convert a CatalogueEntity (bookmark) to a GraphNode for visualization
 * @param entity
 * @param fetchResult
 */
const catalogueEntityToGraphNode = (entity: CatalogueEntity, fetchResult: BookmarkFetchResult | null): GraphNode => ({
    id: entity.entityId,
    entityType: entity.entityType,
    entityId: entity.entityId,
    label: fetchResult?.label ?? entity.entityId,
    x: Math.random() * 800 - 400,
    y: Math.random() * 600 - 300,
    externalIds: [],
    entityData: {
      notes: entity.notes,
      addedAt: entity.addedAt,
      ...fetchResult?.entityData,
    },
  });

/**
 * Hook that bridges bookmarks to graph visualization.
 *
 * Behavior:
 * - Loads bookmarked entities on mount
 * - Subscribes to catalogue events for reactive updates
 * - Converts CatalogueEntity to GraphNode format
 * - Handles errors gracefully without crashing
 * @example
 * ```tsx
 * function GraphPage() {
 *   const { nodes, edges, loading, isEmpty, error, refresh } = useRepositoryGraph();
 *
 *   if (loading) return <LoadingState />;
 *   if (error) return <ErrorState error={error} onRetry={refresh} />;
 *   if (isEmpty) return <EmptyState />;
 *
 *   return <ForceGraphVisualization nodes={nodes} edges={edges} />;
 * }
 * ```
 */
export const useRepositoryGraph = (): UseRepositoryGraphResult => {
  const storage = useStorageProvider();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refs for tracking state without causing re-renders
  const previousNodeCountReference = useRef<number>(0);
  const initializedReference = useRef(false);

  /**
   * Load bookmarks, fetch entity data, and extract relationships as edges
   */
  const loadData = useCallback(async () => {
    try {
      // Initialize special lists if not already done
      if (!initializedReference.current) {
        await storage.initializeSpecialLists();
        initializedReference.current = true;
      }

      const bookmarks = await storage.getBookmarks();

      // Only update state if data actually changed
      if (bookmarks.length !== previousNodeCountReference.current) {
        // Fetch entity data and relationships for all bookmarks in parallel
        const fetchResults = await Promise.all(
          bookmarks.map((bookmark) => fetchBookmarkData(bookmark))
        );

        // Create a map of bookmarked entity IDs for quick lookup
        const bookmarkedIds = new Set(bookmarks.map((b) => b.entityId));

        // Convert bookmarks to nodes with entity data
        const nodeArray = bookmarks.map((bookmark, index) =>
          catalogueEntityToGraphNode(bookmark, fetchResults[index])
        );

        // Extract edges from relationships where both endpoints are bookmarked
        const edgeArray: GraphEdge[] = [];
        const seenEdges = new Set<string>();

        for (const [index, bookmark] of bookmarks.entries()) {
          const fetchResult = fetchResults[index];

          if (fetchResult) {
            for (const rel of fetchResult.relationships) {
              // Only create edge if target is also bookmarked
              if (!bookmarkedIds.has(rel.targetId)) {
              	continue;
              }

              const edgeKey = `${bookmark.entityId}-${rel.targetId}-${rel.relationType}`;
              const reverseKey = `${rel.targetId}-${bookmark.entityId}-${rel.relationType}`;

              if (!seenEdges.has(edgeKey) && !seenEdges.has(reverseKey)) {
                seenEdges.add(edgeKey);
                edgeArray.push({
                  id: edgeKey,
                  source: bookmark.entityId,
                  target: rel.targetId,
                  type: rel.relationType,
                  weight: 1,
                });
              }
            }
          }
        }

        setNodes(nodeArray);
        setEdges(edgeArray);
        setLastUpdated(new Date());

        previousNodeCountReference.current = bookmarks.length;

        logger.debug('repository-graph', 'Bookmarks loaded as graph nodes with edges', {
          nodeCount: nodeArray.length,
          edgeCount: edgeArray.length,
        });
      }

      setError(null);
    } catch (error_) {
      const loadError = error_ instanceof Error ? error_ : new Error('Failed to load bookmarks');
      setError(loadError);
      logger.error('repository-graph', 'Failed to load bookmarks', { error: error_ });
    } finally {
      setLoading(false);
    }
  }, [storage]);

  /**
   * Force refresh - exposed for manual refresh triggers
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    previousNodeCountReference.current = -1;
    await loadData();
  }, [loadData]);

  // Initial load
  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Subscribe to catalogue events for reactive updates
  useEffect(() => {
    const unsubscribe = catalogueEventEmitter.subscribe((event) => {
      const isBookmarksEvent =
        event.listId === 'bookmarks-list' ||
        event.type === 'entity-added' ||
        event.type === 'entity-removed';

      if (isBookmarksEvent) {
        logger.debug('repository-graph', 'Catalogue event detected, refreshing', {
          eventType: event.type,
        });
        void loadData();
      }
    });

    return unsubscribe;
  }, [loadData]);

  const isEmpty = nodes.length === 0 && edges.length === 0;

  return {
    nodes,
    edges,
    loading,
    isEmpty,
    error,
    lastUpdated,
    refresh,
  };
};

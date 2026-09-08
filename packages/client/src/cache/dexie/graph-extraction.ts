/**
 * Graph Extraction Utilities
 *
 * Bridges relationship extraction from entity data with the PersistentGraph.
 * Extracts relationships and indexed edge properties from OpenAlex entities,
 * creating nodes and edges in the persistent graph.
 * @module cache/dexie/graph-extraction
 */

import {
  type AuthorPosition,
  type CompletenessStatus,
  type EntityType,
  type GraphEdgeInput,
  type GraphNodeInput,
  type PublicationVersion,
  RelationType as RT,
} from '@bibgraph/types';
import {
  extractEntityLabel,
  extractRelationships,
  normalizeOpenAlexId,
} from '@bibgraph/utils';

import type { StaticEntityType } from '../../internal/static-data-utils';
import { generateCacheKey, getEntityCacheDB } from './entity-cache-db';
import { type PersistentGraph } from './persistent-graph';

// ============================================================================
// Constants
// ============================================================================

/**
 * Fields that indicate partial entity data (has useful info beyond ID)
 */
const PARTIAL_FIELDS_BY_TYPE: Partial<Record<EntityType, string[]>> = {
  works: ['title', 'display_name', 'publication_year', 'type'],
  authors: ['display_name', 'orcid', 'works_count'],
  institutions: ['display_name', 'ror', 'type'],
  sources: ['display_name', 'issn', 'type'],
  topics: ['display_name', 'description'],
  publishers: ['display_name'],
  funders: ['display_name'],
  concepts: ['display_name', 'description'],
  keywords: ['display_name'],
  domains: ['display_name', 'description'],
  fields: ['display_name', 'description'],
  subfields: ['display_name', 'description'],
};

/**
 * Fields that indicate full entity data (all common fields present)
 */
const FULL_FIELDS_BY_TYPE: Partial<Record<EntityType, string[]>> = {
  works: ['authorships', 'cited_by_count', 'open_access', 'primary_location'],
  authors: ['affiliations', 'topics', 'cited_by_count'],
  institutions: ['geo', 'topics', 'works_count'],
  sources: ['topics', 'works_count', 'host_organization'],
  topics: ['field', 'domain', 'siblings'],
  publishers: ['works_count', 'sources_count'],
  funders: ['grants_count', 'works_count'],
  concepts: ['level', 'works_count'],
  keywords: ['works_count'],
  domains: ['fields'],
  fields: ['subfields', 'domain'],
  subfields: ['field', 'topics'],
};

// ============================================================================
// Completeness Determination
// ============================================================================

/**
 * Determine completeness status based on entity data fields
 *
 * - stub: Only has ID (or minimal deducible info)
 * - partial: Has some useful fields but not complete
 * - full: Has most/all expected fields for entity type
 * @param entityType
 * @param entityData
 */
export const determineCompleteness = (entityType: EntityType, entityData: Record<string, unknown>): CompletenessStatus => {
  // Get field requirements for this type
  const partialFields = PARTIAL_FIELDS_BY_TYPE[entityType] ?? [];
  const fullFields = FULL_FIELDS_BY_TYPE[entityType] ?? [];

  // Count how many partial fields are present
  const partialCount = partialFields.filter(
    (field) => entityData[field] !== undefined && entityData[field] !== null
  ).length;

  // Count how many full fields are present
  const fullCount = fullFields.filter(
    (field) => entityData[field] !== undefined && entityData[field] !== null
  ).length;

  // Determine completeness
  if (fullCount >= Math.ceil(fullFields.length * 0.7)) {
    // Has 70%+ of full fields
    return 'full';
  }
  if (partialCount >= Math.ceil(partialFields.length * 0.5)) {
    // Has 50%+ of partial fields
    return 'partial';
  }

  return 'stub';
};

// ============================================================================
// Edge Property Extraction
// ============================================================================

/**
 * Extract author position from authorship array index
 * OpenAlex convention: first=0, last=length-1, middle=everything else
 * @param authorshipIndex
 * @param totalAuthorships
 */
export const extractAuthorPosition = (authorshipIndex: number, totalAuthorships: number): AuthorPosition => {
  if (totalAuthorships <= 0) {
    return 'middle';
  }
  if (authorshipIndex === 0) {
    return 'first';
  }
  if (authorshipIndex === totalAuthorships - 1) {
    return 'last';
  }
  return 'middle';
};

/**
 * Extract corresponding author flag from authorship data
 * @param authorship
 */
export const extractIsCorresponding = (authorship: Record<string, unknown>): boolean | undefined => {
  const isCorresponding = authorship.is_corresponding;
  return typeof isCorresponding === 'boolean' ? isCorresponding : undefined;
};

/**
 * Extract open access status from work data
 * @param entityData
 */
export const extractIsOpenAccess = (entityData: Record<string, unknown>): boolean | undefined => {
  const openAccess = entityData.open_access as Record<string, unknown> | undefined;
  if (openAccess && typeof openAccess.is_oa === 'boolean') {
    return openAccess.is_oa;
  }

  // Also check primary_location for OA status
  const primaryLocation = entityData.primary_location as Record<string, unknown> | undefined;
  if (primaryLocation && typeof primaryLocation.is_oa === 'boolean') {
    return primaryLocation.is_oa;
  }

  return undefined;
};

/**
 * Map OpenAlex version strings to our PublicationVersion type
 */
const VERSION_MAP: Record<string, PublicationVersion> = {
  publishedVersion: 'published',
  acceptedVersion: 'accepted',
  submittedVersion: 'submitted',
};

/**
 * Extract publication version from location data
 * @param entityData
 */
export const extractVersion = (entityData: Record<string, unknown>): PublicationVersion | undefined => {
  const primaryLocation = entityData.primary_location as Record<string, unknown> | undefined;
  if (primaryLocation?.version) {
    const version = primaryLocation.version as string;
    return VERSION_MAP[version];
  }
  return undefined;
};

/**
 * Extract topic score from topic association
 * @param topic
 */
export const extractTopicScore = (topic: Record<string, unknown>): number | undefined => {
  const score = topic.score;
  return typeof score === 'number' ? score : undefined;
};

/**
 * Extract affiliation years from affiliation data
 * @param affiliation
 */
export const extractAffiliationYears = (affiliation: Record<string, unknown>): number[] | undefined => {
  const years = affiliation.years;
  if (Array.isArray(years) && years.length > 0 && years.every((y) => typeof y === 'number')) {
    return years as number[];
  }
  return undefined;
};

/**
 * Extract award ID from grant data
 * @param grant
 */
export const extractAwardId = (grant: Record<string, unknown>): string | undefined => {
  const awardId = grant.award_id;
  return typeof awardId === 'string' ? awardId : undefined;
};

// ============================================================================
// Cache Label Lookup
// ============================================================================

/**
 * Entity types that are cached in the entity cache
 */
const STATIC_ENTITY_TYPES = new Set<string>([
  'authors',
  'works',
  'sources',
  'institutions',
  'topics',
  'publishers',
  'funders',
  'concepts',
]);

/**
 * Check if an entity type is cacheable
 * @param entityType
 */
const isStaticEntityType = (entityType: string): entityType is StaticEntityType => STATIC_ENTITY_TYPES.has(entityType);

/**
 * Look up entity labels from the IndexedDB entity cache
 * Returns a map of entityId -> display_name for entities found in cache
 * @param entities
 */
const lookupLabelsFromCache = async (entities: Array<{ id: string; entityType: EntityType }>): Promise<Map<string, string>> => {
  const labelMap = new Map<string, string>();

  const database = getEntityCacheDB();
  if (!database) {
    return labelMap;
  }

  try {
    // Filter to only cacheable entity types and build lookup list
    const lookups = entities
      .filter((e) => isStaticEntityType(e.entityType))
      .map((e) => ({
        id: e.id,
        cacheKey: generateCacheKey(e.entityType as StaticEntityType, e.id),
      }));

    if (lookups.length === 0) {
      return labelMap;
    }

    // Query the cache for all entities in parallel
    const records = await Promise.all(
      lookups.map(async (lookup) => {
        const record = await database.entities.get(lookup.cacheKey);
        return { id: lookup.id, record };
      })
    );

    // Extract display_name from cached entity data
    for (const { id, record } of records) {
      if (record?.data) {
        try {
          const entityData = JSON.parse(record.data) as Record<string, unknown>;
          const displayName =
            (entityData.display_name as string) ?? (entityData.title as string);
          if (displayName) {
            labelMap.set(id, displayName);
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  } catch {
    // Ignore cache lookup errors - gracefully degrade to using IDs as labels
  }

  return labelMap;
};

// ============================================================================
// Main Extraction Functions
// ============================================================================

/**
 * Result of extracting and indexing relationships
 */
export interface ExtractionResult {
  /**
  Number of nodes added or updated
   */
  nodesProcessed: number;
  /**
  Number of new edges added
   */
  edgesAdded: number;
  /**
  Number of stub nodes created
   */
  stubsCreated: number;
  /**
  Stub nodes that were created (for incremental UI updates)
   */
  stubNodes: GraphNodeInput[];
  /**
  Edges that were created (for incremental UI updates)
   */
  edgeInputs: GraphEdgeInput[];
}

/**
 * Extract relationships from entity data and index them in the persistent graph
 *
 * This function:
 * 1. Creates/updates a node for the source entity
 * 2. Extracts relationships using the shared relationship-extractor
 * 3. Creates stub nodes for referenced entities
 * 4. Creates edges with indexed properties
 * @param graph
 * @param entityType
 * @param entityId
 * @param entityData
 */
export const extractAndIndexRelationships = async (graph: PersistentGraph, entityType: EntityType, entityId: string, entityData: Record<string, unknown>): Promise<ExtractionResult> => {
  const result: ExtractionResult = {
    nodesProcessed: 0,
    edgesAdded: 0,
    stubsCreated: 0,
    stubNodes: [],
    edgeInputs: [],
  };

  // Normalize the entity ID
  const normalizedId = normalizeOpenAlexId(entityId);

  // Determine completeness and create/update source node
  const completeness = determineCompleteness(entityType, entityData);
  const label = extractEntityLabel(entityType, normalizedId, entityData);

  const sourceNode: GraphNodeInput = {
    id: normalizedId,
    entityType,
    label,
    completeness,
    metadata: {
      publicationYear: entityData.publication_year,
      citedByCount: entityData.cited_by_count,
      worksCount: entityData.works_count,
    },
  };

  await graph.addNode(sourceNode);
  result.nodesProcessed++;

  // Extract relationships using shared extractor
  const relationships = extractRelationships(entityType, entityData);

  // Identify new nodes that need to be created
  const newNodeRels = relationships
    .map((rel) => ({ ...rel, targetId: normalizeOpenAlexId(rel.targetId) }))
    .filter((rel) => !graph.hasNode(rel.targetId));

  // Look up labels from cache for entities missing targetLabel
  const entitiesNeedingLabels = newNodeRels
    .filter((rel) => !rel.targetLabel)
    .map((rel) => ({ id: rel.targetId, entityType: rel.targetType }));

  const cachedLabels =
    entitiesNeedingLabels.length > 0
      ? await lookupLabelsFromCache(entitiesNeedingLabels)
      : new Map<string, string>();

  // Process each relationship with indexed edge properties
  const edgeInputs: GraphEdgeInput[] = [];
  const stubInputs: GraphNodeInput[] = [];

  for (const rel of relationships) {
    const targetId = normalizeOpenAlexId(rel.targetId);

    // Create stub node for target if it doesn't exist
    if (!graph.hasNode(targetId)) {
      // Priority: targetLabel from nested data > cached label > ID fallback
      const label = rel.targetLabel ?? cachedLabels.get(targetId) ?? targetId;
      stubInputs.push({
        id: targetId,
        entityType: rel.targetType,
        label,
        completeness: 'stub',
      });
      result.stubsCreated++;
    }

    // Create edge input with indexed properties
    const edgeInput = createEdgeInputWithProperties(
      normalizedId,
      targetId,
      rel.relationType,
      entityType,
      entityData,
      rel
    );

    edgeInputs.push(edgeInput);
  }

  // Batch add stub nodes
  if (stubInputs.length > 0) {
    await graph.addNodes(stubInputs);
    result.stubNodes = stubInputs;
  }

  // Batch add edges
  if (edgeInputs.length > 0) {
    result.edgesAdded = await graph.addEdges(edgeInputs);
    result.edgeInputs = edgeInputs;
  }

  return result;
};

/**
 * Create edge input with indexed properties based on relationship type
 * @param sourceId
 * @param targetId
 * @param relationType
 * @param entityType
 * @param entityData
 * @param relationship
 * @param relationship.targetId
 * @param relationship.targetType
 * @param relationship.relationType
 */
const createEdgeInputWithProperties = (sourceId: string, targetId: string, relationType: RT, entityType: EntityType, entityData: Record<string, unknown>, relationship: { targetId: string; targetType: EntityType; relationType: RT }): GraphEdgeInput => {
  const edgeInput: GraphEdgeInput = {
    source: sourceId,
    target: targetId,
    type: relationType,
    direction: 'outbound',
  };

  // Extract properties based on relationship type
  switch (relationType) {
    case RT.AUTHORSHIP:
      extractAuthorshipProperties(edgeInput, entityData, relationship.targetId);
      break;

    case RT.PUBLICATION:
      extractPublicationProperties(edgeInput, entityData);
      break;

    case RT.TOPIC:
    case RT.AUTHOR_RESEARCHES:
      extractTopicProperties(edgeInput, entityData, relationship.targetId);
      break;

    case RT.AFFILIATION:
      extractAffiliationProperties(edgeInput, entityData, relationship.targetId);
      break;

    case RT.FUNDED_BY:
      extractFundingProperties(edgeInput, entityData, relationship.targetId);
      break;

    // Other relationship types don't have special indexed properties
    default:
      break;
  }

  return edgeInput;
};

/**
 * Extract authorship-specific properties (authorPosition, isCorresponding)
 * @param edgeInput
 * @param entityData
 * @param authorId
 */
const extractAuthorshipProperties = (edgeInput: GraphEdgeInput, entityData: Record<string, unknown>, authorId: string): void => {
  const authorships = entityData.authorships as Array<Record<string, unknown>> | undefined;
  if (!authorships) {
    return;
  }

  const normalizedAuthorId = normalizeOpenAlexId(authorId);

  // Find the matching authorship entry
  const authorshipIndex = authorships.findIndex((auth) => {
    const author = auth.author as Record<string, unknown> | undefined;
    if (!author?.id) {
      return false;
    }
    return normalizeOpenAlexId(author.id as string) === normalizedAuthorId;
  });

  if (authorshipIndex !== -1) {
    const authorship = authorships[authorshipIndex];

    // Extract author position
    edgeInput.authorPosition = extractAuthorPosition(authorshipIndex, authorships.length);

    // Extract corresponding author flag
    edgeInput.isCorresponding = extractIsCorresponding(authorship);
  }
};

/**
 * Extract publication-specific properties (isOpenAccess, version)
 * @param edgeInput
 * @param entityData
 */
const extractPublicationProperties = (edgeInput: GraphEdgeInput, entityData: Record<string, unknown>): void => {
  edgeInput.isOpenAccess = extractIsOpenAccess(entityData);
  edgeInput.version = extractVersion(entityData);
};

/**
 * Extract topic-specific properties (score)
 * @param edgeInput
 * @param entityData
 * @param topicId
 */
const extractTopicProperties = (edgeInput: GraphEdgeInput, entityData: Record<string, unknown>, topicId: string): void => {
  const topics = entityData.topics as Array<Record<string, unknown>> | undefined;
  if (!topics) {
    return;
  }

  const normalizedTopicId = normalizeOpenAlexId(topicId);

  // Find the matching topic entry
  const topic = topics.find((t) => {
    if (!t.id) {
      return false;
    }
    return normalizeOpenAlexId(t.id as string) === normalizedTopicId;
  });

  if (topic) {
    edgeInput.score = extractTopicScore(topic);
  }
};

/**
 * Extract affiliation-specific properties (years)
 * @param edgeInput
 * @param entityData
 * @param institutionId
 */
const extractAffiliationProperties = (edgeInput: GraphEdgeInput, entityData: Record<string, unknown>, institutionId: string): void => {
  const affiliations = entityData.affiliations as Array<Record<string, unknown>> | undefined;
  if (!affiliations) {
    return;
  }

  const normalizedInstitutionId = normalizeOpenAlexId(institutionId);

  // Find the matching affiliation entry
  const affiliation = affiliations.find((aff) => {
    const institution = aff.institution as Record<string, unknown> | undefined;
    if (!institution?.id) {
      return false;
    }
    return normalizeOpenAlexId(institution.id as string) === normalizedInstitutionId;
  });

  if (affiliation) {
    edgeInput.years = extractAffiliationYears(affiliation);
  }
};

/**
 * Extract funding-specific properties (awardId)
 * @param edgeInput
 * @param entityData
 * @param funderId
 */
const extractFundingProperties = (edgeInput: GraphEdgeInput, entityData: Record<string, unknown>, funderId: string): void => {
  const grants = entityData.grants as Array<Record<string, unknown>> | undefined;
  if (!grants) {
    return;
  }

  const normalizedFunderId = normalizeOpenAlexId(funderId);

  // Find the matching grant entry
  const grant = grants.find((g) => {
    const funder = g.funder;
    if (!funder || typeof funder !== 'string') {
      return false;
    }
    return normalizeOpenAlexId(funder) === normalizedFunderId;
  });

  if (grant) {
    edgeInput.awardId = extractAwardId(grant);
  }
};

/**
 * Process multiple entities in batch
 * @param graph
 * @param entities
 */
export const extractAndIndexEntities = async (graph: PersistentGraph, entities: Array<{
    entityType: EntityType;
    entityId: string;
    entityData: Record<string, unknown>;
  }>): Promise<ExtractionResult> => {
  const totalResult: ExtractionResult = {
    nodesProcessed: 0,
    edgesAdded: 0,
    stubsCreated: 0,
    stubNodes: [],
    edgeInputs: [],
  };

  for (const entity of entities) {
    const result = await extractAndIndexRelationships(
      graph,
      entity.entityType,
      entity.entityId,
      entity.entityData
    );

    totalResult.nodesProcessed += result.nodesProcessed;
    totalResult.edgesAdded += result.edgesAdded;
    totalResult.stubsCreated += result.stubsCreated;
    totalResult.stubNodes.push(...result.stubNodes);
    totalResult.edgeInputs.push(...result.edgeInputs);
  }

  return totalResult;
};

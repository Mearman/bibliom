/**
 * Relationship Extraction Utilities
 *
 * Extracts relationships from OpenAlex entity data for graph visualization.
 * This logic is shared between catalogue sources and cache sources.
 * @module graph-sources/relationship-extractor
 */

import type { EntityType } from '@bibgraph/types';
import { RelationType as RT } from '@bibgraph/types';

import type { GraphSourceRelationship } from './types';

/**
 * Normalize an OpenAlex ID by extracting the short ID from a URL if needed.
 * e.g., "https://openalex.org/A5048491430" -> "A5048491430"
 * @param id
 */
export const normalizeOpenAlexId = (id: string): string => {
  if (!id) return id;
  // If it's a URL, extract just the ID part
  const urlMatch = id.match(/openalex\.org\/([ACDFIKPQSTW]\d+)$/i);
  if (urlMatch) {
    return urlMatch[1].toUpperCase();
  }
  // Already a short ID - normalize to uppercase
  return id.toUpperCase();
};

/**
 * Extract display label from entity data based on entity type
 * @param entityType
 * @param entityId
 * @param entityData
 */
export const extractEntityLabel = (entityType: EntityType, entityId: string, entityData: Record<string, unknown>): string => {
  switch (entityType) {
    case 'works':
      return (entityData.title as string) ?? (entityData.display_name as string) ?? entityId;
    default:
      return (entityData.display_name as string) ?? entityId;
  }
};

/**
 * Extract relationships from a Work entity
 * @param data
 */
export const extractWorkRelationships = (data: Record<string, unknown>): GraphSourceRelationship[] => {
  const relationships: GraphSourceRelationship[] = [];

  // Authorships -> Authors
  const authorships = data.authorships as
    | Array<{ author?: { id?: string; display_name?: string } }>
    | undefined;
  for (const auth of authorships ?? []) {
    if (auth.author?.id) {
      relationships.push({
        targetId: normalizeOpenAlexId(auth.author.id),
        targetType: 'authors',
        relationType: RT.AUTHORSHIP,
        targetLabel: auth.author.display_name,
      });
    }
  }

  // Primary location -> Source
  const primaryLocation = data.primary_location as
    | { source?: { id?: string; display_name?: string } }
    | undefined;
  if (primaryLocation?.source?.id) {
    relationships.push({
      targetId: normalizeOpenAlexId(primaryLocation.source.id),
      targetType: 'sources',
      relationType: RT.PUBLICATION,
      targetLabel: primaryLocation.source.display_name,
    });
  }

  // Referenced works (only have IDs, no display_name available)
  const referencedWorks = data.referenced_works as string[] | undefined;
  for (const referenceId of referencedWorks ?? []) {
    relationships.push({
      targetId: normalizeOpenAlexId(referenceId),
      targetType: 'works',
      relationType: RT.REFERENCE,
    });
  }

  // Topics
  const topics = data.topics as Array<{ id?: string; display_name?: string }> | undefined;
  for (const topic of topics ?? []) {
    if (topic.id) {
      relationships.push({
        targetId: normalizeOpenAlexId(topic.id),
        targetType: 'topics',
        relationType: RT.TOPIC,
        targetLabel: topic.display_name,
      });
    }
  }

  // Grants -> Funders
  const grants = data.grants as
    | Array<{ funder?: string; funder_display_name?: string }>
    | undefined;
  for (const grant of grants ?? []) {
    if (grant.funder) {
      relationships.push({
        targetId: normalizeOpenAlexId(grant.funder),
        targetType: 'funders',
        relationType: RT.FUNDED_BY,
        targetLabel: grant.funder_display_name,
      });
    }
  }

  return relationships;
};

/**
 * Extract relationships from an Author entity
 * @param data
 */
export const extractAuthorRelationships = (data: Record<string, unknown>): GraphSourceRelationship[] => {
  const relationships: GraphSourceRelationship[] = [];

  // Affiliations -> Institutions
  const affiliations = data.affiliations as
    | Array<{ institution?: { id?: string; display_name?: string } }>
    | undefined;
  for (const aff of affiliations ?? []) {
    if (aff.institution?.id) {
      relationships.push({
        targetId: normalizeOpenAlexId(aff.institution.id),
        targetType: 'institutions',
        relationType: RT.AFFILIATION,
        targetLabel: aff.institution.display_name,
      });
    }
  }

  // Topics
  const topics = data.topics as Array<{ id?: string; display_name?: string }> | undefined;
  for (const topic of topics ?? []) {
    if (topic.id) {
      relationships.push({
        targetId: normalizeOpenAlexId(topic.id),
        targetType: 'topics',
        relationType: RT.AUTHOR_RESEARCHES,
        targetLabel: topic.display_name,
      });
    }
  }

  return relationships;
};

/**
 * Extract relationships from an Institution entity
 * @param data
 */
export const extractInstitutionRelationships = (data: Record<string, unknown>): GraphSourceRelationship[] => {
  const relationships: GraphSourceRelationship[] = [];
  const institutionId = normalizeOpenAlexId((data.id as string) ?? '');

  // Topics
  const topics = data.topics as Array<{ id?: string; display_name?: string }> | undefined;
  for (const topic of topics ?? []) {
    if (topic.id) {
      relationships.push({
        targetId: normalizeOpenAlexId(topic.id),
        targetType: 'topics',
        relationType: RT.TOPIC,
        targetLabel: topic.display_name,
      });
    }
  }

  // Lineage -> Parent institutions (only IDs available, no display_name)
  const lineage = data.lineage as string[] | undefined;
  for (const parentId of lineage ?? []) {
    if (parentId !== institutionId && parentId !== data.id) {
      relationships.push({
        targetId: normalizeOpenAlexId(parentId),
        targetType: 'institutions',
        relationType: RT.LINEAGE,
      });
    }
  }

  return relationships;
};

/**
 * Extract relationships from a Source entity
 * @param data
 */
export const extractSourceRelationships = (data: Record<string, unknown>): GraphSourceRelationship[] => {
  const relationships: GraphSourceRelationship[] = [];

  // Host organization -> Publisher
  // OpenAlex provides host_organization (ID) and host_organization_name (display name)
  const hostOrg = data.host_organization as string | undefined;
  const hostOrgName = data.host_organization_name as string | undefined;
  if (hostOrg) {
    relationships.push({
      targetId: normalizeOpenAlexId(hostOrg),
      targetType: 'publishers',
      relationType: RT.HOST_ORGANIZATION,
      targetLabel: hostOrgName,
    });
  }

  // Topics
  const topics = data.topics as Array<{ id?: string; display_name?: string }> | undefined;
  for (const topic of topics ?? []) {
    if (topic.id) {
      relationships.push({
        targetId: normalizeOpenAlexId(topic.id),
        targetType: 'topics',
        relationType: RT.TOPIC,
        targetLabel: topic.display_name,
      });
    }
  }

  return relationships;
};

/**
 * Extract relationships from a Topic entity
 * @param data
 */
export const extractTopicRelationships = (data: Record<string, unknown>): GraphSourceRelationship[] => {
  const relationships: GraphSourceRelationship[] = [];

  // Field
  const field = data.field as { id?: string; display_name?: string } | undefined;
  if (field?.id) {
    relationships.push({
      targetId: normalizeOpenAlexId(field.id),
      targetType: 'fields',
      relationType: RT.TOPIC_PART_OF_FIELD,
      targetLabel: field.display_name,
    });
  }

  // Domain
  const domain = data.domain as { id?: string; display_name?: string } | undefined;
  if (domain?.id) {
    relationships.push({
      targetId: normalizeOpenAlexId(domain.id),
      targetType: 'domains',
      relationType: RT.FIELD_PART_OF_DOMAIN,
      targetLabel: domain.display_name,
    });
  }

  return relationships;
};

/**
 * Extract relationships from any entity based on its type
 * @param entityType
 * @param entityData
 */
export const extractRelationships = (entityType: EntityType, entityData: Record<string, unknown>): GraphSourceRelationship[] => {
  switch (entityType) {
    case 'works':
      return extractWorkRelationships(entityData);
    case 'authors':
      return extractAuthorRelationships(entityData);
    case 'institutions':
      return extractInstitutionRelationships(entityData);
    case 'sources':
      return extractSourceRelationships(entityData);
    case 'topics':
      return extractTopicRelationships(entityData);
    default:
      // Funders, publishers, concepts, keywords, domains, fields, subfields
      // don't have relationships we extract
      return [];
  }
};

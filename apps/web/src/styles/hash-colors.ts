/**
 * Hash-based color generation for BibGraph
 * Derives consistent colors from entity type and relationship type strings
 * Using HSL color space with deterministic hue calculation
 */

/**
 * Simple string hash function (djb2 algorithm)
 * Produces consistent hash values across different platforms
 * @param str
 */
const stringHash = (str: string): number => {
  let hash = 5381;
  for (let index = 0; index < str.length; index++) {
    hash = (hash * 33) ^ str.charCodeAt(index);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
};

/**
 * Generate hue from string hash
 * Returns a value between 0-360 for consistent color mapping
 * @param str
 */
const hashToHue = (str: string): number => {
  const hash = stringHash(str);

  // Convert hash to hue range (0-360)
  // Use modulo to ensure we get good distribution across the color wheel
  const hue = hash % 360;

  return hue;
};

/**
 * Convert HSL to hex color string
 * @param h
 * @param s
 * @param l
 */
const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

/**
 * Generate consistent color for entity type
 * Uses higher saturation and lightness for clear distinction
 * @param entityType
 */
export const getEntityTypeColor = (entityType: string): string => {
  // Use moderately high saturation for vibrant but professional colors
  const hue = hashToHue(entityType);
  const saturation = 65; // Professional but vibrant
  const lightness = 50;   // Good contrast for both light/dark themes

  return hslToHex(hue, saturation, lightness);
};

/**
 * Generate consistent color for relationship type
 * Uses slightly different saturation/lightness to distinguish from entity types
 * @param relationshipType
 */
export const getRelationshipTypeColor = (relationshipType: string): string => {
  const hue = hashToHue(relationshipType);
  const saturation = 75; // More saturated for relationship types
  const lightness = 45;   // Slightly darker for better visibility

  return hslToHex(hue, saturation, lightness);
};

/**
 * Generate muted colors for special states (xpac, warning, etc.)
 * @param baseString
 * @param stateType
 */
export const getSpecialStateColor = (baseString: string, stateType: 'muted' | 'warning' | 'highlight'): string => {
  const hue = hashToHue(baseString);

  switch (stateType) {
    case 'muted':
      return hslToHex(hue, 20, 60);  // Low saturation, higher lightness
    case 'warning':
      return hslToHex(45, 80, 55);   // Orange-amber hue for warnings
    case 'highlight':
      return hslToHex(hue, 85, 50);  // High saturation for emphasis
    default:
      return hslToHex(hue, 50, 50);
  }
};

/**
 * Pre-computed entity type colors using hash-based generation
 * These are cached for performance since entity types are fixed
 */
export const ENTITY_TYPE_COLORS = {
  works: getEntityTypeColor('works'),
  authors: getEntityTypeColor('authors'),
  sources: getEntityTypeColor('sources'),
  institutions: getEntityTypeColor('institutions'),
  topics: getEntityTypeColor('topics'),
  publishers: getEntityTypeColor('publishers'),
  funders: getEntityTypeColor('funders'),
  concepts: getEntityTypeColor('concepts'),
  keywords: getEntityTypeColor('keywords'),
  domains: getEntityTypeColor('domains'),
  fields: getEntityTypeColor('fields'),
  subfields: getEntityTypeColor('subfields'),
} as const;

/**
 * Pre-computed relationship type colors using hash-based generation
 */
export const RELATIONSHIP_TYPE_COLORS = {
  AUTHORSHIP: getRelationshipTypeColor('AUTHORSHIP'),
  REFERENCE: getRelationshipTypeColor('REFERENCE'),
  PUBLICATION: getRelationshipTypeColor('PUBLICATION'),
  TOPIC: getRelationshipTypeColor('TOPIC'),
  AFFILIATION: getRelationshipTypeColor('AFFILIATION'),
  HOST_ORGANIZATION: getRelationshipTypeColor('HOST_ORGANIZATION'),
  LINEAGE: getRelationshipTypeColor('LINEAGE'),
  FUNDED_BY: getRelationshipTypeColor('FUNDED_BY'),
  PUBLISHER_CHILD_OF: getRelationshipTypeColor('PUBLISHER_CHILD_OF'),
  WORK_HAS_KEYWORD: getRelationshipTypeColor('WORK_HAS_KEYWORD'),
  AUTHOR_RESEARCHES: getRelationshipTypeColor('AUTHOR_RESEARCHES'),
  INSTITUTION_LOCATED_IN: getRelationshipTypeColor('INSTITUTION_LOCATED_IN'),
  FUNDER_LOCATED_IN: getRelationshipTypeColor('FUNDER_LOCATED_IN'),
  TOPIC_PART_OF_FIELD: getRelationshipTypeColor('TOPIC_PART_OF_FIELD'),
  RELATED_TO: getRelationshipTypeColor('RELATED_TO'),
} as const;

/**
 * Special state colors derived from hash-based generation
 * Maintains the same structure as the original COLORS object
 */
export const SPECIAL_STATE_COLORS = {
  // Standard work colors - use academic entity colors
  standard: {
    fill: getSpecialStateColor('works', 'highlight'),
    stroke: getSpecialStateColor('works', 'highlight'),
  },

  // Xpac work colors (muted, desaturated)
  xpac: {
    fill: getSpecialStateColor('xpac', 'muted'),
    stroke: getSpecialStateColor('xpac', 'muted'),
  },

  // Warning indicators for unverified authors
  warning: {
    fill: getSpecialStateColor('warning', 'warning'),
    stroke: getSpecialStateColor('warning', 'warning'),
    tint: getSpecialStateColor('warning', 'muted'), // Very light tint
  },
} as const;
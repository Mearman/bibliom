/**
 * Client-specific types only
 * All entity types should be imported directly from `@bibgraph/types` where needed
 */

// Note: Core types (OpenAlexId, OpenAlexError, OpenAlexResponse, AutocompleteResult)
// should be imported directly from `@bibgraph/types` where needed

// Note: AutocompleteOptions is defined in utils/autocomplete.ts (canonical source)
// Import from there directly to avoid barrel file re-export duplicates

/**
 * OpenAlex Data Version parameter
 * - undefined: Uses v2 (default)
 * - '1': Explicitly request v1 (temporary, deprecated Dec 2025)
 * - '2': Explicitly request v2
 */
export type DataVersion = '1' | '2' | undefined;

/**
 * OpenAlex API query parameters for Walden support
 */
export interface OpenAlexQueryParams {
  /**
  Request Data Version 1 (temporary support through Nov 2025)
   */
  'data-version'?: '1';
  /**
  Include xpac works (190M non-traditional outputs)
   */
  include_xpac?: boolean;
}

// Note: OpenAlexClientConfig is exported from ../client directly
// Don't re-export here to avoid barrel file duplicate export errors
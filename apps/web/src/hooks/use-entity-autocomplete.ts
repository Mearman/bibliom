/**
 * Shared hook for entity-specific autocomplete functionality
 *
 * Encapsulates common logic used across all entity autocomplete pages:
 * - URL query parameter synchronization
 * - Query state management
 * - API call with React Query
 * - URL prettification (decoding encoded characters)
 */

import { cachedOpenAlex } from "@bibgraph/client";
import type { AutocompleteResult, EntityType } from "@bibgraph/types";
import { ENTITY_METADATA } from "@bibgraph/types";
import { logger } from "@bibgraph/utils";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

export interface AutocompleteSearchParams {
  q?: string;
  search?: string;
  filter?: string;
}

export interface UseEntityAutocompleteOptions {
  /**
  The entity type for this autocomplete
   */
  entityType: EntityType;
  /**
  URL search params from the router
   */
  urlSearch: AutocompleteSearchParams;
  /**
  Route path for URL updates (e.g., "/autocomplete/works")
   */
  routePath: string;
}

export interface UseEntityAutocompleteResult {
  /**
  Current search query
   */
  query: string;
  /**
  Update search query and URL
   */
  handleSearch: (value: string) => void;
  /**
  Autocomplete results
   */
  results: AutocompleteResult[];
  /**
  Loading state
   */
  isLoading: boolean;
  /**
  Error state
   */
  error: Error | null;
  /**
  Filter from URL
   */
  filter: string | undefined;
}

/**
 * Map entity types to their autocomplete API methods
 */
type AutocompleteMethod = (query: string) => Promise<AutocompleteResult[]>;

const getAutocompleteMethod = (entityType: EntityType): AutocompleteMethod | null => {
  const methodMap: Partial<Record<EntityType, AutocompleteMethod>> = {
    works: (q) => cachedOpenAlex.client.works.autocomplete(q),
    authors: (q) => cachedOpenAlex.client.authors.autocomplete(q),
    sources: (q) => cachedOpenAlex.client.sources.autocomplete(q),
    institutions: (q) => cachedOpenAlex.client.institutions.autocomplete(q),
    concepts: (q) => cachedOpenAlex.client.concepts.autocomplete(q),
    publishers: (q) => cachedOpenAlex.client.publishers.autocomplete(q),
    funders: (q) => cachedOpenAlex.client.funders.autocomplete(q),
    topics: (q) => cachedOpenAlex.client.topics.autocomplete(q),
  };

  return methodMap[entityType] ?? null;
};

/**
 * Shared hook for entity-specific autocomplete pages
 * @param root0
 * @param root0.entityType
 * @param root0.urlSearch
 * @param root0.routePath
 */
export const useEntityAutocomplete = ({
  entityType,
  urlSearch,
  routePath,
}: UseEntityAutocompleteOptions): UseEntityAutocompleteResult => {
  const [query, setQuery] = useState(urlSearch.q || urlSearch.search || "");
  const metadata = ENTITY_METADATA[entityType];

  // Prettify URL by decoding encoded characters
  useEffect(() => {
    if (typeof window === "undefined") {
    	return;
    }

    const currentHash = window.location.hash;
    const decodedHash = decodeURIComponent(currentHash);
    if (currentHash !== decodedHash) {
      window.history.replaceState(null, "", decodedHash);
    }
  }, []);

  // Sync query state with URL params
  useEffect(() => {
    const newQuery = urlSearch.q || urlSearch.search || "";
    if (newQuery !== query) {
      setQuery(newQuery);
    }
  }, [urlSearch.q, urlSearch.search, query]);

  // Fetch autocomplete results
  const {
    data: results = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["autocomplete", entityType, query, metadata.displayName],
    queryFn: async () => {
      if (!query.trim()) return [];

      const autocompleteMethod = getAutocompleteMethod(entityType);
      if (!autocompleteMethod) {
        logger.warn("autocomplete", `No autocomplete method for entity type: ${entityType}`);
        return [];
      }

      logger.debug("autocomplete", `Fetching ${metadata.displayName.toLowerCase()} suggestions`, { query });

      const response = await autocompleteMethod(query);

      logger.debug("autocomplete", `${metadata.displayName} suggestions received`, {
        count: response.length,
      });

      return response;
    },
    enabled: query.trim().length > 0,
    staleTime: 30_000,
  });

  // Handle search input changes
  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);

      // Build URL params
      const parameterParts: string[] = [];
      if (value) {
        parameterParts.push(`q=${encodeURIComponent(value)}`);
      }
      if (urlSearch.filter) {
        parameterParts.push(`filter=${encodeURIComponent(urlSearch.filter)}`);
      }

      const newHash = parameterParts.length > 0
        ? `#${routePath}?${parameterParts.join("&")}`
        : `#${routePath}`;
      window.history.replaceState(null, "", newHash);
    },
    [routePath, urlSearch.filter]
  );

  return {
    query,
    handleSearch,
    results,
    isLoading,
    error: error as Error | null,
    filter: urlSearch.filter,
  };
};

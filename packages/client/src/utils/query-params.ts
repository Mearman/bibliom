/**
 * Query parameter utilities
 */

import type { QueryParams } from "@bibgraph/types";

/**
 * Convert typed query parameters to base QueryParams
 * This is a generic utility for converting specific query param types to the base type
 * @param params
 */
export const toQueryParams = <T extends Record<string, unknown>>(params: T): QueryParams => {
  const result: QueryParams = {};

  // Copy all properties
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
};

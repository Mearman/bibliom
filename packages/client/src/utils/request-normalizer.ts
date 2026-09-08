/**
 * Request normalization utilities for OpenAlex API requests
 * Provides consistent request representation for caching and visit tracking
 */

import { isRecord } from "@bibgraph/types";

/**
 * Simple synchronous hash function that works in both browser and Node.js
 * Uses FNV-1a hash algorithm (fast, deterministic, collision-resistant for our use case)
 * @param str
 */
const simpleHash = (str: string): string => {
  let hash = 2_166_136_261; // FNV offset basis

  for (let index = 0; index < str.length; index++) {
    hash ^= str.charCodeAt(index);
    // FNV prime: 16777619
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  // Convert to unsigned 32-bit and then to hex
  const unsigned = hash >>> 0;
  return unsigned.toString(16).padStart(8, "0");
};

export interface OpenAlexRequest {
  /**
  Normalized endpoint path (e.g., "/works", "/authors/A123")
   */
  endpoint: string;

  /**
  Query parameters in canonical form
   */
  params: {
    select?: string[];
    filter?: Record<string, unknown>;
    search?: string;
    sort?: string;
    page?: number;
    per_page?: number;
    seed?: number;
    [key: string]: unknown;
  };
}

export interface NormalizedRequest {
  /**
  Cache key derived from request (used for cache lookups)
   */
  cacheKey: string;

  /**
  Original request
   */
  request: OpenAlexRequest;

  /**
  Request hash for deduplication (short hash for comparisons)
   */
  hash: string;
}

/**
 * Normalize an object's keys and values recursively for consistent comparison
 * @param obj
 */
const normalizeObject = (obj: Record<string, unknown>): Record<string, unknown> => Object.keys(obj)
    .sort()
    .reduce((accumulator, key) => {
      const value = obj[key];

      if (Array.isArray(value)) {
        // Sort array elements for consistent ordering
        accumulator[key] = [...value].sort();
      } else if (isRecord(value)) {
        accumulator[key] = normalizeObject(value);
      } else {
        accumulator[key] = value;
      }

      return accumulator;
    }, {});

/**
 * Convert params object to URL query string
 * @param params
 */
const parametersToQueryString = (params: Record<string, unknown>): string => {
  const entries: [string, string][] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      entries.push([key, value.join(",")]);
    } else if (typeof value === "object") {
      // For complex objects (like filters), serialize to JSON
      entries.push([key, JSON.stringify(value)]);
    } else {
      entries.push([key, String(value)]);
    }
  }

  return new URLSearchParams(entries).toString();
};

/**
 * Normalize an OpenAlex API request for consistent caching and comparison
 *
 * This function:
 * - Sorts all parameter keys for consistent ordering
 * - Normalizes arrays by sorting their elements
 * - Recursively normalizes nested objects
 * - Generates a cache key suitable for storage lookups
 * - Creates a short hash for quick deduplication checks
 * @param request - The OpenAlex API request to normalize
 * @returns Normalized request with cache key and hash
 */
export const normalizeRequest = (request: OpenAlexRequest): NormalizedRequest => {
  // Normalize the params object
  const normalizedParameters = normalizeObject(request.params);

  const normalized: OpenAlexRequest = {
    endpoint: request.endpoint,
    params: normalizedParameters,
  };

  // Generate cache key from normalized request
  const queryString = parametersToQueryString(normalizedParameters);
  const cacheKey = queryString
    ? `${normalized.endpoint}?${queryString}`
    : normalized.endpoint;

  // Generate short hash for deduplication using simple hash
  const hash = simpleHash(JSON.stringify(normalized));

  return {
    cacheKey,
    request: normalized,
    hash,
  };
};

/**
 * Compare two normalized requests for equality
 * @param a
 * @param b
 */
export const requestsEqual = (a: NormalizedRequest, b: NormalizedRequest): boolean => a.hash === b.hash;

/**
 * Check if a request is a duplicate of a recent request (within time window)
 * @param request
 * @param recentRequests
 * @param windowMs
 */
export const isDuplicateRequest = (request: NormalizedRequest, recentRequests: Array<{ request: NormalizedRequest; timestamp: number }>, windowMs = 1000): boolean => {
  const now = Date.now();

  return recentRequests.some(
    (recent) =>
      requestsEqual(request, recent.request) &&
      now - recent.timestamp < windowMs,
  );
};

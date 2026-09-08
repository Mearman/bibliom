/**
 * URL Decoding Utilities
 *
 * Utilities for handling URL-encoded entity IDs, especially external IDs
 * with special characters like slashes in protocols (https://, ror:, etc.)
 */

/**
 * Decode a URL-encoded entity ID and fix collapsed protocol slashes
 *
 * TanStack Router collapses consecutive slashes in URL paths, so
 * https://orcid.org becomes https:/orcid.org after routing.
 * This function decodes the parameter and fixes the collapsed slashes.
 * @param encodedId - The URL-encoded entity ID from route params
 * @returns Decoded ID with fixed protocol slashes
 * @example
 * ```typescript
 * // Input: "https%3A%2Forcid.org%2F0000-0002-1298-3089"
 * // Output: "https://orcid.org/0000-0002-1298-3089"
 * const id = decodeEntityId(rawId);
 * ```
 */
export const decodeEntityId = (encodedId: string | undefined): string | undefined => {
  if (!encodedId) {
    return encodedId;
  }

  // Handle double-encoded slashes first (%252F -> %2F)
  // This is needed because we double-encode slashes in the openalex-url route
  // to prevent TanStack Router from collapsing them
  const processedId = encodedId.replaceAll(/%252F/gi, '%2F');

  // Decode URL encoding
  let decodedId = decodeURIComponent(processedId);

  // Fix collapsed protocol slashes (https:/ -> https://)
  // This happens when TanStack Router processes splat routes with forward slashes
  // and normalizes consecutive slashes during parsing
  if (/^https?:\//i.test(decodedId) && !/^https?:\/\//i.test(decodedId)) {
    decodedId = decodedId.replace(/^(https?:\/?)/, "$1/");
  }

  // Also fix ror:/ -> ror:// (fallback for legacy URLs)
  if (/^ror:\//i.test(decodedId) && !/^ror:\/\//i.test(decodedId)) {
    decodedId = decodedId.replace(/^(ror:\/?)/, "$1/");
  }

  return decodedId;
};

/**
 * Decode and fix entity ID, ensuring it's never undefined
 * @param encodedId - The URL-encoded entity ID from route params
 * @param fallback - Fallback value if ID is undefined (default: empty string)
 * @returns Decoded ID with fixed protocol slashes, never undefined
 */
export const decodeEntityIdOrDefault = (encodedId: string | undefined, fallback: string = ""): string => decodeEntityId(encodedId) ?? fallback;

/**
 * Serialize TanStack Router's parsed search object to a URL query string
 *
 * TanStack Router parses query strings into objects (e.g., { q: "test", page: 1 }).
 * This function converts them back to URL query strings for storage or display.
 * @param search - The parsed search object from TanStack Router's useLocation()
 * @returns URL query string with leading "?" or empty string if no params
 * @example
 * ```typescript
 * const location = useLocation();
 * // location.search = { q: "test", page: 1 }
 * const queryString = serializeSearch(location.search);
 * // Returns: "?q=test&page=1"
 *
 * const fullUrl = location.pathname + serializeSearch(location.search);
 * // Returns: "/authors?q=test&page=1"
 * ```
 */
export const serializeSearch = (search: Record<string, unknown> | string): string => {
  // Handle case where search is already a string (fallback/test environments)
  if (typeof search === 'string') {
    return search.startsWith('?') ? search : (search ? `?${search}` : '');
  }

  // Handle empty or undefined search object
  if (!search || Object.keys(search).length === 0) {
    return '';
  }

  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined && value !== null && value !== '') {
      parameters.set(key, String(value));
    }
  }

  const queryString = parameters.toString();
  return queryString ? `?${queryString}` : '';
};

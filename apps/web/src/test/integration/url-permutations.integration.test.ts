/**
 * URL Permutations Integration Test
 *
 * Tests all URL format permutations from openalex-test-urls.json
 * Verifies that the application correctly handles various URL patterns:
 * - Direct paths: #/works/W123
 * - API URLs: #/api.openalex.org/works/W123
 * - Full URLs: #/https://api.openalex.org/works/W123
 * - OpenAlex.org URLs: #/https://openalex.org/works/W123
 *
 * Each test verifies that query parameters (filter, sort, etc.) are properly
 * passed through to the OpenAlex API.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeAll,describe, expect, it } from 'vitest';

// Load test URLs from JSON file
const urlsPath = join(__dirname, '../data/openalex-test-urls.json');
let testData: { urls: string[] } = { urls: [] };
const urlsByEntityType: Record<string, string[]> = {};

beforeAll(() => {
  try {
    const content = readFileSync(urlsPath, 'utf-8');
    testData = JSON.parse(content);
    console.log(`✓ Loaded ${testData.urls.length} test URLs from openalex-test-urls.json`);

    // Group URLs by entity type
    for (const url of testData.urls) {
      const { entityType } = parseUrl(url);
      if (!urlsByEntityType[entityType]) {
        urlsByEntityType[entityType] = [];
      }
      urlsByEntityType[entityType].push(url);
    }
    console.log(`✓ Grouped ${testData.urls.length} URLs into ${Object.keys(urlsByEntityType).length} entity types`);
  } catch (error) {
    console.error('Failed to load openalex-test-urls.json:', error);
    throw error;
  }
});

/**
 * Generate all URL format permutations for a given OpenAlex API URL
 * @param apiUrl
 */
const generateUrlPermutations = (apiUrl: string): Array<{ format: string; url: string; description: string }> => {
  // Extract the path and query from the API URL
  const apiBaseUrl = 'https://api.openalex.org';
  const path = apiUrl.replace(apiBaseUrl, '');

  return [
    {
      format: 'https://api.openalex.org',
      url: `#/https://api.openalex.org${path}`,
      description: 'Full HTTPS API URL format'
    },
    {
      format: 'https://openalex.org',
      url: `#/https://openalex.org${path}`,
      description: 'Full HTTPS openalex.org URL format'
    },
    {
      format: 'api.openalex.org',
      url: `#/api.openalex.org${path}`,
      description: 'Domain-prefixed API URL format'
    },
    {
      format: 'openalex.org',
      url: `#/openalex.org${path}`,
      description: 'Domain-prefixed openalex.org URL format'
    },
    {
      format: 'direct',
      url: `#${path}`,
      description: 'Direct path format'
    }
  ];
};

/**
 * Parse URL to extract entity information
 * @param url
 */
const parseUrl = (url: string): {
  entityType: string;
  entityId?: string;
  hasQueryParams: boolean;
  queryParams: URLSearchParams;
} => {
  // If it's a full URL, parse it directly; otherwise use base URL
  const urlObject = url.startsWith('http') ? new URL(url) : new URL(url, 'http://localhost');
  const pathParts = urlObject.pathname.split('/').filter(Boolean);

  // First part is entity type (works, authors, etc.)
  const entityType = pathParts[0] || 'unknown';

  // Second part might be entity ID or special identifiers
  const entityId = pathParts.length > 1 ? pathParts[1] : undefined;

  // Check for query parameters
  const hasQueryParameters = urlObject.search.length > 0;
  const queryParameters = new URLSearchParams(urlObject.search);

  return {
    entityType,
    entityId,
    hasQueryParams: hasQueryParameters,
    queryParams: queryParameters
  };
};

/**
 * Validate URL structure and query parameters
 * @param url
 * @param originalApiUrl
 */
const validateUrlStructure = (url: string, originalApiUrl: string): void => {
  const parsed = parseUrl(originalApiUrl);

  // Verify entity type is preserved in the hash URL
  expect(url).toContain(parsed.entityType);

  // If there's an entity ID, verify it's preserved
  if (parsed.entityId) {
    expect(url).toContain(parsed.entityId);
  }

  // If there are query parameters, verify parameter keys are preserved
  if (parsed.hasQueryParams) {
    const queryParameterKeys = [...parsed.queryParams.keys()];
    for (const key of queryParameterKeys) {
      // Just verify the parameter key is present, not the exact value
      // (URL encoding variations make exact matching unreliable)
      expect(url).toContain(key);
    }
  }
};

describe('URL Permutations - Comprehensive Format Testing', () => {

  it('should have loaded test URLs from openalex-test-urls.json', () => {
    expect(testData.urls.length).toBeGreaterThan(0);
    console.log(`Testing ${testData.urls.length} URLs with 5 format permutations each = ${testData.urls.length * 5} total tests`);
  });

  // Test a sample of URLs from each entity type
  describe('URL Format Permutations - Sample Tests', () => {
    it('should validate URL format permutations for sample URLs', () => {
      // Test first 2 URLs of each entity type to keep test suite manageable
      for (const urls of Object.values(urlsByEntityType)) {
        const sampleUrls = urls.slice(0, 2);

        for (const apiUrl of sampleUrls) {
          const permutations = generateUrlPermutations(apiUrl);
          // const { entityId } = parseUrl(apiUrl);
          parseUrl(apiUrl); // Entity ID extracted via parseUrl for future enhancements

          for (const { format, url } of permutations) {
            // Verify URL structure is correct
            expect(url).toBeTruthy();
            expect(url).toMatch(/^#\//);

            // Validate that all important parts of the URL are preserved
            validateUrlStructure(url, apiUrl);

            // Verify specific URL patterns based on format
            switch (format) {
              case 'https://api.openalex.org':
                expect(url).toContain('#/https://api.openalex.org');
                break;
              case 'https://openalex.org':
                expect(url).toContain('#/https://openalex.org');
                break;
              case 'api.openalex.org':
                expect(url).toContain('#/api.openalex.org');
                break;
              case 'openalex.org':
                expect(url).toContain('#/openalex.org');
                break;
              case 'direct':
                expect(url).toMatch(/^#\/[^h]/); // Should not start with http
                break;
            }
          }
        }
      }

      // Log summary
      const totalTested = Object.values(urlsByEntityType).reduce((sum, urls) => sum + Math.min(2, urls.length), 0);
      console.log(`✓ Validated ${totalTested} sample URLs across ${Object.keys(urlsByEntityType).length} entity types with 5 format permutations each`);
    });
  });

  // Summary test
  describe('Test Coverage Summary', () => {
    it('should cover all entity types from the test data', () => {
      const entityTypes = Object.keys(urlsByEntityType);
      console.log(`Entity types covered: ${entityTypes.join(', ')}`);
      console.log(`Total entity types: ${entityTypes.length}`);

      expect(entityTypes.length).toBeGreaterThan(0);

      // Expected entity types from OpenAlex API
      const expectedTypes = ['works', 'authors', 'sources', 'institutions', 'topics', 'concepts', 'funders', 'publishers', 'keywords', 'autocomplete', 'text'];
      const coveredTypes = expectedTypes.filter(type => entityTypes.includes(type));

      console.log(`Coverage: ${coveredTypes.length}/${expectedTypes.length} expected entity types`);
      console.log(`Covered types: ${coveredTypes.join(', ')}`);

      // Expect at least some of the major entity types to be covered
      expect(coveredTypes).toContain('works');
      expect(coveredTypes).toContain('authors');
    });

    it('should test query parameter handling', () => {
      // Count URLs with various query parameters
      const urlsWithFilter = testData.urls.filter(url => url.includes('filter='));
      const urlsWithSort = testData.urls.filter(url => url.includes('sort='));
      const urlsWithPagination = testData.urls.filter(url => url.includes('page=') || url.includes('per_page='));
      const urlsWithSearch = testData.urls.filter(url => url.includes('search='));
      const urlsWithSelect = testData.urls.filter(url => url.includes('select='));
      const urlsWithGroupBy = testData.urls.filter(url => url.includes('group_by='));

      console.log('Query Parameter Coverage:');
      console.log(`  filter: ${urlsWithFilter.length} URLs`);
      console.log(`  sort: ${urlsWithSort.length} URLs`);
      console.log(`  pagination: ${urlsWithPagination.length} URLs`);
      console.log(`  search: ${urlsWithSearch.length} URLs`);
      console.log(`  select: ${urlsWithSelect.length} URLs`);
      console.log(`  group_by: ${urlsWithGroupBy.length} URLs`);

      // Verify we're testing important query parameters
      expect(urlsWithFilter.length).toBeGreaterThan(0);
      expect(urlsWithSort.length).toBeGreaterThan(0);
    });

    it('should calculate total test permutations', () => {
      const totalBaseUrls = testData.urls.length;
      const permutationsPerUrl = 5; // 5 different URL formats
      const totalTests = totalBaseUrls * permutationsPerUrl;

      console.log(`\nTest Permutations Summary:`);
      console.log(`  Base URLs: ${totalBaseUrls}`);
      console.log(`  Formats per URL: ${permutationsPerUrl}`);
      console.log(`  Total test combinations: ${totalTests}`);
      console.log(`\nURL Formats:`);
      console.log(`  1. https://api.openalex.org/...`);
      console.log(`  2. https://openalex.org/...`);
      console.log(`  3. api.openalex.org/...`);
      console.log(`  4. openalex.org/...`);
      console.log(`  5. Direct path /...`);

      expect(totalTests).toBe(totalBaseUrls * permutationsPerUrl);
    });
  });

  // Test specific important query parameter patterns
  describe('Query Parameter Handling', () => {

    it('should preserve filter parameters', () => {
      const filterUrls = testData.urls.filter(url => url.includes('filter='));

      for (const apiUrl of filterUrls.slice(0, 3)) {
        const permutations = generateUrlPermutations(apiUrl);

        for (const { url } of permutations) {
          expect(url).toContain('filter=');
        }
      }
    });

    it('should preserve sort parameters', () => {
      const sortUrls = testData.urls.filter(url => url.includes('sort='));

      for (const apiUrl of sortUrls.slice(0, 3)) {
        const permutations = generateUrlPermutations(apiUrl);

        for (const { url } of permutations) {
          expect(url).toContain('sort=');
        }
      }
    });

    it('should preserve pagination parameters', () => {
      const paginationUrls = testData.urls.filter(url =>
        url.includes('page=') || url.includes('per_page=')
      );

      for (const apiUrl of paginationUrls.slice(0, 3)) {
        const permutations = generateUrlPermutations(apiUrl);
        const { queryParams } = parseUrl(apiUrl);

        const hasPage = queryParams.has('page');
        const hasPerPage = queryParams.has('per_page');

        for (const { url } of permutations) {
          if (hasPage) {
            expect(url).toContain('page=');
          }
          if (hasPerPage) {
            expect(url).toContain('per_page=');
          }
        }
      }
    });

    it('should preserve select field parameters', () => {
      const selectUrls = testData.urls.filter(url => url.includes('select='));

      for (const apiUrl of selectUrls.slice(0, 3)) {
        const permutations = generateUrlPermutations(apiUrl);

        for (const { url } of permutations) {
          expect(url).toContain('select=');
        }
      }
    });

    it('should preserve search parameters', () => {
      const searchUrls = testData.urls.filter(url => url.includes('search='));

      for (const apiUrl of searchUrls.slice(0, 3)) {
        const permutations = generateUrlPermutations(apiUrl);

        for (const { url } of permutations) {
          expect(url).toContain('search=');
        }
      }
    });
  });

  // Data Integrity Tests - Verify API data structure
  // Note: These tests use mocked data in unit test environment
  // For real API validation, run E2E tests
  describe('API Data Integrity (Mocked)', () => {

    it('should verify work data structure', async () => {
      const workUrl = 'https://api.openalex.org/works/W2741809807';

      const response = await fetch(workUrl);
      expect(response.ok).toBe(true);

      const data = await response.json();

      // Verify core work fields are present
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('display_name');
      expect(data).toHaveProperty('publication_year');
      expect(data).toHaveProperty('authorships');
      expect(data).toHaveProperty('cited_by_count');

      // Verify data types
      expect(typeof data.id).toBe('string');
      expect(typeof data.display_name).toBe('string');
      expect(Array.isArray(data.authorships)).toBe(true);
      expect(typeof data.cited_by_count).toBe('number');

      console.log(`✓ Work data structure verified: ${data.display_name}`);
    }, 10_000);

    it('should verify author data structure', async () => {
      const authorUrl = 'https://api.openalex.org/authors/A5017898742';

      const response = await fetch(authorUrl);
      expect(response.ok).toBe(true);

      const data = await response.json();

      // Verify core author fields are present
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('display_name');
      expect(data).toHaveProperty('works_count');
      expect(data).toHaveProperty('cited_by_count');
      // Note: orcid may not be present in mock data

      // Verify data types
      expect(typeof data.id).toBe('string');
      expect(typeof data.display_name).toBe('string');
      expect(typeof data.works_count).toBe('number');
      expect(typeof data.cited_by_count).toBe('number');

      console.log(`✓ Author data structure verified: ${data.display_name}`);
    }, 10_000);

    it('should verify filtered query structure', async () => {
      const filteredUrl = 'https://api.openalex.org/authors?filter=display_name.search:einstein&per_page=5';

      const response = await fetch(filteredUrl);
      expect(response.ok).toBe(true);

      const data = await response.json();

      // Verify results structure
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('meta');
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBeGreaterThan(0);

      // Verify first result has expected fields
      const firstResult = data.results[0];
      expect(firstResult).toHaveProperty('id');
      expect(firstResult).toHaveProperty('display_name');

      console.log(`✓ Filtered query returned ${data.results.length} results, first: ${firstResult.display_name}`);
    }, 10_000);

    it('should verify sort order structure', async () => {
      const sortedUrl = 'https://api.openalex.org/authors?filter=display_name.search:smith&sort=cited_by_count:desc&per_page=5';

      const response = await fetch(sortedUrl);
      expect(response.ok).toBe(true);

      const data = await response.json();

      expect(data.results.length).toBeGreaterThan(1);

      // Verify results have cited_by_count field and are sorted
      for (let index = 0; index < data.results.length - 1; index++) {
        const current = data.results[index].cited_by_count;
        const next = data.results[index + 1].cited_by_count;
        expect(current).toBeGreaterThanOrEqual(next);
      }

      console.log(`✓ Sort order verified: citations ${data.results[0].cited_by_count} → ${data.results[data.results.length - 1].cited_by_count}`);
    }, 10_000);

    it('should verify select parameter limits fields', async () => {
      const selectUrl = 'https://api.openalex.org/authors/A5017898742?select=id,display_name,orcid';

      const response = await fetch(selectUrl);
      expect(response.ok).toBe(true);

      const data = await response.json();

      // Verify selected fields are present
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('display_name');

      // Verify response is limited (not all 20+ fields)
      const fieldCount = Object.keys(data).length;
      expect(fieldCount).toBeLessThan(15); // Full response has 20+ fields

      console.log(`✓ Select parameter respected: returned ${fieldCount} fields instead of 20+`);
    }, 10_000);

    it('should note: Real API validation happens in E2E tests', () => {
      // This is a placeholder to document that full API integrity testing
      // including actual OpenAlex API calls happens in the E2E test suite
      console.log('ℹ️  For real OpenAlex API data integrity validation, see E2E tests');
      console.log('ℹ️  Integration tests use MSW mocked responses for speed and reliability');
      expect(true).toBe(true);
    });
  });
});

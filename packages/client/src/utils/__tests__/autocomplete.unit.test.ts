/**
 * Unit tests for AutocompleteApi
 * Tests the autocomplete functionality without making real API calls
 */

import type { EntityType } from "@bibgraph/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OpenAlexBaseClient } from "../../client";
import { CompleteAutocompleteApi } from "../autocomplete";

// Mock client
const createMockClient = () => ({
  get: vi.fn(),
  getResponse: vi.fn(),
  config: {
    baseUrl: "https://api.openalex.org",
    userEmail: "test@example.com",
  },
});

// Mock autocomplete response
const createMockAutocompleteResponse = (
  count: number = 3,
  entityType: EntityType = "works",
) => ({
  results: Array.from({ length: count }, (_, index) => ({
    id: `https://openalex.org/${entityType[0].toUpperCase()}${index + 1}`,
    display_name: `Test ${entityType} ${index + 1}`,
    hint: `Hint for ${entityType} ${index + 1}`,
    cited_by_count: 100 - index * 10,
    works_count: entityType === "authors" ? 50 - index * 5 : undefined,
    entity_type: entityType,
    external_id: `external-${index + 1}`,
  })),
  meta: {
    count,
    page: 1,
    per_page: 25,
  },
});

describe("CompleteAutocompleteApi", () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let autocompleteApi: CompleteAutocompleteApi;

  beforeEach(() => {
    mockClient = createMockClient();
    autocompleteApi = new CompleteAutocompleteApi(
      mockClient as unknown as OpenAlexBaseClient,
    );
  });

  describe("Constructor", () => {
    it("should initialize with client", () => {
      expect(autocompleteApi).toBeDefined();
    });
  });

  describe("autocompleteGeneral", () => {
    it("should search across all entity types", async () => {
      const mockResponse = createMockAutocompleteResponse(5, "works");
      mockClient.get.mockResolvedValue(mockResponse);

      const results = await autocompleteApi.autocompleteGeneral(
        "machine learning",
      );

      expect(mockClient.get).toHaveBeenCalledWith("autocomplete", {
        q: "machine learning",
      });
      expect(results).toHaveLength(5);
      expect(results[0]).toHaveProperty("display_name");
      expect(results[0]).toHaveProperty("entity_type");
    });

    it("should trim whitespace from query", async () => {
      const mockResponse = createMockAutocompleteResponse(2);
      mockClient.get.mockResolvedValue(mockResponse);

      await autocompleteApi.autocompleteGeneral("  test query  ");

      expect(mockClient.get).toHaveBeenCalledWith("autocomplete", {
        q: "test query",
      });
    });

    it("should handle empty results", async () => {
      mockClient.get.mockResolvedValue({ results: [] });

      const results = await autocompleteApi.autocompleteGeneral("nonexistent");

      expect(results).toEqual([]);
    });

    it("should sort results by cited_by_count descending", async () => {
      const mockResponse = {
        results: [
          {
            id: "https://openalex.org/W1",
            display_name: "Work 1",
            cited_by_count: 50,
            entity_type: "work" as EntityType,
          },
          {
            id: "https://openalex.org/W2",
            display_name: "Work 2",
            cited_by_count: 100,
            entity_type: "work" as EntityType,
          },
          {
            id: "https://openalex.org/W3",
            display_name: "Work 3",
            cited_by_count: 75,
            entity_type: "work" as EntityType,
          },
        ],
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const results = await autocompleteApi.autocompleteGeneral("test");

      expect(results[0].cited_by_count).toBe(100);
      expect(results[1].cited_by_count).toBe(75);
      expect(results[2].cited_by_count).toBe(50);
    });

    it("should handle results without cited_by_count", async () => {
      const mockResponse = {
        results: [
          {
            id: "https://openalex.org/A1",
            display_name: "Author 1",
            entity_type: "author" as EntityType,
          },
          {
            id: "https://openalex.org/A2",
            display_name: "Author 2",
            cited_by_count: 100,
            entity_type: "author" as EntityType,
          },
        ],
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const results = await autocompleteApi.autocompleteGeneral("test");

      expect(results).toHaveLength(2);
      // Items with cited_by_count should come first
      expect(results[0].cited_by_count).toBe(100);
    });
  });

  // Note: Entity-specific autocomplete methods are tested via integration tests
  // Unit testing requires complex mocking of the class hierarchy and debounce logic
  // See autocomplete.integration.test.ts for full entity-specific endpoint coverage

  describe("Validation", () => {
    it("should return empty array for empty query string", async () => {
      const mockResponse = { results: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const results = await autocompleteApi.autocompleteGeneral("");

      // Empty queries return empty results
      expect(results).toEqual([]);
    });

    it("should return empty array for whitespace-only query string", async () => {
      const mockResponse = { results: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const results = await autocompleteApi.autocompleteGeneral(' '.repeat(3));

      // Whitespace queries return empty results
      expect(results).toEqual([]);
    });

    it("should return empty array for per_page less than 1", async () => {
      const mockResponse = { results: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const results = await autocompleteApi.autocompleteGeneral("test", {
        per_page: 0,
      });

      // Invalid per_page returns empty results
      expect(results).toEqual([]);
    });

    it("should return empty array for per_page greater than 200", async () => {
      const mockResponse = { results: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const results = await autocompleteApi.autocompleteGeneral("test", {
        per_page: 201,
      });

      // Invalid per_page returns empty results
      expect(results).toEqual([]);
    });

    it("should accept valid per_page values", async () => {
      const mockResponse = createMockAutocompleteResponse(2);
      mockClient.get.mockResolvedValue(mockResponse);

      await expect(
        autocompleteApi.autocompleteGeneral("test", { per_page: 50 }),
      ).resolves.toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      mockClient.get.mockRejectedValue(new Error("API Error"));

      const results = await autocompleteApi.autocompleteGeneral("test");

      expect(results).toEqual([]);
    });

    it("should handle network errors", async () => {
      mockClient.get.mockRejectedValue(
        new Error("Network error: Failed to fetch"),
      );

      const results = await autocompleteApi.autocompleteGeneral("test");

      expect(results).toEqual([]);
    });

    it("should handle malformed response", async () => {
      mockClient.get.mockResolvedValue({ invalid: "response" });

      const results = await autocompleteApi.autocompleteGeneral("test");

      expect(results).toEqual([]);
    });

    it("should handle null response", async () => {
      mockClient.get.mockResolvedValue(null);

      const results = await autocompleteApi.autocompleteGeneral("test");

      expect(results).toEqual([]);
    });
  });

  describe("Result Processing", () => {
    it("should preserve all result fields", async () => {
      const mockResponse = {
        results: [
          {
            id: "https://openalex.org/W1",
            display_name: "Test Work",
            hint: "Test hint",
            cited_by_count: 100,
            works_count: 50,
            entity_type: "work" as EntityType,
            external_id: "doi:10.1234/test",
          },
        ],
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const results = await autocompleteApi.autocompleteGeneral("test");

      expect(results[0]).toMatchObject({
        id: "https://openalex.org/W1",
        display_name: "Test Work",
        hint: "Test hint",
        cited_by_count: 100,
        works_count: 50,
        entity_type: "work",
        external_id: "doi:10.1234/test",
      });
    });

    it("should handle missing optional fields", async () => {
      const mockResponse = {
        results: [
          {
            id: "https://openalex.org/A1",
            display_name: "Test Author",
            entity_type: "author" as EntityType,
          },
        ],
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const results = await autocompleteApi.autocompleteGeneral("test");

      expect(results[0]).toMatchObject({
        id: "https://openalex.org/A1",
        display_name: "Test Author",
        entity_type: "author",
      });
      expect(results[0].hint).toBeUndefined();
      expect(results[0].cited_by_count).toBeUndefined();
    });
  });

  describe("Query Parameters", () => {
    it("should not include per_page in request by default", async () => {
      const mockResponse = createMockAutocompleteResponse(2);
      mockClient.get.mockResolvedValue(mockResponse);

      await autocompleteApi.autocompleteGeneral("test");

      expect(mockClient.get).toHaveBeenCalledWith("autocomplete", {
        q: "test",
      });
    });

    it("should not include format parameter", async () => {
      const mockResponse = createMockAutocompleteResponse(2);
      mockClient.get.mockResolvedValue(mockResponse);

      await autocompleteApi.autocompleteGeneral("test");

      const callArguments = mockClient.get.mock.calls[0];
      expect(callArguments[1]).not.toHaveProperty("format");
    });

    it("should pass through explicitly provided per_page", async () => {
      const mockResponse = createMockAutocompleteResponse(2);
      mockClient.get.mockResolvedValue(mockResponse);

      await autocompleteApi.autocompleteGeneral("test", { per_page: 10 });

      expect(mockClient.get).toHaveBeenCalledWith("autocomplete", {
        q: "test",
        per_page: 10,
      });
    });
  });

  describe("Special Characters", () => {
    it("should handle queries with special characters", async () => {
      const mockResponse = createMockAutocompleteResponse(2);
      mockClient.get.mockResolvedValue(mockResponse);

      await autocompleteApi.autocompleteGeneral("test & search");

      expect(mockClient.get).toHaveBeenCalledWith("autocomplete", {
        q: "test & search",
      });
    });

    it("should handle queries with unicode characters", async () => {
      const mockResponse = createMockAutocompleteResponse(2);
      mockClient.get.mockResolvedValue(mockResponse);

      await autocompleteApi.autocompleteGeneral("日本語");

      expect(mockClient.get).toHaveBeenCalledWith("autocomplete", {
        q: "日本語",
      });
    });

    it("should handle queries with quotes", async () => {
      const mockResponse = createMockAutocompleteResponse(2);
      mockClient.get.mockResolvedValue(mockResponse);

      await autocompleteApi.autocompleteGeneral('"exact phrase"');

      expect(mockClient.get).toHaveBeenCalledWith("autocomplete", {
        q: '"exact phrase"',
      });
    });
  });
});

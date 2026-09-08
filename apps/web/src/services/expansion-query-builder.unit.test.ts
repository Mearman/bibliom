/**
 * Unit tests for expansion query builder service
 * Tests query parameter construction from expansion settings
 */

import type {
  ExpansionSettings,
  FilterCriteria,
  SortCriteria,
} from "@bibgraph/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExpansionQueryBuilder } from "./expansion-query-builder";

// Mock logger to prevent console output during tests
vi.mock("@bibgraph/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ExpansionQueryBuilder", () => {
  let baseSettings: ExpansionSettings;

  beforeEach(() => {
    baseSettings = {
      target: "works",
      enabled: true,
      limit: 100,
      sorts: [],
      filters: [],
    };
    vi.clearAllMocks();
  });

  describe("buildQueryParams", () => {
    it("should build basic query params with per_page", () => {
      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: baseSettings,
      });

      expect(parameters).toEqual({
        per_page: 200, // Always use maximum per page
      });
    });

    it("should include select fields when provided", () => {
      const selectFields = ["id", "title", "publication_year"];
      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: baseSettings,
        baseSelect: selectFields,
      });

      expect(parameters).toEqual({
        per_page: 200,
        select: selectFields,
      });
    });

    it("should include sort string when sorts are provided", () => {
      const settingsWithSort: ExpansionSettings = {
        ...baseSettings,
        sorts: [
          { property: "publication_year", direction: "desc", priority: 1 },
          { property: "cited_by_count", direction: "asc", priority: 2 },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithSort,
      });

      expect(parameters).toEqual({
        per_page: 200,
        sort: "publication_year:desc,cited_by_count:asc",
      });
    });

    it("should include filter string when filters are provided", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "publication_year",
            operator: "gte",
            value: 2020,
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });

      expect(parameters).toEqual({
        per_page: 200,
        filter: "publication_year:>=2020",
      });
    });

    it("should include both sort and filter when provided", () => {
      const complexSettings: ExpansionSettings = {
        ...baseSettings,
        sorts: [{ property: "cited_by_count", direction: "desc", priority: 1 }],
        filters: [
          {
            property: "is_oa",
            operator: "eq",
            value: true,
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: complexSettings,
      });

      expect(parameters).toEqual({
        per_page: 200,
        sort: "cited_by_count:desc",
        filter: "is_oa:true",
      });
    });
  });

  describe("Sort string building", () => {
    it("should build sort string with single criteria", () => {
      const settingsWithSort: ExpansionSettings = {
        ...baseSettings,
        sorts: [
          { property: "publication_year", direction: "desc", priority: 1 },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithSort,
      });
      expect(parameters.sort).toBe("publication_year:desc");
    });

    it("should build sort string with multiple criteria ordered by priority", () => {
      const settingsWithMultipleSorts: ExpansionSettings = {
        ...baseSettings,
        sorts: [
          { property: "cited_by_count", direction: "asc", priority: 3 },
          { property: "publication_year", direction: "desc", priority: 1 },
          { property: "title", direction: "asc", priority: 2 },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithMultipleSorts,
      });
      expect(parameters.sort).toBe(
        "publication_year:desc,title:asc,cited_by_count:asc",
      );
    });

    it("should handle empty sorts array", () => {
      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: baseSettings,
      });
      expect(parameters.sort).toBeUndefined();
    });
  });

  describe("Filter string building", () => {
    it("should build equality filter", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "type",
            operator: "eq",
            value: "journal-article",
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("type:journal-article");
    });

    it("should build not-equal filter", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "type",
            operator: "ne",
            value: "preprint",
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("type:!preprint");
    });

    it("should build greater-than filter", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "publication_year",
            operator: "gt",
            value: 2020,
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("publication_year:>2020");
    });

    it("should build less-than filter", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "publication_year",
            operator: "lt",
            value: 2025,
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("publication_year:<2025");
    });

    it("should build greater-than-or-equal filter", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "cited_by_count",
            operator: "gte",
            value: 10,
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("cited_by_count:>=10");
    });

    it("should build less-than-or-equal filter", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "cited_by_count",
            operator: "lte",
            value: 1000,
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("cited_by_count:<=1000");
    });

    it("should build between filter with array values", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "publication_year",
            operator: "between",
            value: [2020, 2023],
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("publication_year:2020-2023");
    });

    it("should build in filter with array values", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "type",
            operator: "in",
            value: ["journal-article", "book-chapter"],
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("type:journal-article|book-chapter");
    });

    it("should build not-in filter with array values", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "type",
            operator: "notin",
            value: ["preprint", "thesis"],
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("type:!preprint|thesis");
    });

    it("should build contains filter", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "title",
            operator: "contains",
            value: "machine learning",
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("title:machine learning");
    });

    it("should skip disabled filters", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "type",
            operator: "eq",
            value: "journal-article",
            enabled: false, // Disabled
          },
          {
            property: "is_oa",
            operator: "eq",
            value: true,
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("is_oa:true");
    });

    it("should combine multiple enabled filters", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "publication_year",
            operator: "gte",
            value: 2020,
            enabled: true,
          },
          {
            property: "is_oa",
            operator: "eq",
            value: true,
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("publication_year:>=2020,is_oa:true");
    });

    it("should handle empty filters array", () => {
      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: baseSettings,
      });
      expect(parameters.filter).toBeUndefined();
    });

    it("should handle all filters disabled", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "type",
            operator: "eq",
            value: "journal-article",
            enabled: false,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBeUndefined();
    });
  });

  describe("Value formatting", () => {
    it("should format string values and escape special characters", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "title",
            operator: "eq",
            value: "test:value,with|special",
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe(String.raw`title:test\:value\,with\|special`);
    });

    it("should format boolean values", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "is_oa",
            operator: "eq",
            value: true,
            enabled: true,
          },
          {
            property: "is_retracted",
            operator: "eq",
            value: false,
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("is_oa:true,is_retracted:false");
    });

    it("should format number values", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "cited_by_count",
            operator: "eq",
            value: 42,
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("cited_by_count:42");
    });

    it("should format Date values as years", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "publication_date",
            operator: "gte",
            value: new Date("2023-01-01"),
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("publication_date:>=2023");
    });

    it("should handle null and undefined values", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "test_null",
            operator: "eq",
            value: null,
            enabled: true,
          },
          {
            property: "test_undefined",
            operator: "eq",
            value: undefined,
            enabled: true,
          },
        ],
      };

      const parameters = ExpansionQueryBuilder.buildQueryParams({
        settings: settingsWithFilter,
      });
      expect(parameters.filter).toBe("test_null:,test_undefined:");
    });
  });

  describe("validateSettings", () => {
    it("should validate valid settings", () => {
      const result = ExpansionQueryBuilder.validateSettings(baseSettings);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject negative limit", () => {
      const invalidSettings: ExpansionSettings = {
        ...baseSettings,
        limit: -1,
      };

      const result = ExpansionQueryBuilder.validateSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Limit must be 0 (unlimited) or greater");
    });

    it("should reject limit exceeding maximum", () => {
      const invalidSettings: ExpansionSettings = {
        ...baseSettings,
        limit: 10_001,
      };

      const result = ExpansionQueryBuilder.validateSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Limit cannot exceed 10000 for performance reasons",
      );
    });

    it("should accept zero limit (unlimited)", () => {
      const validSettings: ExpansionSettings = {
        ...baseSettings,
        limit: 0,
      };

      const result = ExpansionQueryBuilder.validateSettings(validSettings);
      expect(result.valid).toBe(true);
    });

    it("should reject sort without property", () => {
      const invalidSettings: ExpansionSettings = {
        ...baseSettings,
        sorts: [
          {
            property: "",
            direction: "asc",
            priority: 1,
          },
        ],
      };

      const result = ExpansionQueryBuilder.validateSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Sort criteria must have a property");
    });

    it("should reject invalid sort direction", () => {
      const invalidSettings: ExpansionSettings = {
        ...baseSettings,
        sorts: [
          {
            property: "test",
            direction: "invalid" as any,
            priority: 1,
          },
        ],
      };

      const result = ExpansionQueryBuilder.validateSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid sort direction: invalid");
    });

    it("should reject sort priority less than 1", () => {
      const invalidSettings: ExpansionSettings = {
        ...baseSettings,
        sorts: [
          {
            property: "test",
            direction: "asc",
            priority: 0,
          },
        ],
      };

      const result = ExpansionQueryBuilder.validateSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Sort priority must be 1 or greater");
    });

    it("should reject duplicate sort properties", () => {
      const invalidSettings: ExpansionSettings = {
        ...baseSettings,
        sorts: [
          {
            property: "test",
            direction: "asc",
            priority: 1,
          },
          {
            property: "test",
            direction: "desc",
            priority: 2,
          },
        ],
      };

      const result = ExpansionQueryBuilder.validateSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Duplicate sort properties are not allowed",
      );
    });

    it("should reject filter without property", () => {
      const invalidSettings: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "",
            operator: "eq",
            value: "test",
            enabled: true,
          },
        ],
      };

      const result = ExpansionQueryBuilder.validateSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Filter criteria must have a property");
    });

    it("should reject between filter without exactly 2 values", () => {
      const invalidSettings: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "year",
            operator: "between",
            value: [2020], // Only 1 value
            enabled: true,
          },
        ],
      };

      const result = ExpansionQueryBuilder.validateSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Between filter must have exactly 2 values",
      );
    });

    it("should reject in/notin filter with invalid value type", () => {
      const invalidSettings: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "type",
            operator: "in",
            value: { invalid: "object" }, // Invalid object
            enabled: true,
          },
        ],
      };

      const result = ExpansionQueryBuilder.validateSettings(invalidSettings);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Filter operator in requires array, string, or number value",
      );
    });
  });

  describe("getQueryPreview", () => {
    it("should generate preview for empty settings", () => {
      const preview = ExpansionQueryBuilder.getQueryPreview(baseSettings);
      expect(preview).toBe("?per_page=200");
    });

    it("should generate preview with sort", () => {
      const settingsWithSort: ExpansionSettings = {
        ...baseSettings,
        sorts: [{ property: "cited_by_count", direction: "desc", priority: 1 }],
      };

      const preview = ExpansionQueryBuilder.getQueryPreview(settingsWithSort);
      expect(preview).toContain("sort=cited_by_count:desc");
      expect(preview).toContain("per_page=200");
    });

    it("should generate preview with filter", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "is_oa",
            operator: "eq",
            value: true,
            enabled: true,
          },
        ],
      };

      const preview = ExpansionQueryBuilder.getQueryPreview(settingsWithFilter);
      expect(preview).toContain("filter=is_oa:true");
      expect(preview).toContain("per_page=200");
    });

    it("should generate preview with both sort and filter", () => {
      const complexSettings: ExpansionSettings = {
        ...baseSettings,
        sorts: [{ property: "cited_by_count", direction: "desc", priority: 1 }],
        filters: [
          {
            property: "is_oa",
            operator: "eq",
            value: true,
            enabled: true,
          },
        ],
      };

      const preview = ExpansionQueryBuilder.getQueryPreview(complexSettings);
      expect(preview).toContain("sort=cited_by_count:desc");
      expect(preview).toContain("filter=is_oa:true");
      expect(preview).toContain("per_page=200");
    });
  });

  describe("mergeFilters", () => {
    it("should return undefined when no filters", () => {
      const result = ExpansionQueryBuilder.mergeFilters({
        baseFilters: undefined,
        additionalFilters: [],
      });
      expect(result).toBeUndefined();
    });

    it("should return base filters when no additional filters", () => {
      const result = ExpansionQueryBuilder.mergeFilters({
        baseFilters: "entityType:journal-article",
        additionalFilters: [],
      });
      expect(result).toBe("entityType:journal-article");
    });

    it("should return additional filters when no base filters", () => {
      const additionalFilters: FilterCriteria[] = [
        {
          property: "is_oa",
          operator: "eq",
          value: true,
          enabled: true,
        },
      ];

      const result = ExpansionQueryBuilder.mergeFilters({
        baseFilters: undefined,
        additionalFilters,
      });
      expect(result).toBe("is_oa:true");
    });

    it("should merge base and additional filters", () => {
      const additionalFilters: FilterCriteria[] = [
        {
          property: "is_oa",
          operator: "eq",
          value: true,
          enabled: true,
        },
      ];

      const result = ExpansionQueryBuilder.mergeFilters({
        baseFilters: "type:journal-article",
        additionalFilters,
      });
      expect(result).toBe("type:journal-article,is_oa:true");
    });
  });

  describe("withAdditionalFilters", () => {
    it("should add filters to settings without existing filters", () => {
      const additionalFilters: FilterCriteria[] = [
        {
          property: "is_oa",
          operator: "eq",
          value: true,
          enabled: true,
        },
      ];

      const result = ExpansionQueryBuilder.withAdditionalFilters({
        settings: baseSettings,
        additionalFilters,
      });
      expect(result.filters).toHaveLength(1);
      expect(result.filters?.[0]).toEqual(additionalFilters[0]);
    });

    it("should combine existing and additional filters", () => {
      const settingsWithFilter: ExpansionSettings = {
        ...baseSettings,
        filters: [
          {
            property: "type",
            operator: "eq",
            value: "journal-article",
            enabled: true,
          },
        ],
      };

      const additionalFilters: FilterCriteria[] = [
        {
          property: "is_oa",
          operator: "eq",
          value: true,
          enabled: true,
        },
      ];

      const result = ExpansionQueryBuilder.withAdditionalFilters({
        settings: settingsWithFilter,
        additionalFilters,
      });
      expect(result.filters).toHaveLength(2);
      expect(result.filters?.[0].property).toBe("type");
      expect(result.filters?.[1].property).toBe("is_oa");
    });
  });

  describe("withFallbackSort", () => {
    it("should add fallback sort when no sorts exist", () => {
      const fallbackSort: SortCriteria = {
        property: "cited_by_count",
        direction: "desc",
        priority: 1,
      };

      const result = ExpansionQueryBuilder.withFallbackSort({
        settings: baseSettings,
        fallbackSort,
      });
      expect(result.sorts).toHaveLength(1);
      expect(result.sorts?.[0].property).toBe("cited_by_count");
      expect(result.sorts?.[0].priority).toBe(1);
    });

    it("should not add fallback sort when sorts already exist", () => {
      const settingsWithSort: ExpansionSettings = {
        ...baseSettings,
        sorts: [
          {
            property: "publication_year",
            direction: "desc",
            priority: 1,
          },
        ],
      };

      const fallbackSort: SortCriteria = {
        property: "cited_by_count",
        direction: "desc",
        priority: 1,
      };

      const result = ExpansionQueryBuilder.withFallbackSort({
        settings: settingsWithSort,
        fallbackSort,
      });
      expect(result.sorts).toHaveLength(1);
      expect(result.sorts?.[0].property).toBe("publication_year");
    });
  });
});

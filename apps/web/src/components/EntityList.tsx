import {
  buildFilterString,
  cachedOpenAlex as openAlex,
} from "@bibgraph/client";
import type {
  Author,
  Concept,
  EntityType,
  Funder,
  InstitutionEntity,
  Keyword,
  OpenAlexResponse,
  Publisher,
  Source,
  Topic,
  Work,
} from "@bibgraph/types";
import { DataTable,useAriaAttributes,useAsyncOperation, useScreenReader  } from "@bibgraph/ui";
import { logger } from "@bibgraph/utils";
import { Group, Pagination, Text } from "@mantine/core";
import type { ColumnDef } from "@tanstack/react-table";
import React, { useMemo, useState } from "react";

import { transformEntityToGridItem, transformEntityToListItem } from "../utils/entity-mappers";
import { EntityGrid } from "./EntityGrid";
import { EntityListView } from "./EntityListView";
import { SearchResultsSkeleton } from "./search/SearchResultsSkeleton";
import { type TableViewMode,TableViewModeToggle } from "./TableViewModeToggle";
import type { ColumnConfig as BaseColumnConfig } from "./types";

type Entity =
  | Funder
  | Publisher
  | Source
  | Work
  | Author
  | InstitutionEntity
  | Topic
  | Concept
  | Keyword;

// Extend base ColumnConfig with typed row parameter
export type EntityListColumnConfig = Omit<BaseColumnConfig, 'render'> & {
  render?: (value: unknown, row: Entity) => React.ReactNode;
};

export interface EntityListProps {
  entityType: EntityType;
  columns: EntityListColumnConfig[];
  perPage?: number;
  title?: string;
  urlFilters?: unknown;
  searchParams?: {
    filter?: string;
    search?: string;
    sort?: string;
    page?: number;
    per_page?: number;
    sample?: number;
    group_by?: string;
    cursor?: string;
    seed?: number;
    mailto?: string;
  };
  viewMode?: TableViewMode;
  onViewModeChange?: (viewMode: TableViewMode) => void;
}

// Entity transformation functions are now provided by @bibgraph/utils

export const EntityList = ({
  viewMode = "table",
  onViewModeChange,
  entityType,
  columns,
  perPage = 50,
  title,
  urlFilters,
  searchParams,
}: EntityListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { announceStatus, announceAction } = useScreenReader();
  const { getAriaLabel } = useAriaAttributes();

  const onError = React.useCallback((error: Error) => {
    logger.error("EntityList", `Failed to fetch ${entityType}`, { error });
    announceAction(`Error loading ${entityType}`);
  }, [entityType, announceAction]);

  const asyncOperation = useAsyncOperation<Entity[]>({
    retryCount: 2,
    retryDelay: 1000,
    onError
  });

  const [paginationInfo, setPaginationInfo] = useState({
    totalPages: 1,
    totalCount: 0
  });

  // Convert ColumnConfig to TanStack Table ColumnDef format
  const tableColumns = useMemo<ColumnDef<Entity>[]>(() => {
    return columns.map((col) => ({
      id: col.key,
      accessorKey: col.render ? undefined : col.key,
      accessorFn: col.render
        ? (row) => row
        : (row) => {
            // Handle nested keys like "primary_location.source.display_name"
            const keys = col.key.split(".");
            let value: unknown = row;
            for (const key of keys) {
              value = value?.[key as keyof typeof value];
            }
            return value;
          },
      header: col.header,
      cell: col.render
        ? (info) => col.render?.(info.getValue(), info.row.original)
        : (info) => String(info.getValue() ?? ""),
    }));
  }, [columns]);

  const fetchData = React.useCallback(async () => {
    let response: OpenAlexResponse<Entity> | null = null;

    switch (entityType) {
      case "funders":
        response = await openAlex.client.funders.getMultiple({
          per_page: searchParams?.per_page ?? perPage,
          page: searchParams?.page ?? currentPage,
          filter: searchParams?.filter,
          search: searchParams?.search,
          sort: searchParams?.sort,
          sample: searchParams?.sample,
          group_by: searchParams?.group_by,
        });
        break;
      case "publishers":
        response = await openAlex.client.publishers.getMultiple({
          per_page: searchParams?.per_page ?? perPage,
          page: searchParams?.page ?? currentPage,
          filter: searchParams?.filter,
          search: searchParams?.search,
          sort: searchParams?.sort,
          sample: searchParams?.sample,
          group_by: searchParams?.group_by,
        });
        break;
      case "sources": {
        const sourcesFilter = urlFilters
          ? buildFilterString(urlFilters)
          : searchParams?.filter;
        // Type assertion needed: URL filter strings are valid but don't match strict SourcesFilters type
        response = await openAlex.client.sources.getSources({
          per_page: searchParams?.per_page ?? perPage,
          page: searchParams?.page ?? currentPage,
          sort: searchParams?.sort,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(sourcesFilter && { filters: sourcesFilter as any }),
        });
        break;
      }
      case "works": {
        const worksFilter = urlFilters
          ? buildFilterString(urlFilters)
          : searchParams?.filter;
        response = await openAlex.client.works.getWorks({
          per_page: searchParams?.per_page ?? perPage,
          page: searchParams?.page ?? currentPage,
          filter: worksFilter,
          sort: searchParams?.sort,
        });
        break;
      }
      case "authors": {
        const authorsFilter = urlFilters
          ? buildFilterString(urlFilters)
          : searchParams?.filter;
        response = await openAlex.client.authors.getAuthors({
          per_page: searchParams?.per_page ?? perPage,
          page: searchParams?.page ?? currentPage,
          filter: authorsFilter,
          sort: searchParams?.sort,
        });
        break;
      }
      case "institutions": {
        const institutionsFilter = urlFilters
          ? buildFilterString(urlFilters)
          : searchParams?.filter;
        // Type assertion needed: URL params are valid but don't match strict InstitutionSearchOptions types
        response = await openAlex.client.institutions.getInstitutions({
          per_page: searchParams?.per_page ?? perPage,
          page: searchParams?.page ?? currentPage,
          filter: institutionsFilter,
          sort: searchParams?.sort,
        } as Parameters<typeof openAlex.client.institutions.getInstitutions>[0]);
        break;
      }
      case "concepts":
        response = await openAlex.client.concepts.getConcepts({
          per_page: searchParams?.per_page ?? perPage,
          page: searchParams?.page ?? currentPage,
          filter: searchParams?.filter,
          search: searchParams?.search,
          sort: searchParams?.sort,
          sample: searchParams?.sample,
          group_by: searchParams?.group_by,
        });
        break;
      case "topics": {
        const topicsFilter = urlFilters
          ? buildFilterString(urlFilters)
          : searchParams?.filter;
        response = await openAlex.client.topics.getMultiple({
          per_page: searchParams?.per_page ?? perPage,
          page: searchParams?.page ?? currentPage,
          filter: topicsFilter,
          sort: searchParams?.sort,
        });
        break;
      }
      case "keywords":
        response = await openAlex.client.keywords.getKeywords({
          per_page: searchParams?.per_page ?? perPage,
          page: searchParams?.page ?? currentPage,
          filter: searchParams?.filter,
          search: searchParams?.search,
          sort: searchParams?.sort,
          sample: searchParams?.sample,
          group_by: searchParams?.group_by,
        });
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    if (response) {
      // Handle response with or without meta field (static cache may not include meta)
      if (response.meta) {
        setPaginationInfo({
          totalCount: response.meta.count,
          totalPages: Math.ceil(response.meta.count / response.meta.per_page)
        });
      } else {
        // Fallback for responses without meta (e.g. from static cache)
        logger.warn("EntityList", `Response missing meta field for ${entityType}, using defaults`);
        setPaginationInfo({
          totalCount: response.results?.length || 0,
          totalPages: 1 // Assume single page if no meta
        });
      }
      return response.results || [];
    }

    throw new Error(`No response received for ${entityType}`);
  }, [entityType, perPage, urlFilters, searchParams, currentPage]);

  React.useEffect(() => {
    asyncOperation.execute(fetchData);
  }, [fetchData, asyncOperation.execute]);

  // Announce when data loading completes
  React.useEffect(() => {
    if (!asyncOperation.loading && !asyncOperation.error && asyncOperation.data) {
      announceStatus(`Loaded ${asyncOperation.data.length} ${entityType} items`);
    }
  }, [asyncOperation.loading, asyncOperation.error, asyncOperation.data, entityType, announceStatus]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    announceAction(`Navigated to page ${page} of ${paginationInfo.totalPages}`);
  };

  const handleViewModeChange = (newViewMode: TableViewMode) => {
    onViewModeChange?.(newViewMode);
    announceAction(`Switched to ${newViewMode} view`);
  };

  // Enhanced loading state with skeleton
  if (asyncOperation.loading) {
    return (
      <div role="region" aria-label={`${title || entityType} loading`}>
        <Group justify="space-between" mb="md">
          <h1 id="entity-list-title">
            {title || entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </h1>
          {onViewModeChange && (
            <div role="group" aria-label="View mode selection" style={{ opacity: 0.5, pointerEvents: 'none' }}>
              <TableViewModeToggle
                value={viewMode}
                onChange={handleViewModeChange}
                aria-label={getAriaLabel("view mode toggle", `Change display view for ${title || entityType}`)}
              />
            </div>
          )}
        </Group>

        <SearchResultsSkeleton
          viewType={viewMode}
          items={perPage}
          title={`Loading ${title || entityType}...`}
        />
      </div>
    );
  }

  // Error state
  if (asyncOperation.error) {
    return (
      <div role="region" aria-label={`${title || entityType} error`}>
        <Group justify="space-between" mb="md">
          <h1 id="entity-list-title">
            {title || entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </h1>
          {onViewModeChange && (
            <div role="group" aria-label="View mode selection" style={{ opacity: 0.5, pointerEvents: 'none' }}>
              <TableViewModeToggle
                value={viewMode}
                onChange={handleViewModeChange}
                aria-label={getAriaLabel("view mode toggle", `Change display view for ${title || entityType}`)}
              />
            </div>
          )}
        </Group>

        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid var(--mantine-color-red-3)',
            borderRadius: '8px',
            backgroundColor: 'var(--mantine-color-red-0)'
          }}
        >
          <Text mb="md">
            Failed to load {title || entityType}. Please try again.
          </Text>
          <button
            onClick={() => asyncOperation.execute(fetchData)}
            aria-label="Retry loading"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--mantine-color-blue-6)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!asyncOperation.data || asyncOperation.data.length === 0) {
    return (
      <div role="region" aria-label={`${title || entityType} empty`}>
        <Group justify="space-between" mb="md">
          <h1 id="entity-list-title">
            {title || entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </h1>
          {onViewModeChange && (
            <div role="group" aria-label="View mode selection" style={{ opacity: 0.5, pointerEvents: 'none' }}>
              <TableViewModeToggle
                value={viewMode}
                onChange={handleViewModeChange}
                aria-label={getAriaLabel("view mode toggle", `Change display view for ${title || entityType}`)}
              />
            </div>
          )}
        </Group>

        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '2rem',
            textAlign: 'center',
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: '8px',
            backgroundColor: 'var(--mantine-color-body)'
          }}
        >
          <Text>
            No {title || entityType} found.
          </Text>
        </div>
      </div>
    );
  }

  // Success state with data
  const data = asyncOperation.data;
  const tableData = data.map((item) => ({
    ...item,
    id: item.id.replace("https://openalex.org/", ""),
  }));

  const gridItems = data.map((item) =>
    transformEntityToGridItem(item, entityType),
  );
  const listItems = data.map((item) =>
    transformEntityToListItem(item, entityType),
  );

  const entityListTitle = title || entityType.charAt(0).toUpperCase() + entityType.slice(1);

  return (
    <div role="region" aria-label={`${entityListTitle} list`}>
      <Group justify="space-between" mb="md">
        <h1 id="entity-list-title">
          {entityListTitle}
        </h1>
        {onViewModeChange && (
          <div role="group" aria-label="View mode selection">
            <TableViewModeToggle
              value={viewMode}
              onChange={handleViewModeChange}
              aria-label={getAriaLabel("view mode toggle", `Change display view for ${entityListTitle}`)}
            />
          </div>
        )}
      </Group>

      <div
        role="region"
        aria-label={`${viewMode} view of ${entityListTitle}`}
        aria-live="polite"
      >
        {viewMode === "table" && (
          <DataTable
            data={tableData}
            columns={tableColumns}
            aria-label={`${entityListTitle} table with ${data.length} rows`}
          />
        )}
        {viewMode === "list" && (
          <EntityListView
            items={listItems}
            aria-label={`${entityListTitle} list with ${data.length} items`}
          />
        )}
        {viewMode === "grid" && (
          <EntityGrid
            items={gridItems}
            aria-label={`${entityListTitle} grid with ${data.length} items`}
          />
        )}
      </div>

      {paginationInfo.totalPages > 1 && (
        <nav
          aria-label="Pagination navigation"
          role="navigation"
        >
          <Group justify="space-between" mt="md">
            <Text size="sm" c="dimmed" aria-live="polite">
              Showing {(currentPage - 1) * perPage + 1} to{" "}
              {Math.min(currentPage * perPage, paginationInfo.totalCount)} of {paginationInfo.totalCount}{" "}
              {entityType.toLowerCase()} entries
            </Text>
            <Pagination
              value={currentPage}
              onChange={handlePageChange}
              total={paginationInfo.totalPages}
              size="sm"
              withEdges
              aria-label={`Pagination for ${entityListTitle}, currently page ${currentPage} of ${paginationInfo.totalPages}`}
            />
          </Group>
        </nav>
      )}
    </div>
  );
};

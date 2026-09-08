/**
 * RelationshipPagination component
 * Provides pagination controls with page navigation and page size selector
 * @module RelationshipPagination
 * @see specs/016-entity-relationship-viz/spec.md
 */

import { Group, Pagination, Select, Text } from '@mantine/core';

import type { PaginationState } from '@/types/relationship';

export interface RelationshipPaginationProps {
  /**
  Current pagination state
   */
  pagination: PaginationState;

  /**
  Total number of items
   */
  totalCount: number;

  /**
  Number of items currently loaded/visible
   */
  loadedCount: number;

  /**
  Callback when page changes
   */
  onPageChange?: (page: number) => void;

  /**
  Callback when page size changes
   */
  onPageSizeChange?: (pageSize: number) => void;

  /**
  Whether pagination controls are disabled (e.g., during loading)
   */
  disabled?: boolean;
}

/**
Available page size options
 */
const PAGE_SIZE_OPTIONS = [
  { value: '10', label: '10 per page' },
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
  { value: '100', label: '100 per page' },
];

/**
 * Pagination controls for relationship lists
 * Includes page navigation and page size selector
 * @param root0
 * @param root0.pagination
 * @param root0.totalCount
 * @param root0.loadedCount
 * @param root0.onPageChange
 * @param root0.onPageSizeChange
 * @param root0.disabled
 */
export const RelationshipPagination = ({
  pagination,
  totalCount,
  loadedCount,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}) => {
  // Convert 0-indexed currentPage to 1-indexed for display
  const displayPage = pagination.currentPage + 1;

  // Calculate display range
  const startItem = pagination.currentPage * pagination.pageSize + 1;
  const endItem = Math.min(startItem + loadedCount - 1, totalCount);

  const handlePageChange = (page: number) => {
    // Convert 1-indexed UI page to 0-indexed
    onPageChange?.(page - 1);
  };

  const handlePageSizeChange = (value: string | null) => {
    if (value) {
      onPageSizeChange?.(Number.parseInt(value, 10));
    }
  };

  // Don't show pagination if only one page and no page size options needed
  if (totalCount <= 10) {
    return (
      <Text size="sm" c="dimmed">
        Showing {loadedCount} of {totalCount}
      </Text>
    );
  }

  return (
    <Group justify="space-between" gap="md" wrap="wrap">
      <Text size="sm" c="dimmed">
        Showing {startItem} to {endItem} of {totalCount}
      </Text>

      <Group gap="md">
        {onPageSizeChange && (
          <Select
            size="xs"
            value={String(pagination.pageSize)}
            onChange={handlePageSizeChange}
            data={PAGE_SIZE_OPTIONS}
            disabled={disabled}
            w={130}
            aria-label="Items per page"
          />
        )}

        {pagination.totalPages > 1 && onPageChange && (
          <Pagination
            value={displayPage}
            onChange={handlePageChange}
            total={pagination.totalPages}
            size="sm"
            withEdges
            disabled={disabled}
          />
        )}
      </Group>
    </Group>
  );
};

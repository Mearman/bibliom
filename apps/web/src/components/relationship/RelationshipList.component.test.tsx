/**
 * Component tests for RelationshipList component
 * @vitest-environment jsdom
 */

import { RelationType } from '@bibgraph/types';
import { MantineProvider } from '@mantine/core';
import { cleanup,render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import type { RelationshipItem,RelationshipSection } from '@/types/relationship';

import { RelationshipList } from './RelationshipList';

// Test wrapper with MantineProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

// Mock scrollIntoView to prevent Mantine Select cleanup errors
Element.prototype.scrollIntoView = vi.fn();

describe('RelationshipList', () => {
  const createMockItems = (count: number): RelationshipItem[] => {
    return Array.from({ length: count }, (_, index) => ({
      id: `rel-${index}`,
      sourceId: 'W123',
      targetId: `A${index}`,
      sourceType: 'works' as const,
      targetType: 'authors' as const,
      type: RelationType.AUTHORSHIP,
      direction: 'outbound' as const,
      displayName: `Author ${index}`,
      isSelfReference: false,
    }));
  };

  const createMockSection = (itemCount: number, currentPage: number = 0, pageSize: number = 50): RelationshipSection => {
    const startIndex = currentPage * pageSize;
    const endIndex = Math.min(startIndex + pageSize, itemCount);
    const pageItemCount = endIndex - startIndex;

    return {
      id: 'section-1',
      type: RelationType.AUTHORSHIP,
      direction: 'outbound',
      label: 'Authors',
      items: createMockItems(pageItemCount), // Only items for current page
      visibleItems: createMockItems(pageItemCount),
      totalCount: itemCount,
      visibleCount: pageItemCount,
      hasMore: endIndex < itemCount,
      pagination: {
        pageSize,
        currentPage,
        totalPages: Math.ceil(itemCount / pageSize),
        hasNextPage: endIndex < itemCount,
        hasPreviousPage: currentPage > 0,
      },
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render all items when count is less than page size', () => {
    const section = createMockSection(10);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <TestWrapper>
        <RelationshipList
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    // Should show all 10 items
    expect(screen.getByText('Author 0')).toBeInTheDocument();
    expect(screen.getByText('Author 9')).toBeInTheDocument();
  });

  it('should display "Showing X of Y" count', () => {
    const section = createMockSection(10);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <TestWrapper>
        <RelationshipList
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Showing 10 of 10')).toBeInTheDocument();
  });

  it('should display pagination controls when total items > 10', () => {
    const section = createMockSection(150);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <TestWrapper>
        <RelationshipList
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    // Should show pagination text with range format
    expect(screen.getByText('Showing 1 to 50 of 150')).toBeInTheDocument();
  });

  it('should not display pagination controls when total items <= 10', () => {
    const section = createMockSection(10);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <TestWrapper>
        <RelationshipList
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    // Should show simple count text
    expect(screen.getByText('Showing 10 of 10')).toBeInTheDocument();
  });

  it('should call onPageChange when page navigation is used', async () => {
    const section = createMockSection(150);
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RelationshipList
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={vi.fn()}
          isLoading={false}
        />
      </TestWrapper>
    );

    // Initially shows page 1 (items 1-50)
    expect(screen.getByText('Showing 1 to 50 of 150')).toBeInTheDocument();

    // Find and click the next page button (page 2)
    const pageButtons = screen.getAllByRole('button');
    const nextButton = pageButtons.find(button => button.dataset.page === '2');

    if (nextButton) {
      await user.click(nextButton);
      expect(onPageChange).toHaveBeenCalledWith(1); // 0-indexed page
    }
  });

  it('should call onPageSizeChange when page size selector is used', async () => {
    const section = createMockSection(150);
    const onPageSizeChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RelationshipList
          section={section}
          onPageChange={vi.fn()}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    // Find the page size selector input
    const pageSizeSelect = screen.getByDisplayValue('50 per page');
    expect(pageSizeSelect).toBeInTheDocument();
    expect(pageSizeSelect).toHaveAttribute('aria-label', 'Items per page');

    // Change page size to 100
    await user.click(pageSizeSelect);
    const option100 = screen.getByText('100 per page');
    await user.click(option100);

    expect(onPageSizeChange).toHaveBeenCalledWith(100);
  });

  it('should handle edge case with exactly 50 items', () => {
    const section = createMockSection(50);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <TestWrapper>
        <RelationshipList
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    // Should show pagination text for items > 10
    expect(screen.getByText('Showing 1 to 50 of 50')).toBeInTheDocument();
  });

  it('should handle edge case with 51 items', () => {
    const section = createMockSection(51);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <TestWrapper>
        <RelationshipList
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    // Should show first page of 50 items
    expect(screen.getByText('Showing 1 to 50 of 51')).toBeInTheDocument();
  });
});

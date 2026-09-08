/**
 * Performance tests for RelationshipSection component
 * Validates rendering performance meets requirements
 * @vitest-environment jsdom
 */

import { RelationType } from '@bibgraph/types';
import { MantineProvider } from '@mantine/core';
import { render } from '@testing-library/react';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import type { RelationshipSection as RelationshipSectionType } from '@/types/relationship';

import { RelationshipSection } from './RelationshipSection';


// Test wrapper with MantineProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('RelationshipSection Performance', () => {
  const createMockSection = (
    itemCount: number,
    type: RelationType = RelationType.AUTHORSHIP
  ): RelationshipSectionType => {
    const items = Array.from({ length: itemCount }, (_, index) => ({
      id: `rel-${index}`,
      sourceId: 'W123',
      targetId: `A${index}`,
      sourceType: 'works' as const,
      targetType: 'authors' as const,
      type,
      direction: 'outbound' as const,
      displayName: `Author ${index}`,
      isSelfReference: false,
    }));

    return {
      id: `section-${type}`,
      type,
      direction: 'outbound',
      label: 'Authors',
      items,
      visibleItems: items.slice(0, Math.min(itemCount, 50)),
      totalCount: itemCount,
      visibleCount: Math.min(itemCount, 50),
      hasMore: itemCount > 50,
      pagination: {
        pageSize: 50,
        currentPage: 0,
        totalPages: Math.ceil(itemCount / 50),
        hasNextPage: itemCount > 50,
        hasPreviousPage: false,
      },
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render 50 items in under 1 second', () => {
    const section = createMockSection(50);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const startTime = performance.now();

    render(
      <TestWrapper>
        <RelationshipSection
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in under 1000ms
    expect(renderTime).toBeLessThan(1000);
  });

  it('should render 100 items (first page) in under 1 second', () => {
    const section = createMockSection(100);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const startTime = performance.now();

    render(
      <TestWrapper>
        <RelationshipSection
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Only first 50 visible, should still be fast
    expect(renderTime).toBeLessThan(1000);
  });

  it('should handle empty sections efficiently', () => {
    const section = createMockSection(0);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const startTime = performance.now();

    render(
      <TestWrapper>
        <RelationshipSection
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Empty sections should render very quickly
    expect(renderTime).toBeLessThan(100);
  });

  it('should handle partial data warning without performance impact', () => {
    const section = createMockSection(50);
    section.isPartialData = true;
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    const startTime = performance.now();

    render(
      <TestWrapper>
        <RelationshipSection
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Warning should not add significant overhead
    expect(renderTime).toBeLessThan(1000);
  });

  it('should handle multiple relationship types efficiently', () => {
    const types = [
      RelationType.AUTHORSHIP,
      RelationType.REFERENCE,
      RelationType.AFFILIATION,
      RelationType.TOPIC,
    ];

    const startTime = performance.now();

    for (const type of types) {
      const section = createMockSection(50, type);
      const onPageChange = vi.fn();
      const onPageSizeChange = vi.fn();
      render(
        <TestWrapper>
          <RelationshipSection
            section={section}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            isLoading={false}
          />
        </TestWrapper>
      );
    }

    const endTime = performance.now();
    const totalRenderTime = endTime - startTime;

    // 4 sections with 50 items each should render in under 4 seconds
    expect(totalRenderTime).toBeLessThan(4000);
  });

  it('should render with icon efficiently', () => {
    const section = createMockSection(50);
    section.icon = '👤';
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    const startTime = performance.now();

    render(
      <TestWrapper>
        <RelationshipSection
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Icon should not add significant overhead
    expect(renderTime).toBeLessThan(1000);
  });
});

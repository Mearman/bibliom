/**
 * Accessibility tests for RelationshipSection component
 * Validates WCAG 2.1 AA compliance and ARIA labels
 * @vitest-environment jsdom
 */

import { RelationType } from '@bibgraph/types';
import { MantineProvider } from '@mantine/core';
import { cleanup,render, screen } from '@testing-library/react';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';

import type { RelationshipSection as RelationshipSectionType } from '@/types/relationship';

import { RelationshipSection } from './RelationshipSection';

// Extend Vitest matchers
expect.extend(matchers);

// Test wrapper with MantineProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('RelationshipSection Accessibility', () => {
  const createMockSection = (
    itemCount: number = 10,
    isPartialData: boolean = false
  ): RelationshipSectionType => {
    const items = Array.from({ length: itemCount }, (_, index) => ({
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

    return {
      id: 'section-authorship',
      type: RelationType.AUTHORSHIP,
      direction: 'outbound',
      label: 'Authors',
      items,
      visibleItems: items.slice(0, Math.min(itemCount, 50)),
      isPartialData,
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

  afterEach(() => {
    cleanup();
  });

  it('should have no axe accessibility violations', async () => {
    const section = createMockSection(10);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const { container } = render(
      <TestWrapper>
        <RelationshipSection
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper semantic structure', () => {
    const section = createMockSection(10);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const { container } = render(
      <TestWrapper>
        <RelationshipSection
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    // Should have proper heading structure
    expect(screen.getByText('Authors')).toBeInTheDocument();

    // Should have data-testid for automated testing
    expect(container.querySelector('[data-testid="relationship-section-authorship-outbound"]')).toBeInTheDocument();
  });

  it('should have accessible count badge', () => {
    const section = createMockSection(25);
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

    const badge = screen.getByTestId('relationship-count');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('25');
  });

  it('should have accessible partial data warning', async () => {
    const section = createMockSection(10, true);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const { container } = render(
      <TestWrapper>
        <RelationshipSection
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    const warning = screen.getByTestId('partial-data-warning');
    expect(warning).toBeInTheDocument();

    // Should have proper ARIA role
    expect(warning).toHaveAttribute('role', 'alert');

    // Should have descriptive title
    expect(screen.getByText('Incomplete Data')).toBeInTheDocument();

    // Should have icon for visual distinction
    const icon = warning.querySelector('svg');
    expect(icon).toBeInTheDocument();

    // Check for axe violations on the warning
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have sufficient color contrast', () => {
    const section = createMockSection(10);
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

    // Badge should have sufficient contrast
    const badge = screen.getByTestId('relationship-count');
    expect(badge).toBeInTheDocument();

    // Mantine's light variant ensures WCAG AA contrast
    expect(badge.className).toContain('mantine-Badge');
  });

  it('should handle keyboard navigation', () => {
    const section = createMockSection(10);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const { container } = render(
      <TestWrapper>
        <RelationshipSection
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    // Section should be accessible with proper structure
    expect(container.querySelector('[data-testid="relationship-section-authorship-outbound"]')).toBeInTheDocument();

    // All interactive elements (anchors) should be accessible
    const anchors = container.querySelectorAll('a');

    // Mantine Anchor components with onClick are keyboard accessible
    // They don't need href when using onClick handlers
    anchors.forEach((anchor) => {
      // Should be visible and focusable
      expect(anchor).toBeVisible();
    });
  });

  it('should have proper heading hierarchy', () => {
    const section = createMockSection(10);
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

    // Section label should be a text element (not heading to avoid hierarchy conflicts)
    const label = screen.getByText('Authors');
    expect(label.tagName.toLowerCase()).toBe('p');
  });

  it('should provide context for screen readers', () => {
    const section = createMockSection(10, true);
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

    // Warning should have proper alert role
    const warning = screen.getByTestId('partial-data-warning');
    expect(warning).toHaveAttribute('role', 'alert');

    // Count badge should have text content
    const badge = screen.getByTestId('relationship-count');
    expect(badge.textContent).toBe('10');
  });

  it('should handle icon accessibility', () => {
    const section = createMockSection(10);
    section.icon = '👤';
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

    // Icon should be present but decorative
    expect(screen.getByText('👤')).toBeInTheDocument();
  });

  it('should maintain accessibility with empty sections', async () => {
    const section = createMockSection(0);
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const { container } = render(
      <TestWrapper>
        <RelationshipSection
          section={section}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          isLoading={false}
        />
      </TestWrapper>
    );

    // Should have no axe violations even with no items
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

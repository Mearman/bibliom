/**
 * SearchResultPreview Component
 *
 * Provides hover cards with detailed entity information for search results.
 * Enhances user discovery by showing rich previews without requiring navigation.
 */

import type { AutocompleteResult } from "@bibgraph/types";
import { ENTITY_METADATA,toEntityType } from "@bibgraph/types";
import { convertToRelativeUrl } from "@bibgraph/ui";
import { formatLargeNumber } from "@bibgraph/utils";
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Card,
  Group,
  Portal,
  Stack,
  Text,
  Tooltip,
  Transition,
} from "@mantine/core";
import { IconBookmark, IconExternalLink, IconInfoCircle } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ICON_SIZE } from "@/config/style-constants";

interface SearchResultPreviewProperties {
  /**
  The entity to preview
   */
  entity: AutocompleteResult;
  /**
  Controls hover card visibility
   */
  opened: boolean;
  /**
  Callback when hover state changes
   */
  onToggle: (opened: boolean) => void;
  /**
  Target element to position relative to
   */
  targetElement: HTMLElement | null;
  /**
  Optional bookmark handler
   */
  onBookmark?: (entity: AutocompleteResult) => Promise<void>;
  /**
  Whether the entity is currently bookmarked
   */
  isBookmarked?: boolean;
}

const HOVER_DELAY = 600; // ms before showing hover card
const HIDE_DELAY = 200; // ms before hiding hover card


/**
 * Generate entity-specific description based on type and available data
 * @param entity
 */
const generateEntityDescription = (entity: AutocompleteResult): string => {
  const entityType = toEntityType(entity.entity_type);
  if (!entityType) return entity.hint || '';

  switch (entity.entity_type) {
    case 'work':
      return entity.hint || 'Academic publication';
    case 'author':
      return `${entity.works_count || 0} works • ${formatLargeNumber(entity.cited_by_count || 0)} citations`;
    case 'source':
      return entity.hint || `Academic venue • ${entity.works_count || 0} works`;
    case 'institution':
      return entity.hint || `Research institution • ${entity.works_count || 0} works`;
    case 'topic':
      return entity.hint || `Research topic • ${entity.works_count || 0} works`;
    case 'publisher':
      return entity.hint || `Academic publisher • ${entity.works_count || 0} works`;
    case 'funder':
      return entity.hint || `Funding organization • ${entity.works_count || 0} works`;
    case 'concept':
      return entity.hint || `Research concept`;
    case 'keyword':
      return entity.hint || `Search keyword`;
    default:
      return entity.hint || '';
  }
};

/**
 * Hover card component for search results with rich entity information
 * @param root0
 * @param root0.entity
 * @param root0.opened
 * @param root0.onToggle
 * @param root0.targetElement
 * @param root0.onBookmark
 * @param root0.isBookmarked
 */
export const SearchResultPreview = ({
  entity,
  opened,
  onToggle,
  targetElement,
  onBookmark,
  isBookmarked = false,
}: SearchResultPreviewProperties) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isBookmarkedLocal, setIsBookmarkedLocal] = useState(isBookmarked);
  const cardReference = useRef<HTMLDivElement>(null);
  const entityUrl = convertToRelativeUrl(entity.id);
  const entityType = toEntityType(entity.entity_type);
  const entityColor = entityType ? ENTITY_METADATA[entityType].color : 'gray';
  const description = generateEntityDescription(entity);

  // Update local bookmark state when prop changes
  useEffect(() => {
    setIsBookmarkedLocal(isBookmarked);
  }, [isBookmarked]);

  // Calculate and update position relative to target element
  const updatePosition = useCallback(() => {
    if (!targetElement || !opened) return;

    const targetRect = targetElement.getBoundingClientRect();
    const cardWidth = 350; // Target width for hover card
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = targetRect.right + 8; // Position to the right with small gap
    let top = targetRect.top;

    // Adjust if card would overflow viewport right edge
    if (left + cardWidth > viewportWidth) {
      left = targetRect.left - cardWidth - 8; // Position to the left
      // If left would also overflow, position below
      if (left < 0) {
        left = Math.max(8, viewportWidth - cardWidth - 8);
        top = targetRect.bottom + 8;
      }
    }

    // Adjust vertical position if needed
    const cardHeight = 200; // Estimated card height
    if (top + cardHeight > viewportHeight) {
      top = Math.max(8, viewportHeight - cardHeight - 8);
    }

    setPosition({ top, left });
  }, [targetElement, opened]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!opened) return;

    updatePosition();

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [opened, updatePosition]);

  // Handle bookmark action
  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onBookmark) return;

    try {
      await onBookmark(entity);
      setIsBookmarkedLocal(previous => !previous);
    } catch (error) {
      console.error('Bookmark action failed:', error);
    }
  }, [entity, onBookmark]);

  // Close on escape key
  useEffect(() => {
    if (!opened) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onToggle(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [opened, onToggle]);

  // Close on click outside
  useEffect(() => {
    if (!opened) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (cardReference.current && !cardReference.current.contains(e.target as Node)) {
        onToggle(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [opened, onToggle]);

  return (
    <Portal>
      <Transition
        mounted={opened}
        transition="pop"
        duration={200}
        timingFunction="ease-out"
      >
        {(styles) => (
          <Box
            ref={cardReference}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: 1000,
              width: 350,
              ...styles,
            }}
          >
            <Card
              shadow="lg"
              padding="md"
              radius="md"
              withBorder
              role="dialog"
              aria-label={`Preview: ${entity.display_name}`}
              aria-modal="false"
              tabIndex={-1}
            >
              <Stack gap="xs">
                {/* Header with type and actions */}
                <Group justify="space-between" align="flex-start">
                  <Badge
                    size="sm"
                    color={entityColor}
                    variant="light"
                    fw={500}
                  >
                    {entityType ? ENTITY_METADATA[entityType].displayName : entity.entity_type}
                  </Badge>

                  <Group gap="xs">
                    {onBookmark && (
                      <Tooltip
                        label={isBookmarkedLocal ? "Remove bookmark" : "Add bookmark"}
                        position="bottom"
                      >
                        <ActionIcon
                          size="sm"
                          variant={isBookmarkedLocal ? "filled" : "subtle"}
                          color={isBookmarkedLocal ? "yellow" : "gray"}
                          onClick={handleBookmark}
                          aria-label={isBookmarkedLocal ? "Remove bookmark" : "Add bookmark"}
                        >
                          <IconBookmark
                            size={ICON_SIZE.XS}
                            fill={isBookmarkedLocal ? "currentColor" : "none"}
                          />
                        </ActionIcon>
                      </Tooltip>
                    )}

                    <Tooltip label="Open in new tab" position="bottom">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        component="a"
                        href={entityUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open in new tab"
                      >
                        <IconExternalLink size={ICON_SIZE.XS} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>

                {/* Entity name and description */}
                <Stack gap={4}>
                  {entityUrl ? (
                    <Anchor
                      href={entityUrl}
                      size="sm"
                      fw={600}
                      lineClamp={2}
                      style={{ textDecoration: 'none' }}
                      aria-label={`View ${entity.entity_type} ${entity.display_name}`}
                    >
                      {entity.display_name}
                    </Anchor>
                  ) : (
                    <Text size="sm" fw={600} lineClamp={2}>
                      {entity.display_name}
                    </Text>
                  )}

                  {description && (
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {description}
                    </Text>
                  )}
                </Stack>

                {/* Statistics */}
                {(entity.cited_by_count != null || entity.works_count != null) && (
                  <Group gap="md">
                    {entity.works_count != null && (
                      <Group gap={4}>
                        <Text size="xs" c="dimmed">Works:</Text>
                        <Text size="xs" fw={500}>
                          {formatLargeNumber(entity.works_count)}
                        </Text>
                      </Group>
                    )}

                    {entity.cited_by_count != null && (
                      <Group gap={4}>
                        <Text size="xs" c="dimmed">Citations:</Text>
                        <Text size="xs" fw={500}>
                          {formatLargeNumber(entity.cited_by_count)}
                        </Text>
                      </Group>
                    )}
                  </Group>
                )}

                {/* External ID */}
                {entity.external_id && (
                  <Text size="xs" c="dimmed" tt="uppercase">
                    ID: {entity.external_id}
                  </Text>
                )}

                {/* Quick info */}
                <Group gap="xs" align="center">
                  <IconInfoCircle size={ICON_SIZE.XS} color="var(--mantine-color-dimmed)" />
                  <Text size="xs" c="dimmed" fs="italic">
                    Hover to preview • Click to view • Bookmark to save
                  </Text>
                </Group>
              </Stack>
            </Card>
          </Box>
        )}
      </Transition>
    </Portal>
  );
};

/**
 * Hook to manage hover card state with delays
 * @param _entity
 * @param _onBookmark
 * @param _isBookmarked
 */
export const useSearchResultHover = (
  _entity: AutocompleteResult,
  _onBookmark?: (entity: AutocompleteResult) => Promise<void>,
  _isBookmarked?: boolean
) => {
  const [opened, setOpened] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const hoverTimeoutReference = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutReference = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    const element = e.currentTarget as HTMLElement;
    setTargetElement(element);

    // Clear any pending timeouts
    if (hoverTimeoutReference.current) {
      clearTimeout(hoverTimeoutReference.current);
    }
    if (hideTimeoutReference.current) {
      clearTimeout(hideTimeoutReference.current);
    }

    // Show hover card after delay
    hoverTimeoutReference.current = setTimeout(() => {
      setOpened(true);
    }, HOVER_DELAY);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Clear hover timeout if still pending
    if (hoverTimeoutReference.current) {
      clearTimeout(hoverTimeoutReference.current);
    }

    // Hide with shorter delay
    if (hideTimeoutReference.current) {
      clearTimeout(hideTimeoutReference.current);
    }
    hideTimeoutReference.current = setTimeout(() => {
      setOpened(false);
    }, HIDE_DELAY);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutReference.current) {
        clearTimeout(hoverTimeoutReference.current);
      }
      if (hideTimeoutReference.current) {
        clearTimeout(hideTimeoutReference.current);
      }
    };
  }, []);

  const toggle = useCallback((newOpened: boolean) => {
    setOpened(newOpened);
  }, []);

  return {
    opened,
    targetElement,
    handleMouseEnter,
    handleMouseLeave,
    toggle,
    props: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
};

SearchResultPreview.displayName = "SearchResultPreview";
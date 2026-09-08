import type { Bookmark, EntityType } from "@bibgraph/types";
import { ActionIcon, Badge, Card, Center, Group, Loader,SimpleGrid, Stack, Text, Tooltip } from "@mantine/core";
import { IconBookmarkOff,IconTrash } from "@tabler/icons-react";
import { useState } from "react";

import { TagList } from "./TagBadge";

export interface BookmarkGridProps {
	/**
	 * Array of bookmarks to display
	 */
	bookmarks: Bookmark[];

	/**
	 * Callback fired when a bookmark should be deleted
	 */
	onDeleteBookmark: (bookmarkId: string) => void;

	/**
	 * Callback fired when navigating to a bookmark
	 */
	onNavigate: (url: string) => void;

	/**
	 * Number of columns in the grid
	 * @default 3
	 */
	cols?: number;

	/**
	 * Grid spacing
	 * @default "md"
	 */
	spacing?: "xs" | "sm" | "md" | "lg" | "xl";

	/**
	 * Whether the list is in a loading state
	 * @default false
	 */
	loading?: boolean;

	/**
	 * Message to display when there are no bookmarks
	 * @default "No bookmarks yet"
	 */
	emptyMessage?: string;

	/**
	 * Test ID for E2E testing
	 */
	"data-testid"?: string;
}

/**
 * Get a display-friendly label for entity type
 * @param entityType
 */
const getEntityTypeLabel = (entityType: EntityType): string => entityType.charAt(0).toUpperCase() + entityType.slice(1);

/**
 * Get a color for entity type badges
 * @param entityType
 */
const getEntityTypeColor = (entityType: EntityType): string => {
	const colorMap: Record<EntityType, string> = {
		works: "blue",
		authors: "green",
		sources: "orange",
		institutions: "purple",
		topics: "pink",
		concepts: "cyan",
		publishers: "grape",
		funders: "yellow",
		keywords: "teal",
		domains: "indigo",
		fields: "lime",
		subfields: "violet",
	};
	return colorMap[entityType] || "gray";
};

/**
 * Format a date as relative time
 * @param date
 */
const formatRelativeTime = (date: Date): string => {
	if (!date || Number.isNaN(date.getTime())) {
		return "Invalid date";
	}

	const now = Date.now();
	const timestamp = date.getTime();
	const diffMs = now - timestamp;

	if (diffMs < 0) {
		return "in the future";
	}

	const SECOND = 1000;
	const MINUTE = 60 * SECOND;
	const HOUR = 60 * MINUTE;
	const DAY = 24 * HOUR;
	const WEEK = 7 * DAY;
	const MONTH = 30 * DAY;
	const YEAR = 365 * DAY;

	if (diffMs < 10 * SECOND) return "just now";
	if (diffMs < MINUTE) {
		const seconds = Math.floor(diffMs / SECOND);
		return `${seconds} ${seconds === 1 ? "second" : "seconds"} ago`;
	}
	if (diffMs < HOUR) {
		const minutes = Math.floor(diffMs / MINUTE);
		return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
	}
	if (diffMs < DAY) {
		const hours = Math.floor(diffMs / HOUR);
		return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
	}
	if (diffMs < WEEK) {
		const days = Math.floor(diffMs / DAY);
		return `${days} ${days === 1 ? "day" : "days"} ago`;
	}
	if (diffMs < MONTH) {
		const weeks = Math.floor(diffMs / WEEK);
		return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
	}
	if (diffMs < YEAR) {
		const months = Math.floor(diffMs / MONTH);
		return `${months} ${months === 1 ? "month" : "months"} ago`;
	}
	const years = Math.floor(diffMs / YEAR);
	return `${years} ${years === 1 ? "year" : "years"} ago`;
};

interface BookmarkCardProperties {
	bookmark: Bookmark;
	onDelete: (bookmarkId: string) => void;
	onNavigate: (url: string) => void;
}

const BookmarkCard = ({ bookmark, onDelete, onNavigate }: BookmarkCardProperties) => {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async (event: React.MouseEvent) => {
		event.stopPropagation();
		if (!bookmark.id) return;

		setIsDeleting(true);
		try {
			await onDelete(bookmark.id);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleClick = () => {
		onNavigate(bookmark.metadata.url);
	};

	return (
		<Card
			shadow="sm"
			padding="md"
			radius="md"
			withBorder
			style={{
				cursor: "pointer",
				transition: "transform 0.1s ease, box-shadow 0.1s ease",
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
			onClick={handleClick}
			styles={{
				root: {
					"&:hover": {
						transform: "translateY(-2px)",
						boxShadow: "var(--mantine-shadow-md)",
					},
				},
			}}
		>
			<Stack gap="xs" style={{ flex: 1 }}>
				{/* Header: Entity type badge and delete button */}
				<Group justify="space-between" align="flex-start">
					<Badge color={getEntityTypeColor(bookmark.entityType)} variant="light" size="sm">
						{getEntityTypeLabel(bookmark.entityType)}
					</Badge>

					<Tooltip label="Delete bookmark" withinPortal>
						<ActionIcon
							variant="subtle"
							color="red"
							size="sm"
							onClick={handleDelete}
							disabled={isDeleting}
							loading={isDeleting}
							aria-label="Delete bookmark"
						>
							<IconTrash size={16} />
						</ActionIcon>
					</Tooltip>
				</Group>

				{/* Title */}
				<Text fw={500} size="sm" lineClamp={2} style={{ flex: 1 }}>
					{bookmark.metadata.title}
				</Text>

				{/* Tags */}
				{bookmark.metadata.tags && bookmark.metadata.tags.length > 0 && (
					<Group gap="xs" wrap="wrap">
						<TagList tags={bookmark.metadata.tags} size="xs" variant="light" maxVisible={3} />
					</Group>
				)}

				{/* Footer: Timestamp */}
				<Text size="xs" c="dimmed">
					{formatRelativeTime(bookmark.metadata.timestamp)}
				</Text>
			</Stack>
		</Card>
	);
};

/**
 * Grid view for displaying bookmarks as cards in a responsive grid layout
 * @param root0
 * @param root0.bookmarks
 * @param root0.onDeleteBookmark
 * @param root0.onNavigate
 * @param root0.cols
 * @param root0.spacing
 * @param root0.loading
 * @param root0.emptyMessage
 */
export const BookmarkGrid = ({
	bookmarks,
	onDeleteBookmark,
	onNavigate,
	cols = 3,
	spacing = "md",
	loading = false,
	emptyMessage = "No bookmarks yet",
	...restProps
}: BookmarkGridProps) => {
	// Loading state
	if (loading) {
		return (
			<Center p="xl" {...restProps}>
				<Loader size="md" />
			</Center>
		);
	}

	// Empty state
	if (bookmarks.length === 0) {
		return (
			<Center p="xl" {...restProps}>
				<Stack align="center" gap="md">
					<IconBookmarkOff size={48} stroke={1.5} opacity={0.3} />
					<Text size="sm" c="dimmed" ta="center">
						{emptyMessage}
					</Text>
				</Stack>
			</Center>
		);
	}

	return (
		<SimpleGrid
			cols={{ base: 1, sm: 2, md: cols }}
			spacing={spacing}
			{...restProps}
		>
			{bookmarks.map((bookmark) => (
				<BookmarkCard
					key={bookmark.id}
					bookmark={bookmark}
					onDelete={onDeleteBookmark}
					onNavigate={onNavigate}
				/>
			))}
		</SimpleGrid>
	);
};

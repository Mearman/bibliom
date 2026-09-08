/**
 * Bookmark types and Zod schemas
 * Extends CatalogueEntity for bookmark-specific functionality
 */

import { z } from "zod";

import type { EntityType } from "./entities/entities.js";

/**
 * Metadata specific to bookmark entries
 * Contains full URL context and entity information
 */
export interface BookmarkMetadata {
	/**
	Full URL including query parameters
	 */
	url: string;

	/**
	Page title
	 */
	title: string;

	/**
	Entity type if this is an entity page (works, authors, sources, etc.)
	 */
	entityType?: EntityType;

	/**
	OpenAlex ID if this is an entity page
	 */
	entityId?: string;

	/**
	Preserved query parameters from the URL
	 */
	queryParams?: Record<string, string>;

	/**
	Custom field selections from select parameter
	 */
	selectFields?: string[];

	/**
	User-defined tags for organization
	 */
	tags?: string[];

	/**
	When the bookmark was created
	 */
	timestamp: Date;
}

/**
 * Zod schema for BookmarkMetadata validation
 */
export const BookmarkMetadataSchema = z.object({
	url: z.url(),
	title: z.string(),
	entityType: z
		.enum([
			"works",
			"authors",
			"sources",
			"institutions",
			"topics",
			"concepts",
			"publishers",
			"funders",
			"keywords",
		])
		.optional(),
	entityId: z.string().optional(),
	queryParams: z.record(z.string(), z.string()).optional(),
	selectFields: z.array(z.string()).optional(),
	tags: z.array(z.string()).optional(),
	timestamp: z.date(),
});

/**
 * Bookmark entry extending CatalogueEntity
 * Stored in the special bookmarks list with additional metadata
 */
export interface Bookmark {
	/**
	Unique identifier for the bookmark record
	 */
	id?: string;

	/**
	List ID (should always be SPECIAL_LIST_IDS.BOOKMARKS)
	 */
	listId: string;

	/**
	Entity type (works, authors, etc.)
	 */
	entityType: EntityType;

	/**
	OpenAlex entity ID
	 */
	entityId: string;

	/**
	When entity was added to bookmarks
	 */
	addedAt: Date;

	/**
	Optional notes for this bookmark
	 */
	notes?: string;

	/**
	Order position within the bookmarks list
	 */
	position: number;

	/**
	Bookmark-specific metadata
	 */
	metadata: BookmarkMetadata;
}

/**
 * Zod schema for Bookmark validation
 */
export const BookmarkSchema = z.object({
	id: z.string().optional(),
	listId: z.string(),
	entityType: z.enum([
		"works",
		"authors",
		"sources",
		"institutions",
		"topics",
		"concepts",
		"publishers",
		"funders",
		"keywords",
	]),
	entityId: z.string(),
	addedAt: z.date(),
	notes: z.string().optional(),
	position: z.number(),
	metadata: BookmarkMetadataSchema,
});

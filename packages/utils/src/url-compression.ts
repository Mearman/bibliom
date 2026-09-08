/**
 * URL compression and decompression utilities using Pako
 * Enables sharing catalogue lists via compressed URL parameters
 */

import type { EntityType } from "@bibgraph/types";
import { deflate, inflate } from "pako";

import type { GenericLogger } from "./logger";

// Constants
const LOG_CATEGORY = "url-compression";
const MAX_URL_LENGTH = 2000; // Conservative limit for URL length
const COMPRESSION_LEVEL = 9; // Maximum compression

// Interfaces for compressed data structures
export interface CompressedListData {
  /**
  List metadata
   */
  list: {
    title: string;
    description?: string;
    type: "list" | "bibliography";
    tags?: string[];
  };
  /**
  Entities in the list
   */
  entities: Array<{
    entityType: EntityType;
    entityId: string;
    notes?: string;
  }>;
}

export interface ShareUrlData {
  /**
  Version of the compression format
   */
  v: number;
  /**
  Compressed data (base64)
   */
  d: string;
  /**
  Optional checksum for integrity
   */
  c?: string;
}

/**
 * Compress catalogue list data for URL sharing
 * @param data
 */
export const compressListData = (data: CompressedListData): string => {
  try {
    // Convert data to JSON string
    const jsonString = JSON.stringify({
      v: 1, // Version
      d: data,
    });

    // Compress using Pako
    const compressed = deflate(jsonString, { level: COMPRESSION_LEVEL });

    // Convert to base64 for URL safety
    const base64 = btoa(String.fromCharCode(...compressed));

    // URL-safe base64 (replace + and / with - and _)
    const urlSafe = base64
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '');

    return urlSafe;
  } catch (error) {
    throw new Error(`Failed to compress list data: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Decompress catalogue list data from URL parameter
 * @param compressedData
 */
export const decompressListData = (compressedData: string): CompressedListData | null => {
  try {
    // Restore base64 padding
    let base64 = compressedData.replaceAll('-', '+').replaceAll('_', '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    // Decode base64
    const binaryString = atob(base64);
    const compressed = new Uint8Array(binaryString.length);
    for (let index = 0; index < binaryString.length; index++) {
      compressed[index] = binaryString.charCodeAt(index);
    }

    // Decompress using Pako
    const decompressed = inflate(compressed);
    const jsonString = new TextDecoder().decode(decompressed);

    // Parse JSON
    const parsed = JSON.parse(jsonString);

    // Validate version
    if (parsed.v !== 1) {
      throw new Error(`Unsupported compression version: ${parsed.v}`);
    }

    return parsed.d as CompressedListData;
  } catch {
    // Return null instead of throwing for invalid data
    return null;
  }
};

/**
 * Create a shareable URL for a catalogue list
 * @param baseUrl
 * @param listData
 * @param logger
 */
export const createShareUrl = (baseUrl: string, listData: CompressedListData, logger?: GenericLogger): string => {
  try {
    const compressed = compressListData(listData);

    // Check if URL is too long
    const urlLength = baseUrl.length + compressed.length + 10; // +10 for parameter name and separator
    if (urlLength > MAX_URL_LENGTH) {
      logger?.warn(LOG_CATEGORY, "Generated URL may be too long", {
        urlLength,
        maxLength: MAX_URL_LENGTH,
        entityCount: listData.entities.length,
      });
    }

    // Create URL with compressed data parameter
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}data=${compressed}`;
  } catch (error) {
    logger?.error(LOG_CATEGORY, "Failed to create share URL", { error });
    throw error;
  }
};

/**
 * Extract and decompress catalogue data from URL
 * @param url
 * @param logger
 */
export const extractListDataFromUrl = (url: string, logger?: GenericLogger): CompressedListData | null => {
  try {
    // Extract data parameter from URL
    const urlObject = new URL(url);
    const compressedData = urlObject.searchParams.get('data');

    if (!compressedData) {
      return null;
    }

    return decompressListData(compressedData);
  } catch (error) {
    logger?.error(LOG_CATEGORY, "Failed to extract list data from URL", { url, error });
    return null;
  }
};

/**
 * Validate compressed list data structure
 * @param data
 */
export const validateListData = (data: unknown): data is CompressedListData => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const dataObject = data as Record<string, unknown>;
  const list = dataObject.list;
  const entities = dataObject.entities;

  // Validate list structure
  if (!list || typeof list !== 'object') {
    return false;
  }

  const listObject = list as Record<string, unknown>;
  if (!listObject.title || typeof listObject.title !== 'string') {
    return false;
  }

  if (listObject.type && !['list', 'bibliography'].includes(listObject.type as string)) {
    return false;
  }

  // Validate entities structure
  if (!Array.isArray(entities)) {
    return false;
  }

  const validEntityTypes = new Set([
    'works', 'authors', 'sources', 'institutions', 'topics', 'publishers', 'funders'
  ]);

  for (const entity of entities) {
    if (!entity || typeof entity !== 'object') {
      return false;
    }

    if (!entity.entityType || !validEntityTypes.has(entity.entityType)) {
      return false;
    }

    if (!entity.entityId || typeof entity.entityId !== 'string') {
      return false;
    }
  }

  return true;
};

/**
 * Optimize list data for compression by reducing redundancy
 * @param data
 */
export const optimizeListData = (data: CompressedListData): CompressedListData => ({
    list: {
      title: data.list.title.trim(),
      description: data.list.description?.trim() || undefined,
      type: data.list.type,
      tags: data.list.tags?.filter(tag => tag.trim().length > 0) || undefined,
    },
    entities: data.entities.map(entity => ({
      entityType: entity.entityType,
      entityId: entity.entityId.trim(),
      notes: entity.notes?.trim() || undefined,
    })),
  });

/**
 * Estimate compressed size of list data without actually compressing
 * @param data
 */
export const estimateCompressedSize = (data: CompressedListData): number => {
  const jsonString = JSON.stringify({
    v: 1,
    d: optimizeListData(data),
  });

  // Rough estimate: compressed size is typically 20-40% of original for this type of data
  return Math.ceil(jsonString.length * 0.3);
};

/**
 * Check if list data can be reasonably shared via URL
 * @param data
 */
export const canShareViaUrl = (data: CompressedListData): boolean => {
  const estimatedSize = estimateCompressedSize(data);
  return estimatedSize <= MAX_URL_LENGTH - 100; // Leave buffer for URL structure
};

/**
 * Split large lists into multiple shareable chunks
 * @param data
 */
export const splitListForSharing = (data: CompressedListData): CompressedListData[] => {
  const maxEntities = 50; // Conservative limit per URL
  const chunks: CompressedListData[] = [];

  if (data.entities.length <= maxEntities) {
    return [data];
  }

  // Split entities into chunks
  for (let index = 0; index < data.entities.length; index += maxEntities) {
    const chunkEntities = data.entities.slice(index, index + maxEntities);
    const chunkData: CompressedListData = {
      list: {
        ...data.list,
        title: index === 0 ? data.list.title : `${data.list.title} (Part ${Math.floor(index / maxEntities) + 1})`,
        description: index === 0 ? data.list.description : `Part ${Math.floor(index / maxEntities) + 1} of ${Math.ceil(data.entities.length / maxEntities)}`,
      },
      entities: chunkEntities,
    };

    if (canShareViaUrl(chunkData)) {
      chunks.push(chunkData);
    } else {
      // If even the chunk is too large, split further
      const subChunks = splitListForSharing(chunkData);
      chunks.push(...subChunks);
    }
  }

  return chunks;
};
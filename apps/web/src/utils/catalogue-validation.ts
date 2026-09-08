/**
 * Validation functions for catalogue import/export data
 *
 * These functions ensure data integrity when importing catalogue lists
 * from external sources (files, URLs, shared data).
 *
 * Feature: 004-fix-failing-tests
 * Created: 2025-11-11
 */

import type { ExportFormat } from '../types/catalogue';

/**
 * Validates export format data structure
 * @param data - Unknown data to validate
 * @throws Error if validation fails with descriptive message
 */
export function validateExportFormat(data: unknown): asserts data is ExportFormat {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid format: must be object');
  }

  const format = data as Partial<ExportFormat>;

  if (format.version !== '1.0') {
    throw new Error(`Unsupported version: ${format.version ?? 'undefined'}`);
  }

  if (!format.listMetadata?.title?.trim()) {
    throw new Error('Invalid format: missing list title');
  }

  if (!Array.isArray(format.entities)) {
    throw new TypeError('Invalid format: entities must be array');
  }

  if (format.entities.length !== format.listMetadata.entityCount) {
    throw new Error('Invalid format: entity count mismatch');
  }

  if (format.entities.length > 10_000) {
    throw new Error('Invalid format: too many entities (max 10,000)');
  }

  for (const [index, entity] of format.entities.entries()) {
    if (!entity.entityId || !entity.type || typeof entity.position !== 'number') {
      throw new Error(`Invalid entity at position ${index}`);
    }
    if (entity.position !== index) {
      throw new Error(`Invalid entity position at index ${index}: expected ${index}, got ${entity.position}`);
    }
    if (!entity.metadata || !entity.metadata.displayName) {
      throw new Error(`Invalid entity metadata at position ${index}`);
    }
  }
}

/**
 * Metadata formatting utilities for relationship items
 * Converts raw metadata objects into human-readable strings
 * @module formatMetadata
 */

import type { RelationshipMetadata } from '@/types/relationship';

/**
 * Format authorship metadata into human-readable text
 * @param metadata
 * @param metadata.position
 * @param metadata.isCorresponding
 * @param metadata.affiliations
 */
const formatAuthorshipMetadata = (metadata: {
  position?: number;
  isCorresponding?: boolean;
  affiliations?: string[];
}): string => {
  const parts: string[] = [];

  if (metadata.position !== undefined) {
    const ordinal = getOrdinal(metadata.position);
    parts.push(`${ordinal} author`);
  }

  if (metadata.isCorresponding) {
    parts.push('corresponding');
  }

  if (metadata.affiliations && metadata.affiliations.length > 0) {
    const affiliationText =
      metadata.affiliations.length === 1
        ? metadata.affiliations[0]
        : `${metadata.affiliations.length} affiliations`;
    parts.push(affiliationText);
  }

  return parts.join(' \u{B7} ');
};

/**
 * Format citation metadata into human-readable text
 * @param metadata
 * @param metadata.year
 * @param metadata.context
 */
const formatCitationMetadata = (metadata: {
  year?: number;
  context?: string;
}): string => {
  const parts: string[] = [];

  if (metadata.year !== undefined) {
    parts.push(String(metadata.year));
  }

  if (metadata.context) {
    // Truncate context to reasonable length for display
    const MAX_CONTEXT_LENGTH = 100;
    const truncatedContext =
      metadata.context.length > MAX_CONTEXT_LENGTH
        ? `${metadata.context.slice(0, MAX_CONTEXT_LENGTH)}\u{2026}`
        : metadata.context;
    parts.push(`"${truncatedContext}"`);
  }

  return parts.join(' \u{B7} ');
};

/**
 * Format affiliation metadata into human-readable text
 * @param metadata
 * @param metadata.startDate
 * @param metadata.endDate
 * @param metadata.isPrimary
 */
const formatAffiliationMetadata = (metadata: {
  startDate?: string;
  endDate?: string;
  isPrimary?: boolean;
}): string => {
  const parts: string[] = [];

  if (metadata.isPrimary) {
    parts.push('Primary');
  }

  if (metadata.startDate || metadata.endDate) {
    const dateRange = formatDateRange(metadata.startDate, metadata.endDate);
    if (dateRange) {
      parts.push(dateRange);
    }
  }

  return parts.join(' \u{B7} ');
};

/**
 * Format funding metadata into human-readable text
 * @param metadata
 * @param metadata.awardId
 * @param metadata.amount
 * @param metadata.currency
 */
const formatFundingMetadata = (metadata: {
  awardId?: string;
  amount?: number;
  currency?: string;
}): string => {
  const parts: string[] = [];

  if (metadata.awardId) {
    parts.push(`Award: ${metadata.awardId}`);
  }

  if (metadata.amount !== undefined) {
    const formattedAmount = formatCurrency(metadata.amount, metadata.currency);
    parts.push(formattedAmount);
  }

  return parts.join(' \u{B7} ');
};

/**
 * Format lineage metadata into human-readable text
 * @param metadata
 * @param metadata.level
 */
const formatLineageMetadata = (metadata: { level?: number }): string => {
  if (metadata.level === undefined) {
    return '';
  }

  switch (metadata.level) {
    case 1:
      return 'Direct parent';
    case 2:
      return 'Grandparent';
    default:
      return `Level ${metadata.level}`;
  }
};

/**
 * Format relationship metadata into a human-readable string
 * Uses discriminated union pattern to handle each metadata type appropriately
 * @param metadata
 */
export const formatMetadata = (metadata: RelationshipMetadata): string => {
  switch (metadata.type) {
    case 'authorship':
      return formatAuthorshipMetadata(metadata);
    case 'citation':
      return formatCitationMetadata(metadata);
    case 'affiliation':
      return formatAffiliationMetadata(metadata);
    case 'funding':
      return formatFundingMetadata(metadata);
    case 'lineage':
      return formatLineageMetadata(metadata);
    default:
      // Exhaustive check - TypeScript will error if we miss a case
      return exhaustiveCheck(metadata);
  }
};

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 * @param n
 */
const getOrdinal = (n: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

/**
 * Format a date range string
 * @param startDate
 * @param endDate
 */
const formatDateRange = (startDate?: string, endDate?: string): string => {
  if (!startDate && !endDate) {
    return '';
  }

  const formatDate = (date: string): string => {
    // Handle YYYY-MM-DD format by extracting year or formatting nicely
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return date; // Return as-is if not parseable
    }
    return parsed.getFullYear().toString();
  };

  if (startDate && endDate) {
    return `${formatDate(startDate)}\u{2013}${formatDate(endDate)}`;
  }

  if (startDate) {
    return `${formatDate(startDate)}\u{2013}present`;
  }

  // endDate must exist if we reach here (since we checked both undefined above)
  return `Until ${formatDate(endDate ?? '')}`;
};

/**
 * Format currency with proper locale formatting
 * @param amount
 * @param currency
 */
const formatCurrency = (amount: number, currency = 'USD'): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback for unknown currency codes
    return `${amount.toLocaleString()} ${currency}`;
  }
};

/**
 * Exhaustive type check helper - ensures all discriminated union cases are handled
 * @param value
 */
const exhaustiveCheck = (value: never): string => {
  // If we reach here, we've missed a case in the switch statement
  console.warn('Unhandled metadata type:', value);
  return '';
};

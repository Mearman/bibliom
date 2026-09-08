/**
 * Unpaywall API Client
 * https://unpaywall.org/products/api
 *
 * API Usage Rules:
 * - Email address is REQUIRED in all requests
 * - Rate limit: 100,000 requests/day
 * - Requests should include email in query parameter
 */

import { logger } from "@bibgraph/utils";

import type {
  UnpaywallClientOptions,
  UnpaywallResponse,
} from "./types";

export class UnpaywallApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "UnpaywallApiError";
    this.statusCode = statusCode;
  }
}

export class UnpaywallClient {
  private email: string;
  private baseUrl: string;
  private timeout: number;

  constructor(options: UnpaywallClientOptions) {
    if (!options.email || !options.email.includes('@')) {
      throw new Error('Valid email address is required for Unpaywall API');
    }

    this.email = options.email;
    this.baseUrl = options.baseUrl ?? 'https://api.unpaywall.org/v2';
    this.timeout = options.timeout ?? 10_000;
  }

  /**
   * Normalize DOI to bare DOI format (without URL prefix)
   * @param doi
   */
  private normalizeDoi(doi: string): string {
    // Remove common DOI URL prefixes
    let normalized = doi.trim();

    // Remove https://doi.org/ or https://doi.org/
    normalized = normalized.replace(/^https?:\/\/doi\.org\//i, '');

    // Remove dx.doi.org prefix
    normalized = normalized.replace(/^https?:\/\/dx\.doi\.org\//i, '');

    // Remove doi: prefix
    normalized = normalized.replace(/^doi:/i, '');

    return normalized;
  }

  /**
   * Look up a work by DOI
   * @param doi
   */
  async getByDoi(doi: string): Promise<UnpaywallResponse | null> {
    const normalizedDoi = this.normalizeDoi(doi);

    if (!normalizedDoi) {
      logger.debug('unpaywall', 'Empty DOI provided', { doi });
      return null;
    }

    const url = `${this.baseUrl}/${encodeURIComponent(normalizedDoi)}?email=${encodeURIComponent(this.email)}`;

    logger.debug('unpaywall', 'Fetching Unpaywall data', { doi: normalizedDoi });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        logger.debug('unpaywall', 'DOI not found in Unpaywall', { doi: normalizedDoi });
        return null;
      }

      if (!response.ok) {
        throw new UnpaywallApiError(
          `Unpaywall API error: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json() as UnpaywallResponse;

      logger.debug('unpaywall', 'Unpaywall data retrieved', {
        doi: normalizedDoi,
        isOa: data.is_oa,
        hasPdf: !!data.best_oa_location?.url_for_pdf,
      });

      return data;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new UnpaywallApiError('Unpaywall API request timeout');
      }

      if (error instanceof UnpaywallApiError) {
        throw error;
      }

      logger.error('unpaywall', 'Failed to fetch Unpaywall data', {
        doi: normalizedDoi,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new UnpaywallApiError(
        `Failed to fetch Unpaywall data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get PDF URL for a DOI
   * Returns the best available PDF URL or null
   * @param doi
   */
  async getPdfUrl(doi: string): Promise<string | null> {
    const data = await this.getByDoi(doi);

    if (!data) {
      return null;
    }

    // Try best_oa_location first
    if (data.best_oa_location?.url_for_pdf) {
      return data.best_oa_location.url_for_pdf;
    }

    // Try first_oa_location
    if (data.first_oa_location?.url_for_pdf) {
      return data.first_oa_location.url_for_pdf;
    }

    // Search through all locations
    for (const location of data.oa_locations) {
      if (location.url_for_pdf) {
        return location.url_for_pdf;
      }
    }

    return null;
  }

  /**
   * Update the email used for API requests
   * @param email
   */
  updateEmail(email: string): void {
    if (!email || !email.includes('@')) {
      throw new Error('Valid email address is required for Unpaywall API');
    }
    this.email = email;
  }
}

// Singleton instance - must be initialized with email before use
let clientInstance: UnpaywallClient | null = null;

/**
 * Get or create the Unpaywall client instance
 * Returns null if email is not configured
 * @param email
 */
export const getUnpaywallClient = (email?: string): UnpaywallClient | null => {
  if (email) {
    if (clientInstance) {
      clientInstance.updateEmail(email);
    } else {
      clientInstance = new UnpaywallClient({ email });
    }
    return clientInstance;
  }

  return clientInstance;
};

/**
 * Create a new Unpaywall client with the given email
 * @param email
 */
export const createUnpaywallClient = (email: string): UnpaywallClient => new UnpaywallClient({ email });

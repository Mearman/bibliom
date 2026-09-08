/**
 * Unpaywall API types
 * https://unpaywall.org/products/api
 */

/**
 * OA Location from Unpaywall API
 */
export interface UnpaywallOaLocation {
  /**
  URL for the PDF version
   */
  url_for_pdf: string | null;
  /**
  URL for the landing page
   */
  url_for_landing_page: string | null;
  /**
  Whether PDF is freely available
   */
  is_best: boolean;
  /**
  License for this location
   */
  license: string | null;
  /**
  OA color (green, gold, bronze, hybrid)
   */
  oa_color: string | null;
  /**
  Location type
   */
  host_type: 'publisher' | 'repository';
  /**
  Version of the work
   */
  version: string | null;
  /**
  Evidence type for OA status
   */
  evidence: string | null;
  /**
  PMH ID for repositories
   */
  pmh_id: string | null;
  /**
  Endpoint ID
   */
  endpoint_id: string | null;
  /**
  Repository institution
   */
  repository_institution: string | null;
  /**
  Updated timestamp
   */
  updated: string | null;
}

/**
 * Unpaywall API response for a DOI lookup
 */
export interface UnpaywallResponse {
  /**
  DOI of the work
   */
  doi: string;
  /**
  URL for the DOI
   */
  doi_url: string;
  /**
  Title of the work
   */
  title: string | null;
  /**
  Genre/type of work
   */
  genre: string | null;
  /**
  Whether it's open access
   */
  is_oa: boolean;
  /**
  OA status (green, gold, bronze, hybrid, closed)
   */
  oa_status: 'green' | 'gold' | 'bronze' | 'hybrid' | 'closed';
  /**
  Best OA location
   */
  best_oa_location: UnpaywallOaLocation | null;
  /**
  First OA location
   */
  first_oa_location: UnpaywallOaLocation | null;
  /**
  All OA locations
   */
  oa_locations: UnpaywallOaLocation[];
  /**
  Number of OA locations
   */
  oa_locations_embargoed: UnpaywallOaLocation[];
  /**
  Journal name
   */
  journal_name: string | null;
  /**
  ISSN-L
   */
  journal_issn_l: string | null;
  /**
  All ISSNs
   */
  journal_issns: string | null;
  /**
  Whether journal is in DOAJ
   */
  journal_is_in_doaj: boolean;
  /**
  Publisher name
   */
  publisher: string | null;
  /**
  Publication year
   */
  year: number | null;
  /**
  Data standard version
   */
  data_standard: number;
  /**
  Last updated timestamp
   */
  updated: string;
  /**
  Whether work has repository copy
   */
  has_repository_copy: boolean;
}

/**
 * Unpaywall API error response
 */
export interface UnpaywallErrorResponse {
  error: boolean;
  message: string;
  status_code?: number;
}

/**
 * Options for Unpaywall API client
 */
export interface UnpaywallClientOptions {
  /**
  User email (required by Unpaywall API)
   */
  email: string;
  /**
  Base URL for API
   */
  baseUrl?: string;
  /**
  Request timeout in ms
   */
  timeout?: number;
}

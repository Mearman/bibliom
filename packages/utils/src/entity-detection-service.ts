/**
 * Entity Detection Service
 *
 * Detects and normalizes various external identifier formats into OpenAlex entity types and IDs.
 * Supports DOI, ORCID, ROR, ISSN, OpenAlex URLs and direct OpenAlex IDs.
 *
 * Pure service with no external dependencies - all logic based on regex patterns
 * and identifier format specifications.
 */

import type { EntityType } from "@bibgraph/types"

import { logger } from "./logger.js"

/**
 * Detection result containing the detected entity type and normalized identifier
 */
export interface DetectionResult {
	entityType: EntityType
	normalizedId: string
	originalInput: string
	detectionMethod: string
}

/**
 * Identifier validation patterns and their corresponding entity types
 */
interface IdentifierPattern {
	name: string
	entityType: EntityType
	patterns: RegExp[]
	normalize: (match: string) => string | null
}

/**
 * Comprehensive entity detection service for various identifier formats
 */
export class EntityDetectionService {
	private static readonly patterns: IdentifierPattern[] = [
		// OpenAlex URLs - extract from full URLs (most specific first)
		{
			name: "OpenAlex URL",
			entityType: "works", // Will be overridden by prefix detection
			patterns: [
				/^https?:\/\/(?:api\.)?openalex\.org\/([ACFIKPQSTW]\d+)$/i,
				/(?:api\.)?openalex\.org\/([ACFIKPQSTW]\d+)/i,
			],
			normalize: (match: string): string | null => {
				const idMatch = match.match(/([ACFIKPQSTW]\d+)/i)
				return idMatch ? idMatch[1].toUpperCase() : null
			},
		},

		// OpenAlex Direct IDs - W, A, S, I, P, C, F, T, K prefixes (flexible length for topics)
		{
			name: "OpenAlex ID",
			entityType: "works", // Will be overridden by prefix detection
			patterns: [
				/^([ACFIKPQSW]\d{8,})\/?$/i, // Standard IDs need 8+ digits, optional trailing slash
				/^(T\d{4,})\/?$/i, // Topics can be shorter (T10546), optional trailing slash
			],
			normalize: (match: string): string | null => {
				// Remove trailing slash and convert to uppercase
				return match.replace(/\/$/, "").toUpperCase()
			},
		},

		// DOI patterns - various formats
		{
			name: "DOI",
			entityType: "works",
			patterns: [
				/^doi:(10\.\d+\/\S+)$/i,
				/^(10\.\d+\/\S+)$/,
				/^https?:\/\/doi\.org\/(10\.\d+\/\S+)$/i,
				/^https?:\/\/dx\.doi\.org\/(10\.\d+\/\S+)$/i,
			],
			normalize: (match: string): string | null => {
				// Return DOI in URL format for OpenAlex client compatibility
				// The OpenAlex client can resolve DOI URLs directly
				let doi = match

				// If it's already a DOI URL, ensure it uses HTTPS
				if (doi.startsWith("https://doi.org/") || doi.startsWith("https://doi.org/")) {
					// Convert HTTP to HTTPS for consistency
					return doi.replace(/^http:/, "https:")
				}

				// Extract DOI part from various formats
				if (doi.toLowerCase().startsWith("doi:")) {
					doi = doi.slice(4)
				}

				// Remove any dx.doi.org prefix
				const urlMatch = doi.match(/https?:\/\/(?:dx\.)?doi\.org\/(.+)$/i)
				if (urlMatch) {
					doi = urlMatch[1]
				}

				// Validate DOI format
				if (/^10\.\d+\/\S+$/.test(doi)) {
					// Return DOI in URL format for OpenAlex client
					return `https://doi.org/${doi}`
				}

				return null
			},
		},

		// ORCID patterns
		{
			name: "ORCID",
			entityType: "authors",
			patterns: [
				/^(\d{4}-\d{4}-\d{4}-\d{3}[0-9X])$/i,
				/^https?:\/\/orcid\.org\/(\d{4}-\d{4}-\d{4}-\d{3}[0-9X])$/i,
				/orcid\.org\/(\d{4}-\d{4}-\d{4}-\d{3}[0-9X])/i,
			],
			normalize: (match: string): string | null => {
				// Extract ORCID from URL if present
				const orcidMatch = match.match(/(\d{4}-\d{4}-\d{4}-\d{3}[0-9X])/i)
				if (orcidMatch) {
					const orcid = orcidMatch[1].toUpperCase()
					// Validate ORCID checksum (basic format check)
					if (this.validateOrcidFormat(orcid)) {
						return `https://orcid.org/${orcid}`
					}
				}
				return null
			},
		},

		// ISSN patterns (before ROR to avoid conflicts)
		{
			name: "ISSN",
			entityType: "sources",
			patterns: [
			/^issn:(\d{4}-\d{3}[0-9X])$/i, // issn: prefix format
			/^(\d{4}-\d{3}[0-9X])$/i, // bare format
			/^ISSN\s*(?::\s*)?(\d{4}-\d{3}[0-9X])$/i, // ISSN: label format
		],
			normalize: (match: string): string | null => {
				const issnMatch = match.match(/(\d{4}-\d{3}[0-9X])/i)
				if (issnMatch) {
					const issn = issnMatch[1].toUpperCase()
					// Basic ISSN format validation
					if (this.validateIssnFormat(issn)) {
						// Return in issn: prefix format expected by OpenAlex API
						return `issn:${issn}`
					}
				}
				return null
			},
		},

		// ROR patterns (URLs first, then ror: prefix, then more restrictive plain ID)
		{
			name: "ROR",
			entityType: "institutions",
			patterns: [
				/^https?:\/\/ror\.org\/([0-9a-z]{9})$/i,
				/^ror\.org\/([0-9a-z]{9})$/i,
				/^ror:([0-9a-z]{9})$/i,
				// Raw ROR ID - must be exactly 9 chars and mixed alphanumeric (contains letters)
				/^([0-9a-z]{9})$/i,
			],
			normalize: (match: string): string | null => {
				let rorId = match

				// Extract ROR ID from URL
				const urlMatch = rorId.match(/ror\.org\/([0-9a-z]{9})$/i)
				if (urlMatch) {
					rorId = urlMatch[1]
				}

				// Extract ROR ID from ror: prefix
				const prefixMatch = rorId.match(/^ror:([0-9a-z]{9})$/i)
				if (prefixMatch) {
					rorId = prefixMatch[1]
				}

				// Validate ROR format and checksum
				if (this.validateRorFormat(rorId)) {
					return `https://ror.org/${rorId.toLowerCase()}`
				}

				return null
			},
		},
	]

	/**
	 * Detect entity type from identifier string
	 * @param id
	 */
	static detectEntityType(id: string): EntityType | null {
		if (!id || typeof id !== "string") {
			return null
		}

		const trimmedId = id.trim()

		for (const pattern of this.patterns) {
			for (const regex of pattern.patterns) {
				if (regex.test(trimmedId)) {
					// Check if normalization succeeds to ensure valid identifier
					try {
						const normalized = pattern.normalize.call(this, trimmedId)
						if (normalized === null) {
							continue // Pattern matched but normalization failed, try next pattern
						}
					} catch {
						// Normalization failed, try next pattern
						continue
					}

					// Special handling for OpenAlex IDs - determine type from prefix
					if (pattern.name === "OpenAlex URL" || pattern.name === "OpenAlex ID") {
						const entityType = this.detectOpenAlexEntityType(trimmedId)
						if (entityType) {
							return entityType
						}
					}

					return pattern.entityType
				}
			}
		}

		return null
	}

	/**
	 * Normalize identifier to standard format
	 * @param id
	 */
	static normalizeIdentifier(id: string): string | null {
		if (!id || typeof id !== "string") {
			return null
		}

		const trimmedId = id.trim()

		for (const pattern of this.patterns) {
			for (const regex of pattern.patterns) {
				if (regex.test(trimmedId)) {
					try {
						return pattern.normalize.call(this, trimmedId)
					} catch (error) {
						// Log normalization failure and continue to next pattern
						logger.debug("entity-detection", `Normalization failed for pattern ${pattern.name}`, {
							input: trimmedId,
							pattern: pattern.name,
							error,
						})
						continue
					}
				}
			}
		}

		return null
	}

	/**
	 * Check if identifier is valid and can be detected
	 * @param id
	 */
	static isValidIdentifier(id: string): boolean {
		return this.detectEntityType(id) !== null && this.normalizeIdentifier(id) !== null
	}

	/**
	 * Comprehensive detection that returns full result
	 * @param id
	 */
	static detectEntity(id: string): DetectionResult | null {
		if (!id || typeof id !== "string") {
			return null
		}

		const trimmedId = id.trim()
		const entityType = this.detectEntityType(trimmedId)
		const normalizedId = this.normalizeIdentifier(trimmedId)

		if (!entityType || !normalizedId) {
			return null
		}

		// Find which pattern was used for detection method
		let detectionMethod = "unknown"
		for (const pattern of this.patterns) {
			for (const regex of pattern.patterns) {
				if (regex.test(trimmedId)) {
					detectionMethod = pattern.name
					break
				}
			}
			if (detectionMethod !== "unknown") break
		}

		return {
			entityType,
			normalizedId,
			originalInput: id,
			detectionMethod,
		}
	}

	/**
	 * Batch detection for multiple identifiers
	 * @param ids
	 */
	static detectEntities(ids: string[]): DetectionResult[] {
		return ids
			.map((id) => this.detectEntity(id))
			.filter((result): result is DetectionResult => result !== null)
	}

	/**
	 * Detect OpenAlex entity type from prefix
	 * @param id
	 */
	private static detectOpenAlexEntityType(id: string): EntityType | null {
		// Extract the prefix from various OpenAlex formats
		let prefix = ""

		// Try URL format first
		const urlMatch = id.match(/openalex\.org\/([ACFIKPQSTW])\d+/i)
		if (urlMatch) {
			prefix = urlMatch[1].toUpperCase()
		} else {
			// Try direct ID format
			const idMatch = id.match(/^([ACFIKPQSTW])\d+/i)
			if (idMatch) {
				prefix = idMatch[1].toUpperCase()
			}
		}

		// Map prefixes to entity types
		const prefixMap: Record<string, EntityType> = {
			W: "works",
			A: "authors",
			S: "sources",
			I: "institutions",
			P: "publishers",
			C: "concepts",
			F: "funders",
			T: "topics",
			K: "keywords",
			Q: "keywords", // Alternative keywords prefix
		}

		return prefixMap[prefix] || null
	}

	/**
	 * Validate ROR format
	 *
	 * ROR IDs are 9-character base32 identifiers.
	 * They use characters 0-9 and a-v (excluding i, l, o, u to avoid confusion).
	 * For now, this performs format validation without checksum verification.
	 * @param rorId
	 */
	private static validateRorFormat(rorId: string): boolean {
		if (!rorId || typeof rorId !== "string") {
			return false
		}

		const normalized = rorId.toLowerCase()

		// Basic format validation: exactly 9 characters, alphanumeric, must contain at least one letter
		if (!/^[0-9a-z]{9}$/i.test(normalized) || !/[a-z]/i.test(normalized)) {
			return false
		}

		// Validate against ROR base32 character set (0-9, a-v, excluding i, l, o, u)
		const validRorChars = /^[0-9a-hjkmnp-tv-z]{9}$/
		return validRorChars.test(normalized)
	}

	/**
	 * Validate ORCID format (basic check - doesn't verify checksum)
	 * @param orcid
	 */
	private static validateOrcidFormat(orcid: string): boolean {
		return /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/i.test(orcid)
	}

	/**
	 * Validate ISSN format (basic check - doesn't verify checksum)
	 * @param issn
	 */
	private static validateIssnFormat(issn: string): boolean {
		return /^\d{4}-\d{3}[0-9X]$/i.test(issn)
	}

	/**
	 * Get all supported identifier types and their patterns
	 */
	static getSupportedTypes(): Array<{
		name: string
		entityType: EntityType
		description: string
		examples: string[]
	}> {
		return [
			{
				name: "DOI",
				entityType: "works",
				description: "Digital Object Identifier for academic works",
				examples: [
					"10.1038/nature12373",
					"doi:10.1038/nature12373",
					"https://doi.org/10.1038/nature12373",
				],
			},
			{
				name: "ORCID",
				entityType: "authors",
				description: "ORCID identifier for researchers",
				examples: ["0000-0002-1825-0097", "https://orcid.org/0000-0002-1825-0097"],
			},
			{
				name: "ROR",
				entityType: "institutions",
				description: "Research Organization Registry identifier",
				examples: ["05dxps055", "ror:05dxps055", "https://ror.org/05dxps055", "ror.org/05dxps055"],
			},
			{
				name: "ISSN",
				entityType: "sources",
				description: "International Standard Serial Number for periodicals",
				examples: ["2049-3630", "ISSN: 2049-3630"],
			},
			{
				name: "OpenAlex ID",
				entityType: "works", // varies by prefix
				description:
					"Direct OpenAlex identifier (W=works, A=authors, S=sources, I=institutions, P=publishers, C=concepts, F=funders, T=topics, K=keywords)",
				examples: ["W2741809807", "A5023888391", "S137773608", "I17837204"],
			},
			{
				name: "OpenAlex URL",
				entityType: "works", // varies by prefix
				description: "OpenAlex URL format",
				examples: [
					"https://openalex.org/W2741809807",
					"https://api.openalex.org/W2741809807",
					"https://openalex.org/A5023888391",
				],
			},
		]
	}
}

// Convenience exports for direct function usage
export const detectEntityType = EntityDetectionService.detectEntityType.bind(EntityDetectionService)
export const normalizeIdentifier =
	EntityDetectionService.normalizeIdentifier.bind(EntityDetectionService)
export const isValidIdentifier =
	EntityDetectionService.isValidIdentifier.bind(EntityDetectionService)
export const detectEntity = EntityDetectionService.detectEntity.bind(EntityDetectionService)

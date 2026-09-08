/**
 * Cache Browser Service - UI-agnostic service for browsing cached entities
 * Scans pure Dexie stores and provides metadata about cached OpenAlex entities
 * Simplified from hybrid approach - no localStorage scanning
 */

import { Dexie } from "dexie"

type DexieInstance = InstanceType<typeof Dexie>
import type { GenericLogger } from "../logger.js"
import type {
	CacheBrowserFilters,
	CacheBrowserOptions,
	CacheBrowserResult,
	CacheBrowserStats,
	CachedEntityMetadata,
	CacheStorageType,
} from "./types.js"

export interface CacheBrowserConfig {
	// IndexedDB configuration
	dbName: string
	version: number

	// Storage locations to scan (simplified - only Dexie)
	includeIndexedDB: boolean
	includeRepositoryStore: boolean

	// Performance settings
	maxScanItems: number
	batchSize: number
}

// Default configuration (removed localStorage options)
const DEFAULT_CONFIG: CacheBrowserConfig = {
	dbName: "bibgraph",
	version: 1,
	includeIndexedDB: true,
	includeRepositoryStore: true,
	maxScanItems: 10_000,
	batchSize: 100,
}

// Constants
const CACHE_BROWSER_LOG_CONTEXT = "cache-browser"

// Entity type detection patterns (unchanged)
const ENTITY_TYPE_PATTERNS: Record<CacheStorageType, RegExp[]> = {
	works: [/^W\d+$/, /\/works\/W\d+/, /works-.*/, /work_/],
	authors: [/^A\d+$/, /\/authors\/A\d+/, /authors-.*/, /author_/],
	sources: [/^S\d+$/, /\/sources\/S\d+/, /sources-.*/, /source_/],
	institutions: [/^I\d+$/, /\/institutions\/I\d+/, /institutions-.*/, /institution_/],
	topics: [/^T\d+$/, /\/topics\/T\d+/, /topics-.*/, /topic_/],
	concepts: [/^C\d+$/, /\/concepts\/C\d+/, /concepts-.*/, /concept_/],
	publishers: [/^P\d+$/, /\/publishers\/P\d+/, /publishers-.*/, /publisher_/],
	funders: [/^F\d+$/, /\/funders\/F\d+/, /funders-.*/, /funder_/],
	keywords: [/keyword/, /\/keywords\//, /keywords-.*/, /keyword_/],
	domains: [/domain/, /\/domains\//, /domains-.*/, /domain_/],
	fields: [/field/, /\/fields\//, /fields-.*/, /field_/],
	subfields: [/subfield/, /\/subfields\//, /subfields-.*/, /subfield_/],
	autocomplete: [/autocomplete/, /\/autocomplete\//, /autocomplete-.*/, /autocomplete_/],
}

// All entity types as a constant array for safe iteration
const ALL_ENTITY_TYPES: readonly CacheStorageType[] = [
	"works",
	"authors",
	"sources",
	"institutions",
	"topics",
	"concepts",
	"publishers",
	"funders",
	"keywords",
	"domains",
	"fields",
	"subfields",
	"autocomplete",
] as const

export class CacheBrowserService {
	private config: CacheBrowserConfig
	private logger?: GenericLogger
	private dbCache?: DexieInstance

	constructor(config: Partial<CacheBrowserConfig> = {}, logger?: GenericLogger) {
		this.config = { ...DEFAULT_CONFIG, ...config }
		this.logger = logger
	}

	/**
	 * Browse cached entities with filtering and pagination
	 * @param filters
	 * @param options
	 */
	async browse(
		filters: Partial<CacheBrowserFilters> = {},
		options: Partial<CacheBrowserOptions> = {}
	): Promise<CacheBrowserResult> {
		const startTime = Date.now()

		this.logger?.debug(CACHE_BROWSER_LOG_CONTEXT, "Starting cache browse operation", {
			filters,
			options,
		})

		try {
			// Merge with defaults (removed localStorage from storageLocations)
			const mergedFilters: CacheBrowserFilters = {
				searchQuery: "",
				entityTypes: new Set(ALL_ENTITY_TYPES),
				storageLocations: new Set(["indexeddb", "repository"]),
				...filters,
			}

			const mergedOptions: CacheBrowserOptions = {
				includeRepositoryData: true,
				includeBasicInfo: true,
				sortBy: "timestamp",
				sortDirection: "desc",
				limit: 100,
				offset: 0,
				...options,
			}

			// Collect entities from available sources
			const allEntities: CachedEntityMetadata[] = []

			if (this.config.includeIndexedDB) {
				const indexedDBEntities = await this.scanIndexedDB(mergedFilters)
				allEntities.push(...indexedDBEntities)
			}

			if (this.config.includeRepositoryStore) {
				const repoEntities = await this.scanRepositoryStore()
				allEntities.push(...repoEntities)
			}

			// Apply filters and sorting
			const filteredEntities = this.applyFilters({
				entities: allEntities,
				filters: mergedFilters,
			})
			const sortedEntities = this.applySorting({
				entities: filteredEntities,
				options: mergedOptions,
			})

			// Apply pagination
			const paginatedEntities = this.applyPagination({
				entities: sortedEntities,
				options: mergedOptions,
			})

			// Calculate statistics
			const stats = this.calculateStats(allEntities)

			const result: CacheBrowserResult = {
				entities: paginatedEntities,
				stats,
				hasMore: (mergedOptions.offset ?? 0) + paginatedEntities.length < sortedEntities.length,
				totalMatching: sortedEntities.length,
			}

			const duration = Date.now() - startTime
			this.logger?.debug(CACHE_BROWSER_LOG_CONTEXT, "Cache browse completed", {
				duration,
				totalFound: allEntities.length,
				filteredCount: sortedEntities.length,
				returnedCount: paginatedEntities.length,
			})

			return result
		} catch (error) {
			this.logger?.error(CACHE_BROWSER_LOG_CONTEXT, "Cache browse failed", {
				error,
			})
			throw error
		}
	}

	/**
	 * Get cache statistics without full browse
	 */
	async getStats(): Promise<CacheBrowserStats> {
		const allEntities = await this.getAllEntities()
		return this.calculateStats(allEntities)
	}

	/**
	 * Clear cached entities based on filters
	 * @param filters
	 */
	async clearCache(filters: Partial<CacheBrowserFilters> = {}): Promise<number> {
		this.logger?.debug(CACHE_BROWSER_LOG_CONTEXT, "Starting cache clear operation", {
			filters,
		})

		const entities = await this.getAllEntities()
		const filteredEntities = this.applyFilters({
			entities,
			filters: {
				searchQuery: "",
				entityTypes: new Set(ALL_ENTITY_TYPES),
				storageLocations: new Set(["indexeddb"]),
				...filters,
			},
		})

		let clearedCount = 0

		// Clear from IndexedDB
		if (this.config.includeIndexedDB) {
			clearedCount += await this.clearFromIndexedDB(filteredEntities)
		}

		this.logger?.debug(CACHE_BROWSER_LOG_CONTEXT, "Cache clear completed", {
			clearedCount,
		})
		return clearedCount
	}

	private async scanIndexedDB(filters: CacheBrowserFilters): Promise<CachedEntityMetadata[]> {
		if (!this.isIndexedDBAvailable()) {
			return []
		}

		try {
			const database = await this.getDB()
			const entities: CachedEntityMetadata[] = []

			// Get all table names from the Dexie database
			// Note: Dexie doesn't expose tables directly, so we'll get them from the schema
			const tableNames: string[] = []
			// Try to access table names through the internal schema
			interface DexieWithTables {
				tables: Array<{ name: string }>
			}
			if ('tables' in database && Array.isArray((database as DexieWithTables).tables)) {
				tableNames.push(...(database as DexieWithTables).tables.map((table) => table.name))
			} else {
				// Fallback: try common OpenAlex table names
				tableNames.push('works', 'authors', 'sources', 'institutions', 'topics', 'publishers', 'funders', 'keywords', 'concepts', 'autocomplete')
			}

			for (const tableName of tableNames) {
				try {
					const table = database.table(tableName)
					await table.each((item: unknown, cursor) => {
						if (entities.length >= this.config.maxScanItems) {
							return false // Stop iteration
						}

						// Dexie stores objects with keys, so we need to extract key and value
						const key = String(cursor.primaryKey)
						const value = item

						const entityMetadata = this.extractEntityMetadata(key, value, "indexeddb", tableName)

						if (entityMetadata && this.matchesTypeFilter({ entity: entityMetadata, filters })) {
							entities.push(entityMetadata)
						}
					})
				} catch (error) {
					this.logger?.warn(CACHE_BROWSER_LOG_CONTEXT, `Failed to scan table ${tableName}`, { error })
				}
			}

			return entities
		} catch (error) {
			this.logger?.error(CACHE_BROWSER_LOG_CONTEXT, "IndexedDB scan failed", {
				error,
			})
			return []
		}
	}

	private async scanRepositoryStore(): Promise<CachedEntityMetadata[]> {
		// This would integrate with the repository store if available
		// For now, return empty array as repository store scanning would need
		// to be integrated at the application level
		this.logger?.debug(CACHE_BROWSER_LOG_CONTEXT, "Repository store scanning not implemented yet")
		return []
	}

	private extractEntityMetadata(
		key: string,
		value: unknown,
		storageLocation: CachedEntityMetadata["storageLocation"],
		storeName?: string // eslint-disable-line @typescript-eslint/no-unused-vars
	): CachedEntityMetadata | null {
		try {
			// Detect entity type from key
			const entityType = this.detectCacheStorageType(key)
			if (!entityType) {
				return null
			}

			// Parse value if it's a string
			let parsedValue = value
			if (typeof value === "string") {
				try {
					parsedValue = JSON.parse(value)
				} catch {
					// Not JSON, treat as string
				}
			}

			// Extract basic info from parsed data
			const basicInfo = this.extractBasicInfo({
				value: parsedValue,
			})
			const dataSize = this.calculateDataSize(value)

			// Try to extract entity ID
			const entityId = this.extractEntityId({
				key,
				value: parsedValue,
				type: entityType,
			})

			return {
				id: entityId ?? key,
				type: entityType,
				label: basicInfo?.displayName ?? entityId ?? key,
				cacheTimestamp: Date.now(), // We don't have actual cache timestamp, use current time
				storageLocation,
				dataSize,
				basicInfo,
				externalIds: this.extractExternalIds(parsedValue),
			}
		} catch (error) {
			this.logger?.debug(CACHE_BROWSER_LOG_CONTEXT, "Failed to extract metadata", {
				key,
				error,
			})
			return null
		}
	}

	private detectCacheStorageType(key: string): CacheStorageType | null {
		for (const type of ALL_ENTITY_TYPES) {
			const patterns = ENTITY_TYPE_PATTERNS[type]
			for (const pattern of patterns) {
				if (pattern.test(key)) {
					return type
				}
			}
		}
		return null
	}

	private extractEntityId({
		key,
		value,
		type,
	}: {
		key: string
		value: unknown
		type: CacheStorageType
	}): string | null {
		// Try to extract from parsed value first
		if (value && typeof value === "object" && value !== null) {
			const object = value as Record<string, unknown>
			const id = object.id
			if (typeof id === "string") {
				return id
			}
			const displayName = object.display_name
			if (typeof displayName === "string" && displayName.startsWith(type.charAt(0).toUpperCase())) {
				return displayName
			}
		}

		// Extract from key using patterns
		const patterns = ENTITY_TYPE_PATTERNS[type]
		for (const pattern of patterns) {
			const match = key.match(pattern)
			if (match) {
				return match[0]
			}
		}

		return null
	}

	private extractBasicInfo({
		value,
	}: {
		value: unknown
	}): CachedEntityMetadata["basicInfo"] | undefined {
		if (!value || typeof value !== "object" || value === null) {
			return undefined
		}

		const object = value as Record<string, unknown>

		return {
			displayName: typeof object.display_name === "string" ? object.display_name : undefined,
			description: typeof object.description === "string" ? object.description : undefined,
			url: typeof object.url === "string" ? object.url : undefined,
			citationCount: typeof object.cited_by_count === "number" ? object.cited_by_count : undefined,
			worksCount: typeof object.works_count === "number" ? object.works_count : undefined,
		}
	}

	private extractExternalIds(value: unknown): Record<string, string> | undefined {
		if (!value || typeof value !== "object" || value === null) {
			return undefined
		}

		const object = value as Record<string, unknown>
		const externalIds: Record<string, string> = {}

		// Common external ID fields
		const idFields = ["doi", "orcid", "ror", "issn", "isbn", "pmid", "pmcid", "wikidata"]

		for (const field of idFields) {
			const fieldValue = object[field]
			if (typeof fieldValue === "string") {
				externalIds[field] = fieldValue
			}
		}

		// Check for ids object
		const ids = object.ids
		if (ids && typeof ids === "object" && ids !== null) {
			const idsObject = ids as Record<string, unknown>
			for (const [key, value_] of Object.entries(idsObject)) {
				if (typeof value_ === "string") {
					externalIds[key] = value_
				}
			}
		}

		return Object.keys(externalIds).length > 0 ? externalIds : undefined
	}

	private calculateDataSize(value: unknown): number {
		if (typeof value === "string") {
			return new Blob([value]).size
		}

		try {
			return new Blob([JSON.stringify(value)]).size
		} catch {
			return 0
		}
	}

	private matchesTypeFilter({
		entity,
		filters,
	}: {
		entity: CachedEntityMetadata
		filters: CacheBrowserFilters
	}): boolean {
		return (
			filters.entityTypes.has(entity.type) && filters.storageLocations.has(entity.storageLocation)
		)
	}

	private applyFilters({
		entities,
		filters,
	}: {
		entities: CachedEntityMetadata[]
		filters: CacheBrowserFilters
	}): CachedEntityMetadata[] {
		return entities.filter((entity) => {
			// Search query filter
			if (filters.searchQuery) {
				const query = filters.searchQuery.toLowerCase()
				if (!entity.label.toLowerCase().includes(query) && !entity.id.toLowerCase().includes(query)) {
					return false
				}
			}

			// Date range filter
			if (
				filters.dateRange &&
				(entity.cacheTimestamp < filters.dateRange.start ||
					entity.cacheTimestamp > filters.dateRange.end)
			) {
				return false
			}

			// Size range filter
			if (
				filters.sizeRange &&
				(entity.dataSize < filters.sizeRange.min || entity.dataSize > filters.sizeRange.max)
			) {
				return false
			}

			return true
		})
	}

	private applySorting({
		entities,
		options,
	}: {
		entities: CachedEntityMetadata[]
		options: CacheBrowserOptions
	}): CachedEntityMetadata[] {
		return [...entities].sort((a, b) => {
			let comparison = 0

			switch (options.sortBy) {
				case "timestamp":
					comparison = a.cacheTimestamp - b.cacheTimestamp
					break
				case "type":
					comparison = a.type.localeCompare(b.type)
					break
				case "label":
					comparison = a.label.localeCompare(b.label)
					break
				case "size":
					comparison = a.dataSize - b.dataSize
					break
				case "lastAccessed":
					comparison = (a.lastAccessed ?? 0) - (b.lastAccessed ?? 0)
					break
				default:
					comparison = a.label.localeCompare(b.label)
			}

			return options.sortDirection === "desc" ? -comparison : comparison
		})
	}

	private applyPagination({
		entities,
		options,
	}: {
		entities: CachedEntityMetadata[]
		options: CacheBrowserOptions
	}): CachedEntityMetadata[] {
		const offset = options.offset ?? 0
		const limit = options.limit ?? entities.length
		return entities.slice(offset, offset + limit)
	}

	private calculateStats(entities: CachedEntityMetadata[]): CacheBrowserStats {
		const entitiesByType: Record<CacheStorageType, number> = {
			works: 0,
			authors: 0,
			sources: 0,
			institutions: 0,
			topics: 0,
			concepts: 0,
			publishers: 0,
			funders: 0,
			keywords: 0,
			domains: 0,
			fields: 0,
			subfields: 0,
			autocomplete: 0,
		}

		const entitiesByStorage: Record<string, number> = {}
		let totalCacheSize = 0
		let oldestEntry = Date.now()
		let newestEntry = 0

		for (const entity of entities) {
			entitiesByType[entity.type]++
			entitiesByStorage[entity.storageLocation] = (entitiesByStorage[entity.storageLocation] || 0) + 1
			totalCacheSize += entity.dataSize
			oldestEntry = Math.min(oldestEntry, entity.cacheTimestamp)
			newestEntry = Math.max(newestEntry, entity.cacheTimestamp)
		}

		return {
			totalEntities: entities.length,
			entitiesByType,
			entitiesByStorage,
			totalCacheSize,
			oldestEntry: entities.length > 0 ? oldestEntry : 0,
			newestEntry,
		}
	}

	private async getAllEntities(): Promise<CachedEntityMetadata[]> {
		const result = await this.browse({}, { limit: this.config.maxScanItems })
		return result.entities
	}

	private async clearFromIndexedDB(entities: CachedEntityMetadata[]): Promise<number> {
		// Implementation for clearing IndexedDB entries
		// This would need to be implemented based on the specific storage structure
		this.logger?.debug(CACHE_BROWSER_LOG_CONTEXT, "IndexedDB clearing not fully implemented", {
			count: entities.length,
		})
		return 0
	}

	private async getDB(): Promise<DexieInstance> {
		if (!this.dbCache) {
			// Create a Dexie instance for the database
			// We'll use dynamic table access since we need to scan arbitrary stores
			this.dbCache = new Dexie(this.config.dbName)
			// Open the database without schema definition to allow dynamic access
			interface DexieOpenable {
				open(): Promise<DexieInstance>
			}
			await (this.dbCache as DexieOpenable).open()
		}
		return this.dbCache
	}

	private isIndexedDBAvailable(): boolean {
		try {
			return typeof indexedDB !== "undefined"
		} catch {
			return false
		}
	}
}

// Export default instance
export const cacheBrowserService = new CacheBrowserService()

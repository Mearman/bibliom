/**
 * Generic data manipulation utilities
 * These utilities are domain-agnostic and can be used across packages
 */

// Native JavaScript implementations replacing lodash-es

/**
 * Debounce function calls
 * @param func
 * @param wait
 */
const debounce = <T extends unknown[]>(func: (...arguments_: T) => void, wait: number): (...arguments_: T) => void => {
	let timeout: NodeJS.Timeout | undefined
	return (...arguments_: T) => {
		clearTimeout(timeout)
		timeout = setTimeout(() => func(...arguments_), wait)
	}
};

/**
 * Remove duplicate items from an array by a specific key
 * @param array
 * @param key
 */
const uniqBy = <T>(array: T[], key: keyof T | ((item: T) => unknown)): T[] => {
	const seen = new Set()
	return array.filter(item => {
		const k = typeof key === 'function' ? key(item) : item[key]
		if (seen.has(k)) return false
		seen.add(k)
		return true
	})
};

/**
 * Sort items by a property
 * @param array
 * @param key
 */
const sortBy = <T>(array: T[], key: keyof T | ((item: T) => unknown)): T[] => [...array].sort((a, b) => {
		const aValue = typeof key === 'function' ? key(a) : a[key]
		const bValue = typeof key === 'function' ? key(b) : b[key]

		// Handle unknown types with proper comparison
		if (aValue == null && bValue == null) return 0
		if (aValue == null) return -1
		if (bValue == null) return 1

		const aString = String(aValue)
		const bString = String(bValue)

		if (aString < bString) return -1
		if (aString > bString) return 1
		return 0
	});

/**
 * Group items by a property
 * @param array
 * @param key
 */
const groupBy = <T>(array: T[], key: keyof T | ((item: T) => unknown)): Record<string, T[]> => array.reduce((groups, item) => {
		const k = typeof key === 'function' ? key(item) : item[key]
		const groupKey = String(k)
		if (!groups[groupKey]) groups[groupKey] = []
		groups[groupKey].push(item)
		return groups
	}, {} as Record<string, T[]>);

/**
 * Create a new object without specified keys
 * @param obj
 * @param keys
 */
const omit = <T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
	const result = { ...obj }
	for (const key of keys) delete result[key]
	return result
};

/**
 * Create a new object with only specified keys
 * @param obj
 * @param keys
 */
const pick = <T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
	const result = {} as Pick<T, K>
	for (const key of keys) {
		if (key in obj) result[key] = obj[key]
	}
	return result
};

/**
 * Check if value is empty
 * @param value
 */
const isEmpty = (value: unknown): boolean => {
	if (value == null) return true
	if (Array.isArray(value) || typeof value === 'string') return value.length === 0
	if (typeof value === 'object') return Object.keys(value).length === 0
	return false
};

/**
 * Check if value is an array
 * @param value
 */
const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

/**
 * Check if value is a string
 * @param value
 */
const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * Debounced search function for user input
 */
export const debouncedSearch = debounce((searchFunction: (query: string) => void, query: string) => {
	searchFunction(query)
}, 300)

/**
 * Remove duplicate items from an array by a specific key
 * @param root0
 * @param root0.array
 * @param root0.key
 */
export const removeDuplicatesBy = <T>({ array, key }: { array: T[]; key: keyof T }): T[] => uniqBy(array, key);

/**
 * Sort items by a numeric property (descending by default)
 * @param root0
 * @param root0.items
 * @param root0.getProperty
 * @param root0.ascending
 */
export const sortByNumericProperty = <T>({
	items,
	getProperty,
	ascending = false,
}: {
	items: T[]
	getProperty: (item: T) => number | null | undefined
	ascending?: boolean
}): T[] => {
	const sorted = sortBy(items, (item) => getProperty(item) ?? 0)
	return ascending ? sorted : sorted.reverse()
};

/**
 * Sort items by a string property (ascending by default)
 * @param items
 * @param getProperty
 * @param ascending
 */
export const sortByStringProperty = <T>(items: T[], getProperty: (item: T) => string | null | undefined, ascending = true): T[] => {
	const sorted = sortBy(items, (item) => getProperty(item) ?? "")
	return ascending ? sorted : sorted.reverse()
};

/**
 * Group items by a property value
 * @param items
 * @param getGroupKey
 */
export const groupByProperty = <T>(items: T[], getGroupKey: (item: T) => string | number): Record<string, T[]> => groupBy(items, (item) => {
		const key = getGroupKey(item)
		return key.toString()
	});

/**
 * Extract safe properties from an object, omitting undefined/null values
 * @param root0
 * @param root0.obj
 * @param root0.keys
 */
export const extractSafeProperties = <T extends Record<string, unknown>, K extends keyof T>({
	obj,
	keys,
}: {
	obj: T
	keys: K[]
}): Pick<T, K> => pick(obj, keys);

/**
 * Remove sensitive or unnecessary properties from objects
 * @param root0
 * @param root0.obj
 * @param root0.keysToOmit
 */
export const sanitizeObject = <T extends Record<string, unknown>>({
	obj,
	keysToOmit,
}: {
	obj: T
	keysToOmit: (keyof T)[]
}): Omit<T, keyof T> => omit(obj, keysToOmit);

/**
 * Check if a search query is valid (not empty, not just whitespace)
 * @param query
 */
export const isValidSearchQuery = (query: unknown): query is string => isString(query) && query.trim().length > 0;

/**
 * Normalize search query (trim, lowercase)
 * @param query
 */
export const normalizeSearchQuery = (query: string): string => query.trim().toLowerCase();

/**
 * Check if an array contains valid data
 * @param data
 */
export const hasValidData = <T>(data: unknown): data is T[] => isArray(data) && !isEmpty(data);

/**
 * Get display name with fallback from multiple possible properties
 * @param item
 * @param item.display_name
 * @param item.title
 * @param item.name
 * @param fallback
 */
export const getDisplayName = (item: {
		display_name?: string | null
		title?: string | null
		name?: string | null
	}, fallback = "Untitled"): string => item.display_name ?? item.title ?? item.name ?? fallback;

/**
 * Format large numbers with K/M suffixes
 * @param num
 */
export const formatLargeNumber = (num: number | null | undefined): string => {
	if (!num || num === 0) return "0"

	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(1)}M`
	}

	if (num >= 1000) {
		return `${(num / 1000).toFixed(1)}K`
	}

	return num.toString()
};

/**
 * Format percentage with specified decimal places
 * @param value
 * @param decimals
 */
export const formatPercentage = (value: number, decimals = 1): string => `${value.toFixed(decimals)}%`;

/**
 * Clamp a number between min and max values
 * @param root0
 * @param root0.value
 * @param root0.min
 * @param root0.max
 */
export const clamp = ({ value, min, max }: { value: number; min: number; max: number }): number => Math.min(Math.max(value, min), max);

/**
 * Create a range of numbers from start to end
 * @param start
 * @param end
 * @param step
 */
export const range = (start: number, end: number, step = 1): number[] => {
	const result: number[] = []
	for (let index = start; index < end; index += step) {
		result.push(index)
	}
	return result
};

/**
 * Chunk an array into smaller arrays of specified size
 * @param root0
 * @param root0.array
 * @param root0.size
 */
export const chunk = <T>({ array, size }: { array: T[]; size: number }): T[][] => {
	const chunks: T[][] = []
	for (let index = 0; index < array.length; index += size) {
		chunks.push(array.slice(index, index + size))
	}
	return chunks
};

/**
 * Flatten a nested array by one level
 * @param arrays
 */
export const flatten = <T>(arrays: T[][]): T[] => arrays.flat();

/**
 * Create a Map from an array using a key function
 * @param root0
 * @param root0.array
 * @param root0.getKey
 */
export const arrayToMap = <T, K>({
	array,
	getKey,
}: {
	array: T[]
	getKey: (item: T) => K
}): Map<K, T> => {
	const map = new Map<K, T>()
	for (const item of array) {
		map.set(getKey(item), item)
	}
	return map
};

/**
 * Create a lookup object from an array using a key function
 * @param root0
 * @param root0.array
 * @param root0.getKey
 */
export const arrayToLookup = <T>({
	array,
	getKey,
}: {
	array: T[]
	getKey: (item: T) => string | number
}): Record<string, T> => {
	const lookup: Record<string, T> = {}
	for (const item of array) {
		const key = getKey(item).toString()
		lookup[key] = item
	}
	return lookup
};

/**
 * Get unique values from an array
 * @param array
 */
export const unique = <T>(array: T[]): T[] => [...new Set(array)];

/**
 * Get intersection of two arrays
 * @param root0
 * @param root0.array1
 * @param root0.array2
 */
export const intersection = <T>({ array1, array2 }: { array1: T[]; array2: T[] }): T[] => {
	const set2 = new Set(array2)
	return array1.filter((item) => set2.has(item))
};

/**
 * Get difference between two arrays (items in first but not second)
 * @param root0
 * @param root0.array1
 * @param root0.array2
 */
export const difference = <T>({ array1, array2 }: { array1: T[]; array2: T[] }): T[] => {
	const set2 = new Set(array2)
	return array1.filter((item) => !set2.has(item))
};

/**
 * Sample random items from an array
 * @param root0
 * @param root0.array
 * @param root0.count
 */
export const sample = <T>({ array, count }: { array: T[]; count: number }): T[] => {
	if (count >= array.length) return [...array]

	const shuffled = [...array].sort(() => Math.random() - 0.5)
	return shuffled.slice(0, count)
};

/**
 * Deep clone an object/array using structuredClone
 * Note: This only works with structuredClone-compatible data
 * @param obj
 */
export const deepClone = <T>(obj: T): T => structuredClone(obj);

/**
 * Merge arrays and remove duplicates
 * @param arrays
 */
export const mergeUnique = <T>(...arrays: T[][]): T[] => unique(flatten(arrays));

/**
 * Partition an array into two arrays based on a predicate
 * @param root0
 * @param root0.array
 * @param root0.predicate
 */
export const partition = <T>({
	array,
	predicate,
}: {
	array: T[]
	predicate: (item: T) => boolean
}): [T[], T[]] => {
	const truthy: T[] = []
	const falsy: T[] = []

	for (const item of array) {
		if (predicate(item)) {
			truthy.push(item)
		} else {
			falsy.push(item)
		}
	}

	return [truthy, falsy]
};

/**
 * Get the maximum value in an array using a selector function
 * @param root0
 * @param root0.array
 * @param root0.selector
 */
export const maxBy = <T>({
	array,
	selector,
}: {
	array: T[]
	selector: (item: T) => number
}): T | undefined => {
	if (array.length === 0) return undefined

	return array.reduce((max, current) => (selector(current) > selector(max) ? current : max), array[0])
};

/**
 * Get the minimum value in an array using a selector function
 * @param root0
 * @param root0.array
 * @param root0.selector
 */
export const minBy = <T>({
	array,
	selector,
}: {
	array: T[]
	selector: (item: T) => number
}): T | undefined => {
	if (array.length === 0) return undefined

	return array.reduce((min, current) => (selector(current) < selector(min) ? current : min), array[0])
};

/**
 * Sum values in an array using a selector function
 * @param root0
 * @param root0.array
 * @param root0.selector
 */
export const sumBy = <T>({
	array,
	selector,
}: {
	array: T[]
	selector: (item: T) => number
}): number => array.reduce((sum, item) => sum + selector(item), 0);

/**
 * Calculate average of values in an array using a selector function
 * @param root0
 * @param root0.array
 * @param root0.selector
 */
export const averageBy = <T>({
	array,
	selector,
}: {
	array: T[]
	selector: (item: T) => number
}): number => {
	if (array.length === 0) return 0
	return sumBy({ array, selector }) / array.length
};

/**
 * Safely access nested object properties
 * @param root0
 * @param root0.obj
 * @param root0.path
 * @param root0.defaultValue
 */
export const safeGet = <T>({
	obj,
	path,
	defaultValue,
}: {
	obj: unknown
	path: string
	defaultValue?: T
}): T | undefined => {
	const keys = path.split(".")
	let current = obj

	for (const key of keys) {
		if (current === null || current === undefined || typeof current !== "object") {
			return defaultValue
		}
		current = (current as Record<string, unknown>)[key]
	}

	return (current as T) ?? defaultValue
};

/**
 * Throttle function calls
 * @param root0
 * @param root0.func
 * @param root0.delay
 */
export const throttle = <TArguments extends unknown[], TReturn>({
	func,
	delay,
}: {
	func: (...arguments_: TArguments) => TReturn
	delay: number
}): (...arguments_: TArguments) => TReturn | undefined => {
	let lastCall = 0
	return (...arguments_: TArguments): TReturn | undefined => {
		const now = Date.now()
		if (now - lastCall >= delay) {
			lastCall = now
			return func(...arguments_)
		}
		return undefined
	}
};

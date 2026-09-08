/**
 * General utility functions for OpenAlex API
 */

export const hasProperty = <T extends Record<string, unknown>>(parameters: {
	obj: unknown
	prop: string
}): parameters is { obj: T & Record<typeof parameters.prop, unknown>; prop: string } => {
	const { obj, prop } = parameters
	return typeof obj === "object" && obj !== null && prop in obj
};

export const isNonNull = <T>(
	value: T | null | undefined
): value is T => value !== null && value !== undefined;

/**
 * Type guard to verify if value is a record object
 * Returns true if the value is a valid Record<string, unknown>
 * @param obj
 */
export const isRecord = (obj: unknown): obj is Record<string, unknown> => typeof obj === "object" && obj !== null && !Array.isArray(obj);

/**
 * Safely convert validated object to record
 * This function assumes the object has already been validated as a record
 * @param obj
 */
export const trustObjectShape = (obj: unknown): Record<string, unknown> => {
	if (!isRecord(obj)) {
		throw new Error("Object is not a valid record type")
	}
	// TypeScript knows this is a Record<string, unknown> after type guard
	return obj
};

/**
 * Extract a property value from an object with unknown structure
 * Returns unknown type that must be validated by caller
 * @param root0
 * @param root0.obj
 * @param root0.key
 */
export const extractPropertyValue = ({
	obj,
	key,
}: {
	obj: Record<string, unknown>
	key: string
}): unknown => obj[key];

/**
 * Creates a type guard function from a Zod schema
 * Can be used in TypeScript type guard positions for runtime validation
 * @param schema
 * @param schema.parse
 */
export const createSchemaTypeGuard = <T>(schema: {
	parse: (data: unknown) => T
}): (data: unknown) => data is T => (data: unknown): data is T => {
		try {
			schema.parse(data)
			return true
		} catch {
			return false
		}
	};

/**
 * Validates data with a Zod schema and returns typed result
 * Throws an error if validation fails
 * @param root0
 * @param root0.data
 * @param root0.schema
 * @param root0.schema.parse
 */
export const validateWithSchema = <T>({
	data,
	schema,
}: {
	data: unknown
	schema: { parse: (data: unknown) => T }
}): T => schema.parse(data);

/**
 * Generic date utility functions
 * These utilities provide common date operations without domain-specific logic
 */

/**
 * Format a date to ISO string (YYYY-MM-DD)
 * @param date
 */
export const formatDateToISO = (date: Date): string => {
	const parts = date.toISOString().split("T")
	return parts[0] ?? ""
};

/**
 * Format a date to a human-readable string
 * @param date
 */
export const formatDateToHuman = (date: Date): string => date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		}) || "";

/**
 * Format a date to a short string (MM/DD/YYYY)
 * @param date
 */
export const formatDateToShort = (date: Date): string => date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}) || "";

/**
 * Parse an ISO date string to Date object
 * @param dateString
 */
export const parseISODate = (dateString: string): Date | null => {
	if (!dateString) return null

	const date = new Date(dateString)
	return Number.isNaN(date.getTime()) ? null : date
};

/**
 * Get the current date as ISO string
 */
export const getCurrentDateISO = (): string => formatDateToISO(new Date());

/**
 * Get the current timestamp in milliseconds
 */
export const getCurrentTimestamp = (): number => Date.now();

/**
 * Calculate the difference between two dates in days
 * @param root0
 * @param root0.date1
 * @param root0.date2
 */
export const daysBetween = ({ date1, date2 }: { date1: Date; date2: Date }): number => {
	const msPerDay = 24 * 60 * 60 * 1000
	return Math.floor((date2.getTime() - date1.getTime()) / msPerDay)
};

/**
 * Calculate the difference between two dates in milliseconds
 * @param root0
 * @param root0.date1
 * @param root0.date2
 */
export const msBetween = ({ date1, date2 }: { date1: Date; date2: Date }): number => Math.abs(date2.getTime() - date1.getTime());

/**
 * Check if a date is within a certain range
 * @param root0
 * @param root0.date
 * @param root0.startDate
 * @param root0.endDate
 */
export const isDateInRange = ({
	date,
	startDate,
	endDate,
}: {
	date: Date
	startDate: Date
	endDate: Date
}): boolean => date >= startDate && date <= endDate;

/**
 * Add days to a date
 * @param root0
 * @param root0.date
 * @param root0.days
 */
export const addDays = ({ date, days }: { date: Date; days: number }): Date => {
	const result = new Date(date)
	result.setDate(result.getDate() + days)
	return result
};

/**
 * Add months to a date
 * @param root0
 * @param root0.date
 * @param root0.months
 */
export const addMonths = ({ date, months }: { date: Date; months: number }): Date => {
	const result = new Date(date)
	result.setMonth(result.getMonth() + months)
	return result
};

/**
 * Add years to a date
 * @param root0
 * @param root0.date
 * @param root0.years
 */
export const addYears = ({ date, years }: { date: Date; years: number }): Date => {
	const result = new Date(date)
	result.setFullYear(result.getFullYear() + years)
	return result
};

/**
 * Get the start of the day (00:00:00)
 * @param date
 */
export const startOfDay = (date: Date): Date => {
	const result = new Date(date)
	result.setHours(0, 0, 0, 0)
	return result
};

/**
 * Get the end of the day (23:59:59.999)
 * @param date
 */
export const endOfDay = (date: Date): Date => {
	const result = new Date(date)
	result.setHours(23, 59, 59, 999)
	return result
};

/**
 * Get the start of the month
 * @param date
 */
export const startOfMonth = (date: Date): Date => {
	const result = new Date(date)
	result.setDate(1)
	result.setHours(0, 0, 0, 0)
	return result
};

/**
 * Get the end of the month
 * @param date
 */
export const endOfMonth = (date: Date): Date => {
	const result = new Date(date)
	result.setMonth(result.getMonth() + 1, 0)
	result.setHours(23, 59, 59, 999)
	return result
};

/**
 * Get the start of the year
 * @param date
 */
export const startOfYear = (date: Date): Date => {
	const result = new Date(date)
	result.setMonth(0, 1)
	result.setHours(0, 0, 0, 0)
	return result
};

/**
 * Get the end of the year
 * @param date
 */
export const endOfYear = (date: Date): Date => {
	const result = new Date(date)
	result.setMonth(11, 31)
	result.setHours(23, 59, 59, 999)
	return result
};

/**
 * Check if two dates are the same day
 * @param root0
 * @param root0.date1
 * @param root0.date2
 */
export const isSameDay = ({ date1, date2 }: { date1: Date; date2: Date }): boolean => date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate();

/**
 * Check if a date is today
 * @param date
 */
export const isToday = (date: Date): boolean => isSameDay({ date1: date, date2: new Date() });

/**
 * Check if a date is in the past
 * @param date
 */
export const isPast = (date: Date): boolean => date < new Date();

/**
 * Check if a date is in the future
 * @param date
 */
export const isFuture = (date: Date): boolean => date > new Date();

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 *
 * Note: If the date appears to be significantly in the future (>1 week),
 * it likely indicates a system clock mismatch and returns "just now" to avoid
 * confusing displays like "in 1 year" for recent builds.
 * @param date
 * @param baseDate
 */
export const getRelativeTime = (date: Date, baseDate: Date = new Date()): string => {
	const diffMs = date.getTime() - baseDate.getTime()
	const isPastDate = diffMs < 0
	const absDiffMs = Math.abs(diffMs)

	// If date is significantly in the future (>1 week), likely a clock mismatch
	// Return "just now" instead of confusing future dates
	if (!isPastDate && absDiffMs >= 7 * 24 * 60 * 60 * 1000) {
		return "just now"
	}

	// Define time units in descending order
	const timeUnits = [
		{ name: "year", divisor: 365 * 24 * 60 * 60 * 1000 },
		{ name: "month", divisor: 30 * 24 * 60 * 60 * 1000 },
		{ name: "week", divisor: 7 * 24 * 60 * 60 * 1000 },
		{ name: "day", divisor: 24 * 60 * 60 * 1000 },
		{ name: "hour", divisor: 60 * 60 * 1000 },
		{ name: "minute", divisor: 60 * 1000 },
	]

	for (const unit of timeUnits) {
		const value = Math.floor(absDiffMs / unit.divisor)
		if (value >= 1) {
			const suffix = value > 1 ? "s" : ""
			return isPastDate ? `${value} ${unit.name}${suffix} ago` : `in ${value} ${unit.name}${suffix}`
		}
	}

	return "just now"
};

/**
 * Format duration in milliseconds to human readable string
 * @param durationMs
 */
export const formatDuration = (durationMs: number): string => {
	const seconds = Math.floor(durationMs / 1000)
	const minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)
	const days = Math.floor(hours / 24)

	if (days > 0) {
		return `${days}d ${hours % 24}h ${minutes % 60}m`
	}

	if (hours > 0) {
		return `${hours}h ${minutes % 60}m ${seconds % 60}s`
	}

	if (minutes > 0) {
		return `${minutes}m ${seconds % 60}s`
	}

	return `${seconds}s`
};

/**
 * Format elapsed time from a start time
 * @param startTime
 */
export const formatElapsed = (startTime: number): string => formatDuration(Date.now() - startTime);

/**
 * Create a date range array between two dates
 * @param startDate
 * @param endDate
 * @param stepDays
 */
export const createDateRange = (startDate: Date, endDate: Date, stepDays = 1): Date[] => {
	const dates: Date[] = []
	const current = new Date(startDate)

	while (current <= endDate) {
		dates.push(new Date(current))
		current.setDate(current.getDate() + stepDays)
	}

	return dates
};

/**
 * Get the number of days in a month
 * @param root0
 * @param root0.year
 * @param root0.month
 */
export const getDaysInMonth = ({ year, month }: { year: number; month: number }): number => new Date(year, month + 1, 0).getDate();

/**
 * Check if a year is a leap year
 * @param year
 */
export const isLeapYear = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * Get the week number of the year for a date
 * @param date
 */
export const getWeekNumber = (date: Date): number => {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
	const dayNumber = d.getUTCDay() || 7
	d.setUTCDate(d.getUTCDate() + 4 - dayNumber)
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
};

/**
 * Format publication year for display
 * Handles cases where year might be null, undefined, or invalid
 * @param year
 */
export const formatPublicationYear = (year: number | null | undefined): string => {
	if (!year || year < 1000 || year > new Date().getFullYear() + 10) {
		return "Unknown"
	}
	return year.toString()
};

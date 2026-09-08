/**
 * Internal logger for OpenAlex client package
 * Lightweight logging without external dependencies
 */

export type LogLevel = "debug" | "warn" | "error";

class InternalLogger {
	private enableConsoleOutput = false; // Disabled by default for package use

	log(level: LogLevel, message: string, data?: unknown) {
		// Only log to console if explicitly enabled
		if (!this.enableConsoleOutput) {
			return;
		}

		const logMessage = `[OpenAlex] ${message}`;

		if (level === "debug") {
			console.debug(logMessage, data ?? "");
		} else if (level === "warn") {
			console.warn(logMessage, data ?? "");
		} else {
			console.error(logMessage, data ?? "");
		}
	}

	debug(message: string, data?: unknown) {
		this.log("debug", message, data);
	}

	warn(message: string, data?: unknown) {
		this.log("warn", message, data);
	}

	error(message: string, data?: unknown) {
		this.log("error", message, data);
	}

	enableConsole() {
		this.enableConsoleOutput = true;
	}

	disableConsole() {
		this.enableConsoleOutput = false;
	}
}

// Create and export the logger instance
export const logger = new InternalLogger();

// Helper function to safely convert unknown error to Error object
const toError = (error: unknown): Error => {
	if (error instanceof Error) return error;
	if (typeof error === "string") {
		return new Error(error);
	}
	return new Error("Unknown error occurred");
};

export const logError = (message: string, error: unknown) => {
	const errorObject = toError(error);
	logger.error(message, {
		name: errorObject.name,
		message: errorObject.message,
		stack: errorObject.stack
	});
};
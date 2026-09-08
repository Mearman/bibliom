/// <reference types="vite/client" />

/**
 * Environment detection utilities for BibGraph
 *
 * Detects development vs production mode using NODE_ENV, process.env, and build context.
 * Provides robust environment detection for both browser and Node.js environments.
 */

// Type declarations for global environment properties
declare const __DEV__: boolean | undefined
declare const __BUILD_INFO__: Record<string, unknown> | undefined

/**
 * Environment mode enumeration
 */
export enum EnvironmentMode {
	DEVELOPMENT = "development",
	PRODUCTION = "production",
	TEST = "test",
}

/**
 * Build context information
 */
export interface BuildContext {
	/**
	Whether this is a development build
	 */
	isDevelopment: boolean
	/**
	Whether this is a production build
	 */
	isProduction: boolean
	/**
	Whether this is a test environment
	 */
	isTest: boolean
	/**
	Current environment mode
	 */
	mode: EnvironmentMode
	/**
	Build timestamp if available
	 */
	buildTimestamp?: string
	/**
	Commit hash if available
	 */
	commitHash?: string
	/**
	Whether running in browser context
	 */
	isBrowser: boolean
	/**
	Whether running in Node.js context
	 */
	isNode: boolean
	/**
	Whether running in worker context
	 */
	isWorker: boolean
	/**
	Whether development server is detected
	 */
	isDevServer: boolean
	/**
	Whether this is a GitHub Pages deployment
	 */
	isGitHubPages: boolean
	/**
	Current hostname (browser only)
	 */
	hostname?: string
	/**
	Current protocol (browser only)
	 */
	protocol?: string
}

/**
 * Runtime environment detection utilities
 */
export class EnvironmentDetector {
	private static _cachedContext: BuildContext | undefined

	/**
	 * Detect the current environment mode from NODE_ENV and other indicators
	 */
	static detectMode(): EnvironmentMode {
		// Check NODE_ENV first (most reliable)
		const nodeEnvironmentMode = this.getModeFromNodeEnv()
		if (nodeEnvironmentMode) return nodeEnvironmentMode

		// Check Vite environment variables
		const viteMode = this.getModeFromViteEnv()
		if (viteMode) return viteMode

		// Check global __DEV__ flag (from Vite define)
		const developmentFlagMode = this.getModeFromDevFlag()
		if (developmentFlagMode) return developmentFlagMode

		// Browser-based detection
		const browserMode = this.getModeFromBrowser()
		if (browserMode) return browserMode

		// Default to development if uncertain
		return EnvironmentMode.DEVELOPMENT
	}

	private static getModeFromNodeEnv(): EnvironmentMode | null {
		if (globalThis.process?.env?.NODE_ENV) {
			const nodeEnvironment = globalThis.process?.env?.NODE_ENV.toLowerCase()
			switch (nodeEnvironment) {
				case "production":
					return EnvironmentMode.PRODUCTION
				case "test":
					return EnvironmentMode.TEST
				case "development":
					return EnvironmentMode.DEVELOPMENT
			}
		}
		return null
	}

	private static getModeFromViteEnv(): EnvironmentMode | null {
		if (import.meta === undefined || !("env" in import.meta)) {
			return null
		}

		try {
			const environment = import.meta.env
			if (!environment) return null

			// Check MODE first
			const mode = environment.MODE
			if (typeof mode === "string") {
				const modeLower = mode.toLowerCase()
				switch (modeLower) {
					case "production":
						return EnvironmentMode.PRODUCTION
					case "test":
						return EnvironmentMode.TEST
					case "development":
						return EnvironmentMode.DEVELOPMENT
				}
			}

			// Check boolean flags
			if (environment.DEV) return EnvironmentMode.DEVELOPMENT
			if (environment.PROD) return EnvironmentMode.PRODUCTION

			return null
		} catch {
			// Ignore errors if import.meta.env is not available
			return null
		}
	}

	private static isViteEnv(meta: unknown): boolean {
		if (typeof meta !== "object" || meta === null) return false
		return "env" in meta
	}

	private static getViteMode(environment: unknown): string | undefined {
		if (typeof environment !== "object" || environment === null || !("MODE" in environment)) return undefined
		const mode = (environment as Record<string, unknown>).MODE
		return typeof mode === "string" ? mode.toLowerCase() : undefined
	}

	private static getModeFromDevFlag(): EnvironmentMode | null {
		if (
			typeof globalThis !== "undefined" &&
			Object.prototype.hasOwnProperty.call(globalThis, "__DEV__")
		) {
			try {
				const developmentFlag = __DEV__
				if (typeof developmentFlag === "boolean") {
					return developmentFlag ? EnvironmentMode.DEVELOPMENT : EnvironmentMode.PRODUCTION
				}
			} catch {
				// Ignore errors if __DEV__ is not accessible
			}
		}
		return null
	}

	private static getModeFromBrowser(): EnvironmentMode | null {
		if (typeof window !== "undefined") {
			const hostname = window.location?.hostname

			// Local development indicators
			if (hostname === "localhost" || hostname === "127.0.0.1" || hostname?.endsWith(".local")) {
				return EnvironmentMode.DEVELOPMENT
			}

			// Development port indicators
			const port = window.location?.port
			if (port && ["3000", "5173", "8080", "4173"].includes(port)) {
				return EnvironmentMode.DEVELOPMENT
			}

			// GitHub Pages or custom domain = production
			if (hostname === "bibgraph.joenash.uk" || hostname?.endsWith(".github.io")) {
				return EnvironmentMode.PRODUCTION
			}
		}
		return null
	}

	/**
	 * Detect if running in browser context
	 */
	static isBrowser(): boolean {
		return typeof window !== "undefined" && typeof document !== "undefined"
	}

	/**
	 * Detect if running in Node.js context
	 */
	static isNode(): boolean {
		return globalThis.process?.versions?.node !== undefined
	}

	/**
	 * Detect if running in Web Worker context
	 */
	static isWorker(): boolean {
		return (
			typeof globalThis !== "undefined" &&
			"importScripts" in globalThis &&
			typeof window === "undefined"
		)
	}

	/**
	 * Detect if development server is running
	 */
	static isDevServer(): boolean {
		if (!this.isBrowser()) return false

		const hostname = window.location?.hostname
		const port = window.location?.port
		const protocol = window.location?.protocol

		// Local development indicators
		if (hostname === "localhost" || hostname === "127.0.0.1") {
			return true
		}

		// Development ports
		if (port && ["3000", "5173", "8080", "4173"].includes(port)) {
			return true
		}

		// HTTP in development (vs HTTPS in production)
		if (protocol === "http:" && hostname !== "localhost") {
			return true
		}

		return false
	}

	/**
	 * Detect if running on GitHub Pages
	 */
	static isGitHubPages(): boolean {
		if (!this.isBrowser()) return false

		const hostname = window.location?.hostname
		return (hostname === "bibgraph.joenash.uk") || hostname?.endsWith(".github.io")
	}

	/**
	 * Extract build info from raw build data
	 * @param buildInfo
	 */
	private static extractBuildInfo(buildInfo: Record<string, unknown>): {
		buildTimestamp?: string
		commitHash?: string
	} {
		const buildTimestamp = buildInfo.buildTimestamp
		const commitHash = buildInfo.commitHash
		const shortCommitHash = buildInfo.shortCommitHash

		return {
			buildTimestamp: typeof buildTimestamp === "string" ? buildTimestamp : undefined,
			commitHash:
				typeof commitHash === "string"
					? commitHash
					: (typeof shortCommitHash === "string"
						? shortCommitHash
						: undefined),
		}
	}

	/**
	 * Get build information from injected metadata
	 */
	static getBuildInfo(): { buildTimestamp?: string; commitHash?: string } {
		try {
			// Check for Vite-injected build info
			if (
				typeof globalThis !== "undefined" &&
				Object.prototype.hasOwnProperty.call(globalThis, "__BUILD_INFO__")
			) {
				try {
					const buildInfoRaw = __BUILD_INFO__
					if (buildInfoRaw && typeof buildInfoRaw === "object" && buildInfoRaw !== null) {
						return this.extractBuildInfo(buildInfoRaw)
					}
				} catch {
					// Ignore errors if __BUILD_INFO__ is not accessible
				}
			}
		} catch {
			// Ignore errors in build info detection
		}

		return {}
	}

	/**
	 * Get current hostname (browser only)
	 */
	static getHostname(): string | undefined {
		if (this.isBrowser()) {
			return window.location?.hostname
		}
		return undefined
	}

	/**
	 * Get current protocol (browser only)
	 */
	static getProtocol(): string | undefined {
		if (this.isBrowser()) {
			return window.location?.protocol
		}
		return undefined
	}

	/**
	 * Get complete build context with caching
	 */
	static getBuildContext(): BuildContext {
		if (this._cachedContext) {
			return this._cachedContext
		}

		const mode = this.detectMode()
		const buildInfo = this.getBuildInfo()
		const isBrowser = this.isBrowser()
		const isNode = this.isNode()
		const isWorker = this.isWorker()
		const isDevelopmentServer = this.isDevServer()
		const isGitHubPages = this.isGitHubPages()

		this._cachedContext = {
			isDevelopment: mode === EnvironmentMode.DEVELOPMENT,
			isProduction: mode === EnvironmentMode.PRODUCTION,
			isTest: mode === EnvironmentMode.TEST,
			mode,
			buildTimestamp: buildInfo.buildTimestamp,
			commitHash: buildInfo.commitHash,
			isBrowser,
			isNode,
			isWorker,
			isDevServer: isDevelopmentServer,
			isGitHubPages,
			hostname: this.getHostname(),
			protocol: this.getProtocol(),
		}

		return this._cachedContext
	}

	/**
	 * Clear cached context (useful for testing)
	 */
	static clearCache(): void {
		this._cachedContext = undefined
	}

	/**
	 * Get a human-readable environment description
	 */
	static getEnvironmentDescription(): string {
		const context = this.getBuildContext()

		if (context.isTest) {
			return "Test Environment"
		}

		if (context.isDevelopment) {
			if (context.isDevServer) {
				return `Development Server (${context.hostname}:${window.location?.port || "unknown"})`
			}
			return "Development Build"
		}

		if (context.isProduction) {
			if (context.isGitHubPages) {
				return `Production (GitHub Pages: ${context.hostname})`
			}
			return "Production Build"
		}

		return "Unknown Environment"
	}
}

/**
 * Convenience function to get current environment mode
 */
export const getCurrentEnvironmentMode = (): EnvironmentMode => EnvironmentDetector.detectMode();

/**
 * Convenience function to check if in development mode
 */
export const isDevelopment = (): boolean => EnvironmentDetector.detectMode() === EnvironmentMode.DEVELOPMENT;

/**
 * Convenience function to check if in production mode
 */
export const isProduction = (): boolean => EnvironmentDetector.detectMode() === EnvironmentMode.PRODUCTION;

/**
 * Convenience function to check if in test mode
 */
export const isTest = (): boolean => EnvironmentDetector.detectMode() === EnvironmentMode.TEST;

/**
 * Convenience function to get complete build context
 */
export const getBuildContext = (): BuildContext => EnvironmentDetector.getBuildContext();

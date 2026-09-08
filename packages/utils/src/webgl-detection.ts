/**
 * WebGL capability detection utilities
 *
 * Provides functions to detect WebGL/WebGL2 support and hardware capabilities
 * for graceful degradation in 3D visualization.
 */

/**
 * WebGL capability levels
 */
export type WebGLCapability = 'webgl2' | 'webgl1' | 'none'

/**
 * WebGL detection result with detailed capability information
 */
export interface WebGLDetectionResult {
	/**
	Whether WebGL is available
	 */
	available: boolean
	/**
	Capability level
	 */
	capability: WebGLCapability
	/**
	Human-readable reason if unavailable
	 */
	reason?: string
	/**
	GPU vendor (if detectable)
	 */
	vendor?: string
	/**
	GPU renderer (if detectable)
	 */
	renderer?: string
	/**
	Max texture size
	 */
	maxTextureSize?: number
	/**
	Max vertex uniform vectors
	 */
	maxVertexUniforms?: number
	/**
	Antialiasing supported
	 */
	antialiasSupported?: boolean
}

/**
 * Cached detection result to avoid repeated canvas creation
 */
let cachedResult: WebGLDetectionResult | null = null

/**
 * Detect WebGL capabilities in the current browser environment
 * @returns Detection result with capability information
 */
export const detectWebGLCapabilities = (): WebGLDetectionResult => {
	// Return cached result if available
	if (cachedResult !== null) {
		return cachedResult
	}

	// Server-side rendering check
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		cachedResult = {
			available: false,
			capability: 'none',
			reason: 'Server-side rendering detected - WebGL requires browser environment',
		}
		return cachedResult
	}

	// Create offscreen canvas for testing
	const canvas = document.createElement('canvas')

	// Try WebGL2 first (preferred)
	let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
	let capability: WebGLCapability = 'none'

	try {
		gl = canvas.getContext('webgl2')
		if (gl) {
			capability = 'webgl2'
		}
	} catch {
		// WebGL2 not available
	}

	// Fall back to WebGL1
	if (!gl) {
		try {
			gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
			if (gl) {
				capability = 'webgl1'
			}
		} catch {
			// WebGL1 not available
		}
	}

	// WebGL not available
	if (!gl) {
		cachedResult = {
			available: false,
			capability: 'none',
			reason: detectWebGLUnavailableReason(),
		}
		return cachedResult
	}

	// Get hardware information
	const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
	const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string : undefined
	const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string : undefined

	// Get capabilities
	const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
	const maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) as number

	// Check antialias support
	const isAntialiasSupported = gl.getContextAttributes()?.antialias ?? false

	// Cleanup
	const loseContext = gl.getExtension('WEBGL_lose_context')
	if (loseContext) {
		loseContext.loseContext()
	}

	cachedResult = {
		available: true,
		capability,
		vendor,
		renderer,
		maxTextureSize,
		maxVertexUniforms,
		antialiasSupported: isAntialiasSupported,
	}

	return cachedResult
};

/**
 * Simple check for WebGL availability
 */
export const isWebGLAvailable = (): boolean => detectWebGLCapabilities().available;

/**
 * Check specifically for WebGL2 availability
 */
export const isWebGL2Available = (): boolean => detectWebGLCapabilities().capability === 'webgl2';

/**
 * Get a human-readable message for WebGL unavailability
 */
const detectWebGLUnavailableReason = (): string => {
	if (typeof window === 'undefined') {
		return 'WebGL requires a browser environment'
	}

	// Check if running in a context that blocks WebGL
	const canvas = document.createElement('canvas')

	try {
		const context = canvas.getContext('webgl2') ||
			canvas.getContext('webgl') ||
			canvas.getContext('experimental-webgl')

		if (!context) {
			// Check for common reasons
			if (navigator.userAgent.includes('HeadlessChrome')) {
				return 'WebGL is disabled in headless browser mode'
			}

			// Check for hardware acceleration
			const userAgent = navigator.userAgent.toLowerCase()
			if (userAgent.includes('swiftshader') || userAgent.includes('llvmpipe')) {
				return 'Software rendering detected - hardware acceleration may be disabled'
			}

			return 'WebGL is not supported by your browser. Try updating your browser or enabling hardware acceleration.'
		}
	} catch (e) {
		return `WebGL initialization failed: ${e instanceof Error ? e.message : 'Unknown error'}`
	}

	return 'WebGL is not available for unknown reasons'
};

/**
 * Reset the cached detection result (useful for testing)
 */
export const resetWebGLDetectionCache = (): void => {
	cachedResult = null
};

/**
 * Get recommended renderer settings based on WebGL capabilities
 * @param result
 */
export const getRecommendedRendererSettings = (result: WebGLDetectionResult): {
	antialias: boolean
	pixelRatio: number
	shadowMapEnabled: boolean
	maxNodes: number
} => {
	if (!result.available) {
		return {
			antialias: false,
			pixelRatio: 1,
			shadowMapEnabled: false,
			maxNodes: 0,
		}
	}

	// Check for low-powered devices
	const isLowPower = result.renderer?.toLowerCase().includes('intel') ||
		result.renderer?.toLowerCase().includes('swiftshader') ||
		result.renderer?.toLowerCase().includes('mesa')

	// Check texture size as proxy for GPU capability
	const isHighEnd = (result.maxTextureSize ?? 0) >= 16_384

	return {
		antialias: result.antialiasSupported ?? false,
		pixelRatio: isHighEnd ? Math.min(window.devicePixelRatio, 2) : 1,
		shadowMapEnabled: !isLowPower && result.capability === 'webgl2',
		maxNodes: isLowPower ? 500 : (isHighEnd ? 2000 : 1000),
	}
};

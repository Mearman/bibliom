/**
 * Unit tests for WebGL detection utility
 * @vitest-environment jsdom
 * @module webgl-detection.unit.test
 */

import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import {
  detectWebGLCapabilities,
  getRecommendedRendererSettings,
  isWebGLAvailable,
  resetWebGLDetectionCache,
  type WebGLDetectionResult,
} from './webgl-detection';

describe('WebGL Detection', () => {
  beforeEach(() => {
    // Reset cache before each test
    resetWebGLDetectionCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetWebGLDetectionCache();
    vi.restoreAllMocks();
  });

  describe('detectWebGLCapabilities', () => {
    it('should return unavailable when window is undefined', () => {
      // In Node.js test environment without jsdom, window may be undefined
      // We need to explicitly undefine it
      const temporaryWindow = global.window;
      // @ts-expect-error - intentionally setting to undefined for test
      global.window = undefined;

      resetWebGLDetectionCache();
      const result = detectWebGLCapabilities();

      expect(result.available).toBe(false);
      expect(result.capability).toBe('none');
      expect(result.reason).toContain('browser environment');

      global.window = temporaryWindow;
      resetWebGLDetectionCache();
    });

    it('should detect WebGL2 when available', () => {
      // Mock canvas and WebGL2 context
      const mockGl = {
        getParameter: vi.fn().mockImplementation((parameter: number) => {
          if (parameter === 0x92_45) return 'Test Renderer'; // UNMASKED_RENDERER_WEBGL
          if (parameter === 0x92_46) return 'Test Vendor'; // UNMASKED_VENDOR_WEBGL
          if (parameter === 0x0D_33) return 16_384; // MAX_TEXTURE_SIZE
          if (parameter === 0x8B_4A) return 256; // MAX_VERTEX_UNIFORM_VECTORS
          return null;
        }),
        getExtension: vi.fn().mockImplementation((name: string) => {
          if (name === 'WEBGL_debug_renderer_info') {
            return { UNMASKED_VENDOR_WEBGL: 0x92_46, UNMASKED_RENDERER_WEBGL: 0x92_45 };
          }
          if (name === 'WEBGL_lose_context') {
            return { loseContext: vi.fn() };
          }
          return null;
        }),
        getContextAttributes: vi.fn().mockReturnValue({ antialias: true }),
        MAX_TEXTURE_SIZE: 0x0D_33,
        MAX_VERTEX_UNIFORM_VECTORS: 0x8B_4A,
      };

      const mockCanvas = {
        getContext: vi.fn().mockImplementation((contextType: string) => {
          if (contextType === 'webgl2') return mockGl;
          return null;
        }),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);

      resetWebGLDetectionCache();
      const result = detectWebGLCapabilities();

      expect(result.available).toBe(true);
      expect(result.capability).toBe('webgl2');
      expect(result.renderer).toBe('Test Renderer');
    });

    it('should fall back to WebGL1 when WebGL2 unavailable', () => {
      const mockGl = {
        getParameter: vi.fn().mockReturnValue('Test Renderer'),
        getExtension: vi.fn().mockReturnValue(null),
        getContextAttributes: vi.fn().mockReturnValue({ antialias: false }),
        MAX_TEXTURE_SIZE: 0x0D_33,
        MAX_VERTEX_UNIFORM_VECTORS: 0x8B_4A,
      };

      const mockCanvas = {
        getContext: vi.fn().mockImplementation((contextType: string) => {
          if (contextType === 'webgl' || contextType === 'experimental-webgl') return mockGl;
          return null;
        }),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);

      resetWebGLDetectionCache();
      const result = detectWebGLCapabilities();

      expect(result.available).toBe(true);
      expect(result.capability).toBe('webgl1');
    });

    it('should return unavailable when no WebGL context can be created', () => {
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);

      resetWebGLDetectionCache();
      const result = detectWebGLCapabilities();

      expect(result.available).toBe(false);
      expect(result.capability).toBe('none');
      expect(result.reason).toBeDefined();
    });

    it('should cache detection result', () => {
      const mockGl = {
        getParameter: vi.fn().mockReturnValue('Test'),
        getExtension: vi.fn().mockReturnValue(null),
        getContextAttributes: vi.fn().mockReturnValue({ antialias: false }),
        MAX_TEXTURE_SIZE: 0x0D_33,
        MAX_VERTEX_UNIFORM_VECTORS: 0x8B_4A,
      };

      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(mockGl),
      };

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);

      resetWebGLDetectionCache();
      const result1 = detectWebGLCapabilities();
      const result2 = detectWebGLCapabilities();

      // Should be same reference (cached)
      expect(result1).toBe(result2);
      // createElement should only be called once for the first detection
      expect(createElementSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('isWebGLAvailable', () => {
    it('should return true when WebGL is available', () => {
      const mockGl = {
        getParameter: vi.fn().mockReturnValue('Test'),
        getExtension: vi.fn().mockReturnValue(null),
        getContextAttributes: vi.fn().mockReturnValue({ antialias: false }),
        MAX_TEXTURE_SIZE: 0x0D_33,
        MAX_VERTEX_UNIFORM_VECTORS: 0x8B_4A,
      };

      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(mockGl),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);

      resetWebGLDetectionCache();
      expect(isWebGLAvailable()).toBe(true);
    });

    it('should return false when WebGL is not available', () => {
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);

      resetWebGLDetectionCache();
      expect(isWebGLAvailable()).toBe(false);
    });
  });

  describe('getRecommendedRendererSettings', () => {
    it('should return high quality settings for capable hardware', () => {
      const capabilities: WebGLDetectionResult = {
        available: true,
        capability: 'webgl2',
        renderer: 'NVIDIA GeForce RTX 3080',
        vendor: 'NVIDIA Corporation',
        maxTextureSize: 16_384,
        maxVertexUniforms: 4096,
        antialiasSupported: true,
      };

      const settings = getRecommendedRendererSettings(capabilities);

      expect(settings.antialias).toBe(true);
      expect(settings.shadowMapEnabled).toBe(true);
      expect(settings.maxNodes).toBeGreaterThan(500);
    });

    it('should return conservative settings when WebGL unavailable', () => {
      const capabilities: WebGLDetectionResult = {
        available: false,
        capability: 'none',
        reason: 'WebGL not supported',
      };

      const settings = getRecommendedRendererSettings(capabilities);

      expect(settings.antialias).toBe(false);
      expect(settings.pixelRatio).toBe(1);
      expect(settings.maxNodes).toBe(0);
    });

    it('should return reduced settings for WebGL1', () => {
      const capabilities: WebGLDetectionResult = {
        available: true,
        capability: 'webgl1',
        renderer: 'Intel HD Graphics',
        vendor: 'Intel Inc.',
        maxTextureSize: 4096,
        antialiasSupported: true,
      };

      const settings = getRecommendedRendererSettings(capabilities);

      // WebGL1 should still work but with reduced features
      expect(settings.shadowMapEnabled).toBe(false); // No shadow maps for Intel + webgl1
      expect(settings.maxNodes).toBeLessThanOrEqual(1000); // Lower node limit for Intel
    });

    it('should reduce settings for low-power devices', () => {
      const capabilities: WebGLDetectionResult = {
        available: true,
        capability: 'webgl2',
        renderer: 'Intel UHD Graphics 620',
        vendor: 'Intel Inc.',
        maxTextureSize: 8192,
        antialiasSupported: true,
      };

      const settings = getRecommendedRendererSettings(capabilities);

      // Intel GPUs should have reduced settings
      expect(settings.maxNodes).toBeLessThanOrEqual(500);
      expect(settings.shadowMapEnabled).toBe(false);
    });
  });

  describe('resetWebGLDetectionCache', () => {
    it('should clear cached detection result', () => {
      const mockGl = {
        getParameter: vi.fn().mockReturnValue('Test'),
        getExtension: vi.fn().mockReturnValue(null),
        getContextAttributes: vi.fn().mockReturnValue({ antialias: false }),
        MAX_TEXTURE_SIZE: 0x0D_33,
        MAX_VERTEX_UNIFORM_VECTORS: 0x8B_4A,
      };

      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(mockGl),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLElement);

      // First detection
      const result1 = detectWebGLCapabilities();

      // Reset cache
      resetWebGLDetectionCache();

      // Second detection should create new result
      const result2 = detectWebGLCapabilities();

      // Results should be equal but different references
      expect(result1.available).toBe(result2.available);
      expect(result1).not.toBe(result2); // Different objects after cache reset
    });
  });
});

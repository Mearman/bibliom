/**
 * Unit tests for GraphLODManager - Level of Detail management
 */

import type { Position3D } from '@bibgraph/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createFrustumBounds,
  DEFAULT_LOD_CONFIGS,
  extractFrustumPlanes,
  GraphLODManager,
  LODLevel,
} from './graph-lod-manager';

describe('GraphLODManager', () => {
  let manager: GraphLODManager;

  beforeEach(() => {
    manager = new GraphLODManager();
  });

  describe('constructor', () => {
    it('should create with default options', () => {
      expect(manager.getGlobalLOD()).toBe(LODLevel.HIGH);
    });

    it('should accept custom configs', () => {
      const customManager = new GraphLODManager({
        configs: {
          [LODLevel.HIGH]: { geometrySegments: 64 },
        },
      });

      const config = customManager.getConfig(LODLevel.HIGH);
      expect(config.geometrySegments).toBe(64);
      // Other defaults should be preserved
      expect(config.showLabels).toBe(true);
    });

    it('should accept custom distance thresholds', () => {
      const customManager = new GraphLODManager({
        distanceThresholds: { high: 100, medium: 300 },
      });

      // At distance 50, should be HIGH
      const lod50 = customManager.getLODForDistance(
        { x: 0, y: 0, z: 0 },
        { x: 50, y: 0, z: 0 }
      );
      expect(lod50).toBe(LODLevel.HIGH);

      // At distance 150, should be MEDIUM (> 100, < 300)
      const lod150 = customManager.getLODForDistance(
        { x: 0, y: 0, z: 0 },
        { x: 150, y: 0, z: 0 }
      );
      expect(lod150).toBe(LODLevel.MEDIUM);
    });
  });

  describe('getLODForDistance', () => {
    it('should return HIGH for close objects', () => {
      const lod = manager.getLODForDistance(
        { x: 0, y: 0, z: 0 },
        { x: 100, y: 0, z: 0 }
      );
      expect(lod).toBe(LODLevel.HIGH);
    });

    it('should return MEDIUM for medium distance objects', () => {
      const lod = manager.getLODForDistance(
        { x: 0, y: 0, z: 0 },
        { x: 300, y: 0, z: 0 }
      );
      expect(lod).toBe(LODLevel.MEDIUM);
    });

    it('should return LOW for far objects', () => {
      const lod = manager.getLODForDistance(
        { x: 0, y: 0, z: 0 },
        { x: 600, y: 0, z: 0 }
      );
      expect(lod).toBe(LODLevel.LOW);
    });

    it('should calculate 3D distance correctly', () => {
      // Distance = sqrt(100^2 + 100^2 + 100^2) = sqrt(30000) ≈ 173
      const lod = manager.getLODForDistance(
        { x: 0, y: 0, z: 0 },
        { x: 100, y: 100, z: 100 }
      );
      expect(lod).toBe(LODLevel.HIGH);
    });
  });

  describe('getEffectiveLOD', () => {
    it('should return distance-based LOD when global is HIGH', () => {
      manager.setGlobalLOD(LODLevel.HIGH);
      const lod = manager.getEffectiveLOD(
        { x: 0, y: 0, z: 0 },
        { x: 300, y: 0, z: 0 }
      );
      expect(lod).toBe(LODLevel.MEDIUM);
    });

    it('should return global LOD when it is lower than distance LOD', () => {
      manager.setGlobalLOD(LODLevel.LOW);
      const lod = manager.getEffectiveLOD(
        { x: 0, y: 0, z: 0 },
        { x: 100, y: 0, z: 0 }
      );
      // Even though distance says HIGH, global says LOW
      expect(lod).toBe(LODLevel.LOW);
    });

    it('should work with adaptive mode disabled', () => {
      const noAdaptive = new GraphLODManager({ adaptiveMode: false });
      noAdaptive.setGlobalLOD(LODLevel.LOW);

      const lod = noAdaptive.getEffectiveLOD(
        { x: 0, y: 0, z: 0 },
        { x: 100, y: 0, z: 0 }
      );
      // Without adaptive mode, should use distance LOD only
      expect(lod).toBe(LODLevel.HIGH);
    });
  });

  describe('getConfig', () => {
    it('should return correct config for each level', () => {
      const highConfig = manager.getConfig(LODLevel.HIGH);
      expect(highConfig.geometrySegments).toBe(32);
      expect(highConfig.showLabels).toBe(true);
      expect(highConfig.useComplexMaterials).toBe(true);

      const lowConfig = manager.getConfig(LODLevel.LOW);
      expect(lowConfig.geometrySegments).toBe(8);
      expect(lowConfig.showLabels).toBe(false);
      expect(lowConfig.useComplexMaterials).toBe(false);
    });
  });

  describe('getGlobalLOD / setGlobalLOD', () => {
    it('should get and set global LOD', () => {
      expect(manager.getGlobalLOD()).toBe(LODLevel.HIGH);

      manager.setGlobalLOD(LODLevel.MEDIUM);
      expect(manager.getGlobalLOD()).toBe(LODLevel.MEDIUM);

      manager.setGlobalLOD(LODLevel.LOW);
      expect(manager.getGlobalLOD()).toBe(LODLevel.LOW);
    });
  });

  describe('recordFrameTime', () => {
    it('should record frame times', () => {
      let mockNow = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => mockNow);

      // Create manager after mock is set up so lastFrameTime starts at 0
      const testManager = new GraphLODManager();

      // First call establishes baseline (frameTime = 0 - 0 = 0)
      testManager.recordFrameTime();

      // Second call with 16.67ms frame time (60fps)
      mockNow = 16.67;
      testManager.recordFrameTime();

      const metrics = testManager.getPerformanceMetrics();
      // Average of [0, 16.67] = 8.335
      expect(metrics.frameTimeMs).toBeCloseTo(8.335, 1);

      vi.restoreAllMocks();
    });

    it('should maintain history of 60 frames', () => {
      let mockNow = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => mockNow);

      const testManager = new GraphLODManager();

      // Record more than 60 frames
      for (let index = 0; index <= 70; index++) {
        mockNow = index * 16.67;
        testManager.recordFrameTime();
      }

      // Should still work correctly
      const metrics = testManager.getPerformanceMetrics();
      expect(metrics.fps).toBeGreaterThan(0);

      vi.restoreAllMocks();
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return default metrics with no recorded frames', () => {
      const metrics = manager.getPerformanceMetrics();
      expect(metrics.fps).toBeCloseTo(60, 0); // Default 16.67ms frame time
      expect(metrics.frameTimeMs).toBeCloseTo(16.67, 1);
      expect(metrics.visibleNodeCount).toBe(0);
      expect(metrics.memoryEstimate).toBe(0);
    });
  });

  describe('isInFrustum', () => {
    it('should return true for object inside frustum', () => {
      // Simple frustum planes (box around origin)
      const frustumPlanes = [
        { normal: { x: 1, y: 0, z: 0 }, distance: 100 },  // Left
        { normal: { x: -1, y: 0, z: 0 }, distance: 100 }, // Right
        { normal: { x: 0, y: 1, z: 0 }, distance: 100 },  // Bottom
        { normal: { x: 0, y: -1, z: 0 }, distance: 100 }, // Top
        { normal: { x: 0, y: 0, z: 1 }, distance: 100 },  // Near
        { normal: { x: 0, y: 0, z: -1 }, distance: 100 }, // Far
      ];

      const isResult = manager.isInFrustum(
        { x: 0, y: 0, z: 0 },
        5,
        frustumPlanes
      );
      expect(isResult).toBe(true);
    });

    it('should return false for object outside frustum', () => {
      // Simple frustum planes
      const frustumPlanes = [
        { normal: { x: 1, y: 0, z: 0 }, distance: 10 },
        { normal: { x: -1, y: 0, z: 0 }, distance: 10 },
        { normal: { x: 0, y: 1, z: 0 }, distance: 10 },
        { normal: { x: 0, y: -1, z: 0 }, distance: 10 },
        { normal: { x: 0, y: 0, z: 1 }, distance: 10 },
        { normal: { x: 0, y: 0, z: -1 }, distance: 10 },
      ];

      const isResult = manager.isInFrustum(
        { x: 500, y: 0, z: 0 },
        5,
        frustumPlanes
      );
      expect(isResult).toBe(false);
    });

    it('should consider object radius for partial visibility', () => {
      const frustumPlanes = [
        { normal: { x: 1, y: 0, z: 0 }, distance: 10 },
        { normal: { x: -1, y: 0, z: 0 }, distance: 10 },
        { normal: { x: 0, y: 1, z: 0 }, distance: 10 },
        { normal: { x: 0, y: -1, z: 0 }, distance: 10 },
        { normal: { x: 0, y: 0, z: 1 }, distance: 10 },
        { normal: { x: 0, y: 0, z: -1 }, distance: 10 },
      ];

      // Object at edge but with large radius should still be visible
      const isResult = manager.isInFrustum(
        { x: 15, y: 0, z: 0 },
        10, // Large radius
        frustumPlanes
      );
      expect(isResult).toBe(true);
    });
  });

  describe('batchGetLOD', () => {
    it('should return LOD for multiple objects', () => {
      const objects: Position3D[] = [
        { x: 0, y: 0, z: 0 },     // Close to camera
        { x: 300, y: 0, z: 0 },   // Medium distance
        { x: 600, y: 0, z: 0 },   // Far distance
      ];

      const camera: Position3D = { x: 100, y: 0, z: 0 };
      const result = manager.batchGetLOD(objects, camera);

      expect(result.size).toBe(3);
      expect(result.get(0)).toBe(LODLevel.HIGH);
      expect(result.get(1)).toBe(LODLevel.MEDIUM);
      expect(result.get(2)).toBe(LODLevel.LOW);
    });

    it('should handle empty array', () => {
      const result = manager.batchGetLOD([], { x: 0, y: 0, z: 0 });
      expect(result.size).toBe(0);
    });
  });

  describe('getNodeRenderSettings', () => {
    it('should return high detail settings', () => {
      const settings = manager.getNodeRenderSettings(LODLevel.HIGH);
      expect(settings.segments).toBe(32);
      expect(settings.showLabel).toBe(true);
      expect(settings.materialType).toBe('phong');
      expect(settings.useRing).toBe(true);
    });

    it('should return low detail settings', () => {
      const settings = manager.getNodeRenderSettings(LODLevel.LOW);
      expect(settings.segments).toBe(8);
      expect(settings.showLabel).toBe(false);
      expect(settings.materialType).toBe('basic');
      expect(settings.useRing).toBe(false);
    });
  });

  describe('getEdgeRenderSettings', () => {
    it('should return high detail settings', () => {
      const settings = manager.getEdgeRenderSettings(LODLevel.HIGH);
      expect(settings.useLines).toBe(false);
      expect(settings.tubular).toBe(true);
      expect(settings.segments).toBe(8);
    });

    it('should return low detail settings', () => {
      const settings = manager.getEdgeRenderSettings(LODLevel.LOW);
      expect(settings.useLines).toBe(true);
      expect(settings.tubular).toBe(false);
      expect(settings.segments).toBe(4);
    });
  });
});

describe('extractFrustumPlanes', () => {
  it('should extract 6 planes from matrices', () => {
    // Identity matrices
    const projectionMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
    const viewMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];

    const planes = extractFrustumPlanes(projectionMatrix, viewMatrix);
    expect(planes.length).toBe(6);

    // Each plane should have normalized normal
    for (const plane of planes) {
      const normalLength = Math.hypot(
        plane.normal.x, plane.normal.y, plane.normal.z
      );
      expect(normalLength).toBeCloseTo(1, 5);
    }
  });
});

describe('createFrustumBounds', () => {
  it('should create bounding box for frustum', () => {
    const cameraPosition: Position3D = { x: 0, y: 0, z: 0 };
    const lookAt: Position3D = { x: 0, y: 0, z: -1 };
    const fov = Math.PI / 4; // 45 degrees
    const aspectRatio = 16 / 9;
    const near = 0.1;
    const far = 1000;

    const bounds = createFrustumBounds(
      cameraPosition,
      lookAt,
      fov,
      aspectRatio,
      near,
      far
    );

    expect(bounds.min.x).toBeLessThan(bounds.max.x);
    expect(bounds.min.y).toBeLessThan(bounds.max.y);
    expect(bounds.min.z).toBeLessThan(bounds.max.z);

    // Should include camera position
    expect(bounds.min.x).toBeLessThanOrEqual(0);
    expect(bounds.max.x).toBeGreaterThanOrEqual(0);
  });

  it('should handle different look directions', () => {
    const cameraPosition: Position3D = { x: 100, y: 100, z: 100 };
    const lookAt: Position3D = { x: 200, y: 100, z: 100 };
    const fov = Math.PI / 3; // 60 degrees
    const aspectRatio = 1;
    const near = 1;
    const far = 500;

    const bounds = createFrustumBounds(
      cameraPosition,
      lookAt,
      fov,
      aspectRatio,
      near,
      far
    );

    // Should extend in the look direction (positive x)
    expect(bounds.max.x).toBeGreaterThan(cameraPosition.x);
  });
});

describe('DEFAULT_LOD_CONFIGS', () => {
  it('should have all three LOD levels defined', () => {
    expect(DEFAULT_LOD_CONFIGS[LODLevel.HIGH]).toBeDefined();
    expect(DEFAULT_LOD_CONFIGS[LODLevel.MEDIUM]).toBeDefined();
    expect(DEFAULT_LOD_CONFIGS[LODLevel.LOW]).toBeDefined();
  });

  it('should have decreasing detail from HIGH to LOW', () => {
    const high = DEFAULT_LOD_CONFIGS[LODLevel.HIGH];
    const medium = DEFAULT_LOD_CONFIGS[LODLevel.MEDIUM];
    const low = DEFAULT_LOD_CONFIGS[LODLevel.LOW];

    // Geometry segments should decrease
    expect(high.geometrySegments).toBeGreaterThan(medium.geometrySegments);
    expect(medium.geometrySegments).toBeGreaterThan(low.geometrySegments);

    // Max visible nodes should increase (allowing more objects at lower detail)
    expect(high.maxVisibleNodes).toBeLessThan(medium.maxVisibleNodes);
    expect(medium.maxVisibleNodes).toBeLessThan(low.maxVisibleNodes);
  });
});

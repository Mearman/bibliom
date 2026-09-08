/**
 * GraphLODManager - Level of Detail management for 3D graph visualization
 *
 * Dynamically adjusts rendering quality based on:
 * - Camera distance (objects far away use simpler geometry)
 * - Number of visible objects (reduce detail when many objects visible)
 * - Frame rate monitoring (reduce detail if performance drops)
 *
 * LOD Levels:
 * - HIGH: Full detail - all labels, complex geometry, shadows
 * - MEDIUM: Reduced detail - simplified geometry, fewer labels
 * - LOW: Minimal detail - basic shapes, no labels, no effects
 */

import type { BoundingBox3D,Position3D } from '@bibgraph/types';

/**
 * LOD level enumeration
 */
export enum LODLevel {
  HIGH = 0,
  MEDIUM = 1,
  LOW = 2,
}

/**
 * LOD configuration for a specific level
 */
export interface LODConfig {
  /**
  Geometry segments (higher = smoother spheres)
   */
  geometrySegments: number;
  /**
  Whether to show labels
   */
  showLabels: boolean;
  /**
  Label detail level (1 = full, 0.5 = abbreviated)
   */
  labelDetail: number;
  /**
  Whether to use complex materials
   */
  useComplexMaterials: boolean;
  /**
  Maximum visible node count at this level
   */
  maxVisibleNodes: number;
  /**
  Opacity multiplier for depth effects
   */
  opacityMultiplier: number;
}

/**
 * Default LOD configurations
 */
export const DEFAULT_LOD_CONFIGS: Record<LODLevel, LODConfig> = {
  [LODLevel.HIGH]: {
    geometrySegments: 32,
    showLabels: true,
    labelDetail: 1,
    useComplexMaterials: true,
    maxVisibleNodes: 500,
    opacityMultiplier: 1,
  },
  [LODLevel.MEDIUM]: {
    geometrySegments: 16,
    showLabels: true,
    labelDetail: 0.5,
    useComplexMaterials: false,
    maxVisibleNodes: 1000,
    opacityMultiplier: 0.8,
  },
  [LODLevel.LOW]: {
    geometrySegments: 8,
    showLabels: false,
    labelDetail: 0,
    useComplexMaterials: false,
    maxVisibleNodes: 2000,
    opacityMultiplier: 0.6,
  },
};

/**
 * Distance thresholds for LOD transitions
 */
export interface LODDistanceThresholds {
  /**
  Distance below which HIGH LOD is used
   */
  high: number;
  /**
  Distance below which MEDIUM LOD is used (above high)
   */
  medium: number;
  /**
  Everything beyond medium distance uses LOW LOD
   */
}

const DEFAULT_DISTANCE_THRESHOLDS: LODDistanceThresholds = {
  high: 200,
  medium: 500,
};

/**
 * Performance metrics for adaptive LOD
 */
export interface PerformanceMetrics {
  /**
  Current frames per second
   */
  fps: number;
  /**
  Average frame time in milliseconds
   */
  frameTimeMs: number;
  /**
  Number of visible nodes
   */
  visibleNodeCount: number;
  /**
  Memory usage estimate (bytes)
   */
  memoryEstimate: number;
}

/**
 * LOD Manager options
 */
export interface LODManagerOptions {
  /**
  LOD configurations per level
   */
  configs?: Partial<Record<LODLevel, Partial<LODConfig>>>;
  /**
  Distance thresholds
   */
  distanceThresholds?: Partial<LODDistanceThresholds>;
  /**
  Target FPS for adaptive mode
   */
  targetFps?: number;
  /**
  Enable adaptive LOD based on performance
   */
  adaptiveMode?: boolean;
  /**
  Minimum FPS before forcing lower LOD
   */
  minFps?: number;
}

/**
 * Graph LOD Manager class
 */
export class GraphLODManager {
  private configs: Record<LODLevel, LODConfig>;
  private distanceThresholds: LODDistanceThresholds;
  private targetFps: number;
  private minFps: number;
  private adaptiveMode: boolean;
  private currentGlobalLOD: LODLevel;
  private frameTimeHistory: number[];
  private lastFrameTime: number;

  constructor(options: LODManagerOptions = {}) {
    // Merge configs with defaults
    this.configs = {
      [LODLevel.HIGH]: { ...DEFAULT_LOD_CONFIGS[LODLevel.HIGH], ...options.configs?.[LODLevel.HIGH] },
      [LODLevel.MEDIUM]: { ...DEFAULT_LOD_CONFIGS[LODLevel.MEDIUM], ...options.configs?.[LODLevel.MEDIUM] },
      [LODLevel.LOW]: { ...DEFAULT_LOD_CONFIGS[LODLevel.LOW], ...options.configs?.[LODLevel.LOW] },
    };

    this.distanceThresholds = {
      ...DEFAULT_DISTANCE_THRESHOLDS,
      ...options.distanceThresholds,
    };

    this.targetFps = options.targetFps ?? 60;
    this.minFps = options.minFps ?? 30;
    this.adaptiveMode = options.adaptiveMode ?? true;
    this.currentGlobalLOD = LODLevel.HIGH;
    this.frameTimeHistory = [];
    this.lastFrameTime = performance.now();
  }

  /**
   * Get LOD level for a specific object based on camera distance
   * @param objectPosition - Position of the object
   * @param cameraPosition - Position of the camera
   * @returns LOD level to use
   */
  getLODForDistance(objectPosition: Position3D, cameraPosition: Position3D): LODLevel {
    const distance = this.calculateDistance(objectPosition, cameraPosition);

    if (distance < this.distanceThresholds.high) {
      return LODLevel.HIGH;
    }
    if (distance < this.distanceThresholds.medium) {
      return LODLevel.MEDIUM;
    }
    return LODLevel.LOW;
  }

  /**
   * Get the effective LOD level considering both distance and global performance
   * @param objectPosition - Position of the object
   * @param cameraPosition - Position of the camera
   * @returns Effective LOD level
   */
  getEffectiveLOD(objectPosition: Position3D, cameraPosition: Position3D): LODLevel {
    const distanceLOD = this.getLODForDistance(objectPosition, cameraPosition);

    // In adaptive mode, use the lower detail level between distance and global
    if (this.adaptiveMode) {
      return Math.max(distanceLOD, this.currentGlobalLOD) as LODLevel;
    }

    return distanceLOD;
  }

  /**
   * Get the configuration for a specific LOD level
   * @param level
   */
  getConfig(level: LODLevel): LODConfig {
    return this.configs[level];
  }

  /**
   * Get current global LOD level
   */
  getGlobalLOD(): LODLevel {
    return this.currentGlobalLOD;
  }

  /**
   * Set global LOD level manually
   * @param level
   */
  setGlobalLOD(level: LODLevel): void {
    this.currentGlobalLOD = level;
  }

  /**
   * Update frame timing for adaptive LOD
   * Call this at the end of each render frame
   */
  recordFrameTime(): void {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Keep history of last 60 frames
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }

    // Update global LOD based on performance
    if (this.adaptiveMode) {
      this.updateAdaptiveLOD();
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const avgFrameTime = this.frameTimeHistory.length > 0
      ? this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length
      : 16.67;

    return {
      fps: 1000 / avgFrameTime,
      frameTimeMs: avgFrameTime,
      visibleNodeCount: 0, // Would be set externally
      memoryEstimate: 0, // Would require external tracking
    };
  }

  /**
   * Check if an object should be visible based on frustum culling
   * @param objectPosition - Position of the object
   * @param objectRadius - Bounding radius of the object
   * @param frustumPlanes - Array of 6 frustum planes (left, right, top, bottom, near, far)
   * @returns true if object is potentially visible
   */
  isInFrustum(
    objectPosition: Position3D,
    objectRadius: number,
    frustumPlanes: Array<{ normal: Position3D; distance: number }>
  ): boolean {
    for (const plane of frustumPlanes) {
      // Distance from point to plane
      const distribution =
        plane.normal.x * objectPosition.x +
        plane.normal.y * objectPosition.y +
        plane.normal.z * objectPosition.z +
        plane.distance;

      // If sphere is completely behind any plane, it's not visible
      if (distribution < -objectRadius) {
        return false;
      }
    }

    return true;
  }

  /**
   * Batch determine LOD levels for multiple objects
   * @param objects - Array of object positions
   * @param cameraPosition - Camera position
   * @returns Map of index to LOD level
   */
  batchGetLOD(
    objects: Position3D[],
    cameraPosition: Position3D
  ): Map<number, LODLevel> {
    const result = new Map<number, LODLevel>();

    for (const [index, object] of objects.entries()) {
      result.set(index, this.getEffectiveLOD(object, cameraPosition));
    }

    return result;
  }

  /**
   * Get recommended node render settings based on LOD
   * @param lod
   */
  getNodeRenderSettings(lod: LODLevel): {
    segments: number;
    showLabel: boolean;
    materialType: 'basic' | 'phong';
    useRing: boolean;
  } {
    const config = this.configs[lod];

    return {
      segments: config.geometrySegments,
      showLabel: config.showLabels,
      materialType: config.useComplexMaterials ? 'phong' : 'basic',
      useRing: config.useComplexMaterials,
    };
  }

  /**
   * Get recommended edge render settings based on LOD
   * @param lod
   */
  getEdgeRenderSettings(lod: LODLevel): {
    useLines: boolean;
    tubular: boolean;
    segments: number;
  } {
    return {
      useLines: lod >= LODLevel.MEDIUM, // Use simple lines for medium/low
      tubular: lod === LODLevel.HIGH, // Only use tubes for high detail
      segments: lod === LODLevel.HIGH ? 8 : 4,
    };
  }

  // Private methods

  private calculateDistance(a: Position3D, b: Position3D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.hypot(dx, dy, dz);
  }

  private updateAdaptiveLOD(): void {
    const metrics = this.getPerformanceMetrics();

    if (metrics.fps < this.minFps && this.currentGlobalLOD < LODLevel.LOW) {
      // Performance is bad, reduce detail
      this.currentGlobalLOD = (this.currentGlobalLOD + 1) as LODLevel;
    } else if (metrics.fps > this.targetFps * 0.9 && this.currentGlobalLOD > LODLevel.HIGH) {
      // Performance is good, try increasing detail
      this.currentGlobalLOD = (this.currentGlobalLOD - 1) as LODLevel;
    }
  }
}

/**
 * Extract frustum planes from a projection-view matrix
 * This is a simplified version for basic frustum culling
 * @param projectionMatrix
 * @param viewMatrix
 */
export const extractFrustumPlanes = (projectionMatrix: number[], viewMatrix: number[]): Array<{ normal: Position3D; distance: number }> => {
  // Combine matrices (simplified - assumes column-major)
  const m = multiplyMatrices(projectionMatrix, viewMatrix);

  // Extract 6 planes from the combined matrix
  return [
    // Left
    {
      normal: { x: m[3] + m[0], y: m[7] + m[4], z: m[11] + m[8] },
      distance: m[15] + m[12],
    },
    // Right
    {
      normal: { x: m[3] - m[0], y: m[7] - m[4], z: m[11] - m[8] },
      distance: m[15] - m[12],
    },
    // Bottom
    {
      normal: { x: m[3] + m[1], y: m[7] + m[5], z: m[11] + m[9] },
      distance: m[15] + m[13],
    },
    // Top
    {
      normal: { x: m[3] - m[1], y: m[7] - m[5], z: m[11] - m[9] },
      distance: m[15] - m[13],
    },
    // Near
    {
      normal: { x: m[3] + m[2], y: m[7] + m[6], z: m[11] + m[10] },
      distance: m[15] + m[14],
    },
    // Far
    {
      normal: { x: m[3] - m[2], y: m[7] - m[6], z: m[11] - m[10] },
      distance: m[15] - m[14],
    },
  ].map(plane => {
    // Normalize the plane
    const length_ = Math.hypot(
      plane.normal.x, plane.normal.y, plane.normal.z
    );
    return {
      normal: {
        x: plane.normal.x / length_,
        y: plane.normal.y / length_,
        z: plane.normal.z / length_,
      },
      distance: plane.distance / length_,
    };
  });
};

/**
 * Multiply two 4x4 matrices (column-major)
 * @param a
 * @param b
 */
const multiplyMatrices = (a: number[], b: number[]): number[] => {
  const result: number[] = Array.from<number>({length: 16}).fill(0);

  for (let index = 0; index < 4; index++) {
    for (let index_ = 0; index_ < 4; index_++) {
      for (let k = 0; k < 4; k++) {
        result[index * 4 + index_] += a[k * 4 + index_] * b[index * 4 + k];
      }
    }
  }

  return result;
};

/**
 * Create a simple frustum bounds for quick culling checks
 * @param cameraPosition
 * @param lookAt
 * @param fov
 * @param aspectRatio
 * @param near
 * @param far
 */
export const createFrustumBounds = (cameraPosition: Position3D, lookAt: Position3D, fov: number, aspectRatio: number, near: number, far: number): BoundingBox3D => {
  // Calculate approximate frustum bounds
  const direction = {
    x: lookAt.x - cameraPosition.x,
    y: lookAt.y - cameraPosition.y,
    z: lookAt.z - cameraPosition.z,
  };

  const length_ = Math.hypot(direction.x, direction.y, direction.z);
  const normalizedDir = {
    x: direction.x / length_,
    y: direction.y / length_,
    z: direction.z / length_,
  };

  // Calculate far plane corners spread
  const halfHeight = Math.tan(fov / 2) * far;
  const halfWidth = halfHeight * aspectRatio;
  const spread = Math.max(halfWidth, halfHeight);

  // Far plane center
  const farCenter = {
    x: cameraPosition.x + normalizedDir.x * far,
    y: cameraPosition.y + normalizedDir.y * far,
    z: cameraPosition.z + normalizedDir.z * far,
  };

  return {
    min: {
      x: Math.min(cameraPosition.x, farCenter.x) - spread,
      y: Math.min(cameraPosition.y, farCenter.y) - spread,
      z: Math.min(cameraPosition.z, farCenter.z) - spread,
    },
    max: {
      x: Math.max(cameraPosition.x, farCenter.x) + spread,
      y: Math.max(cameraPosition.y, farCenter.y) + spread,
      z: Math.max(cameraPosition.z, farCenter.z) + spread,
    },
  };
};

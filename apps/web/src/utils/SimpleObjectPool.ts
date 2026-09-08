/**
 * Simple Object Pool - Simplified Three.js object pooling for performance
 *
 * Provides basic object pooling with proper type safety
 * Focuses on performance gains while maintaining TypeScript compliance
 */

import * as THREE from 'three';

// Pool configuration
interface PoolConfig {
  initialSize: number;
  maxSize: number;
  autoExpand: boolean;
}

// Three.js object interfaces for proper typing
interface Visible {
  visible: boolean;
}

interface ThreeGeometry {
  dispose(): void;
}

interface ThreeMaterial {
  dispose(): void;
}

interface ThreeMesh extends Visible {
  position: { set(x: number, y: number, z: number): void };
  rotation: { set(x: number, y: number, z: number): void };
  scale: { set(x: number, y: number, z: number): void };
  geometry?: ThreeGeometry;
  material?: ThreeMaterial | ThreeMaterial[];
}


// Default pool configuration
const DEFAULT_CONFIG: PoolConfig = {
  initialSize: 50,
  maxSize: 500,
  autoExpand: true,
};

// Type guard functions
const isVisible = (object: unknown): object is Visible => typeof object === 'object' && object !== null && 'visible' in object;

const isThreeMesh = (object: unknown): object is ThreeMesh => isVisible(object) &&
         'position' in object &&
         'rotation' in object &&
         'scale' in object &&
         typeof (object as ThreeMesh).position.set === 'function' &&
         typeof (object as ThreeMesh).rotation.set === 'function' &&
         typeof (object as ThreeMesh).scale.set === 'function';

const hasGeometry = (object: unknown): object is { geometry: ThreeGeometry } => {
  if (typeof object !== 'object' || object === null || !('geometry' in object)) {
    return false;
  }
  const geometry = (object as { geometry: unknown }).geometry;
  return geometry !== null &&
         typeof geometry === 'object' &&
         'dispose' in geometry &&
         typeof (geometry as { dispose: unknown }).dispose === 'function';
};

const hasMaterial = (object: unknown): object is { material: ThreeMaterial | ThreeMaterial[] } => typeof object === 'object' &&
         object !== null &&
         'material' in object &&
         object.material !== null;

const isDisposable = (object: unknown): object is { dispose(): void } => typeof object === 'object' &&
         object !== null &&
         'dispose' in object &&
         typeof (object as { dispose: unknown }).dispose === 'function';

/**
 * Simple object pool for Three.js objects
 */
class SimpleObjectPool<T extends object = object> {
  private pool: T[] = [];
  private inUse: Set<T> = new Set();
  private config: PoolConfig;
  private stats: { created: number; reused: number } = { created: 0, reused: 0 };

  constructor(
    private createFn: () => T,
    private resetFn: (object: T) => void,
    config: Partial<PoolConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Pre-populate pool
    for (let index = 0; index < this.config.initialSize; index++) {
      const object = this.createFn();
      if (isVisible(object)) {
        object.visible = false;
      }
      this.pool.push(object);
    }
  }

  acquire(): T {
    let object: T;

    if (this.pool.length > 0) {
      const popped = this.pool.pop();
      if (popped === undefined) {
        throw new Error('Unexpected undefined value from pool.pop()');
      }
      object = popped;
      this.stats.reused++;
    } else if (this.config.autoExpand) {
      object = this.createFn();
      this.stats.created++;
    } else {
      throw new Error('Object pool exhausted and auto-expand is disabled');
    }

    if (isVisible(object)) {
      object.visible = true;
    }
    this.inUse.add(object);
    return object;
  }

  release(object: T): void {
    if (!this.inUse.has(object)) {
      return; // Already released or not from this pool
    }

    this.inUse.delete(object);

    // Reset object state
    if (this.resetFn) {
      this.resetFn(object);
    } else {
      if (object && typeof object === 'object') {
        if (isVisible(object)) {
          object.visible = false;
        }
        if (isThreeMesh(object)) {
          object.position.set(0, 0, 0);
          object.rotation.set(0, 0, 0);
          object.scale.set(1, 1, 1);
        }
      }
    }

    // Return to pool if not at max capacity
    if (this.pool.length < this.config.maxSize) {
      this.pool.push(object);
    } else {
      // Dispose of object if pool is full
      this.disposeObject(object);
    }
  }

  private disposeObject(object: T): void {
    if (!object || typeof object !== 'object') return;

    // Try to safely dispose Three.js objects
    const geometryObject = object as { geometry?: unknown };
    if (hasGeometry(geometryObject)) {
      geometryObject.geometry.dispose();
    }

    const materialObject = object as { material?: unknown };
    if (hasMaterial(materialObject)) {
      if (Array.isArray(materialObject.material)) {
        for (const mat of materialObject.material) {
          if (isDisposable(mat)) {
            mat.dispose();
          }
        }
      } else {
        const material = materialObject.material;
        if (isDisposable(material)) {
          material.dispose();
        }
      }
    }

    if (isDisposable(object)) {
      object.dispose();
    }
  }

  getStats() {
    return {
      ...this.stats,
      poolSize: this.pool.length,
      inUse: this.inUse.size,
    };
  }

  clear(): void {
    // Dispose all objects
    for (const object of [...this.pool, ...this.inUse]) this.disposeObject(object);
    this.pool = [];
    this.inUse.clear();
    this.stats = { created: 0, reused: 0 };
  }
}

/**
 * Manager for multiple object pools
 */
export class SimpleThreeObjectPool {
  private spherePools: Map<string, SimpleObjectPool<THREE.SphereGeometry>> = new Map();
  private materialPools: Map<string, SimpleObjectPool<THREE.MeshStandardMaterial>> = new Map();
  private meshPools: Map<string, SimpleObjectPool<THREE.Mesh>> = new Map();

  // Get sphere geometry
  getSphereGeometry(segments: number = 16): THREE.SphereGeometry {
    const key = `sphere_${segments}`;
    let pool = this.spherePools.get(key);

    if (!pool) {
      pool = new SimpleObjectPool<THREE.SphereGeometry>(
        () => new THREE.SphereGeometry(1, segments, segments),
        () => {}, // No reset needed for geometry
        { initialSize: 20, maxSize: 100 }
      );
      this.spherePools.set(key, pool);
    }

    return pool.acquire();
  }

  releaseSphereGeometry(geometry: THREE.SphereGeometry, segments: number = 16): void {
    const key = `sphere_${segments}`;
    const pool = this.spherePools.get(key);
    if (pool) {
      pool.release(geometry);
    } else {
      geometry.dispose();
    }
  }

  // Get material
  getMaterial(color: number = 0x4287F5): THREE.MeshStandardMaterial {
    const key = `material_${color.toString(16)}`;
    let pool = this.materialPools.get(key);

    if (!pool) {
      pool = new SimpleObjectPool<THREE.MeshStandardMaterial>(
        () => new THREE.MeshStandardMaterial({ color }),
        (mat) => {
          // Type guard for Three.js material - already typed by generic
          mat.color.setHex(color);
          mat.emissive.setHex(0x000000);
          mat.roughness = 0.5;
          mat.metalness = 0.5;
          mat.opacity = 1;
          mat.transparent = false;
        },
        { initialSize: 30, maxSize: 200 }
      );
      this.materialPools.set(key, pool);
    }

    return pool.acquire();
  }

  releaseMaterial(material: THREE.MeshStandardMaterial, color: number): void {
    const key = `material_${color.toString(16)}`;
    const pool = this.materialPools.get(key);
    if (pool) {
      pool.release(material);
    } else {
      material.dispose();
    }
  }

  // Get mesh (sphere + material)
  getNodeMesh(radius: number = 1, color: number = 0x4287F5, segments: number = 16): THREE.Mesh {
    const key = `mesh_${radius}_${color.toString(16)}_${segments}`;
    let pool = this.meshPools.get(key);

    if (!pool) {
      pool = new SimpleObjectPool<THREE.Mesh>(
        () => {
          const geometry = new THREE.SphereGeometry(radius, segments, segments);
          const material = new THREE.MeshStandardMaterial({ color });
          return new THREE.Mesh(geometry, material);
        },
        (mesh) => {
          // Type guard for Three.js mesh - already typed by generic
          mesh.position.set(0, 0, 0);
          mesh.rotation.set(0, 0, 0);
          mesh.scale.set(1, 1, 1);
          mesh.visible = true;
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.color.setHex(color);
            mesh.material.emissive.setHex(0x000000);
          }
        },
        { initialSize: 100, maxSize: 1000 }
      );
      this.meshPools.set(key, pool);
    }

    return pool.acquire();
  }

  releaseNodeMesh(mesh: THREE.Mesh, radius: number, color: number, segments: number): void {
    const key = `mesh_${radius}_${color.toString(16)}_${segments}`;
    const pool = this.meshPools.get(key);
    if (pool) {
      pool.release(mesh);
    } else {
      // Dispose manually
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        for (const mat of mesh.material) mat.dispose();
      } else if (mesh.material) {
        mesh.material.dispose();
      }
    }
  }

  // Get statistics for all pools
  getAllStats(): Record<string, { created: number; reused: number; poolSize: number; inUse: number }> {
    const stats: Record<string, { created: number; reused: number; poolSize: number; inUse: number }> = {};

    // Collect stats from all pool types
    this.spherePools.forEach((pool, key) => {
      stats[key] = pool.getStats();
    });
    this.materialPools.forEach((pool, key) => {
      stats[key] = pool.getStats();
    });
    this.meshPools.forEach((pool, key) => {
      stats[key] = pool.getStats();
    });

    return stats;
  }

  // Clear all pools
  clearAll(): void {
    this.spherePools.forEach(pool => pool.clear());
    this.materialPools.forEach(pool => pool.clear());
    this.meshPools.forEach(pool => pool.clear());

    this.spherePools.clear();
    this.materialPools.clear();
    this.meshPools.clear();
  }

  // Estimate memory usage (rough approximation)
  estimateMemoryUsage(): number {
    let totalObjects = 0;

    const addPoolStats = <T extends object>(pool: SimpleObjectPool<T>) => {
      const stats = pool.getStats();
      totalObjects += stats.poolSize + stats.inUse;
    };

    this.spherePools.forEach(addPoolStats);
    this.materialPools.forEach(addPoolStats);
    this.meshPools.forEach(addPoolStats);

    return totalObjects * 1024; // Rough estimate: 1KB per object
  }
}

// Global instance
export const globalSimpleObjectPool = new SimpleThreeObjectPool();
/**
 * Performance benchmarks for Octree spatial indexing
 *
 * Run with: npx tsx packages/utils/src/spatial/octree.benchmark.ts
 */

import type { BoundingBox3D,Position3D } from '@bibgraph/types';

import { createOctreeFromItems,Octree } from './octree';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTimeMs: number;
  avgTimeMs: number;
  opsPerSecond: number;
}

const benchmark = (name: string, function_: () => void, iterations: number = 1000): BenchmarkResult => {
  // Warmup
  for (let index = 0; index < Math.min(100, iterations / 10); index++) {
    function_();
  }

  const start = performance.now();
  for (let index = 0; index < iterations; index++) {
    function_();
  }
  const totalTimeMs = performance.now() - start;
  const avgTimeMs = totalTimeMs / iterations;

  return {
    name,
    iterations,
    totalTimeMs,
    avgTimeMs,
    opsPerSecond: 1000 / avgTimeMs,
  };
};

const generateRandomPoints = (count: number, bounds: BoundingBox3D): Position3D[] => {
  const points: Position3D[] = [];
  const rangeX = bounds.max.x - bounds.min.x;
  const rangeY = bounds.max.y - bounds.min.y;
  const rangeZ = bounds.max.z - bounds.min.z;

  for (let index = 0; index < count; index++) {
    points.push({
      x: bounds.min.x + Math.random() * rangeX,
      y: bounds.min.y + Math.random() * rangeY,
      z: bounds.min.z + Math.random() * rangeZ,
    });
  }
  return points;
};

const formatResult = (result: BenchmarkResult): string => `${result.name.padEnd(40)} ${result.avgTimeMs.toFixed(4).padStart(10)}ms  ${Math.round(result.opsPerSecond).toLocaleString().padStart(12)} ops/s`;

const runBenchmarks = async () => {
  console.log('='.repeat(70));
  console.log('Octree Performance Benchmarks');
  console.log('='.repeat(70));
  console.log('');

  const bounds: BoundingBox3D = {
    min: { x: -1000, y: -1000, z: -1000 },
    max: { x: 1000, y: 1000, z: 1000 },
  };

  const results: BenchmarkResult[] = [];

  // Test different data sizes
  for (const nodeCount of [100, 500, 1000, 5000, 10_000]) {
    console.log(`\n--- ${nodeCount} nodes ---`);

    const points = generateRandomPoints(nodeCount, bounds);
    const items = points.map((p, index) => ({ position: p, data: `node-${index}` }));

    // Build octree
    let octree: Octree<string>;
    results.push(benchmark(
      `Build octree (${nodeCount} nodes)`,
      () => {
        octree = createOctreeFromItems(items);
      },
      nodeCount > 1000 ? 10 : 100
    ));
    console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

    // Create octree for queries
    octree = createOctreeFromItems(items);

    // Insert operations
    const newPoint = { x: 0, y: 0, z: 0 };
    results.push(benchmark(
      `Insert single node (${nodeCount} existing)`,
      () => {
        const testOctree = createOctreeFromItems(items);
        testOctree.insert(newPoint, 'new-node');
      },
      nodeCount > 1000 ? 10 : 100
    ));
    console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

    // Range query (small region)
    const smallQuery: BoundingBox3D = {
      min: { x: -100, y: -100, z: -100 },
      max: { x: 100, y: 100, z: 100 },
    };
    results.push(benchmark(
      `Range query small (${nodeCount} nodes)`,
      () => {
        octree.queryRange(smallQuery);
      },
      1000
    ));
    console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

    // Range query (large region)
    const largeQuery: BoundingBox3D = {
      min: { x: -500, y: -500, z: -500 },
      max: { x: 500, y: 500, z: 500 },
    };
    results.push(benchmark(
      `Range query large (${nodeCount} nodes)`,
      () => {
        octree.queryRange(largeQuery);
      },
      1000
    ));
    console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

    // Sphere query
    results.push(benchmark(
      `Sphere query r=200 (${nodeCount} nodes)`,
      () => {
        octree.querySphere({ x: 0, y: 0, z: 0 }, 200);
      },
      1000
    ));
    console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

    // Find nearest
    results.push(benchmark(
      `Find nearest (${nodeCount} nodes)`,
      () => {
        octree.findNearest({ x: 0, y: 0, z: 0 });
      },
      1000
    ));
    console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

    // Find k-nearest (k=10)
    results.push(benchmark(
      `Find 10 nearest (${nodeCount} nodes)`,
      () => {
        octree.findKNearest({ x: 0, y: 0, z: 0 }, 10);
      },
      1000
    ));
    console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));
  }

  console.log('\n' + '='.repeat(70));
  console.log('Benchmark Summary');
  console.log('='.repeat(70));
  console.log('');
  console.log('Performance targets for 60fps (16.67ms budget):');
  console.log('- Range queries should complete in <1ms');
  console.log('- Nearest neighbor should complete in <2ms');
  console.log('- Build time is acceptable if done once on load');
  console.log('');

  // Check if any operations exceed budget
  const slowOperations = results.filter(r => r.avgTimeMs > 16.67);
  if (slowOperations.length > 0) {
    console.log('Operations exceeding frame budget:');
    for (const r of slowOperations) console.log(`  - ${r.name}: ${r.avgTimeMs.toFixed(2)}ms`);
  } else {
    console.log('All operations within frame budget!');
  }
};

// Only run when executed directly (not when imported)
if (import.meta.url.endsWith('octree.benchmark.ts')) {
  runBenchmarks().catch(console.error);
}

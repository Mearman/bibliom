/**
 * Performance benchmarks for GraphLODManager
 *
 * Run with: npx tsx packages/utils/src/spatial/graph-lod-manager.benchmark.ts
 */

import type { Position3D } from '@bibgraph/types';

import { createFrustumBounds,extractFrustumPlanes, GraphLODManager } from './graph-lod-manager';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTimeMs: number;
  avgTimeMs: number;
  opsPerSecond: number;
}

const benchmark = (name: string, function_: () => void, iterations: number = 10_000): BenchmarkResult => {
  // Warmup
  for (let index = 0; index < Math.min(1000, iterations / 10); index++) {
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

const generateRandomPositions = (count: number, spread: number): Position3D[] => {
  const positions: Position3D[] = [];
  for (let index = 0; index < count; index++) {
    positions.push({
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      z: (Math.random() - 0.5) * spread,
    });
  }
  return positions;
};

const formatResult = (result: BenchmarkResult): string => `${result.name.padEnd(45)} ${result.avgTimeMs.toFixed(6).padStart(12)}ms  ${Math.round(result.opsPerSecond).toLocaleString().padStart(12)} ops/s`;

const runBenchmarks = async () => {
  console.log('='.repeat(75));
  console.log('GraphLODManager Performance Benchmarks');
  console.log('='.repeat(75));
  console.log('');

  const results: BenchmarkResult[] = [];
  const lodManager = new GraphLODManager();
  const cameraPosition: Position3D = { x: 0, y: 0, z: 500 };

  // Single LOD calculation
  console.log('--- Single Operations ---');

  const testPosition: Position3D = { x: 100, y: 100, z: 100 };
  results.push(benchmark(
    'getLODForDistance (single)',
    () => {
      lodManager.getLODForDistance(testPosition, cameraPosition);
    },
    100_000
  ));
  console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

  results.push(benchmark(
    'getEffectiveLOD (single)',
    () => {
      lodManager.getEffectiveLOD(testPosition, cameraPosition);
    },
    100_000
  ));
  console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

  results.push(benchmark(
    'getNodeRenderSettings',
    () => {
      lodManager.getNodeRenderSettings(1);
    },
    100_000
  ));
  console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

  results.push(benchmark(
    'getEdgeRenderSettings',
    () => {
      lodManager.getEdgeRenderSettings(1);
    },
    100_000
  ));
  console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

  results.push(benchmark(
    'recordFrameTime',
    () => {
      lodManager.recordFrameTime();
    },
    10_000
  ));
  console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

  // Batch operations with different node counts
  console.log('\n--- Batch LOD Calculations ---');

  for (const nodeCount of [100, 500, 1000, 5000]) {
    const positions = generateRandomPositions(nodeCount, 1000);

    results.push(benchmark(
      `batchGetLOD (${nodeCount} nodes)`,
      () => {
        lodManager.batchGetLOD(positions, cameraPosition);
      },
      1000
    ));
    console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));
  }

  // Frustum culling
  console.log('\n--- Frustum Culling ---');

  const frustumPlanes = [
    { normal: { x: 1, y: 0, z: 0 }, distance: 1000 },
    { normal: { x: -1, y: 0, z: 0 }, distance: 1000 },
    { normal: { x: 0, y: 1, z: 0 }, distance: 1000 },
    { normal: { x: 0, y: -1, z: 0 }, distance: 1000 },
    { normal: { x: 0, y: 0, z: 1 }, distance: 1000 },
    { normal: { x: 0, y: 0, z: -1 }, distance: 1000 },
  ];

  results.push(benchmark(
    'isInFrustum (single)',
    () => {
      lodManager.isInFrustum(testPosition, 10, frustumPlanes);
    },
    100_000
  ));
  console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

  // Batch frustum culling
  for (const nodeCount of [100, 500, 1000, 5000]) {
    const positions = generateRandomPositions(nodeCount, 2000);

    results.push(benchmark(
      `Batch frustum cull (${nodeCount} nodes)`,
      () => {
        for (const pos of positions) {
          lodManager.isInFrustum(pos, 10, frustumPlanes);
        }
      },
      100
    ));
    console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));
  }

  // Matrix operations
  console.log('\n--- Matrix Operations ---');

  const identityMatrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];

  results.push(benchmark(
    'extractFrustumPlanes',
    () => {
      extractFrustumPlanes(identityMatrix, identityMatrix);
    },
    10_000
  ));
  console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

  results.push(benchmark(
    'createFrustumBounds',
    () => {
      createFrustumBounds(
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: -1 },
        Math.PI / 4,
        16 / 9,
        0.1,
        1000
      );
    },
    10_000
  ));
  console.log(formatResult(results[results.length - 1] ?? { name: "unknown", iterations: 0, totalTimeMs: 0, avgTimeMs: 0, opsPerSecond: 0 }));

  // Summary
  console.log('\n' + '='.repeat(75));
  console.log('Performance Summary');
  console.log('='.repeat(75));
  console.log('');
  console.log('Target: All per-node operations should be <0.01ms for 60fps with 1000 nodes');
  console.log('Budget: 16.67ms per frame, need headroom for rendering');
  console.log('');

  // Calculate total time for realistic frame with 1000 nodes
  const lodPerNode = results.find(r => r.name === 'getEffectiveLOD (single)')?.avgTimeMs ?? 0;
  const frustumPerNode = results.find(r => r.name === 'isInFrustum (single)')?.avgTimeMs ?? 0;
  const renderSettingsTime = results.find(r => r.name === 'getNodeRenderSettings')?.avgTimeMs ?? 0;

  const totalPer1000 = (lodPerNode + frustumPerNode + renderSettingsTime) * 1000;
  console.log(`Estimated LOD overhead for 1000 nodes: ${totalPer1000.toFixed(3)}ms`);
  console.log(`Remaining frame budget: ${(16.67 - totalPer1000).toFixed(3)}ms`);
  console.log('');

  if (totalPer1000 < 5) {
    console.log('LOD system is performant - minimal impact on frame budget');
  } else if (totalPer1000 < 10) {
    console.log('LOD system has moderate overhead - consider batching');
  } else {
    console.log('WARNING: LOD system overhead is high - optimization needed');
  }
};

// Only run when executed directly (not when imported)
if (import.meta.url.endsWith('graph-lod-manager.benchmark.ts')) {
  runBenchmarks().catch(console.error);
}

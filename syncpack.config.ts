import type { RcFile } from 'syncpack';

const config: RcFile = {
  // Sort exports condition keys (source before import/require for bundler support)
  sortExports: [
    'types',
    'source',
    'node-addons',
    'node',
    'browser',
    'module',
    'import',
    'require',
    'svelte',
    'development',
    'production',
    'script',
    'default',
  ],

  // Sort package.json properties
  sortFirst: [
    'name',
    'description',
    'version',
    'type',
    'private',
    'packageManager',
    'workspaces',
    'repository',
    'scripts',
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ],

  // Semver groups - use exact versions (no ^ or ~)
  semverGroups: [
    {
      label: 'Use exact versions (pinned)',
      packages: ['**'],
      dependencies: ['**'],
      dependencyTypes: ['prod', 'dev', 'peer', 'pnpmOverrides'],
      range: '',
    },
  ],

  // Version groups - order matters (first match wins)
  versionGroups: [
    // Local workspace packages must use workspace:* protocol
    {
      label: 'Local workspace packages',
      packages: ['**'],
      dependencies: ['@bibgraph/*'],
      dependencyTypes: ['prod', 'dev'],
      pinVersion: 'workspace:*',
    },
    // Mantine packages must all use the same version
    {
      label: 'Mantine packages',
      packages: ['**'],
      dependencies: ['@mantine/*'],
    },
    // TanStack packages must all use the same version
    {
      label: 'TanStack packages',
      packages: ['**'],
      dependencies: ['@tanstack/*'],
    },
    // Testing Library packages must all use the same version
    {
      label: 'Testing Library packages',
      packages: ['**'],
      dependencies: ['@testing-library/*'],
    },
    // TypeScript ESLint packages must all use the same version
    {
      label: 'TypeScript ESLint packages',
      packages: ['**'],
      dependencies: ['@typescript-eslint/*'],
    },
    // Vitest packages must all use the same version
    {
      label: 'Vitest packages',
      packages: ['**'],
      dependencies: ['vitest', '@vitest/*'],
    },
    // DnD Kit packages must all use the same version
    {
      label: 'DnD Kit packages',
      packages: ['**'],
      dependencies: ['@dnd-kit/*'],
    },
    // Semantic Release packages must all use the same version
    {
      label: 'Semantic Release packages',
      packages: ['**'],
      dependencies: ['@semantic-release/*'],
    },
    // Commitlint packages must all use the same version
    {
      label: 'Commitlint packages',
      packages: ['**'],
      dependencies: ['@commitlint/*'],
    },
    // SWC packages must all use the same version
    {
      label: 'SWC packages',
      packages: ['**'],
      dependencies: ['@swc/*', '@swc-node/*'],
    },
    // React Three Fiber packages must all use the same version
    {
      label: 'React Three Fiber packages',
      packages: ['**'],
      dependencies: ['@react-three/*'],
    },
    // Playwright packages must all use the same version
    {
      label: 'Playwright packages',
      packages: ['**'],
      dependencies: ['@playwright/*'],
    },
    // Axe-core packages must all use the same version
    {
      label: 'Axe-core packages',
      packages: ['**'],
      dependencies: ['@axe-core/*'],
    },
    // ESLint core packages must all use the same version
    {
      label: 'ESLint core packages',
      packages: ['**'],
      dependencies: ['@eslint/*'],
    },
    // Vanilla Extract packages must all use the same version
    {
      label: 'Vanilla Extract packages',
      packages: ['**'],
      dependencies: ['@vanilla-extract/*'],
    },
    // Vite packages must all use the same version
    {
      label: 'Vite packages',
      packages: ['**'],
      dependencies: ['vite', '@vitejs/*', 'vite-*'],
    },
    // D3 type definitions must all use the same version
    {
      label: 'D3 types',
      packages: ['**'],
      dependencies: ['@types/d3', '@types/d3-*'],
    },
    // Three.js packages must all use the same version
    {
      label: 'Three.js packages',
      packages: ['**'],
      dependencies: ['three', '@types/three', 'three-*'],
    },
    // React Force Graph packages must all use the same version
    {
      label: 'React Force Graph packages',
      packages: ['**'],
      dependencies: ['react-force-graph-*'],
    },
    // XO ESLint config packages must all use the same version
    {
      label: 'XO ESLint config',
      packages: ['**'],
      dependencies: ['eslint-config-xo', 'eslint-config-xo-*'],
    },
    // React packages must all use the same version
    {
      label: 'React packages',
      packages: ['**'],
      dependencies: ['react', 'react-dom'],
    },
    // React types must all use the same version
    {
      label: 'React types',
      packages: ['**'],
      dependencies: ['@types/react', '@types/react-dom'],
    },
    // PostHog packages must all use the same version
    {
      label: 'PostHog packages',
      packages: ['**'],
      dependencies: ['posthog-js', '@posthog/*'],
    },
  ],

  // Source files to analyze
  source: [
    'package.json',
    'apps/*/package.json',
    'packages/*/package.json',
    'tools/*/package.json',
  ],
};

export default config;

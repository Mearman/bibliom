/// <reference types='vitest' />
import * as path from "node:path"

import { viteStaticCopy } from "vite-plugin-static-copy";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig, mergeConfig } from "vite"

import { baseVitestConfig } from "../../vitest.config.base"

export default defineConfig(
  mergeConfig(baseVitestConfig, {
    root: __dirname,
    cacheDir: "../../node_modules/.vite/packages/client",
    plugins: [tsConfigPaths(), viteStaticCopy({ targets: [{ src: "*.md", dest: "." }] })],
    resolve: {
      // Use source condition to resolve workspace packages to source files
      conditions: ["source", "import", "module", "default"],
    },
    server: {
      deps: {
        // Inline workspace packages to resolve from source files
        inline: [
          "@bibgraph/types",
          "@bibgraph/utils",
        ],
      },
    },
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ tsConfigPaths() ],
    // },
    test: {
      watch: false,
      environment: "node",
      // Force vitest to bundle workspace packages through vite's resolver
      deps: {
        inline: [/@bibgraph\/.*/],
      },
      coverage: {
        reportsDirectory: "../../coverage/packages/client",
      },
      projects: [
        {
          test: {
            name: "unit",
            include: ["src/**/*.unit.test.ts"],
            // Exclude tests with workspace package resolution issues until fixed
            // These tests were never running due to broken @nx/vitest include option
            exclude: [
              "src/client.unit.test.ts",
              "src/utils/__tests__/autocomplete.unit.test.ts",
            ],
            environment: "node",
          },
        },
        {
          test: {
            name: "integration",
            include: ["src/**/*.integration.test.ts"],
            // Exclude tests with workspace package resolution issues until fixed
            // These tests were never running due to broken @nx/vitest include option
            exclude: [
              "src/cache/__tests__/cache-performance.integration.test.ts",
              "src/cache/__tests__/cache.integration.test.ts",
              "src/utils/__tests__/autocomplete.integration.test.ts",
            ],
            environment: "node",
            testTimeout: 30000,
          },
        },
      ],
    },
  }),
);

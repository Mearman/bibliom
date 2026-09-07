/// <reference types='vitest' />
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig, mergeConfig } from "vitest/config"

import { baseVitestConfig } from "../../vitest.config.base"

export default defineConfig(mergeConfig(baseVitestConfig, {
	plugins: [tsConfigPaths()],
	resolve: {
		// Use source condition to resolve workspace packages to source files
		conditions: ["source", "import", "module", "default"],
	},
	test: {
		watch: false,
		// Force vitest to bundle workspace packages through vite's resolver
		deps: {
			inline: [/@bibgraph\/.*/],
		},
		// Named projects for targeted test execution
		projects: [
			{
				test: {
					name: "unit",
					include: ["src/**/*.unit.test.ts"],
					environment: "node",
				},
			},
			{
				test: {
					name: "integration",
					include: ["src/**/*.integration.test.ts"],
					environment: "node",
					testTimeout: 30000,
				},
			},
		],
	},
}))

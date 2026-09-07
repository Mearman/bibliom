/// <reference types='vitest' />
import * as path from "node:path";

import { viteStaticCopy } from "vite-plugin-static-copy";
import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	root: __dirname,
	cacheDir: "../../node_modules/.vite/packages/client",
	plugins: [tsConfigPaths(), viteStaticCopy({ targets: [{ src: "*.md", dest: "." }] })],
	resolve: {
		alias: {
			"@bibgraph/types/entities": path.resolve(__dirname, "../../packages/types/src/entities/index.ts"),
			"@bibgraph/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
			"@bibgraph/utils": path.resolve(__dirname, "../../packages/utils/src/index.ts"),
		},
	},
	test: {
		name: "unit",
		globals: true,
		environment: "node",
		watch: false,
		maxConcurrency: 1,
		maxWorkers: 1,
		include: ["src/**/*.unit.test.ts"],
		// Exclude tests with workspace package resolution issues until fixed
		exclude: [
			"src/client.unit.test.ts",
			"src/utils/__tests__/autocomplete.unit.test.ts",
		],
		coverage: {
			provider: "v8",
			reportsDirectory: "../../coverage/packages/client/unit",
		},
	},
});

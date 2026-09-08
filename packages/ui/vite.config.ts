import { fileURLToPath, URL } from "node:url";
import { resolve } from "path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// UI library Vite configuration
// Uses vite-plugin-dts for TypeScript declarations (no separate tsc step needed)
const uiConfig = defineConfig({
  plugins: [
    dts({
      include: ["src/**/*"],
      outDirs: ["dist"],
    }),
  ],
  build: {
      lib: {
        entry: resolve(
          fileURLToPath(new URL(".", import.meta.url)),
          "src/index.ts",
        ),
        name: "BibGraphUI",
        formats: ["es", "cjs"],
        fileName: (format) => {
          if (format === "es") return "index.es.js";
          if (format === "cjs") return "index.cjs.js";
          return `index.${format}.js`;
        },
      },
    sourcemap: true,
    copyPublicDir: false,
    emptyOutDir: true,
    target: "esnext",
    rollupOptions: {
      // Externalize all dependencies including React (peer dependencies)
      external: [
        // React (peer dependency - must be externalized)
        "react",
        "react-dom",
        "react/jsx-runtime",

        // Mantine UI library (heavy)
        "@mantine/core",
        "@mantine/hooks",
        "@mantine/dates",
        "@mantine/notifications",
        "@mantine/spotlight",

        // Icons (large)
        "@tabler/icons-react",

        // Other heavy dependencies
        "@tanstack/react-table",
        "@tanstack/react-router",
        "@xyflow/react",
        "date-fns",
        "immer",

        // Internal workspace dependencies (avoid circular dependencies)
        "@bibgraph/types",
        "@bibgraph/utils",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
          "@mantine/core": "MantineCore",
          "@mantine/hooks": "MantineHooks",
          "@mantine/dates": "MantineDates",
          "@mantine/notifications": "MantineNotifications",
          "@mantine/spotlight": "MantineSpotlight",
          "@tabler/icons-react": "TablerIcons",
          "@tanstack/react-table": "ReactTable",
          "@tanstack/react-router": "ReactRouter",
          "@xyflow/react": "XYFlow",
          "date-fns": "dateFns",
          immer: "immer",
        },
      },
    },
  },

  esbuild: {
    jsx: "automatic",
    jsxFactory: "React",
    jsxFragment: "React.Fragment",
  },

  resolve: {
    alias: {
      "@": resolve(fileURLToPath(new URL(".", import.meta.url)), "src"),
    },
  },
});

export default uiConfig;

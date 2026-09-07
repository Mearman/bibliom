import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import tsConfigPaths from "vite-tsconfig-paths";
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    react(),
    vanillaExtractPlugin(),
  ],

  root: resolve(__dirname),
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  define: {
    global: 'globalThis',
  },
});

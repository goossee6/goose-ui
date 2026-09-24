import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  plugins: [svelte()],
  resolve: {
    preserveSymlinks: true,
  },
  optimizeDeps: {
    exclude: ['goose-ui'],
  },
});
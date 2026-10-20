import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  base: './',
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Windows 下 demo/node_modules/goose-ui 是指向仓库根的 Junction。默认的
    // 文件监听不跟随链接，改 src/lib 里的组件时 dev server 察觉不到。
    watch: { followSymlinks: true },
  },
  plugins: [svelte()],
  optimizeDeps: {
    exclude: ['goose-ui'],
  },
});

import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

/**
 * demo 是纯静态站（GitHub Pages），页面之间没有访问先后规律，
 * 所以不做「首屏命中率」优化、也不按页拆：只按依赖性质成块，约束是单文件 ≤500KB。
 *
 *   vendor  —— Svelte 运行时 + 图标
 *   ui      —— goose-ui 的 86 个组件
 *   demos   —— 76 个示例页 + 它们共用的外壳与示例数据
 *   index   —— 应用外壳 + 加载表
 *   style   —— 全部样式（CSS 不分片）
 *
 * 不按页拆是因为 76 个示例页会变成 76 个文件，而页面访问是随机的：
 * 拆碎的收益只有「少下几十 KB」，代价是全站请求数翻一个量级。
 */

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Windows 下 demo/node_modules/goose-ui 是指向仓库根的 Junction。默认的
    // 文件监听不跟随链接，改 src/lib 里的组件时 dev server 察觉不到。
    watch: { followSymlinks: true },
  },
  plugins: [svelte()],
  optimizeDeps: {
    exclude: ['goose-ui'],
  },
  build: {
    // 每个组件的 scoped 样式默认各成一个 CSS 文件：86 个组件 → 74 个文件，
    // 中位数 1.3KB、最小 65 字节。合并后 74 → 1，gzip 从 53KB 降到 31KB。
    cssCodeSplit: false,
    // 注意：Vite 8 起 rollupOptions 换成 rolldownOptions，旧键会被静默忽略
    // （不报错、也不生效）。
    rolldownOptions: {
      output: {
        codeSplitting: {
          // 顺序即优先级：先被匹配到的组先吃模块。
          // vendor / ui 必须排在 demos 之前 —— 反之 demos 会把它们的依赖
          // 一起递归吞进去（实测 demos 涨到 758KB，vendor 只剩 2KB）。
          // demos 只认 demo/src/lib 下剩下的内容（示例页、PropsTable、加载表），
          // App.svelte / main.ts 这些入口侧文件留在 index。
          groups: [
            { name: 'vendor', test: /node_modules[\\/]/, priority: 40 },
            { name: 'ui', test: /goose-ui[\\/]src[\\/]lib[\\/]/, priority: 30 },
            { name: 'demos', test: /[\\/]demo[\\/]src[\\/]lib[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
});

import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

/**
 * demo 是纯静态站（GitHub Pages），约束是**单文件 ≤500KB**（超过就构建失败）。
 *
 *   vendor   —— Svelte 运行时 + 图标
 *   ui       —— goose-ui 的全部组件
 *   shell    —— 示例页共用的外壳（代码预览、属性表）
 *   demo-lib —— 示例数据与工具（`_shared.ts` / `_tableShared.ts` / `_tableSources.ts`）
 *   index    —— 应用外壳 + 页签加载表
 *   style    —— 全部样式（CSS 不分片）
 *
 * 示例页本身**不再合并成一块**：`registry.ts` 用的是逐页 `import()`，本来就会让
 * Vite 按页切块（那也是它存在的理由）。早先为了「少几个请求」把 76 页强行塞进一个
 * `demos` 组，结果是每加一个示例页就把这块往 512000 字节的线上顶 —— 2026-11 时只剩
 * 157 字节余量，加一个组件就红。现在交还给动态 import：只有真正切过去的页才下载。
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
    // 每个组件的 scoped 样式默认各成一个 CSS 文件（实测 80 多个组件 → 74 个文件），
    // 中位数 1.3KB、最小 65 字节。合并后 74 → 1，gzip 从 53KB 降到 31KB。
    cssCodeSplit: false,
    // 注意：Vite 8 起 rollupOptions 换成 rolldownOptions，旧键会被静默忽略
    // （不报错、也不生效）。
    rolldownOptions: {
      output: {
        codeSplitting: {
          // 顺序即优先级：先被匹配到的组先吃模块。
          // vendor / ui 必须排在最前 —— 反之示例页会把它们的依赖一起递归吞进去
          // （实测那一版 demos 涨到 758KB，vendor 只剩 2KB）。
          // 这里只登记「几十个页面共用」的东西；示例页交给动态 import 自行切块。
          groups: [
            { name: 'vendor', test: /node_modules[\\/]/, priority: 40 },
            { name: 'ui', test: /goose-ui[\\/]src[\\/]lib[\\/]/, priority: 30 },
            {
              name: 'shell',
              test: /[\\/]demo[\\/]src[\\/]lib[\\/](?:CodePreview|PropsTable)\.svelte/,
              priority: 20,
            },
            {
              name: 'demo-lib',
              test: /[\\/]demo[\\/]src[\\/]lib[\\/]demos[\\/]_(?:shared|tableShared|tableSources)\.ts/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});

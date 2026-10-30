# 安装与接入

## 预览 Demo

克隆仓库后启动本地预览：

```bash
git clone https://github.com/goossee6/goose-ui.git
cd goose-ui/demo
pnpm install
pnpm dev
```

在线版：<https://goossee6.github.io/goose-ui/>

## 安装

```bash
pnpm add github:goossee6/goose-ui @lucide/svelte
```

锁版本安装：

```bash
pnpm add github:goossee6/goose-ui#v0.1.0
```

本地开发接入（改组件源码即时生效，无需重装）：

```bash
git clone https://github.com/goossee6/goose-ui.git ../goose-ui
pnpm add file:../goose-ui
```

> `@lucide/svelte` 是 **peer 依赖且必装**，缺了构建会直接报
> `Cannot find package '@lucide/svelte'`（原因见下文 Peer Dependencies）。

### 接入注意（Vite）

包以源码形态分发，Vite 需关闭对它的依赖预打包：

```ts
// vite.config.ts
export default defineConfig({
  plugins: [svelte()],
  optimizeDeps: { exclude: ["goose-ui"] },
});
```

### 接入注意（深色首屏）

`theme.css` 默认亮色，深色用户会先看到一帧白再切黑。在 `index.html` 的 `<head>` 里、
业务 JS 之前补一段（键名与 `themeStore` 的存储键一致）：

```html
<script>
  try {
    var t = localStorage.getItem("goose-ui-theme");
    if (t !== "dark" && t !== "light") {
      t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (t === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
</script>
```

## 快速开始

### 1. 引入主题样式（应用入口，只需一次）

```ts
import "goose-ui/styles/theme.css";
```

### 2. 用组件

```svelte
<script lang="ts">
  import { Button, Card, Notification, NotificationProvider } from "goose-ui";
</script>

<!-- 全局挂载通知容器（App.svelte 顶层，只需一次） -->
<NotificationProvider />

<Card title="用户信息">
  <p>内容</p>
</Card>

<Button variant="primary" onclick={() => Notification.success("保存成功")}>保存</Button>
```

### 3. 需要完整应用外壳时（Wails3 / 后台应用）

`Layout` 只提供「顶栏 / 可选侧栏 / 内容卡片」三个区域，不内置 TitleBar、Sidebar 等组件——用 `titlebar` / `aside` 插槽按需组合：

```svelte
<script lang="ts">
  import {
    Layout, TitleBar, Sidebar, Page, NotificationProvider,
    themeStore, toggleThemeFromEvent,
    type SidebarEntry,
  } from "goose-ui";
  import House from "@lucide/svelte/icons/house";

  const groups: SidebarEntry[] = [
    { value: "home", label: "首页", icon: House },
    { title: "组件", items: [{ value: "button", label: "按钮" }] },
  ];
  let active = $state("home");
</script>

<NotificationProvider />

<Layout>
  {#snippet titlebar()}
    <TitleBar
      title="我的应用"
      theme={themeStore.theme}
      onThemeToggle={toggleThemeFromEvent}
    />
  {/snippet}
  {#snippet aside()}
    <Sidebar {groups} bind:activeTab={active} embedded shadow={false} />
  {/snippet}

  {#if active === "home"}
    <Page title="首页" description="内容区">…</Page>
  {:else if active === "button"}
    <Page title="按钮">…</Page>
  {/if}
</Layout>
```

- `themeStore` + `toggleThemeFromEvent` 让标题栏的主题按钮带圆形扩散转场
- 完整外壳用法见[应用外壳](shell.md)

## 导入方式

### Barrel import（推荐）

```ts
import { Button, Card, Modal, Select, Notification } from "goose-ui";
```

Vite/Rollup 会自动 tree-shake 未使用的组件。

### 直接路径 import

```ts
import Button from "goose-ui/button";
import Modal from "goose-ui/modal";
```

### 样式

```ts
import "goose-ui/styles/theme.css";
```

必须在应用入口引入一次，提供所有 CSS 变量定义。

## Peer Dependencies

| 包                        | 必需 | 说明                                                  |
| ------------------------- | ---- | ----------------------------------------------------- |
| `svelte` ^5.0.0           | ✅   | 框架                                                  |
| `@lucide/svelte` >=1.43.0 | ✅   | 图标库；十几个组件在模块顶层直接 import，缺了无法构建 |

> `dependencies` 为空：没有 clsx 之类的 class 拼接库，也没有样式运行时。
>
> **Wails3 桌面应用**：goose-ui 不依赖 `@wailsio/runtime`。窗口控制通过 `TitleBar` 的 `windowApi` prop 注入（实现 `WindowController` 接口，包一层 `@wailsio/runtime` 的 `Window` 即可）；窗口拖拽与四角缩放是纯 CSS。完整示例见 demo 的 TitleBar 页「Wails3 接入说明」。

## 开发

```bash
pnpm dev            # 起 demo（Vite）
pnpm check          # svelte-check 类型检查（带 --fail-on-warnings）
pnpm test           # 单元测试（node --test，tests/*.test.ts）
pnpm build          # 生产构建
```

CI（`.github/workflows/deploy.yml`）在构建 demo 前会先跑 `pnpm check` 与 `pnpm test`，任何类型错误、a11y 警告或单测失败都会挡住部署。

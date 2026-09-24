# goose-ui

零第三方依赖的 Svelte 5 纯 CSS 组件库，支持 Wails3 桌面应用开发。

## 特性

- **零依赖** — 仅需 `clsx`（~200B）+ `@lucide/svelte`（图标）
- **纯 CSS** — 所有组件使用 scoped `<style>` + CSS 自定义属性，不依赖任何 CSS 框架
- **Svelte 5 Runes** — 全面使用 `$props()`、`$state`、`$derived`、`$effect`
- **Tree-shakeable** — 支持按需导入，未使用的组件不会打包
- **暗色主题** — 内置 light/dark 主题切换，通过 CSS 变量实现

## 预览 Demo

克隆仓库后启动本地预览：

```bash
git clone https://github.com/goossee6/goose-ui.git
cd goose-ui/demo
pnpm install
pnpm dev
```

## 安装

```bash
npm install goose-ui
```

或使用 pnpm：

```bash
pnpm add goose-ui
```

## 快速开始

在应用入口文件中引入主题：

```ts
import "goose-ui/styles/theme.css";
```

在组件中按需导入：

```svelte
<script>
  import { Button, Card, Modal, Notification, NotificationProvider } from 'goose-ui';
</script>

<!-- 全局挂载通知容器（App.svelte 顶层） -->
<NotificationProvider />

<Card title="用户信息">
  <p>内容</p>
</Card>

<Button variant="primary" onclick={() => Notification.success('成功')}>保存</Button>
```

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

## 组件清单

### 基础组件

| 组件            | 说明                                                     |
| --------------- | -------------------------------------------------------- |
| Button          | 按钮，支持 primary/default/ghost/danger/link 五种变体    |
| Card            | 卡片容器，支持 title + right header                      |
| Checkbox        | 复选框，支持 children 文字点击切换                       |
| CreatableSelect | 可新建搜索选择器，支持静态/异步数据源                    |
| Input           | 输入框，支持 clearable/Enter 回调/digitsOnly/status 状态 |
| Label           | 表单标签                                                 |
| Select          | 下拉选择，支持键盘导航和 meta 标签                       |
| MultiSelect     | 多选下拉，支持 badge 标签                                |
| Toggle          | iOS 风格开关，带弹性动画                                 |
| StatusBadge     | 状态徽章                                                 |

### 数据展示

| 组件            | 说明                               |
| --------------- | ---------------------------------- |
| DataTable       | 数据表格，支持排序、高亮、右键菜单 |
| DataList        | 数据列表，带空状态                 |
| ProgressBar     | 渐变进度条                         |
| ProgressBytes   | 上传进度（字节/速度/ETA）          |
| ProgressSlotBar | 分片上传进度                       |
| UsageBar        | 用量/限额进度条                    |

### 导航与布局

| 组件          | 说明                                                 |
| ------------- | ---------------------------------------------------- |
| PageHeader    | 页面标题栏（标题 + 操作区）                          |
| SegmentedTabs | 分段标签（pill 动画 + underline 双模式）             |
| Sidebar       | 悬浮岛式侧边栏（导航分组 + 折叠 + popover）          |
| Header        | 固定顶部导航栏（标题 + 操作区 + 自定义插槽）         |
| ThemeToggle | 主题切换按钮，开箱即用：默认 Sun/Moon 图标、圆形扩散动画、localStorage 持久化、多实例状态同步；可用 lightIcon/darkIcon 覆盖 |
| Layout        | Wails3 应用整体布局（TitleBar + 侧栏 tabs + 内容区） |

### 反馈

| 组件                 | 说明                                                     |
| -------------------- | -------------------------------------------------------- |
| Modal                | 模态弹窗（fade+scale 转场、backdrop blur）               |
| Drawer               | 抽屉弹窗（4 方向 + 景深效果 + portal）                   |
| NotificationProvider | 通知容器（App 顶层挂载一次，配合 Notification API 使用） |
| NotificationItem     | 单条通知（由 NotificationProvider 内部渲染）             |
| ErrorDialog          | 错误弹窗（配合 pushError 使用）                          |
| Tooltip              | 气泡提示（12 方向 + 自动翻转 + hover/focus/click 触发）  |
| Loading              | 加载指示器（spinner 或自定义图片，size 可调）            |

### 输入增强

| 组件        | 说明                         |
| ----------- | ---------------------------- |
| DropZone    | 拖拽上传区                   |
| PresetInput | 带预设的输入框，支持多行模式 |

### 其他

| 组件        | 说明                                                          |
| ----------- | ------------------------------------------------------------- |
| Icon        | 图标包装器（传入 `@lucide/svelte` 图标组件，支持 size/class） |
| TitleBar    | Wails3 自绘标题栏                                             |
| Typewriter  | 打字机效果，支持逐字文本或淡入 Snippet                        |
| ContextMenu | 右键菜单（全局注册机制）                                      |

## 工具函数与 API

### 工具函数

```ts
import { cn, formatNum, formatBytes, copyToClipboard } from "goose-ui";

cn("a", cond && "b"); // clsx 类名拼接
formatNum(1234567); // "1.2M"
formatBytes(1536); // "1.5 KB"
await copyToClipboard("text"); // 返回 Promise<boolean>
```

### Notification API

```ts
import { Notification } from "goose-ui";

Notification.success("操作成功");
Notification.info({ title: "系统通知", description: "今晚维护", position: "top-right" });
Notification.warning("磁盘空间不足");
Notification.error("连接失败");
```

- 类型：`success` / `info` / `warning` / `error`
- `position`：`top-left` / `top` / `top-right` / `bottom-left` / `bottom` / `bottom-right`
- 需先在应用顶层挂载 `<NotificationProvider />`

### 错误弹窗 API

```ts
import { pushError, errorStore } from "goose-ui";

pushError("网络请求失败", new Error("Failed to fetch"));
```

需配合顶层挂载 `<ErrorDialog />`，通过 `errorStore` 读取错误列表（`pushError(kind, err)`）。

### 主题 API

```ts
import { themeStore, setTheme, toggleTheme, initTheme } from "goose-ui";

themeStore.theme;              // 'light' | 'dark'，响应式，多实例共享
setTheme("dark");              // 显式设置并持久化
toggleTheme();                 // 切换（传 { x, y } 时启用圆形扩散转场）
initTheme();                   // 幂等：应用持久化/系统偏好（ThemeToggle 挂载时自动调用）
```

单独使用 `<ThemeToggle />` 无需任何配置：自动读取偏好、持久化、同步所有实例。

### 右键菜单 API

```ts
import { registerMenu, openMenuAt, onMenuAction, cellMenuAttrs, menuStore } from "goose-ui";

registerMenu("row", [
  { id: "copy", label: "复制" },
  { id: "del", label: "删除" },
]);
onMenuAction("row", "del", (data) => console.log(data));
```

- 配合顶层挂载 `<ContextMenu />` 使用
- `cellMenuAttrs("row", data)` 生成 `data-menu-*` 属性，绑定到表格单元格

## 主题定制

所有组件使用 CSS 自定义属性，覆盖 `:root` 变量即可定制主题（完整变量清单见 `src/lib/styles/theme.css`）：

```css
:root {
  /* 品牌色 */
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --danger: #dc2626;
  --info: #3b82f6;
  --warning: #f59e0b;
  --success: #22c55e;
  /* 基础色 */
  --bg: #f5f5f5;
  --surface: #fafaf7;
  --text: #2c2c2e;
  --border: #e0dfda;
}
```

暗色主题通过 `.dark` 或 `[data-theme="dark"]` 类名切换。

## Peer Dependencies

| 包                                | 必需 | 说明                              |
| --------------------------------- | ---- | --------------------------------- |
| `svelte` ^5.0.0                   | ✅   | 框架                              |
| `@lucide/svelte` >=1.43.0         | 可选 | 图标库（Icon 组件及内置图标依赖） |
| `@wailsio/runtime` >=3.0.0-beta.0 | 可选 | 仅 TitleBar / Layout 组件需要     |

> `clsx` 作为 dependencies 随包自动安装，无需手动引入。

## License

MIT

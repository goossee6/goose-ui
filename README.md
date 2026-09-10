# goose-ui

零第三方依赖的 Svelte 5 纯 CSS 组件库。从 dashboard 和 toolkit 两个项目中提取整合，用于 Wails3 桌面应用开发。

## 特性

- **零依赖** — 仅需 `clsx`（~200B），无 Tailwind、无 lucide-svelte、无 svelte-sonner
- **纯 CSS** — 所有组件使用 scoped `<style>` + CSS 自定义属性，不依赖任何 CSS 框架
- **Svelte 5 Runes** — 全面使用 `$props()`、`$state`、`$derived`、`$effect`
- **Tree-shakeable** — 支持按需导入，未使用的组件不会打包
- **暗色主题** — 内置 light/dark 主题切换，通过 CSS 变量实现

## 安装

将 `goose-ui` 目录放到你的项目中（如作为子目录或 pnpm workspace），然后在 `package.json` 中引用：

```json
{
  "dependencies": {
    "goose-ui": "workspace:*"
  }
}
```

## 快速开始

在应用入口文件中引入主题：

```ts
// src/app.css 或 src/app.ts
import 'goose-ui/styles/theme.css';
```

在组件中按需导入：

```svelte
<script>
  import Button from 'goose-ui/button';
  import Card from 'goose-ui/card';
  import Modal from 'goose-ui/modal';
  import { showToast, showConfirm } from 'goose-ui';
</script>

<Card title="用户信息">
  <p>内容</p>
</Card>

<Button variant="primary" onclick={() => showToast('成功')}>保存</Button>
```

## 导入方式

### Barrel import（推荐）

```ts
import { Button, Card, Modal, Select, showToast } from 'goose-ui';
```

Vite/Rollup 会自动 tree-shake 未使用的组件。

### 直接路径 import

```ts
import Button from 'goose-ui/button';
import Modal from 'goose-ui/modal';
import { showToast } from 'goose-ui/toast-store';
```

### 样式

```ts
import 'goose-ui/styles/theme.css';
```

必须在应用入口引入一次，提供所有 CSS 变量定义。

## 组件清单

### 基础组件

| 组件 | 路径 | 说明 |
|------|------|------|
| Button | `goose-ui/button` | 按钮，支持 primary/secondary/danger/cancel 四种变体 |
| Card | `goose-ui/card` | 卡片容器，支持 title + right header |
| Checkbox | `goose-ui/checkbox` | 复选框 |
| Input | `goose-ui/input` | 输入框，支持 clearable/Enter 回调/digitsOnly |
| Label | `goose-ui/label` | 表单标签 |
| Select | `goose-ui/select` | 下拉选择，支持键盘导航和 meta 标签 |
| MultiSelect | `goose-ui/multi-select` | 多选下拉，支持 badge 标签 |
| Toggle | `goose-ui/toggle` | iOS 风格开关，带弹性动画 |
| StatusBadge | `goose-ui/status-badge` | 状态徽章（normal/warning） |

### 数据展示

| 组件 | 路径 | 说明 |
|------|------|------|
| DataTable | `goose-ui/data-table` | 数据表格，支持排序、高亮、右键菜单 |
| DataList | `goose-ui/data-list` | 数据列表，带空状态 |
| ProgressBar | `goose-ui/progress-bar` | 渐变进度条 |
| ProgressBytes | `goose-ui/progress-bytes` | 上传进度（字节/速度/ETA） |
| ProgressSlotBar | `goose-ui/progress-slot-bar` | 分片上传进度 |
| UsageBar | `goose-ui/usage-bar` | 用量/限额进度条 |

### 导航与布局

| 组件 | 路径 | 说明 |
|------|------|------|
| PageHeader | `goose-ui/page-header` | 页面标题栏（标题 + 操作区） |
| SegmentedTabs | `goose-ui/segmented-tabs` | 分段标签（pill 动画 + underline 双模式） |
| Sidebar | — | 应用侧边栏（按需从项目复制） |

### 反馈

| 组件 | 路径 | 说明 |
|------|------|------|
| Modal | `goose-ui/modal` | 模态弹窗（fade+scale 转场、backdrop blur） |
| Toast | `goose-ui/toast` | 通知容器（配合 toast-store 使用） |
| ConfirmDialog | `goose-ui/confirm-dialog` | 确认弹窗（配合 confirm-store 使用） |
| ErrorDialog | `goose-ui/error-dialog` | 错误弹窗（配合 error-store 使用） |

### 输入增强

| 组件 | 路径 | 说明 |
|------|------|------|
| DropZone | `goose-ui/drop-zone` | 拖拽上传区 |
| PresetInput | `goose-ui/preset-input` | 带预设的输入框，支持多行模式 |

### 其他

| 组件 | 路径 | 说明 |
|------|------|------|
| Icon | `goose-ui/icon` | SVG 图标（40+ 图标） |
| TitleBar | `goose-ui/title-bar` | Wails3 自绘标题栏（最小化/最大化/关闭/主题切换） |
| Typewriter | `goose-ui/typewriter` | 淡入动画包装 |
| ContextMenu | `goose-ui/context-menu` | 右键菜单（全局注册机制） |

## Store

| Store | 路径 | 说明 |
|-------|------|------|
| toastStore | `goose-ui/toast-store` | `showToast(msg, type?)` / `showErrorToast(err, prefix?)` |
| confirmStore | `goose-ui/confirm-store` | `showConfirm(msg, options?)` 返回 Promise<boolean> |
| errorStore | `goose-ui/error-store` | `pushError(kind, err)` 错误累积展示 |
| contextMenu | `goose-ui/context-menu-store` | `registerMenu()` / `openMenuAt()` / `onMenuAction()` |

## 工具函数

```ts
import { cn, formatNum, formatBytes } from 'goose-ui';

cn('class1', condition && 'class2');  // clsx 包装
formatNum(1500);                       // "1.5K"
formatBytes(1048576);                  // "1 MB"
```

## 主题定制

所有组件使用 CSS 自定义属性，覆盖 `:root` 变量即可定制主题：

```css
:root {
  --primary: #6366f1;        /* 主色 */
  --primary-hover: #4f46e5;  /* 主色 hover */
  --primary-soft: #eef2ff;   /* 主色浅色背景 */
  --danger: #ef4444;
  --border-strong: #d1d5db;
  --radius-lg: 8px;
  /* 完整变量列表见 src/lib/styles/theme.css */
}
```

暗色主题通过 `.dark` 或 `[data-theme="dark"]` 类名切换。

## 图标

使用 `<Icon name="图标名" size={20} />` 渲染，可用图标名见 `src/lib/components/icons.ts`：

`home`, `info`, `x`, `copy`, `search`, `settings`, `sun`, `moon`, `check-circle`, `x-circle`, `trash-2`, `edit`, `plus`, `download`, `upload`, `external-link`, `refresh-ccw`, `globe`, `grip`, `chevron-down`, `arrow-up`, `arrow-down`, `delete`, `minimize`, `maximize`, `restore`, `close-window` 等。

## Peer Dependencies

| 包 | 必需 | 说明 |
|---|---|---|
| `svelte` ^5.0.0 | ✅ | 框架 |
| `@wailsio/runtime` >=3.0.0 | 可选 | 仅 TitleBar 组件需要 |

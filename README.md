# goose-ui

零第三方依赖的 Svelte 5 纯 CSS 组件库。从 dashboard 和 toolkit 两个项目中提取整合，用于 Wails3 桌面应用开发。

## 特性

- **零依赖** — 仅需 `clsx`（~200B）+ `@lucide/svelte`（图标），无 Tailwind、无 svelte-sonner
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

| 组件        | 路径                    | 说明                                                |
| ----------- | ----------------------- | --------------------------------------------------- |
| Button      | `goose-ui/button`       | 按钮，支持 primary/default/ghost/danger/link 五种变体，icon/iconRight 图标 prop |
| Card        | `goose-ui/card`         | 卡片容器，支持 title + right header                 |
| Checkbox    | `goose-ui/checkbox`     | 复选框，支持 children 文字点击切换                  |
| CreatableSelect | `goose-ui/creatable-select` | 可新建搜索选择器，支持静态/异步数据源、键盘导航、内联创建 |
| Input       | `goose-ui/input`        | 输入框，支持 clearable/Enter 回调/digitsOnly/status/error/warning 状态 |
| Label       | `goose-ui/label`        | 表单标签                                            |
| Select      | `goose-ui/select`       | 下拉选择，支持键盘导航和 meta 标签                  |
| MultiSelect | `goose-ui/multi-select` | 多选下拉，支持 badge 标签                           |
| Toggle      | `goose-ui/toggle`       | iOS 风格开关，带弹性动画                            |
| StatusBadge | `goose-ui/status-badge` | 状态徽章（normal/warning）                          |

### 数据展示

| 组件            | 路径                         | 说明                               |
| --------------- | ---------------------------- | ---------------------------------- |
| DataTable       | `goose-ui/data-table`        | 数据表格，支持排序、高亮、右键菜单 |
| DataList        | `goose-ui/data-list`         | 数据列表，带空状态                 |
| ProgressBar     | `goose-ui/progress-bar`      | 渐变进度条                         |
| ProgressBytes   | `goose-ui/progress-bytes`    | 上传进度（字节/速度/ETA）          |
| ProgressSlotBar | `goose-ui/progress-slot-bar` | 分片上传进度                       |
| UsageBar        | `goose-ui/usage-bar`         | 用量/限额进度条                    |

### 导航与布局

| 组件          | 路径                      | 说明                                     |
| ------------- | ------------------------- | ---------------------------------------- |
| PageHeader    | `goose-ui/page-header`    | 页面标题栏（标题 + 操作区）              |
| SegmentedTabs | `goose-ui/segmented-tabs` | 分段标签（pill 动画 + underline 双模式） |
| Sidebar       | —                         | 应用侧边栏（按需从项目复制）             |

### 反馈

| 组件              | 路径                              | 说明                                       |
| ----------------- | --------------------------------- | ------------------------------------------ |
| Modal             | `goose-ui/modal`                  | 模态弹窗（fade+scale 转场、backdrop blur） |
| Notification      | `goose-ui/notification`           | 通知容器（配合 Notification API 使用）     |
| NotificationItem  | `goose-ui/notification-item`      | 单条通知（icon + 关闭按钮 + 进度条）       |
| ErrorDialog       | `goose-ui/error-dialog`           | 错误弹窗（配合 pushError 使用）            |

### 输入增强

| 组件        | 路径                    | 说明                         |
| ----------- | ----------------------- | ---------------------------- |
| DropZone    | `goose-ui/drop-zone`    | 拖拽上传区                   |
| PresetInput | `goose-ui/preset-input` | 带预设的输入框，支持多行模式 |

### 其他

| 组件        | 路径                    | 说明                                             |
| ----------- | ----------------------- | ------------------------------------------------ |
| Icon        | `goose-ui/icon`         | SVG 图标（40+ 图标）                             |
| TitleBar    | `goose-ui/title-bar`    | Wails3 自绘标题栏（最小化/最大化/关闭/主题切换） |
| Typewriter  | `goose-ui/typewriter`   | 打字机效果，支持逐字文本或淡入 Snippet |
| ContextMenu | `goose-ui/context-menu` | 右键菜单（全局注册机制）                         |

## Notification 通知

命令式 API，4 种类型 × 6 个位置，标题+描述双行布局，自动挂载到 body。

### Modal Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` (bindable) | `false` | 是否显示 |
| `title` | `string \| Snippet` | — | 标题（支持 HTML 富文本或 Snippet） |
| `width` | `number \| string` | `520` | 宽度（数字按 px，也可传 CSS 字符串如 `"80vw"`） |
| `maskClosable` | `boolean` | `false` | 点击遮罩关闭 |
| `disableClose` | `boolean` | `false` | 禁用关闭（隐藏 X、Esc 无效） |
| `typewriter` | `boolean` | `true` | 打字机效果（内容逐字显示） |
| `typewriterDuration` | `number` | `2000` | 打字机总时长（ms） |
| `onClose` | `() => void` | — | 关闭回调 |
| `onOk` | `() => void` | — | 确定按钮回调 |
| `footer` | `Snippet` | — | 自定义底部（替换默认「取消 / 确定」） |
| `children` | `Snippet` | — | 内容 |

```svelte
<script>
  import { Modal } from 'goose-ui';
  let open = $state(false);
</script>

<Modal bind:open={open} title="提示" width={400}>
  <p>内容</p>
</Modal>

<!-- 关闭打字机效果 -->
<Modal bind:open={open} title="无打字机" typewriter={false}>
  <p>内容直接显示</p>
</Modal>

<!-- 自定义打字机时长 -->
<Modal bind:open={open} title="慢速打字机" typewriterDuration={4000}>
  <p>4 秒播放完毕</p>
</Modal>
```

### Notification API

```ts
import { Notification } from 'goose-ui';

// 快捷方法（传字符串 = title）
Notification.success('操作成功');
Notification.info('提示信息');

// 完整配置
Notification.success({
  title: '操作成功',
  description: '你的数据已保存到服务器',
  position: 'top-left',
  duration: 3000,
  icon: Star,
  showProgress: true,
});

// 不自动关闭（duration: 0）
Notification.warning({ title: '重要警告', duration: 0 });

// 按 key 更新（同 key 二次调用更新现有通知）
Notification.success({ key: 'upload', title: '上传中...', description: '50%' });
Notification.success({ key: 'upload', title: '上传完成', description: '100%' });

// 按 key 关闭
Notification.destroy('upload');

// 清除全部
Notification.destroyAll();
```

### 类型

| 类型 | 说明 |
| --- | --- |
| `success` | 成功（绿色左边框 + CheckCircle 图标） |
| `info` | 信息（蓝色左边框 + Info 图标） |
| `warning` | 警告（橙色左边框 + AlertTriangle 图标） |
| `error` | 错误（红色左边框 + CircleX 图标） |

### 位置

| Position | 说明 |
| --- | --- |
| `top-left` | 左上 |
| `top` | 顶部居中（默认） |
| `top-right` | 右上 |
| `bottom-left` | 左下 |
| `bottom` | 底部居中 |
| `bottom-right` | 右下 |

### NotificationOptions

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | — | 通知标题（必填） |
| `description` | `string` | — | 通知描述/正文 |
| `key` | `string` | — | 唯一 key，同 key 二次调用更新现有通知 |
| `type` | `'success' \| 'info' \| 'warning' \| 'error'` | `'info'` | 类型 |
| `position` | `NotificationPosition` | `'top'` | 显示位置 |
| `closable` | `boolean` | `true` | 是否显示关闭按钮 |
| `closeIcon` | `Component` | — | 自定义关闭图标（替换默认 X） |
| `duration` | `number` | `4500` | 自动关闭时间（ms），0 = 不自动关闭 |
| `icon` | `Component` | — | 自定义图标（覆盖 type 默认图标） |
| `btn` | `Snippet` | — | 自定义操作按钮（渲染在关闭按钮左侧） |
| `onClick` | `() => void` | — | 点击通知本体回调 |
| `onClose` | `() => void` | — | 关闭回调（动画结束触发） |
| `pauseOnHover` | `boolean` | `true` | 悬停暂停自动关闭计时器 |
| `showProgress` | `boolean` | `false` | 显示自动关闭进度条 |

### 全局挂载

在 App.svelte 顶层挂载 `NotificationProvider`：

```svelte
<script>
  import { NotificationProvider } from 'goose-ui';
</script>

<NotificationProvider />

<!-- 其他内容 -->
```

### 旧 API 迁移

| 旧用法 | 新用法 |
| --- | --- |
| `showToast('成功')` | `Notification.success('成功')` |
| `showToast('失败', 'error')` | `Notification.error('失败')` |
| `{ message: '...' }` | `{ title: '...' }` |
| `{ placement: 'top-left' }` | `{ position: 'top-left' }` |

## Store

| Store        | 路径                          | 说明                                                     |
| ------------ | ----------------------------- | -------------------------------------------------------- |
| notificationStore | `goose-ui/notification`  | `Notification.success()` / `.info()` / `.warning()` / `.error()` / `.destroy(key?)` / `.destroyAll()` |
| errorStore   | `goose-ui/error-store`        | `pushError(kind, err)` 错误累积展示                      |
| contextMenu  | `goose-ui/context-menu-store` | `registerMenu()` / `openMenuAt()` / `onMenuAction()`     |

## 工具函数

```ts
import { cn, formatNum, formatBytes } from "goose-ui";

cn("class1", condition && "class2"); // clsx 包装
formatNum(1500); // "1.5K"
formatBytes(1048576); // "1 MB"
```

## 主题定制

所有组件使用 CSS 自定义属性，覆盖 `:root` 变量即可定制主题：

```css
:root {
  --primary: #6366f1; /* 主色 */
  --primary-hover: #4f46e5; /* 主色 hover */
  --primary-soft: #eef2ff; /* 主色浅色背景 */
  --danger: #ef4444;
  --info: #3b82f6; /* 信息色 */
  --warning: #f59e0b; /* 警告色 */
  --success: #22c55e; /* 成功色 */
  --border-strong: #d1d5db;
  --radius-lg: 8px;
  /* 完整变量列表见 src/lib/styles/theme.css */
}
```

暗色主题通过 `.dark` 或 `[data-theme="dark"]` 类名切换。

## 图标

基于 [`@lucide/svelte`](https://lucide.dev/) 图标库。直接传入图标组件：

```svelte
<script>
  import Settings from '@lucide/svelte/icons/settings';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Icon from 'goose-ui/icon';
</script>

<Icon icon={Settings} size={16} />
<Icon icon={Trash2} size={14} class="text-muted" />
```

也可以直接使用 lucide 组件（不经过 Icon 包装）：

```svelte
<script>
  import Camera from '@lucide/svelte/icons/camera';
</script>

<Camera size={48} color="red" strokeWidth={1} />
```

### Icon Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `icon` | `Component` | — | lucide-svelte 图标组件 |
| `size` | `number` | `24` | 图标大小（px） |
| `color` | `string` | `currentColor` | 颜色 |
| `stroke-width` | `number` | `2` | 描边宽度 |
| `nonScalingStroke` | `boolean` | `false` | 缩放时保持描边宽度 |
| `default-class` | `string` | `lucide-icon` | 默认 CSS 类名 |

图标同时支持所有 SVG 标准属性（如 `class`、`style`、`data-*` 等），详见 [MDN SVG Presentation Attributes](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute#presentation_attributes)。

### Button Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'default' \| 'ghost' \| 'danger' \| 'link'` | `'default'` | 按钮变体 |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'icon' \| 'icon-sm' \| 'icon-xs' \| 'icon-lg'` | `'md'` | 尺寸 |
| `icon` | `Component` | — | 左侧图标组件 |
| `iconRight` | `Component` | — | 右侧图标组件 |
| `iconSize` | `number` | `16` | 图标尺寸（px） |
| `disabled` | `boolean` | `false` | 禁用 |
| `loading` | `boolean` | `false` | 加载状态，显示旋转图标并禁用 |
| `class` | `string` | `""` | 额外 CSS 类名 |

```svelte
<Button icon={Trash2} size="icon-sm" variant="ghost" />
<Button icon={Plus} size="sm">新建</Button>
<Button icon={Star} iconRight={ChevronDown}>选项</Button>
```

### Checkbox Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `checked` | `boolean` (bindable) | `false` | 是否选中 |
| `disabled` | `boolean` | `false` | 禁用 |
| `ariaLabel` | `string` | `''` | 无障碍标签 |
| `onchange` | `(e: Event) => void` | — | 变更回调 |
| `size` | `'small' \| 'middle' \| 'large'` | `'middle'` | 尺寸 |
| `children` | `Snippet` | — | 文字内容（点击文字也可切换） |

```svelte
<Checkbox bind:checked={agree}>同意条款</Checkbox>
```

### CreatableSelect Props

可新建搜索选择器。支持静态数据源（`items`）和异步数据源（`loadItems`），内置搜索、键盘导航、内联创建。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` (bindable) | `''` | 当前选中值 |
| `items` | `string[]` | `[]` | 静态数据源 |
| `loadItems` | `() => Promise<string[]>` | — | 异步数据源（首次打开时加载，优先于 `items`） |
| `onCreateItem` | `(name: string) => Promise<void>` | — | 新建回调（不传则隐藏新建按钮） |
| `placeholder` | `string` | `'请选择'` | 触发器占位文字 |
| `title` | `string` | `'请选择'` | 下拉标题 |
| `createText` | `string` | `'新建'` | 新建按钮文案前缀 |
| `disabled` | `boolean` | `false` | 禁用 |
| `class` | `string` | `""` | 额外 CSS 类名 |
| `loadingIndicator` | `Snippet` | — | 加载态指示器（可选） |

```svelte
<!-- 静态数据源 -->
<CreatableSelect items={['tag-a', 'tag-b']} bind:value={selected} />

<!-- 异步数据源 + 新建 -->
<CreatableSelect
  loadItems={async () => await fetchTags()}
  onCreateItem={async (name) => await createTag(name)}
  bind:value={selected}
  loadingIndicator={<LoadingGif />}
/>
```

### Typewriter Props

打字机效果组件。双模式：传 `text` 走逐字打出，传 `children` 走淡入动画。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | `''` | 逐字打出的文本 |
| `children` | `Snippet` | — | 备选内容（淡入模式，无 text 时使用） |
| `duration` | `number` | `2000` | 总动画时长（ms），自动计算每字符间隔 |
| `speed` | `number` | — | 每字符间隔（ms），优先于 `duration` |
| `trigger` | `unknown` | — | 变化时重新播放 |
| `autoPlay` | `boolean` | `true` | 自动开始 |
| `cursor` | `boolean` | `true` | 显示闪烁光标（仅 text 模式） |
| `onDone` | `() => void` | — | 播放完成回调 |
| `class` | `string` | `''` | 额外 CSS 类名 |

```svelte
<!-- 逐字打出（默认 2 秒播放完毕） -->
<Typewriter text="Hello, World!" />

<!-- 自定义总时长 -->
<Typewriter text="4 秒播放" duration={4000} />

<!-- speed 覆盖 duration -->
<Typewriter text="每字符 80ms" speed={80} />

<!-- 触发重播 + 完成回调 -->
<Typewriter text={message} trigger={message} onDone={() => console.log('done')} />

<!-- 淡入模式 -->
<Typewriter>
  <p>这段文字会淡入出现</p>
</Typewriter>
```

## Peer Dependencies

| 包                         | 必需 | 说明                 |
| -------------------------- | ---- | -------------------- |
| `svelte` ^5.0.0            | ✅   | 框架                 |
| `@lucide/svelte`           | ✅   | 图标库               |
| `@wailsio/runtime` >=3.0.0 | 可选 | 仅 TitleBar 组件需要 |

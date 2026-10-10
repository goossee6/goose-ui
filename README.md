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

> 与 Ark UI 等上游命名不一致时，以本表名为准：

| 上游常见叫法 | goose-ui 名 | 说明                        |
| ------------ | ----------- | --------------------------- |
| Dialog       | Modal       | 模态弹窗                    |
| Switch       | Toggle      | iOS 风格开关                |
| Tabs         | Tabs         | 标签页（分段/下划线/垂直 + TabsPanel 面板）  |
| Toggle Group | ToggleGroup | 单选/多选切换组             |

### 基础组件

| 组件        | 说明                                                          |
| ----------- | ------------------------------------------------------------- |
| Button      | 按钮，支持 primary/default/ghost/danger/link 五种变体          |
| Card        | 卡片容器，支持 title + right header                            |
| Label       | 表单标签                                                       |
| StatusBadge | 状态徽章                                                       |
| Icon        | 图标包装器（传入 `@lucide/svelte` 图标组件，支持 size/class/spin 旋转动画） |
| Separator   | 分割线，横/竖/虚线/文字分隔                                    |
| AspectRatio | 等比容器，按比例裁剪内容                                       |
| Avatar      | 头像（首字母回退 + 状态点 + size/shape）                        |
| ScrollArea  | 滚动区（自定义滚动条、role=region）                            |
| Row         | 水平排列行（`gap` sm/md/lg + `align` + 自动换行）              |
| Tag         | 标签（6 变体 × 3 尺寸 + 圆点 + 可关闭）                        |
| Skeleton    | 骨架屏（text/circle/rect + 多行 + shimmer 动画）               |
| Image       | 图片（懒加载 + 失败兜底 + 点击放大预览）                        |
| Footer      | 页脚（左右插槽 + 链接列表 + 版权行 + 吸底）                    |
| CodeBlock   | 代码块（语言标签 + 一键复制 + 注释/字符串/关键字轻量高亮）      |

### 表单输入

| 组件           | 说明                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| Input          | 输入框，clearable/Enter 回调/digitsOnly/status，prefix/suffix 为 snippet    |
| Select         | 下拉选择，支持键盘导航、meta 标签、分组吸顶（组头），无滚动条+两侧箭头滚动区 |
| MultiSelect    | 多选下拉，支持 badge 标签与分组吸顶（组头）                                 |
| CreatableSelect | 可新建搜索选择器，支持静态/异步数据源                                      |
| Checkbox       | 复选框，尺寸档 small/middle/large + 双向绑定 + 半选态（indeterminate）  |
| RadioGroup | 单选组（pill 分段轨道，context 注入）                                  |
| Toggle         | iOS 风格开关，带弹性动画                                                    |
| ToggleGroup    | 单选/多选切换组，default/outline 变体                                       |
| Slider         | 滑块（pointer 捕获拖拽 + 键盘）                                             |
| Combobox       | 组合框（输入过滤 + 分组吸顶 + role=combobox/listbox/option 键盘导航）         |
| Rating         | 评分（半星/只读/键盘 slider 语义）                                          |
| PINInput       | 验证码输入（跳格/粘贴/退格回跳，`group`+`separator` 分组）                  |
| Textarea       | 多行文本域，rows/status/maxlength + resize: vertical                         |
| DropZone       | 拖拽上传区                                                                   |
| Form / FormItem | 表单容器与表单项（context 传递 layout/labelWidth，必填星号 + 错误态）      |
| TimePicker     | 时间选择器（时/分(/秒) 列 + 「现在」快捷 + 自动翻转）                        |

### 日期与时间

| 组件           | 说明                                                       |
| -------------- | ---------------------------------------------------------- |
| DateField      | 日期分段字段（`YYYY-MM-DD`，分段自动跳格/粘贴跨段）         |
| TimeField      | 时间分段字段（`HH:mm[:ss]`，`seconds` 可选段）              |
| DateRangeField | 日期范围分段字段（start/end 双向绑定）                      |
| TimeRangeField | 时间范围分段字段                                            |
| Calendar       | 日历网格（月导航、min/max、disabledDate、方向键/PgUp/PgDn） |
| RangeCalendar  | 范围日历（先起点后终点，悬停预览，清除）                    |
| DatePicker     | 日期选择器（触发器 + 浮层 Calendar，自动翻转、清除）         |
| DateRangePicker | 范围选择器（触发器 + 浮层 RangeCalendar）                   |

### 数据展示

| 组件           | 说明                                     |
| -------------- | ---------------------------------------- |
| DataTable      | 数据表格，支持排序、高亮、右键菜单       |
| DataList       | 数据列表，带空状态                       |
| Tabs           | 标签页（分段/下划线/垂直模式 + 键盘导航）      |
| TabsPanel      | 标签页内容面板（value 匹配选中项时渲染）      |
| PillTrack      | 滑动高亮原语（选中 pill + hover pill，MutationObserver 自动跟随选中） |
| Pagination     | 分页（siblingCount 省略号折叠）          |
| Collapsible    | 折叠面板（grid-rows 0fr→1fr 过渡）       |
| Accordion      | 手风琴（单开/多开/collapsible，复用 Collapsible） |
| ProgressBar    | 渐变进度条                               |
| ProgressBytes  | 上传进度（字节/速度/ETA）                |
| ProgressSlotBar | 分片上传进度                            |
| UsageBar       | 用量/限额进度条                          |
| Meter          | 度量条（threshold/critical 状态）        |
| Typewriter     | 打字机效果，支持逐字文本或淡入 Snippet   |
| Carousel       | 轮播图（手动/自动播放、悬停暂停、首尾循环） |
| Time           | 实时时钟（time/date/datetime + 12h 制）  |
| Countdown      | 倒计时（duration/target 双模式 + 暂停 + 归零回调） |

### 导航与布局

| 组件            | 说明                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| PageHeader      | 页面标题栏（标题 + 描述 + children 附加行 + 右侧操作区，窄屏自动换行）                                          |
| Page            | 页面容器（根布局 + 页头 + 内容区间距一次到位）                                                                  |
| Sidebar         | 悬浮岛式侧边栏（导航分组 + 顶层项穿插 + 折叠 + popover + endItems/footer）                                       |
| Header          | 固定顶部导航栏（标题 + 操作区 + 自定义插槽）                                                                    |
| NavigationMenu  | 导航菜单（面板定位/翻转，链接 + 描述）                                                                           |
| Menubar         | 菜单栏（横向方向键，复用 DropdownMenu）                                                                          |
| DropdownMenu    | 下拉菜单（flip 测量、键盘导航）                                                                                  |
| Toolbar         | 工具栏（role=toolbar + roving 方向键）                                                                           |
| Layout          | Wails3 应用整体布局（TitleBar + 侧栏 tabs + 内容区）                                                             |
| BackTop         | 返回顶部（超过阈值淡入 + easeOutCubic 平滑回顶）                                                                  |
| Cursor          | 自定义光标（区域内圆点跟随 + 可选拖尾外圈，隐藏系统光标）                                                          |
| Background      | 装饰背景（gradient/grid/dots/noise 四变体 + 光晕漂移动画，children 叠加）                                         |

### 反馈

| 组件                 | 说明                                                             |
| -------------------- | ---------------------------------------------------------------- |
| Modal                | 模态弹窗（fade+scale 转场、backdrop blur）                       |
| Drawer               | 抽屉弹窗（4 方向 + 景深效果 + portal）                           |
| Popover              | 气泡卡片（受控 open、翻转、Esc/外点关闭）                         |
| AlertDialog          | 警惕对话框（焦点陷阱、初始聚焦、loading/danger）                  |
| Command              | 命令面板（Ctrl/Cmd+K、分组、键盘导航）                            |
| LinkPreview          | 链接预览（延迟悬停、翻转）                                        |
| Tooltip              | 气泡提示（12 方向 + 自动翻转 + hover/focus/click 触发）          |
| NotificationProvider | 通知容器（App 顶层挂载一次，配合 Notification API 使用）          |
| NotificationItem     | 单条通知（由 NotificationProvider 内部渲染）                      |
| ErrorDialog          | 错误弹窗（配合 pushError 使用）                                   |
| ConfirmDialog        | 确认框容器（App 顶层挂载一次，配合 showConfirm 使用）             |
| Loading              | 加载指示器（spinner 或自定义图片，size 可调）                     |
| Empty                | 空状态（图标 + 主文案 + 副提示 + 可选操作区，居中排布）           |

### 其他

| 组件       | 说明                                                          |
| ---------- | ------------------------------------------------------------- |
| TitleBar   | Wails3 自绘标题栏                                             |
| ThemeToggle | 主题切换按钮（Sun/Moon 图标、圆形扩散动画、localStorage 持久化） |
| ContextMenu | 右键菜单（全局注册机制）                                     |

## 新项目接入

应用外壳用 `Layout`（标题栏 + 侧边栏 + 内容卡片三区一体，开箱即用）：

```svelte
<script lang="ts">
  import { Layout, Sidebar, themeStore, toggleThemeFromEvent } from "goose-ui";
</script>

<Layout
  title="我的应用"
  subtitle="副标题"
  theme={themeStore.theme}
  onThemeToggle={toggleThemeFromEvent}
  resize
>
  {#snippet tabs()}
    <Sidebar
      groups={groups}
      activeTab={active}
      onchange={(v) => (active = v)}
      mode="float"
      embedded
      shadow={false}
    />
  {/snippet}

  <Page title="页面">…</Page>
</Layout>
```

- 层级：`Layout`（窗口背景色；标题栏透明 → 与窗口同色）→ 42px 标题栏 + body 左 `tabs` 侧栏槽 / 右内容卡片（边框圆角；空隙经 `--page-pad: 20px 24px` 由 `Page` 承担，外壳自身 padding 为 0）
- `resize`：Wails 窗口（四角手柄 + 全域拖拽调整），浏览器省略
- `windowControls={false}`：隐藏默认窗口三键（浏览器环境）；`controls` snippet 可在键区附加自定义按钮
- `scroll`（默认 `true`）：内容卡片整页滚；`false` = 框架不滚、页内滚动区自理

页面结构用 `Page`，不要再手写「根 div + 页头 + padding/gap」样板：

```svelte
<script lang="ts">
  import { Page, Row, Empty, Card, Button } from "goose-ui";
</script>

<Page title="防火墙" description="浏览 Windows 防火墙规则" scroll>
  {#snippet right()}
    <Button variant="primary">刷新</Button>
  {/snippet}

  <Row gap="md">
    <Card>…</Card>
  </Row>

  <Empty title="暂无规则" />
</Page>
```

### 间距变量（外壳与页面通过变量沟通，零耦合）

| 变量               | 作用                                                                                                                          | 默认            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `--page-pad`       | `Page` 内边距——页面空隙的**唯一责任方**；裸壳默认 `16px`，`Layout` 内容区传 `20px 24px`，任何容器（含 absolute 覆盖）都不影响 | `16px`          |
| `--page-gap`       | 页头 ↔ 内容 ↔ 卡片的统一垂直节奏                                                                                              | `16px`          |
| `--ph-gap`         | 独立使用 `PageHeader` 时的下间距（`Page` 内自动为 `0`，交给 `--page-gap`）                                                    | `32px`          |
| `--layout-pad-x/y` | `--page-pad` 在 `Layout` 内的镜像（`Header` 吸顶用它反向贴满内缘）                                                            | `24px` / `20px` |

- 自绘外壳（非 `Layout`）若自带内容区 padding，在外壳上写 `--page-pad: 0` 归零即可
- `Page` 默认 body 不滚（`scroll` 关闭）：局部滚动区由页面内部处理；整页滚动给 `Page` 加 `scroll`

### 页面切换过渡（方向感知，Page 统一处理）

`Page` 自带进入/离开过渡（`fly`：220ms · cubicOut · 24px · 淡入淡出），方向由 `Sidebar` 按导航项顺序自动计算：**向上切换** → 新页从上方进入、旧页向下离开；向下切换镜像。离开期间旧页自动 pin 成 absolute 让出文档流，新旧共存不堆叠、不产生滚动条跳动。

两种接法（动画核心同一套，按应用切换语义二选一）：

```svelte
<!-- 卸载式：外层 {#if}/{#key} 切换，挂载/卸载自动播放 -->
{#if activeTab === "a"}<PageA />{:else}<PageB />{/if}

<!-- keep-alive 式：页面常驻不卸载，active 控制显隐 + 动画（状态保留） -->
<Page active={tab === "a"}>…</Page>
```

- 首屏渲染不播 intro；嵌套 `Page`（如预览框内）加 `transition={false}` 关闭，避免双重动画
- 无 `Sidebar` 的程序化切换沿用上次方向；也可直接写 `pageDirStore.dir`（导出 `'up' | 'down'`）指定

### 组件控制面（三层原则，即插即用）

每个组件最多通过三个位置控制，**不要用 `:global` 覆盖组件内部类**：

| 层 | 用途 | 示例 |
| --- | --- | --- |
| **props** | 语义化外观/尺寸 | `variant` `size` `width` `spin` |
| **`class` + `style`** | 全组件统一透传到根元素；外部布局（flex/width/margin）一律走 `style="…"` | `<Button style="width:100%">` |
| **CSS 变量** | 单组件或全主题微调（覆盖 `:root` 或祖先变量） | `--page-pad` `--sidebar-w` `--titlebar-h` |

高频控制点：

- **宽度**：`Select`/`Modal`/`Drawer` 有 `width` prop；`Page`/`Tooltip` 有 `maxWidth`；`Sidebar` 用 `width={180}`（number 按 px，改写内部 `--sidebar-w`）；其余控件用 `style`
- **尺寸档**：`Button`/`Checkbox`/`Toggle`/`Tabs` 的 `size` 为枚举档；`Button` 额外支持 `size={40}`（number = 任意高度）；`Icon`/`Loading` 的 `size` 为任意数值（px，默认 20 / 30）
- **旋转**：`Icon` 的 `spin` prop（加载态），无需自己写动画
- **可调变量**：`--titlebar-h`（TitleBar 高度，默认 42px）、`--header-h`（Header 高度，由 `height` prop 写入）、`--ui-{sm,md,lg}-{height,padding,font}`（全局控件 token，见 theme.css）

## Sidebar 用法

### 导航分组

```svelte
<script lang="ts">
  import { Sidebar, type SidebarTabGroup } from "goose-ui";
  import Wrench from "@lucide/svelte/icons/wrench";

  const groups: SidebarTabGroup[] = [
    {
      title: "工具",
      icon: Wrench,
      items: [{ value: "port", label: "端口扫描", icon: Wrench }],
    },
  ];
</script>

<Sidebar {groups} bind:activeTab mode="float" />
```

- `mode`：`float`（悬浮岛，默认）/ `flat`（贴边）；`collapsed` 可 `bind:` 双向绑定
- 组件自带 pill 指示器：切换/折叠/展开分组时自动测量并平滑移动
- 分组标题滚动时**吸附顶部**（被下一个组头推走）；分组与顶层项字号（14px）、图标文字间距（10px）、左缘对齐一致

### 顶层项 —— 与分组同级穿插

`groups` 数组中可直接放入普通导航项（无 `items` 的条目），与分组任意穿插，渲染为无组头的顶层项：

```svelte
<script lang="ts">
  import { Sidebar, type SidebarEntry } from "goose-ui";
  import House from "@lucide/svelte/icons/house";

  const groups: SidebarEntry[] = [
    { value: "home", label: "首页", icon: House }, // 顶层项，排在分组之间任意位置
    { title: "工具", items: [{ value: "port", label: "端口扫描" }] },
  ];
</script>

<Sidebar {groups} bind:activeTab />
```

- 展开态：与**分组标题左缘对齐**（同为 1 级），共享同一 pill；折叠态：渲染为图标按钮，**点击直接切换**（区别于分组的 hover popover）

### endItems —— 列表结尾固定项

渲染在导航列表**末尾**，不新增额外 footer 层级：空间充足时贴底，列表超高时顺次接在末尾；与普通导航项**共享同一 pill**（切换时 pill 连续滑入而非淡出淡入）；左缘与分组标题对齐（1 级）；侧栏折叠时隐藏。

```svelte
<Sidebar
  {groups}
  bind:activeTab
  endItems={[{ value: "settings", label: "设置", icon: SettingsIcon }]}
/>
```

- 项结构与普通导航项一致（`{ value, label, icon? }`），参与 `activeTab` / `onchange`
- 与 `footer` 插槽可同时使用：`endItems` 在列表内，`footer` 在侧栏底部

### footer 插槽 —— 自定义底部区域

`footer` 是 snippet，内容完全由项目自定义（A 文本、B 按钮随项目放什么）：

```svelte
<Sidebar {groups} bind:activeTab>
  {#snippet footer()}
    <div class="sidebar-footer-inner">
      <span class="footer-version">v0.1.0 · Svelte 5</span>
      <ThemeToggle />
    </div>
  {/snippet}
</Sidebar>

<style>
  .sidebar-footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .footer-version {
    font-size: 11px;
    color: var(--text-muted);
  }
</style>
```

- 底部自带分隔线（`border-top`），仅在展开时显示
- 按钮也可换成图标按钮（如状态图标：盾牌 → 旋转 → 勾），结构不变

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
- 通知宽度固定为 360px，可通过 `--notif-width` 变量覆盖；`max-width: calc(100vw - 48px)` 视口护栏仍生效
- 错误消息提取可用 `errorToString(e)`：字符串原样返回，取 `message` 字段（兼容 `Error` 与序列化对象），否则 `String(e)`

```ts
import { Notification, errorToString } from "goose-ui";

Notification.error(`加载失败: ${errorToString(err)}`);
```

### 确认框 API

```ts
import { showConfirm, ConfirmDialog } from "goose-ui";

const ok = await showConfirm("确定要删除吗？", {
  confirmText: "删除",
  danger: true,
}); // Promise<boolean>：确认 true，取消/关闭 false
```

- 选项：`title`（默认 `'确认'`）、`confirmText`（`'确定'`）、`cancelText`（`'取消'`）、`danger`（确认按钮危险色）
- 需在应用顶层挂载一次 `<ConfirmDialog />`；弹窗内按 `Enter` 等同点击确认

### 错误弹窗 API

```ts
import { pushError, errorStore } from "goose-ui";

pushError("网络请求失败", new Error("Failed to fetch"));
```

需配合顶层挂载 `<ErrorDialog />`，通过 `errorStore` 读取错误列表（`pushError(kind, err)`）。

### 主题 API

```ts
import { themeStore, setTheme, toggleTheme, toggleThemeFromEvent, initTheme } from "goose-ui";

themeStore.theme; // 'light' | 'dark'，响应式，多实例共享
setTheme("dark"); // 显式设置并持久化
toggleTheme(); // 切换（传 { x, y } 时启用圆形扩散转场）
toggleThemeFromEvent; // 主题按钮回调：以按钮中心为圆心圆形扩散，直接作 onThemeToggle 传入
initTheme(); // 幂等：应用持久化/系统偏好（ThemeToggle 挂载时自动调用）
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

暗色主题通过 `.dark` 或 `[data-theme="dark"]` 类名切换；子树内用 `.light` 类可局部恢复浅色 token（与 `.dark` 对称）。

### 工具类（theme.css 全局提供）

| 类                  | 作用                     | 动画                                                                     |
| ------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `.animate-fade-slide`  | 淡入上滑一次（入场强调） | `fadeSlideUp` 0.3s ease-in-out（opacity 0→1 + translateY 10px→0）      |
| `.animate-nav-slide`   | 下滑入场一次             | `navSlideDown` 0.5s ease-out（translateY -100%→0）                     |
| `.animate-float-doro`  | 悬浮轻浮动循环           | `float-doro` 2.5s infinite（±4px，自带 `will-change: transform`）      |
| `.skeleton-shine`      | 骨架屏横向光扫           | 渐变光带 `background-position` 200%→-200%，2s 线性循环                  |
| `.status-dot-online`   | 在线状态圆点（绿 + 光晕） | `pulse` 2s 呼吸（opacity 1↔0.5）                                       |
| `.status-dot-offline`  | 离线状态圆点（红）       | 无动画                                                                   |

- 直接挂在任意元素上即可，无前置条件
- `.animate-*` 为一次性动画：元素重新显示时（如 `display:none↔''` 切换）会从头重播；页面级入场请交给 `Page` 过渡统一处理，勿在卡片上叠加

## Peer Dependencies

| 包                                | 必需 | 说明                              |
| --------------------------------- | ---- | --------------------------------- |
| `svelte` ^5.0.0                   | ✅   | 框架                              |
| `@lucide/svelte` >=1.43.0         | 可选 | 图标库（Icon 组件及内置图标依赖） |
| `@wailsio/runtime` >=3.0.0-beta.0 | 可选 | 仅 TitleBar / Layout 组件需要     |

> `clsx` 作为 dependencies 随包自动安装，无需手动引入。

## License

MIT

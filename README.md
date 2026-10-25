# goose-ui

零 CSS 框架依赖的 Svelte 5 纯 CSS 组件库，支持 Wails3 桌面应用开发。

## 特性

- **零 CSS 框架** — 不依赖 Tailwind 之类的任何样式框架；`dependencies` 为空，运行时只有图标库 `@lucide/svelte` 一个 peer 依赖（必装）
- **纯 CSS** — 所有组件使用 scoped `<style>` + CSS 自定义属性，主题集中在 `theme.css` 一个文件
- **Svelte 5 Runes** — 全面使用 `$props()`、`$state`、`$derived`、`$effect`
- **规模** — `src/lib/components/ui` 下 86 个单文件组件（含少量内部件），另有主题 / 通知 / 错误 / 右键菜单等模块
- **Tree-shakeable** — 支持按需导入（`import { Button } from "goose-ui"` 或 `goose-ui/button`），未使用的组件不会打包
- **主题** — light/dark 切换 + 色相旋钮（`setHue` / `setHues`）：只调 accent / danger / success 等 6 个色相，明暗与彩度由主题派生
- **可访问性** — 弹层带焦点陷阱与 `aria-modal`，多层叠加时 Esc 只关最上层；表单控件保留原生 `input`，键盘可完成全部操作
- **质量门槛** — `svelte-check --fail-on-warnings`（0 错误 0 警告）+ `node --test` 单测，CI 在构建前强制执行

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
npm install goose-ui @lucide/svelte
```

或使用 pnpm：

```bash
pnpm add goose-ui @lucide/svelte
```

> `@lucide/svelte` 是 **peer 依赖且必装**：十几个组件（Button / Modal / Select …）
> 在模块顶层直接引用了它的图标，barrel import 会把它们一起拉进来，缺了它构建会直接报
> `Cannot find package '@lucide/svelte'`。

### 接入注意（Vite）

本包以 **源码形态** 发布（`exports` 直指 `src/lib` 下的 `.ts` / `.svelte`），
Vite 需要放弃对这些文件做依赖预打包，否则 `.svelte` 会被当成普通 JS 处理：

```ts
// vite.config.ts
export default defineConfig({
  plugins: [svelte()],
  optimizeDeps: { exclude: ['goose-ui'] },
});
```

### 接入注意（深色首屏）

`theme.css` 默认是亮色，深色用户会先看到一帧白再切黑。在 `index.html` 的 `<head>` 里、
业务 JS 之前补一小段（键名与 `themeStore` 的存储键一致）：

```html
<script>
  try {
    var t = localStorage.getItem('goose-ui-theme');
    if (t !== 'dark' && t !== 'light') {
      t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (t === 'dark') document.documentElement.classList.add('dark');
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
- 想看每个组件的真实效果与可复制源码，直接跑 demo（见上）——每个用法都带「效果 / 源码」切换与一键复制

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

| 上游常见叫法 | goose-ui 名 | 说明                                        |
| ------------ | ----------- | ------------------------------------------- |
| Dialog       | Modal       | 模态弹窗                                    |
| Switch       | Toggle      | iOS 风格开关                                |
| Tabs         | Tabs        | 标签页（分段/下划线/垂直 + TabsPanel 面板） |
| Toggle Group | ToggleGroup | 单选/多选切换组                             |

### 基础组件

| 组件        | 说明                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| Button      | 按钮，支持 primary/default/ghost/danger/link 五种变体                       |
| Card        | 卡片容器，支持 title + right header                                         |
| Label       | 表单标签                                                                    |
| StatusBadge | 状态徽章                                                                    |
| Icon        | 图标包装器（传入 `@lucide/svelte` 图标组件，支持 size/class/spin 旋转动画） |
| Separator   | 分割线，横/竖/虚线/文字分隔                                                 |
| AspectRatio | 等比容器，按比例裁剪内容                                                    |
| Avatar      | 头像（首字母回退 + 状态点 + size/shape）                                    |
| ScrollArea  | 滚动区（自定义滚动条、role=region）                                         |
| Row         | 水平排列行（`gap` sm/md/lg + `align` + 自动换行）                           |
| Tag         | 标签（6 变体 × 3 尺寸 + 圆点 + 可关闭）                                     |
| Skeleton    | 骨架屏（text/circle/rect + 多行 + shimmer 动画）                            |
| Image       | 图片（懒加载 + 失败兜底 + 点击放大预览）                                    |
| Footer      | 页脚（左右插槽 + 链接列表 + 版权行 + 吸底）                                 |
| CodeBlock   | 代码块（语言标签 + 一键复制 + 注释/字符串/关键字轻量高亮）                  |

### 表单输入

| 组件            | 说明                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Input           | 输入框，clearable/Enter 回调/digitsOnly/status，prefix/suffix 为 snippet                                                                          |
| Select          | 下拉选择，支持键盘导航、meta 标签、分组吸顶（组头），无滚动条+两侧箭头滚动区；combobox/listbox ARIA 关联（aria-controls / aria-activedescendant） |
| MultiSelect     | 多选下拉，支持 badge 标签与分组吸顶（组头）、Escape/方向键/Enter 键盘操作                                                                         |
| CreatableSelect | 可新建搜索选择器，支持静态/异步数据源；搜索框 role=combobox，选项列表 role=listbox                                                                |
| Checkbox        | 复选框，尺寸档 small/middle/large + 双向绑定 + 半选态（indeterminate）                                                                            |
| Radio           | 单个单选项（一般直接用下面的 RadioGroup，单独用时需自管选中态）                                                                                    |
| RadioGroup      | 单选组（pill 分段轨道，context 注入）                                                                                                             |
| Toggle          | iOS 风格开关，带弹性动画                                                                                                                          |
| ToggleGroup     | 单选/多选切换组，default/outline 变体                                                                                                             |
| Slider          | 滑块（pointer 捕获拖拽 + 键盘）                                                                                                                   |
| Combobox        | 组合框（输入过滤 + 分组吸顶 + role=combobox/listbox/option 键盘导航）                                                                             |
| Rating          | 评分（半星/只读/键盘 slider 语义）                                                                                                                |
| PINInput        | 验证码输入（跳格/粘贴/退格回跳，`group`+`separator` 分组）                                                                                        |
| Textarea        | 多行文本域，rows/status/maxlength + resize: vertical                                                                                              |
| DropZone        | 拖拽上传区                                                                                                                                        |
| Form / FormItem | 表单容器与表单项（context 传递 layout/labelWidth，必填星号 + 错误态）                                                                             |
| TimePicker      | 时间选择器（时/分(/秒) 惯性滚轮 Wheel，拖拽+吸附+停稳提交，「现在」快捷）                                                                         |

### 日期与时间

| 组件            | 说明                                                                                 |
| --------------- | ------------------------------------------------------------------------------------ |
| DateField       | 日期分段字段（`YYYY-MM-DD`，分段自动跳格/粘贴跨段）                                  |
| TimeField       | 时间分段字段（`HH:mm[:ss]`，`seconds` 可选段）                                       |
| DateRangeField  | 日期范围分段字段（start/end 双向绑定）                                               |
| TimeRangeField  | 时间范围分段字段                                                                     |
| Calendar        | 日历网格（月导航、min/max、disabledDate、方向键/PgUp/PgDn）                          |
| RangeCalendar   | 范围日历（先起点后终点，悬停预览，清除；方向键移动光标、Enter 提交、PgUp/PgDn 翻月） |
| DatePicker      | 日期选择器（触发器 + 浮层 Calendar，自动翻转、清除）                                 |
| DateRangePicker | 范围选择器（触发器 + 浮层 RangeCalendar）                                            |

> 日期/时间选择器的清除按钮为独立 `<button>`（可 Tab 聚焦 + Enter/Space 触发），由绝对定位叠在触发器图标位。

### 数据展示

| 组件            | 说明                                                                                                                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DataTable       | 数据表格，支持排序、高亮、右键菜单、按占比 + 最小/最大约束分配列宽；表头圆角 + 吸顶，行 hover 为滑动 pill                                                                                                                                |
| DataList        | 数据列表，带空状态与可选的内置 header（直接复用 `Header` 组件：`title`/`header`/`headerCenter`/`headerRight`/`headerClass`/`headerStyle`/`headerSticky` 原样透传；内置 header 默认高 **64px**，传 `headerStyle="--header-h:56px"` 覆盖；`dataTableHeader` 用于独立成块时补齐内边距）；行 hover 同样走滑动 pill |
| Tabs            | 标签页（分段/下划线/垂直模式 + 键盘导航）                                                                                                                                                                                                |
| TabsPanel       | 标签页内容面板（value 匹配选中项时渲染）                                                                                                                                                                                                 |
| PillTrack       | 滑动高亮原语（选中 pill + hover pill，MutationObserver 自动跟随选中）。Sidebar / Tabs / DataTable / DataList 的 hover 高亮带都由它绘制                                                                                                   |
| Pagination      | 分页（siblingCount 省略号折叠）                                                                                                                                                                                                          |
| Collapsible     | 折叠面板（grid-rows 0fr→1fr 过渡）                                                                                                                                                                                                       |
| Accordion       | 手风琴（单开/多开/collapsible，复用 Collapsible）                                                                                                                                                                                        |
| ProgressBar     | 渐变进度条                                                                                                                                                                                                                               |
| ProgressBytes   | 上传进度（字节/速度/ETA）                                                                                                                                                                                                                |
| ProgressSlotBar | 分片上传进度                                                                                                                                                                                                                             |
| UsageBar        | 用量/限额进度条                                                                                                                                                                                                                          |
| Meter           | 度量条（threshold 转高亮 / critical 转危险色，role=progressbar）                                                                                                                                                                         |
| Typewriter      | 打字机效果，支持逐字文本或淡入 Snippet                                                                                                                                                                                                   |
| Carousel        | 轮播图（手动/自动播放、悬停暂停、首尾循环）                                                                                                                                                                                              |
| Time            | 实时时钟（time/date/datetime + 12h 制）                                                                                                                                                                                                  |
| Countdown       | 倒计时（duration/target 双模式 + 暂停 + 归零回调）                                                                                                                                                                                       |

### 导航与布局

| 组件           | 说明                                                                                 |
| -------------- | ------------------------------------------------------------------------------------ |
| PageHeader     | 页面标题栏（标题 + 描述 + children 附加行 + 右侧操作区，窄屏自动换行）               |
| Page           | 页面容器（根布局 + 页头 + 内容区间距一次到位）                                       |
| Sidebar        | 悬浮岛式侧边栏（导航分组 + 顶层项穿插 + 折叠 + popover + endItems/footer）           |
| Header         | 固定顶部导航栏（标题 + 操作区 + 自定义插槽）                                         |
| NavigationMenu | 导航菜单（面板定位/翻转，链接 + 描述）                                               |
| Menubar        | 菜单栏（横向方向键：焦点在触发器间 roving，已展开时自动切换菜单；复用 DropdownMenu） |
| DropdownMenu   | 下拉菜单（flip 测量、键盘导航；`disabled` prop 可禁用触发器）                        |
| Toolbar        | 工具栏（role=toolbar + roving 方向键）                                               |
| Layout         | 应用外壳纯布局（顶栏 / 可选侧栏 / 内容区插槽，不内置组件，自行组合 TitleBar、Sidebar 或 Drawer） |
| BackTop        | 返回顶部（超过阈值淡入 + easeOutCubic 平滑回顶）                                     |
| Cursor         | 自定义光标（区域内圆点跟随 + 可选拖尾外圈，隐藏系统光标）                            |
| Background     | 装饰背景（gradient/grid/dots/noise 四变体 + 光晕漂移动画，children 叠加）            |

### 反馈

| 组件                 | 说明                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------- |
| Modal                | 模态弹窗（fade+scale 转场、backdrop blur）                                            |
| Drawer               | 抽屉弹窗（4 方向 + 景深 + 可拖动吸附尺寸 / 拖到底关闭 + portal）                     |
| Popover              | 气泡卡片（受控 open、翻转、Esc/外点关闭；placement 支持 bottom/top × start/end 对齐） |
| AlertDialog          | 警惕对话框（焦点陷阱、初始聚焦、loading/danger）                                      |
| Command              | 命令面板（Ctrl/Cmd+K、分组、键盘导航）                                                |
| LinkPreview          | 链接预览（延迟悬停、翻转、卡片水平居中于锚点）                                        |
| Tooltip              | 气泡提示（12 方向 + 自动翻转 + hover/focus/click 触发）                               |
| NotificationProvider | 通知容器；`store` prop 决定渲染哪份 store（默认全局单例，可传独立实例）               |
| NotificationItem     | 单条通知（由 NotificationProvider 内部渲染）                                          |
| ErrorDialog          | 错误弹窗（配合 pushError 使用）                                                       |
| ConfirmDialog        | 确认框容器（App 顶层挂载一次，配合 showConfirm 使用）                                 |
| Loading              | 加载指示器（spinner 或自定义图片，size 可调）                                         |
| Empty                | 空状态（图标 + 主文案 + 副提示 + 可选操作区，居中排布）                               |

### 其他

| 组件        | 说明                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| TitleBar    | 自绘标题栏（窗口控制经 `windowApi` 注入，库不依赖桌面 runtime；`searchable` 开内联搜索，见「TitleBar 标题栏」；Wails3 见 demo TitleBar 页） |
| ThemeToggle | 主题切换按钮（Sun/Moon 图标、圆形扩散动画、localStorage 持久化）                                                                            |
| ContextMenu | 右键菜单（全局注册机制）                                                                                                                    |

## 新项目接入

应用外壳用 `Layout`（纯布局：顶栏 / 可选侧栏 / 内容卡片，组件由你组合）：

```svelte
<script lang="ts">
  import { Layout, TitleBar, Sidebar, Page, themeStore, toggleThemeFromEvent } from "goose-ui";
</script>

<Layout resize>
  {#snippet titlebar()}
    <TitleBar
      title="我的应用"
      subtitle="副标题"
      theme={themeStore.theme}
      onThemeToggle={toggleThemeFromEvent}
    />
  {/snippet}
  {#snippet aside()}
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

- 层级：`Layout`（窗口背景色；标题栏透明 → 与窗口同色）→ 42px 标题栏 + body 左 `aside` 侧栏槽 / 右内容卡片（边框圆角；空隙经 `--page-pad: 20px 24px` 由 `Page` 承担，外壳自身 padding 为 0）
- `titlebar` / `aside` 都是可选插槽：不传 `aside` 时内容区占满整宽，导航可改用 `Drawer`
- `resize`：Wails 窗口（四角手柄 + 全域拖拽调整），浏览器省略
- `windowControls={false}`：写在 `TitleBar` 上，隐藏默认窗口三键（浏览器环境）；`controls` snippet 可在键区附加自定义按钮
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
| `--page-pad`       | `Page` 内边距——页面空隙的**唯一责任方**；裸壳默认 `16px`，`Layout` 内容区传 `20px 24px`，任何容器（含 absolute 覆盖）都不影响。**上下两半会被 `padding-block: 0` 清零，实际只有左右生效** | `16px`          |
| `--page-gap`       | 页头 ↔ 内容 ↔ 卡片的统一垂直节奏                                                                                              | `16px`          |
| `--ph-gap`         | 独立使用 `PageHeader` 时的下间距（`Page` 内自动为 `0`，交给 `--page-gap`）                                                    | `32px`          |
| `--layout-pad-x/y` | `--page-pad` 在 `Layout` 内的镜像（`Header` 吸顶用它反向贴满内缘）。`y` 必须与 `Page` 的清零保持一致（`0px`），否则 Header 的负 margin 会把吸顶条拽出滚动口 | `24px` / `0px`  |

- 自绘外壳（非 `Layout`）若自带内容区 padding，在外壳上写 `--page-pad: 0` 归零即可
- `Page` 默认 body 不滚（`scroll` 关闭）：局部滚动区由页面内部处理；整页滚动给 `Page` 加 `scroll`

### 页内目录（`Page` 的 `toc`）

内容较长的页面加 `toc`，`Page` 会在右侧生成目录列并自动摘取页面里的
`h2[id]` / `h3[id]` 作条目：

```svelte
<Page title="防火墙" toc>
  <h2 id="rules">规则列表</h2>
  …
  <h2 id="props">Props</h2>
  …
</Page>
```

- 只认**带 `id`** 的 `h2`/`h3`：没有 id 的标题会被跳过（`href="#undefined"` 会把页面弹回顶部），所以写标题时顺手给 id
- `h3` 会作为上一级 `h2` 的子项缩进显示；`[data-toc-skip]` 内的标题不收录
- 滚动高亮按「标题顶边越过页头下沿」判定，纯 `IntersectionObserver` 无法表达「正在读哪一节」
- 跳转用 `scrollIntoView` 而非改 hash（很多应用用 hash 路由，改 hash 会顶掉当前页签）；锚点让位由 `scroll-margin-top: var(--toc-anchor)` 统一处理
- 目录列宽 `--toc-width`（默认 `220px`）、最大高度 `--toc-max-h`、每级缩进 `--toc-indent`
- 宽度 ≥ 1100px 时才显示目录列，窄屏自动隐藏

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

| 层                    | 用途                                                                    | 示例                                      |
| --------------------- | ----------------------------------------------------------------------- | ----------------------------------------- |
| **props**             | 语义化外观/尺寸                                                         | `variant` `size` `width` `spin`           |
| **`class` + `style`** | 全组件统一透传到根元素；外部布局（flex/width/margin）一律走 `style="…"` | `<Button style="width:100%">`             |
| **CSS 变量**          | 单组件或全主题微调（覆盖 `:root` 或祖先变量）                           | `--page-pad` `--sidebar-w` `--titlebar-h` |

高频控制点：

- **宽度**：`Select`/`Modal`/`Drawer` 有 `width` prop；`Page`/`Tooltip` 有 `maxWidth`；`Sidebar` 用 `width={180}`（number 按 px，改写内部 `--sidebar-w`）；其余控件用 `style`
- **尺寸档**：`Button`/`Checkbox`/`Toggle`/`Tabs` 的 `size` 为枚举档；`Button` 额外支持 `size={40}`（number = 任意高度）；`Icon`/`Loading` 的 `size` 为任意数值（px，默认 20 / 30）
- **旋转**：`Icon` 的 `spin` prop（加载态），无需自己写动画
- **可调变量**：`--titlebar-h`（TitleBar 高度，默认 42px）、`--header-h`（Header 高度，由 `height` prop 写入）、`--ui-{sm,md,lg}-{height,padding,font}`（全局控件 token，见 theme.css）

## TitleBar 标题栏

自绘标题栏。窗口控制经 `windowApi` 注入（包一层 `@wailsio/runtime` 的 `Window` 即可），**库本身不依赖任何桌面 runtime**，因此浏览器里也能完整渲染与调试。

### 内联搜索

传 `searchable` 即在标题栏中段开启搜索框，输入即出下拉：

```svelte
<script lang="ts">
  import { TitleBar, Notification, type WindowController, type TitleBarSearchItem } from "goose-ui";

  const items: TitleBarSearchItem[] = [
    { value: "new-file", label: "新建文件", group: "文件", keywords: "new create 创建" },
    { value: "save-all", label: "全部保存", group: "文件", keywords: "save 写入" },
    { value: "recent", label: "最近打开", group: "文件", disabled: true },
    { value: "toggle-theme", label: "切换主题", group: "视图", keywords: "theme dark light 深色" },
  ];

  const windowApi: WindowController = { /* Wails3: 包一层 runtime Window */ };
</script>

<TitleBar
  title="我的应用"
  {windowApi}
  searchable
  {searchItems}
  searchPlaceholder="搜索命令…"
  onSearchSelect={(item) => Notification.success(`选中：${item.label}`)}
/>
```

- `TitleBarSearchItem`：`{ value, label, group?, keywords?, disabled? }`。`group` 相同的项在下拉里归为一节；`disabled` 项不可选中、也不参与过滤
- `keywords` 参与过滤但不显示——中文标签配英文关键词（如 `缩放` ↔ `zoom`）很实用
- 键盘：`↑`/`↓` 移动、`Enter` 选中、`Esc` 关闭；选中后自动收起下拉并清空输入，再触发 `onSearchSelect`
- `searchEmptyText` 自定义无匹配时的提示；下拉宽度固定 280px，不跟输入框走（否则长 `label` 会被压窄）

### 搜索框宽度（自适应，上限 40%）

标题栏是三段布局：**左 logo / 中搜索 / 右窗口键**。左、右是刚体（`flex: 0 0 auto`），**搜索段是唯一的弹性段**（`flex: 1 1 0`）：标题栏的剩余空间全部归搜索框，窗口变窄它跟着收窄，全程不挤压 logo 与窗口三键。

宽度上限是**标题栏可用空间的 40%**（`max-width: 40cqw`）。宽窗口下搜索框就停在这条线上——否则超宽屏上它会摊到 800px 以上、把标题栏的视觉重心压垮；窄窗口下它不受这条上限约束，继续随空间收窄。

**没有任何 prop 可以调这个宽度**，因为按像素配置的 min/max 在某个窗口尺寸下总会变成「既不够用、又不肯让位」的负担。比例上限则不会：它天然跟着标题栏一起缩放。

不让搜索框挤到邻居，靠的是这三条：

- 两侧 12px `gap` 保持不变，搜索框与 logo / 窗口键**永不重叠**
- 窗口键区恒为刚体（`flex: 0 0 auto`），任何宽度下都不被压缩
- 标题栏窄于 450px 时（此时 40% 已不足 180px，放不下有意义的查询词）**整个搜索框隐藏**，而不是裁出一条无边框的窄缝

> 实现要点：
>
> - `padding`(8px×2) 与 `border`(1px×2) 共 18px 是**不可压缩**的，仅靠 flex 收缩无法把搜索框真正收到 0，所以「收到 0」必须由 `@container` 显式隐藏来完成（`container-type: inline-size` 加在 `.titlebar-search-wrap` 上）
> - `flex-basis` 必须写 `0` 而非 `auto`：`auto` 会以输入框的固有宽度为基准，`min-width: 0` 也就一并失效
> - **不要用 `min-width: min(--x, 100%)` 这类写法**——`min-width` 里的百分比按包含块宽度解析而非 flex line 剩余空间，窄窗口下会失效并让搜索框溢出压住两侧
> - `40cqw` 里的 `cqw` **只能参照 `.titlebar`**，不能把 `.titlebar-search-wrap` 自己声明成容器来用：`cqw` 取的是「最近的祖先容器」宽度，自引用会让 `max-width: 40cqw` 变成「wrap 宽度的 40%」而永远填满不了，比例彻底失效。这也是 `container-type: inline-size` 留在 wrap 上、而 `@container` 查询却写 `titlebar` 名字的原因

> 实测（headless Chrome，1920px → 340px）：宽窗口下搜索框稳定占 39.1%–39.6%，`gap` 恒 12px，窗口键恒 138px，**全程零重叠、零溢出**。

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

  let activeTab = $state("port");
</script>

<Sidebar {groups} bind:activeTab mode="float" />
```

- `mode`：`float`（悬浮岛，默认）/ `flat`（贴边）；`collapsed` 可 `bind:` 双向绑定
- 组件自带 pill 指示器：切换/折叠/展开分组时自动测量并平滑移动
- 分组标题滚动时**吸附顶部**（被下一个组头推走）；分组与顶层项字号（14px）、图标文字间距（10px）、左缘对齐一致
- 外部导航（链接跳转、前进后退、深链改写 `activeTab`）会**自动展开**目标项所在分组并将其滚入视野；手动收起的分组不会被当前项弹开，仅在 `activeTab` 真的变化时才展开。折叠态下跳转则记入展开意图，侧栏再展开时还原

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

  let activeTab = $state("home");
</script>

<Sidebar {groups} bind:activeTab />
```

- 展开态：与**分组标题左缘对齐**（同为 1 级），共享同一 pill；折叠态：渲染为图标按钮，**点击直接切换**（区别于分组的 hover popover）

### endItems —— 列表结尾固定项

渲染在导航列表**末尾**，不新增额外 footer 层级：空间充足时贴底，列表超高时顺次接在末尾；展开态与普通导航项**共享同一 pill**（切换时 pill 连续滑入而非淡出淡入）；左缘与分组标题对齐（1 级）。侧栏折叠时**渲染为图标按钮并同样贴底**（与分组图标同级、同 `title` 悬浮提示、可点击切换）。

> 滚动条：导航区用 `overflow-y: auto`（非 `scroll`），因此**折叠态下 8 个图标不溢出时不会绘制滚动条、也不预留槽位**；展开态列表超高时才出现滚动条。若改用 `overflow-y: scroll` + `scrollbar-gutter: stable`，折叠态会在 56px 宽的侧栏里常驻一条滚动条并占掉 10px。

```svelte
<script lang="ts">
  import { Sidebar, type SidebarEntry } from "goose-ui";
  import SettingsIcon from "@lucide/svelte/icons/settings";

  const groups: SidebarEntry[] = [{ title: "工具", items: [{ value: "port", label: "端口扫描" }] }];
  let activeTab = $state("port");
</script>

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
<script lang="ts">
  import { Sidebar, ThemeToggle, type SidebarEntry } from "goose-ui";

  const groups: SidebarEntry[] = [{ title: "工具", items: [{ value: "port", label: "端口扫描" }] }];
  let activeTab = $state("port");
</script>

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
- `position`：`top-left` / `top` / `top-right` / `bottom-left` / `bottom` / `bottom-right`，默认 `bottom-right`
- 需先在应用顶层挂载 `<NotificationProvider />`
- 通知宽度固定为 360px，可通过 `--notif-width` 变量覆盖；`max-width: calc(100vw - 48px)` 视口护栏仍生效
- 错误消息提取可用 `errorToString(e)`：字符串原样返回，取 `message` 字段（兼容 `Error` 与序列化对象），否则 `String(e)`

```ts
import { Notification, errorToString } from "goose-ui";

Notification.error(`加载失败: ${errorToString(err)}`);
```

#### 多个互不干扰的通知容器

`Notification` 绑定在**全局单例 store** 上，所有不传 `store` 的 `<NotificationProvider />` 都渲染这一份（默认用法）。
若需要彼此独立的容器（例如主窗口与浮窗、或不同区域各管各的通知），用工厂显式建实例：

```svelte
<script lang="ts">
  import { NotificationProvider, createNotificationStore, createNotification } from "goose-ui";

  const storeA = createNotificationStore();
  const notifyA = createNotification(storeA);   // 快捷方法与 storeA 绑定
</script>

<NotificationProvider store={storeA} />
<button onclick={() => notifyA.success({ title: "只出现在 storeA" })}>发送</button>
```

- 两份 store 的通知列表、id 序列、暂停位完全独立；卸载其中一个不影响另一个
- `<NotificationProvider />` 的 props：`store`（渲染哪份 store）、`offset`（位置微调样式片段，
  多容器同挂载时用 `top:...px;left:...px;` 错开浮层）、`gap`、`visibleToasts`、`expand`、`hotkey`
- `Notification.xxx()` 不使用 Svelte context：`getContext()` 只能在组件初始化期调用，
  在事件处理器里会抛 `lifecycle_outside_component`，因此独立容器必须显式传 store

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
initTheme(); // 幂等：应用持久化/系统偏好 + 主题色（ThemeToggle 挂载时自动调用）
```

单独使用 `<ThemeToggle />` 无需任何配置：自动读取偏好、持久化、同步所有实例。

### 主题色 API

颜色本身是 **hex**：主题里每个角色都有一份可直接读改的默认值（亮/暗各一套），用户设置的颜色也以 hex 存。色相（`--hue-*`）只剩一个用途——给需要「取邻近色」的渐变/动画做偏移计算（如 TitleBar 品牌渐变），不参与任何颜色的默认值。

```ts
import { setColor, setColors, resetColors, getColors, colorStore, formatHex, normalizeHex, maxChroma, parseColor, DEFAULT_COLORS } from "goose-ui";

setColor("accent", "#1850ec"); // 单改，接受 #rgb / #rrggbb / oklch(...) / {l,c,h}
setColors({ accent: "#1850ec", info: "#3c82f6" }); // 批量
setColor("accent", null); // 清除自定义，回到主题默认
getColors(); // { accent: "#1850ec", ... }（只含被自定义的角色）
normalizeHex("#48f"); // "#4488ff"（非 hex 返回 null）
formatHex({ l: 0.6, c: 0.2, h: 264 }); // "#6a5fd8"
parseColor("#48f"); // { l, c, h }
maxChroma(0.6, 264); // 该明度/色相在 sRGB 内的彩度上限，约 0.2
DEFAULT_COLORS; // { accent: "#1850ec", ... } 六个角色的默认 hex
```

> 传进去的就是 hex 时会被**原样保留**，不经过 oklch 往返——否则 `#0ea5e9` 转一圈会掉成 `#0aa5e9`（浮点取整丢 1 bit）。只有 `oklch(...)` 串和 `{l,c,h}` 对象才需要折算。
>
> 自己做取色器时用得上 `maxChroma(l, h)`：超出 sRGB 的彩度在转 hex 时会被逐通道截断，存回去的 `c` 变小，滑条就会出现「拖到 100% 只剩 45%」的弹回。

- 颜色写入 `<html>` 内联样式（`--c-<角色>`），**全局生效**（含浮层、portal 出去的元素），并持久化到 `localStorage`
- 同时会自动派生并写入 `--c-<角色>-hover`（亮色压暗、暗色提亮）和 `--c-<角色>-text`（仅亮色，再压暗一档）——否则 `theme.css` 的回退链会让 hover 退化成基色、语义色文字掉对比度。切换亮暗主题时会按新主题重算这两档
- 六个角色（顺序即列表顺序）：`accent`（主色）/ `complement`（互补色），以及五个信息色 `success`（完成）/ `info`（信息）/ `warning`（警告）/ `danger`（危险）
- **纯 CSS 也能配**，无需任何 JS——直接覆盖角色变量：

```css
:root {
  --accent: #1850ec; /* 主色 */
  --complement: #009145; /* 互补色 */
  --success: #1ec55f; /* 完成 */
  --info: #3c82f6; /* 信息 */
  --warning: #f59e0a; /* 警告 */
  --danger: #dc2627; /* 危险 */
}
```

- 只想改**色相**（让依赖色相偏移的渐变/动画跟着走）时仍可用 `setHue(role, hue)` / `--hue-<角色>`；它不影响上面的 hex 默认值。
- 默认值常量：`DEFAULT_COLORS`（六个角色的亮色默认 hex），可直接读来展示或做「是否已改动」的比较。

#### 色彩角色对照

| 角色                      | 变量                                                                                         | 用途                                     |
| ------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 主色                      | `--accent` / `--accent-hover` / `--accent-text`                                              | 激活项、主按钮、选中态                   |
| 副强调色                  | `--accent-sub`                                                                               | 低透明度主色：hover 底、轻淡染           |
| 焦点环 / 选中强调         | `--accent-ring` / `--accent-strong`                                                          | 焦点外圈 / 更重的选中底色                |
| 互补色                    | `--complement` / `--complement-hover` / `--complement-sub`                                   | 与主色形成对比的位置、进度渐变终点       |
| 中性黑/灰                 | `--neutral-bg` / `--neutral-surface` / `--neutral-surface-2` / `--neutral-border`            | 大面积背景填充（无彩色，不参与色相配置） |
| 完成 / 信息 / 警告 / 危险 | `--success` / `--info` / `--warning` / `--danger`（各带 `-hover` `-soft` `-text` `-border`） | 状态语义                                 |

> demo 侧栏「设置」页提供可视化调节：6 个角色（主色 + 互补色 + 完成/信息/警告/危险）+ 7 套预设 + 实时预览 + 恢复默认。

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
- `onMenuAction(menu, action, handler)` 返回取消订阅函数。注意同一 `(menu, action)` **只保留最后注册的
  handler**，且取消订阅会移除该 action 的 handler——多个组件注册同名菜单/同 action 时请改用不同的
  action 名（或由上层统一注册一次）

## 主题定制

### 改颜色：直接覆盖 hex

每个角色在亮色、暗色主题里各有一份 hex 默认值，改哪个覆盖哪个即可：

```css
:root {
  --accent: #1850ec; /* 主色 */
  --complement: #009145; /* 互补色 */
}

.dark {
  --accent: #3b76ff; /* 暗色主题单独给一份 */
}
```

`-hover` / `-soft` / `-text` / `-border` 由 `--accent` 用 `color-mix()` 派生，改主色即可连带生效；
需要单独调时再覆盖同名变量。**这是推荐方式**——比按色相派生更好读、更好接手。

### 需要按色相联动时

`--hue-*` 仍然存在，但它现在只服务于「需要取邻近色相」的渐变与动画（当前只有 TitleBar 品牌渐变
用 `calc(var(--hue-accent) + 40)` 取主色的相邻色相）。改它不会动上面那些 hex 默认值。

```css
:root {
  --hue-accent: 25; /* 只影响依赖色相的计算 */
}
```

### 需要完全自定义时

所有组件都消费 CSS 自定义属性，覆盖 `:root` 即可（完整清单见 `src/lib/styles/theme.css`）：

```css
:root {
  /* 主色 */
  --accent: #1850ec;
  --accent-sub: color-mix(in srgb, var(--accent) 15%, transparent);

  /* 状态色 */
  --danger: #dc2627;
  --success: #1ec55f;
  --warning: #f59e0a;
  --info: #3c82f6;

  /* 中性面与文字 */
  --bg: #f5f5f5;
  --surface: #fafaf7;
  --text: #2c2c2e;
  --border: #e0dfda;
}
```

- 旧名 `--primary` / `--primary-hover` / `--primary-soft` / `--primary-text` 仍然可用，是
  `--accent` 体系的别名，既有代码无需改动
- 中性色（`--bg` / `--surface*` / `--border`）刻意不参与色相配置 —— 大面积背景不应被染色
- 暗色主题通过 `.dark` 或 `[data-theme="dark"]` 类名切换；子树内用 `.light` 类可局部恢复浅色 token

### 工具类（theme.css 全局提供）

| 类                    | 作用                      | 动画                                                              |
| --------------------- | ------------------------- | ----------------------------------------------------------------- |
| `.animate-fade-slide` | 淡入上滑一次（入场强调）  | `fadeSlideUp` 0.3s ease-in-out（opacity 0→1 + translateY 10px→0） |
| `.animate-nav-slide`  | 下滑入场一次              | `navSlideDown` 0.5s ease-out（translateY -100%→0）                |
| `.animate-float-doro` | 悬浮轻浮动循环            | `float-doro` 2.5s infinite（±4px，自带 `will-change: transform`） |
| `.skeleton-shine`     | 骨架屏横向光扫            | 渐变光带 `background-position` 200%→-200%，2s 线性循环            |
| `.status-dot-online`  | 在线状态圆点（绿 + 光晕） | `pulse` 2s 呼吸（opacity 1↔0.5）                                  |
| `.status-dot-offline` | 离线状态圆点（红）        | 无动画                                                            |

- 直接挂在任意元素上即可，无前置条件
- `.animate-*` 为一次性动画：元素重新显示时（如 `display:none↔''` 切换）会从头重播；页面级入场请交给 `Page` 过渡统一处理，勿在卡片上叠加

## Peer Dependencies

| 包                        | 必需 | 说明                                                    |
| ------------------------- | ---- | ------------------------------------------------------- |
| `svelte` ^5.0.0           | ✅   | 框架                                                    |
| `@lucide/svelte` >=1.43.0 | ✅   | 图标库；十几个组件在模块顶层直接 import，缺了无法构建   |

> 本包 `dependencies` 为空：没有 clsx 之类的 class 拼接库，也没有样式运行时。
>
> **Wails3 桌面应用**：goose-ui 不依赖 `@wailsio/runtime`。窗口控制通过
> `TitleBar` 的 `windowApi` prop 注入（实现 `WindowController` 接口，包一层
> `@wailsio/runtime` 的 `Window` 即可）；窗口拖拽与四角缩放是纯 CSS。完整示例见
> demo 的 TitleBar 页「Wails3 接入说明」。

## 开发

```bash
pnpm dev            # 起 demo（Vite）
pnpm check          # svelte-check 类型检查（带 --fail-on-warnings）
pnpm test           # 单元测试（node --test，tests/*.test.ts）
pnpm build          # 生产构建
```

CI（`.github/workflows/deploy.yml`）在构建 demo 前会先跑 `pnpm check` 与 `pnpm test`，
任何类型错误、a11y 警告或单测失败都会挡住部署。

## License

MIT

# 应用外壳

Layout / Page / Sidebar / TitleBar 的组合用法。组件总览见[组件清单](components.md)。

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

- `titlebar` / `aside` 都是可选插槽：不传 `aside` 时内容区占满整宽，导航可改用 `Drawer`
- `resize`：Wails 窗口（四角手柄 + 全域拖拽调整），浏览器省略
- `windowControls={false}`：写在 `TitleBar` 上，隐藏默认窗口三键（浏览器环境）；`controls` snippet 可在键区附加自定义按钮
- `scroll`（默认 `true`）：内容卡片整页滚；`false` = 框架不滚、页内滚动区自理
- 内容区装 `Page` 时内容卡片自动让出滚动，滚动只由 `Page` 的 `.page-body` 承担

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

## 间距变量（外壳与页面通过变量沟通，零耦合）

| 变量               | 作用                                                                                                                                          | 默认           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `--page-pad`       | `Page` 内边距——页面空隙的唯一责任方。**上下两半被清零，实际只有左右生效**                                                                      | `16px`         |
| `--page-gap`       | 页头 ↔ 内容 ↔ 卡片的统一垂直节奏                                                                                                              | `16px`         |
| `--ph-gap`         | 独立使用 `PageHeader` 时的下间距（`Page` 内自动为 `0`）                                                                                        | `32px`         |
| `--layout-pad-x/y` | `--page-pad` 在 `Layout` 内的镜像（`Header` 吸顶用它反向贴满内缘）；`y` 保持 `0px` 与 `Page` 一致                                              | `24px` / `0px` |

- 自绘外壳（非 `Layout`）若自带内容区 padding，在外壳上写 `--page-pad: 0` 归零即可
- `Page` 默认 body 不滚（`scroll` 关闭）：局部滚动区由页面内部处理；整页滚动给 `Page` 加 `scroll`

## 页内目录（`Page` 的 `toc`）

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

- 只认**带 `id`** 的 `h2`/`h3`，没有 id 的标题会被跳过
- `h3` 会作为上一级 `h2` 的子项缩进显示；`[data-toc-skip]` 内的标题不收录
- 跳转用 `scrollIntoView` 而非改 hash；锚点让位由 `scroll-margin-top: var(--toc-anchor)` 统一处理
- 目录列宽 `--toc-width`（默认 `220px`）、最大高度 `--toc-max-h`、每级缩进 `--toc-indent`
- 宽度 ≥ 1100px 时才显示目录列，窄屏自动隐藏

## 页面切换过渡（方向感知，Page 统一处理）

`Page` 自带进入/离开过渡（fly 过渡 + 淡入淡出），方向由 `Sidebar` 按导航项顺序自动计算：**向上切换** → 新页从上方进入、旧页向下离开；向下切换镜像。

两种接法（动画核心同一套，按应用切换语义二选一）：

```svelte
<!-- 卸载式：外层 {#if}/{#key} 切换，挂载/卸载自动播放 -->
{#if activeTab === "a"}<PageA />{:else}<PageB />{/if}

<!-- keep-alive 式：页面常驻不卸载，active 控制显隐 + 动画（状态保留） -->
<Page active={tab === "a"}>…</Page>
```

- 首屏渲染不播 intro；嵌套 `Page`（如预览框内）加 `transition={false}` 关闭
- 无 `Sidebar` 的程序化切换沿用上次方向；也可直接写 `pageDirStore.dir`（导出 `'up' | 'down'`）指定

## 组件控制面（三层原则，即插即用）

每个组件最多通过三个位置控制，**不要用 `:global` 覆盖组件内部类**：

| 层                    | 用途                                                                    | 示例                                      |
| --------------------- | ----------------------------------------------------------------------- | ----------------------------------------- |
| **props**             | 语义化外观/尺寸                                                         | `variant` `size` `width` `spin`           |
| **`class` + `style`** | 全组件统一透传到根元素；外部布局（flex/width/margin）一律走 `style="…"` | `<Button style="width:100%">`             |
| **CSS 变量**          | 单组件或全主题微调（覆盖 `:root` 或祖先变量）                           | `--page-pad` `--sidebar-w` `--titlebar-h` |

高频控制点：

- **宽度**：`Select`/`Modal`/`Drawer` 有 `width` prop；`Page`/`Tooltip` 有 `maxWidth`；`Sidebar` 用 `width={180}`（number 按 px）；其余控件用 `style`
- **尺寸档**：`Button`/`Checkbox`/`Toggle`/`Tabs` 的 `size` 为枚举档；`Button` 额外支持 `size={40}`（number = 任意高度）与 `size="xs"`（20px，只给 text / text-primary 用）；`Icon`/`Loading` 的 `size` 为任意数值（px，默认 20 / 30）
- **旋转**：`Icon` 的 `spin` prop（加载态），无需自己写动画
- **可调变量**：`--titlebar-h`（TitleBar 高度，默认 42px）、`--header-h`（Header 高度，由 `height` prop 写入）、`--ui-{sm,md,lg}-{height,padding,font}`（全局控件 token，见 theme.css）

## TitleBar 标题栏

自绘标题栏。窗口控制经 `windowApi` 注入（包一层 `@wailsio/runtime` 的 `Window` 即可），**库本身不依赖任何桌面 runtime**，浏览器里也能完整渲染与调试。

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
- `searchEmptyText` 自定义无匹配时的提示

### 搜索框宽度（自适应）

标题栏三段布局：左 logo / 中搜索 / 右窗口键。搜索段是唯一弹性段，随窗口收窄，宽度上限为标题栏可用空间的 40%（不可调），标题栏窄于 450px 时整个搜索框隐藏。

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
- 分组标题滚动时吸附顶部；分组与顶层项字号（14px）、图标文字间距（10px）、左缘对齐一致
- 外部导航（链接跳转、深链改写 `activeTab`）会自动展开目标项所在分组并将其滚入视野

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

- 展开态：与分组标题左缘对齐，共享同一 pill；折叠态：渲染为图标按钮，点击直接切换（区别于分组的 hover popover）

### endItems —— 列表结尾固定项

渲染在导航列表**末尾**；展开态与普通导航项共享同一 pill，折叠时渲染为图标按钮并贴底。

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

`footer` 是 snippet，内容完全由项目自定义：

```svelte
<script lang="ts">
  import { Sidebar, ThemeToggle, VERSION, type SidebarEntry } from "goose-ui";

  const groups: SidebarEntry[] = [{ title: "工具", items: [{ value: "port", label: "端口扫描" }] }];
  let activeTab = $state("port");
</script>

<Sidebar {groups} bind:activeTab>
  {#snippet footer()}
    <div class="sidebar-footer-inner">
      <span class="footer-version">v{VERSION} · Svelte 5</span>
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

# AGENTS.md

在本仓库里干活之前先读这一页。它只写**这个仓库特有的东西**：结构、约束、改动流程。
通用 Svelte 5 知识不在这里重复。

人类读者可以先看 [README](../README.md) 与[文档地图](README.md)，内容有重叠。

## 一句话认识

goose-ui 是**零构建、零样式运行时**的 Svelte 5（Runes）组件库：86 个单文件组件就是源码，
`package.json` 的 `svelte` 字段直接指向 `src/lib/index.ts`，没有编译产物，改了组件立刻生效。

- 运行期依赖：`dependencies: {}`。peer 只有 `svelte@5` 与 `@lucide/svelte`（后者**必装**：
  十几个组件在模块顶层就 `import` 图标，缺了直接构建失败）
- 样式：每个组件自己的 scoped `<style>` + `src/lib/styles/theme.css` 里的一套 CSS 变量
- demo（`demo/`，Vite）是唯一展示站，每组件一页、带「效果 / 源码」切换，部署在 GitHub Pages
- 文档在 `docs/`。其中 `docs/api-reference.md` 是**生成物**，不要手改（见下）

## 目录地图

| 路径 | 是什么 |
| --- | --- |
| `src/lib/index.ts` | 唯一对外入口（barrel）。新组件必须在这里导出 |
| `src/lib/components/ui/*.svelte` | 组件本体（83 个对外 + 3 个内部件），一文件一组件，scoped style 写在文件末尾 |
| `src/lib/components/ui/overlayLayer.ts` | 浮层层级 / 外部点击判定（`registerLayer`、`isInsideLayer`） |
| `src/lib/components/ui/menuTransition.ts` | `menuIn` / `menuOut` 两个动画指令 |
| `src/lib/components/ui/{ScrollZones,SegmentField,Wheel}.svelte` | **内部件**，供 Select / 日期字段复用，不对外导出 |
| `src/lib/components/menus/ContextMenu.svelte` | 全局右键菜单宿主（无 props，用法是 `registerMenu`） |
| `src/lib/components/providers/` | `ConfirmDialog` / `ErrorDialog`，App 顶层挂载一次，无 props |
| `src/lib/components/{notification,errors,confirm,contextMenu}.ts` | 命令式 API 与 store（`Notification.success()` 等） |
| `src/lib/styles/theme.css` | **所有** CSS 变量：颜色角色、间距/字号/圆角刻度、z-index 阶梯、工具类 |
| `src/lib/utils/` | 纯函数（`formatNum`、`formatBytes`、`copyToClipboard`），有单测 |
| `src/lib/version.ts` | 版本号唯一来源；`tests/version.test.ts` 校验它与 `package.json` 一致 |
| `demo/src/lib/demos/*.svelte` | 每组件一页示例（线上 demo 的真实源码） |
| `demo/src/lib/demos/registry.ts` | tab → `import()` 的表，**必须保持字面量写法**，Vite 只能静态分析字面量 |
| `demo/src/App.svelte` | demo 外壳 + 侧栏分组（加示例页要同时改这里和 `registry.ts`） |
| `demo/cleanroom.html` | 只渲染组件默认态、无 demo 包装的对照页（开发用，不进生产构建） |
| `scripts/` | 刻度 codemod/审计、API 文档生成、产物体积校验 |
| `tests/` | `node --test` 单测（format / sorting / version） |
| `skills/goose-ui/SKILL.md` | 打包给 agent 的用法 skill（选型表 + 约定 + 反模式），本仓库的"怎么用"速查 |

## 命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 起 demo（只起 demo，库本身没有 dev server） |
| `pnpm check` | `svelte-check`，带 `--fail-on-warnings`（a11y 警告也算失败） |
| `pnpm test` | `node --test tests/*.test.ts` |
| `pnpm build` | 构建 demo 并跑产物体积校验（单文件 >500KB 直接失败） |
| `pnpm grid:audit` | 校验刻度 token 的自洽性与引用完整性，异常 exit 1 |
| `pnpm docs:api` | 重新生成 `docs/api-reference.md` |
| `pnpm docs:api:check` | 校验生成物是否落后于源码（CI 已接入） |

## 硬规则

1. **组件的样子只能由组件自己决定。** demo 里不许 `:global(.组件内部类)` 穿透改样式，也不许套一层
   容器改组件的高度/内边距/边框/背景。demo 需要更多控制时，说明 API 缺东西：加 prop（例如
   `Layout framed={false}`、`Drawer offsetTop`），不要在调用侧打补丁。布局脚手架（flex 行、gap、
   固定宽、定高滚动盒）是允许的。
2. **样式值走刻度，不写字面量。** 间距 `--space-{n}`（n = px/4，子刻度 `--space-1-5` = 6px）、
   字号 `--fs-{px}`、圆角 `--radius-*`、尺寸 `--height-sm/md/lg`。新值先加 token 再用。
   规则与例外见[栅格与刻度](grid.md)；`pnpm grid:audit` 会卡住引用不存在的 token。
   描边、阴影、位移、字距、百分比**不参与**刻度。
3. **依赖面不能涨。** `dependencies` 保持为空；不要引入 clsx / tailwind / 样式运行时 /
   图标库替代品。需要新依赖先说服维护者。
4. **主题只改 `theme.css`。** 组件里不写死颜色，一律用语义变量（`--text`、`--surface`、
   `--accent`、`--border`…）。`--accent-*` 派生色由 `color-mix()` 算，不手写。
5. **浮层层级用 `--z-*` 阶梯**，不写魔法数字；嵌套浮层的外部点击判定走 `isInsideLayer`，
   不要自己 `contains()`。
6. **`docs/api-reference.md`、demo 产物体积、刻度审计都是被脚本守着的**：改完相应源码要跑对应命令，
   不要手改生成物。

## 常见任务

### 加一个组件

1. `src/lib/components/ui/Foo.svelte`：`let { ... }: { ... } = $props();` + scoped `<style>`。
   不在 props 里的属性用 `...rest` 透传到根元素。
2. `src/lib/index.ts`：顶部 `import Foo from './components/ui/Foo.svelte';`，再加进 `export { ... }`
   （有对外类型就同时 `export type { FooItem } from ...`）。
3. `package.json`：在 `exports` 里加 `"./foo": "./src/lib/components/ui/Foo.svelte"`。
4. demo：`demo/src/lib/demos/Foo.svelte` 写好示例，在 `registry.ts` 的 `rawLoaders` 里加一行字面量
   `import()`，并在 `App.svelte` 的 `groups` 里挂到合适的分组。
5. `docs/components.md`：在对应分组的表里加一行（一句话说明）。这一行同时是
   `docs/api-reference.md` 里该组件那句话的来源，不写就会缺节。
6. `pnpm docs:api` 重新生成 props 表。
7. `pnpm check && pnpm test && pnpm build && pnpm grid:audit`。

### 改一个组件的 props

- 加/改 props 时同步：类型块（TS 类型是文档来源）、JSDoc（会进 `docs/api-reference.md` 的「说明」列）、
  demo 示例、`docs/components.md` 里那句话（如果定位变了）。
- 双向绑定用 `$bindable()`；`class: cls` 只是重命名，不是绑定。
- 删/改 props 是破坏性变更：搜一遍 demo 与 `skills/` 里的用法，并在提交信息里写清楚。

### 改颜色 / 主题

先看[主题定制](theming.md)。要点：覆盖角色 hex（`--accent`、`--complement`…），
派生色自动算；深浅两套要分别写（`.dark { }`）；`--hue-*` 只影响渐变取色，不改任何颜色。

### 修样式 / 布局问题

类型检查抓不到布局问题，必须在真浏览器里看：

- `pnpm dev` 后拖窗口宽度，逐档检查溢出、重叠、压缩（尤其 `TitleBar` 的搜索框与窗口按钮）
- 需要组件默认态对照时开 `demo/cleanroom.html`
- 涉及滚动/尺寸的动画，用逐帧几何采集（CDP `getBoundingClientRect`）验证，别只看截图

## 验证清单

```bash
pnpm check            # 类型 + a11y
pnpm test             # 单测
pnpm build            # demo 构建 + 单文件体积上限
pnpm grid:audit       # 刻度 token 自洽
pnpm docs:api:check   # 生成文档是否落后
```

布局/视觉改动**必须**额外在浏览器里看过；改了组件行为就顺手补 demo 示例，示例是用户唯一能复制的代码。

## 文档地图

| 文档 | 谁维护 | 内容 |
| --- | --- | --- |
| [README](../README.md) | 手写 | 定位、安装、文档索引 |
| [docs/README](README.md) | 手写 | 文档地图与三条阅读路径 |
| [installation](installation.md) | 手写 | 安装、Vite 接入、深色首屏、快速开始、导入方式 |
| [components](components.md) | 手写 | 86 个组件的一句话说明（**分组与命名以它为准**） |
| [api-reference](api-reference.md) | **生成** | 每组件 props 表：类型 / 默认值 / 说明 / bind 标记 |
| [shell](shell.md) | 手写 | Layout / Page / Sidebar / TitleBar、页内目录、切换过渡 |
| [api](api.md) | 手写 | 通知、确认框、错误弹窗、右键菜单、Tooltip、动效原语、PillTrack |
| [theming](theming.md) | 手写 | 主题 API、颜色角色、刻度、工具类 |
| [grid](grid.md) | 手写 | 刻度体系、归位建议、例外清单 |
| [skills/goose-ui/SKILL.md](../skills/goose-ui/SKILL.md) | 手写 | 给 agent 的选型表 + 约定 + 反模式（写代码前值得读一遍） |

## 代码约定

- **注释写"为什么"**，中文。组件里能解释动机的地方（尤其是刻意的取舍、踩过的坑）要留下，
  这些是后来人唯一能拿到的上下文。
- 组件用 `$props()` 解构 + 类型块；`$state` / `$derived` / `$effect` 用 runes，不用 store 语法。
- 事件用属性写法（`onclick={...}`），不写 `on:click`。
- 组件的 `children` / 具名插槽用 snippet。
- 固定高度用 `height: var(--height-md)` + 显式 `line-height`，不要靠 padding 堆；长文本
  `min-width: 0` + `overflow: hidden` + `text-overflow: ellipsis`，不许换行撑高。
- 悬停提示一律 `Tooltip`，不用原生 `title`（深色下系统 tooltip 是浅色方块）。

## 已知的坑

- `$props()` 之外不要用 `$$props` / `$$restProps`（Svelte 5 已移除）。
- 不要在事件处理函数里 `getContext()`：runes 模式下会抛 `lifecycle_outside_component`。
- 不要 `<button>` 套 `<button>`（SSR 水合不匹配）；清除按钮做成绝对定位的兄弟节点。
- Svelte 5 不会为嵌套 `{#if}` 内的元素播放入场动画：条件必须挂在单个 `{#if}` 上。
- `min-width` 里不要写百分比（按包含块宽度解析，窄窗口会溢出），用 `flex: 1 1 <basis>` + `min-width: 0`。
- demo 的 `registry.ts` 一旦把 `import()` 换成模板字符串，整个按需加载就失效（Vite 无法静态分析）。
- 图标库 `@lucide/svelte` 不含品牌图标（GitHub、微信…），需要时内联 SVG。

---
name: goose-ui
description: Svelte 5 纯 CSS 组件库使用技能。当用户要求用 goose-ui 搭建 Svelte/Wails3 界面、询问组件用法、或需要主题配色时使用。
---

# goose-ui 组件库使用技能

Svelte 5 组件库（Runes），支持 Wails3 桌面应用：`src/lib/components/ui` 下 86 个单文件组件，
运行时只有 `@lucide/svelte` 一个 peer 依赖（**必装**，十几个组件在模块顶层直接 import）。
所有组件消费 CSS 自定义属性，主题单文件。

## 环境前置

- Svelte 5（runes 模式）+ `@lucide/svelte`（图标，必装；`dependencies` 为空，没有 clsx 之类）
- 应用入口引入一次主题：`import "goose-ui/styles/theme.css";`
- 通知/确认/错误弹窗需在 App 顶层挂载对应容器：`<NotificationProvider />`、`<ConfirmDialog />`、`<ErrorDialog />`
  - `showConfirm(message, opts)` 要贴一长串清单（一批 PID / 文件名）时用 `opts.detail` + `opts.detailLabel`，
    别拼进 `message`：明细是等宽、可选中、限高 168px 内滚的块，且带明细时确认框自动不播打字机
    （逐字打完几十项要两三秒，而这些字正是用户此刻要读的）

## 组件选型速查

| 需求 | 组件 |
| --- | --- |
| 按钮 / 图标按钮 | `Button`（variant: primary/default/ghost/danger/danger-solid/text/text-primary/link；`size` 或 `size={40}`；`xs` 只配 text 用；`bind:element` 取真实 DOM） |
| 卡片容器 | `Card`（title + right snippet） |
| 演示卡片（效果/源码切换） | demo 内部 `CodePreview`，**不导出**，不要用在业务代码 |
| 输入 / 多行 | `Input` / `Textarea`（clearable、status、prefix/suffix snippet） |
| 下拉单选 / 多选 / 可新建 / 可过滤 | `Select` / `MultiSelect` / `CreatableSelect` / `Combobox` |
| 开关 / 单选组 / 多选组 | `Toggle`（`loading` 转 spinner；`onStyle`/`offStyle`/`thumbStyle` 自定义轨道色）/ `RadioGroup` / `ToggleGroup` |
| 复选框 / 单选框 | `Checkbox`（small/middle/large + `indeterminate`）/ `Radio` / `RadioGroup` |
| 折叠 | `Collapsible`（单块展开收起，`variant`: card/plain）/ `Accordion`（多面板，`value` 数组 + `multiple`） |
| 日期 / 时间 | `DatePicker` / `DateRangePicker` / `TimePicker`（惯性滚轮）/ `Calendar` / `RangeCalendar` |
| 分段字段 | `DateField` / `TimeField` / `DateRangeField` / `TimeRangeField`（基于 `SegmentField`；聚焦即整段选中，直接敲数字覆盖；越界输入标红、离开字段自动夹到合法范围并补零） |
| 弹层 | `Modal` / `Drawer`（4 方向）/ `Popover` / `Tooltip` / `AlertDialog` / `Command`(Ctrl+K)；`Drawer` 另支持 `resizable`+`snapPoints` 拖拽吸附、`container` 挂到指定元素、`backgroundSelector` 指定景深宿主、`pushScale`/`pushBlur` 调景深力度（默认 0.94 / 1px 适合窄抽屉；铺满大半屏的面板反过来用 0.985 / 6px——缩得少、糊得重） |
| 通知 | `Notification.success/info/warning/error(...)`（需 Provider） |
| 表格 / 列表 | `DataTable`（排序+高亮+右键菜单）/ `DataList` |
| 反馈 | `Progress系列` / `UsageBar` / `Meter` / `Skeleton` / `Loading` / `Empty` |
| 外壳（Wails3） | `Layout` + `Sidebar` + `TitleBar` + `Page` + `PageHeader` |
| 导航菜单 | `NavigationMenu` / `Menubar` / `DropdownMenu` / `ContextMenu` |

## 关键约定

1. **主题色只调色相**：`--hue-accent` 等 6 个旋钮（accent/complement/danger/success/warning/info），
   明度彩度由亮暗主题派生。JS：`setHue('accent', 25)` / `setHues({...})` / `resetHues()`，自动持久化。
2. **旧名仍是别名**：`--primary*` 指向 `--accent` 体系；新代码用 `--accent` / `--accent-sub`（淡染底，**不是** hover 底）/
   `--accent-ring`（焦点环）/ `--complement`（对比位）。pill 与 hover 底的取色规则见第 23 条
   （单 pill = 主题色实心，双 pill = 主题色激活 + 灰 hover）。
3. **中性背景不被染色**：`--bg` / `--surface*` / `--border` 是无彩色，勿绑到色相旋钮。
4. **通知 API 不用 context**：`Notification.xxx()` 走全局单例；独立容器用
   `createNotificationStore()` + `createNotification(store)` + `<NotificationProvider store={...} />`。
5. **片段要自包含**：给用户的示例代码首行必须带 `import { ... } from "goose-ui";`，
   不引用 demo 私有 class；`</script>` 在模板字符串内写作 `<\/script>`。
6. **Props/参数表用普通 `Card`**；「效果/源码」切换只用于组件用法演示。
7. **双向绑定**：受控值用 `$bindable`（`bind:value`）；Tabs 语义是「先写 value 再回调」。
8. **浮层定位**：统一走 `floatingPosition()`（视口钳位 + 翻转），不要手写 getBoundingClientRect 拼样式。
9. **z-index**：用 `--z-overlay/--z-dropdown/--z-popover/--z-dialog/--z-notification` 阶梯，勿写魔法数字。
   多层 `Modal` 不用自己管：组件按打开顺序取 `layerId`，叠成 `calc(var(--z-overlay) + id)`。
   业务弹窗里再调 `showConfirm` 能正常压在上面 —— 别指望 DOM 顺序（`ConfirmDialog` 一般挂在布局前）。
10. **Wails3 外壳**：`Layout` 只提供 `titlebar` / `aside` / `children` 三个插槽，不内置组件；
    用 `titlebar` 放 `TitleBar`、`aside` 放 `Sidebar`（或省略改用 `Drawer`）。
    `theme={themeStore.theme}` + `onThemeToggle={toggleThemeFromEvent}` 获得圆形扩散的主题切换。
11. **标题栏搜索**：`TitleBar` 传 `searchable` + `searchItems` 开内联搜索（`↑↓`/`Enter`/`Esc`）。
    宽度**自适应且没有可配的 prop**：上限为标题栏可用空间的 40%（`max-width: 40cqw`），
    窄到标题栏 450px 以下整体隐藏。`cqw` 只能参照 `.titlebar`，别把 `.titlebar-search-wrap`
    自己声明成容器——自引用会让比例失效。
    `group` 分组、`keywords` 让中文标签也能用英文搜。
12. **布局：唯一弹性段**：标题栏三段布局中，只有中段搜索是弹性的，左右（logo / 窗口键）
    必须 `flex: 0 0 auto`。改任何一段的宽度行为前，先确认另外两段不会被挤压。
13. **视觉隐藏的原生 input 必须落在 label 内**：用 `position: absolute` 隐藏 input 时，承载它的
    `label` 必须带 `position: relative`；否则 input 会跑到最近的定位祖先处（可能离控件几千像素），
    点 label 让它聚焦时浏览器会把那个位置滚进视口 → 整页跳动。另外 Chrome 给 checkbox 的
    UA margin 是 `3px 3px 3px 4px`，记得 `margin: 0`（Checkbox / Radio 都踩过）。
14. **控件高度别靠 padding 撑**：定高控件直接 `height: var(--height-md)` + 显式 `line-height`。
    空状态是 CJK 占位文案、有值是等宽数字，两者命中不同的回退字体，行盒高度差 1~3px，
    控件就会时高时矮（DatePicker / TimePicker / DateRangePicker 都踩过）；定高后长文本用
    `min-width: 0` + `overflow: hidden` + `text-overflow: ellipsis` 截断，别让它换行撑高。
15. **一个滚动区只能有一个主人**：`Layout` 的内容卡片与 `Page` 的 `.page-body` 抢滚动权时，
    过渡的位移会把卡片临时撑出第二条滚动条（过渡结束收回，正文横跳一个滚动条宽度）。
    现在 `Page` 在内容区里时卡片自动 `overflow: hidden`（`:has(> .page)`）。给内容区塞
    非 `Page` 的自定义页面时，它才继续用卡片滚动——两种模型切换时正文宽度会差一个滚动条，
    要一致就统一用 `Page`。

16. **浮层进出场用 `menuIn` / `menuOut`，且条件必须写在一层 `{#if}` 里**：进入 120ms
    （淡入 + 6px 位移 + 0.96→1 缩放，原点贴触发器一侧），离开 80ms（只淡出 + 一半位移）。
    两个指令分开写是因为进出时长不同。**Svelte 5 不会给嵌套 `{#if}` 的内层元素播 intro**——
    外层 `{#if}` 与内层 `{#if}` 在同一次更新里创建时，元素的 `in:` 被整段跳过（`out:` 不受影响，
    所以只测关闭时的表现会以为动画是好的）。NavigationMenu 的面板就这么白写了很久。
    要么把条件合并成一层（`$derived` 出一个「当前展开项」），要么把内层拆成独立组件。
    另外：`transform-origin` 要写在过渡的 css 回调里，只设一次 `node.style` 会被 Svelte
    后续写 `style="left:…;top:…"` 整条覆盖掉。

17. **悬停提示一律用 `Tooltip`，不要写原生 `title`**：原生 tooltip 的配色由操作系统决定，
    暗色主题下会突然弹出一块系统浅色方块，是整套界面里唯一不跟主题走的东西。
    - 触发器是一个 `span`（`display: inline-flex`），因此也能放进 `<button>` 里
      （`div` 在 `<button>` / `<p>` 里是非法嵌套）——给 DropdownMenu 的图标触发器加提示就走这条路。
    - 气泡 portal 到 `body`：留着原地会被祖先的 `backdrop-filter` / `transform` 变成
      「相对祖先」定位（表头磨砂、行进场动画都会命中），也会被 Modal / Drawer / 列表的
      `overflow` 裁掉。
    - 被包裹的元素换了父级，**原来挂在元素上的 `flex: 1` / `margin-left: auto` /
      `text-overflow: ellipsis` 都可能失效**：给触发器 `class` 补一条
      `:global(.xxx-tip){ flex:1 1 auto; min-width:0 }`，内层再做省略。
      组件内部那些 `> *` 结构选择器（`Sidebar` 的 `.sidebar-nav > *`）也要同步挪到触发器上。
    - 默认 200ms 延迟：列表里一行可能挂好几个提示，延迟太小鼠标扫过就弹一片。
    - `hide()` 会先判「有没有真正浮出来过」，没有就直接返回。改这个组件时别把判断去掉：
      `"leaving"` 状态同样会渲染气泡，而那时还没跑 `calculatePosition()`，气泡停在
      初始的 `(0,0)`＝窗口左上角，快速划过列表就会看到左上角闪出一片错位提示。
    - 例外：`DataTable` 的纯文本格仍是原生 `title`（上万个 `<td>` 一格一个组件不划算）。

18. **`title` / `aria-label` 传空串时不要落到 DOM 上**：`title=""` 也会让浏览器把元素当成
    「有原生提示」参与命中判定，还会和外面包的 `Tooltip` 重复。统一写
    `title={title || undefined}`。

19. **成组的 hover 高亮不要自己写 `:hover { background }`，交给 `PillTrack`**：自己写的规则
    只会「瞬时变色」，没有滑动、也没有回弹，和侧栏/菜单/表格放一起一眼就能看出不齐。
    `PillTrack` 的 hover 与选中 pill 共用同一条 back-out 曲线
    `cubic-bezier(0.34, 1.5, 0.64, 1)`。
    - **时长也必须是同一套映射**：`clamp(0.16s, 0.28s, 0.14s + d/1600)`（d = 本次位移距离），
      hover 写 `--pill-hover-dur`、选中写 `--pill-dur`，数值由同一个 `pillDur()` 算出。
      两边各写一套（曾经是选中 0.18–0.40、hover 0.16–0.26）必出问题：下拉框只挪一行，
      永远在下限，看着「弹」；侧栏一点跨十几项，直接顶到 0.40s 上限，同一条曲线被拉长
      就成了「缓」—— 用户只会觉得两个 pill 的动画不是一套。
    - 上限不能再放宽：指针扫过一列时每一行都会重新起跳，超过 0.28s pill 就永远追在
      指针后面（体感是「卡」而不是「弹」）。
    - `height` 单独用 `cubic-bezier(0.34, 1.12, 0.64, 1)`：高度不是位移，同一个过冲幅度
      会让 pill 上下「撑一下」。
    - `width` 不进 `transition`（布局属性，和 transform 同组会打断合成层提升）。
    - `prefers-reduced-motion: reduce` 只把曲线换成 `ease-out`，不要写 `transform: none`
      —— 那会把 pill 的位置压回原点。

20. **项间间隙要并进触发区，否则 pill 会「闪」**：`gap: 2px`、`margin-top: 8px`、
    菜单分隔线、分组内边距这些空隙属于**容器**，`target.closest(itemSelector)` 命中不到项，
    指针扫过时 pill 会消失一帧再出现。`PillTrack` 已内置就近归属（`gapBridge`，默认 12px）：
    最近项与**次近项**都在阈值内才算命中 —— 用「两侧都有项」把真正的缝隙和
    表头上方 / 列表下方的空白区分开，后者不能点亮首末行。自己写列表又不用 `PillTrack` 时，
    要么给容器挂同样的判定，要么把间隙做成项的内边距（`.item + .item { margin: 0 }`
    + 项内 `padding`），别让缝隙裸露在命中层上。

21. **在子树里做「亮/暗预览」，别名 token 必须在子树里重新声明**：自定义属性上的 `var()`
    在**声明所在的那一层**就替换掉了。`theme.css` 的 `--primary: var(--accent)` 写在 `:root`，
    于是在 `<html>` 上就按当时的 `--accent` 算成具体颜色，再以「结果」继承下去 ——
    嵌套一个 `.dark` 容器改 `--accent`，`--primary` 不会跟着变（真实暗色模式没事，
    因为 `.dark` 就挂在 `<html>` 上，两者在同一层求值）。跨作用域复用这类别名时，
    把 `--primary: var(--accent)` 一类的声明在容器上原样再写一遍；
    同时补 `color: var(--text)`，否则没显式写颜色的后代文字会停在页面那一套 `--text` 上。
    另外 `getComputedStyle` 读 `--x` 拿到的是**声明文本**（`var(...)` / `color-mix(...)`），
    要拿实际颜色必须把它落到 `background-color` 上读计算值；`color-mix()` 有时被序列化成
    `color(srgb 0.11 0.77 0.37 / 0.14)`，解析时要一并处理，否则会漏出一长串原始字符串。
22. **渐变只有一个来源：`--gradient-accent` / `--gradient-accent-hover`**，别再在组件里写
    `linear-gradient(90deg, var(--accent), var(--complement))`。规则是「主色色相 -30° → +30°，
    跨度 60°」，两端都在主色附近；accent→complement 这种一道渐变跨 100°+ 的写法中间段发脏，
    已全部替换（TitleBar logo、ProgressBar、Meter、Slider）。hover 版只提亮不改色相，
    否则鼠标一上去像换了套配色。三个实现约束：色相偏移写纯数字（`+30`，不是 `30deg`）、
    渐变在 `:root` 上预解析成自定义属性、组件里不用带 `var()` 的 `var()` 回退
    （回退值里出现任何 `var()` → 整条 background 失效 → 元素隐形）。
    旧名 `--titlebar-logo-gradient*` 保留为别名，新代码用新名。
23. **pill 配色：色相只表示「已选中」，灰阶只表示「指针在这里」**。
    `PillTrack` 的 `background`（常驻选中 pill）与 `hoverBackground`（跟随指针的 hover pill）
    是两个通道，不要合并：
    - **有持久选中项**（Select、Combobox、CreatableSelect、Sidebar、Tabs、Calendar 日期格）→
      选中 `var(--primary)` + `--accent-text`，hover 用中性灰 `var(--hover)`。
      主题色**不能跟着指针跑**：那样每一行被划过都像被选中了一次，用户得在
      「上次选的是哪个」和「现在指着哪个」之间反复分辨（弹窗列表尤其明显）。
    - **指针压在已选中项上** → 传 `activeHoverBackground="var(--primary-hover)"`，
      不要用那块灰：灰会把主题色整个盖掉，激活标识一碰就消失。实现方式是此时把选中 pill
      的 `opacity` 归零、让换了色的 hover pill 顶上来（位置完全重合），所以不用比 `z-index`。
    - **没有持久选中**（Command 命令面板、DropdownMenu、ContextMenu、TitleBar 搜索）→
      落点就是当前项，继续用 `var(--primary)` 实心，并把该行文字 / 图标 / 右侧快捷键
      改成 `var(--accent-text)`，否则深色字压在品牌色上读不清。
    - **表格 / 列表行（DataTable、DataList）**、分段控件的小格、日历里的翻页按钮 →
      hover 保持 `var(--hover)` 灰：这些是「大面积扫动」或「小按钮」，整行刷成品牌色太重。
    - 一律不透明。`--accent-sub` / `--primary-soft` 这类半透明淡染叠在纯白浮层、
      灰卡片、深色侧栏上是三种颜色，叠两层还会更深一档，改不回来。
    - 键盘落点没有 hover pill 驱动（pill 是 pointer 驱动的），用 CSS 兜一层：
      `.项--active:not(.项--selected):not(:hover) { background: var(--hover) }`。
      `:not(:hover)` 是必须的 —— 鼠标划过时也会写 activeIdx，不加就会出现
      「CSS 灰底先亮、灰 pill 后到」的两次反馈。
    - `variant="line"`（下划线 tab）即使只有 hover 一条也不是主题色：2px 细条压在 1px 轨道上，
      用 `--hover` 会比轨道更浅、看着像把线擦掉一段，所以不传 `hoverBackground` 时
      由组件自动取 `--hover-line`（亮 #c9c9cf / 暗 #4b4b53，同样不透明）。
    - 需要带色相的特殊行（如菜单危险项）混成实色：
      `color-mix(in srgb, var(--danger) 12%, var(--popup-surface))`。

24. **浮层里再弹浮层，外部点击判断必须走 `isInsideLayer`，别自己写 `contains`**：
    `Popover` / `Select` / `DropdownMenu` 的面板都 portal 到 `body`，`contains()` 判不出
    「这是我自己弹出的子面板」。踩过的坑：筛选气泡里放一个下拉，点下拉选项时 Popover
    先把 mousedown 当外部点击收起 → Select 卸载 → `click` 不派发 → **选项点了没反应**；
    动画还开着时退场过渡让面板多活 ~150ms，反而是「有时候能点」，关掉系统动效就 100% 失效。
    面板上挂 `data-overlay-layer=<createLayerId()>`，portal 前 `layerOwnerOf` + `registerLayer`
    登记父层，判断时 `isInsideLayer(e.target, layerId, [rootEl, panelEl])`（见 `overlayLayer.ts`）。

25. **pill 是 pointer 驱动的「最近项」，前景色必须跟 `data-pill-on` 走，不能跟 `:hover` 走**。
    `gapBridge` 会把 pill 留在离指针最近的那一项上，而指针可能正落在项间缝隙、分隔线或
    面板内边距里 —— 此时 `:hover` 是 false、pill 却仍压着那一行。用 `:hover` 上色就会出现
    「鼠标移开了、蓝底还没退、字已经变回深色」（深字压品牌色对比度约 1.4:1）；开关行还会
    留下一条深灰轨道压在蓝底上。`PillTrack` 往「pill 正压着的那一项」打 `data-pill-on`：
    - `hover` → 用的是 `hoverBackground`（通常主题色实心）→ 文字/图标/开关转 `--accent-text`；
    - `active` → 压在已选中项上，用的是 `activeHoverBackground` → 跟随选中项（本就白字）；
    - `custom` → 行自己的 `data-pill-bg`（禁用行中性灰、危险行浅红）→ **保持原色，别转白**。
    标记与 pill 显隐同帧切换，且隐藏那一帧 pill 不做淡出（否则深字压在没退干净的品牌色上
    150ms）。出现方向本来就不过渡（从停放位恢复写 `transition:none`）——pill 只「滑」不「淡」。
    - 写规则时注意作用域：`data-pill-on` 是运行时写的，Svelte 静态分析看不见，直接写
      `.dropdown-item[data-pill-on]` 会被判 `css_unused_selector`（CSS 里没有 svelte-ignore）。
      让祖先保持 scoped、把带属性的整段包进 `:global()`：
      `.dropdown-menu :global(.dropdown-item[data-pill-on='hover']:not(:disabled)) { … }`。
      注意 `:global()` 只能在选择器序列的首或尾。

## 常见组合

- 表单校验：`Form`/`FormItem`（context 传 layout/labelWidth）+ `Input` status + `Notification` 反馈
- 右键菜单：`registerMenu(name, items)` + `cellMenuAttrs(name, data)` 绑到单元格 +
  `onMenuAction(name, action, handler)`（同一 (menu,action) 只保留最后一个 handler）
- 页面骨架：`Page`（页头+内容+footer 吸底）内放 `Card` / `CodePreview`；
  嵌套 `Page` 传 `transition={false}`
- 长列表滚动：`ScrollArea` + `ScrollZones`（两侧箭头滚动区）

## 反例（不要做）

- 不要在事件处理器里调 `getContext()`（Svelte 5 会抛 lifecycle_outside_component）
- 不要把 `<button>` 嵌进 `<button>`（SSR hydration mismatch）；清除按钮做触发器的兄弟节点绝对定位
- 不要用 `document.querySelector` 抓自己组件外的 DOM 做定位；优先 `bind:this`
- 不要给介绍页/文档页套「效果/源码」切换（那是组件演示专用）
- 不要在 `min-width` 里写百分比（如 `min-width: min(var(--x), 100%)`）：百分比按**包含块宽度**
  而非 flex line 剩余空间解析，窄窗口下会失效并让元素溢出压住相邻组件。要弹性收缩就用
  `flex: 1 1 <basis>` + `min-width: 0`
- 不要指望 `flex` 收缩能把带 `padding`/`border` 的元素收到 0 —— 它们不可压缩，需要
  `@container` / 显式隐藏来兜底窄宽度退化

## 自查与验证

改动后跑（在仓库根目录）：

```bash
pnpm check                             # svelte-check 类型检查（带 --fail-on-warnings）
pnpm test                              # 单元测试（node --test，tests/*.test.ts）
pnpm build                             # 确认能构建
```

布局类改动（宽度、溢出、重叠）类型检查管不到，需在浏览器里实际拖窄窗口验证：
搜索框在逐档缩窄时不应与 logo / 窗口三键重叠、不应溢出标题栏、三键不被压缩。
注意 `set value + dispatch('input')` 对 Svelte 5 的 `bind:value` 无效，
若要脚本化验证必须用真实输入事件（CDP 的 `Input.insertText`）。

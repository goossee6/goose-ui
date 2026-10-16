---
name: goose-ui
description: Svelte 5 纯 CSS 组件库使用技能。当用户要求用 goose-ui 搭建 Svelte/Wails3 界面、询问组件用法、或需要主题配色时使用。
---

# goose-ui 组件库使用技能

零第三方依赖的 Svelte 5 组件库（Runes），支持 Wails3 桌面应用。所有组件消费 CSS 自定义属性，主题单文件。

## 环境前置

- Svelte 5（runes 模式）；可选 `@lucide/svelte` 提供图标
- 应用入口引入一次主题：`import "goose-ui/styles/theme.css";`
- 通知/确认/错误弹窗需在 App 顶层挂载对应容器：`<NotificationProvider />`、`<ConfirmDialog />`、`<ErrorDialog />`

## 组件选型速查

| 需求 | 组件 |
| --- | --- |
| 按钮 / 图标按钮 | `Button`（variant: primary/default/ghost/danger/link；`size` 或 `size={40}`） |
| 卡片容器 | `Card`（title + right snippet） |
| 演示卡片（效果/源码切换） | demo 内部 `CodePreview`，**不导出**，不要用在业务代码 |
| 输入 / 多行 | `Input` / `Textarea`（clearable、status、prefix/suffix snippet） |
| 下拉单选 / 多选 / 可新建 / 可过滤 | `Select` / `MultiSelect` / `CreatableSelect` / `Combobox` |
| 开关 / 单选组 / 多选组 | `Toggle` / `RadioGroup` / `ToggleGroup` |
| 日期 / 时间 | `DatePicker` / `DateRangePicker` / `TimePicker`（惯性滚轮）/ `Calendar` / `RangeCalendar` |
| 分段字段 | `DateField` / `TimeField` / `DateRangeField` / `TimeRangeField`（基于 `SegmentField`） |
| 弹层 | `Modal` / `Drawer`（4 方向）/ `Popover` / `Tooltip` / `AlertDialog` / `Command`(Ctrl+K) |
| 通知 | `Notification.success/info/warning/error(...)`（需 Provider） |
| 表格 / 列表 | `DataTable`（排序+高亮+右键菜单）/ `DataList` |
| 反馈 | `Progress系列` / `UsageBar` / `Meter` / `Skeleton` / `Loading` / `Empty` |
| 外壳（Wails3） | `Layout` + `Sidebar` + `TitleBar` + `Page` + `PageHeader` |
| 导航菜单 | `NavigationMenu` / `Menubar` / `DropdownMenu` / `ContextMenu` |

## 关键约定

1. **主题色只调色相**：`--hue-accent` 等 6 个旋钮（accent/complement/danger/success/warning/info），
   明度彩度由亮暗主题派生。JS：`setHue('accent', 25)` / `setHues({...})` / `resetHues()`，自动持久化。
2. **旧名仍是别名**：`--primary*` 指向 `--accent` 体系；新代码用 `--accent` / `--accent-sub`（hover 底）/
   `--accent-ring`（焦点环）/ `--complement`（对比位）。
3. **中性背景不被染色**：`--bg` / `--surface*` / `--border` 是无彩色，勿绑到色相旋钮。
4. **通知 API 不用 context**：`Notification.xxx()` 走全局单例；独立容器用
   `createNotificationStore()` + `createNotification(store)` + `<NotificationProvider store={...} />`。
5. **片段要自包含**：给用户的示例代码首行必须带 `import { ... } from "goose-ui";`，
   不引用 demo 私有 class；`</script>` 在模板字符串内写作 `<\/script>`。
6. **Props/参数表用普通 `Card`**；「效果/源码」切换只用于组件用法演示。
7. **双向绑定**：受控值用 `$bindable`（`bind:value`）；Tabs 语义是「先写 value 再回调」。
8. **浮层定位**：统一走 `floatingPosition()`（视口钳位 + 翻转），不要手写 getBoundingClientRect 拼样式。
9. **z-index**：用 `--z-overlay/--z-dropdown/--z-popover/--z-dialog/--z-notification` 阶梯，勿写魔法数字。
10. **Wails3 外壳**：`Layout` 组装标题栏+侧栏+内容区；`theme={themeStore.theme}` +
    `onThemeToggle={toggleThemeFromEvent}` 获得圆形扩散的主题切换。
11. **标题栏搜索**：`TitleBar` 传 `searchable` + `searchItems` 开内联搜索（`↑↓`/`Enter`/`Esc`）。
    宽度**自适应且没有可配的 prop**：上限为标题栏可用空间的 40%（`max-width: 40cqw`），
    窄到标题栏 450px 以下整体隐藏。`cqw` 只能参照 `.titlebar`，别把 `.titlebar-search-wrap`
    自己声明成容器——自引用会让比例失效。
    `group` 分组、`keywords` 让中文标签也能用英文搜。
12. **布局：唯一弹性段**：标题栏三段布局中，只有中段搜索是弹性的，左右（logo / 窗口键）
    必须 `flex: 0 0 auto`。改任何一段的宽度行为前，先确认另外两段不会被挤压。

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
pnpm check                             # svelte-check 类型检查
pnpm build                             # 确认能构建
```

布局类改动（宽度、溢出、重叠）类型检查管不到，需在浏览器里实际拖窄窗口验证：
搜索框在逐档缩窄时不应与 logo / 窗口三键重叠、不应溢出标题栏、三键不被压缩。
注意 `set value + dispatch('input')` 对 Svelte 5 的 `bind:value` 无效，
若要脚本化验证必须用真实输入事件（CDP 的 `Input.insertText`）。

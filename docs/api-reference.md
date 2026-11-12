# 组件 Props 参考

对外 86 个组件里，83 个有 props 的列在这里，共 772 条。
本文件由 `scripts/gen-api-docs.mjs` 从 `src/lib/components/ui/*.svelte` 生成，**不要手改**：
改完组件执行 `pnpm docs:api` 重新生成，`pnpm docs:api:check`（CI 用）校验本文件有没有落后于源码。

- 每节的一句话说明取自[组件清单](components.md)，其余全部来自组件源码：类型取自
  `let { … }: { … } = $props()` 的类型块，说明取自类型块与解构处的 JSDoc
- 标 *(bind)* 的属性可双向绑定：`bind:value`、`bind:checked`、`bind:open`
- 「类型」是 TypeScript 类型；Svelte 5 里事件也是属性写法（`onclick={…}`），不写 `on:click`
- 表里没有列出的属性会随 `...rest` 透传到根元素——`class` / `style` / `id` / `aria-*` 因此在
  任何组件上都能用，不必等它变成一个 prop
- 剩下 3 个组件没有 props，所以不在本表：`ContextMenu`（右键菜单）、`ConfirmDialog`、
  `ErrorDialog`，用法见[工具函数与 API](api.md)
- 想看「怎么用」而不只是「有哪些属性」：[在线 demo](https://goossee6.github.io/goose-ui/) 每页都能在
  「效果 / 源码」之间切换，对应源码在 `demo/src/lib/demos/*.svelte`

## 索引

**基础组件** [Button](#button) · [Card](#card) · [Icon](#icon) · [Separator](#separator) · [AspectRatio](#aspectratio) · [Avatar](#avatar) · [ScrollArea](#scrollarea) · [Row](#row) · [Image](#image) · [CodeBlock](#codeblock)

**表单输入** [Form](#form) · [FormItem](#formitem) · [Label](#label) · [Input](#input) · [Textarea](#textarea) · [Select](#select) · [MultiSelect](#multiselect) · [CreatableSelect](#creatableselect) · [Combobox](#combobox) · [Checkbox](#checkbox) · [Radio](#radio) · [RadioGroup](#radiogroup) · [Toggle](#toggle) · [ToggleGroup](#togglegroup) · [Slider](#slider) · [Rating](#rating) · [PINInput](#pininput) · [DropZone](#dropzone)

**日期与时间** [DateField](#datefield) · [TimeField](#timefield) · [DateRangeField](#daterangefield) · [TimeRangeField](#timerangefield) · [Calendar](#calendar) · [RangeCalendar](#rangecalendar) · [DatePicker](#datepicker) · [DateRangePicker](#daterangepicker) · [TimePicker](#timepicker)

**数据展示** [DataTable](#datatable) · [DataList](#datalist) · [Tag](#tag) · [StatusBadge](#statusbadge) · [Pagination](#pagination) · [Collapsible](#collapsible) · [Accordion](#accordion) · [ProgressBar](#progressbar) · [ProgressBytes](#progressbytes) · [ProgressSlotBar](#progressslotbar) · [UsageBar](#usagebar) · [Meter](#meter) · [Typewriter](#typewriter) · [Carousel](#carousel) · [Time](#time) · [Countdown](#countdown)

**导航与布局** [Layout](#layout) · [Page](#page) · [PageHeader](#pageheader) · [Sidebar](#sidebar) · [Header](#header) · [Footer](#footer) · [TitleBar](#titlebar) · [Tabs](#tabs) · [TabsPanel](#tabspanel) · [NavigationMenu](#navigationmenu) · [Menubar](#menubar) · [DropdownMenu](#dropdownmenu) · [Toolbar](#toolbar) · [BackTop](#backtop)

**反馈** [Modal](#modal) · [Drawer](#drawer) · [AlertDialog](#alertdialog) · [Popover](#popover) · [Tooltip](#tooltip) · [LinkPreview](#linkpreview) · [Command](#command) · [NotificationProvider](#notificationprovider) · [NotificationItem](#notificationitem) · [Loading](#loading) · [Skeleton](#skeleton) · [Empty](#empty)

**其他** [PillTrack](#pilltrack) · [Cursor](#cursor) · [Background](#background) · [ThemeToggle](#themetoggle)

## 基础组件

### Button

按钮，variant 八档（primary/default/ghost/danger/danger-solid/text/text-primary/link）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `"primary" \| "default" \| "ghost" \| "danger" \| "danger-solid" \| "text" \| "text-primary" \| "link"` | `"default"` |  |
| `size` | `"xs" \| "small" \| "middle" \| "large" \| "icon" \| "icon-sm" \| "icon-md" \| "icon-lg" \| number` | `"middle"` | 枚举档位；number 时为任意高度（紧凑按钮） |
| `disabled` | `boolean` | `false` |  |
| `loading` | `boolean` | `false` |  |
| `type` | `"button" \| "submit"` | `"button"` |  |
| `class` | `string` | `""` |  |
| `style` | `string` | `""` | 追加的内联样式；与 size 算出的高度/字号/内边距合并（不要在这里重复写 height） |
| `icon` | `Component` | — |  |
| `iconRight` | `Component` | — |  |
| `iconSize` | `number` | `16` |  |
| `ariaLabel` | `string` | `''` |  |
| `element` *(bind)* | `HTMLButtonElement \| null` | `null` | 真实 DOM 按钮节点，供调用方 `bind:element` 拿到。 组件的 `bind:this` 给的是组件实例，拿不到 DOM；而对话框这类地方需要在 打开时把焦点放到某个按钮上（`AlertDialog` 就是），只能有这一条通道。 不要用它去改样式/挂事件——那是 props 的职责。 |
| `children` | `Snippet` | — |  |
| `onclick` | `(event: MouseEvent) => void` | — |  |

```ts
import { Button } from 'goose-ui';
```

### Card

卡片容器，支持 title + right header

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `title` | `string` | — |  |
| `anchor` | `string` | `''` | 把这张卡片注册为页内目录（`Page` 的 `toc`）的锚点。 传了 id：卡片根节点加上 `id` 与 `data-toc-title`（文字取 `title`）， 目录就会在对应位置多一条目、点击可跳转到这里。 适用于页面用卡片分节、又不希望额外插入 h2/h3 标题元素的场景。 不传：卡片与目录无关，原有行为不变。 |
| `anchorLevel` | `2 \| 3` | `2` | 锚点层级，2 = 顶层条目（默认），3 = 挂在上一级下面的子条目 |
| `right` | `Snippet` | — |  |
| `children` | `Snippet` | — |  |

```ts
import { Card } from 'goose-ui';
```

### Icon

图标包装器（传入 `@lucide/svelte` 图标组件，支持 size/class/spin 旋转动画）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `icon` | `Component<{ size?: number; class?: string }>` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `spin` | `boolean` | `false` | 加载旋转动画 |
| `size` | `number` | `20` |  |

```ts
import { Icon } from 'goose-ui';
```

### Separator

分割线，横/竖/虚线/文字分隔

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |  |
| `dashed` | `boolean` | `false` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `children` | `Snippet` | — |  |

```ts
import { Separator } from 'goose-ui';
```

### AspectRatio

等比容器，按比例裁剪内容

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `ratio` | `string \| number` | `'16 / 9'` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `children` | `Snippet` | — |  |

```ts
import { AspectRatio } from 'goose-ui';
```

### Avatar

头像（首字母回退 + 状态点 + size/shape）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `src` | `string` | `''` |  |
| `alt` | `string` | `''` |  |
| `name` | `string` | `''` |  |
| `size` | `'small' \| 'middle' \| 'large' \| number` | `'middle'` |  |
| `shape` | `'circle' \| 'square'` | `'circle'` |  |
| `status` | `'online' \| 'offline' \| 'busy' \| 'away'` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `children` | `Snippet` | — |  |

```ts
import { Avatar } from 'goose-ui';
```

### ScrollArea

滚动区（自定义滚动条、role=region）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `maxHeight` | `string` | `''` |  |
| `orientation` | `'vertical' \| 'horizontal' \| 'both'` | `'vertical'` |  |
| `label` | `string` | `'可滚动区域'` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `children` | `Snippet` | — |  |

```ts
import { ScrollArea } from 'goose-ui';
```

### Row

水平排列行（`gap` sm/md/lg + `align` + 自动换行）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `gap` | `'sm' \| 'md' \| 'lg'` | `'md'` |  |
| `align` | `'start' \| 'center' \| 'stretch'` | `'center'` |  |
| `wrap` | `boolean` | `true` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `children` | `Snippet` | — |  |

```ts
import { Row } from 'goose-ui';
```

### Image

图片（懒加载 + 失败兜底 + 点击放大预览）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `src` | `string` | `''` |  |
| `alt` | `string` | `''` |  |
| `width` | `string` | `''` |  |
| `height` | `string` | `''` |  |
| `fit` | `'cover' \| 'contain' \| 'fill' \| 'none'` | `'cover'` |  |
| `rounded` | `boolean` | `false` |  |
| `preview` | `boolean` | `true` |  |
| `lazy` | `boolean` | `true` |  |
| `fallback` | `import('svelte').Snippet` | — |  |
| `onerror` | `() => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Image } from 'goose-ui';
```

### CodeBlock

代码块（语言标签 + 一键复制 + 注释/字符串/关键字轻量高亮）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `code` | `string` | `''` |  |
| `language` | `string` | `''` |  |
| `showHeader` | `boolean` | `true` |  |
| `copyable` | `boolean` | `true` |  |
| `maxHeight` | `string` | `''` |  |
| `oncopy` | `(ok: boolean) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { CodeBlock } from 'goose-ui';
```

## 表单输入

### Form

表单容器与表单项（context 传递 layout/labelWidth，必填星号 + 错误态）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `layout` | `'horizontal' \| 'vertical'` | `'vertical'` |  |
| `labelWidth` | `string` | `'96px'` |  |
| `disabled` | `boolean` | `false` |  |
| `onsubmit` | `(e: SubmitEvent) => void` | — |  |
| `children` | `import('svelte').Snippet` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Form } from 'goose-ui';
```

### FormItem

表单容器与表单项（context 传递 layout/labelWidth，必填星号 + 错误态）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | `''` |  |
| `required` | `boolean` | `false` |  |
| `error` | `string` | `''` |  |
| `hint` | `string` | `''` |  |
| `htmlFor` | `string` | `''` |  |
| `children` | `import('svelte').Snippet` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { FormItem } from 'goose-ui';
```

### Label

表单标签

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `for` | `string` | `''` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `children` | `Snippet` | — |  |

```ts
import { Label } from 'goose-ui';
```

### Input

输入框，clearable/Enter 回调/digitsOnly/status，prefix/suffix 为 snippet

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | `''` |  |
| `name` | `string` | `''` |  |
| `value` *(bind)* | `string` | `''` |  |
| `placeholder` | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `readonly` | `boolean` | `false` |  |
| `clearable` | `boolean` | `true` |  |
| `prefix` | `Snippet` | — | 输入框前缀区（snippet，可放图标/文本/按钮） |
| `suffix` | `Snippet` | — | 输入框后缀区（snippet，可放图标/文本/可点击按钮） |
| `status` | `'error' \| 'warning'` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `type` | `string` | `'text'` |  |
| `onkeydown` | `(e: KeyboardEvent) => void` | — |  |
| `onenter` | `() => void` | — |  |
| `digitsOnly` | `boolean` | `false` |  |
| `onClear` | `() => void` | — |  |
| `onclick` | `(e: MouseEvent) => void` | — |  |

```ts
import { Input } from 'goose-ui';
```

### Textarea

多行文本域，rows/status/maxlength + resize: vertical

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | `''` |  |
| `name` | `string` | `''` |  |
| `value` *(bind)* | `string` | `''` |  |
| `placeholder` | `string` | `''` |  |
| `rows` | `number` | `3` |  |
| `disabled` | `boolean` | `false` |  |
| `readonly` | `boolean` | `false` |  |
| `maxlength` | `number` | — |  |
| `status` | `'error' \| 'warning'` | — |  |
| `ariaLabel` | `string` | `''` |  |
| `oninput` | `(e: Event) => void` | — |  |
| `onkeydown` | `(e: KeyboardEvent) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Textarea } from 'goose-ui';
```

### Select

下拉选择，支持键盘导航、meta 标签、分组吸顶（组头），无滚动条+两侧箭头滚动区；combobox/listbox ARIA 关联（aria-controls / aria-activedescendant）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` *(bind)* | `T` | — |  |
| `onchange` | `(v: T) => void` | — |  |
| `options` | `Option[]` | `[]` |  |
| `placeholder` | `string` | `'请选择'` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `ariaLabel` | `string` | `''` |  |
| `id` | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `width` | `string` | `'100%'` |  |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` |  |

```ts
import { Select } from 'goose-ui';
```

### MultiSelect

多选下拉，支持 badge 标签与分组吸顶（组头）、Escape/方向键/Enter 键盘操作

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `Option[]` | `[]` |  |
| `values` *(bind)* | `string[]` | `[]` |  |
| `placeholder` | `string` | `"请选择"` |  |
| `disabled` | `boolean` | `false` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { MultiSelect } from 'goose-ui';
```

### CreatableSelect

可新建搜索选择器，支持静态/异步数据源；搜索框 role=combobox，选项列表 role=listbox

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` *(bind)* | — | `''` |  |
| `items` | — | `[]` |  |
| `loadItems` | — | — |  |
| `placeholder` | — | `'请选择'` |  |
| `title` | — | `'请选择'` |  |
| `disabled` | — | `false` |  |
| `class` | — | `''` |  |
| `style` | — | `''` |  |
| `createText` | — | `'新建'` |  |
| `onCreateItem` | — | — |  |
| `loadingIndicator` | — | — |  |

```ts
import { CreatableSelect } from 'goose-ui';
```

### Combobox

组合框（输入过滤 + 分组吸顶 + role=combobox/listbox/option 键盘导航）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `options` | `ComboboxOption[]` | `[]` |  |
| `value` *(bind)* | `string` | `''` |  |
| `placeholder` | `string` | `'请选择…'` |  |
| `disabled` | `boolean` | `false` |  |
| `clearable` | `boolean` | `true` |  |
| `filter` | `boolean` | `true` |  |
| `onchange` | `(value: string) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Combobox } from 'goose-ui';
```

### Checkbox

复选框，尺寸档 small/middle/large + 双向绑定 + 半选态（indeterminate）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `checked` *(bind)* | `boolean` | `false` |  |
| `indeterminate` *(bind)* | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `ariaLabel` | `string` | `''` |  |
| `onchange` | `(e: Event) => void` | — |  |
| `size` | `'small' \| 'middle' \| 'large'` | `'middle'` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Checkbox } from 'goose-ui';
```

### Radio

单个单选项（一般直接用下面的 RadioGroup，单独用时需自管选中态）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` *(bind)* | `string` | `''` |  |
| `checked` *(bind)* | `boolean` | `false` |  |
| `name` | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `size` | `'small' \| 'middle' \| 'large'` | `'middle'` |  |
| `onchange` | `(checked: boolean) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `children` | `Snippet` | — |  |

```ts
import { Radio } from 'goose-ui';
```

### RadioGroup

单选组（pill 分段轨道，context 注入）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `options` | `RadioGroupOption[]` | `[]` |  |
| `value` *(bind)* | `string` | `''` |  |
| `name` | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |  |
| `onchange` | `(value: string) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { RadioGroup } from 'goose-ui';
```

### Toggle

iOS 风格开关，带弹性动画

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `checked` *(bind)* | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `loading` | `boolean` | `false` | 加载中：滑块换成 spinner，并阻止交互 |
| `ariaLabel` | `string` | `""` |  |
| `title` | `string` | `""` |  |
| `class` | `string` | `""` |  |
| `onclick` | `(e: MouseEvent) => void` | — |  |
| `size` | `"small" \| "middle" \| "large"` | `"middle"` |  |
| `style` | `string` | `""` |  |
| `onStyle` | `string` | `""` | 开启态轨道的内联样式（常用来覆盖背景/边框色） |
| `offStyle` | `string` | `""` | 关闭态轨道的内联样式 |
| `thumbStyle` | `string` | `""` | 滑块的内联样式（两态共用，自定义轨道色后用来保证对比度） |
| `optimistic` | `boolean` | `true` | 点击时是否自行翻转 checked，默认 true。 传 false 表示「受控」：开关只反映父级给的值，点击仅回调 onclick， 由父级决定何时改 checked。异步操作（挂起 / 恢复这种要等后端确认的） 必须用受控模式 —— 否则开关先自己翻过去、父级随后用还没更新的 数据改回来，用户看到的就是状态来回跳。 |
| `minLoadingMs` | `number` | `DEFAULT_MIN_LOADING_MS` | loading 最短展示时长（ms），默认 1000。异步确认本身就慢的场景建议调小 |

```ts
import { Toggle } from 'goose-ui';
```

### ToggleGroup

单选/多选切换组，default/outline 变体

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `ToggleGroupItem[]` | `[]` |  |
| `value` *(bind)* | `string[]` | `[]` |  |
| `multiple` | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `variant` | `'default' \| 'outline'` | `'default'` |  |
| `size` | `'small' \| 'middle' \| 'large'` | `'middle'` |  |
| `onchange` | `(value: string[]) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { ToggleGroup } from 'goose-ui';
```

### Slider

滑块（pointer 捕获拖拽 + 键盘；外部改值 0.2s 补间，拖动中不补间）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` *(bind)* | `number` | `0` |  |
| `min` | `number` | `0` |  |
| `max` | `number` | `100` |  |
| `step` | `number` | `1` |  |
| `disabled` | `boolean` | `false` |  |
| `label` | `string` | `''` |  |
| `format` | `(n: number) => string` | — |  |
| `onchange` | `(value: number) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Slider } from 'goose-ui';
```

### Rating

评分（半星/只读/键盘 slider 语义）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` *(bind)* | `number` | `0` |  |
| `max` | `number` | `5` |  |
| `size` | `'small' \| 'middle' \| 'large'` | `'middle'` |  |
| `readonly` | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `allowHalf` | `boolean` | `false` |  |
| `onchange` | `(value: number) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Rating } from 'goose-ui';
```

### PINInput

验证码输入（跳格/粘贴/退格回跳，`group`+`separator` 分组）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `length` | `number` | `4` |  |
| `value` *(bind)* | `string` | `''` |  |
| `mask` | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `placeholder` | `string` | `''` |  |
| `separator` | `string` | `''` |  |
| `group` | `number` | `0` |  |
| `numeric` | `boolean` | `true` |  |
| `oncomplete` | `(value: string) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { PINInput } from 'goose-ui';
```

### DropZone

拖拽上传区

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `accept` | `string` | `''` |  |
| `multiple` | `boolean` | `false` |  |
| `placeholder` | `string` | `'拖拽文件到此处'` |  |
| `hint` | `string` | `''` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `ondrop` | `(files: File[]) => void` | — |  |

```ts
import { DropZone } from 'goose-ui';
```

## 日期与时间

### DateField

日期分段字段（`YYYY-MM-DD`，分段自动跳格/粘贴跨段/聚焦全选/失焦校验：月份 ≤12、日 ≤当月天数、闰年）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` *(bind)* | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `ariaLabel` | `string` | `'日期'` |  |
| `onchange` | `(value: string) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { DateField } from 'goose-ui';
```

### TimeField

时间分段字段（`HH:mm[:ss]`，`seconds` 可选段；时分秒上限 23/59/59，失焦纠正并补零）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` *(bind)* | `string` | `''` |  |
| `seconds` | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `ariaLabel` | `string` | `'时间'` |  |
| `onchange` | `(value: string) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { TimeField } from 'goose-ui';
```

### DateRangeField

日期范围分段字段（start/end 双向绑定）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `start` *(bind)* | `string` | `''` |  |
| `end` *(bind)* | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `separator` | `string` | `'→'` |  |
| `onchange` | `(range: { start: string; end: string }) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { DateRangeField } from 'goose-ui';
```

### TimeRangeField

时间范围分段字段

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `start` *(bind)* | `string` | `''` |  |
| `end` *(bind)* | `string` | `''` |  |
| `seconds` | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `separator` | `string` | `'→'` |  |
| `onchange` | `(range: { start: string; end: string }) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { TimeRangeField } from 'goose-ui';
```

### Calendar

日历网格（月导航、min/max、disabledDate、方向键/PgUp/PgDn）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` *(bind)* | `string` | `''` |  |
| `min` | `string` | `''` |  |
| `max` | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `disabledDate` | `(iso: string) => boolean` | — |  |
| `weekStart` | `0 \| 1` | `1` |  |
| `showToday` | `boolean` | `true` |  |
| `onchange` | `(value: string) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Calendar } from 'goose-ui';
```

### RangeCalendar

范围日历（先起点后终点，悬停预览，清除；方向键移动光标、Enter 提交、PgUp/PgDn 翻月）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `start` *(bind)* | `string` | `''` |  |
| `end` *(bind)* | `string` | `''` |  |
| `min` | `string` | `''` |  |
| `max` | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `disabledDate` | `(iso: string) => boolean` | — |  |
| `weekStart` | `0 \| 1` | `1` |  |
| `onchange` | `(range: { start: string; end: string }) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { RangeCalendar } from 'goose-ui';
```

### DatePicker

日期选择器（触发器 + 浮层 Calendar，自动翻转、清除）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` *(bind)* | `string` | `''` |  |
| `min` | `string` | `''` |  |
| `max` | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `clearable` | `boolean` | `true` |  |
| `placeholder` | `string` | `'选择日期…'` |  |
| `disabledDate` | `(iso: string) => boolean` | — |  |
| `onchange` | `(value: string) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { DatePicker } from 'goose-ui';
```

### DateRangePicker

范围选择器（触发器 + 浮层 RangeCalendar）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `start` *(bind)* | `string` | `''` |  |
| `end` *(bind)* | `string` | `''` |  |
| `min` | `string` | `''` |  |
| `max` | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `clearable` | `boolean` | `true` |  |
| `placeholder` | `string` | `'选择日期范围…'` |  |
| `disabledDate` | `(iso: string) => boolean` | — |  |
| `onchange` | `(range: { start: string; end: string }) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { DateRangePicker } from 'goose-ui';
```

### TimePicker

时间选择器（时/分(/秒) 惯性滚轮 Wheel，拖拽+吸附+停稳提交，「现在」快捷）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` *(bind)* | `string` | `''` |  |
| `showSeconds` | `boolean` | `true` |  |
| `disabled` | `boolean` | `false` |  |
| `clearable` | `boolean` | `true` |  |
| `placeholder` | `string` | `'选择时间…'` |  |
| `hourStep` | `number` | `1` |  |
| `minuteStep` | `number` | `1` |  |
| `secondStep` | `number` | `1` |  |
| `onchange` | `(value: string) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { TimePicker } from 'goose-ui';
```

## 数据展示

### DataTable

数据表格，支持排序、高亮、右键菜单、按占比 + 最小/最大约束分配列宽；表头圆角 + 吸顶，行 hover 为滑动 pill

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `rows` | `T[]` | `[]` |  |
| `columns` | `Column<T>[]` | `[]` |  |
| `highlight` | `string` | `''` |  |
| `contextMenu` | `boolean` | `true` |  |
| `menu` | `string` | `''` |  |
| `loading` | `boolean` | `false` |  |
| `emptyText` | `string` | `'暂无数据'` |  |
| `disabled` | `(row: T) => boolean` | — |  |
| `actions` | `Snippet<[T]>` | — |  |
| `cell` | `Snippet<[string, T]>` | — |  |
| `rowKey` | `(row: T, index: number) => string \| number` | — |  |
| `actionsPercent` | `number \| string` | — | 操作列的宽度声明，与 `Column.width` 同一种写法。 不传时占 1 份（等同 `Column` 不写 width 的列）。 |
| `headerBleed` | `number` | `0` | 表头磨砂层左右外扩的像素数（默认 0 不扩）。 表格自己滚时表头贴着自己的边，磨砂只需要盖住它本身； 但当表格和上方的列表 header 一起放在「外层滚动容器」里、 由外层滚时，表头会平移到容器边缘 —— 这时容器两侧的内边距 会露出一条没有磨砂的窄缝。传入该内边距的数值，磨砂层就能铺到边。 |
| `maxHeight` | `string` | `'70vh'` | 容器最大高度，超出即由表格自己滚动（表头是 sticky，滚动时保持吸顶）。 默认 '70vh'：即便外面没给高度，行数一多也不会把整页撑长、 表头更不会跟着页面滚走。传 'none' 关闭，交给父容器决定高度。 |
| `stickyHeader` | `boolean` | `true` | 表头是否吸顶（`position: sticky`），默认 true。 常规用法（一页一两张表）保持吸顶，滚动时能一直看到列名。 但 sticky 表头处在可滚动容器里时，每一帧都要重新计算吸顶位置 —— 一页塞十几张表、且表格又嵌在别的滚动容器里时，这笔开销会明显拖慢帧率 （实测 demo 表格页：13.0ms/帧、满帧率 54% → 关掉后 9.8ms、满帧 95%）。 这种极端场景可以传 false 换性能，代价是表头会跟着行一起滚走。 注意：关掉吸顶后仍保留纯色底色与下边框，表头与数据行在视觉上依然分得开。 |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { DataTable } from 'goose-ui';
```

### DataList

数据列表，带空状态与可选的内置 header（`title`/`header`/`headerCenter`/`headerRight` 等原样透传）；行 hover 同样走滑动 pill

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `rows` | `T[]` | `[]` |  |
| `emptyText` | `string` | `'暂无数据'` |  |
| `children` | `Snippet<[T]>` | — |  |
| `bindContainer` | `(el: HTMLElement \| null) => void` | — |  |
| `rowKey` | `(row: T, index: number) => string \| number` | — |  |
| `title` | `string` | — | header 标题（纯文本），对应 Header 的 title |
| `header` | `Snippet` | — | 对应 Header 的 left：放搜索框、面包屑、「共 N 项」等任意内容 |
| `headerCenter` | `Snippet` | — | 对应 Header 的 center |
| `headerRight` | `Snippet` | — | 对应 Header 的 right：按钮、筛选器等 |
| `headerId` | `string` | — | 传给 Header 的 id，可配合 <a href> 定位 |
| `headerClass` | `string` | `''` | 传给 Header 的附加类名 |
| `headerStyle` | `string` | `''` | 传给 Header 的内联样式；覆盖 --header-h 即可改这条 header 的高度 |
| `headerSticky` | `boolean` | `true` | header 滚动时是否吸顶，默认 true |
| `dataTableHeader` | `boolean` | `false` | 「像表格表头那样」使用：行盒两侧各缩 inset px（与 hover pill 同宽）， header 的磨砂与分隔线仍铺到容器边缘。默认 false（适配已有内边距的卡片）。 |
| `inset` | `number` | `dataTableHeader ? 16 : 0` | 行盒（以及 hover pill）两侧的横向内缩像素；默认 dataTableHeader 下 16，否则 0 |
| `animateRows` | `number` | `0` | 行重排（排序/过滤改变顺序）时的过渡时长（ms），0 = 不动画（默认）。 需要 rowKey 给出稳定的行身份，否则节点会被当成「换了一行」而不是「挪了位置」。 开启后每次列表更新都会量一遍行的位置（FLIP 的前后两次 rect）， 行数上千且更新频繁的列表建议保持关闭。 |
| `maxHeight` | `string` | `'70vh'` | 容器最大高度，超出即由列表自己滚动（内置 header 是吸顶的）。 默认 '70vh'：外面不给高度时行数一多也不会把整页撑长；传 'none' 关闭。 |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { DataList } from 'goose-ui';
```

### Tag

标签（6 变体 × 3 尺寸 + 圆点 + 可关闭）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `\| 'default' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` |  |
| `size` | `'small' \| 'middle' \| 'large'` | `'middle'` |  |
| `dot` | `boolean` | `false` |  |
| `closable` | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `onclose` | `() => void` | — |  |
| `children` | `import('svelte').Snippet` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Tag } from 'goose-ui';
```

### StatusBadge

状态徽章

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `'normal' \| 'warning'` | `'normal'` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `children` | `import('svelte').Snippet` | — |  |

```ts
import { StatusBadge } from 'goose-ui';
```

### Pagination

分页（siblingCount 省略号折叠、showQuickJumper 跳页输入）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `page` *(bind)* | `number` | `1` |  |
| `total` | `number` | `0` |  |
| `pageSize` | `number` | `10` |  |
| `siblingCount` | `number` | `1` |  |
| `showTotal` | `boolean` | `true` |  |
| `showQuickJumper` | `boolean` | `false` |  |
| `onchange` | `(page: number) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Pagination } from 'goose-ui';
```

### Collapsible

折叠面板（展开/收起高度过渡）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` | `boolean` | `false` |  |
| `disabled` | `boolean` | `false` |  |
| `onchange` | `(open: boolean) => void` | — |  |
| `variant` | `'card' \| 'plain'` | `'card'` | card：独立卡片（默认）；plain：无边框/内边距，适合嵌入列表或自定义容器 |
| `chevron` | `'end' \| 'start' \| 'none'` | `'end'` | 内置触发器的箭头位置；none 表示自绘箭头（配合 header 使用） |
| `lazy` | `boolean` | `false` | 收起时不渲染 children（不做收起动画），长列表可省下大量 DOM |
| `trigger` | `Snippet` | — |  |
| `header` | `Snippet<[{ open: boolean; contentId: string }]>` | — | 自定义头部：提供时用普通 div 代替内置 button，由调用方自己渲染 触发器（可包含多个按钮），并拿到 contentId 设 aria-controls。 |
| `children` | `Snippet` | — |  |
| `class` | `string` | `''` |  |
| `triggerClass` | `string` | `''` |  |
| `bodyClass` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Collapsible } from 'goose-ui';
```

### Accordion

手风琴（单开/多开/collapsible，复用 Collapsible）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `AccordionItem[]` | `[]` |  |
| `value` *(bind)* | `string[]` | `[]` |  |
| `multiple` | `boolean` | `false` |  |
| `collapsible` | `boolean` | `true` |  |
| `onchange` | `(value: string[]) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Accordion } from 'goose-ui';
```

### ProgressBar

渐变进度条

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `percent` | `number` | `0` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { ProgressBar } from 'goose-ui';
```

### ProgressBytes

上传进度（字节/速度/ETA）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `fileName` | `string` | `''` |  |
| `progress` | `number` | `0` |  |
| `speed` | `string` | `''` |  |
| `eta` | `string` | `''` |  |
| `loadedBytes` | `number` | `0` |  |
| `totalBytes` | `number` | `0` |  |
| `totalParts` | `number` | `0` |  |
| `partIndex` | `number` | `0` |  |
| `onCancel` | `() => void` | — |  |
| `disabled` | `boolean` | `false` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { ProgressBytes } from 'goose-ui';
```

### ProgressSlotBar

分片上传进度

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `number` | `number` | `0` |  |
| `part` | `number` | — |  |
| `total` | `number` | `0` |  |
| `loaded` | `number` | `0` |  |
| `totalSize` | `number` | `0` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { ProgressSlotBar } from 'goose-ui';
```

### UsageBar

用量/限额进度条

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | `''` |  |
| `value` | `number` | `0` |  |
| `limit` | `number` | `0` |  |
| `used` | `number` | — |  |
| `total` | `number` | — |  |
| `formatValue` | `(n: number) => string` | `formatNum` |  |
| `barHeight` | `string` | `'6px'` |  |
| `labelRight` | `Snippet<[{ value: number; limit: number; percent: number; overQuota: boolean; formatValue: (n: number) => string }]>` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { UsageBar } from 'goose-ui';
```

### Meter

度量条（threshold 转高亮 / critical 转危险色，role=progressbar）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `number` | `0` |  |
| `min` | `number` | `0` |  |
| `max` | `number` | `100` |  |
| `label` | `string` | `''` |  |
| `threshold` | `number` | `80` |  |
| `critical` | `number` | `100` |  |
| `format` | `(n: number) => string` | — |  |
| `labelRight` | `Snippet<[{ value: number; percent: number }]>` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Meter } from 'goose-ui';
```

### Typewriter

打字机效果，支持逐字文本或淡入 Snippet；**默认不启用**，需显式传 `autoPlay` 才播放（不传就是静态文本）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | `''` |  |
| `children` | `Snippet` | — |  |
| `duration` | `number` | `2000` |  |
| `speed` | `number` | — |  |
| `trigger` | `unknown` | — |  |
| `autoPlay` | `boolean` | `false` | 默认不启用打字机：只静态展示 text / children。传 true 才逐字播放 |
| `cursor` | `boolean` | `true` |  |
| `onDone` | `() => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Typewriter } from 'goose-ui';
```

### Carousel

轮播图（手动/自动播放、悬停暂停、首尾循环）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `CarouselItem[]` | `[]` |  |
| `autoplay` | `boolean` | `false` |  |
| `interval` | `number` | `3000` |  |
| `loop` | `boolean` | `true` |  |
| `showArrows` | `boolean` | `true` |  |
| `showDots` | `boolean` | `true` |  |
| `pauseOnHover` | `boolean` | `true` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `onchange` | `(index: number) => void` | — |  |

```ts
import { Carousel } from 'goose-ui';
```

### Time

实时时钟（time/date/datetime + 12h 制）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `mode` | `'time' \| 'date' \| 'datetime'` | `'time'` |  |
| `showSeconds` | `boolean` | `true` |  |
| `hour12` | `boolean` | `false` |  |
| `showDate` | `boolean` | `true` |  |
| `interval` | `number` | `1000` |  |
| `prefix` | `string` | `''` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Time } from 'goose-ui';
```

### Countdown

倒计时（duration/target 双模式 + 暂停 + 归零回调）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `duration` | `number` | `0` |  |
| `target` | `number` | `0` |  |
| `showDays` | `boolean` | `true` |  |
| `separator` | `string` | `':'` |  |
| `onfinish` | `() => void` | — |  |
| `onchange` | `(remaining: number) => void` | — |  |
| `autostart` | `boolean` | `true` |  |
| `paused` *(bind)* | `boolean` | `false` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Countdown } from 'goose-ui';
```

## 导航与布局

### Layout

应用外壳纯布局（顶栏 / 可选侧栏 / 内容区插槽，不内置组件，自行组合 TitleBar、Sidebar 或 Drawer）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `titlebar` | `Snippet` | — | 顶部区域（通常放 TitleBar） |
| `aside` | `Snippet` | — | 左侧区域（通常放 Sidebar；省略则不渲染，内容区占满整宽） |
| `children` | `Snippet` | — | 内容区 |
| `scroll` | `boolean` | `true` | 内容卡片整页滚动；false = 框架不滚、页内滚动区自理 |
| `resize` | `boolean` | `false` | Wails 窗口支持：全域拖拽调整 + 四角手柄（浏览器环境无效果） |
| `framed` | `boolean` | `true` | 内容区是否画成卡片（边框 / 圆角 / 底色），默认 true。 传 false 得到一块「裸容器」：适合首页这类要把背景铺满整窗、或者内容 自己画分区的场景。以前这类需求只能靠 `:global(.layout-content)` 加一串 `!important` 把卡片剥掉 —— 那是使用方不该写的样式， 也会在升级时随内部类名一起失效。 内边距与 `--layout-pad-x` 不跟着变：那是 `Page` / 吸顶 `Header` 对齐的依据，剥掉会让页头错位。 |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Layout } from 'goose-ui';
```

### Page

页面容器（根布局 + 页头 + 内容区间距一次到位）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `''` |  |
| `description` | `string` | `''` |  |
| `maxWidth` | `string` | — | 内容限宽，如 '800px' |
| `transparent` | `boolean` | `false` | 自身与滚动区底色透明，露出下层整页背景（配合 Background fixed 使用） |
| `right` | `Snippet` | — |  |
| `active` | `boolean` | `undefined` | keep-alive 模式：由该 prop 控制显隐与进入/离开过渡，页面常驻不卸载。 不传则配合外层 {#if} 使用，挂载/卸载时自动播放同一套过渡。 |
| `transition` | `boolean` | `true` | 关闭过渡（嵌套 Page 场景） |
| `toc` | `boolean` | `false` | 显示页内目录（右侧一列 `--toc-width` 宽的 sticky 目录）。 目录内容自动从本页的锚点摘出来，不用手写： 带 id 的 `h2` / `h3`，或任何带 `data-toc-title` 的元素（`Card`、`PropsTable` 都支持 `anchor` prop 生成这种锚点）。给容器加 `data-toc-skip` 可排除整段。 锚点跳转要留出吸顶页头的高度，`.toc-content` 已统一给 `scroll-margin-top`。 |
| `tocTitle` | `string` | `'本页目录'` | 目录小标题，传空串则不渲染 |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `children` | `Snippet` | — |  |
| `footer` | `Snippet` | — | 页脚：渲染在内容区末尾，随内容滚；内容不足一屏时吸内容区底 |

```ts
import { Page } from 'goose-ui';
```

### PageHeader

页面标题栏（标题 + 描述 + children 附加行 + 右侧操作区，窄屏自动换行）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `''` |  |
| `description` | `string` | `''` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `children` | `Snippet` | — |  |
| `right` | `Snippet` | — |  |

```ts
import { PageHeader } from 'goose-ui';
```

### Sidebar

悬浮岛式侧边栏（导航分组 + 顶层项穿插 + 折叠 + popover + endItems/footer）。尺寸全部由组件内的一组 `--sb-*` 变量派生，改一个值整列跟着走

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `groups` | `SidebarEntry[]` | `[]` |  |
| `activeTab` *(bind)* | `string` | `''` |  |
| `mode` | `'float' \| 'flat'` | `'float'` |  |
| `shadow` | `boolean` | `mode === 'float'` |  |
| `radius` | `boolean` | `mode === 'float'` |  |
| `collapsed` *(bind)* | `boolean` | `false` |  |
| `embedded` | `boolean` | `false` |  |
| `onchange` | `(value: string) => void` | — |  |
| `footer` | `Snippet` | — |  |
| `themeToggle` | `boolean` | `true` | footer 区尾部（版本等 footer 内容之后）显示主题切换按钮 |
| `endItems` | `SidebarTabItem[]` | — | 列表结尾固定项：渲染在导航列表末尾（有余量时贴底），参与 activeTab、共享 pill 动画 |
| `header` | `Snippet` | — |  |
| `class` | `string` | `''` |  |
| `width` | `number \| string` | — | 侧栏宽度：number 按 px；直接改写内部布局变量 --sidebar-w |
| `style` | `string` | `''` |  |

```ts
import { Sidebar } from 'goose-ui';
```

### Header

固定顶部导航栏（标题 + 操作区 + 自定义插槽）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `''` |  |
| `height` | `string` | `'52px'` |  |
| `id` | `string` | `''` | 元素 id，可配合 <a href> 定位 |
| `sticky` | `boolean` | `true` | 滚动时吸顶，默认 true；放在弹层等不需要吸顶的场景可关掉 |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `left` | `Snippet` | — |  |
| `center` | `Snippet` | — |  |
| `right` | `Snippet` | — |  |
| `children` | `Snippet` | — |  |

```ts
import { Header } from 'goose-ui';
```

### Footer

页脚（左右插槽 + 链接列表 + 版权行 + 吸底）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `border` | `boolean` | `true` |  |
| `sticky` | `boolean` | `false` |  |
| `copyright` | `string` | `''` |  |
| `links` | `{ label: string; href?: string; onclick?: () => void }[]` | `[]` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `left` | `import('svelte').Snippet` | — |  |
| `right` | `import('svelte').Snippet` | — |  |
| `children` | `import('svelte').Snippet` | — |  |

```ts
import { Footer } from 'goose-ui';
```

### TitleBar

自绘标题栏（窗口控制经 `windowApi` 注入，库不依赖桌面 runtime；`searchable` 开内联搜索，见[应用外壳](shell.md#titlebar-标题栏)；Wails3 见 demo TitleBar 页）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | `string` | `''` |  |
| `logo` | `string \| Component<{ size?: number; class?: string }>` | — |  |
| `subtitle` | `string` | — |  |
| `theme` | `'light' \| 'dark'` | `'light'` |  |
| `onThemeToggle` | `(e: MouseEvent) => void` | — |  |
| `controls` | `Snippet` | — | 自定义按钮区 snippet（渲染在主题键之前，与默认键共存） |
| `windowControls` | `boolean` | `true` | false 不渲染默认窗口三键（如浏览器环境） |
| `windowApi` | `WindowController` | — | 窗口控制实现。未传时三键渲染为禁用（纯浏览器预览）； Wails3：传入包好 @wailsio/runtime Window 的适配器 |
| `searchable` | `boolean` | `false` | 显示内联搜索框（默认 false 不显示）。开启后输入即出下拉结果， ↑↓ 移动、Enter 选中、Esc 关闭 |
| `searchItems` | `TitleBarSearchItem[]` | `[]` | 搜索候选项 |
| `searchPlaceholder` | `string` | `'搜索…'` |  |
| `searchEmptyText` | `string` | `'无匹配结果'` |  |
| `onSearchSelect` | `(item: TitleBarSearchItem) => void` | — | 选中回调（选中后自动收起下拉） |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { TitleBar } from 'goose-ui';
```

### Tabs

标签页（分段/下划线/垂直模式 + 键盘导航）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `readonly TabItem[]` | `[]` |  |
| `value` *(bind)* | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `mode` | `'segmented' \| 'underline' \| 'vertical'` | `'segmented'` |  |
| `class` | `string` | `''` |  |
| `onchange` | `(value: string) => void` | — |  |
| `size` | `'small' \| 'middle' \| 'large'` | `'middle'` |  |
| `lead` | `Snippet` | — | 提供后（含空 snippet）标签条会并入卡片式标题栏行（surface-2 背景 + 下边框 + 内边距）。 lead 内容渲染在标题栏左侧、标签条在右；空 lead 时标题栏只含标签条（单子元素靠左）。 |
| `children` | `Snippet` | — | 面板内容（放 TabsPanel 用，需在 Tabs 内部才能共享选中状态） |
| `style` | `string` | `''` |  |

```ts
import { Tabs } from 'goose-ui';
```

### TabsPanel

标签页内容面板（value 匹配选中项时渲染）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | 对应的 tab value，与 Tabs 的 value 匹配时渲染 |
| `children` | `Snippet` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { TabsPanel } from 'goose-ui';
```

### NavigationMenu

导航菜单（面板定位/翻转，链接 + 描述）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `NavMenuItem[]` | `[]` |  |
| `active` | `string` | `''` |  |
| `onselect` | `(value: string) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { NavigationMenu } from 'goose-ui';
```

### Menubar

菜单栏（横向方向键 + 已展开时自动切换菜单；复用 DropdownMenu）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `menus` | `MenubarMenu[]` | `[]` |  |
| `onselect` | `(menuValue: string, item: DropdownMenuItem, index: number) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Menubar } from 'goose-ui';
```

### DropdownMenu

下拉菜单（flip 测量、键盘导航；`disabled` prop 可禁用触发器）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` *(bind)* | `boolean` | `false` |  |
| `items` | `DropdownMenuItem[]` | `[]` |  |
| `placement` | `'bottom-start' \| 'bottom-end' \| 'top-start' \| 'top-end'` | `'bottom-start'` |  |
| `disabled` | `boolean` | `false` | 禁用：触发器不可聚焦/展开（Menubar 用它让禁用菜单真的不可点开） |
| `triggerMenu` | `string` | `''` | 透传到触发器 button 的 data-menu，供 Menubar 之类的外层按名定位真实焦点元素 |
| `triggerVariant` | `'primary' \| 'default' \| 'ghost' \| 'danger' \| 'link'` | `'default'` | 触发器就是一个标准 Button：外观全部交给它的 variant / size。 默认 default + middle，需要更紧凑的入口传 ghost + small。 |
| `triggerSize` | `'small' \| 'middle' \| 'large' \| 'icon' \| 'icon-sm' \| 'icon-md' \| 'icon-lg' \| number` | `'middle'` |  |
| `triggerClass` | `string` | `''` | 追加到触发器上的类名（Button 的 class 会与 btn / dropdown-trigger 并存） |
| `triggerStyle` | `string` | `''` | 触发器的内联样式，与 size 算出的高度/内边距合并 |
| `triggerAriaLabel` | `string` | `''` | 纯图标触发器时给一个可读的名字 |
| `onselect` | `(item: DropdownMenuItem, index: number) => void` | — |  |
| `onOpenChange` | `(open: boolean) => void` | — |  |
| `trigger` | `Snippet` | — |  |
| `children` | `Snippet` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { DropdownMenu } from 'goose-ui';
```

### Toolbar

工具栏（role=toolbar + roving 方向键）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |  |
| `children` | `Snippet` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Toolbar } from 'goose-ui';
```

### BackTop

返回顶部（阈值淡入 + easeOutCubic 回顶；元素容器贴容器右下角，回退贴视口）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `visibilityHeight` | `number` | `200` |  |
| `duration` | `number` | `300` |  |
| `label` | `string` | `'返回顶部'` |  |
| `target` | `string` | `''` | 滚动容器选择器（如 '.layout-content'）；缺省时自动查找最近可滚动祖先，都没有则回退 window |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { BackTop } from 'goose-ui';
```

## 反馈

### Modal

模态弹窗（fade+scale 转场、backdrop blur、`headerActions` 标题行操作、多层按打开顺序叠放）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` *(bind)* | `boolean` | `false` |  |
| `title` | `string \| Snippet` | — |  |
| `subtitle` | `string \| Snippet` | — |  |
| `width` | `number \| string` | `520` |  |
| `maskClosable` | `boolean` | `false` |  |
| `mask` | `'dark' \| 'light'` | `'dark'` |  |
| `blur` | `boolean` | `true` |  |
| `modeless` | `boolean` | `false` |  |
| `offsetTop` | `number \| string` | — | 遮罩顶部留白：遮罩从该位置开始（数字按 px），用于避开标题栏 |
| `bodyPadding` | `string` | `'32px 40px'` | 内容区内边距，默认 '32px 40px'；列表类弹窗可调小 |
| `disableClose` | `boolean` | `false` |  |
| `typewriter` | `boolean` | `false` |  |
| `typewriterDuration` | `number` | `1500` |  |
| `okText` | `string` | `'确定'` |  |
| `cancelText` | `string` | `'取消'` |  |
| `showOk` | `boolean` | `true` |  |
| `showCancel` | `boolean` | `true` |  |
| `showFooter` | `boolean` | `true` |  |
| `okDisabled` | `boolean` | `false` |  |
| `onClose` | `() => void` | — |  |
| `onCancel` | `() => void` | — |  |
| `onOk` | `() => void \| boolean \| Promise<void \| boolean>` | — |  |
| `class` | `string` | `""` |  |
| `style` | `string` | `""` |  |
| `children` | `Snippet` | — |  |
| `footer` | `Snippet` | — |  |
| `headerActions` | `Snippet` | — | 标题行右侧的操作（渲染在关闭按钮左边）。 给「列表类弹窗」用：标题旁边直接放「全部清空」「关闭全部」这类针对整份 数据集的动作用，用户不用把视线移到页脚、也不用先关掉弹窗回到原页面。 不给就一像素都不占。 |

```ts
import { Modal } from 'goose-ui';
```

### Drawer

抽屉弹窗（4 方向 + 可调景深 `pushScale`/`pushBlur` + 遮罩深浅 `--drawer-mask` + 可拖动吸附尺寸 / 拖到底关闭 + portal）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` *(bind)* | `boolean` | `false` |  |
| `title` | `string \| Snippet` | — |  |
| `placement` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` |  |
| `width` | `number \| string` | — |  |
| `height` | `number \| string` | — |  |
| `resizable` | `boolean` | `false` | 可拖动边缘调整尺寸：top/bottom 调高度，left/right 调宽度 |
| `snapPoints` | `number[]` | `[30, 60, 80]` | 松手后吸附的尺寸百分比（按抽屉轴向），默认 [30, 60, 80] |
| `offsetTop` | `number \| string` | — | 顶部留白：抽屉层从该位置开始（数字按 px），用于避开标题栏 |
| `maskClosable` | `boolean` | `true` |  |
| `pushBackground` | `boolean` | `true` |  |
| `pushScale` | `number` | `0.94` | 景深下沉时的背景缩放比例，1 = 不缩。 景深由「缩小 + 模糊」两件事叠出来：缩小负责「退后一层」，模糊负责失焦。 都做满会像整个页面被缩小塞进一个框里，所以默认只缩 6%。 |
| `pushBlur` | `number` | `1` | 景深模糊半径（px），0 = 只缩小不模糊。 1px 是「几乎看不出、但边缘不再锋利」的一档，适合侧栏/普通抽屉； 4~8px 才能让背景明显失焦，适合铺满大半屏的设置类抽屉。 模糊会把元素边缘向外羽化，半径越大越容易在四周露底色 —— 靠 pushScale 拉出的那圈空隙兜住，所以两者要一起调（缩得越少，能吃的模糊半径越小）。 |
| `backgroundSelector` | `string \| null` | `'.layout, .layout-content, main'` | pushBackground 要缩放的宿主容器；传 null 关闭（等价 pushBackground={false}） |
| `container` | `HTMLElement \| null` | `null` | 挂载容器；默认 body。传入元素时抽屉在该元素内绝对定位（容器需是定位元素） |
| `footer` | `Snippet \| null` | — |  |
| `onClose` | `() => void` | — |  |
| `children` | `Snippet` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Drawer } from 'goose-ui';
```

### AlertDialog

警惕对话框（焦点陷阱、初始聚焦、loading/danger）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` *(bind)* | `boolean` | `false` |  |
| `title` | `string` | `'确认操作'` |  |
| `description` | `string` | `''` |  |
| `cancelText` | `string` | `'取消'` |  |
| `confirmText` | `string` | `'确定'` |  |
| `danger` | `boolean` | `false` |  |
| `loading` | `boolean` | `false` |  |
| `onCancel` | `() => void` | — |  |
| `onConfirm` | `() => void` | — |  |
| `content` | `Snippet` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { AlertDialog } from 'goose-ui';
```

### Popover

气泡卡片（受控 open、翻转、Esc/外点关闭；placement 支持 bottom/top × start/end 对齐）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` *(bind)* | `boolean` | `false` |  |
| `placement` | `'bottom-start' \| 'bottom-end' \| 'top-start' \| 'top-end'` | `'bottom-start'` |  |
| `title` | `string` | `''` |  |
| `onOpenChange` | `(open: boolean) => void` | — |  |
| `trigger` | `Snippet` | — |  |
| `children` | `Snippet` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Popover } from 'goose-ui';
```

### Tooltip

气泡提示（12 方向 + 自动翻转 + hover/focus/click 触发）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` | `string \| Snippet` | — |  |
| `placement` | `"top" \| "top-start" \| "top-end" \| "bottom" \| "bottom-start" \| "bottom-end" \| "left" \| "left-start" \| "left-end" \| "right" \| "right-start" \| "right-end"` | `"top"` |  |
| `trigger` | `"hover" \| "focus" \| "click"` | `"hover"` |  |
| `delay` | `number` | `200` | hover/focus 的悬停延迟（ms），默认 200。 别调得太小：列表里每行可能挂好几个提示，鼠标纵向扫过时 50ms 就弹一大片气泡，比原生 title 还吵。 |
| `maxWidth` | `number \| string` | — |  |
| `children` | `Snippet` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Tooltip } from 'goose-ui';
```

### LinkPreview

链接预览（延迟悬停、翻转、卡片水平居中于锚点）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `href` | `string` | `''` |  |
| `title` | `string` | `''` |  |
| `description` | `string` | `''` |  |
| `image` | `string` | `''` |  |
| `siteName` | `string` | `''` |  |
| `disabled` | `boolean` | `false` |  |
| `delay` | `number` | `400` |  |
| `placement` | `'top' \| 'bottom'` | `'top'` |  |
| `children` | `Snippet` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { LinkPreview } from 'goose-ui';
```

### Command

命令面板（Ctrl/Cmd+K、分组、键盘导航）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` *(bind)* | `boolean` | `false` |  |
| `items` | `CommandItem[]` | `[]` |  |
| `placeholder` | `string` | `'输入命令或搜索…'` |  |
| `emptyText` | `string` | `'无匹配结果'` |  |
| `onSelect` | `(item: CommandItem) => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Command } from 'goose-ui';
```

### NotificationProvider

通知容器；`store` prop 决定渲染哪份 store（默认全局单例，可传独立实例）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `gap` | `number` | `14` |  |
| `visibleToasts` | `number` | `3` |  |
| `expand` | `boolean` | `false` |  |
| `hotkey` | `string[]` | `['altKey', 'KeyT']` |  |
| `offset` | `string` | `''` | 位置微调样式片段（如 'top:120px;left:340px;'），追加在默认定位之后； 多个 Provider 同时挂载时用它错开，避免浮层完全重叠。默认空 = 行为不变 |
| `store` | `NotificationStore` | `defaultStore` | 该 Provider 渲染哪一份 store。默认全局单例（配合 Notification.xxx()）； 传 createNotificationStore() 的实例即可得到互不干扰的独立容器 |

```ts
import { NotificationProvider } from 'goose-ui';
```

### NotificationItem

单条通知（由 NotificationProvider 内部渲染）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `toast` | `NotificationItemType` | — |  |
| `store` | `NotificationStore` | — | 所属 Provider 的 store 实例（每个 Provider 独立，不共享） |
| `drop` | `boolean` | `true` | 向下展开（top-* 位置）：揭幕层从上往下让开。false = 从下往上让开 |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { NotificationItem } from 'goose-ui';
```

### Loading

加载指示器（spinner 或自定义图片，size 可调）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `size` | `number` | `30` |  |
| `src` | `string` | `''` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Loading } from 'goose-ui';
```

### Skeleton

骨架屏（text/circle/rect + 多行 + shimmer 动画）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `shape` | `'text' \| 'circle' \| 'rect'` | `'text'` |  |
| `width` | `string` | `''` |  |
| `height` | `string` | `''` |  |
| `rows` | `number` | `1` |  |
| `animated` | `boolean` | `true` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Skeleton } from 'goose-ui';
```

### Empty

空状态（图标 + 主文案 + 副提示 + 可选操作区，居中排布）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `icon` | `Component<{ size?: number }>` | — | lucide 图标组件，如 Shield、HardDrive |
| `title` | `string` | `'暂无数据'` |  |
| `hint` | `string` | `''` |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |
| `children` | `Snippet` | — | 操作区（如按钮） |

```ts
import { Empty } from 'goose-ui';
```

## 其他

### PillTrack

滑动高亮原语（选中 pill + hover pill，自动跟随选中项）。Sidebar / Tabs / DataTable / DataList 的 hover 高亮带都由它绘制（见[滑动高亮动效](api.md#滑动高亮动效pilltrack)）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `container` | `HTMLElement \| null` | `null` | 容器：测量参照 + hover 事件挂载点（通常 bind:this 的定位/滚动容器） |
| `itemSelector` | `string` | `''` | hover 目标项选择器（closest 委托） |
| `activeSelector` | `string` | `''` | 选中项选择器；缺省或查不到 → 选中 pill 隐藏 |
| `disabledMatch` | `string` | `':disabled'` | 禁用项匹配（hover 跳过） |
| `showSelected` | `boolean` | `true` | 是否渲染选中 pill（多选分组等场景关闭） |
| `variant` | `'box' \| 'line'` | `'box'` | box = 四边随项；line = 底部指示线（仅 left/width） |
| `insetX` | `number` | — | 横向内缩：left=insetX，width=容器宽-2×insetX（替代项的 x 几何） |
| `background` | `string` | `'transparent'` | 选中 pill 底色 |
| `hoverBackground` | `string` | `''` | hover pill 底色。**一律传不透明颜色**（默认 `var(--hover)`）。 半透明值（`--accent-sub`、`color-mix(… transparent)` 之类）在深浅不同的 宿主底色上浓淡不一：同一个菜单，压在纯白浮层和压在灰卡片上就是两种颜色； 叠两层（行 hover + 分组底色）还会更深一档，没法用「改一个变量」控制。 需要带色相的 hover 也请混成实色：`color-mix(in srgb, var(--danger) 12%, var(--popup-surface))`。 |
| `activeHoverBackground` | `string` | `''` | 指针落在**已选中项**上时 hover pill 的底色。缺省 = 继续用 `hoverBackground`。 为什么要单独一档：选中 pill 是常驻的主题色实心块，指针压上去时如果 hover pill 仍是那块中性灰，就会出现两种坏结果 —— · hover pill 压在选中 pill 之上 → 主题色被灰盖掉，激活项「一碰就看不出来了」； · hover pill 被选中 pill 盖住 → 选中项对悬停毫无反应，与其余行的手感断开。 两者都不是「连贯」，而是把两个状态混成一个。 传主题色的加深档（`var(--primary-hover)`）即可两全：色相不变、只是浓度变一档， 指针扫过时同一块 pill 一路滑到底、颜色由灰转深，落定后看起来就是「选中块被按了一下」， 激活语义也一直在。想改成「悬停时选中项真的变灰」（macOS 那种）就把这里设成 `var(--hover)`。 |
| `radius` | `string` | `'var(--radius-md)'` | 圆角（line 变体固定 1px，忽略此值） |
| `shadow` | `string` | `''` | 选中 pill 阴影 |
| `disabled` | `boolean` | `false` | 选中 pill 减淡（整组禁用时） |
| `portal` | `boolean` | `false` | 挂到 document.body 并用 position:fixed 定位，脱离 container 的层叠/裁剪。 为什么需要：pill 原本是 container 内的 absolute 元素。当 container 是 overflow:auto 的滚动容器时，它同时是合成层边界 —— pill 每变一次位置， 浏览器都要重新判定整个容器（含内部全部元素）如何分层。 实测 11 张表同页时单帧 Layerize 26ms、掉帧 12%；把 pill 移出滚动容器 后掉帧降到 0%。 代价：坐标依赖视口位置，容器滚动/窗口尺寸变化时必须重算（见下方 effect）， 因此不要指望「滚动时 pill 完全静止」，它每帧都会跟随。 |
| `zIndex` | `number` | `-1` | 选中 pill 挂到 body 时的 z-index，默认 -1。 -1 = 当「行底色」用，沉到内容下面：填充式选中（左栏导航那种实心 pill） 才不会把文字盖住。前提是整条祖先链背景透明、且有本地层叠上下文兜底， 否则会沉到页面背景之后。 1 = 当「覆盖层」用（表格的常驻高亮），任何底色都压不掉它。 |
| `gapBridge` | `number` | `12` | 项间间隙的归属半径（px）：指针落在两项之间的空隙里时，把空隙算作 **离它最近那一项**的触发区；超出这个距离才认为指针真的离开了列表。 为什么需要：项与项之间几乎总有 2~10px 的布局间隙（flex `gap`、 兄弟项 `margin`、菜单分隔线、分组内边距）。这些空隙属于**容器**而不是项， 按 `target.closest(itemSelector)` 判断时命中不到任何项，于是走「隐藏 pill」 分支 —— 鼠标扫过列表时，每经过一条缝隙 pill 都会闪一下。 归属用「就近判定」，而不是简单的「还停在容器里就别动」：指针一过中线， pill 就该滑到下一项，否则会一直停在上一项上，体感是「卡住」而不是「跟手」。 判定要求两侧都有项（次近距离也算在阈值内），所以阈值放大到容器内边距那样 也不会把表头上方、列表下方的空白算进来 —— 那里只有一侧有项。 传 0 关闭桥接，回到「只有指针真的压在项上才算 hover」。 |
| `bounce` | `number` | `10` | 回弹的过冲距离（px，**固定值**）。 之所以要「固定」：CSS 的 `cubic-bezier` 过冲是**按位移比例**给的 （1.5 的 back-out ≈ 位移的 5%），于是滑两行只弹 2px、滑二十行弹出 20px， 同一个组件在不同列表长度上手感完全不同。这里改成「不管多远都冲出去 `bounce` 像素再落回」，位移只影响速度，不影响弹的幅度。 传 0 = 不过冲（纯缓出）；`prefers-reduced-motion: reduce` 下自动按 0 处理。 |

```ts
import { PillTrack } from 'goose-ui';
```

### Cursor

自定义光标（区域内圆点跟随 + 可选拖尾外圈，隐藏系统光标）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `size` | `number` | `24` |  |
| `outline` | `boolean` | `true` |  |
| `trail` | `boolean` | `false` |  |
| `hideNative` | `boolean` | `true` |  |
| `label` | `string` | `''` |  |
| `children` | `import('svelte').Snippet` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Cursor } from 'goose-ui';
```

### Background

装饰背景（gradient/grid/dots/noise 四变体 + 光晕漂移动画，children 叠加）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `variant` | `'gradient' \| 'grid' \| 'dots' \| 'noise'` | `'gradient'` |  |
| `fixed` | `boolean` | `false` |  |
| `layer` | `'behind' \| 'overlay'` | `'behind'` | fixed 模式下的绘制层，只有 fixed 时才有意义。 - `'behind'`（默认）：`z-index: -1`，画在当前层叠上下文里所有内容的后方。 局部容器用它是正确的。 - `'overlay'`：与 behind 同为 `z-index: -1`，区别是它把网格/点阵底色调成 半透明，并保证绝不拦截指针事件。做「整页背景」时用它，但祖先容器 不能有不透明背景 —— 负 z-index 的元素绘制在那层背景之后。 两种消解办法：把祖宗容器的 background 设透明；或给背景一个 `position: relative` 的宿主祖先，改用 `position: absolute; inset: 0` （不传 fixed）。 |
| `animated` | `boolean` | `true` |  |
| `opacity` | `number` | `1` |  |
| `children` | `import('svelte').Snippet` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { Background } from 'goose-ui';
```

### ThemeToggle

主题切换按钮（Sun/Moon 图标、圆形扩散动画、localStorage 持久化）

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `lightIcon` | `Component<{ size?: number }>` | `Sun` |  |
| `darkIcon` | `Component<{ size?: number }>` | `Moon` |  |
| `onclick` | `(theme: 'light' \| 'dark') => void` | — |  |
| `class` | `string` | `''` |  |
| `style` | `string` | `''` |  |

```ts
import { ThemeToggle } from 'goose-ui';
```

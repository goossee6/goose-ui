// 表格 / 列表几个演示页共用的代码示例字符串与 Props 表数据。
// 纯字符串常量，不含 Svelte 运行时，放进普通 .ts 让各页直接复用。
import type { PropsTableItem } from "../PropsTable.svelte";

// ── 选型对照表 ────────────────────────────────────────────────────────────
export const compareRows: { k: string; table: string; list: string }[] = [
  { k: "行的结构", table: "N 个字段横向排列，字段由外部 columns 定义", list: "一块自由内容，由你写的 snippet 决定" },
  { k: "数据模型", table: "Column<T>[] 配置驱动", list: "rows + children(row)" },
  { k: "DOM 语义", table: "<table> / <thead> / <tr> / <td>", list: "<div> 堆叠，无表格语义" },
  { k: "列对齐", table: "真 <td>，同列必然对齐", list: "不自带，需自己用 grid / flex 对齐" },
  { k: "单元格内容", table: "默认只能渲染字符串；要放组件须 custom: true + cell snippet", list: "任意结构，无限制" },
  { k: "行高", table: "统一", list: "可逐行不同" },
  { k: "外观", table: "表头圆角；行 hover 为跨行滑动的圆角 pill", list: "行 hover 同样是滑动 pill，只是行间没有列" },
  { k: "自带能力", table: "排序、关键字高亮、单元格右键菜单、操作列、loading / 空态", list: "空态、rowKey、bindContainer" },
];

// ── Props 表 ──────────────────────────────────────────────────────────────
export const dataTableProps: PropsTableItem[] = [
  { name: "rows", desc: "行数据数组", type: "T[]", default: "[]" },
  { name: "columns", desc: "列配置数组，元素 { id, header, render, align?, mono?, sortable?, sortAccessor?, custom?, menu?, menuData?, width?, minWidth?, maxWidth?, overflow? }", type: "Column<T>[]", default: "[]" },
  { name: "highlight", desc: "高亮搜索关键字", type: "string", default: "''" },
  { name: "contextMenu", desc: "启用列右键菜单", type: "boolean", default: "true" },
  { name: "menu", desc: "默认列右键菜单标识（列未单独配置时生效）", type: "string", default: "''" },
  { name: "loading", desc: "加载中状态", type: "boolean", default: "false" },
  { name: "emptyText", desc: "空数据文案", type: "string", default: "'暂无数据'" },
  { name: "disabled", desc: "行禁用判断", type: "(row: T) => boolean" },
  { name: "actions", desc: "行操作列插槽", type: "Snippet<[T]>" },
  { name: "cell", desc: "自定义单元格插槽", type: "Snippet<[string, T]>" },
  { name: "rowKey", desc: "行唯一键生成", type: "(row: T, index: number) => string | number" },
  { name: "actionsPercent", desc: "操作列的宽度声明，写法同 Column.width（份数 / 百分比 / 像素）；不传占 1 份", type: "number | string" },
  { name: "headerBleed", desc: "表头底色左右外扩的像素数。表格与 Header 共用一个外层滚动容器时，传入外层左右内边距，表头吸顶才不会在边缘露出窄缝", type: "number", default: "0" },
  { name: "maxHeight", desc: "容器最大高度，超出即由表格自己滚动、表头保持吸顶；传 'none' 交给父容器决定", type: "string", default: "'70vh'" },
  { name: "stickyHeader", desc: "表头是否吸顶。常规用法保持默认；一页塞十几张表、或表格嵌在多层滚动容器里时传 false 换性能（表头会跟着行滚走）", type: "boolean", default: "true" },
  { name: "class", desc: "附加类名", type: "string", default: "''" },
  { name: "style", desc: "内联样式", type: "string", default: "''" },
];

export const columnProps: PropsTableItem[] = [
  { name: "id", desc: "列标识，必须唯一", type: "string" },
  { name: "header", desc: "表头文案", type: "string" },
  { name: "render", desc: "单元格文本渲染函数", type: "(row: T) => string" },
  { name: "align", desc: "对齐方式", type: "'left' | 'right' | 'center'", default: "'left'" },
  { name: "mono", desc: "等宽字体 + 等宽数字（适合 PID、端口等）", type: "boolean", default: "false" },
  { name: "sortable", desc: "是否可排序", type: "boolean", default: "true" },
  { name: "sortAccessor", desc: "排序取值函数，默认用 render 的文本", type: "(row: T) => unknown" },
  { name: "custom", desc: "为 true 才会调用 cell snippet 渲染该列", type: "boolean", default: "false" },
  { name: "width", desc: "列宽占比。写数字表示份数（2 = 占 2 份），写 '20%' 表示占容器 20%，写 '200px' 按像素；不写则占 1 份", type: "number | string", default: "1" },
  { name: "minWidth", desc: "最小宽度（可选约束），写法同 width；纯数字按像素。越界时夹住并把差额分摊给其它列", type: "number | string" },
  { name: "maxWidth", desc: "最大宽度（可选约束），写法同 width；纯数字按像素", type: "number | string" },
  { name: "overflow", desc: "内容溢出处理：省略号 / 换行 / 纯裁切（默认省略号，hover 时横向滚动显示全文）", type: "'ellipsis' | 'wrap' | 'clip'", default: "'ellipsis'" },
];

export const dataListProps: PropsTableItem[] = [
  { name: "children", desc: "行渲染插槽（必填）", type: "Snippet<[T]>" },
  { name: "rows", desc: "行数据数组", type: "T[]", default: "[]" },
  { name: "emptyText", desc: "空数据文案", type: "string", default: "'暂无数据'" },
  { name: "bindContainer", desc: "容器元素引用回调", type: "(el: HTMLElement | null) => void" },
  { name: "rowKey", desc: "行唯一键生成", type: "(row: T, index: number) => string | number" },
  { name: "title", desc: "内置 header 的标题，直接透传给 Header；header 相关 props 全不传时 header 整块不渲染", type: "string" },
  { name: "header", desc: "透传给 Header 的 left 槽（搜索框、面包屑…）", type: "Snippet" },
  { name: "headerCenter", desc: "透传给 Header 的 center 槽", type: "Snippet" },
  { name: "headerRight", desc: "透传给 Header 的 right 槽（按钮、筛选器）", type: "Snippet" },
  { name: "headerId", desc: "透传给 Header 的 id", type: "string" },
  { name: "headerClass", desc: "透传给 Header 的附加类名", type: "string", default: "''" },
  { name: "headerStyle", desc: "透传给 Header 的内联样式；内置 header 默认高 64px，传 '--header-h:56px' 之类即可覆盖", type: "string", default: "''" },
  { name: "headerSticky", desc: "header 在列表滚动时是否吸顶（取消 Header 的 sticky）", type: "boolean", default: "true" },
  { name: "dataTableHeader", desc: "独立成块时使用：行盒两侧各缩 16px（与 hover pill 同宽）、每项自带边框，表头底色与分隔线铺到边缘；默认 false 适配已有内边距的卡片", type: "boolean", default: "false" },
  { name: "maxHeight", desc: "容器最大高度，超出即由列表自己滚动、内置 header 保持吸顶；传 'none' 交给父容器决定", type: "string", default: "'70vh'" },
  { name: "class", desc: "附加类名", type: "string", default: "''" },
  { name: "style", desc: "内联样式", type: "string", default: "''" },
];

export const listHeaderProps: PropsTableItem[] = [
  { name: "title", desc: "纯文本标题", type: "string" },
  { name: "left", desc: "左槽内容", type: "Snippet" },
  { name: "center", desc: "中槽内容（搜索框、Tabs…）", type: "Snippet" },
  { name: "right", desc: "右槽内容", type: "Snippet" },
  { name: "id", desc: "元素 id", type: "string" },
  { name: "sticky", desc: "滚动时吸顶（本页未列出，项目内置，默认开启）", type: "boolean", default: "true" },
  { name: "class", desc: "附加类名", type: "string", default: "''" },
  { name: "style", desc: "内联样式；覆盖 --header-h 即改高度", type: "string", default: "''" },
];

export const pillProps: PropsTableItem[] = [
  { name: "container", desc: "测量参照 + hover 事件挂载点（通常 bind:this 的列表/导航容器）。DataTable 用 tbody，DataList 用列表根元素；需要 position: relative", type: "HTMLElement | null", default: "null" },
  { name: "itemSelector", desc: "hover 目标项选择器（closest 委托）；空字符串则不接管 hover", type: "string", default: "''" },
  { name: "activeSelector", desc: "选中项选择器；查不到则选中 pill 隐藏", type: "string", default: "''" },
  { name: "showSelected", desc: "是否渲染选中 pill；只想要 hover 效果（如表格/列表数据行）时设为 false", type: "boolean", default: "true" },
  { name: "variant", desc: "box = 四边随项；line = 底部指示线（仅 left/width）", type: "'box' | 'line'", default: "'box'" },
  { name: "insetX", desc: "横向内缩：left = insetX，width = 容器宽 - 2×insetX", type: "number" },
  { name: "background", desc: "选中 pill 底色", type: "string", default: "'transparent'" },
  { name: "hoverBackground", desc: "hover pill 底色（项上的 data-pill-bg 可逐项覆盖）", type: "string", default: "'var(--hover)'" },
  { name: "radius", desc: "圆角（line 变体固定 1px，忽略此值）", type: "string", default: "'var(--radius-md)'" },
  { name: "shadow", desc: "选中 pill 阴影", type: "string", default: "''" },
  { name: "disabledMatch", desc: "禁用项匹配选择器，hover 时分跳过", type: "string", default: "':disabled'" },
  { name: "bounce", desc: "回弹的过冲距离（px，固定值，与位移距离无关）；0 = 不过冲，直接缓出到位", type: "number", default: "10" },
  { name: "portal", desc: "把 pill 挂到 document.body 并用 position: fixed 定位。默认 false（挂在容器内）；容器处在滚动层里、滚动时掉帧明显时可开启", type: "boolean", default: "false" },
];

/** 单元格溢出策略：换行（默认，超出上限在格内滚动）/ 单行省略号 / 单行循环滚动 */
export type ColumnOverflow = 'wrap' | 'ellipsis' | 'scroll';

export interface Column<T> {
  id: string;
  header: string;
  mono?: boolean;
  /** 水平对齐；不写即左对齐 */
  align?: 'left' | 'right' | 'center';
  render: (row: T) => string;
  custom?: boolean;
  menu?: string;
  /** 该列右键菜单的附加数据（key 由使用方自定，随菜单 action 下发给 handler） */
  menuData?: (row: T) => Record<string, string> | undefined;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | null | undefined;

  /**
   * 列宽声明，三种写法可混用：
   *  - `2`      → 占 2 份（相对比例，不是像素）
   *  - `'20%'`  → 占容器宽度的 20%
   *  - `'200px'`→ 200px（按 1000px 参考宽度换算成百分比）
   *
   * 不写就是 auto：列宽跟着内容走（表格是 table-layout: auto）。
   * 写了只是「建议宽度」，内容更长时仍会撑开；要卡住用 maxWidth。
   * 约束优先于占比：各列先按声明分配，越界的列被夹到约束上，
   * 差额按占比分摊给还有余量的列（见 colWidths.svelte.ts）。
   */
  width?: number | string;
  /** 该列最小宽度，写法同 width；纯数字按像素处理 */
  minWidth?: number | string;
  /** 该列最大宽度，写法同 width；纯数字按像素处理 */
  maxWidth?: number | string;
  /**
   * 内容超出单元格宽度时的处理方式，默认 'wrap'：
   *  - 'wrap'     换行：内容折行，行高随内容变化；超过 `cellMaxLines` 行后在格内垂直滚动
   *               （默认策略，表格不会被长内容撑宽）
   *  - 'ellipsis' 单行截断并显示省略号（列宽自适应时不一定触发，除非设了 width / maxWidth）
   *  - 'scroll'   单行 + 无限循环滚动：静止时与截断一样只显示开头，指针停在该格上才
   *               从开头横向循环滚动、滚完接着滚，不用悬停气泡也能读全文。
   *               适合文件名、长 ID、URL 这类「不能折行又必须看全」的列。
   *
   * 注意：只要有列选了 'ellipsis' / 'scroll'，整张表会切成 `table-layout: fixed` ——
   * 单行内容在 auto 布局下会把表格顶宽，截断就永远不会发生。此时列宽只认声明，
   * 未声明 width 的列等分剩余宽度；所以这类列一般要配 width 使用。
   *
   * 用 `custom` 的列不参与循环滚动（内容是自己渲染的 snippet，无法安全复制一份），
   * 选 'scroll' 会退化成 'ellipsis'。
   */
  overflow?: ColumnOverflow;
}

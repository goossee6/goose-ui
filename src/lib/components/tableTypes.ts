export type ColumnOverflow = 'ellipsis' | 'wrap' | 'clip';

export interface Column<T> {
  id: string;
  header: string;
  mono?: boolean;
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
   *  - `2`      → 占 2 份（相对比例，不是像素）；不写则占 1 份、与其它的列均分
   *  - `'20%'`  → 占容器宽度的 20%
   *  - `'200px'`→ 200px（按 1000px 参考宽度换算成百分比）
   *
   * 约束优先于占比：各列先按声明分配，越界的列被夹到约束上，
   * 差额按占比分摊给还有余量的列，总和恒为 100%（见 colWidths.svelte.ts）。
   */
  width?: number | string;
  /** 该列最小宽度，写法同 width；纯数字按像素处理 */
  minWidth?: number | string;
  /** 该列最大宽度，写法同 width；纯数字按像素处理 */
  maxWidth?: number | string;
  /**
   * 内容溢出单元格时的处理方式，默认 'ellipsis'：
   *  - 'ellipsis' 截断并显示省略号，悬停时文字横向滚动展示全文
   *  - 'wrap'     换行（行高会不一致，适合短内容列）
   *  - 'clip'     直接裁切，无省略号（适合 PID 这类定长数字）
   */
  overflow?: 'ellipsis' | 'wrap' | 'clip';
}

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
   * 初始宽度权重（**相对值，不是像素**），默认 1。
   * 表格按 weight/total 换算成百分比分配宽度，所以 [{a:2},{b:1}] 表示 a 占 2/3。
   * 用户拖拽后以拖拽结果为准，此值只在没有持久化记录时生效。
   */
  width?: number;
  /** 该列最小像素宽，默认 56（小于它手柄就抓不住了） */
  minWidth?: number;
  /** 该列最大像素宽（拖拽上限，未设则只受相邻列限制） */
  maxWidth?: number;
  /** 该列是否允许拖拽调整宽度；不设则跟随 DataTable 的 resizable */
  resizable?: boolean;
  /**
   * 内容溢出单元格时的处理方式，默认 'ellipsis'：
   *  - 'ellipsis' 截断并显示省略号，悬停时文字横向滚动展示全文
   *  - 'wrap'     换行（行高会不一致，适合短内容列）
   *  - 'clip'     直接裁切，无省略号（适合 PID 这类定长数字）
   */
  overflow?: 'ellipsis' | 'wrap' | 'clip';
}

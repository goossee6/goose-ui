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
}

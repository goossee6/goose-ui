export interface Column<T> {
  id: string;
  header: string;
  mono?: boolean;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => string;
  custom?: boolean;
  menu?: string;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | null | undefined;
}

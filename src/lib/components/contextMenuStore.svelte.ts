interface MenuStore {
  visible: boolean;
  x: number;
  y: number;
  name: string;
  data: Record<string, string>;
}

export const menuStore: MenuStore = $state({
  visible: false,
  x: 0,
  y: 0,
  name: '',
  data: {},
});

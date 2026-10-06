<script lang="ts">
  import {Card, Page, Menubar, Notification, type MenubarMenu} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "menus", desc: "菜单组（value/label/items/disabled）", type: "MenubarMenu[]", default: "[]" },
    { name: "onselect", desc: "选中回调", type: "(menuValue, item, index) => void", default: "—" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const menus: MenubarMenu[] = [
    {
      value: 'file',
      label: '文件',
      items: [
        { value: 'new', label: '新建' },
        { value: 'open', label: '打开' },
        { separator: true },
        { value: 'export', label: '导出为…' },
      ],
    },
    {
      value: 'edit',
      label: '编辑',
      items: [
        { value: 'undo', label: '撤销' },
        { value: 'redo', label: '重做', disabled: true },
        { separator: true },
        { value: 'find', label: '查找' },
      ],
    },
    {
      value: 'view',
      label: '视图',
      items: [
        { value: 'sidebar', label: '侧边栏' },
        { value: 'zen', label: '专注模式' },
      ],
    },
    {
      value: 'help',
      label: '帮助',
      disabled: true,
      items: [],
    },
  ];

  function handleSelect(menuValue: string, item: { label?: string }) {
    Notification.info(`${menuValue} → ${item.label ?? ''}`);
  }
</script>

<Page title="Menubar 菜单栏" description="桌面应用式水平菜单栏（左右方向键切换菜单）">
  <Card title="基础用法">
    <Menubar {menus} onselect={handleSelect} />
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

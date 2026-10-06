<script lang="ts">
  import {Card, Page, NavigationMenu, Notification, type NavMenuItem} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "items", desc: "导航项（含 children 的展开为下拉面板）", type: "NavMenuItem[]", default: "[]" },
    { name: "active", desc: "当前激活 value", type: "string", default: "''" },
    { name: "onselect", desc: "选中回调", type: "(value: string) => void", default: "—" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const items: NavMenuItem[] = [
    { value: 'home', label: '首页', href: '#/home' },
    {
      value: 'components',
      label: '组件',
      children: [
        { value: 'button', label: 'Button 按钮', href: '#/button', description: '各种状态与尺寸' },
        { value: 'input', label: 'Input 输入框', href: '#/input', description: '前缀/后缀/清除' },
        { value: 'table', label: 'Table 表格', href: '#/table', description: '排序与右键菜单' },
        { value: 'modal', label: 'Modal 弹窗', href: '#/modal', description: '对话框与确认' },
      ],
    },
    {
      value: 'guide',
      label: '指南',
      children: [
        { value: 'skill', label: 'Skill 介绍', href: '#/skill', description: '从这里开始' },
      ],
    },
    { value: 'disabled', label: '置灰项', disabled: true },
  ];

  let active = $state('home');

  function handleSelect(value: string) {
    active = value;
    Notification.info(`导航到：${value}`);
  }
</script>

<Page title="Navigation Menu 导航菜单" description="导航栏 + 下拉面板（含描述文本的链接列表）">
  <Card title="基础用法">
    <NavigationMenu {items} {active} onselect={handleSelect} />
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

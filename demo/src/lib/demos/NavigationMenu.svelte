<script lang="ts">
  import {
    Card,
    Page,
    NavigationMenu,
    Menubar,
    DropdownMenu,
    Notification,
    type NavMenuItem,
    type MenubarMenu,
    type DropdownMenuItem,
  } from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const navProps: PropsTableItem[] = [
    { name: "items", desc: "导航项（含 children 的展开为下拉面板）", type: "NavMenuItem[]", default: "[]" },
    { name: "active", desc: "当前激活 value", type: "string", default: "''" },
    { name: "onselect", desc: "选中回调", type: "(value: string) => void", default: "—" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const menubarProps: PropsTableItem[] = [
    { name: "menus", desc: "菜单组（value/label/items/disabled）", type: "MenubarMenu[]", default: "[]" },
    { name: "onselect", desc: "选中回调", type: "(menuValue, item, index) => void", default: "—" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const dropdownProps: PropsTableItem[] = [
    { name: "open", desc: "展开状态（双向绑定）", type: "boolean", default: "false" },
    { name: "items", desc: "菜单项（label/value/disabled/danger/separator/icon）", type: "DropdownMenuItem[]", default: "[]" },
    { name: "placement", desc: "弹出方位", type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'", default: "'bottom-start'" },
    { name: "onselect", desc: "选中回调", type: "(item, index) => void", default: "—" },
    { name: "onOpenChange", desc: "开关回调（受控时用）", type: "(open: boolean) => void", default: "—" },
    { name: "trigger", desc: "触发区（snippet）", type: "Snippet", default: "—" },
    { name: "children", desc: "自定义菜单内容（snippet）", type: "Snippet", default: "—" },
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

  let active = $state('home');
  let controlledOpen = $state(false);

  const dropdownItems: DropdownMenuItem[] = [
    { value: 'new', label: '新建文件' },
    { value: 'open', label: '打开…' },
    { value: 'disabled', label: '保存（禁用）', disabled: true },
    { separator: true },
    { value: 'copy', label: '复制副本' },
    { separator: true },
    { value: 'delete', label: '删除', danger: true },
  ];

  function handleNavSelect(value: string) {
    active = value;
    Notification.info(`导航到：${value}`);
  }

  function handleMenubarSelect(menuValue: string, item: { label?: string }) {
    Notification.info(`${menuValue} → ${item.label ?? ''}`);
  }

  function handleDropdownSelect(item: DropdownMenuItem) {
    Notification.info(`选中：${item.label ?? item.value}`);
  }

  const navSource = `<script lang="ts">
  import { NavigationMenu, type NavMenuItem } from "goose-ui";

  const items: NavMenuItem[] = [
    { value: 'home', label: '首页', href: '#/home' },
    {
      value: 'components',
      label: '组件',
      children: [
        { value: 'button', label: 'Button 按钮', href: '#/button', description: '各种状态与尺寸' },
        { value: 'input', label: 'Input 输入框', href: '#/input', description: '前缀/后缀/清除' },
      ],
    },
    { value: 'disabled', label: '置灰项', disabled: true },
  ];

  let active = $state('home');
<\/script>

<NavigationMenu {items} {active} onselect={(value) => (active = value)} />`;

  const menubarSource = `<script lang="ts">
  import { Menubar, type MenubarMenu } from "goose-ui";

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
      ],
    },
  ];
<\/script>

<Menubar {menus} onselect={(menuValue, item) => console.log(menuValue, item)} />`;

  const dropdownSource = `<script lang="ts">
  import { DropdownMenu, type DropdownMenuItem } from "goose-ui";

  const items: DropdownMenuItem[] = [
    { value: 'new', label: '新建文件' },
    { value: 'open', label: '打开…' },
    { value: 'disabled', label: '保存（禁用）', disabled: true },
    { separator: true },
    { value: 'delete', label: '删除', danger: true },
  ];

  let open = $state(false);
<\/script>

<DropdownMenu {items} onselect={(item) => console.log(item)}>
  {#snippet trigger()}
    <span>操作菜单 ⌄</span>
  {/snippet}
</DropdownMenu>

<!-- 受控：bind:open -->
<DropdownMenu bind:open {items} onselect={(item) => console.log(item)}>
  {#snippet trigger()}
    <span>受控菜单（{open ? '开' : '关'}）</span>
  {/snippet}
</DropdownMenu>`;
</script>

<Page title="NavigationMenu / Menubar / DropdownMenu 导航与菜单" description="导航栏下拉面板、桌面应用式水平菜单栏、按钮触发的浮层菜单">
  <CodePreview title="NavigationMenu 导航菜单" code={navSource}>
    <NavigationMenu {items} {active} onselect={handleNavSelect} />
  </CodePreview>

  <CodePreview title="Menubar 菜单栏" code={menubarSource}>
    <Menubar {menus} onselect={handleMenubarSelect} />
  </CodePreview>

  <CodePreview title="DropdownMenu 下拉菜单" code={dropdownSource}>
    <div class="demo-row">
      <DropdownMenu items={dropdownItems} onselect={handleDropdownSelect}>
        {#snippet trigger()}
          <span>操作菜单 ⌄</span>
        {/snippet}
      </DropdownMenu>
      <DropdownMenu bind:open={controlledOpen} items={dropdownItems} onselect={handleDropdownSelect}>
        {#snippet trigger()}
          <span>受控菜单（{controlledOpen ? '开' : '关'}）</span>
        {/snippet}
      </DropdownMenu>
      <span class="note">ArrowDown 打开，Esc 关闭，↑↓ 移动，Tab 收起</span>
    </div>
  </CodePreview>

  <Card title="Props — NavigationMenu">
    <PropsTable items={navProps} />
  </Card>
  <Card title="Props — Menubar">
    <PropsTable items={menubarProps} />
  </Card>
  <Card title="Props — DropdownMenu">
    <PropsTable items={dropdownProps} />
  </Card>
</Page>

<style>
  .demo-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .note { font-size: 12px; color: var(--text-muted); }
</style>

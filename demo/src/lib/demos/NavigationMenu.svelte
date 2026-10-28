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
    { name: "items", desc: "菜单项（label/value/disabled/danger/separator/icon/switch/checked）", type: "DropdownMenuItem[]", default: "[]" },
    { name: "items[].switch", desc: "该行渲染成开关行（右侧小号开关，点击不关闭菜单）", type: "boolean", default: "false" },
    { name: "items[].checked", desc: "开关行是否打开", type: "boolean", default: "false" },
    { name: "placement", desc: "弹出方位", type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'", default: "'bottom-start'" },
    { name: "onselect", desc: "选中回调", type: "(item, index) => void", default: "—" },
    { name: "onOpenChange", desc: "开关回调（受控时用）", type: "(open: boolean) => void", default: "—" },
    { name: "triggerVariant", desc: "触发器按钮的 Button 变体", type: "'primary' | 'default' | 'ghost' | 'danger' | 'link'", default: "'default'" },
    { name: "triggerSize", desc: "触发器按钮的 Button 尺寸（number 为任意高度）", type: "'small' | 'middle' | 'large' | 'icon*' | number", default: "'middle'" },
    { name: "triggerClass", desc: "追加到触发器按钮的类名", type: "string", default: "''" },
    { name: "triggerStyle", desc: "触发器的内联样式（与 size 算出的尺寸合并）", type: "string", default: "''" },
    { name: "triggerAriaLabel", desc: "纯图标触发器时的可读名字", type: "string", default: "''" },
    { name: "trigger", desc: "触发区内容（snippet，按钮本身由组件渲染）", type: "Snippet", default: "—" },
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
  /** 开关行的状态由调用方持有：组件只负责画和回调，不自己翻转 */
  let batchAll = $state(false);

  const dropdownItems: DropdownMenuItem[] = [
    { value: 'new', label: '新建文件' },
    { value: 'open', label: '打开…' },
    { value: 'disabled', label: '保存（禁用）', disabled: true },
    { separator: true },
    { value: 'copy', label: '复制副本' },
    { separator: true },
    { value: 'delete', label: '删除', danger: true },
  ];

  /** 带开关行的版本：switch 行表达「一项设置」，不是「一次命令」 */
  const withSwitch = $derived<DropdownMenuItem[]>([
    ...dropdownItems,
    { separator: true },
    { value: 'all', label: '对全部窗口执行同样操作', switch: true, checked: batchAll },
  ]);

  function handleNavSelect(value: string) {
    active = value;
    Notification.info(`导航到：${value}`);
  }

  function handleMenubarSelect(menuValue: string, item: { label?: string }) {
    Notification.info(`${menuValue} → ${item.label ?? ''}`);
  }

  function handleDropdownSelect(item: DropdownMenuItem) {
    // 开关行：只翻转状态、菜单不关，也不当成「执行了某个命令」
    if (item.switch) {
      batchAll = !batchAll;
      return;
    }
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
  // 开关行的状态由调用方持有（组件只画 + 回调，不自己翻转）
  let batchAll = $state(false);
  const withSwitch: DropdownMenuItem[] = [
    ...items,
    { separator: true },
    { value: 'all', label: '对全部窗口执行同样操作', switch: true, checked: batchAll },
  ];
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
</DropdownMenu>

<!-- 触发器是标准 Button：外观用 triggerVariant / triggerSize / triggerClass 调 -->
<DropdownMenu {items} triggerVariant="ghost" triggerSize="small" onselect={(item) => console.log(item)}>
  {#snippet trigger()}
    <span>紧凑入口</span>
  {/snippet}
</DropdownMenu>

<!-- 开关行（items 里 switch: true）：表达「一项设置」而不是「一次命令」。
     点击只回调 onselect、不关闭菜单，状态由调用方持有后传回 checked -->
<DropdownMenu items={withSwitch} onselect={(item) => {
  if (item.switch) batchAll = !batchAll; else console.log(item);
}}>
  {#snippet trigger()}
    <span>带开关的菜单</span>
  {/snippet}
</DropdownMenu>`;

</script>

<Page toc title="NavigationMenu / Menubar / DropdownMenu 导航与菜单" description="导航栏下拉面板、桌面应用式水平菜单栏、按钮触发的浮层菜单">
  <CodePreview anchor="navigationmenu" anchorLevel={2} title="NavigationMenu 导航菜单" code={navSource}>
    <NavigationMenu {items} {active} onselect={handleNavSelect} />
  </CodePreview>

  <CodePreview anchor="menubar" anchorLevel={2} title="Menubar 菜单栏" code={menubarSource}>
    <Menubar {menus} onselect={handleMenubarSelect} />
  </CodePreview>

  <CodePreview anchor="dropdownmenu" anchorLevel={2} title="DropdownMenu 下拉菜单" code={dropdownSource}>
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
      <DropdownMenu items={dropdownItems} onselect={handleDropdownSelect} triggerVariant="ghost" triggerSize="small">
        {#snippet trigger()}<span>ghost · small</span>{/snippet}
      </DropdownMenu>
      <DropdownMenu items={dropdownItems} onselect={handleDropdownSelect} triggerVariant="primary" triggerSize="large">
        {#snippet trigger()}<span>primary · large</span>{/snippet}
      </DropdownMenu>
      <DropdownMenu items={withSwitch} onselect={handleDropdownSelect}>
        {#snippet trigger()}<span>带开关的菜单</span>{/snippet}
      </DropdownMenu>
      <span class="note">ArrowDown 打开，Esc 关闭，↑↓ 移动，Tab 收起；开关行点击不收起菜单</span>
    </div>
  </CodePreview>

  <Card title="Props — NavigationMenu">
    <PropsTable anchor="props" items={navProps} />
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

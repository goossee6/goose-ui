<script lang="ts">
  import {Card, Page, DropdownMenu, Notification, type DropdownMenuItem} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "open", desc: "展开状态（双向绑定）", type: "boolean", default: "false" },
    { name: "items", desc: "菜单项（label/value/disabled/danger/separator/icon）", type: "DropdownMenuItem[]", default: "[]" },
    { name: "placement", desc: "弹出方位", type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'", default: "'bottom-start'" },
    { name: "onselect", desc: "选中回调", type: "(item, index) => void", default: "—" },
    { name: "onOpenChange", desc: "开关回调（受控时用）", type: "(open: boolean) => void", default: "—" },
    { name: "trigger", desc: "触发区（snippet）", type: "Snippet", default: "—" },
    { name: "children", desc: "自定义菜单内容（snippet）", type: "Snippet", default: "—" },
  ];

  const items: DropdownMenuItem[] = [
    { value: 'new', label: '新建文件' },
    { value: 'open', label: '打开…' },
    { value: 'disabled', label: '保存（禁用）', disabled: true },
    { separator: true },
    { value: 'copy', label: '复制副本' },
    { separator: true },
    { value: 'delete', label: '删除', danger: true },
  ];

  let controlledOpen = $state(false);

  function handleSelect(item: DropdownMenuItem) {
    Notification.info(`选中：${item.label ?? item.value}`);
  }
</script>

<Page title="Dropdown Menu 下拉菜单" description="按钮触发的浮层菜单，支持键盘导航与危险项">
  <Card title="基础用法">
    <DropdownMenu {items} onselect={handleSelect}>
      {#snippet trigger()}
        <span>操作菜单</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
      {/snippet}
    </DropdownMenu>
  </Card>

  <Card title="受控（open 绑定）">
    <div style="display:flex;align-items:center;gap:12px">
      <DropdownMenu bind:open={controlledOpen} {items} onselect={handleSelect}>
        {#snippet trigger()}
          <span>受控菜单（{controlledOpen ? '开' : '关'}）</span>
        {/snippet}
      </DropdownMenu>
      <span class="note">ArrowDown 打开，Esc 关闭，↑↓ 移动，Tab 收起</span>
    </div>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .note { font-size: 12px; color: var(--text-muted); }
</style>

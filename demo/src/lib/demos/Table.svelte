<script lang="ts">
  import {Card, DataTable, DataList, StatusBadge, Label, Button, Page, Input, Icon, Notification, type Column, Row} from "goose-ui";
  import { Search, Pencil, Trash2, Eye } from '@lucide/svelte';

  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: '正常' | '超额';
    storage: number;
    createdAt: string;
  }

  const users: User[] = [
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员', status: '正常', storage: 45, createdAt: '2024-01-15' },
    { id: 2, name: '李四', email: 'lisi@example.com', role: '编辑', status: '正常', storage: 78, createdAt: '2024-02-20' },
    { id: 3, name: '王五', email: 'wangwu@example.com', role: '访客', status: '超额', storage: 105, createdAt: '2024-03-08' },
    { id: 4, name: '赵六', email: 'zhaoliu@example.com', role: '编辑', status: '正常', storage: 22, createdAt: '2024-03-22' },
    { id: 5, name: '钱七', email: 'qianqi@example.com', role: '管理员', status: '正常', storage: 91, createdAt: '2024-04-11' },
  ];

  let highlight = $state('');

  const columns: Column<User>[] = [
    { id: 'id', header: 'ID', render: (r) => String(r.id), align: 'center', mono: true },
    { id: 'name', header: '姓名', render: (r) => r.name },
    { id: 'email', header: '邮箱', render: (r) => r.email },
    { id: 'role', header: '角色', render: (r) => r.role },
    { id: 'status', header: '状态', render: (r) => r.status, custom: true, sortAccessor: (r) => r.status },
    { id: 'storage', header: '存储用量', render: (r) => `${r.storage}%`, align: 'right', sortAccessor: (r) => r.storage },
    { id: 'createdAt', header: '创建时间', render: (r) => r.createdAt, align: 'right' },
  ];

  const simpleColumns: Column<User>[] = [
    { id: 'name', header: '姓名', render: (r) => r.name, sortable: false },
    { id: 'email', header: '邮箱', render: (r) => r.email, sortable: false },
    { id: 'role', header: '角色', render: (r) => r.role, sortable: false },
  ];
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const dataTableProps: PropsTableItem[] = [
    { name: "rows", desc: "行数据数组", type: "T[]", default: "[]" },
    { name: "columns", desc: "列配置数组，元素 { id, header, render, align?, mono?, sortable?, sortAccessor?, custom?, menu?, menuData? }", type: "Column<T>[]", default: "[]" },
    { name: "highlight", desc: "高亮搜索关键字", type: "string", default: "''" },
    { name: "contextMenu", desc: "启用行右键菜单", type: "boolean", default: "true" },
    { name: "menu", desc: "默认列右键菜单标识（列未单独配置时生效）", type: "string", default: "''" },
    { name: "loading", desc: "加载中状态", type: "boolean", default: "false" },
    { name: "emptyText", desc: "空数据文案", type: "string", default: "'暂无数据'" },
    { name: "disabled", desc: "行禁用判断", type: "(row: T) => boolean" },
    { name: "actions", desc: "行操作列插槽", type: "Snippet<[T]>" },
    { name: "cell", desc: "自定义单元格插槽", type: "Snippet<[string, T]>" },
    { name: "rowKey", desc: "行唯一键生成", type: "(row: T, index: number) => string | number" },
  ];

  const dataListProps: PropsTableItem[] = [
    { name: "children", desc: "行渲染插槽（必填）", type: "Snippet<[T]>" },
    { name: "rows", desc: "行数据数组", type: "T[]", default: "[]" },
    { name: "emptyText", desc: "空数据文案", type: "string", default: "'暂无数据'" },
    { name: "bindContainer", desc: "容器元素引用回调", type: "(el: HTMLElement | null) => void" },
    { name: "rowKey", desc: "行唯一键生成", type: "(row: T, index: number) => string | number" },
  ];

  const statusBadgeProps: PropsTableItem[] = [
    { name: "variant", desc: "状态变体", type: "'normal' | 'warning'", default: "'normal'" },
    { name: "children", desc: "徽章文本", type: "Snippet" },
  ];
</script>

<Page title="表格 Table" description="可排序表格、高亮搜索、列表、状态徽章" >
  <Card title="数据表格 DataTable（可排序 + 关键字高亮）">
    {#snippet right()}
      <div style="width:220px">
        <Input name="highlight" placeholder="高亮关键字…" bind:value={highlight} onClear={() => Notification.success('已清除搜索')}>
          {#snippet prefix()}<Icon icon={Search} size={16} />{/snippet}
        </Input>
      </div>
    {/snippet}
    <div style="max-height:360px;overflow:auto">
      <DataTable rows={users} columns={columns} highlight={highlight} />
    </div>
  </Card>

  <Card title="自定义单元格渲染 cell snippet">
    <div style="max-height:320px;overflow:auto">
      <DataTable rows={users} columns={columns} cell={statusCell} />
    </div>
  </Card>

  <Card title="带操作列 actions">
    <DataTable rows={users} columns={simpleColumns} actions={rowActions} />
  </Card>

  <Card title="加载中 / 空状态">
    <DataTable rows={[]} columns={simpleColumns} loading={true} />
    <DataTable rows={[]} columns={simpleColumns} emptyText="暂无用户数据" />
  </Card>

  <Card title="数据列表 DataList">
    <div style="max-height:300px">
      <DataList rows={users}>
        {#snippet children(row)}
          <div class="list-row-inner">
            <div>
              <div class="list-name">{row.name}</div>
              <div class="list-sub">{row.email}</div>
            </div>
            <div class="list-right">
              <span class="list-role">{row.role}</span>
              <StatusBadge variant={row.status === '超额' ? 'warning' : 'normal'} />
            </div>
          </div>
        {/snippet}
      </DataList>
    </div>
  </Card>

  <Card title="状态徽章 StatusBadge">
    <Row>
      <StatusBadge variant="normal" />
      <StatusBadge variant="warning" />
      <StatusBadge variant="normal">自定义文本</StatusBadge>
      <StatusBadge variant="warning">已超额</StatusBadge>
    </Row>
  </Card>

  <Card title="标签 Label">
    <div class="label-demo">
      <Label for="demo-input">表单标签</Label>
      <Input id="demo-input" name="label-demo" placeholder="与 Label 关联的输入框" />
    </div>
  </Card>
  <Card title="DataTable Props">
    <PropsTable items={dataTableProps} />
  </Card>

  <Card title="DataList Props">
    <PropsTable items={dataListProps} />
  </Card>

  <Card title="StatusBadge Props">
    <PropsTable items={statusBadgeProps} />
  </Card>
</Page>

{#snippet statusCell(colId: string, row: User)}
  {#if colId === 'status'}
    <StatusBadge variant={row.status === '超额' ? 'warning' : 'normal'} />
  {:else}
    {row[colId as keyof User]}
  {/if}
{/snippet}

{#snippet rowActions(row: User)}
  <Button size="icon-sm" variant="ghost" icon={Eye} ariaLabel="查看" onclick={() => Notification.success(`查看 ${row.name}`)} />
  <Button size="icon-sm" variant="ghost" icon={Pencil} ariaLabel="编辑" onclick={() => Notification.success(`编辑 ${row.name}`)} />
  <Button size="icon-sm" variant="danger" icon={Trash2} ariaLabel="删除" onclick={() => Notification.error(`删除 ${row.name}`)} />
{/snippet}

<style>
  .label-demo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .label-demo :global(.input-wrapper) { flex: 1; }
  .list-row-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .list-name { font-weight: 500; color: var(--text-strong); }
  .list-sub { font-size: 12px; color: var(--text-muted); }
  .list-right { display: flex; align-items: center; gap: 8px; }
  .list-role { font-size: 12px; color: var(--text-muted); }
</style>

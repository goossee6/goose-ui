<script lang="ts">
  import { Card, DataTable, DataList, StatusBadge, Label, Button, Page, Input, Icon, Notification, registerMenu, unregisterMenu, onMenuAction, copyToClipboard, type Column, Row } from "goose-ui";
  import Search from "@lucide/svelte/icons/search";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Eye from "@lucide/svelte/icons/eye";
  import Copy from "@lucide/svelte/icons/copy";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { onMount, onDestroy } from "svelte";

  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: "正常" | "超额";
    storage: number;
    createdAt: string;
  }

  const users: User[] = [
    { id: 1, name: "张三", email: "zhangsan@example.com", role: "管理员", status: "正常", storage: 45, createdAt: "2024-01-15" },
    { id: 2, name: "李四", email: "lisi@example.com", role: "编辑", status: "正常", storage: 78, createdAt: "2024-02-20" },
    { id: 3, name: "王五", email: "wangwu@example.com", role: "访客", status: "超额", storage: 105, createdAt: "2024-03-08" },
    { id: 4, name: "赵六", email: "zhaoliu@example.com", role: "编辑", status: "正常", storage: 22, createdAt: "2024-03-22" },
    { id: 5, name: "钱七", email: "qianqi@example.com", role: "管理员", status: "正常", storage: 91, createdAt: "2024-04-11" },
  ];

  let highlight = $state("");

  let menuOffs: (() => void)[] = [];
  onMount(() => {
    registerMenu("user-row", [
      { id: "copy", label: "复制", icon: Copy },
      { id: "detail", label: "查看详情", icon: Eye },
    ]);
    menuOffs = [
      onMenuAction("user-row", "copy", async (d) => {
        const ok = await copyToClipboard(d.copy ?? "");
        Notification[ok ? "success" : "error"](ok ? "已复制" : "复制失败");
      }),
      onMenuAction("user-row", "detail", (d) => Notification.success(`查看：${d.copy}`)),
    ];
  });
  onDestroy(() => {
    menuOffs.forEach((off) => off());
    menuOffs = [];
    unregisterMenu("user-row");
  });

  const columns: Column<User>[] = [
    { id: "id", header: "ID", render: (r) => String(r.id), align: "center", mono: true },
    { id: "name", header: "姓名", render: (r) => r.name },
    { id: "email", header: "邮箱", render: (r) => r.email },
    { id: "role", header: "角色", render: (r) => r.role },
    { id: "status", header: "状态", render: (r) => r.status, custom: true, sortAccessor: (r) => r.status },
    { id: "storage", header: "存储用量", render: (r) => `${r.storage}%`, align: "right", sortAccessor: (r) => r.storage },
    { id: "createdAt", header: "创建时间", render: (r) => r.createdAt, align: "right" },
  ];

  const simpleColumns: Column<User>[] = [
    { id: "name", header: "姓名", render: (r) => r.name, sortable: false },
    { id: "email", header: "邮箱", render: (r) => r.email, sortable: false },
    { id: "role", header: "角色", render: (r) => r.role, sortable: false },
    { id: "storage", header: "存储用量", render: (r) => `${r.storage}%`, align: "right", sortable: false },
  ];
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  // ── 选型对照表 ────────────────────────────────────────────────────────────
  const compareRows: { k: string; table: string; list: string }[] = [
    { k: "行的结构", table: "N 个字段横向排列，字段由外部 columns 定义", list: "一块自由内容，由你写的 snippet 决定" },
    { k: "数据模型", table: "Column<T>[] 配置驱动", list: "rows + children(row)" },
    { k: "DOM 语义", table: "<table> / <thead> / <tr> / <td>", list: "<div> 堆叠，无表格语义" },
    { k: "列对齐", table: "真 <td>，同列必然对齐", list: "不自带，需自己用 grid / flex 对齐" },
    { k: "单元格内容", table: "默认只能渲染字符串；要放组件须 custom: true + cell snippet", list: "任意结构，无限制" },
    { k: "行高", table: "统一", list: "可逐行不同" },
    { k: "外观", table: "表头圆角；行 hover 为跨行滑动的圆角 pill", list: "行 hover 同样是滑动 pill，只是行间没有列" },
    { k: "自带能力", table: "排序、关键字高亮、单元格右键菜单、操作列、loading / 空态", list: "空态、rowKey、bindContainer" },
  ];

  const dataTableProps: PropsTableItem[] = [
    { name: "rows", desc: "行数据数组", type: "T[]", default: "[]" },
    { name: "columns", desc: "列配置数组，元素 { id, header, render, align?, mono?, sortable?, sortAccessor?, custom?, menu?, menuData?, width?, minWidth?, maxWidth?, resizable?, overflow? }", type: "Column<T>[]", default: "[]" },
    { name: "highlight", desc: "高亮搜索关键字", type: "string", default: "''" },
    { name: "contextMenu", desc: "启用列右键菜单", type: "boolean", default: "true" },
    { name: "menu", desc: "默认列右键菜单标识（列未单独配置时生效）", type: "string", default: "''" },
    { name: "loading", desc: "加载中状态", type: "boolean", default: "false" },
    { name: "emptyText", desc: "空数据文案", type: "string", default: "'暂无数据'" },
    { name: "disabled", desc: "行禁用判断", type: "(row: T) => boolean" },
    { name: "actions", desc: "行操作列插槽", type: "Snippet<[T]>" },
    { name: "cell", desc: "自定义单元格插槽", type: "Snippet<[string, T]>" },
    { name: "rowKey", desc: "行唯一键生成", type: "(row: T, index: number) => string | number" },
    { name: "resizable", desc: "列宽是否可拖拽调整", type: "boolean", default: "true" },
    { name: "persistKey", desc: "列宽持久化标识；不传则按实例自动生成，刷新后仍记住", type: "string", default: "''" },
    { name: "autofitOnDblClick", desc: "双击手柄时按内容自适应列宽", type: "boolean", default: "true" },
    { name: "onColumnResize", desc: "列宽变化回调，参数为 { [列id]: 百分比 }", type: "(widths: Record<string, number>) => void" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const columnProps: PropsTableItem[] = [
    { name: "id", desc: "列标识，必须唯一", type: "string" },
    { name: "header", desc: "表头文案", type: "string" },
    { name: "render", desc: "单元格文本渲染函数", type: "(row: T) => string" },
    { name: "align", desc: "对齐方式", type: "'left' | 'right' | 'center'", default: "'left'" },
    { name: "mono", desc: "等宽字体 + 等宽数字（适合 PID、端口等）", type: "boolean", default: "false" },
    { name: "sortable", desc: "是否可排序", type: "boolean", default: "true" },
    { name: "sortAccessor", desc: "排序取值函数，默认用 render 的文本", type: "(row: T) => unknown" },
    { name: "custom", desc: "为 true 才会调用 cell snippet 渲染该列", type: "boolean", default: "false" },
    { name: "width", desc: "初始宽度权重（相对值，非像素）；未设置的列均为 1，即等分", type: "number", default: "1" },
    { name: "minWidth", desc: "拖拽时的最小像素宽", type: "number", default: "56" },
    { name: "maxWidth", desc: "拖拽时的最大像素宽", type: "number" },
    { name: "resizable", desc: "该列能否拖拽；不设则跟随 DataTable 的 resizable", type: "boolean" },
    { name: "overflow", desc: "内容溢出处理：省略号 / 换行 / 纯裁切（默认省略号，hover 时横向滚动显示全文）", type: "'ellipsis' | 'wrap' | 'clip'", default: "'ellipsis'" },
  ];

  const dataListProps: PropsTableItem[] = [
    { name: "children", desc: "行渲染插槽（必填）", type: "Snippet<[T]>" },
    { name: "rows", desc: "行数据数组", type: "T[]", default: "[]" },
    { name: "emptyText", desc: "空数据文案", type: "string", default: "'暂无数据'" },
    { name: "bindContainer", desc: "容器元素引用回调", type: "(el: HTMLElement | null) => void" },
    { name: "rowKey", desc: "行唯一键生成", type: "(row: T, index: number) => string | number" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const statusBadgeProps: PropsTableItem[] = [
    { name: "variant", desc: "状态变体", type: "'normal' | 'warning'", default: "'normal'" },
    { name: "children", desc: "徽章文本", type: "Snippet" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const dataTableSource = `<script lang="ts">
  import { DataTable, Input, Icon, type Column } from "goose-ui";
  import Search from "@lucide/svelte/icons/search";

  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: "正常" | "超额";
    storage: number;
    createdAt: string;
  }

  const users: User[] = [
    { id: 1, name: "张三", email: "zhangsan@example.com", role: "管理员", status: "正常", storage: 45, createdAt: "2024-01-15" },
    { id: 2, name: "李四", email: "lisi@example.com", role: "编辑", status: "正常", storage: 78, createdAt: "2024-02-20" },
  ];

  // align / mono / custom / sortAccessor 控制列行为与排序
  const columns: Column<User>[] = [
    { id: "id", header: "ID", render: (r) => String(r.id), align: "center", mono: true },
    { id: "name", header: "姓名", render: (r) => r.name },
    { id: "email", header: "邮箱", render: (r) => r.email },
    { id: "role", header: "角色", render: (r) => r.role },
    { id: "status", header: "状态", render: (r) => r.status, custom: true, sortAccessor: (r) => r.status },
    { id: "storage", header: "存储用量", render: (r) => \`\${r.storage}%\`, align: "right", sortAccessor: (r) => r.storage },
    { id: "createdAt", header: "创建时间", render: (r) => r.createdAt, align: "right" },
  ];

  let highlight = $state("");
<\/script>

<Input name="highlight" placeholder="高亮关键字…" bind:value={highlight}>
  {#snippet prefix()}<Icon icon={Search} size={16} />{/snippet}
</Input>

<DataTable rows={users} {columns} {highlight} />`;

  const cellSource = `<script lang="ts">
  import { DataTable, StatusBadge, type Column } from "goose-ui";

  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: "正常" | "超额";
    storage: number;
    createdAt: string;
  }

  const users: User[] = [
    { id: 1, name: "张三", email: "zhangsan@example.com", role: "管理员", status: "正常", storage: 45, createdAt: "2024-01-15" },
    { id: 3, name: "王五", email: "wangwu@example.com", role: "访客", status: "超额", storage: 105, createdAt: "2024-03-08" },
  ];

  // custom: true 的列交给 cell snippet 渲染
  const columns: Column<User>[] = [
    { id: "name", header: "姓名", render: (r) => r.name },
    { id: "status", header: "状态", render: (r) => r.status, custom: true },
  ];
<\/script>

<DataTable rows={users} {columns} cell={statusCell} />

{#snippet statusCell(colId: string, row: User)}
  {#if colId === "status"}
    <StatusBadge variant={row.status === "超额" ? "warning" : "normal"} />
  {:else}
    {row[colId as keyof User]}
  {/if}
{/snippet}`;

  const actionsSource = `<script lang="ts">
  import { DataTable, Button, Notification, type Column } from "goose-ui";
  import Eye from "@lucide/svelte/icons/eye";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Trash2 from "@lucide/svelte/icons/trash-2";

  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
  }

  const users: User[] = [
    { id: 1, name: "张三", email: "zhangsan@example.com", role: "管理员" },
    { id: 2, name: "李四", email: "lisi@example.com", role: "编辑" },
  ];

  const columns: Column<User>[] = [
    { id: "name", header: "姓名", render: (r) => r.name, sortable: false },
    { id: "email", header: "邮箱", render: (r) => r.email, sortable: false },
    { id: "role", header: "角色", render: (r) => r.role, sortable: false },
  ];
<\/script>

<DataTable rows={users} {columns} actions={rowActions} />

{#snippet rowActions(row: User)}
  <Button size="icon-sm" variant="ghost" icon={Eye} ariaLabel="查看" onclick={() => Notification.success(\`查看 \${row.name}\`)} />
  <Button size="icon-sm" variant="ghost" icon={Pencil} ariaLabel="编辑" onclick={() => Notification.success(\`编辑 \${row.name}\`)} />
  <Button size="icon-sm" variant="danger" icon={Trash2} ariaLabel="删除" onclick={() => Notification.error(\`删除 \${row.name}\`)} />
{/snippet}`;

  const resizableSource = `<script lang="ts">
  import { DataTable, type Column } from "goose-ui";

  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: "正常" | "超额";
    storage: number;
    createdAt: string;
  }

  // 长文本示例：名字故意写长，用来观察默认的「截断 + hover 横向滚动」
  const users: User[] = [
    { id: 1, name: "张三丰（武当派开山祖师，长期驻留武当山紫霄宫）", email: "zhangsanfeng@wudang.example.com", role: "管理员", status: "正常", storage: 45, createdAt: "2024-01-15" },
    { id: 2, name: "李四", email: "lisi@example.com", role: "编辑", status: "正常", storage: 78, createdAt: "2024-02-20" },
  ];

  // width 是「宽度权重」而不是像素：邮箱列给 3 倍，其余 1 倍，
  // 于是窗口变宽时邮箱列按比例多占 —— 这就是不需要监听 resize 的原因。
  const columns: Column<User>[] = [
    { id: "id", header: "ID", render: (r) => String(r.id), align: "center", mono: true, width: 0.5 },
    { id: "name", header: "姓名", render: (r) => r.name, overflow: "ellipsis" },
    { id: "email", header: "邮箱", render: (r) => r.email, width: 3 },
    // 备注这类超长内容适合换行，而不是截断
    { id: "role", header: "角色", render: (r) => r.role, overflow: "wrap" },
    { id: "storage", header: "存储用量", render: (r) => \`\${r.storage}%\`, align: "right", sortable: false, maxWidth: 160 },
    // PID 这类定长数字用 clip：不要省略号，避免数字看着不像数字
    { id: "createdAt", header: "创建时间", render: (r) => r.createdAt, mono: true, overflow: "clip" },
  ];
<\/script>

<DataTable rows={users} {columns} persistKey="demo-resizable" />`;

  const stateSource = `<script lang="ts">
  import { DataTable, type Column } from "goose-ui";

  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
  }

  const columns: Column<User>[] = [
    { id: "name", header: "姓名", render: (r) => r.name },
    { id: "email", header: "邮箱", render: (r) => r.email },
    { id: "role", header: "角色", render: (r) => r.role },
  ];
<\/script>

<!-- 加载中 -->
<DataTable rows={[]} {columns} loading={true} />

<!-- 空状态（自定义文案） -->
<DataTable rows={[]} {columns} emptyText="暂无用户数据" />`;

  const dataListSource = `<script lang="ts">
  import { DataList, StatusBadge } from "goose-ui";

  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: "正常" | "超额";
  }

  const users: User[] = [
    { id: 1, name: "张三", email: "zhangsan@example.com", role: "管理员", status: "正常" },
    { id: 3, name: "王五", email: "wangwu@example.com", role: "访客", status: "超额" },
  ];
<\/script>

<DataList rows={users}>
  {#snippet children(row)}
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
      <div>
        <div style="font-weight:500">{row.name}</div>
        <div style="font-size:12px;color:var(--text-muted)">{row.email}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:var(--text-muted)">{row.role}</span>
        <StatusBadge variant={row.status === "超额" ? "warning" : "normal"} />
      </div>
    </div>
  {/snippet}
</DataList>`;

  // 对照演示：同一份 users 用两种组件渲染
  const compareSource = `<script lang="ts">
  import { DataTable, DataList, type Column } from "goose-ui";

  // 同一份数据、同样的字段，只换容器组件
  const users = [/* … */];

  // 权重 2:3:1:1 让姓名列宽、存储用量列窄，DataList 用同一套比例对齐
  const columns: Column<User>[] = [
    { id: "name", header: "姓名", render: (r) => r.name, width: 2, sortable: false },
    { id: "email", header: "邮箱", render: (r) => r.email, width: 3, sortable: false },
    { id: "role", header: "角色", render: (r) => r.role, sortable: false },
    { id: "storage", header: "存储用量", render: (r) => \`\${r.storage}%\`, align: "right", sortable: false },
  ];
<\/script>

<!-- 字段横向排列，同列对齐由 <td> 保证 -->
<DataTable rows={users} {columns} />

<!-- 每行自由排版；grid 用同一套比例，于是列位置与左表一一对应 -->
<DataList rows={users}>
  {#snippet children(row)}
    <div class="list-grid">
      <span>{row.name}</span>
      <span>{row.email}</span>
      <span>{row.role}</span>
      <span class="num">{row.storage}%</span>
    </div>
  {/snippet}
</DataList>

<style>
  .list-grid {
    display: grid;
    grid-template-columns: 2fr 3fr 1fr 1fr;
    gap: 24px;
  }
  .num { text-align: right; }
</style>`;

  /* ── 滑动高亮 ────────────────────────────────────────────────────────────── */
  const pillSource = `<script lang="ts">
  import { DataTable, DataList, PillTrack, type Column } from "goose-ui";

  const users = [/* … */];
  const columns: Column<User>[] = [/* … */];
<\/script>

<!-- 表格与列表的 hover 高亮都由内置的 PillTrack 绘制，无需自己接 -->
<DataTable rows={users} {columns} />
<DataList rows={users}>
  {#snippet children(row)}<span>{row.name}</span>{/snippet}
</DataList>

<!-- 自定义容器：把你自己的列表项选择器交给 PillTrack -->
<div class="my-list" bind:this={listEl}>
  <button class="my-item">条目一</button>
  <button class="my-item">条目二</button>
  <PillTrack
    container={listEl}
    itemSelector=".my-item"
    activeSelector=".my-item--active"
    background="var(--primary)"
    hoverBackground="var(--surface-3)"
  />
</div>`;

  const pillProps: PropsTableItem[] = [
    { name: "container", desc: "测量参照 + hover 事件挂载点（通常 bind:this 的列表/导航容器）。DataTable 用 tbody，DataList 用列表根元素；需要 position: relative", type: "HTMLElement | null", default: "null" },
    { name: "itemSelector", desc: "hover 目标项选择器（closest 委托）；空字符串则不接管 hover", type: "string", default: "''" },
    { name: "activeSelector", desc: "选中项选择器；查不到则选中 pill 隐藏", type: "string", default: "''" },
    { name: "showSelected", desc: "是否渲染选中 pill；只想要 hover 效果（如表格/列表数据行）时设为 false", type: "boolean", default: "true" },
    { name: "variant", desc: "box = 四边随项；line = 底部指示线（仅 left/width）", type: "'box' | 'line'", default: "'box'" },
    { name: "insetX", desc: "横向内缩：left = insetX，width = 容器宽 - 2×insetX", type: "number" },
    { name: "background", desc: "选中 pill 底色", type: "string", default: "'transparent'" },
    { name: "hoverBackground", desc: "hover pill 底色（项上的 data-pill-bg 可逐项覆盖）", type: "string", default: "'var(--hover)'" },
    { name: "radius", desc: "圆角（line 变体固定 1px，忽略此值）", type: "string", default: "'var(--radius-md)'" },
    { name: "shadow", desc: "选中 pill 阴影", type: "string", default: "''" },
    { name: "disabledMatch", desc: "禁用项匹配选择器，hover 时分跳过", type: "string", default: "':disabled'" },
    { name: "disabled", desc: "选中 pill 减淡（整组禁用时）", type: "boolean", default: "false" },
  ];

  const statusBadgeSource = `<script lang="ts">
  import { StatusBadge, Row } from "goose-ui";
<\/script>

<Row>
  <StatusBadge variant="normal" />
  <StatusBadge variant="warning" />
  <StatusBadge variant="normal">自定义文本</StatusBadge>
  <StatusBadge variant="warning">已超额</StatusBadge>
</Row>`;

  const labelSource = `<script lang="ts">
  import { Label, Input } from "goose-ui";
<\/script>

<div style="display:flex;align-items:center;gap:12px">
  <Label for="demo-input">表单标签</Label>
  <Input id="demo-input" name="label-demo" placeholder="与 Label 关联的输入框" />
</div>`;
</script>

<Page title="表格与列表 Table &amp; List" description="DataTable 与 DataList 是两种不同的集合容器：前者按列对齐，后者每行自由布局">
  <Card title="怎么选">
    <div class="pick">
      <div class="pick-item">
        <div class="pick-head">用 <code>DataTable</code></div>
        <div class="pick-body">
          数据是<strong>记录</strong>，每行字段固定且同名，需要横向比较。
          要排序、要按列扫视、要对单元格挂右键菜单、要关键字高亮命中字段时选它。
        </div>
      </div>
      <div class="pick-item">
        <div class="pick-head">用 <code>DataList</code></div>
        <div class="pick-body">
          数据是<strong>实体</strong>，每行是复合布局。一行里是「头像 + 标题 + 副标题 + 右侧操作」
          这种不平衡结构、行高不等、需要自定义交互时选它。
        </div>
      </div>
    </div>
    <div class="pick-rule">
      判断标准：<strong>字段在每一行是否处于相同的水平位置</strong>。是 → DataTable；不是 → DataList。
    </div>

    <div class="compare">
      <table>
        <thead>
          <tr><th>维度</th><th>DataTable</th><th>DataList</th></tr>
        </thead>
        <tbody>
          {#each compareRows as r (r.k)}
            <tr><td class="k">{r.k}</td><td>{r.table}</td><td>{r.list}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Card>

  <CodePreview title="同一份数据，两种容器" code={compareSource} flush>
    <div class="side">
      <div class="side-col">
        <div class="side-label">DataTable — 列对齐由 &lt;td&gt; 保证</div>
        <div class="side-box">
          <DataTable rows={users} columns={simpleColumns} />
        </div>
      </div>
      <div class="side-col">
        <div class="side-label">DataList — 同一套比例，列位置与左表对应</div>
        <div class="side-box">
          <DataList rows={users}>
            {#snippet children(row)}
              <div class="list-grid">
                <span class="list-name">{row.name}</span>
                <span class="list-mail">{row.email}</span>
                <span class="list-meta">{row.role}</span>
                <span class="list-meta num">{row.storage}%</span>
              </div>
            {/snippet}
          </DataList>
        </div>
      </div>
    </div>
  </CodePreview>

  <CodePreview title="DataTable · 可排序 + 关键字高亮 + 列右键菜单" code={dataTableSource} flush>
    {#snippet right()}
      <div style="width:220px">
        <Input name="highlight" placeholder="高亮关键字…" bind:value={highlight} onClear={() => Notification.success("已清除搜索")}>
          {#snippet prefix()}<Icon icon={Search} size={16} />{/snippet}
        </Input>
      </div>
    {/snippet}
    <div style="max-height:360px;overflow:auto">
      <DataTable rows={users} {columns} {highlight} menu="user-row" />
    </div>
  </CodePreview>

  <CodePreview title="DataTable · 自定义单元格（custom + cell snippet）" code={cellSource} flush>
    <div style="max-height:320px;overflow:auto">
      <DataTable rows={users} {columns} cell={statusCell} />
    </div>
  </CodePreview>

  <CodePreview title="DataTable · 操作列（actions snippet）" code={actionsSource} flush>
    <DataTable rows={users} columns={simpleColumns} actions={rowActions} />
  </CodePreview>

  <CodePreview title="DataTable · 可拖拽列宽 + hover 滚动 + 双击自适应" code={resizableSource} flush>
    <div style="max-height:320px">
      <DataTable rows={users} {columns} persistKey="demo-resizable" />
    </div>
  </CodePreview>

  <CodePreview title="DataTable · 加载中 / 空状态" code={stateSource} flush>
    <DataTable rows={[]} columns={simpleColumns} loading={true} />
    <DataTable rows={[]} columns={simpleColumns} emptyText="暂无用户数据" />
  </CodePreview>

  <CodePreview title="DataList · 复合行布局" code={dataListSource} flush>
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
              <StatusBadge variant={row.status === "超额" ? "warning" : "normal"} />
            </div>
          </div>
        {/snippet}
      </DataList>
    </div>
  </CodePreview>

  <CodePreview title="滑动高亮 · 行 hover 的 pill 动画" code={pillSource} flush>
    <p class="note">
      DataTable 与 DataList 的 hover 高亮不是简单的 <code>:hover</code> 换色，而是由内置的
      <code>PillTrack</code> 绘制的一块圆角带：鼠标在行间移动时它带 0.22s 缓动从上一行滑到下一行，
      行高不同也能贴准。禁止行（DataTable 的 <code>disabled</code>）不参与，鼠标划过时 pill 停在上一个可用行。
      要给自己写的列表接同一套效果，把容器元素和项选择器交给 <code>PillTrack</code> 即可，
      容器需要 <code>position: relative</code>。
    </p>
    <div class="side">
      <div class="side-col">
        <div class="side-label">DataTable — 行间滑动</div>
        <div class="side-box">
          <DataTable rows={users} columns={simpleColumns} disabled={(r) => r.status === "超额"} />
        </div>
      </div>
      <div class="side-col">
        <div class="side-label">DataList — 行高不一时同样贴准</div>
        <div class="side-box">
          <DataList rows={users}>
            {#snippet children(row)}
              <div class="list-row-inner">
                <div>
                  <div class="list-name">{row.name}</div>
                  <div class="list-sub">{row.email}</div>
                </div>
                <StatusBadge variant={row.status === "超额" ? "warning" : "normal"} />
              </div>
            {/snippet}
          </DataList>
        </div>
      </div>
    </div>
  </CodePreview>

  <Card title="配合使用：StatusBadge 与 Label">
    <p class="note">
      这两个不是集合容器，但经常出现在表格/列表里：<code>StatusBadge</code> 用于状态列，
      <code>Label</code> 用于配套表单控件。
    </p>
    <CodePreview title="StatusBadge 状态徽章" code={statusBadgeSource}>
      <Row>
        <StatusBadge variant="normal" />
        <StatusBadge variant="warning" />
        <StatusBadge variant="normal">自定义文本</StatusBadge>
        <StatusBadge variant="warning">已超额</StatusBadge>
      </Row>
    </CodePreview>
    <CodePreview title="Label 表单标签" code={labelSource}>
      <div class="label-demo">
        <Label for="demo-input">表单标签</Label>
        <Input id="demo-input" name="label-demo" placeholder="与 Label 关联的输入框" />
      </div>
    </CodePreview>
  </Card>

  <Card title="DataTable Props">
    <PropsTable items={dataTableProps} />
  </Card>

  <Card title="Column&lt;T&gt; 字段">
    <PropsTable items={columnProps} />
  </Card>

  <Card title="DataList Props">
    <PropsTable items={dataListProps} />
  </Card>

  <Card title="PillTrack Props">
    <p class="note">
      表格与列表的 hover 高亮就是它画的，一般不用直接使用；要给自己写的列表接同一套滑动效果时再传参。
      容器需 <code>position: relative</code>，pill 挂在容器内容区，随容器一起滚动。
    </p>
    <PropsTable items={pillProps} />
  </Card>

  <Card title="StatusBadge Props">
    <PropsTable items={statusBadgeProps} />
  </Card>
</Page>

{#snippet statusCell(colId: string, row: User)}
  {#if colId === "status"}
    <StatusBadge variant={row.status === "超额" ? "warning" : "normal"} />
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
  /* ── 选型说明 ─────────────────────────────────────────────── */
  .pick {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-lg);
    margin-bottom: var(--sp-lg);
  }
  .pick-item {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--sp-md) var(--sp-lg);
    background: var(--surface-2);
  }
  .pick-head {
    font-weight: 600;
    color: var(--text-strong);
    margin-bottom: var(--sp-sm);
  }
  .pick-body {
    font-size: 13px;
    line-height: 1.6;
    color: var(--text);
  }
  .pick-rule {
    padding: var(--sp-md) var(--sp-lg);
    border-left: 3px solid var(--primary);
    background: var(--accent-sub);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    font-size: 13px;
    color: var(--text);
    margin-bottom: var(--sp-lg);
  }
  code {
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--surface-3);
    color: var(--text-strong);
  }
  .compare {
    overflow-x: auto;
    /* 作为 Card 的直接子项时 min-width 默认 auto，会被 nowrap 表头撑开，
       导致 overflow-x 失效、横向滚动条跑到整页上。 */
    min-width: 0;
  }
  .compare table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .compare th {
    text-align: left;
    padding: var(--sp-md) var(--sp-lg);
    background: var(--surface-2);
    color: var(--text-muted);
    font-weight: 500;
    border-bottom: 1px solid var(--border-strong);
    /* 只在宽屏下 nowrap：窄屏允许换行，避免表格被撑到必须横向滚动 */
    white-space: nowrap;
  }
  @media (max-width: 720px) {
    .compare th { white-space: normal; }
  }
  .compare td {
    padding: var(--sp-md) var(--sp-lg);
    border-bottom: 1px solid var(--border);
    color: var(--text);
    vertical-align: top;
    line-height: 1.55;
  }
  .compare td.k {
    color: var(--text-muted);
    white-space: nowrap;
  }
  .compare tbody tr:last-child td {
    border-bottom: none;
  }

  /* ── 同数据双渲染对照 ─────────────────────────────────────── */
  .side {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-lg);
  }
  .side-col {
    min-width: 0;
  }
  .side-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: var(--sp-sm);
  }
  .side-box {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    max-height: 300px;
    /* CodePreview 以 flush 渲染（预览区自身无内边距），表格/列表会直接贴在
       卡片边框上；这里补回一圈内边距，并把圆角交给外层裁切，表头圆角才不会
       压在自己方角的外框上。 */
    padding: var(--sp-lg);
  }
  /* 列位置与左侧 DataTable 对齐：24px 单元格内边距 + 2:3:1:1 的列权重，
     列表行的排版因而能逐列对上左表的 <td>。 */
  .list-grid {
    display: grid;
    grid-template-columns: 2fr 3fr 1fr 1fr;
    gap: 24px;
    align-items: center;
  }
  .list-mail,
  .list-grid .list-meta {
    /* 与 DataTable 的 td 对齐：同样 14px、同样省略号截断，行高才对得上 */
    font-size: 14px;
    color: var(--text);
  }
  .list-mail {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .list-grid .num {
    text-align: right;
  }

  .note {
    margin: 0 0 var(--sp-md);
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
  }

  /* ── 原有 ─────────────────────────────────────────────────── */
  .label-demo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .label-demo :global(.input-wrapper) {
    flex: 1;
  }
  .list-row-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .list-name {
    font-weight: 500;
    color: var(--text-strong);
  }
  .list-sub {
    font-size: 12px;
    color: var(--text-muted);
  }
  .list-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .list-role,
  .list-meta {
    font-size: 12px;
    color: var(--text-muted);
  }

  @media (max-width: 720px) {
    .pick,
    .side {
      grid-template-columns: 1fr;
    }
  }
</style>

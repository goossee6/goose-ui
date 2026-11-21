// 表格 / 列表演示页共用的代码示例字符串（原样保留，供 CodePreview 展示）。
// 各页从这里 import 需要的片段，拆页后不再每页复制一遍。

  export const dataTableSource = `<script lang="ts">
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
    { id: 3, name: "王五", email: "wangwu@example.com", role: "访客", status: "超额", storage: 105, createdAt: "2024-03-08" },
    { id: 4, name: "赵六", email: "zhaoliu@example.com", role: "编辑", status: "正常", storage: 22, createdAt: "2024-03-22" },
    { id: 5, name: "钱七", email: "qianqi@example.com", role: "管理员", status: "正常", storage: 91, createdAt: "2024-04-11" },
    { id: 6, name: "孙八", email: "sunba@example.com", role: "编辑", status: "正常", storage: 36, createdAt: "2024-05-06" },
    { id: 7, name: "周九", email: "zhoujiu@example.com", role: "访客", status: "正常", storage: 12, createdAt: "2024-06-18" },
    { id: 8, name: "吴十", email: "wushi@example.com", role: "编辑", status: "超额", storage: 118, createdAt: "2024-07-02" },
    { id: 9, name: "郑十一", email: "zhengshiyi@example.com", role: "访客", status: "正常", storage: 64, createdAt: "2024-08-24" },
    { id: 10, name: "冯十二", email: "fengshier@example.com", role: "管理员", status: "正常", storage: 53, createdAt: "2024-09-30" },
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

  export const cellSource = `<script lang="ts">
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
    { id: 2, name: "李四", email: "lisi@example.com", role: "编辑", status: "正常", storage: 78, createdAt: "2024-02-20" },
    { id: 3, name: "王五", email: "wangwu@example.com", role: "访客", status: "超额", storage: 105, createdAt: "2024-03-08" },
    { id: 4, name: "赵六", email: "zhaoliu@example.com", role: "编辑", status: "正常", storage: 22, createdAt: "2024-03-22" },
    { id: 5, name: "钱七", email: "qianqi@example.com", role: "管理员", status: "正常", storage: 91, createdAt: "2024-04-11" },
    { id: 6, name: "孙八", email: "sunba@example.com", role: "编辑", status: "正常", storage: 36, createdAt: "2024-05-06" },
    { id: 7, name: "周九", email: "zhoujiu@example.com", role: "访客", status: "正常", storage: 12, createdAt: "2024-06-18" },
    { id: 8, name: "吴十", email: "wushi@example.com", role: "编辑", status: "超额", storage: 118, createdAt: "2024-07-02" },
    { id: 9, name: "郑十一", email: "zhengshiyi@example.com", role: "访客", status: "正常", storage: 64, createdAt: "2024-08-24" },
    { id: 10, name: "冯十二", email: "fengshier@example.com", role: "管理员", status: "正常", storage: 53, createdAt: "2024-09-30" },
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

  export const actionsSource = `<script lang="ts">
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
    { id: 3, name: "王五", email: "wangwu@example.com", role: "访客" },
    { id: 4, name: "赵六", email: "zhaoliu@example.com", role: "编辑" },
    { id: 5, name: "钱七", email: "qianqi@example.com", role: "管理员" },
    { id: 6, name: "孙八", email: "sunba@example.com", role: "编辑" },
    { id: 7, name: "周九", email: "zhoujiu@example.com", role: "访客" },
    { id: 8, name: "吴十", email: "wushi@example.com", role: "编辑" },
    { id: 9, name: "郑十一", email: "zhengshiyi@example.com", role: "访客" },
    { id: 10, name: "冯十二", email: "fengshier@example.com", role: "管理员" },
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

  export const resizableSource = `<script lang="ts">
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

  // 长文本示例：名字故意写长，用来观察默认的「换行 + 格内滚动」
  const users: User[] = [
    { id: 1, name: "张三丰（武当派开山祖师，长期驻留武当山紫霄宫）", email: "zhangsanfeng@wudang.example.com", role: "管理员", status: "正常", storage: 45, createdAt: "2024-01-15" },
    { id: 2, name: "李四", email: "lisi@example.com", role: "编辑", status: "正常", storage: 78, createdAt: "2024-02-20" },
    { id: 3, name: "王五", email: "wangwu@example.com", role: "访客", status: "超额", storage: 105, createdAt: "2024-03-08" },
    { id: 4, name: "赵六", email: "zhaoliu@example.com", role: "编辑", status: "正常", storage: 22, createdAt: "2024-03-22" },
    { id: 5, name: "钱七", email: "qianqi@example.com", role: "管理员", status: "正常", storage: 91, createdAt: "2024-04-11" },
    { id: 6, name: "孙八", email: "sunba@example.com", role: "编辑", status: "正常", storage: 36, createdAt: "2024-05-06" },
    { id: 7, name: "周九", email: "zhoujiu@example.com", role: "访客", status: "正常", storage: 12, createdAt: "2024-06-18" },
    { id: 8, name: "吴十", email: "wushi@example.com", role: "编辑", status: "超额", storage: 118, createdAt: "2024-07-02" },
    { id: 9, name: "郑十一", email: "zhengshiyi@example.com", role: "访客", status: "正常", storage: 64, createdAt: "2024-08-24" },
    { id: 10, name: "冯十二", email: "fengshier@example.com", role: "管理员", status: "正常", storage: 53, createdAt: "2024-09-30" },
  ];

  // 不写 width 就是 auto：列宽跟着内容走（表格是 table-layout: auto）。
  // 想卡住某列再声明，三种写法可混用：
  //   2      → 占 2 份（相对其它声明的列）
  //   "20%"  → 占容器宽度的 20%
  //   "160px"→ 按像素写，内部换算成百分比
  // 写了只是「建议宽度」；长内容一律在格子里折行，不会把表格撑得比容器宽。
  // 默认 overflow: "wrap" —— 折行，超过 3 行在格内垂直滚动（cellMaxLines 可调）。
  const columns: Column<User>[] = [
    { id: "id", header: "ID", render: (r) => String(r.id), align: "center", mono: true },
    { id: "name", header: "姓名", render: (r) => r.name },
    { id: "email", header: "邮箱", render: (r) => r.email },
    { id: "role", header: "角色", render: (r) => r.role },
    { id: "status", header: "状态", render: (r) => r.status, custom: true },
    { id: "storage", header: "存储用量", render: (r) => \`\${r.storage}%\`, align: "right" },
    { id: "createdAt", header: "创建时间", render: (r) => r.createdAt, align: "right" },
  ];
<\/script>

<DataTable rows={users} {columns} />`;

  export const overflowSource = `<script lang="ts">
  import { DataTable, type Column } from "goose-ui";

  // 三列渲染同一段文字，只有 overflow 不同，差别才好对照
  interface NoteRow { id: number; note: string }

  const longNote =
    "张三丰，武当派开山祖师，长期驻留武当山紫霄宫，主持内功心法的整理与弟子名册的校订，每季还要巡视各处分坛、复核账目，并把新入门的弟子逐条录入名册。";

  const rows: NoteRow[] = [
    { id: 1, note: longNote },
    { id: 2, note: "李四，编辑，负责日常内容校对与发布排期。" },
    { id: 3, note: "王五，访客，只读权限，仅可查看公开页面。" },
  ];

  const columns: Column<NoteRow>[] = [
    // 不写 overflow 即默认 wrap：折行，超过 cellMaxLines（默认 3）行后在格内垂直滚动
    { id: "wrap", header: "① wrap · 折行", render: (r) => r.note, width: "40%" },
    // ellipsis：单行截断 + 省略号（单行列要配 width，fixed 布局下才分得到宽度）
    { id: "ellipsis", header: "② ellipsis · 省略号", render: (r) => r.note, overflow: "ellipsis", width: "30%" },
    // scroll：单行 + 悬停无限循环滚动（长 ID、文件名、URL 这类不能折行又要看全的列）
    { id: "scroll", header: "③ scroll · 悬停滚动", render: (r) => r.note, overflow: "scroll", width: "30%" },
  ];
<\/script>

<DataTable {rows} {columns} />`;

  export const stateSource = `<script lang="ts">
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

  export const dataListSource = `<script lang="ts">
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
    { id: 2, name: "李四", email: "lisi@example.com", role: "编辑", status: "正常" },
    { id: 3, name: "王五", email: "wangwu@example.com", role: "访客", status: "超额" },
    { id: 4, name: "赵六", email: "zhaoliu@example.com", role: "编辑", status: "正常" },
    { id: 5, name: "钱七", email: "qianqi@example.com", role: "管理员", status: "正常" },
    { id: 6, name: "孙八", email: "sunba@example.com", role: "编辑", status: "正常" },
    { id: 7, name: "周九", email: "zhoujiu@example.com", role: "访客", status: "正常" },
    { id: 8, name: "吴十", email: "wushi@example.com", role: "编辑", status: "超额" },
    { id: 9, name: "郑十一", email: "zhengshiyi@example.com", role: "访客", status: "正常" },
    { id: 10, name: "冯十二", email: "fengshier@example.com", role: "管理员", status: "正常" },
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

  export const listHeaderSource = `<script lang="ts">
  import { DataList, DataTable, Header, StatusBadge, Input } from "goose-ui";
  import Search from "@lucide/svelte/icons/search";

  const users = [/* … */];
  let keyword = $state("");
<\/script>

<!-- ① 最小用法：只给标题。内置 header 就是 Header 组件本身 -->
<DataList rows={users} title="成员">
  {#snippet children(row)}<span>{row.name}</span>{/snippet}
</DataList>

<!-- ② Header 的三段槽位原样可用：left / center / right -->
<DataList rows={users}>
  {#snippet header()}
    <span style="font-size:15px;font-weight:600">成员</span>
    <span style="font-size:12px;color:var(--text-muted)">共 5 人</span>
  {/snippet}
  {#snippet headerCenter()}
    <Input placeholder="搜索成员" bind:value={keyword} />
  {/snippet}
  {#snippet headerRight()}
    <Button size="small">新建</Button>
  {/snippet}
  {#snippet children(row)}<span>{row.name}</span>{/snippet}
</DataList>

<!-- ③ 内置 header 默认 64px 高；要改就透传 headerStyle，
        其余样式（底色、对齐）也一并走它 -->
<DataList
  rows={users}
  title="成员"
  headerStyle="--header-h:60px;background:var(--surface-2)"
>
  {#snippet children(row)}<span>{row.name}</span>{/snippet}
</DataList>

<!-- ④ 独立成块（外面没有内边距）：dataTableHeader 让行盒两侧各缩 16px
        （与 hover pill 同宽）、每项自带边框；吸顶 header 与分隔线铺到边缘 -->
<div class="panel" style="height:420px">
  <DataList rows={users} title="成员" dataTableHeader>
    {#snippet children(row)}<span>{row.name}</span>{/snippet}
  </DataList>
</div>

<!-- ⑤ 表格自己的表头：与 Header 吸在一起需要共用一个外层滚动容器，
        headerBleed 让表头磨砂铺到左右边缘 -->
<div class="panel" style="height:420px;overflow:auto">
  <Header title="成员" height="auto" style="margin:0;padding:0 16px" />
  <DataTable rows={users} columns={columns} headerBleed={16} />
</div>

<!-- ⑥ 不要 header：什么都不传，组件不会多出任何节点 -->
<DataList rows={users}>{#snippet children(row)}{row.name}{/snippet}</DataList>`;

  export const compareSource = `<script lang="ts">
  import { DataTable, DataList, type Column } from "goose-ui";

  // 同一份数据、同样的字段，只换容器组件
  const users = [/* … 10 条 */];

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


  export const pillSource = `<script lang="ts">
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

  export const statusBadgeSource = `<script lang="ts">
  import { StatusBadge, Row } from "goose-ui";
<\/script>

<Row>
  <StatusBadge variant="normal" />
  <StatusBadge variant="warning" />
  <StatusBadge variant="normal">自定义文本</StatusBadge>
  <StatusBadge variant="warning">已超额</StatusBadge>
</Row>`;


  export const stickySource = `<script lang="ts">
  import { DataTable, type Column } from "goose-ui";

  const users = [/* … */];               // 行数要多于容器能显示的行数
  const columns: Column<User>[] = [/* … */];
<\/script>

<!-- 外面给一个高度即可：滚动发生在表格自己的 .table-container 里，
     表头是 position:sticky，吸在容器顶部不跟着行走 -->
<div style="height:320px">
  <DataTable rows={users} {columns} />
</div>`;


  export const noStickySource = `<script lang="ts">
  import { DataTable, type Column } from "goose-ui";

  const users = [/* … */];
  const columns: Column<User>[] = [/* … */];
<\/script>

<!-- 一页里有很多张表（或表格嵌在多层滚动容器里）时，sticky 表头
     每帧都要重算吸顶位置。传 stickyHeader={false} 关掉，表头跟着行滚走，
     底色与下边框都还在，列名与数据仍然分得开 -->
<DataTable rows={users} {columns} stickyHeader={false} />`;

  export const labelSource = `<script lang="ts">
  import { Label, Input } from "goose-ui";
<\/script>

<div style="display:flex;align-items:center;gap:12px">
  <Label for="demo-input">表单标签</Label>
  <Input id="demo-input" name="label-demo" placeholder="与 Label 关联的输入框" />
</div>`;


<script lang="ts">
  import {Card, Page, Pagination, DataTable, type Column} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "page", desc: "当前页（双向绑定）", type: "number", default: "1" },
    { name: "total", desc: "总条数", type: "number", default: "0" },
    { name: "pageSize", desc: "每页条数", type: "number", default: "10" },
    { name: "siblingCount", desc: "当前页两侧保留页数", type: "number", default: "1" },
    { name: "showTotal", desc: "显示总条数", type: "boolean", default: "true" },
    { name: "showQuickJumper", desc: "显示「跳至 [ ] 页」输入框（回车或失焦提交）", type: "boolean", default: "false" },
    { name: "onchange", desc: "翻页回调", type: "(page: number) => void", default: "—" },
  ];

  let page = $state(1);
  let page2 = $state(5);
  let page3 = $state(28);

  // ── 配合真实数据的示例：87 条确定性虚拟订单 ────────────────────────────
  interface Order {
    no: number;
    id: string;
    customer: string;
    dept: string;
    amount: number;
    status: string;
  }

  const CUSTOMERS = ["张伟", "李娜", "王强", "刘洋", "陈静", "杨帆", "赵磊", "黄敏", "周杰", "吴桐", "徐蕾", "孙鹏"];
  const DEPTS = ["研发部", "市场部", "财务部", "运营部", "人事部"];
  const STATUSES = ["已完成", "处理中", "待审核", "已取消"];

  /* 步长与数组长度互质，取模才不会几行一循环 —— 否则每 12 条客户就重来一遍，一眼假 */
  const orders: Order[] = Array.from({ length: 87 }, (_, i) => ({
    no: i + 1,
    id: `SO-${1001 + i}`,
    customer: CUSTOMERS[(i * 7) % CUSTOMERS.length],
    dept: DEPTS[(i * 3) % DEPTS.length],
    amount: 1200 + ((i * 3721) % 46000),
    status: STATUSES[(i * 5) % STATUSES.length],
  }));

  const orderColumns: Column<Order>[] = [
    // 表格只渲染当前页，排序会变成「只排这 10 条」，所以这里整列关掉，别给人错觉
    { id: "no", header: "#", render: (r) => String(r.no), align: "right", mono: true, width: 1, sortable: false },
    { id: "id", header: "订单号", render: (r) => r.id, mono: true, width: 3, sortable: false },
    { id: "customer", header: "客户", render: (r) => r.customer, width: 2, sortable: false },
    { id: "dept", header: "部门", render: (r) => r.dept, width: 2, sortable: false },
    { id: "amount", header: "金额", render: (r) => `¥ ${r.amount.toLocaleString("zh-CN")}`, align: "right", mono: true, width: 2, sortable: false },
    { id: "status", header: "状态", render: (r) => r.status, width: 2, sortable: false },
  ];

  const PAGE_SIZE = 10;
  let dataPage = $state(1);
  const pageRows = $derived(orders.slice((dataPage - 1) * PAGE_SIZE, dataPage * PAGE_SIZE));
  const from = $derived((dataPage - 1) * PAGE_SIZE + 1);
  const to = $derived(Math.min(orders.length, dataPage * PAGE_SIZE));

  const basicSource = `<script lang="ts">
  import { Pagination } from "goose-ui";

  let page = $state(1);
<\/script>

<Pagination bind:page total={87} pageSize={10} />`;

  const collapseSource = `<script lang="ts">
  import { Pagination } from "goose-ui";

  let page = $state(5);
<\/script>

<Pagination bind:page total={520} pageSize={10} siblingCount={2} />`;

  const jumperSource = `<script lang="ts">
  import { Pagination } from "goose-ui";

  let page = $state(28);
<\/script>

<!-- 52 页时一页页翻太费劲：showQuickJumper 打开「跳至 [ ] 页」 -->
<Pagination
  bind:page
  total={520}
  pageSize={10}
  siblingCount={2}
  showQuickJumper
/>`;

  const dataSource = `<script lang="ts">
  import { DataTable, Pagination, type Column } from "goose-ui";

  const PAGE_SIZE = 10;
  const orders = Array.from({ length: 87 }, (_, i) => ({
    no: i + 1,
    id: \`SO-\${1001 + i}\`,
    customer: CUSTOMERS[(i * 7) % CUSTOMERS.length],
    amount: 1200 + ((i * 3721) % 46000),
  }));

  let page = $state(1);
  const pageRows = $derived(
    orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  );
<\/script>

<!-- 表格只吃当前页的数据 -->
<DataTable rows={pageRows} columns={columns} maxHeight="none" />

<Pagination bind:page total={orders.length} pageSize={PAGE_SIZE} />`;
</script>

<Page toc title="Pagination 分页" description="分页导航，自动折叠长页码列表，可开启「跳至 [ ] 页」直接输入目标页；配合 87 条虚拟订单演示分页与真实数据的联动">
  <CodePreview anchor="basic" anchorLevel={2} title="基础用法" code={basicSource}>
    <Pagination bind:page total={87} pageSize={10} onchange={(p) => (page = p)} />
    <p class="note">当前页：{page}</p>
  </CodePreview>

  <CodePreview anchor="total-520-siblingcount-2" anchorLevel={2} title="长列表折叠（total=520, siblingCount=2）" code={collapseSource}>
    <Pagination bind:page={page2} total={520} pageSize={10} siblingCount={2} />
    <p class="note">当前页：{page2}</p>
  </CodePreview>

  <CodePreview anchor="quick-jumper" anchorLevel={2} title="输入目标页（showQuickJumper）" code={jumperSource}>
    <Pagination bind:page={page3} total={520} pageSize={10} siblingCount={2} showQuickJumper />
    <p class="note">当前页：{page3} / 共 52 页 —— 在输入框里敲数字后回车（或点击别处）即跳转；超出范围会夹到 1–52，Esc 清空</p>
  </CodePreview>

  <CodePreview anchor="real-data" anchorLevel={2} title="配合真实数据（87 条虚拟订单）" code={dataSource}>
    <div class="data-demo">
      <DataTable
        rows={pageRows}
        columns={orderColumns}
        rowKey={(r) => r.id}
        contextMenu={false}
        maxHeight="none"
      />
      <div class="data-foot">
        <Pagination bind:page={dataPage} total={orders.length} pageSize={PAGE_SIZE} />
        <span class="note">第 {from}–{to} 条 / 共 {orders.length} 条，每页 {PAGE_SIZE} 条</span>
      </div>
    </div>
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={props} />
  </Card>
</Page>

<style>
  .note { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin: 10px 0 0; }
  .data-demo { display: flex; flex-direction: column; gap: 12px; }
  .data-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .data-foot .note { margin: 0; }
</style>

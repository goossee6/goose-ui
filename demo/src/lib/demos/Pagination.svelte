<script lang="ts">
  import {Card, Page, Pagination} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "page", desc: "当前页（双向绑定）", type: "number", default: "1" },
    { name: "total", desc: "总条数", type: "number", default: "0" },
    { name: "pageSize", desc: "每页条数", type: "number", default: "10" },
    { name: "siblingCount", desc: "当前页两侧保留页数", type: "number", default: "1" },
    { name: "showTotal", desc: "显示总条数", type: "boolean", default: "true" },
    { name: "onchange", desc: "翻页回调", type: "(page: number) => void", default: "—" },
  ];

  let page = $state(1);
  let page2 = $state(5);

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
</script>

<Page title="Pagination 分页" description="分页导航，自动折叠长页码列表">
  <CodePreview title="基础用法" code={basicSource}>
    <Pagination bind:page total={87} pageSize={10} onchange={(p) => (page = p)} />
    <p class="note">当前页：{page}</p>
  </CodePreview>

  <CodePreview title="长列表折叠（total=520, siblingCount=2）" code={collapseSource}>
    <Pagination bind:page={page2} total={520} pageSize={10} siblingCount={2} />
    <p class="note">当前页：{page2}</p>
  </CodePreview>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .note { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin: 10px 0 0; }
</style>

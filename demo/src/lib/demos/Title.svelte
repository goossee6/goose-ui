<script lang="ts">
  import {Card, PageHeader, Page, Button} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const pageHeaderProps: PropsTableItem[] = [
    { name: "title", desc: "主标题", type: "string", default: "''" },
    { name: "description", desc: "描述文本", type: "string", default: "''" },
    { name: "right", desc: "右侧操作区插槽", type: "Snippet" },
    { name: "children", desc: "标题下方内容", type: "Snippet" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const basicSource = `<script lang="ts">
  import { PageHeader } from "goose-ui";
<\/script>

<PageHeader title="基础标题" description="这是一个基础的页面标题" />`;

  const titleOnlySource = `<script lang="ts">
  import { PageHeader } from "goose-ui";
<\/script>

<PageHeader title="简洁标题" />`;

  const customSource = `<script lang="ts">
  import { PageHeader } from "goose-ui";
<\/script>

<PageHeader>
  <span style="font-size:16px;font-weight:600">自定义标题内容</span>
</PageHeader>`;

  const actionsSource = `<script lang="ts">
  import { PageHeader, Button } from "goose-ui";
<\/script>

<PageHeader title="管理页面" description="管理您的数据">
  {#snippet right()}
    <Button size="small">导出</Button>
    <Button size="small" variant="primary">新建</Button>
  {/snippet}
</PageHeader>`;
</script>

<Page title="PageHeader 页面标题" description="页面顶部标题区域，支持标题、描述和右侧操作区" >
  <CodePreview title="基础用法" code={basicSource}>
    <PageHeader title="基础标题" description="这是一个基础的页面标题" />
  </CodePreview>

  <CodePreview title="仅标题" code={titleOnlySource}>
    <PageHeader title="简洁标题" />
  </CodePreview>

  <CodePreview title="自定义内容" code={customSource}>
    <PageHeader>
      <span class="custom-title">自定义标题内容</span>
    </PageHeader>
  </CodePreview>

  <CodePreview title="带操作按钮" code={actionsSource}>
    <PageHeader title="管理页面" description="管理您的数据">
      {#snippet right()}
        <Button size="small">导出</Button>
        <Button size="small" variant="primary">新建</Button>
      {/snippet}
    </PageHeader>
  </CodePreview>
  <Card title="Props">
    <PropsTable items={pageHeaderProps} />
  </Card>
</Page>

<style>
  .custom-title { font-size: 16px; font-weight: 600; color: var(--text-strong); }
</style>

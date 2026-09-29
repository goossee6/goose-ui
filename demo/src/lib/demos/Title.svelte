<script lang="ts">
  import {Card, PageHeader, Page} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const pageHeaderProps: PropsTableItem[] = [
    { name: "title", desc: "主标题", type: "string", default: "''" },
    { name: "description", desc: "描述文本", type: "string", default: "''" },
    { name: "right", desc: "右侧操作区插槽", type: "Snippet" },
    { name: "children", desc: "标题下方内容", type: "Snippet" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
  ];
</script>

<Page title="PageHeader 页面标题" description="页面顶部标题区域，支持标题、描述和右侧操作区" >
  <Card title="基础用法">
    <PageHeader title="基础标题" description="这是一个基础的页面标题" />
  </Card>

  <Card title="仅标题">
    <PageHeader title="简洁标题" />
  </Card>

  <Card title="自定义内容">
    <PageHeader>
      <span class="custom-title">自定义标题内容</span>
    </PageHeader>
  </Card>

  <Card title="带操作按钮">
    <PageHeader title="管理页面" description="管理您的数据">
      {#snippet right()}
        <button class="demo-btn">导出</button>
        <button class="demo-btn demo-btn--primary">新建</button>
      {/snippet}
    </PageHeader>
  </Card>
  <Card title="Props">
    <PropsTable items={pageHeaderProps} />
  </Card>
</Page>

<style>
  .custom-title { font-size: 16px; font-weight: 600; color: var(--text-strong); }
  .demo-btn {
    padding: 6px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
  }
  .demo-btn:hover { background: var(--hover); color: var(--text-strong); }
  .demo-btn--primary { background: var(--primary); color: #fff; border-color: var(--primary); }
  .demo-btn--primary:hover { opacity: 0.9; }
</style>

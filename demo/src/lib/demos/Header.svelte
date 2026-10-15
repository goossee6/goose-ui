<script lang="ts">
  import {Header, Card, Icon, Page, ThemeToggle, Button} from "goose-ui";
  import Search from '@lucide/svelte/icons/search';
  import Bell from '@lucide/svelte/icons/bell';
  import Settings from '@lucide/svelte/icons/settings';
  import User from '@lucide/svelte/icons/user';
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const headerProps: PropsTableItem[] = [
    { name: "title", desc: "左侧标题", type: "string", default: "''" },
    { name: "height", desc: "头部高度", type: "string", default: "'52px'" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
    { name: "left", desc: "左侧插槽", type: "Snippet" },
    { name: "center", desc: "中部插槽", type: "Snippet" },
    { name: "right", desc: "右侧插槽", type: "Snippet" },
    { name: "children", desc: "默认插槽", type: "Snippet" },
  ];

  // Header 自带负 margin 抵消父容器内边距，且依赖滚动祖先实现 sticky；
  // 下面的预览框仅用于在 demo 中造出可滚动容器，接入真实布局时不需要。
  const basicSource = `<script lang="ts">
  import { Header } from "goose-ui";
<\/script>

<Header title="页面标题" />`;

  const actionsSource = `<script lang="ts">
  import { Header, Button } from "goose-ui";
  import Search from "@lucide/svelte/icons/search";
  import Bell from "@lucide/svelte/icons/bell";
  import Settings from "@lucide/svelte/icons/settings";
<\/script>

<Header title="管理后台">
  {#snippet right()}
    <Button size="icon-sm" variant="ghost" icon={Search} ariaLabel="搜索" />
    <Button size="icon-sm" variant="ghost" icon={Bell} ariaLabel="通知" />
    <Button size="icon-sm" variant="ghost" icon={Settings} ariaLabel="设置" />
  {/snippet}
</Header>`;

  const breadcrumbSource = `<script lang="ts">
  import { Header } from "goose-ui";
<\/script>

<Header>
  {#snippet left()}
    <span style="font-size:13px;color:var(--text-muted)">首页</span>
    <span style="margin:0 4px;font-size:12px;color:var(--text-muted)">/</span>
    <span style="font-size:13px;color:var(--text-muted)">组件</span>
    <span style="margin:0 4px;font-size:12px;color:var(--text-muted)">/</span>
    <span style="font-size:13px;color:var(--text-strong);font-weight:500">Header</span>
  {/snippet}
</Header>`;

  const centerSource = `<script lang="ts">
  import { Header, Icon } from "goose-ui";
  import Search from "@lucide/svelte/icons/search";
<\/script>

<Header title="搜索">
  {#snippet center()}
    <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface);color:var(--text-muted);font-size:13px;width:200px">
      <Icon icon={Search} size={14} />
      <span>搜索组件...</span>
    </div>
  {/snippet}
</Header>`;

  const fullWidthSource = `<script lang="ts">
  import { Header, Button, ThemeToggle } from "goose-ui";
  import User from "@lucide/svelte/icons/user";
<\/script>

<Header title="全宽 Header">
  {#snippet right()}
    <ThemeToggle />
    <Button size="icon-sm" variant="ghost" icon={User} ariaLabel="用户" />
  {/snippet}
</Header>`;
</script>

<Page title="Header 头部导航" description="滚动容器顶部的吸顶导航条，支持标题、操作区、自定义插槽" >
  <CodePreview title="基础用法" code={basicSource}>
    <div class="demo-preview">
      <div class="preview-frame">
        <Header title="页面标题" />
        <div class="preview-content">内容区域</div>
      </div>
    </div>
  </CodePreview>

  <CodePreview title="带操作按钮" code={actionsSource}>
    <div class="demo-preview">
      <div class="preview-frame">
        <Header title="管理后台">
          {#snippet right()}
            <Button size="icon-sm" variant="ghost" icon={Search} ariaLabel="搜索" />
            <Button size="icon-sm" variant="ghost" icon={Bell} ariaLabel="通知" />
            <Button size="icon-sm" variant="ghost" icon={Settings} ariaLabel="设置" />
          {/snippet}
        </Header>
        <div class="preview-content">内容区域</div>
      </div>
    </div>
  </CodePreview>

  <CodePreview title="面包屑导航" code={breadcrumbSource}>
    <div class="demo-preview">
      <div class="preview-frame">
        <Header>
          {#snippet left()}
            <span class="demo-breadcrumb">首页</span>
            <span class="demo-breadcrumb-sep">/</span>
            <span class="demo-breadcrumb">组件</span>
            <span class="demo-breadcrumb-sep">/</span>
            <span class="demo-breadcrumb demo-breadcrumb--active">Header</span>
          {/snippet}
        </Header>
        <div class="preview-content">内容区域</div>
      </div>
    </div>
  </CodePreview>

  <CodePreview title="自定义中间区域" code={centerSource}>
    <div class="demo-preview">
      <div class="preview-frame">
        <Header title="搜索">
          {#snippet center()}
            <div class="demo-search">
              <Icon icon={Search} size={14} />
              <span>搜索组件...</span>
            </div>
          {/snippet}
        </Header>
        <div class="preview-content">内容区域</div>
      </div>
    </div>
  </CodePreview>

  <CodePreview title="全宽布局" code={fullWidthSource}>
    <div class="demo-preview">
      <div class="preview-frame preview-frame--full">
        <Header title="全宽 Header">
          {#snippet right()}
            <ThemeToggle />
            <Button size="icon-sm" variant="ghost" icon={User} ariaLabel="用户" />
          {/snippet}
        </Header>
        <div class="preview-content preview-content--full">内容区域（全宽）</div>
      </div>
    </div>
  </CodePreview>
  <Card title="Props">
    <PropsTable items={headerProps} />
  </Card>
</Page>

<style>
  .demo-preview { width: 100%; }
  .preview-frame {
    position: relative;
    height: 120px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    /* 可滚动容器：Header 的 sticky 演示依赖滚动祖先 */
    overflow-y: auto;
    background: var(--bg);
  }
  .preview-frame--full { margin: 0 -20px; border-radius: 0; border-left: none; border-right: none; }
  .preview-content {
    padding: 16px 20px 20px;
    font-size: 13px;
    color: var(--text-muted);
    /* 内容高于视口，制造滚动使 sticky 可观察 */
    min-height: 320px;
  }
  .preview-content--full { padding-left: 40px; }
  /* Header 自带负 margin 抵消 Layout 卡片内边距；demo 预览框内无此内边距，需归零并给自身留白 */
  .preview-frame :global(.header) {
    margin: 0;
    padding: 0 16px;
  }
  .demo-breadcrumb { font-size: 13px; color: var(--text-muted); }
  .demo-breadcrumb--active { color: var(--text-strong); font-weight: 500; }
  .demo-breadcrumb-sep { margin: 0 4px; color: var(--text-muted); font-size: 12px; }
  .demo-search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 13px;
    width: 200px;
  }
</style>

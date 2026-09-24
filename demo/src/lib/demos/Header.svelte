<script lang="ts">
  import { Header, Card, Icon, PageHeader, ThemeToggle } from 'goose-ui';
  import { Search, Bell, Settings, User } from '@lucide/svelte';
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const headerProps: PropsTableItem[] = [
    { name: "title", desc: "左侧标题", type: "string", default: "''" },
    { name: "collapsed", desc: "侧边栏折叠态（联动左边距）", type: "boolean", default: "false" },
    { name: "sidebarWidth", desc: "侧边栏展开时的左边距", type: "string", default: "'252px'" },
    { name: "sidebarCollapsedWidth", desc: "侧边栏折叠时的左边距", type: "string", default: "'88px'" },
    { name: "height", desc: "头部高度", type: "string", default: "'52px'" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "left", desc: "左侧插槽", type: "Snippet" },
    { name: "center", desc: "中部插槽", type: "Snippet" },
    { name: "right", desc: "右侧插槽", type: "Snippet" },
    { name: "children", desc: "默认插槽", type: "Snippet" },
  ];
</script>

<PageHeader title="Header 头部导航" description="固定在顶部的导航栏，支持标题、操作区、自定义插槽" />

<div class="demo-grid">
  <Card title="基础用法">
    <div class="demo-preview">
      <div class="preview-frame">
        <Header title="页面标题" />
        <div class="preview-content">内容区域</div>
      </div>
    </div>
  </Card>

  <Card title="带操作按钮">
    <div class="demo-preview">
      <div class="preview-frame">
        <Header title="管理后台">
          {#snippet right()}
            <button class="demo-icon-btn"><Icon icon={Search} size={14} /></button>
            <button class="demo-icon-btn"><Icon icon={Bell} size={14} /></button>
            <button class="demo-icon-btn"><Icon icon={Settings} size={14} /></button>
          {/snippet}
        </Header>
        <div class="preview-content">内容区域</div>
      </div>
    </div>
  </Card>

  <Card title="面包屑导航">
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
  </Card>

  <Card title="自定义中间区域">
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
  </Card>

  <Card title="全宽布局">
    <div class="demo-preview">
      <div class="preview-frame preview-frame--full">
        <Header title="全宽 Header" collapsed={true}>
          {#snippet right()}
            <ThemeToggle />
            <button class="demo-icon-btn"><Icon icon={User} size={14} /></button>
          {/snippet}
        </Header>
        <div class="preview-content preview-content--full">内容区域（全宽）</div>
      </div>
    </div>
  </Card>
  <Card title="Props">
    <PropsTable items={headerProps} />
  </Card>
</div>

<style>
  .demo-grid { display: flex; flex-direction: column; gap: var(--gap-2xl); }
  .demo-preview { width: 100%; }
  .preview-frame {
    position: relative;
    height: 120px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--bg);
  }
  .preview-frame--full { margin: 0 -20px; border-radius: 0; border-left: none; border-right: none; }
  .preview-content {
    padding: 60px 20px 20px;
    font-size: 13px;
    color: var(--text-muted);
  }
  .preview-content--full { padding-left: 40px; }
  .demo-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text-muted);
    cursor: pointer;
  }
  .demo-icon-btn:hover { background: var(--hover); color: var(--text-strong); }
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

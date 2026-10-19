<script lang="ts">
  import {Card, Page} from "goose-ui";
  import PropsTable, { type PropsTableItem } from '../PropsTable.svelte';
  import CodePreview from "../CodePreview.svelte";

  const layoutProps: PropsTableItem[] = [
    { name: "title", desc: "传递给 TitleBar 的标题", type: "string", default: "''" },
    { name: "logo", desc: "传递给 TitleBar 的 logo（渐变文字或图标）", type: "string | Component" },
    { name: "subtitle", desc: "传递给 TitleBar 的副标题（纯文字）", type: "string" },
    { name: "theme", desc: "传递给 TitleBar 的主题", type: "'light' | 'dark'", default: "'light'" },
    { name: "onThemeToggle", desc: "传递给 TitleBar 的主题切换回调", type: "(e: MouseEvent) => void" },
    { name: "controls", desc: "透传给 TitleBar 的窗口按钮区 snippet", type: "Snippet" },
    { name: "windowControls", desc: "透传给 TitleBar：false 隐藏默认窗口三键", type: "boolean", default: "true" },
    { name: "tabs", desc: "左侧侧边栏内容", type: "Snippet" },
    { name: "children", desc: "主内容区", type: "Snippet" },
    { name: "scroll", desc: "内容卡片整页滚动；false = 框架不滚、页内滚动区自理", type: "boolean", default: "true" },
    { name: "resize", desc: "Wails 窗口支持：全域拖拽调整 + 四角手柄", type: "boolean", default: "false" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const structureSource = `<script lang="ts">
  import { Layout, Tabs } from "goose-ui";
<\/script>

<Layout title="我的应用" theme="light" windowControls={true}>
  {#snippet tabs()}
    <Tabs items={[{ value: 'home', label: '首页' }]} value="home" />
  {/snippet}
  <p>主内容区</p>
</Layout>`;
</script>

<Page toc title="Layout 布局" description="Wails3 桌面应用完整外壳布局，包含标题栏、侧边栏和主内容区">
  <CodePreview anchor="structure" anchorLevel={2} title="布局结构" code={structureSource}>
    <div class="layout-diagram">
      <div class="diagram-titlebar">TitleBar 标题栏</div>
      <div class="diagram-body">
        <div class="diagram-sidebar">
          <span>侧边栏 Tabs</span>
        </div>
        <div class="diagram-content">
          <span>Main 内容区</span>
        </div>
      </div>
    </div>
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={layoutProps} />
  </Card>

  <Card title="说明">
    <div class="demo-note">
      <p>Layout 是一个全视口应用外壳，设计用于 Wails3 桌面应用。</p>
      <p>在浏览器中可预览结构，但窗口控制功能需在 Wails3 环境中使用。</p>
    </div>
  </Card>
</Page>

<style>
  .layout-diagram {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
    font-size: 12px;
    color: var(--text-muted);
  }
  .diagram-titlebar {
    padding: 8px 12px;
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
    font-weight: 600;
  }
  .diagram-body { display: flex; height: 160px; }
  .diagram-sidebar {
    width: 140px;
    padding: 8px;
    border-right: 1px solid var(--border);
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .diagram-content {
    flex: 1;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
  }
  .demo-note { font-size: 13px; color: var(--text-muted); line-height: 1.8; }
  .demo-note p { margin: 0; }
</style>

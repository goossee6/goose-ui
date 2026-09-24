<script lang="ts">
  import { Card, PageHeader } from 'goose-ui';
</script>

<PageHeader title="Layout 布局" description="Wails3 桌面应用完整外壳布局，包含标题栏、侧边栏和主内容区" />

<div class="demo-grid">
  <Card title="布局结构">
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
  </Card>

  <Card title="Props">
    <div class="props-table">
      <div class="prop-row">
        <span class="prop-name">title</span>
        <span class="prop-type">string</span>
        <span class="prop-desc">传递给 TitleBar 的标题</span>
      </div>
      <div class="prop-row">
        <span class="prop-name">theme</span>
        <span class="prop-type">'light' | 'dark'</span>
        <span class="prop-desc">传递给 TitleBar 的主题</span>
      </div>
      <div class="prop-row">
        <span class="prop-name">onThemeToggle</span>
        <span class="prop-type">(e: MouseEvent) =&gt; void</span>
        <span class="prop-desc">传递给 TitleBar 的主题切换回调</span>
      </div>
      <div class="prop-row">
        <span class="prop-name">tabs</span>
        <span class="prop-type">Snippet</span>
        <span class="prop-desc">左侧侧边栏内容</span>
      </div>
      <div class="prop-row">
        <span class="prop-name">children</span>
        <span class="prop-type">Snippet</span>
        <span class="prop-desc">主内容区</span>
      </div>
    </div>
  </Card>

  <Card title="说明">
    <div class="demo-note">
      <p>Layout 是一个全视口应用外壳，设计用于 Wails3 桌面应用。</p>
      <p>在浏览器中可预览结构，但窗口控制功能需在 Wails3 环境中使用。</p>
    </div>
  </Card>
</div>

<style>
  .demo-grid { display: flex; flex-direction: column; gap: var(--gap-2xl); }
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
  .props-table { font-size: 13px; }
  .prop-row {
    display: flex;
    gap: 16px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
  }
  .prop-row:last-child { border-bottom: none; }
  .prop-name { font-weight: 600; color: var(--text-strong); min-width: 120px; }
  .prop-type { color: var(--primary); min-width: 160px; font-family: var(--font-mono); font-size: 12px; }
  .prop-desc { color: var(--text-muted); }
  .demo-note { font-size: 13px; color: var(--text-muted); line-height: 1.8; }
  .demo-note p { margin: 0; }
</style>

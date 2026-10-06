<script lang="ts">
  import { Card, Page } from 'goose-ui';
</script>

<Page title="首页" description="goose-ui — 零第三方依赖的 Svelte 5 纯 CSS 组件库">
  <div class="demo-grid">
    <Card title="快速上手">
      <div class="demo-block">
        <p>1. 安装：</p>
        <code>pnpm add goose-ui</code>
        <p>2. 应用入口引入主题与初始化：</p>
        <code>import 'goose-ui/styles/theme.css';</code>
        <code>{'import { initTheme } from "goose-ui"; initTheme();'}</code>
        <p>3. 组件按需导入：</p>
        <code>{'import { Button, Card, Sidebar } from "goose-ui";'}</code>
      </div>
    </Card>

    <Card title="从左侧开始">
      <p class="demo-note">
        左侧导航选择组件进入对应演示页。顶层「首页」项与分组同级穿插，点击可随时回到本页；
        每个页面的 URL 可直接分享，刷新后停留在当前页。
      </p>
    </Card>
  </div>
</Page>

<style>
  .demo-grid {
    display: flex;
    flex-direction: column;
    gap: var(--gap-2xl);
  }
  .demo-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .demo-block p {
    font-size: 13px;
    color: var(--text);
    margin: 6px 0 0;
  }
  .demo-block code {
    display: block;
    padding: 8px 12px;
    border-radius: var(--radius-md);
    background: var(--surface-2);
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text);
  }
  .demo-note {
    font-size: 13px;
    line-height: 1.8;
    color: var(--text-muted);
    margin: 0;
  }
</style>

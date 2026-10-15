<script lang="ts">
  import { Card, Page, Row, Tag } from "goose-ui";
  import CodePreview from "../CodePreview.svelte";

  const installSource = `pnpm add goose-ui`;

  const setupSource = `// src/main.ts（或任意应用入口）
import "goose-ui/styles/theme.css";
import { initTheme } from "goose-ui";

initTheme(); // 应用持久化的亮/暗主题与主题色`;

  const firstSource = `<script lang="ts">
  import { Button, Card, NotificationProvider, Notification } from "goose-ui";
<\/script>

<!-- 通知容器：App 顶层挂载一次 -->
<NotificationProvider />

<Card title="用户信息">
  <p>卡片内容</p>
  <Button variant="primary" onclick={() => Notification.success("保存成功")}>
    保存
  </Button>
</Card>`;

  const themeSource = `/* 改色相即可换主题：亮/暗两套自动派生 */
:root {
  --hue-accent: 25;      /* 强调色 */
  --hue-complement: 230; /* 互补色 */
}`;

  const shellSource = `<script lang="ts">
  import {
    Layout, Sidebar, Page, themeStore, toggleThemeFromEvent,
    type SidebarEntry,
  } from "goose-ui";

  const groups: SidebarEntry[] = [
    { title: "组件", items: [{ value: "home", label: "首页" }] },
  ];
  let active = $state("home");
<\/script>

<Layout title="我的应用" theme={themeStore.theme} onThemeToggle={toggleThemeFromEvent}>
  {#snippet tabs()}
    <Sidebar {groups} bind:activeTab={active} embedded />
  {/snippet}

  <Page title="首页">内容区</Page>
</Layout>`;

  const highlights = [
    { label: "零第三方依赖", desc: "运行时仅需 Svelte 5 + 纯 CSS，图标可选" },
    { label: "Svelte 5 Runes", desc: "全面 $props / $state / $derived / $effect" },
    { label: "亮暗双主题", desc: "色相旋钮配置，明度彩度自动派生" },
    { label: "可复制源码", desc: "每个示例都能「效果 / 源码」切换并一键复制" },
  ];
</script>

<Page title="首页" description="goose-ui — 零第三方依赖的 Svelte 5 纯 CSS 组件库">
  <Card title="特性">
    <div class="feat-grid">
      {#each highlights as h (h.label)}
        <div class="feat">
          <Tag variant="primary">{h.label}</Tag>
          <span class="feat-desc">{h.desc}</span>
        </div>
      {/each}
    </div>
  </Card>

  <CodePreview title="1. 安装" code={installSource} language="bash">
    <p class="note">包管理器命令，装完即可按需引入组件。</p>
  </CodePreview>

  <CodePreview title="2. 应用入口初始化" code={setupSource} language="ts">
    <p class="note">
      主题样式与应用初始化只需在入口做一次：<code>initTheme()</code> 会读取持久化的亮/暗偏好与主题色，
      并跟随系统深浅色变化。
    </p>
  </CodePreview>

  <CodePreview title="3. 第一个组件" code={firstSource}>
    <Row style="align-items:center;gap:12px;flex-wrap:wrap">
      <span class="note">左侧导航可进入任意组件页；每页的「效果 / 源码」都能一键复制。</span>
    </Row>
  </CodePreview>

  <CodePreview title="4. 换主题色" code={themeSource} language="css">
    <p class="note">
      只改色相即可，系统会为亮色与暗色分别派生整套配色。也可用
      <code>setHue('accent', 25)</code> 在代码里设置并持久化（详见侧栏「设置」页）。
    </p>
  </CodePreview>

  <CodePreview title="5. 完整应用外壳（可选）" code={shellSource}>
    <p class="note">
      <code>Layout</code> 把「标题栏 + 侧边导航 + 内容区」一次组装好，适合 Wails3 桌面应用或后台系统。
    </p>
  </CodePreview>

  <Card title="怎么用这个 demo">
    <ul class="tips">
      <li>左侧导航按「基础 / 表单 / 反馈 / 数据展示 / 工具 / Wails3」分组，点进去即是该组件的独立演示页。</li>
      <li>每个用法卡片右上角有 <strong>效果 / 源码</strong> 切换与<strong>复制</strong>按钮，源码已包含 <code>import</code>，可直接粘进项目。</li>
      <li>页面 URL 用 hash 路由（如 <code>#/button</code>），可直接分享或刷新后停留在当前页。</li>
      <li>侧栏底部「设置」可可视化调节主题色，改动全局立即生效。</li>
    </ul>
  </Card>
</Page>

<style>
  .feat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--sp-lg);
  }
  .feat {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }
  .feat-desc {
    font-size: 12px;
    line-height: 1.7;
    color: var(--text-muted);
  }
  .note {
    margin: 0;
    font-size: 13px;
    line-height: 1.8;
    color: var(--text-muted);
  }
  .note code,
  .tips code {
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--accent-sub);
    color: var(--accent);
  }
  .tips {
    margin: 0;
    padding-left: 20px;
    font-size: 13px;
    line-height: 2;
    color: var(--text-muted);
  }
  .tips strong {
    color: var(--text);
  }
</style>

<script lang="ts">
  import { Card, Page, Row, CodeBlock } from "goose-ui";

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
    Layout, TitleBar, Sidebar, Page, themeStore, toggleThemeFromEvent,
    type SidebarEntry,
  } from "goose-ui";

  const groups: SidebarEntry[] = [
    { title: "组件", items: [{ value: "home", label: "首页" }] },
  ];
  let active = $state("home");
<\/script>

<Layout>
  {#snippet titlebar()}
    <TitleBar
      title="我的应用"
      theme={themeStore.theme}
      onThemeToggle={toggleThemeFromEvent}
    />
  {/snippet}
  {#snippet aside()}
    <Sidebar {groups} bind:activeTab={active} embedded />
  {/snippet}

  <Page title="首页">内容区</Page>
</Layout>`;

  const agentSource = `# 安装 goose-ui 技能到 AI 编码代理
npx skills add goossee6/goose-ui        # Claude Code / Codex / Cursor 通用`;

  const steps = [
    { n: 1, title: "安装" },
    { n: 2, title: "入口初始化" },
    { n: 3, title: "第一个组件" },
    { n: 4, title: "换主题色" },
    { n: 5, title: "完整应用外壳" },
  ];
</script>

<Page toc title="开始使用" description="从安装到完整应用外壳，五步接入 goose-ui">
  <Row style="align-items:center;gap:6px;flex-wrap:wrap">
    {#each steps as s (s.n)}
      <span class="step-chip">{s.n}. {s.title}</span>
    {/each}
  </Row>

  <Card anchor="install" title="1. 安装">
    <p class="note">包管理器命令，装完即可按需引入组件。</p>
    <CodeBlock code={installSource} language="bash" />
  </Card>

  <Card anchor="entry" title="2. 应用入口初始化">
    <p class="note">
      主题样式与初始化只需在入口做一次：<code>initTheme()</code> 会读取持久化的亮/暗偏好与主题色，
      并跟随系统深浅色变化。
    </p>
    <CodeBlock code={setupSource} language="ts" />
  </Card>

  <Card anchor="first-component" title="3. 第一个组件">
    <p class="note">
      组件按需导入即可使用。左侧导航可进入任意组件页，那里的示例都带「效果 / 源码」切换与一键复制。
    </p>
    <CodeBlock code={firstSource} language="svelte" maxHeight="320px" />
  </Card>

  <Card anchor="accent-theme" title="4. 换主题色">
    <p class="note">
      只改色相即可，系统会为亮色与暗色分别派生整套配色。也可用
      <code>setHue('accent', 25)</code> 在代码里设置并持久化（详见左侧「设置」页）。
    </p>
    <CodeBlock code={themeSource} language="css" />
  </Card>

  <Card anchor="app-shell" title="5. 完整应用外壳（可选）">
    <p class="note">
      <code>Layout</code> 只提供「顶栏 / 侧栏 / 内容区」三个区域，不内置任何组件；
      用 <code>titlebar</code> 和 <code>aside</code> 插槽自行组合 TitleBar、Sidebar 等，适合 Wails3 桌面应用或后台系统。
    </p>
    <CodeBlock code={shellSource} language="svelte" maxHeight="320px" />
  </Card>

  <Card anchor="ai代理" title="让 AI 代理学会用 goose-ui">
    <p class="note">
      本仓库附带一份可安装的 agent 技能（组件选型 / 主题约定 / 反例清单），
      装到 Claude Code / Codex / Cursor 后，模型会按 goose-ui 的约定写界面。
    </p>
    <CodeBlock code={agentSource} language="bash" />
    <p class="note">
      技能正文见仓库 <code>skills/goose-ui/SKILL.md</code>，也可在侧栏「Skill」页查看与复制全文。
    </p>
  </Card>
</Page>

<style>
  .step-chip {
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 9999px;
    background: var(--accent-sub);
    color: var(--accent);
    white-space: nowrap;
  }
  .note {
    margin: 0 0 var(--sp-md);
    font-size: 13px;
    line-height: 1.8;
    color: var(--text-muted);
  }
  .note code {
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--accent-sub);
    color: var(--accent);
  }
</style>

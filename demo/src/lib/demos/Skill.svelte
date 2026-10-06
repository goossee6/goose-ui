<script lang="ts">
  import {Card, Page, Tag, Row, CodeBlock, Button, Notification} from "goose-ui";

  const features = [
    { title: "零第三方依赖", desc: "组件运行时仅依赖 Svelte 5 与纯 CSS，图标可选接入 @lucide/svelte。", tag: "核心" },
    { title: "Svelte 5 Runes", desc: "$props / $state / $derived / $effect 全量采用，双向绑定走 $bindable。", tag: "核心" },
    { title: "CSS 变量主题", desc: "theme.css 单文件提供全部 --sp-*/--radius-*/颜色变量，换肤零耦合。", tag: "主题" },
    { title: "Wails3 桌面友好", desc: "TitleBar / Layout / Sidebar 等外壳组件为桌面应用场景预置。", tag: "桌面" },
    { title: "Barrel + Subpath 双通道", desc: "既可 import { Button } from 'goose-ui'，也可 goose-ui/button 单件引入。", tag: "工程" },
    { title: "无障碍基线", desc: "role/aria/键盘导航/svelte-ignore 按组件逐一处理，svelte-check 0 errors。", tag: "质量" },
  ];

  const quickStart = `// 1. 安装（workspace 内直接引用）
import { Button, Card, Notification } from "goose-ui";

// 2. 入口引入一次主题
import "goose-ui/styles/theme.css";

// 3. 使用
<Button variant="primary" onclick={() => Notification.success("Hello goose-ui")}>
  开始
</Button>`;
</script>

<Page title="Skill 介绍" description="goose-ui 能力概览与快速上手">
  <Card title="这是什么">
    <p class="lead">
      goose-ui 是一个面向 Svelte 5 / Wails3 的纯 CSS 组件库：50+ 组件、主题单文件、零运行时依赖。
      本页汇总它的核心能力与最小接入路径。
    </p>
    <Row>
      <Tag variant="primary" dot>Svelte 5</Tag>
      <Tag variant="success" dot>零依赖</Tag>
      <Tag variant="info" dot>Wails3</Tag>
      <Tag variant="warning" dot>theme.css</Tag>
      <Tag>MIT</Tag>
    </Row>
  </Card>

  <Card title="核心能力">
    <div class="grid">
      {#each features as f (f.title)}
        <div class="cell">
          <Row><strong class="cell-title">{f.title}</strong><Tag size="small">{f.tag}</Tag></Row>
          <p class="cell-desc">{f.desc}</p>
        </div>
      {/each}
    </div>
  </Card>

  <Card title="三步接入">
    <CodeBlock code={quickStart} language="ts" />
    <div class="actions">
      <Button size="small" variant="primary" onclick={() => Notification.info("见 README「新项目接入」章节")}>
        接入文档
      </Button>
      <Button size="small" onclick={() => Notification.info("左侧导航切换组件演示页")}>
        浏览组件
      </Button>
    </div>
  </Card>
</Page>

<style>
  .lead { margin: 0 0 var(--sp-md); font-size: 14px; line-height: 1.7; color: var(--text); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--sp-md); }
  .cell { padding: var(--sp-md); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface-2); }
  .cell-title { font-size: 14px; color: var(--text-strong); }
  .cell-desc { margin: var(--sp-xs) 0 0; font-size: 12.5px; line-height: 1.6; color: var(--text-muted); }
  .actions { display: flex; gap: var(--sp-sm); margin-top: var(--sp-md); }
</style>

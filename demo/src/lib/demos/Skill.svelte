<script lang="ts">
  import { Card, Page, Tag, Row, Button, Notification, CodeBlock, copyToClipboard } from "goose-ui";
  // 引用仓库里真实存在的技能文件 —— 页面展示的内容就是 agent 实际安装到的东西
  import skillMd from "../../../../skills/goose-ui/SKILL.md?raw";

  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | null = null;

  const installCmd = "npx skills add goossee6/goose-ui";

  const features = [
    { title: "组件选型速查", desc: "按需求 → 组件的映射表，覆盖 50+ 组件。", tag: "选型" },
    { title: "主题约定", desc: "色相旋钮 / accent 体系 / 中性色不染色等规则。", tag: "主题" },
    { title: "常见组合", desc: "表单校验、右键菜单、页面骨架等典型用法。", tag: "组合" },
    { title: "反例清单", desc: "context 陷阱、button 嵌套、魔法 z-index 等不要做。", tag: "质量" },
  ];

  async function copySkill() {
    const ok = await copyToClipboard(skillMd);
    if (ok) {
      copied = true;
      Notification.success("SKILL.md 全文已复制");
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 1600);
    } else {
      Notification.error("复制失败");
    }
  }
</script>

<Page title="Skill" description="可安装到 AI 编码代理的 goose-ui 使用技能">
  <Card title="这是什么">
    <p class="lead">
      本仓库附带一份 <code>goose-ui</code> 技能 —— 一份写好「组件选型 / 主题约定 / 反例清单」的
      SKILL.md，可安装到 AI 编码代理。装上后，模型会按 goose-ui 的组件与约定直接写出正确界面，
      而不是凭记忆猜测 API。
    </p>
    <Row style="align-items:center;gap:8px;flex-wrap:wrap">
      <Tag variant="primary" dot>Claude Code</Tag>
      <Tag variant="info" dot>Codex</Tag>
      <Tag variant="info" dot>Cursor</Tag>
      <Tag size="small">Markdown · 零依赖</Tag>
    </Row>
  </Card>

  <Card title="安装">
    <p class="note">在项目根目录执行（支持任意能读取 markdown 的 agent）：</p>
    <CodeBlock code={installCmd} language="bash" />
    <p class="note">
      手动安装：把仓库里的 <code>skills/goose-ui/SKILL.md</code> 放进 agent 的技能目录
      （如 Claude Code 的 <code>.claude/skills/goose-ui/</code>）即可。
    </p>
  </Card>

  <Card title="技能里写了什么">
    <div class="grid">
      {#each features as f (f.title)}
        <div class="cell">
          <Row><strong class="cell-title">{f.title}</strong><Tag size="small">{f.tag}</Tag></Row>
          <p class="cell-desc">{f.desc}</p>
        </div>
      {/each}
    </div>
  </Card>

  <Card title="SKILL.md 全文">
    <div style="display:flex;justify-content:flex-end;margin-bottom:var(--sp-md)">
      <Button size="small" variant="default" onclick={copySkill}>{copied ? '已复制' : '复制全文'}</Button>
    </div>
    <CodeBlock code={skillMd} language="markdown" maxHeight="480px" />
  </Card>
</Page>

<style>
  .lead {
    margin: 0 0 var(--sp-lg);
    font-size: 14px;
    line-height: 1.8;
    color: var(--text);
  }
  .lead code {
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--accent-sub);
    color: var(--accent);
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
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--sp-lg);
  }
  .cell {
    padding: var(--sp-lg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface-2);
  }
  .cell-title {
    font-size: 14px;
    color: var(--text-strong);
  }
  .cell-desc {
    margin: var(--sp-sm) 0 0;
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--text-muted);
  }
</style>

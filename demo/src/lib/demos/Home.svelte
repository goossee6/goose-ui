<script lang="ts">
  import { Button, Page, Tag } from "goose-ui";
  import Rocket from "@lucide/svelte/icons/rocket";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Sparkles from "@lucide/svelte/icons/sparkles";

  const stats = [
    { value: "50+", label: "组件" },
    { value: "0", label: "运行时依赖" },
    { value: "1", label: "主题文件" },
    { value: "2", label: "内置主题" },
  ];

  const features = [
    {
      icon: Rocket,
      title: "开箱即用的外壳",
      desc: "Layout + Sidebar + Page 把标题栏、导航、内容区一次组装好，为 Wails3 桌面场景预置。",
    },
    {
      icon: Sparkles,
      title: "色相旋钮主题",
      desc: "只改 6 个色相值，亮暗两套配色自动派生；明度彩度由系统保证对比度。",
    },
    {
      icon: BookOpen,
      title: "可复制的演示",
      desc: "每个组件页的示例都带「效果 / 源码」切换与一键复制，源码包含 import。",
    },
  ];

  const entries = [
    {
      href: "#/getstarted",
      tag: "入门",
      title: "开始使用",
      desc: "从安装到完整外壳的五步接入路径。",
    },
    {
      href: "#/skill",
      tag: "AI",
      title: "Skill 技能",
      desc: "把 goose-ui 的约定装进 AI 编码代理。",
    },
    {
      href: "#/settings",
      tag: "设置",
      title: "主题色调节",
      desc: "滑块实时调整全局强调色与互补色。",
    },
    {
      href: "#/button",
      tag: "组件",
      title: "浏览组件",
      desc: "从左侧分组进入 50+ 组件的独立演示页。",
    },
  ];

  function go(hash: string) {
    location.hash = hash;
  }
</script>

<div class="hero">
  <div class="hero-tags">
    <Tag variant="primary" dot>Svelte 5 Runes</Tag>
    <Tag variant="success" dot>零依赖</Tag>
    <Tag variant="info" dot>Wails3</Tag>
    <Tag>MIT</Tag>
  </div>

  <h1 class="hero-title">goose-ui</h1>
  <p class="hero-sub">
    零第三方依赖的 Svelte 5 纯 CSS 组件库 ——
    为桌面与后台应用准备的 <em>50+ 组件</em>、单文件主题与开箱即用的应用外壳。
  </p>

  <div class="hero-actions">
    <Button variant="primary" size="large" onclick={() => go("#/getstarted")}>
      开始使用 →
    </Button>
    <Button variant="default" size="large" onclick={() => go("#/button")}>
      浏览组件
    </Button>
  </div>

  <div class="hero-stats">
    {#each stats as s (s.label)}
      <div class="stat">
        <span class="stat-value">{s.value}</span>
        <span class="stat-label">{s.label}</span>
      </div>
    {/each}
  </div>
</div>

<div class="feat-grid">
  {#each features as f (f.title)}
    <div class="feat">
      <div class="feat-icon"><f.icon size={18} /></div>
      <div>
        <div class="feat-title">{f.title}</div>
        <p class="feat-desc">{f.desc}</p>
      </div>
    </div>
  {/each}
</div>

<div class="entry-grid">
  {#each entries as e (e.title)}
    <button type="button" class="entry" onclick={() => go(e.href)}>
      <span class="entry-tag">{e.tag}</span>
      <span class="entry-title">{e.title} →</span>
      <span class="entry-desc">{e.desc}</span>
    </button>
  {/each}
</div>

<style>
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 56px 16px 40px;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background:
      radial-gradient(1200px 320px at 50% -80px, var(--accent-sub), transparent 70%),
      var(--surface);
    overflow: hidden;
  }
  .hero-tags {
    display: flex;
    gap: var(--sp-sm);
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 20px;
  }
  .hero-title {
    margin: 0;
    font-size: 44px;
    line-height: 1.1;
    letter-spacing: -0.02em;
    font-weight: 700;
    color: var(--text-strong);
    background: linear-gradient(120deg, var(--text-strong) 55%, var(--accent));
    -webkit-background-clip: text;
    background-clip: text;
  }
  .hero-sub {
    max-width: 620px;
    margin: 14px 0 26px;
    font-size: 15px;
    line-height: 1.9;
    color: var(--text-muted);
  }
  .hero-sub em {
    font-style: normal;
    color: var(--accent);
    font-weight: 600;
  }
  .hero-actions {
    display: flex;
    gap: var(--sp-md);
    flex-wrap: wrap;
    justify-content: center;
  }
  .hero-stats {
    display: flex;
    gap: 36px;
    margin-top: 34px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-strong);
    font-family: var(--font-mono);
  }
  .stat-label {
    font-size: 12px;
    color: var(--text-muted);
  }

  .feat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--sp-lg);
    margin-top: var(--sp-lg);
  }
  .feat {
    display: flex;
    gap: var(--sp-md);
    padding: var(--sp-lg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }
  .feat-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-md);
    background: var(--accent-sub);
    color: var(--accent);
    flex-shrink: 0;
  }
  .feat-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-strong);
  }
  .feat-desc {
    margin: 4px 0 0;
    font-size: 12.5px;
    line-height: 1.7;
    color: var(--text-muted);
  }

  .entry-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: var(--sp-md);
    margin-top: var(--sp-lg);
  }
  .entry {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: var(--sp-lg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface);
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  }
  .entry:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .entry-tag {
    font-size: 11px;
    padding: 1px 8px;
    border-radius: 9999px;
    background: var(--accent-sub);
    color: var(--accent);
  }
  .entry-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-strong);
  }
  .entry-desc {
    font-size: 12.5px;
    line-height: 1.7;
    color: var(--text-muted);
  }
</style>

<script lang="ts">
  import { Button, Card, Tag, Avatar, Toggle, ProgressBar, TitleBar, type WindowController, themeStore, toggleThemeFromEvent } from "goose-ui";
  import Rocket from "@lucide/svelte/icons/rocket";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import Sparkles from "@lucide/svelte/icons/sparkles";
  import Box from "@lucide/svelte/icons/box";
  import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
  import Users from "@lucide/svelte/icons/users";
  import FileText from "@lucide/svelte/icons/file-text";
  import Bell from "@lucide/svelte/icons/bell";
  import Settings from "@lucide/svelte/icons/settings";

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

  /* ── 模拟 Wails3 桌面应用 ───────────────────────────────
     下面这块「桌面应用」完全由 goose-ui 的真实组件搭出来：
     标题栏、窗口三键、主题切换都是库里的真东西，窗口控制通过
     windowApi 注入。浏览器里 minimise/close 没有真实窗口可操作，
     故在此用桌面态（最小化 / 关闭 / 最大化）模拟；打包进 Wails3
     时把 mockApi 换成 @wailsio/runtime 的 Window 适配器即可。 */
  let winMax = $state(false);
  let winMin = $state(false);
  let winClosed = $state(false);

  const mockApi: WindowController = {
    isMaximised: () => winMax,
    minimise: () => {
      winMin = true;
    },
    toggleMaximise: () => {
      winMax = !winMax;
    },
    close: () => {
      winClosed = true;
    },
  };

  function restoreWin() {
    winMin = false;
  }
  function reopenWin() {
    winClosed = false;
    winMin = false;
    winMax = false;
  }

  const rail = [
    { icon: LayoutDashboard, label: "概览", active: true },
    { icon: Users, label: "成员" },
    { icon: FileText, label: "文档" },
    { icon: Bell, label: "通知" },
    { icon: Settings, label: "设置" },
  ];

  let autoUpdate = $state(true);
  let followSystem = $state(false);
  let cpu = $state(42);
  let mem = $state(68);
  let disk = $state(23);

  // 让指标像真实应用一样轻微浮动
  $effect(() => {
    const id = setInterval(() => {
      cpu = 32 + Math.round(Math.random() * 46);
      mem = 56 + Math.round(Math.random() * 28);
      disk = 21 + Math.round(Math.random() * 10);
    }, 2200);
    return () => clearInterval(id);
  });
</script>

<div class="hp-page">
  <div class="hp-inner">
    <!-- ── Hero ───────────────────────────────────────────── -->
    <section class="hp-hero">
      <div class="hp-hero-glow" aria-hidden="true"></div>
      <div class="hp-hero-tags">
        <Tag variant="primary" dot>Svelte 5 Runes</Tag>
        <Tag variant="success" dot>零依赖</Tag>
        <Tag variant="info" dot>Wails3</Tag>
        <Tag>MIT</Tag>
      </div>

      <h1 class="hp-hero-title">Goose-ui</h1>
      <p class="hp-hero-sub">
        零第三方依赖的 Svelte 5 纯 CSS 组件库 —— 为桌面与后台应用准备的 <em>50+ 组件</em>、单文件主题，以及开箱即用的
        <em>Wails3 应用外壳</em>。
      </p>

      <div class="hp-hero-actions">
        <Button variant="primary" size="large" onclick={() => go("#/getstarted")}>开始使用 →</Button>
        <Button variant="default" size="large" onclick={() => go("#/button")}>浏览组件</Button>
      </div>

      <div class="hp-hero-stats">
        {#each stats as s (s.label)}
          <div class="hp-stat">
            <span class="hp-stat-value">{s.value}</span>
            <span class="hp-stat-label">{s.label}</span>
          </div>
        {/each}
      </div>
    </section>

    <!-- ── 模拟 Wails3 桌面应用 ─────────────────────────────── -->
    <section class="hp-showcase">
      <div class="hp-showcase-head">
        <h2 class="hp-h2">在浏览器里，跑一个桌面应用</h2>
        <p class="hp-lead">
          下面是一个用 goose-ui 真实组件搭出来的「模拟 Wails3 应用」—— 标题栏、窗口三键、主题切换全是库里的真东西。 试着点右上角的 <strong>最小化 / 最大化 / 关闭</strong>。
        </p>
      </div>

      <div class="hp-desk">
        {#if !winClosed}
          <div class="hp-win" class:hp-win--max={winMax && !winMin}>
            <TitleBar logo={Box} title="Goose Studio" subtitle="组件实验室" theme={themeStore.theme} onThemeToggle={toggleThemeFromEvent} windowApi={mockApi} />

            {#if !winMin}
              <div class="hp-win-body">
                <nav class="hp-rail" aria-label="侧边导航">
                  {#each rail as r (r.label)}
                    <button type="button" class="hp-rail-btn" class:active={r.active} title={r.label} aria-label={r.label}>
                      <r.icon size={20} />
                    </button>
                  {/each}
                </nav>

                <div class="hp-main">
                  <Card>
                    <div class="hp-welcome">
                      <Avatar name="Goose Dev" status="online" size="large" />
                      <div class="hp-welcome-text">
                        <div class="hp-welcome-name">欢迎回来，开发者</div>
                        <div class="hp-welcome-sub">Goose Studio · 已连接</div>
                      </div>
                      <Tag variant="success" dot>在线</Tag>
                    </div>
                  </Card>

                  <Card title="系统状态">
                    <div class="hp-metric">
                      <span class="hp-metric-label">CPU</span>
                      <ProgressBar percent={cpu} />
                      <em class="hp-metric-val">{cpu}%</em>
                    </div>
                    <div class="hp-metric">
                      <span class="hp-metric-label">内存</span>
                      <ProgressBar percent={mem} />
                      <em class="hp-metric-val">{mem}%</em>
                    </div>
                    <div class="hp-metric">
                      <span class="hp-metric-label">磁盘</span>
                      <ProgressBar percent={disk} />
                      <em class="hp-metric-val">{disk}%</em>
                    </div>
                  </Card>

                  <div class="hp-cols">
                    <Card title="运行时">
                      <label class="hp-switch">
                        <Toggle bind:checked={autoUpdate} />
                        <span>自动更新</span>
                      </label>
                      <label class="hp-switch">
                        <Toggle bind:checked={followSystem} />
                        <span>深色跟随系统</span>
                      </label>
                    </Card>
                    <Card title="已安装技能">
                      <div class="hp-tags">
                        <Tag variant="primary">Svelte 5</Tag>
                        <Tag variant="info">零依赖</Tag>
                        <Tag variant="success" dot>Wails3 Ready</Tag>
                        <Tag>MIT</Tag>
                      </div>
                    </Card>
                  </div>

                  <div class="hp-actions">
                    <Button variant="primary" icon={Rocket}>新建项目</Button>
                    <Button variant="default" icon={Settings}>打开设置</Button>
                    <Button variant="ghost" icon={Bell}>通知</Button>
                  </div>
                </div>
              </div>
            {:else}
              <div class="hp-win-min">已最小化 —— 点击下方任务栏恢复</div>
            {/if}
          </div>

          {#if winMin}
            <button type="button" class="hp-dock" onclick={restoreWin} title="点击恢复">
              <Box size={16} />
              <span>Goose Studio · 已最小化</span>
            </button>
          {/if}
        {:else}
          <div class="hp-closed">
            <div class="hp-closed-card">
              <Box size={30} />
              <div class="hp-closed-title">应用已关闭</div>
              <div class="hp-closed-sub">这是一个运行在浏览器中的模拟窗口</div>
              <Button variant="primary" onclick={reopenWin}>重新打开</Button>
            </div>
          </div>
        {/if}
        <!-- ── 特性（与模拟应用同级，共享渐变背景） ── -->
        <section class="hp-feat-grid" class:hp-hidden={winMax && !winMin}>
          {#each features as f (f.title)}
            <div class="hp-feat">
              <div class="hp-feat-icon"><f.icon size={18} /></div>
              <div>
                <div class="hp-feat-title">{f.title}</div>
                <p class="hp-feat-desc">{f.desc}</p>
              </div>
            </div>
          {/each}
        </section>

        <!-- ── 入口 ── -->
        <section class="hp-entry-grid" class:hp-hidden={winMax && !winMin}>
          {#each entries as e (e.title)}
            <button type="button" class="hp-entry" onclick={() => go(e.href)}>
              <span class="hp-entry-tag">{e.tag}</span>
              <span class="hp-entry-title">{e.title} →</span>
              <span class="hp-entry-desc">{e.desc}</span>
            </button>
          {/each}
        </section>
      </div>

      <p class="hp-caption">
        窗口控制通过 <code>windowApi</code> 注入：浏览器里最小化 / 关闭是模拟行为；打包进 Wails3 只需把
        <code>windowApi</code> 换成 <code>@wailsio/runtime</code> 适配器，库本身零桌面依赖。
      </p>
    </section>
  </div>
</div>

<style>
  /* ── 页面级渐变背景：提升到整窗（.layout--home），铺满视口 ── */
  :global(.layout--home.layout) {
    background: radial-gradient(900px 420px at 18% -10%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 60%),
      radial-gradient(720px 520px at 92% 110%, color-mix(in srgb, var(--complement) 18%, transparent), transparent 60%), var(--bg) !important;
  }
  :global(.layout--home .layout-content) {
    margin: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    background: transparent !important;
  }
  .hp-page {
    position: relative;
    width: 100%;
    min-height: 100%;
    padding: 28px;
    overflow: hidden;
    background: transparent;
  }
  .hp-inner {
    max-width: 1080px;
    margin-inline: auto;
  }
  /* ── Hero ── */
  .hp-hero {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 64px 16px 48px;
    border: none;
    border-radius: var(--radius-lg);
    background: transparent;
    overflow: hidden;
  }
  .hp-hero-glow {
    position: absolute;
    inset: -40% 0 auto 0;
    height: 320px;
    background: radial-gradient(900px 280px at 50% 0%, var(--accent-sub), transparent 70%);
    pointer-events: none;
  }
  .hp-hero-tags {
    position: relative;
    display: flex;
    gap: var(--sp-sm);
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 22px;
  }
  .hp-hero-title {
    padding: 10px;
    position: relative;
    margin: 0;
    font-size: 52px;
    line-height: 1.05;
    letter-spacing: -0.03em;
    font-weight: 800;
    color: var(--text-strong);
    background: linear-gradient(120deg, var(--text-strong) 50%, var(--accent));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hp-hero-sub {
    position: relative;
    max-width: 640px;
    margin: 16px 0 28px;
    font-size: 15px;
    line-height: 1.9;
    color: var(--text-muted);
  }
  .hp-hero-sub em {
    font-style: normal;
    color: var(--accent);
    font-weight: 600;
  }
  .hp-hero-actions {
    position: relative;
    display: flex;
    gap: var(--sp-md);
    flex-wrap: wrap;
    justify-content: center;
  }
  .hp-hero-stats {
    position: relative;
    display: flex;
    gap: 40px;
    margin-top: 38px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .hp-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .hp-stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-strong);
    font-family: var(--font-mono);
  }
  .hp-stat-label {
    font-size: 12px;
    color: var(--text-muted);
  }

  /* ── Showcase ── */
  .hp-showcase {
    margin-top: var(--sp-lg);
  }
  .hp-showcase-head {
    text-align: center;
    margin-bottom: var(--sp-lg);
  }
  .hp-h2 {
    margin: 0 0 10px;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text-strong);
  }
  .hp-lead {
    max-width: 640px;
    margin: 0 auto;
    font-size: 14px;
    line-height: 1.8;
    color: var(--text-muted);
  }
  .hp-lead strong {
    color: var(--text-strong);
    font-weight: 600;
  }

  .hp-desk {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-lg);
    min-height: 580px;
    padding: 28px;
    border: none;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: transparent;
  }

  .hp-win {
    width: min(880px, 100%);
    height: 520px;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    overflow: hidden;
    background: var(--surface);
    border: 1px solid var(--border-strong);
    box-shadow:
      0 30px 70px -24px rgba(0, 0, 0, 0.45),
      0 0 0 1px rgba(255, 255, 255, 0.04) inset;
    transition:
      inset 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
      height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .hp-win--max {
    position: absolute;
    inset: 20px;
    width: auto;
    height: auto;
    margin: 0;
  }

  .hp-win-body {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  .hp-rail {
    width: 58px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 0;
    background: var(--surface-2);
    border-right: 1px solid var(--border);
  }
  .hp-rail-btn {
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .hp-rail-btn:hover {
    background: var(--hover);
    color: var(--text-strong);
  }
  .hp-rail-btn.active {
    background: var(--accent-sub);
    color: var(--accent);
  }

  .hp-main {
    flex: 1;
    min-width: 0;
    overflow: auto;
    padding: var(--sp-lg);
    display: flex;
    flex-direction: column;
    gap: var(--sp-md);
  }

  .hp-welcome {
    display: flex;
    align-items: center;
    gap: var(--sp-md);
  }
  .hp-welcome-text {
    flex: 1;
    min-width: 0;
  }
  .hp-welcome-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-strong);
  }
  .hp-welcome-sub {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .hp-metric {
    display: flex;
    align-items: center;
    gap: var(--sp-md);
    margin-bottom: var(--sp-sm);
  }
  .hp-metric:last-child {
    margin-bottom: 0;
  }
  .hp-metric-label {
    width: 36px;
    flex-shrink: 0;
    font-size: 12px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }
  .hp-metric :global(.progress-track) {
    flex: 1;
  }
  .hp-metric-val {
    width: 42px;
    flex-shrink: 0;
    text-align: right;
    font-size: 12px;
    font-style: normal;
    color: var(--text-strong);
    font-family: var(--font-mono);
  }

  .hp-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-md);
  }
  .hp-switch {
    display: flex;
    align-items: center;
    gap: var(--sp-md);
    font-size: 13px;
    color: var(--text);
    cursor: pointer;
    padding: 4px 0;
  }
  .hp-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-sm);
  }
  .hp-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-md);
  }

  .hp-win-min {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
    color: var(--text-muted);
    font-size: 13px;
  }

  .hp-dock {
    position: absolute;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: var(--sp-sm);
    padding: 8px 16px;
    border: 1px solid var(--border-strong);
    border-radius: 9999px;
    background: color-mix(in srgb, var(--surface) 85%, transparent);
    backdrop-filter: blur(8px);
    color: var(--text-strong);
    font-size: 13px;
    cursor: pointer;
    box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.4);
  }
  .hp-dock:hover {
    border-color: var(--accent);
  }

  .hp-closed {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .hp-closed-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-sm);
    padding: var(--sp-lg) 40px;
    border: none;
    border-radius: var(--radius-lg);
    background: var(--surface);
    color: var(--text-muted);
  }
  .hp-closed-card :global(svg) {
    color: var(--accent);
  }
  .hp-closed-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-strong);
  }
  .hp-closed-sub {
    font-size: 12px;
    margin-bottom: var(--sp-sm);
  }

  .hp-caption {
    margin: var(--sp-lg) auto 0;
    max-width: 720px;
    text-align: center;
    font-size: 12.5px;
    line-height: 1.8;
    color: var(--text-muted);
  }
  .hp-caption code {
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--accent-sub);
    color: var(--accent);
  }

  .hp-hidden {
    display: none;
  }

  /* ── 特性 ── */
  .hp-feat-grid {
    width: min(880px, 100%);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--sp-lg);
  }
  .hp-feat {
    display: flex;
    gap: var(--sp-md);
    padding: var(--sp-lg);
    border: none;
    border-radius: var(--radius-lg);
    background: var(--surface);
  }
  .hp-feat-icon {
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
  .hp-feat-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-strong);
  }
  .hp-feat-desc {
    margin: 4px 0 0;
    font-size: 12.5px;
    line-height: 1.7;
    color: var(--text-muted);
  }

  /* ── 入口 ── */
  .hp-entry-grid {
    width: min(880px, 100%);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: var(--sp-md);
  }
  .hp-entry {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: var(--sp-lg);
    border: none;
    border-radius: var(--radius-lg);
    background: var(--surface);
    cursor: pointer;
    text-align: left;
    transition:
      transform 0.15s,
      box-shadow 0.15s;
  }
  .hp-entry:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .hp-entry-tag {
    font-size: 11px;
    padding: 1px 8px;
    border-radius: 9999px;
    background: var(--accent-sub);
    color: var(--accent);
  }
  .hp-entry-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-strong);
  }
  .hp-entry-desc {
    font-size: 12.5px;
    line-height: 1.7;
    color: var(--text-muted);
  }

  @media (max-width: 600px) {
    .hp-hero-title {
      font-size: 40px;
    }
    .hp-cols {
      grid-template-columns: 1fr;
    }
    .hp-desk {
      padding: 14px;
      min-height: 480px;
    }
    .hp-win,
    .hp-win--max {
      height: 460px;
    }
  }
</style>

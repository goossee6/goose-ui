<script lang="ts">
  import { Card, TitleBar, PageHeader, ThemeToggle } from 'goose-ui';
  import { onMount } from 'svelte';

  const STORAGE_KEY = 'goose-ui-theme';

  let theme = $state<'light' | 'dark'>('light');

  onMount(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = saved ?? (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  });

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }
</script>

<PageHeader title="TitleBar 标题栏" description="Wails3 桌面应用自定义窗口标题栏，支持拖拽、主题切换、窗口控制" />

<div class="demo-grid">
  <Card title="基础用法">
    <div class="demo-preview">
      <TitleBar title="我的应用" />
    </div>
  </Card>

  <Card title="带主题切换">
    <div class="demo-preview">
      <TitleBar title="设置" {theme} onThemeToggle={toggleTheme} />
    </div>
  </Card>

  <Card title="深色主题">
    <div class="demo-preview demo-preview--dark">
      <TitleBar title="深色模式" theme="dark" onThemeToggle={toggleTheme} />
    </div>
  </Card>

  <Card title="ThemeToggle 组件">
    <p class="demo-note">独立的主题切换按钮，带圆形扩散动画：</p>
    <ThemeToggle />
  </Card>

  <Card title="说明">
    <div class="demo-note">
      <p>完整的窗口控制按钮（最小化、最大化、关闭）需要在 Wails3 桌面环境中运行。</p>
      <p>在浏览器中仅展示标题栏外观和主题切换功能。</p>
    </div>
  </Card>
</div>

<style>
  .demo-grid { display: flex; flex-direction: column; gap: var(--gap-2xl); }
  .demo-preview { border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); }
  .demo-preview--dark { background: #1a1a1a; }
  .demo-note { font-size: 13px; color: var(--text-muted); line-height: 1.8; margin: 0 0 12px; }
  .demo-note p { margin: 0; }
</style>

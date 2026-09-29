<script lang="ts">
  import {Card, TitleBar, Page, ThemeToggle, themeStore, toggleThemeFromEvent} from "goose-ui";
  import { Box } from '@lucide/svelte';
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const titleBarProps: PropsTableItem[] = [
    { name: "title", desc: "标题文本（无 logo 时作为渐变文字 logo）", type: "string", default: "''" },
    { name: "logo", desc: "logo：字符串=渐变文字，组件=图标；缺省时以 title 文字作渐变 logo", type: "string | Component", default: "undefined" },
    { name: "subtitle", desc: "副标题（纯文字）；图标 logo 未传副标题时回退显示 title", type: "string", default: "''" },
    { name: "theme", desc: "当前主题", type: "'light' | 'dark'", default: "'light'" },
    { name: "onThemeToggle", desc: "主题切换回调", type: "(e: MouseEvent) => void" },
    { name: "controls", desc: "自定义窗口按钮区 snippet（替换默认最小化/最大化/关闭）", type: "Snippet" },
    { name: "windowControls", desc: "false 不渲染默认窗口三键（如浏览器环境）", type: "boolean", default: "true" },
  ];
</script>

<Page title="TitleBar 标题栏" description="Wails3 桌面应用自定义窗口标题栏，支持拖拽、主题切换、窗口控制" >
  <Card title="基础用法">
    <div class="demo-preview">
      <TitleBar title="我的应用" />
    </div>
  </Card>

  <Card title="带主题切换">
    <div class="demo-preview">
      <TitleBar title="设置" theme={themeStore.theme} onThemeToggle={toggleThemeFromEvent} />
    </div>
  </Card>

  <Card title="文字 logo + 副标题">
    <div class="demo-preview">
      <TitleBar title="ToolKit" subtitle="Windows 工具箱" theme={themeStore.theme} />
    </div>
  </Card>

  <Card title="图标 logo + 副标题回退">
    <div class="demo-preview">
      <TitleBar logo={Box} title="我的应用" subtitle="Windows 工具箱" theme={themeStore.theme} />
    </div>
    <div class="demo-preview" style="margin-top: 8px;">
      <TitleBar logo={Box} title="我的应用" theme={themeStore.theme} />
    </div>
    <p class="demo-note" style="margin-top: 8px;">图标 logo 未传 subtitle 时，纯文字回退显示 title。</p>
  </Card>

  <Card title="深色主题">
    <div class="demo-preview demo-preview--dark">
      <TitleBar title="深色模式" theme="dark" onThemeToggle={toggleThemeFromEvent} />
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
  <Card title="Props">
    <PropsTable items={titleBarProps} />
  </Card>
</Page>

<style>
  .demo-preview { border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); }
  .demo-preview--dark { background: #1a1a1a; }
  .demo-note { font-size: 13px; color: var(--text-muted); line-height: 1.8; margin: 0 0 12px; }
  .demo-note p { margin: 0; }
</style>

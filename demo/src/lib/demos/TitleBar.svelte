<script lang="ts">
  import {Card, TitleBar, Page, Row, ThemeToggle, themeStore, toggleThemeFromEvent, Notification} from "goose-ui";
  import type { WindowController, TitleBarSearchItem } from "goose-ui";
  import Box from '@lucide/svelte/icons/box';
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  /** Wails3 适配器（真实项目里这样写） */
  const wailsAdapter: WindowController | undefined = $state(undefined);

  /**
   * 浏览器演示用的本地模拟：让「最大化/还原」状态在预览里真实切换。
   * 真实 Wails3 项目不需要它 —— 直接把 runtime 的 Window 包成 WindowController 传入；
   * 不传 windowApi 时三键照常渲染，只是点击无副作用。
   */
  function createMockController(): WindowController {
    let maximised = false;
    return {
      isMaximised: () => maximised,
      minimise: () => {},
      toggleMaximise: () => {
        maximised = !maximised;
      },
      close: () => {},
    };
  }

  // 浏览器里用模拟控制器演示三键；打包进 Wails3 时换成真实适配器
  const demoApi: WindowController = createMockController();

  /**
   * 内联搜索的候选数据。分组（group）会在下拉里渲染成小节标题，
   * 同一个 value 复用 Command 的 CommandItem 形状，方便两处共享一份数据。
   * disabled 项不可选中，也不会出现在过滤结果里。
   */
  const searchItems: TitleBarSearchItem[] = [
    { value: 'new-file', label: '新建文件', group: '文件', keywords: 'new create 创建' },
    { value: 'open-file', label: '打开文件', group: '文件', keywords: 'open 读取' },
    { value: 'save-all', label: '全部保存', group: '文件', keywords: 'save 写入' },
    { value: 'recent', label: '最近打开', group: '文件', keywords: 'recent history 历史', disabled: true },
    { value: 'toggle-sidebar', label: '切换侧边栏', group: '视图', keywords: 'sidebar 面板' },
    { value: 'toggle-theme', label: '切换主题', group: '视图', keywords: 'theme dark light 深色 浅色' },
    { value: 'zoom-in', label: '放大', group: '视图', keywords: 'zoom in 缩放' },
    { value: 'zoom-out', label: '缩小', group: '视图', keywords: 'zoom out 缩放' },
    { value: 'settings', label: '打开设置', group: '设置', keywords: 'settings preferences 偏好' },
    { value: 'shortcuts', label: '快捷键', group: '设置', keywords: 'keyboard 键盘' },
  ];

  /** 选中回调：真实项目里在这里路由跳转或执行命令 */
  function onSearchSelect(item: TitleBarSearchItem) {
    Notification.success(`选中：${item.label}（value = ${item.value}）`);
  }

  let lastPicked = $state<TitleBarSearchItem | null>(null);

  const titleBarProps: PropsTableItem[] = [
    { name: "title", desc: "标题文本（无 logo 时作为渐变文字 logo）", type: "string", default: "''" },
    { name: "logo", desc: "logo：字符串=渐变文字，组件=图标；缺省时以 title 文字作渐变 logo", type: "string | Component", default: "undefined" },
    { name: "subtitle", desc: "副标题（纯文字）；图标 logo 未传副标题时回退显示 title", type: "string", default: "''" },
    { name: "theme", desc: "当前主题", type: "'light' | 'dark'", default: "'light'" },
    { name: "onThemeToggle", desc: "主题切换回调", type: "(e: MouseEvent) => void" },
    { name: "controls", desc: "自定义窗口按钮区 snippet（渲染在窗口控制键之前，与默认键共存）", type: "Snippet" },
    { name: "windowControls", desc: "false 不渲染默认窗口三键（如浏览器环境）", type: "boolean", default: "true" },
    { name: "windowApi", desc: "窗口控制实现（WindowController）。未传时三键点击无副作用（UI 保持一致）；库不依赖任何桌面 runtime", type: "WindowController" },
    { name: "searchable", desc: "显示内联搜索框（默认 false 不显示）。聚焦即展开候选，输入即出下拉，↑↓ 移动、Enter 选中、Esc 关闭", type: "boolean", default: "false" },
    { name: "searchItems", desc: "搜索候选项；group 相同者在下拉里归为一节，disabled 项不可选中也不参与过滤", type: "TitleBarSearchItem[]", default: "[]" },
    { name: "searchPlaceholder", desc: "搜索框占位文本", type: "string", default: "'搜索…'" },
    { name: "searchEmptyText", desc: "无匹配结果时的提示文本", type: "string", default: "'无匹配结果'" },
    { name: "onSearchSelect", desc: "选中回调（选中后自动收起下拉并清空输入）", type: "(item: TitleBarSearchItem) => void" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const basicSource = `<script lang="ts">
  import { TitleBar } from "goose-ui";
<\/script>

<TitleBar title="我的应用" />`;

  const themeToggleSource = `<script lang="ts">
  import { TitleBar, themeStore, toggleThemeFromEvent } from "goose-ui";
<\/script>

<TitleBar title="设置" theme={themeStore.theme} onThemeToggle={toggleThemeFromEvent} />`;

  const subtitleSource = `<script lang="ts">
  import { TitleBar, themeStore } from "goose-ui";
<\/script>

<TitleBar title="ToolKit" subtitle="Windows 工具箱" theme={themeStore.theme} />`;

  const logoSegmentSource = `<script lang="ts">
  import { TitleBar, themeStore } from "goose-ui";
  import Box from "@lucide/svelte/icons/box";
<\/script>

<!-- 图标 logo + 副标题 -->
<TitleBar logo={Box} title="我的应用" subtitle="Windows 工具箱" theme={themeStore.theme} />

<!-- 图标 logo 未传 subtitle 时，纯文字回退显示 title -->
<TitleBar logo={Box} title="我的应用" theme={themeStore.theme} />`;

  const darkSource = `<script lang="ts">
  import { TitleBar } from "goose-ui";
<\/script>

<TitleBar title="深色模式" theme="dark" />`;

  const lightSource = `<script lang="ts">
  import { TitleBar } from "goose-ui";
<\/script>

<TitleBar title="浅色模式" theme="light" />`;

  const themeToggleComponentSource = `<script lang="ts">
  import { ThemeToggle, Row } from "goose-ui";
<\/script>

<Row><ThemeToggle /></Row>`;

  const wailsSource = `// Wails3 项目：把 @wailsio/runtime 的 Window 适配成 windowApi
// goose-ui 本身不依赖 @wailsio/runtime，只有你的主项目需要安装它
//   pnpm add @wailsio/runtime

<script lang="ts">
  import { TitleBar, type WindowController } from "goose-ui";
  import { Window } from "@wailsio/runtime";

  // 适配器：把 runtime 的 Window 方法映射成 goose-ui 的 WindowController
  // 3.0.0 起自带 ToggleMaximise，不必再自己判断 IsMaximised 再挑 Maximise / Restore
  const wailsApi: WindowController = {
    isMaximised: () => Window.IsMaximised(),
    minimise: () => Window.Minimise(),
    toggleMaximise: () => Window.ToggleMaximise(),
    close: () => Window.Close(),
  };
<\/script>

<TitleBar title="我的应用" windowApi={wailsApi} />`;

  const searchSource = `<script lang="ts">
  import { TitleBar, type TitleBarSearchItem } from "goose-ui";

  // group 相同者在下拉里归为一节；disabled 项不可选中也不参与过滤
  const items: TitleBarSearchItem[] = [
    { value: 'new-file', label: '新建文件', group: '文件', keywords: 'new create 创建' },
    { value: 'open-file', label: '打开文件', group: '文件', keywords: 'open 读取' },
    { value: 'recent', label: '最近打开', group: '文件', disabled: true },
    { value: 'settings', label: '打开设置', group: '设置', keywords: 'preferences 偏好' },
  ];
<\/script>

<TitleBar
  title="我的应用"
  searchable
  searchItems={items}
  searchPlaceholder="搜索组件…"
  onSearchSelect={(item) => console.log(item.value)}
/>`;
</script>

<Page toc title="TitleBar 标题栏" description="桌面应用自定义窗口标题栏：拖拽、主题切换、窗口控制（注入式，不依赖任何桌面 runtime）">
  <CodePreview wide anchor="basic" anchorLevel={2} title="基础用法" code={basicSource}>
    <div class="demo-preview">
      <TitleBar title="我的应用" />
    </div>
  </CodePreview>

  <CodePreview wide anchor="advanced" anchorLevel={2} title="带主题切换" code={themeToggleSource}>
    <div class="demo-preview">
      <TitleBar title="设置" theme={themeStore.theme} onThemeToggle={toggleThemeFromEvent} />
    </div>
  </CodePreview>

  <CodePreview wide anchor="logo" anchorLevel={3} title="文字 logo + 副标题" code={subtitleSource}>
    <div class="demo-preview">
      <TitleBar title="ToolKit" subtitle="Windows 工具箱" theme={themeStore.theme} />
    </div>
  </CodePreview>

  <CodePreview wide anchor="logo-2" anchorLevel={3} title="图标 logo + 副标题回退" code={logoSegmentSource}>
    <div class="demo-preview">
      <TitleBar logo={Box} title="我的应用" subtitle="Windows 工具箱" theme={themeStore.theme} />
    </div>
    <div class="demo-preview" style="margin-top: 8px;">
      <TitleBar logo={Box} title="我的应用" theme={themeStore.theme} />
    </div>
    <p class="demo-note" style="margin-top: 8px;">图标 logo 未传 subtitle 时，纯文字回退显示 title。</p>
  </CodePreview>

  <CodePreview wide anchor="dark" anchorLevel={3} title="深色主题" code={darkSource}>
    <div class="demo-preview demo-preview--dark dark">
      <TitleBar title="深色模式" theme="dark" />
    </div>
  </CodePreview>

  <CodePreview wide anchor="light" anchorLevel={3} title="浅色主题" code={lightSource}>
    <div class="demo-preview demo-preview--light light">
      <TitleBar title="浅色模式" theme="light" />
    </div>
  </CodePreview>

  <CodePreview wide anchor="window-controls" anchorLevel={2} title="窗口控制（windowApi 注入）" code={wailsSource}>
    <p class="demo-note">
      下面预览里用的是浏览器模拟控制器，三键可点击、最大化状态可切换；打包进 Wails3 后换成真实适配器即可。
    </p>
    <div class="demo-preview">
      <TitleBar title="我的应用" theme={themeStore.theme} windowApi={demoApi} />
    </div>
  </CodePreview>

  <CodePreview wide anchor="search-menu" anchorLevel={2} title="内联搜索" code={searchSource}>
    <p class="demo-note">
      传入 <code>searchable</code> 开启搜索框。搜索段是标题栏里唯一的弹性段（两侧为刚体），
      宽度自适应、上限为标题栏可用空间的 40%，窄窗口下一路收窄并在标题栏 450px 以下隐藏，
      全程不挤压 logo 与窗口键。聚焦即展开候选列表，输入即过滤，<code>↑↓</code> 移动、<code>Enter</code> 选中、<code>Esc</code> 关闭。
    </p>
    <div class="demo-preview demo-preview--search">
      <TitleBar
        title="我的应用"
        theme={themeStore.theme}
        searchable
        {searchItems}
        searchPlaceholder="搜索命令…"
        onSearchSelect={(item) => { lastPicked = item; onSearchSelect(item); }}
      />
    </div>
    {#if lastPicked}
      <p class="demo-note demo-note--picked">
        最近选中：<code>{lastPicked.label}</code>（value = <code>{lastPicked.value}</code>，group = <code>{lastPicked.group ?? '无'}</code>）
      </p>
    {/if}
  </CodePreview>

  <CodePreview wide anchor="themetoggle" anchorLevel={3} title="ThemeToggle 组件" code={themeToggleComponentSource}>
    <p class="demo-note">独立的主题切换按钮，带圆形扩散动画：</p>
    <Row><ThemeToggle /></Row>
  </CodePreview>

  <Card title="Wails3 接入说明">
    <div class="demo-note">
      <p>
        goose-ui <strong>不依赖</strong> <code>@wailsio/runtime</code> —— 窗口控制通过
        <code>windowApi</code> prop 注入。这样库本身可安全用于纯 Web 项目，
        Wails 使用者按需接入：
      </p>
      <p>1. 主项目安装 runtime：<code>pnpm add @wailsio/runtime</code></p>
      <p>2. 把 <code>Window</code> 包成 <code>WindowController</code> 传给 <code>windowApi</code>（见上方「窗口控制」卡的源码）</p>
      <p>
        3. 窗口拖拽与四角缩放是纯 CSS（<code>--wails-draggable</code> / <code>--wails-resize</code>），
        无需 JS
      </p>
      <p>浏览器预览时未传 <code>windowApi</code>，三键点击无副作用，外观与桌面环境完全一致。</p>
    </div>
  </Card>

  <Card title="Props">
    <PropsTable anchor="props" items={titleBarProps} />
  </Card>
</Page>

<style>
  .demo-preview { border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border); }
  .demo-preview--dark { background: var(--surface); }
  /* overflow:hidden 会把搜索下拉裁掉（下拉是 absolute 定位、从标题栏往下展开，
     高度 320px，远超标题栏自身 42px）。这里给「内联搜索」这张预览单独放开，
     让下拉能正常溢出显示；圆角裁剪由 .demo-preview--search 自己的 border-radius 承担。 */
  .demo-preview--search { overflow: visible; }
  .demo-note { font-size: 13px; color: var(--text-muted); line-height: 1.8; margin: 0 0 12px; }
  .demo-note p { margin: 0 0 6px; }
  .demo-note--picked { margin-top: 8px; margin-bottom: 0; color: var(--text); }
  .demo-note code {
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--accent-sub);
    color: var(--accent);
  }
</style>

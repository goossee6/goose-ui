<script lang="ts">
  import { onMount } from "svelte";
  import { NotificationProvider, ErrorDialog, ContextMenu, ConfirmDialog, BackTop, Sidebar, Layout, TitleBar, Tooltip, themeStore, toggleThemeFromEvent, VERSION, type SidebarEntry, type WindowController } from "goose-ui";
  import House from "@lucide/svelte/icons/house";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import LayoutGrid from "@lucide/svelte/icons/layout-grid";
  import RectangleEllipsis from "@lucide/svelte/icons/rectangle-ellipsis";
  import MessageCircle from "@lucide/svelte/icons/message-circle";
  import ChartColumnIncreasing from "@lucide/svelte/icons/chart-column-increasing";
  import Wrench from "@lucide/svelte/icons/wrench";
  import Monitor from "@lucide/svelte/icons/monitor";
  import Settings from "@lucide/svelte/icons/settings";
  import { demoLoaders } from "./lib/demos/registry";

  const groups: SidebarEntry[] = [
    { value: "home", label: "首页", icon: House },
    {
      title: "指南",
      icon: BookOpen,
      items: [
        { value: "getstarted", label: "开始使用" },
        { value: "skill", label: "Skill" },
      ],
    },
    {
      title: "基础",
      icon: LayoutGrid,
      items: [
        { value: "title", label: "Title 标题" },
        { value: "button", label: "Button 按钮" },
        { value: "separator", label: "Separator 分割线" },
        { value: "avatar", label: "Avatar 头像" },
        { value: "scrollarea", label: "ScrollArea 滚动区" },
        { value: "icon", label: "Icon 图标" },
        { value: "codeblock", label: "CodeBlock 代码高亮" },
      ],
    },
    {
      title: "表单",
      icon: RectangleEllipsis,
      items: [
        { value: "input", label: "Input 输入框" },
        { value: "switch", label: "Toggle 开关" },
        { value: "select", label: "Select/Combobox 选择器" },
        { value: "datepicker", label: "DatePicker 日期选择" },
        { value: "timepicker", label: "TimePicker 时间选择" },
        { value: "choice", label: "选择控件 单选/多选" },
        { value: "dropzone", label: "DropZone 拖拽上传" },
        { value: "rating", label: "Rating 评分" },
        { value: "pininput", label: "PINInput 验证码" },
        { value: "slider", label: "Slider 滑块" },
        { value: "datefield", label: "Date/Time Field 字段" },
        { value: "form", label: "Form 表单" },
      ],
    },
    {
      title: "反馈",
      icon: MessageCircle,
      items: [
        { value: "notification", label: "Notification 通知" },
        { value: "modal", label: "Modal/Confirm/AlertDialog 弹窗确认" },
        { value: "drawer", label: "Drawer 抽屉" },
        { value: "tooltip", label: "Tooltip 气泡提示" },
        { value: "popover", label: "Popover 气泡卡片" },
        { value: "command", label: "Command 命令面板" },
        { value: "linkpreview", label: "LinkPreview 链接预览" },
        { value: "loading", label: "Loading 加载" },
        { value: "skeleton", label: "Skeleton 骨架屏" },
      ],
    },
    {
      title: "数据展示",
      icon: ChartColumnIncreasing,
      items: [
        { value: "card", label: "Card 卡片" },
        { value: "collapse", label: "Collapse 折叠面板" },
        { value: "tabledata", label: "DataTable 数据表格" },
        { value: "tablelist", label: "DataList 列表" },
        { value: "tag", label: "Tag 标签" },
        { value: "pagination", label: "Pagination 分页" },
        { value: "progress", label: "Progress 进度条" },
        { value: "meter", label: "Meter 度量条" },
        { value: "typewriter", label: "Typewriter 打字机" },
        { value: "image", label: "Image 图片" },
        { value: "carousel", label: "Carousel 轮播图" },
      ],
    },
    {
      title: "工具",
      icon: Wrench,
      items: [
        { value: "header", label: "Header 头部导航" },
        { value: "navmenu", label: "NavigationMenu/Menubar/DropdownMenu 导航与菜单" },
        { value: "tabs", label: "Tabs 标签页" },
        { value: "page", label: "Page 页面容器" },
        { value: "toolbar", label: "Toolbar 工具栏" },
        { value: "footer", label: "Footer 页脚" },
        { value: "backtop", label: "BackTop 返回顶部" },
        { value: "cursor", label: "Cursor 光标" },
        { value: "background", label: "Background 背景" },
        { value: "time", label: "Time 时钟" },
        { value: "countdown", label: "Countdown 倒计时" },
      ],
    },
    {
      title: "Wails3",
      icon: Monitor,
      items: [
        { value: "titlebar", label: "TitleBar 标题栏" },
        { value: "layout", label: "Layout 布局" },
      ],
    },
  ];

  const endItems = [{ value: "settings", label: "设置", icon: Settings }];

  // 浏览器演示用：窗口三键的本地模拟（最大化状态真实切换）。
  // 真实 Wails3 项目把 @wailsio/runtime 的 Window 包成 WindowController 传入即可，
  // 不传时三键照常渲染、点击无副作用（见「开始使用」与 TitleBar 页说明）。
  function createWindowApi(): WindowController {
    let maximised = $state(false);
    return {
      isMaximised: () => maximised,
      minimise: () => {},
      toggleMaximise: () => {
        maximised = !maximised;
      },
      close: () => {},
    };
  }
  const windowApi = createWindowApi();

  const DEFAULT_TAB = "button";
  const validTabs = new Set([...groups.flatMap((e) => ("items" in e ? e.items.map((i) => i.value) : [e.value])), ...endItems.map((i) => i.value)]);

  function tabFromHash(): string {
    const raw = location.hash.replace(/^#\/?/, "");
    return validTabs.has(raw) ? raw : DEFAULT_TAB;
  }

  let activeTab = $state(tabFromHash());
  let sidebarMode = $state<"float" | "flat">("float");
  let sidebarCollapsed = $state(false);

  /**
   * 当前页签的组件，按需加载。
   *
   * 每切一次页签就发起一次动态 import；已经加载过的模块浏览器会走缓存，
   * 同时用 loaded 表跳过重复的 Promise 往返。
   *
   * 加载期间 PageView 仍是上一页的组件 —— 这是有意的：页面切换本来就有
   * 入场过渡，闪一下空白反而更突兀。首屏（默认页签）会在第一次 $effect
   * 里立刻加载，用户看到的就是正常页面。
   */
  type PageComp = import('svelte').Component<any>;
  const loaded = new Map<string, PageComp>();
  let PageView = $state<PageComp | null>(null);
  let loadSeq = 0;
  /** 加载失败时记住是哪一页，供「重试」按钮定位（不设它会变成静默空白） */
  let loadError = $state<{ tab: string; message: string } | null>(null);

  function loadTab(tab: string, force = false) {
    if (!force) {
      const cached = loaded.get(tab);
      if (cached) {
        PageView = cached;
        loadError = null;
        return;
      }
    }
    const loader = demoLoaders[tab];
    if (!loader) return;
    // 序号守卫：连点两个页签时，先发的那次可能后回，不能覆盖后点的结果
    const seq = ++loadSeq;
    loadError = null;
    loader()
      .then((mod) => {
        loaded.set(tab, mod.default);
        if (seq === loadSeq) PageView = mod.default;
      })
      .catch((e: unknown) => {
        if (seq !== loadSeq) return;
        console.error(`加载 ${tab} 页失败`, e);
        loadError = { tab, message: e instanceof Error ? e.message : String(e) };
      });
  }

  $effect(() => {
    loadTab(activeTab);
  });

  $effect(() => {
    const next = `#/${activeTab}`;
    if (location.hash !== next) location.hash = next;
  });

  onMount(() => {
    const onHashChange = () => {
      activeTab = tabFromHash();
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  });

  // 标题栏搜索：把侧边栏分组展平成候选项（保留 group 用于下拉分组显示）
  type SearchEntry = { value: string; label: string; group: string };
  const searchItems = $derived(
    groups.flatMap((g): SearchEntry[] => {
      if ("items" in g && g.items) {
        return g.items.map((it) => ({ value: it.value, label: it.label, group: g.title ?? "" }));
      }
      const flat = g as { value?: string; label?: string };
      return flat.value ? [{ value: flat.value, label: flat.label ?? flat.value, group: "导航" }] : [];
    }),
  );

  function onSearchSelect(item: { value: string }) {
    activeTab = item.value;
  }

  /** 失败页的中文名，取自侧栏搜索的同一份清单 */
  const errorLabel = $derived(
    loadError ? (searchItems.find((i) => i.value === loadError!.tab)?.label ?? loadError.tab) : "",
  );
</script>

<NotificationProvider />
<ErrorDialog />
<ContextMenu />
<ConfirmDialog />

<Layout class={activeTab === "home" ? "layout--home" : ""} framed={activeTab !== "home"}>
  {#snippet titlebar()}
    <TitleBar
      title="Goose-ui"
      subtitle="Svelte 5 组件库"
      theme={themeStore.theme}
      onThemeToggle={toggleThemeFromEvent}
      {windowApi}
      searchable
      {searchItems}
      searchPlaceholder="搜索组件…"
      {onSearchSelect}
    >
      <!-- controls 是 TitleBar 的官方扩展点，渲染在主题键之前。
           图标内联而不用 lucide：lucide 已移除品牌图标。 -->
      {#snippet controls()}
        <Tooltip title="GitHub 仓库" placement="bottom">
          <a
            class="tb-github"
            href="https://github.com/goossee6/goose-ui"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub 仓库"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              />
            </svg>
          </a>
        </Tooltip>
      {/snippet}
    </TitleBar>
  {/snippet}

  {#snippet aside()}
    <Sidebar {groups} bind:activeTab bind:collapsed={sidebarCollapsed} {endItems} mode={sidebarMode} embedded shadow={false}>
      {#snippet footer()}
        <div class="sidebar-footer-inner">
          <span class="footer-version">v{VERSION} · Svelte 5</span>
        </div>
      {/snippet}
    </Sidebar>
  {/snippet}

  {#if loadError}
    <!-- 弱网下某个 chunk 三次重试仍失败：给出可见的失败态与出口，
         而不是停在上一页只留一条 console 错误 -->
    <div class="load-error">
      <div class="load-error-title">「{errorLabel}」页加载失败</div>
      <div class="load-error-desc">网络中断导致代码分块没有下载完整，重试通常会恢复。</div>
      <div class="load-error-detail">{loadError.message}</div>
      <button class="load-error-retry" onclick={() => loadError && loadTab(loadError.tab, true)}>重试</button>
    </div>
  {:else if PageView}
    <PageView />
  {/if}

  <!-- 全站返回顶部：滚动容器是每个 Page 的 .page-body（Layout 外框在有 Page 时 overflow:hidden）。
       切页时 .page-body 被整体替换，组件在滚动事件里检测到 target 失连会重新解析，无需按页重建。 -->
  <BackTop visibilityHeight={240} target=".page-body" />
</Layout>

<style>
  /* 标题栏右上角的 GitHub 入口。TitleBar 的 controls snippet 不继承组件内的
     .win-btn 作用域样式，所以这里按同一套 token 复刻：宽 46、高 --titlebar-h，
     hover 用 --hover / --text-strong，深浅色主题自动跟随。 */
  .tb-github {
    --wails-draggable: no-drag;
    width: 46px;
    height: var(--titlebar-h);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    text-decoration: none;
    transition: background 0.15s, color 0.15s;
  }
  .tb-github:hover {
    background-color: var(--hover);
    color: var(--text-strong);
  }
  .sidebar-footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .footer-version {
    /* 字号交给 Sidebar 的 --sb-font-label：页脚不该自带一套 11px */
    color: var(--text-muted);
  }
  /* Props 卡片与 CodePreview 卡片同宽并居中。
     51 个 demo 页面都是 <Card><PropsTable/></Card>，只收窄表格会让外层
     Card 继续撑满整行；这里按「卡片里装的是属性表」选中它，与 .cp-card
     共用 --cp-max-w（定义见 CodePreview.svelte 的 :root）。
     :has() 在现代浏览器均可用；不支持时退化为原来的全宽，不会出错。 */
  :global(.page-body .card:has(.props-table)) {
    width: 100%;
    max-width: var(--cp-max-w, 1080px);
    margin-inline: auto;
  }
  /* 目录锚点用的是元素 id，不是类名（见 toc.ts 的 HEADING_SELECTOR）。
     锚点挂在 CodePreview / PropsTable / Card 上，给它们让出吸顶页头的高度。
     三者各有自己的 scroll-margin-top 也保留着，这里是兜底 —— 例如
     PageDemo 里用 <p data-toc-title> 顶替的纯文字小标题。 */
  :global(.page-body [data-toc-title][id]) {
    scroll-margin-top: var(--toc-anchor, 72px);
  }
  /* 加载失败占位：弱网下这块会代替页面出现，所以样式跟着主题走 */
  .load-error {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
    max-width: 520px;
    margin: var(--space-16) auto;
    padding: var(--space-6) var(--space-6);
    border: var(--border-w) solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface-1, transparent);
  }
  .load-error-title {
    font-size: var(--fs-16);
    font-weight: 600;
    color: var(--text-strong);
  }
  .load-error-desc {
    font-size: var(--fs-13);
    color: var(--text);
  }
  .load-error-detail {
    font-size: var(--fs-12);
    color: var(--text-muted);
    word-break: break-all;
  }
  .load-error-retry {
    padding: var(--space-1) var(--space-4);
    border: var(--border-w) solid var(--border-strong);
    border-radius: var(--radius-md);
    background: var(--bg);
    color: var(--text-strong);
    font-size: var(--fs-13);
    cursor: pointer;
  }
  .load-error-retry:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
</style>

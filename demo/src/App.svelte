<script lang="ts">
  import { onMount } from "svelte";
  import { NotificationProvider, ErrorDialog, ContextMenu, ConfirmDialog, BackTop, Sidebar, Layout, TitleBar, themeStore, toggleThemeFromEvent, VERSION, type SidebarEntry, type WindowController } from "goose-ui";
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

  $effect(() => {
    const tab = activeTab;
    const cached = loaded.get(tab);
    if (cached) {
      PageView = cached;
      return;
    }
    const loader = demoLoaders[tab];
    if (!loader) return;
    // 序号守卫：连点两个页签时，先发的那次可能后回，不能覆盖后点的结果
    const seq = ++loadSeq;
    loader().then((mod) => {
      loaded.set(tab, mod.default);
      if (seq === loadSeq) PageView = mod.default;
    }).catch((e) => {
      console.error(`加载 ${tab} 页失败`, e);
    });
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
</script>

<NotificationProvider />
<ErrorDialog />
<ContextMenu />
<ConfirmDialog />

<Layout class={activeTab === "home" ? "layout--home" : ""}>
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
    />
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

  {#if PageView}
    <PageView />
  {/if}

  <!-- 全站返回顶部：滚动容器是每个 Page 的 .page-body（Layout 外框在有 Page 时 overflow:hidden）。
       切页时 .page-body 被整体替换，组件在滚动事件里检测到 target 失连会重新解析，无需按页重建。 -->
  <BackTop visibilityHeight={240} target=".page-body" />
</Layout>

<style>
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
</style>

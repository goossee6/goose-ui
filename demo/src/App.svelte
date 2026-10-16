<script lang="ts">
  import { onMount } from "svelte";
  import { NotificationProvider, ErrorDialog, ContextMenu, Sidebar, ConfirmDialog, Layout, Page, themeStore, toggleThemeFromEvent, type SidebarEntry, type WindowController } from "goose-ui";
  import House from "@lucide/svelte/icons/house";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import LayoutGrid from "@lucide/svelte/icons/layout-grid";
  import RectangleEllipsis from "@lucide/svelte/icons/rectangle-ellipsis";
  import MessageCircle from "@lucide/svelte/icons/message-circle";
  import ChartColumnIncreasing from "@lucide/svelte/icons/chart-column-increasing";
  import Wrench from "@lucide/svelte/icons/wrench";
  import Monitor from "@lucide/svelte/icons/monitor";
  import Settings from "@lucide/svelte/icons/settings";

  import Skill from "./lib/demos/Skill.svelte";
  import Home from "./lib/demos/Home.svelte";
  import Title from "./lib/demos/Title.svelte";
  import ButtonDemo from "./lib/demos/Button.svelte";
  import PageDemo from "./lib/demos/PageDemo.svelte";
  import SeparatorDemo from "./lib/demos/Separator.svelte";
  import AvatarDemo from "./lib/demos/Avatar.svelte";
  import RatingDemo from "./lib/demos/Rating.svelte";
  import PINInputDemo from "./lib/demos/PINInput.svelte";
  import MeterDemo from "./lib/demos/Meter.svelte";
  import ScrollAreaDemo from "./lib/demos/ScrollArea.svelte";
  import NavigationMenuDemo from "./lib/demos/NavigationMenu.svelte";
  import ToolbarDemo from "./lib/demos/Toolbar.svelte";
  import SliderDemo from "./lib/demos/Slider.svelte";
  import PopoverDemo from "./lib/demos/Popover.svelte";
  import CommandDemo from "./lib/demos/Command.svelte";
  import LinkPreviewDemo from "./lib/demos/LinkPreview.svelte";
  import DateFieldDemo from "./lib/demos/DateField.svelte";
  import IconDemo from "./lib/demos/Icon.svelte";
  import Tag from "./lib/demos/Tag.svelte";
  import Cursor from "./lib/demos/Cursor.svelte";
  import CodeBlock from "./lib/demos/CodeBlock.svelte";
  import Background from "./lib/demos/Background.svelte";
  import Footer from "./lib/demos/Footer.svelte";
  import InputDemo from "./lib/demos/Input.svelte";
  import ToggleDemo from "./lib/demos/Toggle.svelte";
  import SelectDemo from "./lib/demos/Select.svelte";
  import DatePicker from "./lib/demos/DatePicker.svelte";
  import TimePicker from "./lib/demos/TimePicker.svelte";
  import ChoiceDemo from "./lib/demos/Choice.svelte";
  import Form from "./lib/demos/Form.svelte";
  import NotificationDemo from "./lib/demos/Notification.svelte";
  import ModalDemo from "./lib/demos/Modal.svelte";
  import Drawer from "./lib/demos/Drawer.svelte";
  import LoadingDemo from "./lib/demos/Loading.svelte";
  import Tooltip from "./lib/demos/Tooltip.svelte";
  import ProgressDemo from "./lib/demos/Progress.svelte";
  import Skeleton from "./lib/demos/Skeleton.svelte";
  import BackTop from "./lib/demos/BackTop.svelte";
  import CardDemo from "./lib/demos/Card.svelte";
  import Collapse from "./lib/demos/Collapse.svelte";
  import TabsDemo from "./lib/demos/Tabs.svelte";
  import TableDemo from "./lib/demos/Table.svelte";
  import Pagination from "./lib/demos/Pagination.svelte";
  import TypewriterDemo from "./lib/demos/Typewriter.svelte";
  import ImageDemo from "./lib/demos/Image.svelte";
  import Carousel from "./lib/demos/Carousel.svelte";
  import Time from "./lib/demos/Time.svelte";
  import Countdown from "./lib/demos/Countdown.svelte";
  import HeaderDemo from "./lib/demos/Header.svelte";
  import DropZoneDemo from "./lib/demos/DropZone.svelte";
  import TitleBarDemo from "./lib/demos/TitleBar.svelte";
  import LayoutDemo from "./lib/demos/Layout.svelte";
  import SettingsDemo from "./lib/demos/Settings.svelte";
  import GettingStarted from "./lib/demos/GettingStarted.svelte";

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
        { value: "page", label: "Page 页面容器" },
        { value: "separator", label: "Separator 分割线" },
        { value: "avatar", label: "Avatar 头像" },
        { value: "scrollarea", label: "ScrollArea 滚动区" },
        { value: "icon", label: "Icon 图标" },
        { value: "tag", label: "Tag 标签" },
        { value: "codeblock", label: "CodeBlock 代码高亮" },
        { value: "toolbar", label: "Toolbar 工具栏" },
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
      ],
    },
    {
      title: "数据展示",
      icon: ChartColumnIncreasing,
      items: [
        { value: "card", label: "Card 卡片" },
        { value: "collapse", label: "Collapse 折叠面板" },
        { value: "tabs", label: "Tabs 标签页" },
        { value: "table", label: "Table 表格" },
        { value: "pagination", label: "Pagination 分页" },
        { value: "progress", label: "Progress 进度条" },
        { value: "meter", label: "Meter 度量条" },
        { value: "skeleton", label: "Skeleton 骨架屏" },
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
        { value: "cursor", label: "Cursor 光标" },
        { value: "background", label: "Background 背景" },
        { value: "footer", label: "Footer 页脚" },
        { value: "backtop", label: "BackTop 返回顶部" },
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
</script>

<NotificationProvider />
<ErrorDialog />
<ContextMenu />
<ConfirmDialog />

<Layout title="Goose-ui" subtitle="Svelte 5 组件库" theme={themeStore.theme} onThemeToggle={toggleThemeFromEvent} {windowApi}>
  {#snippet tabs()}
    <Sidebar {groups} bind:activeTab bind:collapsed={sidebarCollapsed} {endItems} mode={sidebarMode} embedded shadow={false}>
      {#snippet footer()}
        <div class="sidebar-footer-inner">
          <span class="footer-version">v0.1.0 · Svelte 5</span>
        </div>
      {/snippet}
    </Sidebar>
  {/snippet}

  {#if activeTab === "home"}
    <Home />
  {:else if activeTab === "getstarted"}
    <GettingStarted />
  {:else if activeTab === "skill"}
    <Skill />
  {:else if activeTab === "title"}
    <Title />
  {:else if activeTab === "button"}
    <ButtonDemo />
  {:else if activeTab === "page"}
    <PageDemo />
  {:else if activeTab === "separator"}
    <SeparatorDemo />
  {:else if activeTab === "avatar"}
    <AvatarDemo />
  {:else if activeTab === "scrollarea"}
    <ScrollAreaDemo />
  {:else if activeTab === "rating"}
    <RatingDemo />
  {:else if activeTab === "pininput"}
    <PINInputDemo />
  {:else if activeTab === "slider"}
    <SliderDemo />
  {:else if activeTab === "popover"}
    <PopoverDemo />
  {:else if activeTab === "command"}
    <CommandDemo />
  {:else if activeTab === "linkpreview"}
    <LinkPreviewDemo />
  {:else if activeTab === "datefield"}
    <DateFieldDemo />
  {:else if activeTab === "meter"}
    <MeterDemo />
  {:else if activeTab === "toolbar"}
    <ToolbarDemo />
  {:else if activeTab === "navmenu"}
    <NavigationMenuDemo />
  {:else if activeTab === "icon"}
    <IconDemo />
  {:else if activeTab === "tag"}
    <Tag />
  {:else if activeTab === "cursor"}
    <Cursor />
  {:else if activeTab === "codeblock"}
    <CodeBlock />
  {:else if activeTab === "background"}
    <Background />
  {:else if activeTab === "footer"}
    <Footer />
  {:else if activeTab === "input"}
    <InputDemo />
  {:else if activeTab === "switch"}
    <ToggleDemo />
  {:else if activeTab === "select"}
    <SelectDemo />
  {:else if activeTab === "datepicker"}
    <DatePicker />
  {:else if activeTab === "timepicker"}
    <TimePicker />
  {:else if activeTab === "choice"}
    <ChoiceDemo />
  {:else if activeTab === "form"}
    <Form />
  {:else if activeTab === "notification"}
    <NotificationDemo />
  {:else if activeTab === "modal"}
    <ModalDemo />
  {:else if activeTab === "drawer"}
    <Drawer />
  {:else if activeTab === "loading"}
    <LoadingDemo />
  {:else if activeTab === "tooltip"}
    <Tooltip />
  {:else if activeTab === "progress"}
    <ProgressDemo />
  {:else if activeTab === "skeleton"}
    <Skeleton />
  {:else if activeTab === "backtop"}
    <BackTop />
  {:else if activeTab === "card"}
    <CardDemo />
  {:else if activeTab === "collapse"}
    <Collapse />
  {:else if activeTab === "tabs"}
    <TabsDemo />
  {:else if activeTab === "table"}
    <TableDemo />
  {:else if activeTab === "pagination"}
    <Pagination />
  {:else if activeTab === "typewriter"}
    <TypewriterDemo />
  {:else if activeTab === "image"}
    <ImageDemo />
  {:else if activeTab === "carousel"}
    <Carousel />
  {:else if activeTab === "time"}
    <Time />
  {:else if activeTab === "countdown"}
    <Countdown />
  {:else if activeTab === "header"}
    <HeaderDemo />
  {:else if activeTab === "dropzone"}
    <DropZoneDemo />
  {:else if activeTab === "titlebar"}
    <TitleBarDemo />
  {:else if activeTab === "layout"}
    <LayoutDemo />
  {:else if activeTab === "settings"}
    <SettingsDemo />
  {/if}
</Layout>

<style>
  .sidebar-footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .footer-version {
    font-size: 11px;
    color: var(--text-muted);
  }
</style>

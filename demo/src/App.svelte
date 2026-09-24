<script lang="ts">
  import {
    NotificationProvider, ErrorDialog, ContextMenu, Sidebar, ThemeToggle,
    type SidebarTabGroup,
  } from 'goose-ui';
  import {
    BookOpen, LayoutGrid, RectangleEllipsis, MessageCircle, ChartColumnIncreasing, Wrench,
    Monitor,
  } from '@lucide/svelte';

  import Skill from './lib/demos/Skill.svelte';
  import Title from './lib/demos/Title.svelte';
  import ButtonDemo from './lib/demos/Button.svelte';
  import Divider from './lib/demos/Divider.svelte';
  import IconDemo from './lib/demos/Icon.svelte';
  import Tag from './lib/demos/Tag.svelte';
  import Cursor from './lib/demos/Cursor.svelte';
  import CodeBlock from './lib/demos/CodeBlock.svelte';
  import Background from './lib/demos/Background.svelte';
  import Footer from './lib/demos/Footer.svelte';
  import InputDemo from './lib/demos/Input.svelte';
  import ToggleDemo from './lib/demos/Toggle.svelte';
  import SelectDemo from './lib/demos/Select.svelte';
  import DatePicker from './lib/demos/DatePicker.svelte';
  import TimePicker from './lib/demos/TimePicker.svelte';
  import CheckboxDemo from './lib/demos/Checkbox.svelte';
  import Radio from './lib/demos/Radio.svelte';
  import Form from './lib/demos/Form.svelte';
  import NotificationDemo from './lib/demos/Notification.svelte';
  import ModalDemo from './lib/demos/Modal.svelte';
  import Drawer from './lib/demos/Drawer.svelte';
  import LoadingDemo from './lib/demos/Loading.svelte';
  import Tooltip from './lib/demos/Tooltip.svelte';
  import ProgressDemo from './lib/demos/Progress.svelte';
  import Skeleton from './lib/demos/Skeleton.svelte';
  import BackTop from './lib/demos/BackTop.svelte';
  import CardDemo from './lib/demos/Card.svelte';
  import Collapse from './lib/demos/Collapse.svelte';
  import TabsDemo from './lib/demos/Tabs.svelte';
  import TableDemo from './lib/demos/Table.svelte';
  import Pagination from './lib/demos/Pagination.svelte';
  import TypewriterDemo from './lib/demos/Typewriter.svelte';
  import ImageDemo from './lib/demos/Image.svelte';
  import Carousel from './lib/demos/Carousel.svelte';
  import Time from './lib/demos/Time.svelte';
  import Countdown from './lib/demos/Countdown.svelte';
  import HeaderDemo from './lib/demos/Header.svelte';
  import DropZoneDemo from './lib/demos/DropZone.svelte';
  import TitleBarDemo from './lib/demos/TitleBar.svelte';
  import LayoutDemo from './lib/demos/Layout.svelte';

  const groups: SidebarTabGroup[] = [
    {
      title: '指南',
      icon: BookOpen,
      items: [
        { value: 'skill', label: 'Skill 介绍' },
      ],
    },
    {
      title: '基础',
      icon: LayoutGrid,
      items: [
        { value: 'title', label: 'Title 标题' },
        { value: 'button', label: 'Button 按钮' },
        { value: 'divider', label: 'Divider 分割线' },
        { value: 'icon', label: 'Icon 图标' },
        { value: 'tag', label: 'Tag 标签' },
        { value: 'codeblock', label: 'CodeBlock 代码高亮' },
      ],
    },
    {
      title: '表单',
      icon: RectangleEllipsis,
      items: [
        { value: 'input', label: 'Input 输入框' },
        { value: 'switch', label: 'Toggle 开关' },
        { value: 'select', label: 'Select 选择器' },
        { value: 'datepicker', label: 'DatePicker 日期选择' },
        { value: 'timepicker', label: 'TimePicker 时间选择' },
        { value: 'checkbox', label: 'Checkbox 多选框' },
        { value: 'radio', label: 'Radio 单选框' },
        { value: 'dropzone', label: 'DropZone 拖拽上传' },
        { value: 'form', label: 'Form 表单' },
      ],
    },
    {
      title: '反馈',
      icon: MessageCircle,
      items: [
        { value: 'notification', label: 'Notification 通知' },
        { value: 'modal', label: 'Modal 弹窗' },
        { value: 'drawer', label: 'Drawer 抽屉' },
        { value: 'tooltip', label: 'Tooltip 气泡提示' },
        { value: 'loading', label: 'Loading 加载' },
      ],
    },
    {
      title: '数据展示',
      icon: ChartColumnIncreasing,
      items: [
        { value: 'card', label: 'Card 卡片' },
        { value: 'collapse', label: 'Collapse 折叠面板' },
        { value: 'tabs', label: 'Tabs 标签页' },
        { value: 'table', label: 'Table 表格' },
        { value: 'pagination', label: 'Pagination 分页' },
        { value: 'progress', label: 'Progress 进度条' },
        { value: 'skeleton', label: 'Skeleton 骨架屏' },
        { value: 'typewriter', label: 'Typewriter 打字机' },
        { value: 'image', label: 'Image 图片' },
        { value: 'carousel', label: 'Carousel 轮播图' },
      ],
    },
    {
      title: '工具',
      icon: Wrench,
      items: [
        { value: 'header', label: 'Header 头部导航' },
        { value: 'cursor', label: 'Cursor 光标' },
        { value: 'background', label: 'Background 背景' },
        { value: 'footer', label: 'Footer 页脚' },
        { value: 'backtop', label: 'BackTop 返回顶部' },
        { value: 'time', label: 'Time 时钟' },
        { value: 'countdown', label: 'Countdown 倒计时' },
      ],
    },
    {
      title: 'Wails3',
      icon: Monitor,
      items: [
        { value: 'titlebar', label: 'TitleBar 标题栏' },
        { value: 'layout', label: 'Layout 布局' },
      ],
    },
  ];

  let activeTab = $state('button');
  let sidebarMode = $state<'float' | 'flat'>('float');
  let sidebarCollapsed = $state(false);
</script>

<NotificationProvider />
<ErrorDialog />
<ContextMenu />

<div class="app">
  <Sidebar
    {groups}
    bind:activeTab
    bind:collapsed={sidebarCollapsed}
    mode={sidebarMode}
  >
    {#snippet footer()}
      <div class="sidebar-footer-inner">
        <span class="footer-version">v0.1.0 · Svelte 5</span>
        <ThemeToggle />
      </div>
    {/snippet}
  </Sidebar>

  <main class="content" class:content--collapsed={sidebarCollapsed}>
    {#if activeTab === 'skill'}
      <Skill />
    {:else if activeTab === 'title'}
      <Title />
    {:else if activeTab === 'button'}
      <ButtonDemo />
    {:else if activeTab === 'divider'}
      <Divider />
    {:else if activeTab === 'icon'}
      <IconDemo />
    {:else if activeTab === 'tag'}
      <Tag />
    {:else if activeTab === 'cursor'}
      <Cursor />
    {:else if activeTab === 'codeblock'}
      <CodeBlock />
    {:else if activeTab === 'background'}
      <Background />
    {:else if activeTab === 'footer'}
      <Footer />
    {:else if activeTab === 'input'}
      <InputDemo />
    {:else if activeTab === 'switch'}
      <ToggleDemo />
    {:else if activeTab === 'select'}
      <SelectDemo />
    {:else if activeTab === 'datepicker'}
      <DatePicker />
    {:else if activeTab === 'timepicker'}
      <TimePicker />
    {:else if activeTab === 'checkbox'}
      <CheckboxDemo />
    {:else if activeTab === 'radio'}
      <Radio />
    {:else if activeTab === 'form'}
      <Form />
    {:else if activeTab === 'notification'}
      <NotificationDemo />
    {:else if activeTab === 'modal'}
      <ModalDemo />
    {:else if activeTab === 'drawer'}
      <Drawer />
    {:else if activeTab === 'loading'}
      <LoadingDemo />
    {:else if activeTab === 'tooltip'}
      <Tooltip />
    {:else if activeTab === 'progress'}
      <ProgressDemo />
    {:else if activeTab === 'skeleton'}
      <Skeleton />
    {:else if activeTab === 'backtop'}
      <BackTop />
    {:else if activeTab === 'card'}
      <CardDemo />
    {:else if activeTab === 'collapse'}
      <Collapse />
    {:else if activeTab === 'tabs'}
      <TabsDemo />
    {:else if activeTab === 'table'}
      <TableDemo />
    {:else if activeTab === 'pagination'}
      <Pagination />
    {:else if activeTab === 'typewriter'}
      <TypewriterDemo />
    {:else if activeTab === 'image'}
      <ImageDemo />
    {:else if activeTab === 'carousel'}
      <Carousel />
    {:else if activeTab === 'time'}
      <Time />
    {:else if activeTab === 'countdown'}
      <Countdown />
    {:else if activeTab === 'header'}
      <HeaderDemo />
    {:else if activeTab === 'dropzone'}
      <DropZoneDemo />
    {:else if activeTab === 'titlebar'}
      <TitleBarDemo />
    {:else if activeTab === 'layout'}
      <LayoutDemo />
    {/if}
  </main>
</div>

<style>
  .app {
    position: fixed;
    inset: 0;
    background: var(--bg);
  }
  .content {
    position: fixed;
    top: 0;
    left: 252px;
    right: 0;
    bottom: 0;
    overflow-y: auto;
    padding: 32px 40px 60px;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .content--collapsed {
    left: 88px;
  }
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

<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
  import PanelLeftOpen from '@lucide/svelte/icons/panel-left-open';
  import { pageDirStore } from '../pageDirStore.svelte.js';
  import PillTrack from './PillTrack.svelte';
  import Collapsible from './Collapsible.svelte';
  import ThemeToggle from './ThemeToggle.svelte';

  export interface SidebarTabItem {
    value: string;
    label: string;
    icon?: Component<{ size?: number; class?: string }>;
  }

  export interface SidebarTabGroup {
    title: string;
    icon?: Component<{ size?: number; class?: string }>;
    items: SidebarTabItem[];
  }

  /** 导航条目：分组，或与分组同级穿插的顶层项 */
  export type SidebarEntry = SidebarTabGroup | SidebarTabItem;

  function isGroup(e: SidebarEntry): e is SidebarTabGroup {
    return !!e && 'items' in e;
  }

  function isItem(e: SidebarEntry): e is SidebarTabItem {
    return !!e && !('items' in e);
  }

  const itemValue = (e: SidebarEntry): string => ('value' in e ? e.value : '');
  const itemLabel = (e: SidebarEntry): string => ('label' in e ? e.label : '');

  let {
    groups = [],
    activeTab = $bindable(''),
    mode = 'float',
    shadow = mode === 'float',
    radius = mode === 'float',
    collapsed = $bindable(false),
    embedded = false,
    onchange,
    footer,
    themeToggle = true,
    endItems,
    header,
    class: cls = '',
    width,
    style = '',
  }: {
    groups?: SidebarEntry[];
    activeTab?: string;
    mode?: 'float' | 'flat';
    shadow?: boolean;
    radius?: boolean;
    collapsed?: boolean;
    embedded?: boolean;
    onchange?: (value: string) => void;
    footer?: Snippet;
    /** footer 区尾部（版本等 footer 内容之后）显示主题切换按钮 */
    themeToggle?: boolean;
    /** 列表结尾固定项：渲染在导航列表末尾（有余量时贴底），参与 activeTab、共享 pill 动画 */
    endItems?: SidebarTabItem[];
    header?: Snippet;
    class?: string;
    /** 侧栏宽度：number 按 px；直接改写内部布局变量 --sidebar-w */
    width?: number | string;
    style?: string;
  } = $props();

  const widthStyle = $derived(
    width !== undefined ? `--sidebar-w:${typeof width === 'number' ? `${width}px` : width};` : ''
  );

  let expandedGroups = $state<Set<number>>(new Set(groups.map((_, i) => i)));
  let prevExpanded = $state<Set<number>>(new Set(groups.map((_, i) => i)));

  let popoverGroup = $state<number>(-1);
  let popoverStyle = $state('');
  let hoverTimer = $state<ReturnType<typeof setTimeout> | null>(null);
  const popoverEntry = $derived.by(() => {
    const g = groups[popoverGroup];
    return popoverGroup >= 0 && isGroup(g) ? g : undefined;
  });

  function toggleCollapse() {
    if (!collapsed) {
      prevExpanded = new Set(expandedGroups);
      expandedGroups = new Set();
    } else {
      expandedGroups = new Set(prevExpanded);
    }
    collapsed = !collapsed;
  }

  function toggleGroup(index: number) {
    const next = new Set(expandedGroups);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    expandedGroups = next;
  }

  function selectTab(value: string) {
    activeTab = value;
    onchange?.(value);
    popoverGroup = -1;
    const idx = groups.findIndex(g => isGroup(g) && g.items.some(i => i.value === value));
    if (idx >= 0 && !expandedGroups.has(idx)) {
      const next = new Set(expandedGroups);
      next.add(idx);
      expandedGroups = next;
    }
  }

  function groupIcon(group: SidebarTabGroup) {
    return group.icon ?? group.items[0]?.icon;
  }

  function groupTitle(group: SidebarTabGroup) {
    return group.title || group.items[0]?.label || '';
  }

  function hoverShow(gi: number, e: MouseEvent) {
    const sidebarEl = (e.currentTarget as HTMLElement).closest('.sidebar') as HTMLElement;
    const btnEl = (e.currentTarget as HTMLElement) as HTMLElement;
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      popoverGroup = gi;
      if (!sidebarEl || !btnEl) return;
      const sbRect = sidebarEl.getBoundingClientRect();
      const btnRect = btnEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const popTarget = groups[gi];
      const popH = Math.min((isGroup(popTarget) ? popTarget.items.length : 0) * 32 + 40, 280);
      const popW = 170;
      const gap = 6;

      let left = sbRect.right + gap;
      let top = btnRect.top;

      if (left + popW > vw) left = sbRect.left - popW - gap;
      if (top + popH > vh - 8) top = vh - popH - 8;
      if (top < 8) top = 8;

      popoverStyle = `left: ${left}px; top: ${top}px;`;
    }, 200);
  }

  function hoverHide() {
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => { popoverGroup = -1; }, 300);
  }

  function hoverCancelHide() {
    if (hoverTimer) clearTimeout(hoverTimer);
  }

  function hasActiveItem(group: SidebarTabGroup) {
    return group.items.some(i => i.value === activeTab);
  }

  const activeSel = $derived.by(() => {
    const idx = groups.findIndex((e) => isGroup(e) && hasActiveItem(e));
    return idx >= 0 && !expandedGroups.has(idx) ? '' : '.nav-item--active';
  });

  let navEl = $state<HTMLElement | null>(null);

  function scrollActiveIntoView() {
    const item = navEl?.querySelector<HTMLElement>('.nav-item--active');
    item?.scrollIntoView({ block: 'nearest' });
  }

  // 吸顶判定：stuck 时组头需不透明底遮身后内容；未吸顶透明底，hover 交给下层 pill（与 nav-item 同动画）
  function updateStuckHeaders() {
    const nav = navEl;
    if (!nav) return;
    const navTop = nav.getBoundingClientRect().top;
    for (const el of nav.querySelectorAll<HTMLElement>('.collapsible-trigger')) {
      const r = el.getBoundingClientRect();
      // 被钉在顶边（上界）且下缘仍在视口内（下界，排除已滚出上方的组头）
      el.classList.toggle('stuck', r.top <= navTop + 0.5 && r.bottom > navTop + 0.5);
    }
  }

  let stuckRaf = 0;

  $effect(() => {
    const nav = navEl;
    if (!nav) return;
    const onScroll = () => {
      cancelAnimationFrame(stuckRaf);
      stuckRaf = requestAnimationFrame(updateStuckHeaders);
    };
    nav.addEventListener('scroll', onScroll, { passive: true });
    updateStuckHeaders();
    return () => {
      nav.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(stuckRaf);
    };
  });

  // 分组开合/折叠切换改变组头纵向位置（含 0.25s 展开动画），即时 + 收尾各补测一次
  $effect(() => {
    expandedGroups;
    collapsed;
    groups;
    updateStuckHeaders();
    const t = setTimeout(updateStuckHeaders, 300);
    return () => clearTimeout(t);
  });

  let prevDirTab = activeTab;

  $effect.pre(() => {
    const cur = activeTab;
    if (cur === prevDirTab) return;
    const prev = prevDirTab;
    prevDirTab = cur;
    const flat = [...groups.flatMap((e) => (isGroup(e) ? e.items : [e])), ...(endItems ?? [])];
    const pi = flat.findIndex((i) => i.value === prev);
    const ci = flat.findIndex((i) => i.value === cur);
    if (pi < 0 || ci < 0 || pi === ci) return;
    pageDirStore.dir = ci < pi ? 'up' : 'down';
  });

  let prevScrollTab = activeTab;

  $effect(() => {
    activeTab;
    collapsed;
    expandedGroups;
    const tabChanged = activeTab !== prevScrollTab;
    prevScrollTab = activeTab;
    if (tabChanged) scrollActiveIntoView();
    const t = setTimeout(() => {
      if (tabChanged) scrollActiveIntoView();
    }, 340);
    return () => clearTimeout(t);
  });
</script>

<aside
  class="sidebar sidebar--{mode} {cls}"
  class:sidebar--collapsed={collapsed}
  class:sidebar--embedded={embedded}
  class:sidebar--shadow={shadow}
  class:sidebar--radius={radius}
  style="{widthStyle}{style}"
  role="navigation"
>
  <div class="sidebar-header">
    {#if !collapsed}
      {#if header}
        <span class="header-content">{@render header()}</span>
      {:else}
        <span class="logo">goose-ui</span>
      {/if}
    {/if}
    <button
      type="button"
      class="collapse-btn"
      onclick={toggleCollapse}
      aria-label={collapsed ? '展开' : '收起'}
    >
      <Icon icon={collapsed ? PanelLeftOpen : PanelLeftClose} size={16} />
    </button>
  </div>

  <nav class="sidebar-nav" bind:this={navEl}>
    {#each groups as entry, gi}
      {#if isItem(entry)}
        {#if collapsed}
          <button
            type="button"
            class="group-icon-btn"
            class:group-icon-btn--active={activeTab === itemValue(entry)}
            onclick={() => selectTab(itemValue(entry))}
            title={itemLabel(entry)}
          >
            {#if entry.icon}
              <Icon icon={entry.icon} size={18} />
            {/if}
          </button>
        {:else}
          <button
            type="button"
            class="nav-item nav-item--top"
            class:nav-item--active={activeTab === itemValue(entry)}
            onclick={() => selectTab(itemValue(entry))}
          >
            {#if entry.icon}
              <Icon icon={entry.icon} size={16} class="nav-item-icon" />
            {/if}
            <span class="nav-item-label">{itemLabel(entry)}</span>
          </button>
        {/if}
      {/if}
      {#if isGroup(entry)}
        {#if collapsed}
          <button
            type="button"
            class="group-icon-btn"
            class:group-icon-btn--active={hasActiveItem(entry)}
            onmouseenter={(e) => hoverShow(gi, e)}
            onmouseleave={hoverHide}
            title={groupTitle(entry)}
          >
            {#if groupIcon(entry)}
              <Icon icon={groupIcon(entry)!} size={18} />
            {/if}
          </button>
        {:else}
          <div class="group-block">
            {#if entry.title}
              {@const title = entry.title}
              <Collapsible
                open={expandedGroups.has(gi)}
                onchange={() => toggleGroup(gi)}
              >
                {#snippet trigger()}
                  {#if entry.icon}
                    <span class="group-icon"><Icon icon={entry.icon} size={16} /></span>
                  {/if}
                  <span class="group-title">{title}</span>
                  <span
                    class="group-chevron"
                    class:group-chevron--up={!expandedGroups.has(gi)}
                  >
                    <Icon icon={ChevronDown} size={14} />
                  </span>
                {/snippet}
                {#each entry.items as item}
                  <button
                    type="button"
                    class="nav-item"
                    class:nav-item--active={activeTab === item.value}
                    onclick={() => selectTab(item.value)}
                  >
                    {#if item.icon}
                      <Icon icon={item.icon} size={16} class="nav-item-icon" />
                    {/if}
                    <span class="nav-item-label">{item.label}</span>
                  </button>
                {/each}
              </Collapsible>
            {:else if expandedGroups.has(gi)}
              <div class="group-items">
                {#each entry.items as item}
                  <button
                    type="button"
                    class="nav-item"
                    class:nav-item--active={activeTab === item.value}
                    onclick={() => selectTab(item.value)}
                  >
                    {#if item.icon}
                      <Icon icon={item.icon} size={16} class="nav-item-icon" />
                    {/if}
                    <span class="nav-item-label">{item.label}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      {/if}
    {/each}
    {#if !collapsed && endItems?.length}
      {#each endItems as item, i}
        <button
          type="button"
          class="nav-item nav-item--end nav-item--top"
          class:end-first={i === 0}
          class:nav-item--active={activeTab === item.value}
          onclick={() => selectTab(item.value)}
        >
          {#if item.icon}
            <Icon icon={item.icon} size={16} class="nav-item-icon" />
          {/if}
          <span class="nav-item-label">{itemLabel(item)}</span>
        </button>
      {/each}
    {/if}
    <PillTrack
      container={navEl}
      itemSelector=".nav-item, .collapsible-trigger"
      activeSelector={activeSel}
      background="var(--primary)"
      hoverBackground="color-mix(in srgb, var(--primary) 15%, transparent)"
      radius="var(--radius-md)"
    />
  </nav>

  {#if (footer || themeToggle) && !collapsed}
    <div class="sidebar-footer">
      {#if footer}{@render footer()}{/if}
      {#if themeToggle}
        <div class="sidebar-footer-theme">
          <ThemeToggle />
        </div>
      {/if}
    </div>
  {/if}
</aside>

{#if collapsed && popoverGroup >= 0}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="sidebar-popover"
    style={popoverStyle}
    onmouseenter={hoverCancelHide}
    onmouseleave={hoverHide}
  >
    {#if popoverEntry && groupIcon(popoverEntry)}
      <div class="popover-header">
        <Icon icon={groupIcon(popoverEntry)!} size={14} />
        <span>{groupTitle(popoverEntry)}</span>
      </div>
    {/if}
    {#each popoverEntry?.items ?? [] as item}
      <button
        type="button"
        class="popover-item"
        class:popover-item--active={activeTab === item.value}
        onclick={() => selectTab(item.value)}
      >
        {#if item.icon}
          <Icon icon={item.icon} size={14} class="popover-item-icon" />
        {/if}
        {item.label}
      </button>
    {/each}
  </div>
{/if}

<style>
  /* ── Base ────────────────────────────────────────────────────────────────── */
  .sidebar {
    --sidebar-w: 220px;
    position: fixed;
    top: 16px;
    left: 16px;
    bottom: 16px;
    width: var(--sidebar-w);
    background: var(--surface);
    display: flex;
    flex-direction: column;
    padding: 14px 0;
    gap: 0;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  /* ── Float mode（结构：四周卡片边框 + 玻璃模糊）─────────────────────────── */
  .sidebar--float {
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
  }

  /* ── Flat mode（结构：贴边 + 右侧分隔线）────────────────────────────────── */
  .sidebar--flat {
    border: none;
    border-right: 1px solid var(--border);
  }

  /* ── 装饰（与 mode 正交，由 shadow/radius props 控制）────────────────────── */
  .sidebar--radius {
    border-radius: var(--radius-lg);
  }

  .sidebar--shadow {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  /* ── Collapsed ───────────────────────────────────────────────────────────── */
  .sidebar--collapsed {
    --sidebar-w: 56px;
  }

  /* ── Embedded (in-flow) mode：无定位知识，仅跟随父级文档流 ────────────────── */
  .sidebar--embedded {
    position: static;
    top: auto;
    left: auto;
    bottom: auto;
    flex: 1;
    height: 100%;
    min-height: 0;
  }

  /* ── Header ──────────────────────────────────────────────────────────────── */
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px 12px;
    border-bottom: 1px solid var(--border);
    min-height: 32px;
  }
  .sidebar--collapsed .sidebar-header {
    justify-content: center;
    padding: 0 0 12px;
  }
  .header-content { display: contents; }
  .logo {
    font-size: 17px;
    font-weight: 700;
    color: var(--text-strong);
    letter-spacing: -0.02em;
    white-space: nowrap;
  }
  .collapse-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .collapse-btn:hover {
    background: var(--hover);
    color: var(--text-strong);
  }

  /* ── Nav ─────────────────────────────────────────────────────────────────── */
  .sidebar-nav {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow-y: scroll;
    overflow-x: hidden;
    padding: 0 8px 8px;
    scrollbar-gutter: stable;
    display: flex;
    flex-direction: column;
  }
  .sidebar-nav > * {
    flex-shrink: 0;
  }
  .sidebar-nav > :first-child {
    margin-top: 8px;
  }
  .nav-item--end.end-first {
    margin-top: auto;
  }

  /* ── Group header (expanded)：Collapsible trigger 覆写（同 Accordion 先例） ── */
  /* 几何与 .nav-item 对齐：同宽（nav content box）、同间隙（两侧 8px）、同高（37px）、同圆角 */
  .sidebar-nav :global(.collapsible-trigger) {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    position: sticky;
    top: 0;
    padding: 9px 14px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    text-align: left;
    transition: color 0.15s ease, background 0.22s ease-out;
    z-index: 2;
  }
  /* :not(:disabled) 提特异性至 0,4,0：压过 Collapsible 自身的 --hover 底，保持透明让下层 pill 透出 */
  .sidebar-nav :global(.collapsible-trigger:hover:not(:disabled)) {
    color: var(--text-strong);
    background: transparent;
  }
  /* 吸顶（stuck）时必须不透明底遮住身后滚过的内容；hover 自背景仅此态生效 */
  .sidebar-nav :global(.collapsible-trigger.stuck) {
    background: var(--surface);
  }
  .sidebar-nav :global(.collapsible-trigger.stuck:hover:not(:disabled)) {
    /* 同色自背景（= pill hover 色叠 surface，不透明）：与下层 pill 同色叠加无视觉冲突 */
    background: color-mix(in srgb, var(--primary) 15%, var(--surface));
  }
  .group-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .group-title {
    white-space: nowrap;
  }
  .group-chevron {
    margin-left: auto;
    display: flex;
    align-items: center;
    transition: transform 0.2s;
  }
  .group-chevron--up {
    transform: rotate(-90deg);
  }

  /* ── Group icon (collapsed) ──────────────────────────────────────────────── */
  .group-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 36px;
    border: none;
    border-radius: var(--radius-md);
    background: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .group-icon-btn:hover {
    background: var(--hover);
    color: var(--text-strong);
  }
  .group-icon-btn--active {
    color: var(--primary);
  }

  /* ── Nav items (expanded) ────────────────────────────────────────────────── */
  .nav-item {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 14px 9px 20px;
    scroll-margin-top: 44px;
    border: none;
    background: none;
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    border-radius: var(--radius-md);
  }
  /* 顶层项与分组标题（1 级）左缘对齐；组内项保持 2 级缩进 */
  .nav-item--top {
    padding-left: 14px;
  }
  .nav-item:hover {
    color: var(--primary);
  }
  .nav-item--active,
  .nav-item--active:hover {
    background: transparent;
    color: var(--primary-text);
    font-weight: 500;
  }
  .nav-item-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .nav-item-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  /* ── Dark mode ───────────────────────────────────────────────────────────── */
  :global(.dark) .nav-item {
    color: rgba(255, 255, 255, 0.45);
  }
  :global(.dark) .nav-item:hover {
    color: var(--primary);
  }
  :global(.dark) .nav-item--active,
  :global(.dark) .nav-item--active:hover {
    background: transparent;
    color: var(--primary-text);
  }

  /* ── Footer ──────────────────────────────────────────────────────────────── */
  .sidebar-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 14px 0;
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .sidebar-footer-theme {
    display: flex;
    align-items: center;
    margin: -6px -8px -6px 0;
  }
  :global(.dark) .sidebar-footer {
    color: rgba(255, 255, 255, 0.3);
  }

  /* ── Popover ─────────────────────────────────────────────────────────────── */
  .sidebar-popover {
    position: fixed;
    z-index: var(--z-dropdown);
    min-width: 140px;
    max-width: 220px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(12px);
    padding: 6px;
    animation: popover-in 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  @keyframes popover-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .popover-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
    margin-bottom: 4px;
  }
  .popover-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    border: none;
    border-radius: var(--radius-md);
    background: none;
    color: rgba(0, 0, 0, 0.65);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
  }
  .popover-item:hover {
    background: color-mix(in srgb, var(--primary) 15%, transparent);
    color: var(--primary);
  }
  .popover-item-icon {
    flex-shrink: 0;
  }
  .popover-item--active {
    background: var(--primary);
    color: var(--primary-text);
    font-weight: 500;
  }
  :global(.dark) .popover-item {
    color: rgba(255, 255, 255, 0.65);
  }
  :global(.dark) .popover-item:hover {
    background: color-mix(in srgb, var(--primary) 15%, transparent);
    color: var(--primary);
  }
  :global(.dark) .popover-item--active {
    background: var(--primary);
    color: var(--primary-text);
  }
</style>

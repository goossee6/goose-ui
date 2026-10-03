<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
  import PanelLeftOpen from '@lucide/svelte/icons/panel-left-open';
  import { slide } from 'svelte/transition';
  import { pageDirStore } from '../pageDirStore.svelte.js';

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
    endItems,
    header,
    class: cls = '',
    width,
    style = '',
  }: {
    groups?: SidebarTabGroup[];
    activeTab?: string;
    mode?: 'float' | 'flat';
    shadow?: boolean;
    radius?: boolean;
    collapsed?: boolean;
    embedded?: boolean;
    onchange?: (value: string) => void;
    footer?: Snippet;
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
    const idx = groups.findIndex(g => g.items.some(i => i.value === value));
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
      const popH = Math.min(groups[gi].items.length * 32 + 40, 280);
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

  let navEl = $state<HTMLElement | null>(null);

  let pillTop = $state(0);
  let pillLeft = $state(0);
  let pillWidth = $state(0);
  let pillHeight = $state(0);
  let pillOpacity = $state(0);

  function measurePill() {
    if (!navEl) return;
    const idx = groups.findIndex((g) => g.items.some((i) => i.value === activeTab));
    if (collapsed || (idx >= 0 && !expandedGroups.has(idx))) { pillOpacity = 0; return; }
    const item = navEl.querySelector<HTMLElement>('.nav-item--active');
    if (!item) { pillOpacity = 0; return; }
    item.scrollIntoView({ block: 'nearest' });
    pillLeft = item.offsetLeft;
    pillTop = item.offsetTop;
    pillWidth = item.offsetWidth;
    pillHeight = item.offsetHeight;
    pillOpacity = 1;
  }

  let prevDirTab = activeTab;

  $effect.pre(() => {
    const cur = activeTab;
    if (cur === prevDirTab) return;
    const prev = prevDirTab;
    prevDirTab = cur;
    const flat = [...groups.flatMap((g) => g.items), ...(endItems ?? [])];
    const pi = flat.findIndex((i) => i.value === prev);
    const ci = flat.findIndex((i) => i.value === cur);
    if (pi < 0 || ci < 0 || pi === ci) return;
    pageDirStore.dir = ci < pi ? 'up' : 'down';
  });

  $effect(() => {
    activeTab;
    collapsed;
    expandedGroups;
    measurePill();
    const t = setTimeout(measurePill, 340);
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
    <div
      class="nav-pill"
      aria-hidden="true"
      style="top: {pillTop}px; left: {pillLeft}px; width: {pillWidth}px; height: {pillHeight}px; opacity: {pillOpacity}"
    ></div>
    {#each groups as group, gi}
      {#if collapsed}
        <button
          type="button"
          class="group-icon-btn"
          class:group-icon-btn--active={hasActiveItem(group)}
          onmouseenter={(e) => hoverShow(gi, e)}
          onmouseleave={hoverHide}
          title={groupTitle(group)}
        >
          {#if groupIcon(group)}
            <Icon icon={groupIcon(group)!} size={18} />
          {/if}
        </button>
      {:else}
        {#if group.title}
          <button
            type="button"
            class="group-header"
            onclick={() => toggleGroup(gi)}
          >
            {#if group.icon}
              <span class="group-icon"><Icon icon={group.icon} size={16} /></span>
            {/if}
            <span class="group-title">{group.title}</span>
            <span class="group-chevron" class:group-chevron--up={!expandedGroups.has(gi)}>
              <Icon icon={ChevronDown} size={14} />
            </span>
          </button>
        {/if}
        {#if expandedGroups.has(gi)}
          <div class="group-items" transition:slide={{ duration: 200 }}>
            {#each group.items as item}
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
      {/if}
    {/each}
    {#if !collapsed && endItems?.length}
      {#each endItems as item, i}
        <button
          type="button"
          class="nav-item nav-item--end"
          class:end-first={i === 0}
          class:nav-item--active={activeTab === item.value}
          onclick={() => selectTab(item.value)}
        >
          {#if item.icon}
            <Icon icon={item.icon} size={16} class="nav-item-icon" />
          {/if}
          <span class="nav-item-label">{item.label}</span>
        </button>
      {/each}
    {/if}
  </nav>

  {#if footer && !collapsed}
    <div class="sidebar-footer">{@render footer()}</div>
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
    {#if groups[popoverGroup] && groupIcon(groups[popoverGroup])}
      <div class="popover-header">
        <Icon icon={groupIcon(groups[popoverGroup])!} size={14} />
        <span>{groupTitle(groups[popoverGroup])}</span>
      </div>
    {/if}
    {#each groups[popoverGroup]?.items ?? [] as item}
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
    border-radius: var(--radius-xl);
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
    padding: 8px;
    scrollbar-gutter: stable;
    display: flex;
    flex-direction: column;
  }
  .sidebar-nav > * {
    flex-shrink: 0;
  }
  .nav-item--end.end-first {
    margin-top: auto;
  }

  .nav-pill {
    position: absolute;
    z-index: 0;
    border-radius: var(--radius-md);
    background: var(--primary);
    pointer-events: none;
    transition: top 0.22s ease-out, left 0.22s ease-out, width 0.22s ease-out, height 0.22s ease-out, opacity 0.15s;
  }

  /* ── Group header (expanded) ─────────────────────────────────────────────── */
  .group-header {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 14px 6px;
    border: none;
    background: none;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    text-align: left;
    transition: color 0.2s ease;
  }
  .group-header:hover {
    color: var(--text-strong);
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
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 14px 9px 20px;
    border: none;
    background: none;
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    transition: background 0.8s ease, color 0.8s ease;
    border-radius: var(--radius-md);
  }
  .nav-item:hover {
    background: color-mix(in srgb, var(--primary) 15%, transparent);
    color: var(--primary);
  }
  .nav-item--active,
  .nav-item--active:hover {
    background: transparent;
    color: #fff;
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
    background: color-mix(in srgb, var(--primary) 15%, transparent);
    color: var(--primary);
  }
  :global(.dark) .nav-item--active,
  :global(.dark) .nav-item--active:hover {
    background: transparent;
    color: #fff;
  }

  /* ── Footer ──────────────────────────────────────────────────────────────── */
  .sidebar-footer {
    padding: 10px 14px 0;
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  :global(.dark) .sidebar-footer {
    color: rgba(255, 255, 255, 0.3);
  }

  /* ── Popover ─────────────────────────────────────────────────────────────── */
  .sidebar-popover {
    position: fixed;
    z-index: 100;
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
    color: #fff;
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
    color: #fff;
  }
</style>

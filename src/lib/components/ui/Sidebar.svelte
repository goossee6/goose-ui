<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import { ChevronDown, PanelLeftClose, PanelLeftOpen } from '@lucide/svelte';
  import { slide } from 'svelte/transition';

  export interface SidebarTabItem {
    value: string;
    label: string;
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
    collapsed = $bindable(false),
    footer,
    header,
    class: cls = '',
  }: {
    groups?: SidebarTabGroup[];
    activeTab?: string;
    mode?: 'float' | 'flat';
    collapsed?: boolean;
    footer?: Snippet;
    header?: Snippet;
    class?: string;
  } = $props();

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
    popoverGroup = -1;
    const idx = groups.findIndex(g => g.items.some(i => i.value === value));
    if (idx >= 0 && !expandedGroups.has(idx)) {
      const next = new Set(expandedGroups);
      next.add(idx);
      expandedGroups = next;
    }
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
</script>

<aside
  class="sidebar sidebar--{mode} {cls}"
  class:sidebar--collapsed={collapsed}
  role="navigation"
>
  <div class="sidebar-header">
    {#if header}
      <span class="header-content">{@render header()}</span>
    {:else if !collapsed}
      <span class="logo">goose-ui</span>
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

  <nav class="sidebar-nav">
    {#each groups as group, gi}
      {#if collapsed}
        <button
          type="button"
          class="group-icon-btn"
          class:group-icon-btn--active={hasActiveItem(group)}
          onmouseenter={(e) => hoverShow(gi, e)}
          onmouseleave={hoverHide}
          title={group.title}
        >
          {#if group.icon}
            <Icon icon={group.icon} size={18} />
          {/if}
        </button>
      {:else}
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
        {#if expandedGroups.has(gi)}
          <div class="group-items" transition:slide={{ duration: 200 }}>
            {#each group.items as item}
              <button
                type="button"
                class="nav-item"
                class:nav-item--active={activeTab === item.value}
                onclick={() => selectTab(item.value)}
              >
                <span class="nav-item-label">{item.label}</span>
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    {/each}
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
    {#if groups[popoverGroup]?.icon}
      <div class="popover-header">
        <Icon icon={groups[popoverGroup].icon!} size={14} />
        <span>{groups[popoverGroup].title}</span>
      </div>
    {/if}
    {#each groups[popoverGroup]?.items ?? [] as item}
      <button
        type="button"
        class="popover-item"
        class:popover-item--active={activeTab === item.value}
        onclick={() => selectTab(item.value)}
      >
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
    z-index: 100;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  /* ── Float mode ──────────────────────────────────────────────────────────── */
  .sidebar--float {
    border-radius: var(--radius-xl);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
  }

  /* ── Flat mode ───────────────────────────────────────────────────────────── */
  .sidebar--flat {
    border-radius: 0;
    box-shadow: none;
    border: none;
    border-right: 1px solid var(--border);
  }

  /* ── Collapsed ───────────────────────────────────────────────────────────── */
  .sidebar--collapsed {
    --sidebar-w: 56px;
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
    flex: 1;
    min-height: 0;
    overflow-y: scroll;
    overflow-x: hidden;
    padding: 8px;
    scrollbar-gutter: stable;
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
    transition: color 0.15s;
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
    display: flex;
    align-items: center;
    width: 100%;
    padding: 9px 14px 9px 20px;
    border: none;
    background: none;
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px;
    text-align: left;
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
    border-radius: var(--radius-md);
  }
  .nav-item:hover {
    background: color-mix(in srgb, var(--primary) 15%, transparent);
    color: var(--primary);
  }
  .nav-item--active {
    background: var(--primary);
    color: #fff;
    font-weight: 500;
  }
  .nav-item-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ── Dark mode ───────────────────────────────────────────────────────────── */
  :global(.dark) .nav-item {
    color: rgba(255, 255, 255, 0.45);
  }
  :global(.dark) .nav-item:hover {
    background: color-mix(in srgb, var(--primary) 15%, transparent);
    color: var(--primary);
  }
  :global(.dark) .nav-item--active {
    background: var(--primary);
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
    z-index: 9999;
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
    display: block;
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

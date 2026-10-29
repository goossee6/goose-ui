<script lang="ts">
  import { untrack } from 'svelte';
  import type { Component, Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import { menuIn, menuOut } from './menuTransition';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
  import PanelLeftOpen from '@lucide/svelte/icons/panel-left-open';
  import { pageDirStore } from '../pageDirStore.svelte.js';
  import PillTrack from './PillTrack.svelte';
  import Collapsible from './Collapsible.svelte';
  import ThemeToggle from './ThemeToggle.svelte';
  import Tooltip from './Tooltip.svelte';

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

  // 初始展开态按「首次拿到的 groups」建一次快照；此后由 toggleGroup / toggleCollapse 独占维护
  let expandedGroups = $state<Set<number>>(untrack(() => new Set(groups.map((_, i) => i))));
  let prevExpanded = $state<Set<number>>(untrack(() => new Set(groups.map((_, i) => i))));

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

  /** 展开 value 所在分组；返回是否真的改动了展开集合。
      折叠态下 expandedGroups 恒为空集，故改写 prevExpanded —— 侧栏再展开时据此还原，
      否则「折叠时用链接跳转」这一步的展开意图会在还原时丢失。 */
  function revealGroup(value: string): boolean {
    const idx = groups.findIndex(g => isGroup(g) && g.items.some(i => i.value === value));
    if (idx < 0) return false;
    if (collapsed) {
      if (prevExpanded.has(idx)) return false;
      prevExpanded = new Set(prevExpanded).add(idx);
      return true;
    }
    if (expandedGroups.has(idx)) return false;
    expandedGroups = new Set(expandedGroups).add(idx);
    return true;
  }

  function selectTab(value: string) {
    activeTab = value;
    onchange?.(value);
    popoverGroup = -1;
    revealGroup(value);
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

  /**
   * 滚动条实测宽度，写进 nav 的 --sb-scroll。
   *
   * 宽度不该写死：全局 `* { scrollbar-width: thin }` 让各平台的滚动条宽度各不相同
   * （Windows 约 10px，macOS 的覆盖式滚动条是 0）。猜错的后果很具体——右侧留白
   * 比左侧多或少几像素。实测一次就够，但折叠/展开会切滚动条槽（收起态没有槽），
   * 所以跟着 collapsed 重测。
   */
  let scrollbarW = $state(0);

  $effect(() => {
    const nav = navEl;
    void collapsed; // 折叠态没有滚动条槽，重测
    if (!nav) return;
    const measure = () => {
      const w = nav.offsetWidth - nav.clientWidth;
      if (w !== scrollbarW) scrollbarW = w;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
  });

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
  let prevScrollCollapsed = collapsed;

  $effect(() => {
    activeTab;
    collapsed;
    expandedGroups;
    const tabChanged = activeTab !== prevScrollTab;
    prevScrollTab = activeTab;
    // 折叠切换：展开态的滚动位置对收起后的图标列毫无意义，且短列表本不该有滚动区。
    // 必须归零，否则残留 scrollTop 会让浏览器认定"内容超出一屏"而保留滚动条。
    const collapsedChanged = collapsed !== prevScrollCollapsed;
    prevScrollCollapsed = collapsed;
    if (collapsedChanged) navEl?.scrollTo({ top: 0 });
    if (tabChanged) scrollActiveIntoView();
    // 恢复展开：收起的图标列里 activeTab 可能早已定好（折叠态下的链接跳转），
    // tabChanged 不会触发，但此时展开后的列表需要把目标项滚回视野。
    const reexpanded = collapsedChanged && !collapsed;
    const t = setTimeout(() => {
      if (tabChanged || reexpanded) scrollActiveIntoView();
    }, 340);
    return () => clearTimeout(t);
  });

  // 外部导航（链接 / 前进后退 / 深链改写 activeTab，而非组件内点击）→ 自动展开目标分组。
  // 只在 activeTab 真的变化时跑：用户手动收起分组不该被立刻弹开。
  let prevRevealTab = activeTab;

  $effect(() => {
    const cur = activeTab;
    if (cur === prevRevealTab) return;
    prevRevealTab = cur;
    const revealed = untrack(() => revealGroup(cur));
    if (!revealed) return;
    // 分组刚展开：目标项此刻不在 DOM（原本折叠）或正随 0.25s 展开动画下移，
    // 上面那次 scrollActiveIntoView 落空，等展开收尾后再滚一次。
    const t = setTimeout(() => scrollActiveIntoView(), 340);
    return () => clearTimeout(t);
  });
</script>

<aside
  class="sidebar sidebar--{mode} {cls}"
  class:sidebar--collapsed={collapsed}
  class:sidebar--embedded={embedded}
  class:sidebar--shadow={shadow}
  class:sidebar--radius={radius}
  style="{widthStyle}{style}--sb-scroll:{scrollbarW}px;"
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
          <!-- 折叠态只剩图标，标签走 Tooltip（原来靠原生 title，样式与主题无关）。 -->
          <Tooltip title={itemLabel(entry)} placement="right" class="sb-tip">
            <button
              type="button"
              class="group-icon-btn"
              class:group-icon-btn--active={activeTab === itemValue(entry)}
              onclick={() => selectTab(itemValue(entry))}
            >
              {#if entry.icon}
                <Icon icon={entry.icon} size={16} />
              {/if}
            </button>
          </Tooltip>
        {:else}
          <button
            type="button"
            class="nav-item nav-item--top"
            class:nav-item--active={activeTab === itemValue(entry)}
            onclick={() => selectTab(itemValue(entry))}
          >
            {#if entry.icon}
              <Icon icon={entry.icon} size={14} class="nav-item-icon" />
            {/if}
            <span class="nav-item-label">{itemLabel(entry)}</span>
          </button>
        {/if}
      {/if}
      {#if isGroup(entry)}
        {#if collapsed}
          <!-- 分组按钮不套 Tooltip、也不再挂原生 title：悬停本来就会弹出分组浮层
               （hoverShow），标题已经在浮层里显示；再叠一层系统 tooltip 既是
               重复提示，也是这套界面里唯一不跟主题走的文字块。 -->
          <button
            type="button"
            class="group-icon-btn"
            class:group-icon-btn--active={hasActiveItem(entry)}
            onmouseenter={(e) => hoverShow(gi, e)}
            onmouseleave={hoverHide}
            aria-label={groupTitle(entry)}
          >
            {#if groupIcon(entry)}
              <Icon icon={groupIcon(entry)!} size={16} />
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
                    <span class="group-icon"><Icon icon={entry.icon} size={12} /></span>
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
                      <Icon icon={item.icon} size={14} class="nav-item-icon" />
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
                      <Icon icon={item.icon} size={14} class="nav-item-icon" />
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
    {#if endItems?.length}
      {#each endItems as item, i}
        {#if collapsed}
          <Tooltip title={itemLabel(item)} placement="right" class={`sb-tip ${i === 0 ? 'end-first' : ''}`}>
            <button
              type="button"
              class="group-icon-btn group-icon-btn--end"
              class:group-icon-btn--active={activeTab === item.value}
              onclick={() => selectTab(item.value)}
            >
              {#if item.icon}
                <Icon icon={item.icon} size={16} />
              {/if}
            </button>
          </Tooltip>
        {:else}
          <button
            type="button"
            class="nav-item nav-item--end nav-item--top"
            class:end-first={i === 0}
            class:nav-item--active={activeTab === item.value}
            onclick={() => selectTab(item.value)}
          >
            {#if item.icon}
              <Icon icon={item.icon} size={14} class="nav-item-icon" />
            {/if}
            <span class="nav-item-label">{itemLabel(item)}</span>
          </button>
        {/if}
      {/each}
    {/if}
    <PillTrack
      container={navEl}
      itemSelector=".nav-item, .collapsible-trigger"
      activeSelector={activeSel}
      background="var(--primary)"
      hoverBackground="var(--hover)"
      activeHoverBackground="var(--primary-hover)"
      radius="var(--radius-md)"
      zIndex={-1}
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
    in:menuIn
    out:menuOut
    onmouseenter={hoverCancelHide}
    onmouseleave={hoverHide}
  >
    {#if popoverEntry && groupIcon(popoverEntry)}
      <div class="popover-header">
        <Icon icon={groupIcon(popoverEntry)!} size={12} />
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
  /* ── 度量 ──────────────────────────────────────────────────────────────────
     侧栏里所有行、组头、页脚、折叠弹层的尺寸都从这一组变量派生，改一处全跟着走。
     折叠弹层是 <aside> 的**兄弟节点**，继承不到 aside 上的自定义属性，
     所以下面这条选择器把它也算进来。

     横向只有两条规则，别的都从它们推：
       · --sb-inset（10）  块（行 / 组头 / hover 药丸）的边缘到侧栏边；
       · --sb-pad（10）    块内左右内边距 → 图标 / 文字左缘 = 边缘 + 10。
    滚动条槽（--sb-scroll，常驻一条滚动条的宽度）必须算进去，否则它一出现就把内容整体左移、
     右侧留白比左侧少一条滚动条的宽度。于是派生出两个值：
       · --sb-rail = inset + scroll（16）  滚动区两侧的视觉留白，也是块的边缘；
       · --sb-edge = rail + pad（26）      文字 / 图标的左缘。
     header 与 footer 在滚动区之外，直接用这两个值对齐行。

     纵向同理：
       · --sb-row-h（36）  每行 = 14px 文字 + 上下各 ~8px 留白（点击区 36 高，够按）；
                          组头用同一个高度，所以「组头 → 第一项」的节奏和「项 → 项」一致。
       · 组内 2px、组间 16px —— 靠间距本身就分得清组，不用再加分隔线。 */
  .sidebar,
  .sidebar-popover {
    --sb-inset: 10px;
    --sb-pad: 10px;
    --sb-scroll: 10px; /* theme.css 的 * { scrollbar-width: thin } 在 Windows 上约 10px；JS 会实测覆盖 */
    --sb-rail: calc(var(--sb-inset) + var(--sb-scroll));
    --sb-edge: calc(var(--sb-rail) + var(--sb-pad));
    --sb-row-h: 36px;
    --sb-radius: var(--radius-md);
    --sb-font: 14px; /* 导航项 / 顶层项 / 弹层项 */
    --sb-font-label: 12px; /* 组头 / 弹层组头 / 页脚（小标签） */
    --sb-font-logo: 15px;
    --sb-icon: 14px; /* 行内图标：lucide 的图形在 24 视框内还有 ~3 的内缩，14 的视觉大小略小于 14px 文字 */
    --sb-icon-lg: 16px; /* 折叠按钮 / 折叠态的图标按钮 */
    --sb-gap-icon: 8px; /* 图文间距，全侧栏一致 */
    --sb-gap-row: 2px;
    --sb-gap-group: 16px;
    --sb-hit: 32px; /* 图标按钮的最小点击区 */
  }

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
  /* header 在滚动区之外，用派生值手工对齐行：
     左边 = --sb-edge（内容左缘）→ logo 与组标题、导航项图标同一条竖线；
     右边 = --sb-rail（块边缘）→ 折叠按钮的悬停底与行的药丸同一条右边界。 */
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sb-gap-icon);
    padding: 0 var(--sb-rail) 12px var(--sb-edge);
    border-bottom: 1px solid var(--border);
    min-height: var(--sb-row-h);
  }
  .sidebar--collapsed .sidebar-header {
    justify-content: center;
    padding: 0 0 12px;
  }
  .header-content { display: contents; }
  .logo {
    font-size: var(--sb-font-logo);
    font-weight: 700;
    color: var(--text-strong);
    letter-spacing: -0.01em;
    white-space: nowrap;
  }
  /* 点击区从 26 提到 32（--sb-hit）：原来的方框比行高矮一截，
     悬停时还得瞄着点。圆角与行一致，hover 底才像同一套控件。 */
  .collapse-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--sb-hit);
    height: var(--sb-hit);
    border: none;
    border-radius: var(--sb-radius);
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
  /* 滚动条是「两侧留白一致」唯一的破坏者：经典滚动条占宽度，一出现就把内容整体左移，
     药丸的右边缘比左边缘窄一条滚动条的宽度。这里把它算进 padding——
     左内缩 = rail（inset + scroll），右侧 = inset + 滚动条本身，两边都是 rail。
     `scrollbar-gutter: stable` 让这条槽位常驻，避免「内容刚够高 → 出现滚动条 → 整列抖一下」。

     宽度也不该写死：theme.css 全局写了 `* { scrollbar-width: thin }`，于是所有滚动条都走
     原生 thin（Windows 上实测 10px），而 ::-webkit-scrollbar 的宽度在这条生效后是被忽略的。
     10px 只是首帧兜底，真实值由 JS 实测 offsetWidth - clientWidth 写进 --sb-scroll
     （见 scrollbarW），任何引擎、任何滚动条宽度下两侧留白都真的相等。 */
  .sidebar-nav {
    --sb-scroll: 10px;
    position: relative;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-gutter: stable;
    padding: 0 var(--sb-inset) 8px var(--sb-rail);
    display: flex;
    flex-direction: column;
    /* 组间 16：用 gap 而不是 margin——endItems 的「贴底」靠 margin-top:auto，
       一旦被更高特异性的 margin 规则覆盖就失效（曾经踩过）。 */
    gap: var(--sb-gap-group);
  }
  /* 折叠态是一列图标、从不溢出，不需要常驻槽位：去掉后左右内缩恢复对称，
     图标列才能落在 56px 宽的正中间。 */
  .sidebar--collapsed .sidebar-nav {
    scrollbar-gutter: auto;
    padding-inline: var(--sb-inset);
    gap: 0;
  }
  /* endItems：空间有余量时贴底（auto margin），列表超高时顺次接在末尾 */
  .sidebar-nav > * { flex-shrink: 0; }
  .sidebar-nav > :first-child { margin-top: 8px; }
  .nav-item--end.end-first,
  .group-icon-btn--end.end-first { margin-top: auto; }
  /* 折叠态的图标按钮外面套了 Tooltip 触发器，它取代按钮成了 .sidebar-nav 的
     直接子项：上面三条 `> *` 规则（不被压缩 / 首项上边距 / end 项贴底）
     都命中不到按钮了，得原样落到触发器这一层，否则贴底的项会失去 auto margin。 */
  .sidebar-nav > :global(.sb-tip) {
    flex-shrink: 0;
    width: 100%;
  }
  .sidebar-nav > :global(.sb-tip:first-child) { margin-top: 8px; }
  .sidebar-nav > :global(.sb-tip.end-first) { margin-top: auto; }

  /* ── Group header (expanded)：Collapsible 触发区/根覆写（同 Accordion 先例） ── */
  /* 菜单分组不要卡片边框；overflow visible 保住分组头 position:sticky 吸顶 */
  .sidebar-nav :global(.collapsible) {
    border: none;
    border-radius: 0;
    overflow: visible;
  }
  /* 几何与 .nav-item 完全同构：同左右边缘（--sb-pad）、同高（--sb-row-h）、同圆角、
     同图文间距。组头是「标签」不是「项」，所以字号降一档（--sb-font-label），
     大写 + 字距把它和可点击的导航项区分开。 */
  .sidebar-nav :global(.collapsible-trigger) {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--sb-gap-icon);
    position: sticky;
    top: 0;
    height: var(--sb-row-h);
    padding: 0 var(--sb-pad);
    border: none;
    border-radius: var(--sb-radius);
    background: transparent;
    color: var(--text-muted);
    font-size: var(--sb-font-label);
    font-weight: 600;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.06em;
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
  /* 吸顶（stuck）时轻微磨砂：半透明底 + 弱模糊遮住身后滚过的内容，
     内容在组头下若隐若现，而不是被一块死板的不透明色硬生生切断。
     未吸顶仍保持透明，hover 交给下层 pill（与 nav-item 同动画）。 */
  .sidebar-nav :global(.collapsible-trigger.stuck) {
    background: color-mix(in srgb, var(--surface) 80%, transparent);
    backdrop-filter: blur(12px);
  }
  .sidebar-nav :global(.collapsible-trigger.stuck:hover:not(:disabled)) {
    /* 同色自背景（= pill hover 色叠 surface，不透明）：与下层 pill 同色叠加无视觉冲突 */
    background: color-mix(in srgb, var(--accent) 15%, var(--surface));
  }
  /* 菜单分组内容不做卡片式内边距/弱化色/分隔线（Collapsible 内容默认样式覆写）。
     flex + gap 负责「组内 2px」：项与项之间不需要各自写 margin，
     收起的空内容也不会留下残距。 */
  .sidebar-nav :global(.collapsible-body) {
    display: flex;
    flex-direction: column;
    gap: var(--sb-gap-row);
    padding: 0;
    border-top: none;
    margin-top: 0;
    font-size: inherit;
    color: inherit;
    line-height: inherit;
  }
  /* 侧栏分组用自己的树形箭头（收起指左），隐藏 Collapsible 内置箭头 */
  .sidebar-nav :global(.collapsible-chevron) {
    display: none;
  }
  /* 槽宽固定成导航项图标的宽度（--sb-icon），里面放一个更小的图标：
     组头是 12px 的标签，图标给 12 才符合「图标略小于文字」，
     但槽宽不变，组标题因此仍与导航项标签落在同一条竖线上。 */
  .group-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--sb-icon);
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
    height: var(--sb-row-h);
    border: none;
    border-radius: var(--sb-radius);
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
  /* 高度写死成 --sb-row-h（不是 padding 撑出来的）：一行 = 文字 + 上下留白，
     同一套高度让「组头 / 顶层项 / 组内项」的节奏完全一致，点击区也稳定在 36。 */
  .nav-item {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: var(--sb-gap-icon);
    width: 100%;
    height: var(--sb-row-h);
    /* 组内项是 2 级：在内边距之上再缩进 10，靠缩进表达层级、不靠字号 */
    padding: 0 var(--sb-pad) 0 calc(var(--sb-pad) + 10px);
    scroll-margin-top: calc(var(--sb-row-h) + 8px);
    border: none;
    background: none;
    color: rgba(0, 0, 0, 0.45);
    font-size: var(--sb-font);
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    border-radius: var(--sb-radius);
  }
  /* 顶层项与组标题（1 级）左缘对齐；组内项保持 2 级缩进 */
  .nav-item--top {
    padding-left: var(--sb-pad);
  }
  .nav-item:hover {
    color: var(--primary);
  }
  /*
   * 激活项文字用主色前景（--accent-text），压在实心主色 pill 上 ------
   * 两套主题都是「主色底 + 白字」：亮色 --primary 是 oklch(0.61 0.22 264)
   * 的深蓝，暗色 --primary 更暗，白字对比度都够。曾经用过 --text-strong，
   * 亮色下它是近黑，压在深蓝上几乎看不清。
   */
  .nav-item--active,
  .nav-item--active:hover {
    background: transparent;
    color: var(--accent-text);
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
    color: var(--accent-text);
  }

  /* ── Footer ──────────────────────────────────────────────────────────────── */
  /* 左右与 header 同一把尺（--sb-edge），字号用标签档 —— 页脚是附属信息，
     不该比导航项还大，也不该自成一套 11px。 */
  .sidebar-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sb-gap-icon);
    padding: 12px var(--sb-rail) 0 var(--sb-edge);
    border-top: 1px solid var(--border);
    font-size: var(--sb-font-label);
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
  /* 与展开态同一套度量：面板圆角 --radius-lg（浮层档）、行圆角 --sb-radius（行档），
     行高 / 图文间距 / 字号都用侧栏的变量，视觉上就是「侧栏被抽出来一小块」。 */
  .sidebar-popover {
    position: fixed;
    z-index: var(--z-dropdown);
    min-width: 140px;
    max-width: 220px;
    display: flex;
    flex-direction: column;
    gap: var(--sb-gap-row);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(12px);
    padding: 8px;
    /* 进出场由 menuIn/menuOut 负责（与其它浮层同一曲线）。
       原来这里是一条 @keyframes，只有进入、没有离开：鼠标移开后面板是「啪」地消失的。 */
  }
  .popover-header {
    display: flex;
    align-items: center;
    gap: var(--sb-gap-icon);
    padding: 4px 8px 6px;
    font-size: var(--sb-font-label);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
    margin-bottom: 2px;
  }
  .popover-item {
    display: flex;
    align-items: center;
    gap: var(--sb-gap-icon);
    width: 100%;
    /* 32 高：弹层比展开态紧凑，但仍是完整的一行（文字 + 上下留白），
       比原来的 6px 内边距（约 30 高、且上下不均）更好点 */
    min-height: var(--sb-hit);
    padding: 6px 8px;
    border: none;
    border-radius: var(--sb-radius);
    background: none;
    color: rgba(0, 0, 0, 0.65);
    font-size: var(--sb-font);
    text-align: left;
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
  }
  /* 折叠态弹层的行 hover：和展开态导航一致，用不透明的 --hover
     （以前是 --accent-sub，15% 淡染叠在浮层上，深浅底色下浓淡不一） */
  .popover-item:hover {
    background: var(--hover);
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
    background: var(--hover);
    color: var(--primary);
  }
  :global(.dark) .popover-item--active {
    background: var(--primary);
    color: var(--primary-text);
  }
</style>

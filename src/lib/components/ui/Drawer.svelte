<script lang="ts">
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import X from '@lucide/svelte/icons/x';

  let {
    open = $bindable(false),
    title,
    placement = 'right',
    width,
    height,
    resizable = false,
    snapPoints = [30, 60, 80],
    offsetTop,
    maskClosable = true,
    pushBackground = true,
    container = null,
    footer,
    onClose,
    children,
    class: cls = '',
    style = '',
  }: {
    open?: boolean;
    title?: string | Snippet;
    placement?: 'left' | 'right' | 'top' | 'bottom';
    width?: number | string;
    height?: number | string;
    /** 可拖动边缘调整尺寸：top/bottom 调高度，left/right 调宽度 */
    resizable?: boolean;
    /** 松手后吸附的尺寸百分比（按抽屉轴向），默认 [30, 60, 80] */
    snapPoints?: number[];
    /** 顶部留白：抽屉层从该位置开始（数字按 px），用于避开标题栏 */
    offsetTop?: number | string;
    maskClosable?: boolean;
    pushBackground?: boolean;
    /** 挂载容器；默认 body。传入元素时抽屉在该元素内绝对定位（容器需是定位元素） */
    container?: HTMLElement | null;
    footer?: Snippet | null;
    onClose?: () => void;
    children?: Snippet;
    class?: string;
    style?: string;
  } = $props();

  function portal(node: HTMLElement, target: HTMLElement | null) {
    let host = target ?? document.body;
    host.appendChild(node);
    return {
      update(next: HTMLElement | null) {
        const nextHost = next ?? document.body;
        if (nextHost === host) return;
        host = nextHost;
        host.appendChild(node);
      },
      destroy() {
        node.remove();
      },
    };
  }

  function doClose() {
    onClose?.();
    open = false;
  }

  function handleMaskClick() {
    if (maskClosable) doClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') {
      // 只关本层，不冒泡触发外层 Modal 的 Esc
      e.stopPropagation();
      doClose();
    }
  }

  $effect(() => {
    if (!pushBackground) return;
    const el = (container ?? document).querySelector('.layout, .layout-content, main') as HTMLElement | null;
    if (!el) return;
    if (open) {
      el.style.transition = 'transform 0.36s cubic-bezier(0.2, 0, 0.2, 1), filter 0.36s, border-radius 0.36s';
      el.style.transformOrigin = 'center center';
      el.style.transform = 'scale(0.94)';
      el.style.filter = 'blur(1px)';
      el.style.borderRadius = '14px';
      el.style.overflow = 'hidden';
    } else {
      el.style.transition = 'transform 0.36s cubic-bezier(0.2, 0, 0.2, 1), filter 0.36s, border-radius 0.36s';
      el.style.transform = '';
      el.style.filter = '';
      el.style.borderRadius = '';
      el.style.overflow = '';
    }
    return () => {
      if (!el) return;
      el.style.transition = '';
      el.style.transform = '';
      el.style.filter = '';
      el.style.borderRadius = '';
      el.style.overflow = '';
    };
  });

  const flyAxis = $derived(
    placement === 'left' || placement === 'right' ? 'x' : 'y'
  );
  const isVertical = $derived(placement === 'top' || placement === 'bottom');

  /** 吸附点：过滤非法值并升序；全部非法时退回默认三档 */
  const snaps = $derived.by(() => {
    const list = [...new Set(snapPoints.filter((p) => Number.isFinite(p) && p > 0 && p <= 100))].sort(
      (a, b) => a - b
    );
    return list.length ? list : [30, 60, 80];
  });

  let sizePct = $state<number | null>(null);
  let dragging = $state(false);
  let dragStart: { pos: number; pct: number } | null = null;
  let rootEl = $state<HTMLElement>();

  /** 百分比换算基准：优先量根层（已扣除 offsetTop），否则用容器/视口 */
  function axisBase() {
    const measured = rootEl
      ? isVertical ? rootEl.clientHeight : rootEl.clientWidth
      : 0;
    if (measured > 0) return measured;
    if (typeof window === 'undefined') return 1000;
    if (isVertical) return container ? container.clientHeight : window.innerHeight;
    return container ? container.clientWidth : window.innerWidth;
  }

  function clampPct(p: number) {
    return Math.min(Math.max(p, snaps[0]), snaps[snaps.length - 1]);
  }

  /** 初始尺寸：显式 width/height 优先，否则取中间吸附点 */
  function initialPct() {
    const raw = isVertical ? height : width;
    if (raw == null) return snaps[Math.floor(snaps.length / 2)];
    if (typeof raw === 'string' && raw.trim().endsWith('%')) {
      return clampPct(parseFloat(raw));
    }
    const base = axisBase();
    const px = typeof raw === 'number' ? raw : parseFloat(raw);
    if (!Number.isFinite(px)) return snaps[Math.floor(snaps.length / 2)];
    return clampPct((px / base) * 100);
  }

  $effect(() => {
    if (open && resizable && sizePct === null) sizePct = initialPct();
  });

  $effect(() => {
    if (open) return;
    // 关闭动画结束后清掉拖动尺寸，下次打开回到配置的初始高度
    const t = setTimeout(() => {
      sizePct = null;
    }, 400);
    return () => clearTimeout(t);
  });

  /** 标题栏拖拽：命中关闭键时放行，其余位置都当把手用 */
  function onHeaderResizeStart(e: PointerEvent) {
    if (!resizable || !isVertical) return;
    if ((e.target as HTMLElement).closest('button')) return;
    onResizeStart(e);
  }

  function onResizeStart(e: PointerEvent) {
    if (!resizable) return;
    e.preventDefault();
    dragging = true;
    dragStart = {
      pos: isVertical ? e.clientY : e.clientX,
      pct: sizePct ?? initialPct(),
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onResizeMove(e: PointerEvent) {
    if (!dragging || !dragStart) return;
    const delta = (isVertical ? e.clientY : e.clientX) - dragStart.pos;
    // 统一成「变大为正」：bottom 向上、top 向下、left 向右、right 向左
    const grow =
      placement === 'bottom' ? -delta :
      placement === 'top' ? delta :
      placement === 'left' ? delta : -delta;
    const raw = dragStart.pct + (grow / axisBase()) * 100;
    // 拖动时不夹到最小档位：允许一路推到 0，松手低于半档即视为「滑到底部关闭」
    sizePct = Math.min(Math.max(raw, 0), snaps[snaps.length - 1]);
  }

  function onResizeEnd() {
    if (!dragging) return;
    dragging = false;
    dragStart = null;
    const current = sizePct ?? initialPct();
    // 拖过最小档位的一半：贴着边缘松手，收起高度并关闭
    if (current <= snaps[0] / 2) {
      sizePct = 0;
      doClose();
      return;
    }
    sizePct = snaps.reduce((a, b) => (Math.abs(b - current) < Math.abs(a - current) ? b : a));
  }

  function onResizeKeydown(e: KeyboardEvent) {
    if (!resizable) return;
    const bigger =
      (placement === 'bottom' && e.key === 'ArrowUp') ||
      (placement === 'top' && e.key === 'ArrowDown') ||
      (placement === 'left' && e.key === 'ArrowRight') ||
      (placement === 'right' && e.key === 'ArrowLeft');
    const smaller =
      (placement === 'bottom' && e.key === 'ArrowDown') ||
      (placement === 'top' && e.key === 'ArrowUp') ||
      (placement === 'left' && e.key === 'ArrowLeft') ||
      (placement === 'right' && e.key === 'ArrowRight');
    if (!bigger && !smaller) return;
    e.preventDefault();
    const current = sizePct ?? initialPct();
    sizePct = bigger
      ? snaps.find((p) => p > current + 0.01) ?? snaps[snaps.length - 1]
      : [...snaps].reverse().find((p) => p < current - 0.01) ?? snaps[0];
  }

  const slideAmount = $derived.by(() => {
    const axisPx = resizable
      ? (axisBase() * (sizePct ?? initialPct())) / 100
      : flyAxis === 'x'
        ? (typeof width === 'number' ? width : parseInt(width ?? '') || 378)
        : (typeof height === 'number' ? height : parseInt(height ?? '') || 300);
    return flyAxis === 'x'
      ? (placement === 'left' ? -1 : 1) * axisPx
      : (placement === 'top' ? -1 : 1) * axisPx;
  });

  /** 纯位移过渡：只改 transform，不透明度不动（Svelte 的 fly 会顺带淡入淡出） */
  function panelSlide(
    _node: HTMLElement,
    params: { amount: number; duration?: number }
  ) {
    const distance = params.amount;
    return {
      duration: params.duration ?? 360,
      easing: cubicOut,
      css: (t: number) =>
        `transform: translate${isVertical ? 'Y' : 'X'}(${(1 - t) * distance}px)`,
    };
  }

  const drawerStyle = $derived.by(() => {
    if (resizable) {
      const pct = sizePct ?? initialPct();
      return isVertical
        ? `height: ${pct}%; width: 100%;`
        : `width: ${pct}%; height: 100%;`;
    }
    const w = width ?? 378;
    const h = height ?? 300;
    return flyAxis === 'x'
      ? `width: ${typeof w === 'number' ? `${w}px` : w}; height: 100%;`
      : `height: ${typeof h === 'number' ? `${h}px` : h}; width: 100%;`;
  });
</script>

<svelte:window
  onkeydown={handleKeydown}
  onpointermove={onResizeMove}
  onpointerup={onResizeEnd}
  onpointercancel={onResizeEnd}
/>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="drawer-root"
    class:drawer-root--contained={!!container || offsetTop != null}
    style:top={offsetTop == null ? undefined : typeof offsetTop === 'number' ? `${offsetTop}px` : offsetTop}
    bind:this={rootEl}
    use:portal={container}
  >
    <!-- 遮罩点击关闭属指针直达操作，键盘等价路径为 Esc（见 svelte:window onkeydown） -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="drawer-overlay"
      onclick={handleMaskClick}
      transition:fade={{ duration: 250 }}
    ></div>
    <!-- 容器仅做「点内部不关闭」的事件拦截，键盘路径同样由 Esc 提供 -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="drawer drawer--{placement} {cls}"
      class:drawer--resizable={resizable}
      class:drawer--dragging={dragging}
      style="{drawerStyle} {style}"
      role="dialog"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      transition:panelSlide={{ amount: slideAmount }}
    >
      {#if resizable && !isVertical}
        <!-- 侧边抽屉（left/right）：边缘分隔条，指针拖动 + 方向键换档 -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div
          class="drawer-resize drawer-resize--{placement}"
          role="separator"
          tabindex="0"
          aria-orientation="vertical"
          aria-label="拖动调整宽度"
          aria-valuenow={Math.round(sizePct ?? initialPct())}
          aria-valuemin={snaps[0]}
          aria-valuemax={snaps[snaps.length - 1]}
          onpointerdown={onResizeStart}
          onkeydown={onResizeKeydown}
        ></div>
      {/if}
      <!-- 顶部/底部抽屉：整个标题栏就是拖拽热区（关闭键除外），方向键换档 -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        class="drawer-header"
        class:drawer-header--resizable={resizable && isVertical}
        role={resizable && isVertical ? 'separator' : undefined}
        tabindex={resizable && isVertical ? 0 : undefined}
        aria-orientation={resizable && isVertical ? 'horizontal' : undefined}
        aria-label={resizable && isVertical ? '拖动调整高度' : undefined}
        aria-valuenow={resizable && isVertical ? Math.round(sizePct ?? initialPct()) : undefined}
        aria-valuemin={resizable && isVertical ? snaps[0] : undefined}
        aria-valuemax={resizable && isVertical ? snaps[snaps.length - 1] : undefined}
        onpointerdown={onHeaderResizeStart}
        onkeydown={resizable && isVertical ? onResizeKeydown : undefined}
      >
        {#if resizable && isVertical}
          <span class="drawer-grip drawer-grip--{placement}" aria-hidden="true"></span>
        {/if}
        <span class="drawer-title">
          {#if typeof title === 'string'}{@html title}{:else}{@render title?.()}{/if}
        </span>
        <button class="drawer-close" onclick={doClose} aria-label="关闭">
          <Icon icon={X} size={14} />
        </button>
      </div>
      <div class="drawer-body">
        {@render children?.()}
      </div>
      {#if footer}
        <div class="drawer-footer">{@render footer()}</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .drawer-root {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-overlay);
    pointer-events: none;
    /* 绝对定位（container / offsetTop）时，滑入位移会计入滚动溢出导致
       页面出现瞬时滚动条；在根层裁掉即可，视口内视觉不变 */
    overflow: hidden;
  }
  /* 传入 container 时整层改为绝对定位，跟随容器而不是视口 */
  .drawer-root--contained,
  .drawer-root--contained .drawer-overlay,
  .drawer-root--contained .drawer {
    position: absolute;
  }
  .drawer-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.2);
    pointer-events: auto;
  }
  .drawer {
    background-color: var(--surface);
    border: 1px solid var(--border-strong);
    display: flex;
    flex-direction: column;
    overscroll-behavior: contain;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    position: fixed;
    pointer-events: auto;
  }
  /* 拖动吸附：松手后尺寸平滑过渡，拖动过程中禁用过渡跟手 */
  .drawer--resizable {
    transition:
      height 0.22s cubic-bezier(0.2, 0, 0.2, 1),
      width 0.22s cubic-bezier(0.2, 0, 0.2, 1);
  }
  .drawer--dragging {
    transition: none;
    user-select: none;
  }
  .drawer-resize {
    position: absolute;
    z-index: 1;
    touch-action: none;
  }
  .drawer-resize::after {
    content: '';
    position: absolute;
    background: var(--text-muted);
    border-radius: 999px;
    opacity: 0.6;
    transition: background-color 0.15s, opacity 0.15s;
  }
  .drawer-resize:hover::after,
  .drawer-resize:focus-visible::after {
    background: var(--primary);
    opacity: 1;
  }
  .drawer-resize:focus-visible {
    outline: none;
  }
  .drawer-resize--left {
    right: -6px;
    top: 0;
    bottom: 0;
    width: 16px;
    cursor: ew-resize;
  }
  .drawer-resize--left::after {
    right: 12px;
    top: 50%;
    width: 5px;
    height: 64px;
    transform: translateY(-50%);
  }
  .drawer-resize--right {
    left: -6px;
    top: 0;
    bottom: 0;
    width: 16px;
    cursor: ew-resize;
  }
  .drawer-resize--right::after {
    left: 12px;
    top: 50%;
    width: 5px;
    height: 64px;
    transform: translateY(-50%);
  }
  .drawer--left {
    top: 0;
    left: 0;
    bottom: 0;
    border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  }
  .drawer--right {
    top: 0;
    right: 0;
    bottom: 0;
    border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  }
  .drawer--top {
    top: 0;
    left: 0;
    right: 0;
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  }
  .drawer--bottom {
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
  .drawer-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--sp-lg) 24px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-strong);
    border-bottom: 1px solid var(--border-strong);
    flex-shrink: 0;
  }
  /* 顶部/底部抽屉的整个标题栏都是拖拽热区 */
  .drawer-header--resizable {
    cursor: ns-resize;
    touch-action: none;
    user-select: none;
  }
  .drawer-grip {
    position: absolute;
    left: 50%;
    width: 72px;
    height: 6px;
    border-radius: 999px;
    background: var(--text-muted);
    opacity: 0.6;
    transform: translateX(-50%);
    pointer-events: none;
    transition: background-color 0.15s, opacity 0.15s;
  }
  .drawer-grip--bottom {
    top: 6px;
  }
  .drawer-grip--top {
    bottom: 6px;
  }
  .drawer-header--resizable:hover .drawer-grip,
  .drawer-header--resizable:focus-visible .drawer-grip,
  .drawer--dragging .drawer-grip {
    background: var(--primary);
    opacity: 1;
  }
  .drawer-header--resizable:focus-visible {
    outline: none;
  }
  .drawer-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .drawer-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    margin-left: 8px;
    background: none;
    border: none;
    border-radius: var(--radius-lg);
    color: var(--text-muted);
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s;
  }
  .drawer-close:hover {
    background-color: var(--surface-2);
    color: var(--text-strong);
  }
  .drawer-body {
    padding: 24px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-gutter: stable;
  }
  .drawer-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-lg);
    padding: var(--sp-lg) 24px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }
</style>

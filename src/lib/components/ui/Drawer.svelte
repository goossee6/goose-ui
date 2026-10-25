<script lang="ts" module>
  /** aria-labelledby 需要一个跨实例唯一的 id（同页可能开多个抽屉） */
  let drawerSeq = 0;
  function nextDrawerId(): number {
    return ++drawerSeq;
  }
</script>

<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import X from '@lucide/svelte/icons/x';
  import { trapTabKey } from './focusTrap';

  let {
    open = $bindable(false),
    title,
    placement = 'right',
    width = 378,
    height = 300,
    maskClosable = true,
    pushBackground = true,
    backgroundSelector = '.layout, .layout-content, main',
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
    maskClosable?: boolean;
    pushBackground?: boolean;
    /** pushBackground 要缩放的宿主容器；传 null 关闭（等价 pushBackground={false}） */
    backgroundSelector?: string | null;
    footer?: Snippet | null;
    onClose?: () => void;
    children?: Snippet;
    class?: string;
    style?: string;
  } = $props();

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
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
    } else if (e.key === 'Tab') {
      trapTabKey(e, dialogEl);
    }
  }

  let dialogEl: HTMLElement | null = $state(null);
  let lastFocused: HTMLElement | null = null;
  const titleId = `goose-drawer-title-${nextDrawerId()}`;

  // 打开时接管焦点、关闭时还给打开前的元素（与 Modal 一致）
  $effect(() => {
    if (!open || typeof document === 'undefined') return;
    lastFocused = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => dialogEl?.focus?.(), 0);
    return () => {
      clearTimeout(t);
      if (lastFocused?.isConnected) lastFocused.focus();
      lastFocused = null;
    };
  });

  /* pushBackground：把宿主容器整体缩小 + 轻微模糊，做出「抽屉把页面推后一层」的观感。
     这里只在**打开瞬间**快照宿主的原内联样式，关闭/销毁时写回快照 ——
     早先是直接置空，会把宿主自己写的 transform / filter 一并抹掉。 */
  const PUSH_STYLE: Record<string, string> = {
    transition: 'transform 0.36s cubic-bezier(0.2, 0, 0.2, 1), filter 0.36s, border-radius 0.36s',
    transformOrigin: 'center center',
    transform: 'scale(0.94)',
    filter: 'blur(1px)',
    borderRadius: '14px',
    overflow: 'hidden',
  };
  const PUSH_KEYS = Object.keys(PUSH_STYLE);
  let bgEl: HTMLElement | null = null;
  let bgSaved: Record<string, string> | null = null;

  function applyBg(pushed: boolean, keepTransition = false): void {
    if (!bgEl) return;
    const src = pushed ? PUSH_STYLE : (bgSaved ?? {});
    for (const k of PUSH_KEYS) {
      // 收尾时要先让 transform 在「过渡仍在」的前提下回去，所以最后才还原 transition
      if (keepTransition && k === 'transition') continue;
      (bgEl.style as unknown as Record<string, string>)[k] = src[k] ?? '';
    }
  }

  $effect(() => {
    if (!pushBackground || !backgroundSelector || typeof document === 'undefined') return;
    if (open) {
      if (!bgEl) {
        bgEl = document.querySelector(backgroundSelector) as HTMLElement | null;
        if (!bgEl) return;
        bgSaved = {};
        for (const k of PUSH_KEYS) {
          bgSaved[k] = (bgEl.style as unknown as Record<string, string>)[k] ?? '';
        }
      }
      applyBg(true);
    } else if (bgEl) {
      const el = bgEl;
      const savedTransition = bgSaved?.transition ?? '';
      // 保持过渡在位，下一帧再把 transform / filter / 圆角写回快照 —— 同帧写会变成硬跳
      el.style.transition = PUSH_STYLE.transition;
      const raf = requestAnimationFrame(() => applyBg(false, true));
      // 回弹跑完（360ms）再收尾：把 transition 本身也还原，期间用户重新打开能接上
      const t = setTimeout(() => {
        el.style.transition = savedTransition;
        bgEl = null;
        bgSaved = null;
      }, 420);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t);
      };
    }
  });

  // 组件销毁时无条件还原，避免停在「缩小 + 模糊」状态
  $effect(() => () => {
    if (bgEl && bgSaved) applyBg(false);
    bgEl = null;
    bgSaved = null;
  });

  const flyAxis = $derived(
    placement === 'left' || placement === 'right' ? 'x' : 'y'
  );
  const flyAmount = $derived(
    flyAxis === 'x'
      ? (placement === 'left' ? -1 : 1) * (typeof width === 'number' ? width : parseInt(width) || 378)
      : (placement === 'top' ? -1 : 1) * (typeof height === 'number' ? height : parseInt(height) || 300)
  );
  const drawerStyle = $derived(
    flyAxis === 'x'
      ? `width: ${typeof width === 'number' ? `${width}px` : width}; height: 100%;`
      : `height: ${typeof height === 'number' ? `${height}px` : height}; width: 100%;`
  );
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="drawer-root" use:portal>
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
      style="{drawerStyle} {style}"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      tabindex="-1"
      bind:this={dialogEl}
      onclick={(e) => e.stopPropagation()}
      transition:fly={{ [flyAxis]: flyAmount, duration: 360, easing: cubicOut }}
    >
      <div class="drawer-header">
        <span class="drawer-title" id={titleId}>
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

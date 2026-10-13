<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import X from '@lucide/svelte/icons/x';

  let {
    open = $bindable(false),
    title,
    placement = 'right',
    width = 378,
    height = 300,
    maskClosable = true,
    pushBackground = true,
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
    }
  }

  $effect(() => {
    if (!pushBackground) return;
    const el = document.querySelector('.layout, .layout-content, main') as HTMLElement | null;
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
    <div
      class="drawer-overlay"
      onclick={handleMaskClick}
      transition:fade={{ duration: 250 }}
    ></div>
    <div
      class="drawer drawer--{placement} {cls}"
      style="{drawerStyle} {style}"
      role="dialog"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      transition:fly={{ [flyAxis]: flyAmount, duration: 360, easing: cubicOut }}
    >
      <div class="drawer-header">
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

<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title = '',
    collapsed = false,
    sidebarWidth = '252px',
    sidebarCollapsedWidth = '88px',
    height = '52px',
    class: cls = '',
    left,
    center,
    right,
    children,
  }: {
    title?: string;
    collapsed?: boolean;
    sidebarWidth?: string;
    sidebarCollapsedWidth?: string;
    height?: string;
    class?: string;
    left?: Snippet;
    center?: Snippet;
    right?: Snippet;
    children?: Snippet;
  } = $props();
</script>

<header
  class="header {cls}"
  class:header--collapsed={collapsed}
  style:--header-h={height}
  style:--sidebar-w={sidebarWidth}
  style:--sidebar-collapsed-w={sidebarCollapsedWidth}
>
  <div class="header-left">
    {#if left}
      {@render left()}
    {:else if title}
      <span class="header-title">{title}</span>
    {/if}
  </div>

  <div class="header-center">
    {#if center}
      {@render center()}
    {/if}
  </div>

  <div class="header-right">
    {#if right}
      {@render right()}
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </div>
</header>

<style>
  .header {
    position: fixed;
    top: 0;
    left: var(--sidebar-w);
    right: 0;
    height: var(--header-h);
    background: color-mix(in srgb, var(--surface) 80%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 24px;
    z-index: 100;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .header--collapsed {
    left: var(--sidebar-collapsed-w);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .header-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-strong);
    white-space: nowrap;
  }

  .header-center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
</style>

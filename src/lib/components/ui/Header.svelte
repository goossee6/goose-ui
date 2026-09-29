<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title = '',
    height = '52px',
    class: cls = '',
    style = '',
    left,
    center,
    right,
    children,
  }: {
    title?: string;
    height?: string;
    class?: string;
    style?: string;
    left?: Snippet;
    center?: Snippet;
    right?: Snippet;
    children?: Snippet;
  } = $props();
</script>

<header
  class="header {cls}"
  style:--header-h={height}
  {style}
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
    position: sticky;
    top: 0;
    z-index: 5;
    /* 抵消滚动容器（Layout 内容卡片）的 padding，吸顶时贴满卡片内缘 */
    margin: calc(-1 * var(--layout-pad-y, 0px)) calc(-1 * var(--layout-pad-x, 0px)) 0;
    height: var(--header-h);
    background: color-mix(in srgb, var(--surface) 80%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 var(--layout-pad-x, 24px);
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

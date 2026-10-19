<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title = '',
    height = '52px',
    id = '',
    sticky = true,
    class: cls = '',
    style = '',
    left,
    center,
    right,
    children,
  }: {
    title?: string;
    height?: string;
    /** 元素 id，可配合 <a href> 定位 */
    id?: string;
    /** 滚动时吸顶，默认 true；放在弹层等不需要吸顶的场景可关掉 */
    sticky?: boolean;
    class?: string;
    style?: string;
    left?: Snippet;
    center?: Snippet;
    right?: Snippet;
    children?: Snippet;
  } = $props();
</script>

<!-- 不吸顶时由 .no-sticky 把 position 换成 relative 并让 z-index 归零，避免一条静态 header 压在别的内容之上 -->
<header
  class="header {cls}"
  class:no-sticky={!sticky}
  {id}
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
    /* 抵消滚动容器（Layout 内容卡片）的 padding，吸顶时贴满卡片内缘。
       这两个变量在 Layout 上定义；放进列表、弹层等没有该变量的容器时
       回落到 0（而不是让整条 margin/padding 失效），Header 才能被复用。 */
    margin: calc(-1 * var(--layout-pad-y, 0px)) calc(-1 * var(--layout-pad-x, 0px)) 0;
    height: var(--header-h);
    background: color-mix(in srgb, var(--surface) 80%, transparent);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 var(--layout-pad-x, 0px);
  }

  /* 不吸顶：取消 sticky 后 z-index 也归零，否则它仍会盖在后续内容之上 */
  .header.no-sticky { position: relative; z-index: 0; }

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

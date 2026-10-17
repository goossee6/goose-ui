<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import PillTrack from "./PillTrack.svelte";

  let {
    rows = [],
    emptyText = "暂无数据",
    children,
    bindContainer,
    rowKey,
    class: cls = '',
    style = '',
  }: {
    rows?: T[];
    emptyText?: string;
    children: Snippet<[T]>;
    bindContainer?: (el: HTMLElement | null) => void;
    rowKey?: (row: T, index: number) => string | number;
    class?: string;
    style?: string;
  } = $props();

  let listEl: HTMLElement | null = $state(null);

  $effect(() => {
    bindContainer?.(listEl);
  });

  /* PillTrack 不带容器时不会量任何东西，等到列表真的挂上再启用，
     免得每行都白白评估一次 itemSelector。 */
  const pillSelector = $derived(listEl ? '.list-row' : '');
</script>

<div class="list-container {cls}" style={style} bind:this={listEl}>
  {#if rows.length === 0}
    <div class="placeholder">{emptyText}</div>
  {:else}
    <!-- hover 底色由 pill 绘制（跨行滑动的圆角带），故行本身不再变色。
         容器就是列表自身：clientWidth 已扣掉滚动条，pill 才能与行等宽。 -->
    <PillTrack
      container={listEl}
      itemSelector={pillSelector}
      activeSelector=""
      disabledMatch=""
      showSelected={false}
      background=""
      hoverBackground="var(--surface-3)"
      radius="var(--radius-md)"
    />
    {#each rows as row, i (rowKey ? rowKey(row, i) : i)}
      <div class="list-row">
        {@render children(row)}
      </div>
    {/each}
  {/if}
</div>

<style>
  /* 测量容器 + absolute pill 的定位上下文，两者都落在列表本身 */
  .list-container { position: relative; width: 100%; height: 100%; overflow: auto; }
  .placeholder { padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px; }
  /* z-index 只用于压住 pill 之上的内容层，容器本身不设 z-index，pill 才能照常显示 */
  .list-row { position: relative; z-index: 0; padding: var(--sp-lg) 24px; border-bottom: 1px solid var(--border); }
  .list-row:last-child { border-bottom: none; }
</style>

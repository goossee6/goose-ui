<script lang="ts" generics="T">
  import type { Snippet } from "svelte";

  let {
    rows,
    emptyText = "暂无数据",
    children,
    bindContainer,
  }: {
    rows: T[];
    emptyText?: string;
    children: Snippet<[T]>;
    bindContainer?: (el: HTMLElement | null) => void;
  } = $props();

  let listEl: HTMLElement | null = $state(null);

  $effect(() => {
    bindContainer?.(listEl);
  });
</script>

<div class="list-container" bind:this={listEl}>
  {#if rows.length === 0}
    <div class="placeholder">{emptyText}</div>
  {:else}
    {#each rows as row, i (i)}
      <div class="list-row">
        {@render children(row)}
      </div>
    {/each}
  {/if}
</div>

<style>
  .list-container { width: 100%; height: 100%; overflow: auto; }
  .placeholder { padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px; }
  .list-row { padding: var(--sp-xl) var(--sp-2xl); border-bottom: 1px solid var(--border); transition: background-color 0.15s; }
  .list-row:hover { background-color: var(--surface-3); }
</style>

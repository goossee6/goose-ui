<script lang="ts">
  import { iconPaths } from "../icons.ts";

  const WIN_CTRL_ICONS = new Set(["minimize", "maximize", "restore", "close-window"]);

  let {
    name,
    class: cls = "",
    size = 20,
  }: {
    name: string;
    class?: string;
    size?: number;
  } = $props();

  const isWinCtrl = $derived(WIN_CTRL_ICONS.has(name));
  const path = $derived(iconPaths[name] ?? "");
  const vb = $derived(isWinCtrl ? "0 0 11 11" : "0 0 24 24");
  const sw = $derived(isWinCtrl ? "1.5" : "2");
</script>

{#if path}
  <svg class={cls} width={size} height={size} xmlns="http://www.w3.org/2000/svg" viewBox={vb} fill="none" stroke="currentColor" stroke-width={sw} stroke-linecap="round" stroke-linejoin="round">
    {@html path}
  </svg>
{/if}

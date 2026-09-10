<script lang="ts">
  import { onDestroy } from "svelte";
  import { backOut } from "svelte/easing";
  import { toastStore, type ToastItem as ToastItemType } from "../toast";
  import ToastItem from "./ToastItem.svelte";

  let toasts: ToastItemType[] = $state([]);

  const unsub = toastStore.subscribe((list) => {
    toasts = list;
  });

  onDestroy(() => {
    unsub();
  });

  function toastIn(_node: Element, { duration = 350 }: { duration?: number } = {}) {
    return {
      duration,
      easing: backOut,
      css: (t: number, u: number) => `opacity: ${t}; transform: translateY(${u * 16}px);`,
    };
  }

  function toastOut(_node: Element, { duration = 150 }: { duration?: number } = {}) {
    return {
      duration,
      css: (t: number) => `opacity: ${t}; transform: translateY(${(1 - t) * 12}px);`,
    };
  }
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div in:toastIn out:toastOut>
      <ToastItem {toast} />
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--gap-md);
    pointer-events: none;
  }

  .toast-container > div {
    will-change: transform, opacity;
  }
</style>

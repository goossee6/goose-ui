<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { toastStore, type ToastItem as ToastItemType } from "../toast";
  import Icon from "./Icon.svelte";

  let { toast }: { toast: ToastItemType } = $props();

  let timer: ReturnType<typeof setTimeout>;

  onMount(() => {
    timer = setTimeout(() => toastStore.remove(toast.id), 5000);
  });

  onDestroy(() => {
    clearTimeout(timer);
  });
</script>

<div class="toast toast-{toast.type}" role="status" aria-live="polite">
  {#if toast.type === "success"}
    <Icon class="toast-icon" name="check-circle" size={18} />
  {:else}
    <Icon class="toast-icon" name="x-circle" size={18} />
  {/if}
  <span>{toast.message}</span>
</div>

<style>
  .toast {
    padding: var(--sp-xl) var(--sp-3xl);
    border-radius: var(--radius-xl);
    font-size: 13px;
    font-weight: 500;
    max-width: 360px;
    word-break: break-word;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    display: flex;
    align-items: center;
    gap: var(--gap-md);
  }

  :global(.toast-icon) { width: 18px; height: 18px; flex-shrink: 0; }
  :global(.toast-icon.success) { color: var(--success-text); }
  :global(.toast-icon.error) { color: var(--danger-text); }
  .toast-success { background-color: var(--surface); color: var(--text-strong); }
  .toast-error { background-color: var(--surface); color: var(--text-strong); }
</style>

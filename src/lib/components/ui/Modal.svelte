<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import type { Snippet } from "svelte";

  let {
    open = $bindable(false),
    title,
    width = 520,
    maskClosable = true,
    disableClose = false,
    typewriter = true,
    onClose,
    onOk,
    class: cls = "",
    children,
    footer,
  }: {
    open?: boolean;
    title?: string | Snippet;
    width?: number | string;
    maskClosable?: boolean;
    disableClose?: boolean;
    typewriter?: boolean;
    onClose?: () => void;
    onOk?: () => void;
    class?: string;
    children?: Snippet;
    footer?: Snippet;
  } = $props();

  function doClose() {
    onClose?.();
    open = false;
  }

  function handleOk() {
    onOk?.();
    doClose();
  }

  function handleMaskClick() {
    if (disableClose) return;
    if (maskClosable) doClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open || disableClose) return;
    if (e.key === "Escape") doClose();
  }

  function handleModalKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") e.preventDefault();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    class="modal-overlay"
    role="presentation"
    onclick={handleMaskClick}
    onkeydown={(e) => { if (e.key === "Escape") doClose(); }}
    transition:fade={{ duration: 150 }}
  >
    <div
      class="modal {cls}"
      style="width: {typeof width === 'number' ? `${width}px` : width}"
      role="dialog"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={handleModalKeydown}
      transition:scale={{ duration: 180, start: 0.95 }}
    >
      {#if title}
        <div class="modal-header">
          {#if typeof title === "string"}{title}{:else}{@render title()}{/if}
        </div>
      {/if}
      <div class="modal-body">
        {@render children?.()}
      </div>
      {#if footer}
        <div class="modal-footer">{@render footer()}</div>
      {:else}
        <div class="modal-footer">
          <button class="modal-btn modal-btn-cancel" onclick={doClose}>取消</button>
          <button class="modal-btn modal-btn-ok" onclick={handleOk}>确定</button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--overlay);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal {
    background-color: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-2xl);
    max-height: 90vh;
    overflow-y: auto;
    overscroll-behavior: contain;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  .modal-header {
    padding: var(--sp-3xl) var(--sp-4xl);
    font-size: 18px;
    font-weight: 600;
    color: var(--text-strong);
    border-bottom: 1px solid var(--border-strong);
  }
  .modal-body {
    padding: var(--sp-3xl) var(--sp-4xl);
    min-width: 0;
    overflow: hidden;
  }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--gap-xl);
    padding: 0 var(--sp-4xl) var(--sp-3xl);
  }
  .modal-btn {
    padding: var(--sp-md) var(--sp-2xl);
    border-radius: var(--radius-lg);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--border-strong);
    transition: background-color 0.2s, border-color 0.2s;
  }
  .modal-btn-cancel {
    background-color: transparent;
    color: var(--text-muted);
  }
  .modal-btn-cancel:hover { background-color: var(--surface-2); color: var(--text-strong); }
  .modal-btn-ok {
    background-color: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
  }
  .modal-btn-ok:hover { background-color: var(--primary-hover); }
</style>

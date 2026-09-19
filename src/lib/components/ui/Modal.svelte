<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { untrack } from "svelte";
  import type { Snippet } from "svelte";
  import X from '@lucide/svelte/icons/x';
  import Icon from './Icon.svelte';

  let {
    open = $bindable(false),
    title,
    width = 520,
    maskClosable = false,
    mask: maskProp = 'dark',
    disableClose = false,
    typewriter = true,
    typewriterDuration = 1500,
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
    mask?: 'dark' | 'light';
    disableClose?: boolean;
    typewriter?: boolean;
    typewriterDuration?: number;
    onClose?: () => void;
    onOk?: () => void;
    class?: string;
    children?: Snippet;
    footer?: Snippet;
  } = $props();

  let bodyEl: HTMLDivElement | null = $state(null);
  let twHtml = $state('');
  let fullHtml = '';
  let twIndex = 0;
  let twTimer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    const shouldType = open && typewriter;
    untrack(() => {
      if (shouldType) {
        setTimeout(() => startTypewriter(), 0);
      }
    });
    return () => {
      if (twTimer) { clearTimeout(twTimer); twTimer = null; }
    };
  });

  function startTypewriter() {
    if (!bodyEl) return;
    const el = bodyEl.querySelector('.tw-source');
    if (!el) return;
    fullHtml = el.innerHTML;
    twHtml = '';
    twIndex = 0;
    const dur = typewriterDuration;
    const html = fullHtml;

    let totalSteps = 0;
    { let i = 0; while (i < html.length) { totalSteps++; if (html[i] === '<') { const end = html.indexOf('>', i); i = end === -1 ? html.length : end + 1; } else { i++; } } }
    if (totalSteps === 0) totalSteps = 1;

    const delay = Math.max(5, dur / totalSteps);
    function tick() {
      if (twIndex < html.length) {
        const ch = html[twIndex];
        if (ch === '<') {
          const end = html.indexOf('>', twIndex);
          twIndex = end === -1 ? html.length : end + 1;
        } else {
          twIndex++;
        }
        twHtml = html.slice(0, twIndex);
        twTimer = setTimeout(tick, delay);
      }
    }
    tick();
  }

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
    if (e.key === "Escape" && !disableClose) doClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    class="modal-overlay{maskProp === 'light' ? ' modal-overlay-light' : ''}"
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
      transition:scale={{ duration: 180, start: 0.92 }}
    >
      {#if title}
        <div class="modal-header">
          <span class="modal-title">
            {#if typeof title === "string"}{@html title}{:else}{@render title()}{/if}
          </span>
          {#if !disableClose}
            <button class="modal-close" onclick={doClose} aria-label="关闭">
              <Icon icon={X} size={14} />
            </button>
          {/if}
        </div>
      {/if}
      <div class="modal-body" bind:this={bodyEl}>
        {#if typewriter}
          <div class="tw-source" style="display:none">{@render children?.()}</div>
          <div class="tw-output">{@html twHtml}</div>
        {:else}
          {@render children?.()}
        {/if}
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
  .modal-overlay-light {
    background-color: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(2px);
  }
  .modal {
    background-color: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-2xl);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overscroll-behavior: contain;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  .modal-no-mask {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    background-color: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-2xl);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overscroll-behavior: contain;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--sp-xl) var(--sp-4xl);
    font-size: 18px;
    font-weight: 600;
    color: var(--text-strong);
    border-bottom: 1px solid var(--border-strong);
    flex-shrink: 0;
  }
  .modal-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .modal-close {
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
  .modal-close:hover {
    background-color: var(--surface-2);
    color: var(--text-strong);
  }
  .modal-body {
    padding: var(--sp-3xl) var(--sp-4xl);
    min-width: 0;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  .tw-output {
    white-space: pre-wrap;
    line-height: 1.6;
  }
  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--gap-xl);
    padding: var(--sp-xl) var(--sp-4xl);
    flex-shrink: 0;
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
    color: var(--primary-text, #ffffff);
    border-color: var(--primary);
  }
  .modal-btn-ok:hover { background-color: var(--primary-hover); }
</style>

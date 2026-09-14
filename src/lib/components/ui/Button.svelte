<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Component } from "svelte";
  import Loader2 from "@lucide/svelte/icons/loader-2";
  import { onDestroy } from "svelte";

  const MIN_LOADING_MS = 1000;

  let {
    variant = "default",
    size = "md",
    disabled = false,
    loading = false,
    type = "button",
    class: cls = "",
    icon,
    iconRight,
    iconSize = 16,
    children,
    onclick,
    ...rest
  }: {
    variant?: "primary" | "default" | "ghost" | "danger" | "link";
    size?: "sm" | "md" | "lg" | "xs" | "icon" | "icon-sm" | "icon-xs" | "icon-lg";
    disabled?: boolean;
    loading?: boolean;
    type?: "button" | "submit";
    class?: string;
    icon?: Component;
    iconRight?: Component;
    iconSize?: number;
    children?: Snippet;
    onclick?: (event: MouseEvent) => void;
    [key: string]: unknown;
  } = $props();

  let displayLoading = $state(false);
  let loadingStart = 0;
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

  function clearPending() {
    if (pendingTimeout) { clearTimeout(pendingTimeout); pendingTimeout = null; }
  }

  $effect(() => {
    if (loading) {
      loadingStart = Date.now();
      displayLoading = true;
      clearPending();
    } else if (displayLoading) {
      const remaining = MIN_LOADING_MS - (Date.now() - loadingStart);
      if (remaining > 0) {
        pendingTimeout = setTimeout(() => { displayLoading = false; pendingTimeout = null; }, remaining);
      } else {
        displayLoading = false;
      }
    }
  });

  onDestroy(clearPending);
</script>

<button {type} disabled={disabled || loading} class="btn btn-{variant} btn-{size} {cls}" {onclick} {...rest}>
  {#if displayLoading}
    <span class="btn-spinner" style="width:{iconSize}px;height:{iconSize}px">
      <Loader2 size={iconSize} />
    </span>
  {:else if icon}
    {@const Icon = icon}
    <span class="btn-icon-wrap" style="width:{iconSize}px;height:{iconSize}px">
      <Icon size={iconSize} />
    </span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
  {#if !displayLoading && iconRight}
    {@const IconRight = iconRight}
    <span class="btn-icon-wrap" style="width:{iconSize}px;height:{iconSize}px">
      <IconRight size={iconSize} />
    </span>
  {/if}
</button>

<style>
  .btn {
    border: 1px solid transparent;
    border-radius: var(--radius-lg);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s, opacity 0.2s, color 0.2s;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--gap-sm);
    outline: none;
    user-select: none;
  }
  .btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
  .btn-icon-wrap { display: inline-flex; flex-shrink: 0; }
  .btn-icon-wrap :global(svg) { width: 100%; height: 100%; }
  .btn-spinner { display: inline-flex; flex-shrink: 0; animation: btn-spin 0.8s linear infinite; }
  @keyframes btn-spin { to { transform: rotate(360deg); } }
  /* sizes */
  .btn-xs { height: 24px; padding: 0 8px; font-size: 12px; border-radius: min(var(--radius-md), 10px); }
  .btn-sm { height: 32px; padding: 0 10px; font-size: 13px; }
  .btn-md { height: 32px; padding: 0 12px; font-size: 13px; }
  .btn-lg { height: 36px; padding: 0 12px; font-size: 14px; }
  .btn-icon { width: 32px; height: 32px; padding: 0; }
  .btn-icon-sm { width: 28px; height: 28px; padding: 0; border-radius: min(var(--radius-md), 12px); }
  .btn-icon-xs { width: 24px; height: 24px; padding: 0; border-radius: min(var(--radius-md), 10px); }
  .btn-icon-lg { width: 36px; height: 36px; padding: 0; }
  /* variants */
  .btn-primary { background-color: var(--primary); color: #ffffff; }
  .btn-primary:hover:not(:disabled) { background-color: var(--primary-hover); }
  .btn-default { background-color: var(--secondary); color: var(--secondary-text); border: 1px solid var(--border-strong); }
  .btn-default:hover:not(:disabled) { background-color: var(--hover); border-color: var(--primary); }
  .btn-ghost { background-color: transparent; color: var(--text-muted); }
  .btn-ghost:hover:not(:disabled) { background-color: var(--surface-2); color: var(--text-strong); }
  .btn-danger { background-color: var(--danger-soft); color: var(--danger-text); border: 1px solid var(--danger-border); }
  .btn-danger:hover:not(:disabled) { background-color: var(--danger-border); border-color: var(--danger-text); }
  .btn-link { background-color: transparent; color: var(--primary); text-decoration: underline; text-underline-offset: 4px; }
  .btn-link:hover:not(:disabled) { text-decoration: none; }
</style>

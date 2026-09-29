<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Component } from "svelte";
  import Loader2 from "@lucide/svelte/icons/loader-2";
  import { onDestroy } from "svelte";

  const MIN_LOADING_MS = 1000;

  let {
    variant = "default",
    size = "middle",
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
    /** 枚举档位；number 时为任意高度（紧凑按钮） */
    size?: "small" | "middle" | "large" | "icon" | "icon-sm" | "icon-xs" | "icon-lg" | number;
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

  const sizeClass = $derived(typeof size === "string" ? `btn-${size}` : "");
  const sizeStyle = $derived(typeof size === "number" ? `height:${size}px;font-size:${Math.round(size * 0.375)}px;padding:0 ${Math.round(size * 0.35)}px;` : "");

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

<button {type} disabled={disabled || loading} class="btn btn-{variant} {sizeClass} {cls}" style={sizeStyle} {onclick} {...rest}>
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
    height: var(--ui-md-height, 36px);
    padding: var(--ui-md-padding, 0 12px);
    font-size: var(--ui-md-font, 14px);
  }
  .btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
  .btn-icon-wrap { display: inline-flex; flex-shrink: 0; }
  .btn-icon-wrap :global(svg) { width: 100%; height: 100%; }
  .btn-spinner { display: inline-flex; flex-shrink: 0; animation: btn-spin 0.8s linear infinite; }
  @keyframes btn-spin { to { transform: rotate(360deg); } }
  /* sizes */
  .btn-small { height: var(--ui-sm-height); padding: var(--ui-sm-padding); font-size: var(--ui-sm-font); }
  .btn-middle { height: var(--ui-md-height); padding: var(--ui-md-padding); font-size: var(--ui-md-font); }
  .btn-large { height: var(--ui-lg-height); padding: var(--ui-lg-padding); font-size: var(--ui-lg-font); }
  .btn-icon { width: var(--ui-md-height); height: var(--ui-md-height); padding: 0; }
  .btn-icon-sm { width: var(--ui-sm-height); height: var(--ui-sm-height); padding: 0; border-radius: min(var(--radius-md), 12px); }
  .btn-icon-xs { width: 24px; height: 24px; padding: 0; border-radius: min(var(--radius-md), 10px); }
  .btn-icon-lg { width: var(--ui-lg-height); height: var(--ui-lg-height); padding: 0; }
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

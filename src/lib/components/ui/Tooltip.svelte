<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    title,
    placement: placementProp = "top",
    trigger = "hover",
    maxWidth,
    children,
    class: cls = '',
    style = '',
  }: {
    title: string | Snippet;
    placement?: "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end";
    trigger?: "hover" | "focus" | "click";
    maxWidth?: number | string;
    children: Snippet;
    class?: string;
    style?: string;
  } = $props();

  let triggerEl = $state<HTMLElement | null>(null);
  let tooltipEl = $state<HTMLElement | null>(null);
  let visible = $state(false);
  let pos = $state({ left: 0, top: 0 });
  let finalPlacement = $state(placementProp);
  let animState = $state<"hidden" | "entering" | "visible" | "leaving">("hidden");

  const GAP = 8;

  const flipMap: Record<string, string> = {
    top: "bottom", "top-start": "bottom-start", "top-end": "bottom-end",
    bottom: "top", "bottom-start": "top-start", "bottom-end": "top-end",
    left: "right", "left-start": "right-start", "left-end": "right-end",
    right: "left", "right-start": "left-start", "right-end": "left-end",
  };

  let hoverTimer: ReturnType<typeof setTimeout> | null = null;
  let leaveTimer: ReturnType<typeof setTimeout> | null = null;

  function clearTimers() {
    if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
    if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
  }

  function show() {
    clearTimers();
    hoverTimer = setTimeout(() => {
      visible = true;
      animState = "entering";
      requestAnimationFrame(() => {
        calculatePosition();
        animState = "visible";
      });
    }, 50);
  }

  function hide() {
    clearTimers();
    leaveTimer = setTimeout(() => {
      animState = "leaving";
      setTimeout(() => {
        visible = false;
        animState = "hidden";
      }, 80);
    }, 100);
  }

  function toggle() {
    if (visible) { hide(); } else { show(); }
  }

  function calculatePosition() {
    if (!triggerEl || !tooltipEl) return;

    const triggerRect = triggerEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const tw = tooltipRect.width;
    const th = tooltipRect.height;

    let placement = placementProp;

    const spaceAbove = triggerRect.top;
    const spaceBelow = vh - triggerRect.bottom;
    const spaceLeft = triggerRect.left;
    const spaceRight = vw - triggerRect.right;

    const base = placement.split("-")[0] as string;

    if (base === "top" && spaceAbove < th + GAP && spaceBelow > spaceAbove) {
      placement = flipMap[placement] as typeof placement;
    } else if (base === "bottom" && spaceBelow < th + GAP && spaceAbove > spaceBelow) {
      placement = flipMap[placement] as typeof placement;
    } else if (base === "left" && spaceLeft < tw + GAP && spaceRight > spaceLeft) {
      placement = flipMap[placement] as typeof placement;
    } else if (base === "right" && spaceRight < tw + GAP && spaceLeft > spaceRight) {
      placement = flipMap[placement] as typeof placement;
    }

    finalPlacement = placement;

    let left = 0;
    let top = 0;
    const p = placement;

    if (p === "top" || p === "top-start" || p === "top-end") {
      top = triggerRect.top - th - GAP;
      if (p === "top") left = triggerRect.left + triggerRect.width / 2 - tw / 2;
      else if (p === "top-start") left = triggerRect.left;
      else left = triggerRect.right - tw;
    } else if (p === "bottom" || p === "bottom-start" || p === "bottom-end") {
      top = triggerRect.bottom + GAP;
      if (p === "bottom") left = triggerRect.left + triggerRect.width / 2 - tw / 2;
      else if (p === "bottom-start") left = triggerRect.left;
      else left = triggerRect.right - tw;
    } else if (p === "left" || p === "left-start" || p === "left-end") {
      left = triggerRect.left - tw - GAP;
      if (p === "left") top = triggerRect.top + triggerRect.height / 2 - th / 2;
      else if (p === "left-start") top = triggerRect.top;
      else top = triggerRect.bottom - th;
    } else if (p === "right" || p === "right-start" || p === "right-end") {
      left = triggerRect.right + GAP;
      if (p === "right") top = triggerRect.top + triggerRect.height / 2 - th / 2;
      else if (p === "right-start") top = triggerRect.top;
      else top = triggerRect.bottom - th;
    }

    left = Math.max(8, Math.min(left, vw - tw - 8));
    top = Math.max(8, Math.min(top, vh - th - 8));

    pos = { left, top };
  }

  function onTriggerMouseEnter() { if (trigger === "hover") show(); }
  function onTriggerMouseLeave() { if (trigger === "hover") hide(); }
  function onTriggerFocusIn() { if (trigger === "focus") show(); }
  function onTriggerFocusOut() { if (trigger === "focus") hide(); }
  function onTriggerClick(e: MouseEvent) {
    if (trigger === "click") { e.stopPropagation(); toggle(); }
  }

  function onDocClick() { if (trigger === "click" && visible) hide(); }
  function onKeydown(e: KeyboardEvent) { if (e.key === "Escape" && visible) hide(); }

  $effect(() => {
    if (!visible) return;
    const onScroll = () => calculatePosition();
    const onResize = () => calculatePosition();
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("click", onDocClick);
    window.addEventListener("keydown", onKeydown);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true } as any);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("click", onDocClick);
      window.removeEventListener("keydown", onKeydown);
    };
  });

  $effect(() => () => clearTimers());

  function getTooltipStyle(): string {
    if (animState === "hidden") return "display:none";
    const entering = animState === "entering";
    const opacity = entering ? 0 : 1;
    const scale = entering ? 0.92 : 1;
    let tx = 0;
    let ty = 0;
    if (entering) {
      if (finalPlacement.startsWith("top")) ty = 4;
      else if (finalPlacement.startsWith("bottom")) ty = -4;
      else if (finalPlacement.startsWith("left")) tx = 4;
      else if (finalPlacement.startsWith("right")) tx = -4;
    }
    const mw = maxWidth != null ? `max-width:${typeof maxWidth === "number" ? maxWidth + "px" : maxWidth};` : "";
    return `left:${pos.left}px;top:${pos.top}px;opacity:${opacity};transform:translate(${tx}px,${ty}px) scale(${scale});${mw}`;
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="tooltip-trigger {cls}"
  style={style}
  bind:this={triggerEl}
  onmouseenter={onTriggerMouseEnter}
  onmouseleave={onTriggerMouseLeave}
  onfocusin={onTriggerFocusIn}
  onfocusout={onTriggerFocusOut}
  onclick={onTriggerClick}
>
  {@render children()}
</div>

{#if animState !== "hidden"}
  <div
    class="tooltip tooltip-{finalPlacement}"
    bind:this={tooltipEl}
    role="tooltip"
    style={getTooltipStyle()}
  >
    <div class="tooltip-content">
      {#if typeof title === "string"}{title}{:else}{@render title()}{/if}
    </div>
    <div class="tooltip-arrow"></div>
  </div>
{/if}

<style>
  .tooltip-trigger { display: inline-flex; }

  .tooltip {
    position: fixed;
    z-index: 3000;
    pointer-events: none;
    transition: opacity 0.12s ease, transform 0.12s ease;
    max-width: 280px;
    word-wrap: break-word;
  }

  .tooltip-content {
    padding: 8px 12px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--text, #1d2129);
    background-color: var(--surface, #fff);
    border: 1px solid var(--border, #e5e6eb);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    white-space: pre-wrap;
  }

  .tooltip-arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: var(--surface, #fff);
    border: 1px solid var(--border, #e5e6eb);
    transform: rotate(45deg);
  }

  .tooltip-top .tooltip-arrow,
  .tooltip-top-start .tooltip-arrow,
  .tooltip-top-end .tooltip-arrow {
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-top: none;
    border-left: none;
  }
  .tooltip-top-start .tooltip-arrow { left: 14px; }
  .tooltip-top-end .tooltip-arrow { left: auto; right: 14px; }

  .tooltip-bottom .tooltip-arrow,
  .tooltip-bottom-start .tooltip-arrow,
  .tooltip-bottom-end .tooltip-arrow {
    top: -5px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    border-bottom: none;
    border-right: none;
  }
  .tooltip-bottom-start .tooltip-arrow { left: 14px; }
  .tooltip-bottom-end .tooltip-arrow { left: auto; right: 14px; }

  .tooltip-left .tooltip-arrow,
  .tooltip-left-start .tooltip-arrow,
  .tooltip-left-end .tooltip-arrow {
    right: -5px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-bottom: none;
    border-left: none;
  }
  .tooltip-left-start .tooltip-arrow { top: 14px; }
  .tooltip-left-end .tooltip-arrow { top: auto; bottom: 14px; }

  .tooltip-right .tooltip-arrow,
  .tooltip-right-start .tooltip-arrow,
  .tooltip-right-end .tooltip-arrow {
    left: -5px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    border-top: none;
    border-right: none;
  }
  .tooltip-right-start .tooltip-arrow { top: 14px; }
  .tooltip-right-end .tooltip-arrow { top: auto; bottom: 14px; }

  :global(.dark) .tooltip-content { background-color: var(--surface-2, #2a2a2a); color: var(--text, #e5e6eb); border-color: var(--border-strong, #444); }
  :global(.dark) .tooltip-arrow { background-color: var(--surface-2, #2a2a2a); border-color: var(--border-strong, #444); }
</style>

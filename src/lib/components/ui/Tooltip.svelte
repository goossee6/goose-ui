<script lang="ts">
  import { untrack } from "svelte";
  import type { Snippet } from "svelte";

  /**
   * 气泡提示。
   *
   * 定位策略与 Popover / DropdownMenu 一致：气泡 `position: fixed` + 视口坐标，
   * 并 portal 到 body —— 只要它还留在带 `backdrop-filter` / `transform` /
   * `filter` 的祖先里，那个祖先就是 fixed 的包含块，left/top 会被解释成
   * 「相对该祖先」，气泡整体偏移；同时 Modal / Drawer / 列表的 `overflow`
   * 还会把它裁掉。DataList 的表头有 backdrop-filter、行有进场动画、
   * 弹窗有滚动容器，三种坑都真实存在。
   *
   * 触发器是一个 `span`（inline-flex），不是 `div`：提示最常见的宿主是
   * 按钮内部的图标（DropdownMenu 的触发器就是 `<button>`），`div` 在
   * `<button>` / `<p>` 里是非法嵌套，浏览器会擅自改写 DOM。
   */

  let {
    title,
    placement: placementProp = "top",
    trigger = "hover",
    delay = 200,
    maxWidth,
    children,
    class: cls = '',
    style = '',
  }: {
    title: string | Snippet;
    placement?: "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end";
    trigger?: "hover" | "focus" | "click";
    /** hover/focus 的悬停延迟（ms），默认 200。
     *  别调得太小：列表里每行可能挂好几个提示，鼠标纵向扫过时 50ms
     *  就弹一大片气泡，比原生 title 还吵。 */
    delay?: number;
    maxWidth?: number | string;
    children: Snippet;
    class?: string;
    style?: string;
  } = $props();

  let triggerEl = $state<HTMLElement | null>(null);
  let tooltipEl = $state<HTMLElement | null>(null);
  let visible = $state(false);
  let pos = $state({ left: 0, top: 0 });
  // 起始方位取 placement 的首次值；之后由 calculatePosition 的翻转逻辑改写
  let finalPlacement = $state(untrack(() => placementProp));
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
    }, delay);
  }

  function hide() {
    clearTimers();
    leaveTimer = setTimeout(() => {
      animState = "leaving";
      // 存入 leaveTimer：可被 clearTimers 清除，避免卸载/重新 show 后旧 timer 误关
      leaveTimer = setTimeout(() => {
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
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 量 offsetWidth/offsetHeight，不用 getBoundingClientRect：
    // 进场动画期间气泡还带着 scale(0.92)，rect 拿到的是缩小后的尺寸，
    // 于是「按真实宽度居中」会算成偏右一截（ContextMenu 踩过同一个坑）。
    const tw = tooltipEl.offsetWidth;
    const th = tooltipEl.offsetHeight;

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
    if (trigger === "click") { e.stopPropagation(); toggle(); return; }
    // 点下去就说明已经知道它是什么了，提示先收掉——否则打开下拉菜单后
    // 气泡还压在新弹出的菜单上。不 stopPropagation：点击要继续冒泡给真正的按钮。
    if (visible) hide();
  }

  function onDocClick() { if (trigger === "click" && visible) hide(); }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && visible) {
      // capture 拦截：只关 tooltip，不冒泡触发外层 Modal 的 Esc
      e.stopPropagation();
      hide();
    }
  }

  /**
   * 气泡挂到 body。挂在触发器旁边时，`position: fixed` 会被祖先的
   * backdrop-filter / transform 变成「相对祖先」定位（见文件头说明）。
   */
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  $effect(() => {
    if (!visible) return;
    const onScroll = () => calculatePosition();
    const onResize = () => calculatePosition();
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeydown, true);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true } as any);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeydown, true);
    };
  });

  $effect(() => () => clearTimers());

  function prefersReducedMotion(): boolean {
    return typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  }

  function getTooltipStyle(): string {
    if (animState === "hidden") return "display:none";
    const entering = animState === "entering" && !prefersReducedMotion();
    const opacity = animState === "entering" ? 0 : 1;
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

<!-- 触发器只能包一层元素，不能强行改成 button（会多出一个按钮、也会抢走
     子元素自己的点击语义）；click 模式下的键盘可达性由子元素自身承担。 -->
<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<span
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
</span>

{#if animState !== "hidden"}
  <div
    class="tooltip tooltip-{finalPlacement}"
    bind:this={tooltipEl}
    use:portal
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
    /* 比弹窗高一档：气泡常常长在 Modal / Drawer 里面，z-index 若与弹窗相同，
       先后顺序就取决于 DOM 插入时机，会出现「有时被遮住」。 */
    z-index: var(--z-max);
    pointer-events: none;
    transition: opacity 0.12s ease, transform 0.12s ease;
    max-width: 280px;
    word-wrap: break-word;
  }
  @media (prefers-reduced-motion: reduce) {
    .tooltip { transition: opacity 0.1s ease; }
  }

  .tooltip-content {
    padding: 6px 10px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--text);
    background-color: var(--popup-surface, var(--surface));
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md, 6px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
    white-space: pre-wrap;
  }

  .tooltip-arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: var(--popup-surface, var(--surface));
    border: 1px solid var(--border-strong);
    transform: rotate(45deg);
  }
  :global(.dark) .tooltip-content { color: var(--text); }

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
</style>

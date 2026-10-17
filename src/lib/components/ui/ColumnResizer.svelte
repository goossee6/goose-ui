<script lang="ts">
  /**
   * 列宽拖拽手柄：贴在 <th> 的右边缘（或左边缘），拖动改列宽。
   *
   * 交互细节：
   *  - 用 Pointer Events + setPointerCapture，鼠标拖出手柄、甚至拖出窗口都不会中断；
   *  - 拖拽期间给 document.body 加 col-resize 光标与 user-select:none，
   *    避免拖动时框选文字、光标闪烁；
   *  - 双击 = 自适应内容宽度；键盘 ←/→ 每次微调 8px（可聚焦，够无障碍用）。
   *
   * 组件本身不持有列宽状态，只负责把「像素增量」报给父级。
   */
  import { onDestroy } from 'svelte';
  import { MIN_COL_PX } from '../colWidths.svelte';

  let {
    direction = 'right',
    label = '',
    disabled = false,
    onresize,
    onautofit,
    onend,
    valuePx = 0,
    maxPx = 4000,
  }: {
    /** 手柄在列宽的哪一侧：右侧手柄拖动时增大左列，左侧手柄增大右列 */
    direction?: 'right' | 'left';
    /** 无障碍标签，通常是「调整「窗口标题」列宽」 */
    label?: string;
    disabled?: boolean;
    /** 拖动中持续回调，dx 是相对拖拽起点的像素增量（向右为正） */
    onresize?: (dx: number) => void;
    /** 双击或键盘触发自适应 */
    onautofit?: () => void;
    /** 拖拽结束（含鼠标移出后释放），父级据此清理拖拽基准 */
    onend?: () => void;
    /** 当前列宽（px），仅用于无障碍朗读，不参与布局计算 */
    valuePx?: number;
    /** 列宽上限（px），仅用于无障碍朗读 */
    maxPx?: number;
  } = $props();

  /** 键盘微调的步长（px），Shift 加速 5 倍 */
  const NUDGE_PX = 8;

  let dragging = $state(false);
  let startX = 0;
  let capturedPointer: number | null = null;
  let handleEl: HTMLElement | undefined = $state();

  function beginDocState() {
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.style.setProperty('cursor', 'col-resize');
    body.style.setProperty('user-select', 'none');
  }

  function endDocState() {
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.style.removeProperty('cursor');
    body.style.removeProperty('user-select');
  }

  function onPointerDown(ev: PointerEvent) {
    if (disabled || ev.button !== 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    dragging = true;
    startX = ev.clientX;
    capturedPointer = ev.pointerId;
    // 捕获指针：后续 pointermove/up 都回投到本元素，移出手柄也不丢事件
    handleEl?.setPointerCapture?.(ev.pointerId);
    beginDocState();
  }

  function onPointerMove(ev: PointerEvent) {
    if (!dragging) return;
    ev.preventDefault();
    onresize?.(ev.clientX - startX);
  }

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    if (capturedPointer != null) {
      try {
        handleEl?.releasePointerCapture?.(capturedPointer);
      } catch {
        /* 元素已卸载或指针早已释放，忽略 */
      }
      capturedPointer = null;
    }
    endDocState();
    onend?.();
  }

  function onPointerUp() {
    endDrag();
  }

  function onDoubleClick(ev: MouseEvent) {
    if (disabled) return;
    ev.preventDefault();
    ev.stopPropagation();
    onautofit?.();
  }

  function onKeyDown(ev: KeyboardEvent) {
    if (disabled) return;
    const step = ev.shiftKey ? NUDGE_PX * 5 : NUDGE_PX;
    if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      onresize?.(step);
    } else if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      onresize?.(-step);
    } else if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      onautofit?.();
    }
  }

  // 组件卸载时若仍在拖拽，必须还原 body 样式，否则全局光标会卡在 col-resize
  onDestroy(() => {
    if (dragging) endDocState();
  });
</script>

<!-- role="slider" 而不是 separator：宽度调节在语义上就是可调节值的控件，
     而且 separator 在 Svelte 的 a11y 规则里不算可交互角色，加 tabindex 与
     键盘事件会被判为违规。slider 天然支持 aria-valuenow 与方向键微调。 -->
<div
  bind:this={handleEl}
  class="col-resizer col-resizer--{direction}"
  class:dragging
  class:disabled
  role="slider"
  aria-orientation="vertical"
  aria-label={label}
  aria-valuenow={disabled ? undefined : Math.round(valuePx)}
  aria-valuemin={MIN_COL_PX}
  aria-valuemax={Math.round(maxPx)}
  aria-valuetext={disabled ? undefined : `${Math.round(valuePx)} 像素`}
  aria-disabled={disabled}
  tabindex={disabled ? -1 : 0}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={endDrag}
  onlostpointercapture={endDrag}
  ondblclick={onDoubleClick}
  onkeydown={onKeyDown}
></div>

<style>
  /* 手柄做成整条表头高度、边界两侧各 5px 的判定区。
     视觉线常显（1px divider）：只在 hover 时才出现的线用户根本发现不了。 */
  .col-resizer {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 11px;
    cursor: col-resize;
    z-index: 2;
    user-select: none;
    touch-action: none;
    outline: none;
  }
  /* 用负偏移把判定区中心对齐到 th 边界，而不是靠 margin 挤压 */
  .col-resizer--right {
    right: -5px;
  }
  .col-resizer--left {
    left: -5px;
  }

  /* 视觉细线：默认可见，hover / 拖拽 / 聚焦时变强调色并加粗 */
  .col-resizer::after {
    content: '';
    position: absolute;
    top: 22%;
    bottom: 22%;
    left: 50%;
    width: 1px;
    margin-left: -0.5px;
    background-color: var(--border-strong);
    border-radius: 1px;
    transition:
      background-color 0.12s ease,
      width 0.12s ease;
  }
  .col-resizer:hover::after,
  .col-resizer:focus-visible::after,
  .col-resizer.dragging::after {
    background-color: var(--primary);
    width: 3px;
    margin-left: -1.5px;
  }
  .col-resizer.dragging::after {
    top: 0;
    bottom: 0;
  }
  .col-resizer:focus-visible {
    background-color: color-mix(in srgb, var(--primary) 18%, transparent);
  }
  .col-resizer.disabled {
    cursor: default;
    pointer-events: none;
  }
  .col-resizer.disabled::after {
    opacity: 0;
  }

  /* 触屏设备上判定区加宽，否则手指点不中 */
  @media (pointer: coarse) {
    .col-resizer { width: 20px; }
    .col-resizer--right { right: -10px; }
    .col-resizer--left { left: -10px; }
  }
</style>

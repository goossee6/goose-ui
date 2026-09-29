import { fly, type TransitionConfig } from 'svelte/transition';
import { cubicOut } from 'svelte/easing';
import { pageDirStore } from '../pageDirStore.svelte.js';

export const PAGE_TRANSITION_DURATION = 220;
export const PAGE_TRANSITION_Y = 24;

interface PinnedStyles {
  position: string;
  top: string;
  left: string;
  width: string;
  pointerEvents: string;
}

const pinned = new WeakMap<HTMLElement, PinnedStyles>();

/**
 * 离开期间把页面 pin 成 absolute（offsetTop/offsetLeft 为布局坐标，与
 * absolute 定位同一坐标系，不受滚动影响），让出文档流给新页面，
 * 避免过渡期两页堆叠导致高度翻倍/新页被顶到视口外。
 */
export function pinPage(node: HTMLElement): void {
  if (pinned.has(node)) return;
  if (!node.offsetParent) return;
  pinned.set(node, {
    position: node.style.position,
    top: node.style.top,
    left: node.style.left,
    width: node.style.width,
    pointerEvents: node.style.pointerEvents,
  });
  node.style.position = 'absolute';
  node.style.top = `${node.offsetTop}px`;
  node.style.left = `${node.offsetLeft}px`;
  node.style.width = `${node.offsetWidth}px`;
  node.style.pointerEvents = 'none';
}

export function unpinPage(node: HTMLElement): void {
  const saved = pinned.get(node);
  if (!saved) return;
  pinned.delete(node);
  node.style.position = saved.position;
  node.style.top = saved.top;
  node.style.left = saved.left;
  node.style.width = saved.width;
  node.style.pointerEvents = saved.pointerEvents;
}

/** 手动驱动用的过渡配置：方向随配置走，驱动器只负责播放 */
export interface DrivenTransitionConfig extends TransitionConfig {
  /** outro 方向：按 Svelte 语义从 t=1 反向播放到 t=0（离开）；缺省为 in（t: 0→1） */
  out?: boolean;
}

/** 进入：从上方（up）或下方（down）飞入；先 unpin（中断恢复安全） */
export function pageInConfig(node: HTMLElement): TransitionConfig {
  unpinPage(node);
  return fly(node, {
    duration: PAGE_TRANSITION_DURATION,
    easing: cubicOut,
    y: pageDirStore.dir === 'up' ? -PAGE_TRANSITION_Y : PAGE_TRANSITION_Y,
  });
}

/** 离开：向上切换时落向下方（down）反之；先 pin 防堆叠 */
export function pageOutConfig(node: HTMLElement): DrivenTransitionConfig {
  pinPage(node);
  return {
    ...fly(node, {
      duration: PAGE_TRANSITION_DURATION,
      easing: cubicOut,
      y: pageDirStore.dir === 'up' ? PAGE_TRANSITION_Y : -PAGE_TRANSITION_Y,
    }),
    out: true,
  };
}

export interface TransitionRun {
  /** 中断（会安全地忽略本次的 finished） */
  cancel(): void;
  /** 仅自然播放完成时 resolve；cancel 后保持 pending */
  readonly finished: Promise<void>;
}

function cssToKeyframe(cssText: string): Keyframe {
  const frame: Record<string, string> = {};
  for (const decl of cssText.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (prop) frame[prop] = val;
  }
  return frame;
}

function fallbackRun(duration: number, delay: number): TransitionRun {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const finished = new Promise<void>((resolve) => {
    if (duration <= 0) {
      resolve();
      return;
    }
    timer = setTimeout(resolve, duration + delay);
  });
  return {
    cancel: () => clearTimeout(timer),
    finished,
  };
}

/**
 * 手动驱动一个 Svelte TransitionConfig（keep-alive 模式用，与 Svelte 内部
 * 同为 WAAPI keyframe 采样，不写 inline 样式、不干扰 pin 的 position 系样式）。
 * config.out=true 时按 Svelte outro 语义反向播放（t: 1→0）。
 */
export function runTransition(node: HTMLElement, config: DrivenTransitionConfig): TransitionRun {
  const { duration = 0, delay = 0, easing = (t: number) => t, css, out = false } = config;

  if (!css || duration <= 0) return fallbackRun(duration, delay);

  const n = Math.max(1, Math.ceil((duration * 60) / 1000));
  const keyframes: Keyframe[] = [];
  for (let i = 0; i <= n; i++) {
    const t = out ? 1 - easing(i / n) : easing(i / n);
    keyframes.push(cssToKeyframe(css(t, 1 - t)));
  }

  let anim: Animation;
  try {
    anim = node.animate(keyframes, { duration, delay, fill: 'forwards' });
  } catch {
    return fallbackRun(duration, delay);
  }

  let resolve!: () => void;
  const finished = new Promise<void>((r) => {
    resolve = r;
  });

  anim.finished.then(
    () => {
      // 自然完成：释放 fill（fly 终点 = 元素自然状态，同帧释放无视觉差）
      anim.cancel();
      resolve();
    },
    () => {
      // cancel 触发的 AbortError：静默，finished 保持 pending
    }
  );

  return {
    cancel: () => anim.cancel(),
    finished,
  };
}

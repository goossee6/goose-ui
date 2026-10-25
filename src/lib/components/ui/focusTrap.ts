/**
 * 弹层（Modal / Drawer / AlertDialog）共用的焦点圈定工具。
 *
 * 为什么要单独一份：焦点陷阱的边界判断（元素被隐藏、焦点跑到面板外、面板里一个
 * 可聚焦元素都没有）容易各写各的、各漏一处，CSS 的 display:none 与 tabindex="-1"
 * 又必须一起考虑，抽出来只维护一处。
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** 容器内当前真正可聚焦的元素（排除被隐藏的） */
export function focusablesIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (n) => n.offsetParent !== null || n === document.activeElement
  );
}

/**
 * 把 Tab / Shift+Tab 圈在容器内循环。
 * 面板里没有可聚焦元素时（纯文本弹窗）把焦点收回到面板本身，避免焦点漏到背景页。
 */
export function trapTabKey(e: KeyboardEvent, container: HTMLElement | null): void {
  if (!container) return;
  const items = focusablesIn(container);
  if (!items.length) {
    e.preventDefault();
    container.focus();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement as HTMLElement | null;
  const outside = !active || !container.contains(active) || active === container;
  if (e.shiftKey) {
    if (outside || active === first) {
      e.preventDefault();
      last.focus();
    }
  } else if (outside || active === last) {
    e.preventDefault();
    first.focus();
  }
}

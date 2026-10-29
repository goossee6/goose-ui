import { writable } from 'svelte/store';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  /** 明细块的标题；空串表示不显示明细块 */
  detailLabel: string;
  /** 明细正文（等宽、可滚动、可选中）；空串表示不显示明细块 */
  detail: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  resolve: ((value: boolean) => void) | null;
}

/** 关掉浮层时要恢复的初始态。集中一份，避免 confirm / cancel 各自漂移。 */
const IDLE: ConfirmState = {
  open: false,
  title: '确认',
  message: '',
  detailLabel: '',
  detail: '',
  confirmText: '确定',
  cancelText: '取消',
  danger: false,
  resolve: null,
};

function createConfirmStore() {
  const { subscribe, set } = writable<ConfirmState>({ ...IDLE });

  /**
   * 弹一个确认框，返回用户的选择。
   *
   * `detail` 是给「一次要动很多对象」的场景准备的：把清单正文塞进 `message`
   * 会让首句被清单淹没（实测 58 个 PID 直接撑成一面墙），所以正文单独成块，
   * 等宽 + 可滚动 + 可选中，首句仍然是能一眼读完的那句话。
   */
  function show(options: {
    title?: string;
    message: string;
    detail?: string;
    detailLabel?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      set({
        open: true,
        title: options.title ?? '确认',
        message: options.message,
        detailLabel: options.detailLabel ?? '',
        detail: options.detail ?? '',
        confirmText: options.confirmText ?? '确定',
        cancelText: options.cancelText ?? '取消',
        danger: options.danger ?? false,
        resolve,
      });
    });
  }

  function confirm() {
    let resolved = false;
    const unsub = subscribe((state) => {
      if (state.resolve && !resolved) {
        resolved = true;
        state.resolve(true);
      }
    });
    unsub();
    set({ ...IDLE });
  }

  function cancel() {
    let resolved = false;
    const unsub = subscribe((state) => {
      if (state.resolve && !resolved) {
        resolved = true;
        state.resolve(false);
      }
    });
    unsub();
    set({ ...IDLE });
  }

  return { subscribe, show, confirm, cancel };
}

export const confirmStore = createConfirmStore();

export function showConfirm(
  message: string,
  options?: {
    title?: string;
    detail?: string;
    detailLabel?: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }
): Promise<boolean> {
  return confirmStore.show({ message, ...options });
}

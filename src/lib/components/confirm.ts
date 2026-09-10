import { writable } from 'svelte/store';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  resolve: ((value: boolean) => void) | null;
}

function createConfirmStore() {
  const { subscribe, set } = writable<ConfirmState>({
    open: false,
    title: '确认',
    message: '',
    confirmText: '确定',
    cancelText: '取消',
    danger: false,
    resolve: null,
  });

  function show(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      set({
        open: true,
        title: options.title ?? '确认',
        message: options.message,
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
    set({ open: false, title: '确认', message: '', confirmText: '确定', cancelText: '取消', danger: false, resolve: null });
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
    set({ open: false, title: '确认', message: '', confirmText: '确定', cancelText: '取消', danger: false, resolve: null });
  }

  return { subscribe, show, confirm, cancel };
}

export const confirmStore = createConfirmStore();

export function showConfirm(message: string, options?: { title?: string; confirmText?: string; cancelText?: string; danger?: boolean }): Promise<boolean> {
  return confirmStore.show({ message, ...options });
}

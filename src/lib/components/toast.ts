import { writable } from 'svelte/store';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const MAX_TOASTS = 5;

function createToastStore() {
  const { subscribe, update } = writable<ToastItem[]>([]);
  let nextId = 1;

  function show(message: string, type: 'success' | 'error' = 'success') {
    update((list) => [...list, { id: nextId++, message, type }].slice(-MAX_TOASTS));
  }

  function remove(id: number) {
    update((list) => list.filter((t) => t.id !== id));
  }

  return { subscribe, show, remove };
}

export const toastStore = createToastStore();

export function showToast(message: string, type?: 'success' | 'error') {
  toastStore.show(message, type);
}

export function errorToString(e: unknown): string {
  return typeof e === "string" ? e : (e as any)?.message || String(e);
}

export function showErrorToast(e: unknown, prefix?: string): void {
  const msg = errorToString(e);
  showToast(prefix ? `${prefix}: ${msg}` : msg, "error");
}

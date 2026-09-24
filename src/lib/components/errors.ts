import { writable } from 'svelte/store';

export interface ErrorEntry {
  id: number;
  kind: string;
  text: string;
}

const MAX_ERRORS = 10;

function formatError(e: unknown): string {
  if (e instanceof Error) {
    const msg = `${e.name}: ${e.message}`;
    if ((import.meta as { env?: { DEV?: boolean } }).env?.DEV) return e.stack ?? msg;
    return msg;
  }
  if (typeof e === 'string') return e;
  try {
    return JSON.stringify(e, null, 2);
  } catch {
    return String(e);
  }
}

function createErrorStore() {
  const { subscribe, update, set } = writable<ErrorEntry[]>([]);
  let nextId = 1;

  function push(kind: string, err: unknown) {
    console.error(kind, err);
    update((list) => [...list, { id: nextId++, kind, text: formatError(err) }].slice(-MAX_ERRORS));
  }

  function dismiss(id: number) {
    update((list) => list.filter((e) => e.id !== id));
  }

  function clear() {
    set([]);
  }

  return { subscribe, push, dismiss, clear };
}

export const errorStore = createErrorStore();

export function pushError(kind: string, err: unknown) {
  errorStore.push(kind, err);
}

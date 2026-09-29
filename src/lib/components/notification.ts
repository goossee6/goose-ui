import { writable, type Writable } from 'svelte/store';
import type { Component } from 'svelte';
import type { Snippet } from 'svelte';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';
export type NotificationPosition =
  | 'top-left' | 'top' | 'top-right'
  | 'bottom-left' | 'bottom' | 'bottom-right';

export interface NotificationItem {
  id: number;
  key?: string;
  title: string;
  description?: string;
  type: NotificationType;
  position: NotificationPosition;
  closable: boolean;
  closeIcon?: Component;
  duration: number;
  icon?: Component;
  btn?: Snippet;
  onClick?: () => void;
  onClose?: () => void;
  pauseOnHover: boolean;
  showProgress: boolean;
  // internal timer state
  _timer?: ReturnType<typeof setTimeout>;
  _remaining?: number;
  _startedAt?: number;
  _paused?: boolean;
}

export interface NotificationOptions {
  title: string;
  description?: string;
  key?: string;
  type?: NotificationType;
  position?: NotificationPosition;
  closable?: boolean;
  closeIcon?: Component;
  duration?: number;
  icon?: Component;
  btn?: Snippet;
  onClick?: () => void;
  onClose?: () => void;
  pauseOnHover?: boolean;
  showProgress?: boolean;
}

const MAX_PER_POSITION = 5;

function createNotificationStore() {
  const containers: Record<NotificationPosition, Writable<NotificationItem[]>> = {
    'top-left': writable([]),
    'top': writable([]),
    'top-right': writable([]),
    'bottom-left': writable([]),
    'bottom': writable([]),
    'bottom-right': writable([]),
  };

  let nextId = 1;

  function open(opts: NotificationOptions): number {
    const position = opts.position ?? 'top';

    // key-based update: if key exists, replace the item
    if (opts.key) {
      const existing = findByKey(position, opts.key);
      if (existing) {
        updateItem(position, existing.id, opts);
        return existing.id;
      }
    }

    const item: NotificationItem = {
      id: nextId++,
      key: opts.key,
      title: opts.title,
      description: opts.description,
      type: opts.type ?? 'info',
      position,
      closable: opts.closable ?? true,
      closeIcon: opts.closeIcon,
      duration: opts.duration ?? 4500,
      icon: opts.icon,
      btn: opts.btn,
      onClick: opts.onClick,
      onClose: opts.onClose,
      pauseOnHover: opts.pauseOnHover ?? true,
      showProgress: opts.showProgress ?? false,
    };

    containers[position].update((list) =>
      [...list, item].slice(-MAX_PER_POSITION)
    );

    if (item.duration > 0) {
      startTimer(position, item.id, item.duration);
    }

    return item.id;
  }

  function findByKey(position: NotificationPosition, key: string): NotificationItem | undefined {
    let found: NotificationItem | undefined;
    const unsub = containers[position].subscribe((list) => {
      found = list.find((n) => n.key === key);
    });
    unsub();
    return found;
  }

  function updateItem(position: NotificationPosition, id: number, opts: Partial<NotificationOptions>) {
    containers[position].update((list) =>
      list.map((n) => {
        if (n.id !== id) return n;
        // clear old timer if duration changed
        if (n._timer) clearTimeout(n._timer);
        const updated = {
          ...n,
          title: opts.title ?? n.title,
          description: opts.description ?? n.description,
          type: opts.type ?? n.type,
          icon: opts.icon ?? n.icon,
          btn: opts.btn ?? n.btn,
          closable: opts.closable ?? n.closable,
          closeIcon: opts.closeIcon ?? n.closeIcon,
          onClick: opts.onClick ?? n.onClick,
          onClose: opts.onClose ?? n.onClose,
          pauseOnHover: opts.pauseOnHover ?? n.pauseOnHover,
          showProgress: opts.showProgress ?? n.showProgress,
          duration: opts.duration ?? n.duration,
          _timer: undefined,
          _remaining: undefined,
          _startedAt: undefined,
        };
        if (updated.duration > 0) {
          startTimer(position, id, updated.duration);
        }
        return updated;
      })
    );
  }

  function startTimer(position: NotificationPosition, id: number, duration: number) {
    const timer = setTimeout(() => remove(position, id), duration);
    containers[position].update((list) =>
      list.map((n) => n.id === id ? { ...n, _timer: timer, _remaining: duration, _startedAt: Date.now() } : n)
    );
  }

  function pause(position: NotificationPosition, id: number) {
    containers[position].update((list) =>
      list.map((n) => {
        if (n.id !== id || !n._timer || !n._startedAt) return n;
        clearTimeout(n._timer);
        const elapsed = Date.now() - n._startedAt;
        const remaining = Math.max(0, (n._remaining ?? n.duration) - elapsed);
        return { ...n, _timer: undefined, _remaining: remaining, _startedAt: undefined, _paused: true };
      })
    );
  }

  function resume(position: NotificationPosition, id: number) {
    containers[position].update((list) =>
      list.map((n) => {
        if (n.id !== id || n._timer || !n._remaining || n._remaining <= 0) return n;
        const remaining = n._remaining;
        const timer = setTimeout(() => remove(position, id), remaining);
        return { ...n, _timer: timer, _remaining: remaining, _startedAt: Date.now(), _paused: false };
      })
    );
  }

  function remove(position: NotificationPosition, id: number) {
    let onClose: (() => void) | undefined;
    containers[position].update((list) => {
      const item = list.find((n) => n.id === id);
      if (item?._timer) clearTimeout(item._timer);
      onClose = item?.onClose;
      return list.filter((n) => n.id !== id);
    });
    onClose?.();
  }

  function destroy(keyOrId?: string | number) {
    if (keyOrId === undefined) {
      destroyAll();
      return;
    }
    const callbacks: (() => void)[] = [];
    (Object.keys(containers) as NotificationPosition[]).forEach((p) => {
      containers[p].update((list) => {
        const item = list.find((n) =>
          typeof keyOrId === 'string' ? n.key === keyOrId : n.id === keyOrId
        );
        if (item?._timer) clearTimeout(item._timer);
        if (item?.onClose) callbacks.push(item.onClose);
        return list.filter((n) =>
          typeof keyOrId === 'string' ? n.key !== keyOrId : n.id !== keyOrId
        );
      });
    });
    callbacks.forEach((cb) => cb());
  }

  function destroyAll() {
    const callbacks: (() => void)[] = [];
    (Object.keys(containers) as NotificationPosition[]).forEach((p) => {
      containers[p].update((list) => {
        list.forEach((n) => {
          if (n._timer) clearTimeout(n._timer);
          if (n.onClose) callbacks.push(n.onClose);
        });
        return [];
      });
    });
    callbacks.forEach((cb) => cb());
  }

  function subscribe(position: NotificationPosition, cb: (items: NotificationItem[]) => void) {
    return containers[position].subscribe(cb);
  }

  return {
    open,
    remove,
    pause,
    resume,
    destroy,
    destroyAll,
    subscribe,
  };
}

export const notificationStore = createNotificationStore();

type NotificationArg = string | NotificationOptions;

function resolveOpts(type: NotificationType, arg: NotificationArg, extra?: Omit<NotificationOptions, 'title' | 'type'>): NotificationOptions {
  if (typeof arg === 'string') {
    return { title: arg, type, ...extra };
  }
  return { ...arg, type };
}

export const Notification = {
  success: (arg: NotificationArg, extra?: Omit<NotificationOptions, 'title' | 'type'>) =>
    notificationStore.open(resolveOpts('success', arg, extra)),
  info: (arg: NotificationArg, extra?: Omit<NotificationOptions, 'title' | 'type'>) =>
    notificationStore.open(resolveOpts('info', arg, extra)),
  warning: (arg: NotificationArg, extra?: Omit<NotificationOptions, 'title' | 'type'>) =>
    notificationStore.open(resolveOpts('warning', arg, extra)),
  error: (arg: NotificationArg, extra?: Omit<NotificationOptions, 'title' | 'type'>) =>
    notificationStore.open(resolveOpts('error', arg, extra)),
  open: (opts: NotificationOptions) => notificationStore.open(opts),
  destroy: (keyOrId?: string | number) => notificationStore.destroy(keyOrId),
  destroyAll: () => notificationStore.destroyAll(),
};

export function errorToString(e: unknown): string {
  if (typeof e === 'string') return e;
  const msg = (e as { message?: unknown } | null)?.message;
  return typeof msg === 'string' && msg ? msg : String(e);
}

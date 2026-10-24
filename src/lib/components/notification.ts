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

export function createNotificationStore() {
  const containers: Record<NotificationPosition, Writable<NotificationItem[]>> = {
    'top-left': writable([]),
    'top': writable([]),
    'top-right': writable([]),
    'bottom-left': writable([]),
    'bottom': writable([]),
    'bottom-right': writable([]),
  };

  let nextId = 1;

  // 全局暂停（牌堆展开 / 页面隐藏）：暂停期间 resume() 与新计时均不启动
  let suspended = false;
  const suspendReasons = { expanded: false, hidden: false };

  function pauseAllItems() {
    (Object.keys(containers) as NotificationPosition[]).forEach((p) => {
      containers[p].update((list) =>
        list.map((n) => {
          if (!n._timer || !n._startedAt) return n;
          clearTimeout(n._timer);
          const elapsed = Date.now() - n._startedAt;
          const remaining = Math.max(0, (n._remaining ?? n.duration) - elapsed);
          return { ...n, _timer: undefined, _remaining: remaining, _startedAt: undefined, _paused: true };
        })
      );
    });
  }

  function resumeAllItems() {
    (Object.keys(containers) as NotificationPosition[]).forEach((p) => {
      containers[p].update((list) =>
        list.map((n) => {
          if (!n._paused || n._timer || !n._remaining || n._remaining <= 0) return n;
          const remaining = n._remaining;
          const timer = setTimeout(() => remove(p, n.id), remaining);
          return { ...n, _timer: timer, _startedAt: Date.now(), _paused: false };
        })
      );
    });
  }

  function applySuspend() {
    const should = suspendReasons.expanded || suspendReasons.hidden;
    if (should === suspended) return;
    suspended = should;
    if (should) pauseAllItems();
    else resumeAllItems();
  }

  function setSuspend(reason: 'expanded' | 'hidden', value: boolean) {
    suspendReasons[reason] = value;
    applySuspend();
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => setSuspend('hidden', document.hidden));
  }

  function open(opts: NotificationOptions): number {
    const position = opts.position ?? 'bottom-right';

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

    containers[position].update((list) => [...list, item]);

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
    let dur = 0;
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
        dur = updated.duration;
        return updated;
      })
    );
    // 必须在本次 update 的 set 完成后再启动 timer：嵌套 update 会被外层 set 覆盖 _timer
    if (dur > 0) startTimer(position, id, dur);
  }

  function startTimer(position: NotificationPosition, id: number, duration: number) {
    if (suspended) {
      // 全局暂停期间不启动计时，存为暂停态待解除后统一恢复
      containers[position].update((list) =>
        list.map((n) => n.id === id ? { ...n, _timer: undefined, _remaining: duration, _startedAt: undefined, _paused: true } : n)
      );
      return;
    }
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
    if (suspended) return;
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
    setSuspend,
  };
}

export type NotificationStore = ReturnType<typeof createNotificationStore>;

/**
 * 默认单例：页面级 `Notification.xxx()` 与未显式传入 store 的 Provider 都使用它。
 * 需要「多个互不干扰的通知容器」时，用 createNotificationStore() 各建一份，
 * 分别传给 Provider 的 store prop 与 createNotification(store)。
 */
export const notificationStore: NotificationStore = createNotificationStore();

type NotificationArg = string | NotificationOptions;

function resolveOpts(type: NotificationType, arg: NotificationArg, extra?: Omit<NotificationOptions, 'title' | 'type'>): NotificationOptions {
  if (typeof arg === 'string') {
    return { title: arg, type, ...extra };
  }
  return { ...arg, type };
}

/** 把一套快捷方法绑定到指定 store 上 */
export function createNotification(store: NotificationStore) {
  return {
    success: (arg: NotificationArg, extra?: Omit<NotificationOptions, 'title' | 'type'>) =>
      store.open(resolveOpts('success', arg, extra)),
    info: (arg: NotificationArg, extra?: Omit<NotificationOptions, 'title' | 'type'>) =>
      store.open(resolveOpts('info', arg, extra)),
    warning: (arg: NotificationArg, extra?: Omit<NotificationOptions, 'title' | 'type'>) =>
      store.open(resolveOpts('warning', arg, extra)),
    error: (arg: NotificationArg, extra?: Omit<NotificationOptions, 'title' | 'type'>) =>
      store.open(resolveOpts('error', arg, extra)),
    open: (opts: NotificationOptions) => store.open(opts),
    destroy: (keyOrId?: string | number) => store.destroy(keyOrId),
    destroyAll: () => store.destroyAll(),
  };
}

/**
 * 全局通知 API，绑定在默认单例上：可在任何地方调用（模块级代码、事件回调、非组件模块）。
 *
 * 注意：不使用 Svelte context。`getContext()` 只能在组件初始化期间调用，
 * 在事件处理器/模块级调用会抛 lifecycle_outside_component，无法用 context 做隐式路由。
 * 需要独立容器时请用 createNotificationStore() + createNotification(store)。
 */
export const Notification = createNotification(notificationStore);

export function errorToString(e: unknown): string {
  if (typeof e === 'string') return e;
  const msg = (e as { message?: unknown } | null)?.message;
  return typeof msg === 'string' && msg ? msg : String(e);
}

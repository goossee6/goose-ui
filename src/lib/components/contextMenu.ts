import type { Component } from 'svelte';
import { menuStore } from "./contextMenuStore.svelte.js";

export interface MenuItemDef {
  id: string;
  label: string;
  icon?: Component<{ size?: number; class?: string }>;
  /** 禁用项：可见但不可点，也不参与键盘导航 */
  disabled?: boolean;
  /** 分隔线：忽略 id/label */
  separator?: boolean;
}

export interface MenuActionData {
  [key: string]: string;
}

const menus = new Map<string, MenuItemDef[]>();
const actionHandlers = new Map<string, Map<string, (data: MenuActionData) => void>>();

export function registerMenu(name: string, items: MenuItemDef[]): void { menus.set(name, items); }
export function unregisterMenu(name: string): void { menus.delete(name); if (menuStore.name === name) menuStore.visible = false; }
export function getMenu(name: string): MenuItemDef[] | undefined { return menus.get(name); }

export function cellMenuAttrs(menu: string, data: Record<string, string>): Record<string, string> {
  if (!menu) return {};
  return { 'data-menu-name': menu, 'data-menu-data': encodeBase64(JSON.stringify(data)) };
}

/**
 * 与 cellMenuAttrs 等价，但直接返回可以塞进标签属性位置的字符串。
 *
 * 给每行每格都要挂菜单的表格用：`{...attrs}` 展开每次更新都要逐键 diff，
 * 而这里只有两个固定键，拼一次字符串即可。
 */
export function cellMenuAttrString(menu: string, data: Record<string, string>): string {
  if (!menu) return '';
  const b64 = encodeBase64(JSON.stringify(data));
  return `data-menu-name="${menu}" data-menu-data="${b64}"`;
}

export function openMenuAt(x: number, y: number, name: string, data: Record<string, string>): void {
  menuStore.x = x; menuStore.y = y; menuStore.name = name; menuStore.data = data; menuStore.visible = true;
}

export function closeMenu(): void { menuStore.visible = false; }

export function onMenuAction<T extends MenuActionData = MenuActionData>(
  menu: string, action: string, handler: (data: T) => void,
): () => void {
  let m = actionHandlers.get(menu);
  if (!m) { m = new Map(); actionHandlers.set(menu, m); }
  m.set(action, handler as (data: MenuActionData) => void);
  return () => m?.delete(action);
}

export function dispatchMenuAction(event: { menu: string; action: string; data: MenuActionData }): void {
  actionHandlers.get(event.menu)?.get(event.action)?.(event.data);
}

export function encodeBase64(text: string): string { return btoa(unescape(encodeURIComponent(text))); }
export function decodeBase64(text: string): string { return decodeURIComponent(escape(atob(text))); }

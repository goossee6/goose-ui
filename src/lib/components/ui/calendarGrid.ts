/**
 * 日历的网格与日期运算。Calendar / RangeCalendar 共用这一份。
 *
 * 为什么从组件里搬出来：RangeCalendar 原先写的是
 * `import { WEEKDAYS, toISO, fromISO, isSameDay } from './Calendar.svelte'` ——
 * 为了拿四个纯函数，把整个日历组件的实例、样式、PillTrack 都拖进依赖图，
 * 两边还各自维护一份 42 格的 `cells` 推导和方向键换算。改一处忘另一处时，
 * 两个日历的月份起点或键盘步长就会悄悄分叉（7 天 vs 6 行那种）。
 */

import { pad2 } from './dateParts.ts';

/** 周一开头。`weekStart = 0` 时由 `weekdayLabels()` 轮转，别在两处各写一份 */
export const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export function weekdayLabels(weekStart: 0 | 1 = 1): string[] {
	return weekStart === 1 ? WEEKDAYS : [...WEEKDAYS.slice(6), ...WEEKDAYS.slice(0, 6)];
}

export function toISO(d: Date): string {
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 严格校验 `YYYY-MM-DD`：2026-02-30 这类会被 `new Date` 顺延的输入一律当非法 */
export function fromISO(iso: string): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
	const [y, m, d] = iso.split('-').map(Number);
	const date = new Date(y, m - 1, d);
	return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

export function isSameDay(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export interface CalendarCell {
	date: Date;
	iso: string;
	inMonth: boolean;
	today: boolean;
}

/** 固定 6 行 × 7 列：月份切换时高度不跳，浮层不会自己上下抖 */
export function buildCells(viewYear: number, viewMonth: number, weekStart: 0 | 1, today: Date): CalendarCell[] {
	const first = new Date(viewYear, viewMonth, 1);
	const offset = (first.getDay() - weekStart + 7) % 7;
	const start = new Date(viewYear, viewMonth, 1 - offset);
	const list: CalendarCell[] = [];
	for (let i = 0; i < 42; i++) {
		const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
		list.push({ date: d, iso: toISO(d), inMonth: d.getMonth() === viewMonth, today: isSameDay(d, today) });
	}
	return list;
}

/** 方向键换算成目标日期；不是方向键返回 null（翻月、Enter 由调用方自己处理） */
export function shiftByArrow(cur: Date, key: string): Date | null {
	if (key === 'ArrowLeft') return new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 1);
	if (key === 'ArrowRight') return new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
	if (key === 'ArrowUp') return new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 7);
	if (key === 'ArrowDown') return new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 7);
	return null;
}

/** 翻月，自动跨年 */
export function shiftMonth(viewYear: number, viewMonth: number, delta: number): { year: number; month: number } {
	const d = new Date(viewYear, viewMonth + delta, 1);
	return { year: d.getFullYear(), month: d.getMonth() };
}

export interface DateBounds {
	disabled?: boolean;
	min?: string;
	max?: string;
	disabledDate?: (iso: string) => boolean;
}

/** 「这一天能不能点」的公共部分（范围语义由调用方另加） */
export function blocked(iso: string, b: DateBounds): boolean {
	if (b.disabled) return true;
	if (b.min && iso < b.min) return true;
	if (b.max && iso > b.max) return true;
	return b.disabledDate?.(iso) ?? false;
}

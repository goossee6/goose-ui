/**
 * 日期时间范围的字符串运算。范围值一律是 `YYYY-MM-DD HH:mm:ss`，
 * 只有日期段的部分是 `YYYY-MM-DD`（供日历使用）。
 */

export type RangePresetId = 'today' | 'yesterday' | 'd3' | 'd7' | 'd30' | 'm3' | 'm6';

export const RANGE_PRESETS: { id: RangePresetId; label: string }[] = [
	{ id: 'today', label: '今天' },
	{ id: 'yesterday', label: '昨天' },
	{ id: 'd3', label: '最近 3 天' },
	{ id: 'd7', label: '最近 7 天' },
	{ id: 'd30', label: '最近 30 天' },
	{ id: 'm3', label: '最近 3 个月' },
	{ id: 'm6', label: '最近半年' },
];

import { pad2 } from './dateParts.ts';

export function isoDate(d: Date): string {
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function splitDateTime(v: string): { date: string; time: string } {
	const [date = '', time = ''] = v.trim().split(/\s+/);
	return { date, time };
}

/** 没有日期就是空值；时间是空则按整点零点补齐 */
export function joinDateTime(date: string, time: string): string {
	if (!date) return '';
	return `${date} ${time || '00:00:00'}`;
}

/** 按月偏移，月末溢出夹到目标月的最后一天（5/31 往前三个月是 2/28 或 2/29） */
function monthsBefore(base: Date, n: number): Date {
	const d = new Date(base.getFullYear(), base.getMonth() - n, 1);
	const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
	d.setDate(Math.min(base.getDate(), last));
	return d;
}

/** 预设转日期区间，闭区间且含今天 */
export function presetDates(id: RangePresetId, now = new Date()): { start: string; end: string } {
	const daysAgo = (n: number) => isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n));
	const today = isoDate(now);
	switch (id) {
		case 'today':
			return { start: today, end: today };
		case 'yesterday': {
			// 「昨天」只含昨天一整天：起点和终点都落在昨天，右端不能跟着落到今天
			const d = daysAgo(1);
			return { start: d, end: d };
		}
		case 'd3':
			return { start: daysAgo(2), end: today };
		case 'd7':
			return { start: daysAgo(6), end: today };
		case 'd30':
			return { start: daysAgo(29), end: today };
		default:
			return { start: isoDate(monthsBefore(now, id === 'm3' ? 3 : 6)), end: today };
	}
}

/**
 * 保证 start ≤ end。整体倒置直接交换；同一天只倒置时间时把终点抬到 23:59:59
 * （交换会篡改用户刚选的那一端）。
 */
export function orderRange(start: string, end: string): { start: string; end: string } {
	if (!start || !end || start <= end) return { start, end };
	const a = splitDateTime(start);
	const b = splitDateTime(end);
	if (a.date === b.date) return { start, end: joinDateTime(b.date, '23:59:59') };
	return { start: end, end: start };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
	toISO,
	fromISO,
	isSameDay,
	buildCells,
	shiftByArrow,
	shiftMonth,
	blocked,
	weekdayLabels,
	WEEKDAYS,
} from '../src/lib/components/ui/calendarGrid.ts';

test('toISO / fromISO 互为逆运算', () => {
	assert.equal(toISO(new Date(2026, 0, 5)), '2026-01-05');
	assert.equal(toISO(new Date(2026, 11, 31)), '2026-12-31');
	const d = fromISO('2026-11-23');
	assert.ok(d);
	assert.equal(d.getFullYear(), 2026);
	assert.equal(d.getMonth(), 10);
	assert.equal(d.getDate(), 23);
});

test('fromISO 拒绝会被 new Date 顺延的假日期', () => {
	assert.equal(fromISO('2026-02-30'), null);
	assert.equal(fromISO('2026-13-01'), null);
	assert.equal(fromISO('2026-1-5'), null);
	assert.equal(fromISO(''), null);
});

test('isSameDay 只比较年月日，忽略时间', () => {
	assert.equal(isSameDay(new Date(2026, 10, 23, 1, 2, 3), new Date(2026, 10, 23, 23, 59)), true);
	assert.equal(isSameDay(new Date(2026, 10, 23), new Date(2026, 10, 24)), false);
});

test('weekdayLabels：周一开头为默认，weekStart=0 把周日轮转到最前', () => {
	assert.equal(weekdayLabels(1).join(''), WEEKDAYS.join(''));
	assert.equal(weekdayLabels(0)[0], '日');
	assert.equal(weekdayLabels(0)[6], '六');
});

test('buildCells 恒定 42 格，且首格对齐 weekStart', () => {
	const today = new Date(2026, 10, 23);
	const cells = buildCells(2026, 10, 1, today);
	assert.equal(cells.length, 42);
	assert.equal(cells[0].date.getDay(), 1); // 2026-11 的 1 号是周日，6 行网格从 10-26（周一）起
	assert.equal(cells.filter((c) => c.inMonth).length, 30); // 11 月 30 天
	assert.equal(cells.filter((c) => c.today).length, 1);
	assert.equal(cells.find((c) => c.today)?.iso, '2026-11-23');
});

test('buildCells：weekStart=0 时首格是周日', () => {
	const cells = buildCells(2026, 10, 0, new Date(2026, 10, 23));
	assert.equal(cells[0].date.getDay(), 0);
});

test('buildCells：闰年 2 月补到 29 天', () => {
	const cells = buildCells(2028, 1, 1, new Date(2028, 1, 1));
	assert.equal(cells.filter((c) => c.inMonth).length, 29);
});

test('shiftByArrow：左右一天、上下七天，其他键返回 null', () => {
	const base = new Date(2026, 10, 23);
	assert.equal(toISO(shiftByArrow(base, 'ArrowLeft')!), '2026-11-22');
	assert.equal(toISO(shiftByArrow(base, 'ArrowRight')!), '2026-11-24');
	assert.equal(toISO(shiftByArrow(base, 'ArrowUp')!), '2026-11-16');
	assert.equal(toISO(shiftByArrow(base, 'ArrowDown')!), '2026-11-30');
	assert.equal(shiftByArrow(base, 'PageUp'), null);
	assert.equal(shiftByArrow(base, 'Enter'), null);
});

test('shiftByArrow 跨月跨年由 Date 进位', () => {
	assert.equal(toISO(shiftByArrow(new Date(2026, 0, 1), 'ArrowLeft')!), '2025-12-31');
	assert.equal(toISO(shiftByArrow(new Date(2026, 11, 31), 'ArrowRight')!), '2027-01-01');
});

test('shiftMonth 跨年', () => {
	assert.deepEqual(shiftMonth(2026, 0, -1), { year: 2025, month: 11 });
	assert.deepEqual(shiftMonth(2026, 11, 1), { year: 2027, month: 0 });
});

test('blocked：disabled / min / max / disabledDate 任一命中即不可选', () => {
	assert.equal(blocked('2026-11-23', {}), false);
	assert.equal(blocked('2026-11-23', { disabled: true }), true);
	assert.equal(blocked('2026-11-01', { min: '2026-11-10' }), true);
	assert.equal(blocked('2026-11-30', { max: '2026-11-20' }), true);
	assert.equal(blocked('2026-11-23', { disabledDate: (iso) => iso.endsWith('3') }), true);
	assert.equal(blocked('2026-11-24', { disabledDate: (iso) => iso.endsWith('3') }), false);
});

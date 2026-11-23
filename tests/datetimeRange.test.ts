import test from 'node:test';
import assert from 'node:assert/strict';
import {
	joinDateTime,
	orderRange,
	presetDates,
	splitDateTime,
} from '../src/lib/components/ui/datetimeRange.ts';

test('拆出日期与时间，只有日期时时间为空', () => {
	assert.deepEqual(splitDateTime('2026-11-23 09:30:05'), { date: '2026-11-23', time: '09:30:05' });
	assert.deepEqual(splitDateTime('2026-11-23'), { date: '2026-11-23', time: '' });
	assert.deepEqual(splitDateTime(''), { date: '', time: '' });
});

test('拼接：无日期为空值，时间缺省补零点', () => {
	assert.equal(joinDateTime('2026-11-23', '09:30:05'), '2026-11-23 09:30:05');
	assert.equal(joinDateTime('2026-11-23', ''), '2026-11-23 00:00:00');
	assert.equal(joinDateTime('', '09:30:05'), '');
});

test('预设区间闭区间且含今天', () => {
	const now = new Date(2026, 10, 23);
	assert.deepEqual(presetDates('today', now), { start: '2026-11-23', end: '2026-11-23' });
	assert.deepEqual(presetDates('yesterday', now), { start: '2026-11-22', end: '2026-11-22' });
	assert.deepEqual(presetDates('d3', now), { start: '2026-11-21', end: '2026-11-23' });
	assert.deepEqual(presetDates('d7', now), { start: '2026-11-17', end: '2026-11-23' });
	assert.deepEqual(presetDates('d30', now), { start: '2026-10-25', end: '2026-11-23' });
	assert.deepEqual(presetDates('m3', now), { start: '2026-08-23', end: '2026-11-23' });
	assert.deepEqual(presetDates('m6', now), { start: '2026-05-23', end: '2026-11-23' });
});

test('「昨天」只含昨天一天，右端不落到今天', () => {
	assert.deepEqual(presetDates('yesterday', new Date(2026, 10, 23)), { start: '2026-11-22', end: '2026-11-22' });
	// 跨月 / 跨年 / 闰年边界都靠 Date 自己进位
	assert.deepEqual(presetDates('yesterday', new Date(2026, 11, 1)), { start: '2026-11-30', end: '2026-11-30' });
	assert.deepEqual(presetDates('yesterday', new Date(2027, 0, 1)), { start: '2026-12-31', end: '2026-12-31' });
	assert.deepEqual(presetDates('yesterday', new Date(2026, 2, 1)), { start: '2026-02-28', end: '2026-02-28' });
	assert.deepEqual(presetDates('yesterday', new Date(2028, 2, 1)), { start: '2028-02-29', end: '2028-02-29' });
});

test('按月回溯时月末夹到目标月最后一天', () => {
	assert.equal(presetDates('m3', new Date(2026, 4, 31)).start, '2026-02-28');
	assert.equal(presetDates('m6', new Date(2026, 7, 31)).start, '2026-02-28');
	assert.equal(presetDates('m3', new Date(2028, 4, 31)).start, '2028-02-29');
});

test('顺序修正：整体倒置交换两端', () => {
	assert.deepEqual(orderRange('2026-11-24 00:00:00', '2026-11-23 23:00:00'), {
		start: '2026-11-23 23:00:00',
		end: '2026-11-24 00:00:00',
	});
});

test('顺序修正：同一天只倒置时间时把终点抬到 23:59:59', () => {
	assert.deepEqual(orderRange('2026-11-23 18:00:00', '2026-11-23 09:00:00'), {
		start: '2026-11-23 18:00:00',
		end: '2026-11-23 23:59:59',
	});
});

test('存在空值时原样返回', () => {
	assert.deepEqual(orderRange('2026-11-23 18:00:00', ''), {
		start: '2026-11-23 18:00:00',
		end: '',
	});
	assert.deepEqual(orderRange('', ''), { start: '', end: '' });
});

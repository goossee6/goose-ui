import test from 'node:test';
import assert from 'node:assert/strict';
import {
	cellValues,
	isLegal,
	isOutOfRange,
	normalizeCells,
	pasteCells,
	rangeOf,
} from '../src/lib/components/ui/segmentCells.ts';

/** 年-月-日：位宽 4/2/2，月 1-12、日 1-31（真实日上限由外层按闰年算好再传） */
const date = { widths: [4, 2, 2], ranges: [[0, 9999], [1, 12], [1, 31]] as ([number, number] | undefined)[], numeric: true };
/** 时:分:秒 */
const time = { widths: [2, 2, 2], ranges: [[0, 23], [0, 59], [0, 59]] as ([number, number] | undefined)[], numeric: true };

test('cellValues：按位宽铺满，缺段补空串，多余段忽略', () => {
	assert.deepEqual(cellValues([4, 2, 2], ['2026', '11', '23']), ['2026', '11', '23']);
	assert.deepEqual(cellValues([4, 2, 2], ['2026']), ['2026', '', '']);
	assert.deepEqual(cellValues([4, 2, 2], ['2026', '11', '23', '99']), ['2026', '11', '23']);
	assert.deepEqual(cellValues([2], []), ['']);
});

test('rangeOf：没给区间就按位数取满', () => {
	assert.deepEqual(rangeOf({ widths: [4] }, 0), [0, 9999]);
	assert.deepEqual(rangeOf({ widths: [2] }, 0), [0, 99]);
	// 显式区间优先
	assert.deepEqual(rangeOf(date, 1), [1, 12]);
});

test('isLegal：空段永远合法（「还没填」不是错）', () => {
	assert.equal(isLegal(date, 1, ''), true);
	assert.equal(isLegal(date, 1, '12'), true);
	assert.equal(isLegal(date, 1, '13'), false);
	assert.equal(isLegal(date, 0, '2026'), true);
});

test('isLegal：非数字段不做区间约束', () => {
	const text = { widths: [8], numeric: false };
	assert.equal(isLegal(text, 0, 'abc'), true);
	assert.equal(isOutOfRange(text, 0, 'abc'), false);
});

test('isOutOfRange：已填才判，空串不算越界', () => {
	assert.equal(isOutOfRange(time, 0, '24'), true);
	assert.equal(isOutOfRange(time, 0, '23'), false);
	assert.equal(isOutOfRange(time, 0, ''), false);
	assert.equal(isOutOfRange(time, 2, '60'), true);
});

test('normalizeCells：位数不足左补零，越界回滚到进入字段时的值', () => {
	const r = normalizeCells(time, ['9', '5', ''], ['09', '05', '']);
	assert.deepEqual(r.cells, ['09', '05', '']);
	assert.equal(r.changed, true);
	// 空段保持空：补零只针对「填过但没填满」的段
	assert.deepEqual(normalizeCells(time, ['', '', ''], ['', '', '']).cells, ['', '', '']);

	const rolled = normalizeCells(time, ['9', '75', '30'], ['09', '30', '30']);
	assert.deepEqual(rolled.cells, ['09', '30', '30'], '越界段必须回到原值而不是清空');
	assert.equal(rolled.changed, true);
});

test('normalizeCells：已经规范时 changed 为 false，不再触发一次 onchange', () => {
	const r = normalizeCells(time, ['09', '05', '30'], ['09', '05', '30']);
	assert.deepEqual(r.cells, ['09', '05', '30']);
	assert.equal(r.changed, false);
});

test('normalizeCells：非数字段原样返回', () => {
	const text = { widths: [8], numeric: false };
	assert.deepEqual(normalizeCells(text, ['ab'], []), { cells: ['ab'], changed: false });
});

test('pasteCells：整串日期按位宽切开铺满', () => {
	const r = pasteCells(date, ['', '', ''], '20261123', 0, ['', '', '']);
	assert.deepEqual(r.cells, ['2026', '11', '23']);
	assert.equal(r.next, 2, '填满后焦点落在最后一段，不越出去');
});

test('pasteCells：带分隔符的粘贴只取数字', () => {
	const r = pasteCells(date, ['', '', ''], '2026-11-23', 0, ['', '', '']);
	assert.deepEqual(r.cells, ['2026', '11', '23']);
});

test('pasteCells：时间六位一次填三格', () => {
	const r = pasteCells(time, ['', '', ''], '093000', 0, ['', '', '']);
	assert.deepEqual(r.cells, ['09', '30', '00']);
	assert.equal(r.next, 2);
});

test('pasteCells：从中间段开始粘贴，前面的段不动', () => {
	const r = pasteCells(date, ['2026', '', ''], '1123', 1, ['2026', '', '']);
	assert.deepEqual(r.cells, ['2026', '11', '23']);
	assert.equal(r.next, 2);
});

test('pasteCells：越界的块保留原值，其余照常填入', () => {
	// 月 13 不合法 → 保持 fallback；日 23 照填
	const r = pasteCells(date, ['2026', '11', '05'], '20261323', 0, ['2026', '11', '05']);
	assert.deepEqual(r.cells, ['2026', '11', '23']);
});

test('pasteCells：空粘贴等于没发生（返回原数组，不触发 onchange）', () => {
	const cells = ['2026', '11', '23'];
	const r = pasteCells(date, cells, '', 0, cells);
	assert.equal(r.cells, cells, '同一引用：组件据此跳过一次写回');
	assert.equal(r.next, 0);
	// 只粘了非数字内容，数字段过滤后为空，同样不动
	assert.equal(pasteCells(date, cells, 'abc', 0, cells).cells, cells);
});

test('pasteCells：非数字字段保留原文', () => {
	const text = { widths: [4, 4], numeric: false };
	assert.deepEqual(pasteCells(text, ['', ''], 'abcdEFGH', 0, ['', '']).cells, ['abcd', 'EFGH']);
});

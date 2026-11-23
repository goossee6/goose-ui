import test from 'node:test';
import assert from 'node:assert/strict';
import {
	pad2,
	padTo,
	indexFloor,
	indexNearest,
	joinTrimmed,
	splitFixed,
	normalizeParts,
	normalizeTime,
	timeColumns,
} from '../src/lib/components/ui/dateParts.ts';

const byStep = (n: number, max: number) => Array.from({ length: max / n }, (_, i) => pad2(i * n));

test('补零：空串保持空，数字与数字串都补到指定宽度', () => {
	assert.equal(pad2(5), '05');
	assert.equal(pad2('5'), '05');
	assert.equal(pad2(12), '12');
	assert.equal(pad2(''), '');
	assert.equal(padTo('9', 4), '0009');
	assert.equal(padTo(2026, 4), '2026');
});

test('indexFloor：取不超过目标的最后一档，「现在」靠它对齐步长', () => {
	const hours5 = byStep(5, 25); // 00 05 10 15 20
	assert.equal(indexFloor(hours5, '18'), 3); // 15
	assert.equal(indexFloor(hours5, '20'), 4);
	assert.equal(indexFloor(hours5, '0'), 0);
	// 比首项还小、空串、非数字都退回 0，不能返回 -1
	assert.equal(indexFloor(hours5, ''), 0);
	assert.equal(indexFloor(hours5, 'x'), 0);
});

test('indexFloor：7 步长的分钟列取到 49，不会越过列表末尾', () => {
	const mins7 = byStep(7, 56); // 00 07 ... 49
	assert.equal(indexFloor(mins7, '59'), mins7.length - 1);
	assert.equal(mins7.length - 1, 7);
});

test('indexNearest：网格外的值就近停靠，而不是弹回 00', () => {
	const hours5 = byStep(5, 25);
	assert.equal(indexNearest(hours5, '18'), 4); // 20 更近
	assert.equal(indexNearest(hours5, '17'), 3); // 15 更近
	assert.equal(indexNearest(hours5, '15'), 3); // 命中不动
	// 键入中间态只有一位时按数值匹配，`3` 能找到 `03`
	const hours = byStep(1, 24);
	assert.equal(indexNearest(hours, '3'), 3);
});

test('joinTrimmed：保留空段位置，只去掉尾部连续空段', () => {
	assert.equal(joinTrimmed(['', '07', '00']), ':07:00');
	assert.equal(joinTrimmed(['12', '30', '']), '12:30');
	assert.equal(joinTrimmed(['12', '30', '45']), '12:30:45');
	assert.equal(joinTrimmed(['12', '', '']), '12');
	assert.equal(joinTrimmed(['']), '');
	assert.equal(joinTrimmed(['', '07', '00'], '-'), '-07-00');
});

test('splitFixed：段数只由配置决定，不跟随分隔符出现次数', () => {
	assert.deepEqual(splitFixed('2026-11-23', '-', 3), ['2026', '11', '23']);
	// 只填了年 / 只填了年月：后面的段要补空串，否则第二格没有值
	assert.deepEqual(splitFixed('2026', '-', 3), ['2026', '', '']);
	assert.deepEqual(splitFixed('2026-11', '-', 3), ['2026', '11', '']);
	assert.deepEqual(splitFixed('', ':', 2), ['', '']);
	// 粘贴多出来的段丢掉，不撑出第四格
	assert.deepEqual(splitFixed('2026-11-23-09', '-', 3), ['2026', '11', '23']);
	// 前导空段保留（时分秒靠位置对齐）
	assert.deepEqual(splitFixed(':07:00', ':', 3), ['', '07', '00']);
});

test('splitFixed 与 joinTrimmed 互为逆运算（已填部分原样往返）', () => {
	const cases: [string, string][] = [
		['2026-11-23', '-'],
		['2026-11', '-'],
		['2026', '-'],
		['', '-'],
		[':07:00', ':'],
		['12:30', ':'],
	];
	for (const [v, sep] of cases) {
		assert.equal(joinTrimmed(splitFixed(v, sep, 3), sep), v);
	}
});

test('normalizeParts：整组赋值补零，空段按 00', () => {
	assert.deepEqual(normalizeParts(['9', '', '5']), ['09', '00', '05']);
	assert.deepEqual(normalizeParts(['2026', '1', '3'], 4), ['2026', '0001', '0003']);
});

test('normalizeTime：时间浮层永远拿到一个可滚的值', () => {
	assert.equal(normalizeTime('9:5'), '09:05:00');
	assert.equal(normalizeTime('13:04:05'), '13:04:05');
	assert.equal(normalizeTime(''), '00:00:00');
});

test('timeColumns：默认 24 / 60 / 60 三列', () => {
	const cols = timeColumns();
	assert.equal(cols.length, 3);
	assert.equal(cols[0].length, 24);
	assert.equal(cols[1].length, 60);
	assert.equal(cols[2].length, 60);
	assert.equal(cols[0][0], '00');
	assert.equal(cols[0][23], '23');
});

test('timeColumns：按步长分档，小时列按 24 回绕', () => {
	const [h, m, sec] = timeColumns([5, 7, 10]);
	assert.deepEqual(h, ['00', '05', '10', '15', '20']);
	assert.equal(m.length, 8); // 0,7,...,49
	assert.equal(m[7], '49');
	assert.deepEqual(sec, ['00', '10', '20', '30', '40', '50']);
});

test('timeColumns：seconds=false 只给两列；步长非法时退回 1', () => {
	assert.equal(timeColumns([1, 1, 1], false).length, 2);
	assert.equal(timeColumns([0, -3, NaN]).length, 3);
	assert.equal(timeColumns([0, -3, NaN])[0].length, 24);
});

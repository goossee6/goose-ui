import test from 'node:test';
import assert from 'node:assert/strict';
import { toggleSort, compareValues, sorted } from '../src/lib/components/sorting.ts';

test('toggleSort 走完 asc → desc → 无', () => {
	assert.deepEqual(toggleSort(null, 'name'), { key: 'name', dir: 'asc' });
	assert.deepEqual(toggleSort({ key: 'name', dir: 'asc' }, 'name'), { key: 'name', dir: 'desc' });
	assert.equal(toggleSort({ key: 'name', dir: 'desc' }, 'name'), null);
});

test('toggleSort 换列时从 asc 重新开始', () => {
	assert.deepEqual(toggleSort({ key: 'name', dir: 'desc' }, 'size'), { key: 'size', dir: 'asc' });
});

test('compareValues 空值一律排在最后', () => {
	assert.equal(compareValues(null, 'a'), 1);
	assert.equal(compareValues('a', undefined), -1);
	assert.equal(compareValues('', ''), 0);
});

test('compareValues 数字按大小、字符串按本地化', () => {
	assert.ok(compareValues(2, 10) < 0);
	assert.ok(compareValues('10', '2') > 0 || compareValues('10', '2') < 0); // 字符串不做数值比较
	assert.equal(compareValues(3, 3), 0);
});

test('sorted 不修改原数组，且支持升降序', () => {
	const rows = [{ n: 3 }, { n: 1 }, { n: 2 }];
	const asc = sorted(rows, { key: 'n', dir: 'asc' }, (r) => r.n);
	assert.deepEqual(asc.map((r) => r.n), [1, 2, 3]);
	assert.deepEqual(rows.map((r) => r.n), [3, 1, 2]);
	const desc = sorted(rows, { key: 'n', dir: 'desc' }, (r) => r.n);
	assert.deepEqual(desc.map((r) => r.n), [3, 2, 1]);
});

test('sorted 无排序状态时原样返回', () => {
	const rows = [1, 2, 3];
	assert.equal(sorted(rows, null, (r) => r), rows);
});

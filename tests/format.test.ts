import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, formatNum } from '../src/lib/utils/format.ts';

test('formatNum 千位/百万位分档', () => {
	assert.equal(formatNum(0), '0');
	assert.equal(formatNum(999), '999');
	assert.equal(formatNum(1500), '1.5K');
	assert.equal(formatNum(2_400_000), '2.4M');
});

test('formatNum 负数与正数同档位', () => {
	assert.equal(formatNum(-1500), '-1.5K');
	assert.equal(formatNum(-2_400_000), '-2.4M');
	assert.equal(formatNum(-999), '-999');
});

test('formatNum 非有限值不产生 NaN 字符串', () => {
	assert.equal(formatNum(Number.NaN), '0');
	assert.equal(formatNum(Number.POSITIVE_INFINITY), '0');
});

test('formatBytes 常规档位', () => {
	assert.equal(formatBytes(0), '0 B');
	assert.equal(formatBytes(512), '512 B');
	assert.equal(formatBytes(1536), '1.5 KB');
	assert.equal(formatBytes(1024 ** 3), '1 GB');
	assert.equal(formatBytes(1024 ** 4), '1 TB');
});

test('formatBytes 负数带符号且不出现 NaN/undefined', () => {
	assert.equal(formatBytes(-1), '-1 B');
	assert.equal(formatBytes(-1536), '-1.5 KB');
});

test('formatBytes 小于 1 字节时档位不越界', () => {
	// 回归：abs < 1 时 log 为负，旧实现会取到 sizes[-1] → "NaN undefined"
	assert.equal(formatBytes(0.5), '0.5 B');
	assert.equal(formatBytes(-0.5), '-0.5 B');
});

test('formatBytes 超出 TB 后不再升级档位', () => {
	// sizes 只到 TB，更大的值继续沿用 TB，不会返回 undefined
	assert.match(formatBytes(1024 ** 6), /^[\d.]+ TB$/);
});

test('formatBytes 非有限值兜底', () => {
	assert.equal(formatBytes(Number.NaN), '0 B');
	assert.equal(formatBytes(Number.POSITIVE_INFINITY), '0 B');
});

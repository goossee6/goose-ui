import test from 'node:test';
import assert from 'node:assert/strict';
import {
	activeIndexAt,
	clampIndex,
	deltaToPx,
	foldPos,
	keyTarget,
	selectedAt,
	shortestDelta,
	stripOffsetY,
	wheelStep,
} from '../src/lib/components/ui/wheelMath.ts';

test('foldPos：结果恒落在中段 [n, 2n)', () => {
	for (const n of [24, 60, 4]) {
		for (const p of [-1000, -61, -1, 0, 0.4, 1, 23, 59, 60, 119, 240, 1000]) {
			const r = foldPos(p, n);
			assert.ok(r >= n && r < 2 * n, `foldPos(${p}, ${n}) = ${r} 越界`);
		}
	}
});

test('foldPos：折叠是幂等的，且 0 与整份平移等价', () => {
	assert.equal(foldPos(0, 60), 60);
	assert.equal(foldPos(60, 60), 60);
	assert.equal(foldPos(-1, 60), 119);
	for (const p of [-77, 3.5, 200]) {
		assert.equal(foldPos(foldPos(p, 60), 60), foldPos(p, 60));
	}
	// 空列表没有中段可言
	assert.equal(foldPos(5, 0), 0);
});

test('shortestDelta：59 → 00 只走 +1，不绕整圈', () => {
	assert.equal(shortestDelta(-59, 60), 1);
	assert.equal(shortestDelta(59, 60), -1);
	assert.equal(shortestDelta(0, 60), 0);
	assert.equal(shortestDelta(120, 60), 0);
});

test('shortestDelta：位移绝对值不超过半个周期，正中对半仍取正', () => {
	for (const d of [1, 29, 30, 31, 59, 61, -29, -30, -31, -59, 121]) {
		const r = shortestDelta(d, 60);
		assert.ok(Math.abs(r) <= 30, `shortestDelta(${d}) = ${r}`);
	}
	// 恰好半圈时不再翻符号：翻与不翻一样远，翻过去会让「按住 ↑ 一格」的方向看起来反了
	assert.equal(shortestDelta(30, 60), 30);
	assert.equal(shortestDelta(-30, 60), 30);
});

test('activeIndexAt / selectedAt：条带位置映射到中段格与真实下标', () => {
	assert.equal(activeIndexAt(60, 60), 60);
	assert.equal(selectedAt(60, 60), 0);
	assert.equal(activeIndexAt(119, 60), 119);
	assert.equal(selectedAt(119, 60), 59);
	// 半格按四舍五入吸附，越小越接近下一格
	assert.equal(selectedAt(60.4, 60), 0);
	assert.equal(selectedAt(60.6, 60), 1);
	// 24 小时的列同样成立（末格 → 00 不能越成 24）
	assert.equal(selectedAt(23, 24), 23);
	assert.equal(selectedAt(24, 24), 0);
});

test('stripOffsetY：当前格中心对准容器中心', () => {
	assert.equal(stripOffsetY(60, 36), -(60.5 * 36));
	assert.equal(stripOffsetY(0, 36), -18);
});

test('deltaToPx：像素 / 行 / 页三种 deltaMode', () => {
	assert.equal(deltaToPx(100, 0), 100);
	assert.equal(deltaToPx(3, 1), 48);
	assert.equal(deltaToPx(1, 2), 180);
	assert.equal(deltaToPx(-3, 1), -48);
});

test('wheelStep：触控板按像素推进，不当成整数 tick', () => {
	// 幅度小、间隔十几毫秒 → 按像素走
	const r = wheelStep({ px: 8, deltaMode: 0, gap: 12, tickGap: 150, inGlide: true });
	assert.equal(r.discrete, false);
	assert.equal(r.fresh, false);
	assert.equal(r.cells, 8 / 40);
});

test('wheelStep：传统滚轮慢滚一格就是一格', () => {
	// 停手 400ms 后再滚：重新起步，速度重置成「慢」→ 步长 1
	const r = wheelStep({ px: 100, deltaMode: 0, gap: 400, tickGap: 30, inGlide: false });
	assert.equal(r.fresh, true);
	assert.equal(r.tickGap, 150);
	assert.equal(r.discrete, true);
	assert.equal(r.cells, 1);
});

test('wheelStep：连滚越快步长越大，方向跟着 deltaY 走', () => {
	const slow = wheelStep({ px: 100, deltaMode: 0, gap: 50, tickGap: 150, inGlide: true });
	// tickGap 收敛到 0.4*150 + 0.6*50 = 90 → mul = 1 + (150-90)/150*2 = 1.8
	assert.equal(slow.tickGap, 90);
	assert.equal(slow.cells, 1.8);

	const fast = wheelStep({ px: 100, deltaMode: 0, gap: 10, tickGap: 90, inGlide: true });
	assert.ok(fast.cells > slow.cells, '间隔越短步长应越大');

	const up = wheelStep({ px: -100, deltaMode: 0, gap: 400, tickGap: 150, inGlide: false });
	assert.equal(up.cells, -1, '向上滚必须是负的格数');
});

test('wheelStep：大幅 delta 按 tick 数放大，且至少一格', () => {
	const r = wheelStep({ px: 300, deltaMode: 0, gap: 30, tickGap: 30, inGlide: true });
	// tickGap → 0.4*30 + 0.6*30 = 30 → mul = 1 + 0.8*2 = 2.6；3 个 tick
	assert.equal(r.tickGap, 30);
	assert.equal(r.cells, 3 * 2.6);
	// 极小的「大间隔」不会把步长压到 0
	const tiny = wheelStep({ px: 40, deltaMode: 0, gap: 25, tickGap: 400, inGlide: true });
	assert.ok(tiny.cells >= 1);
});

test('keyTarget：方向键 / 翻页 / Home / End 都落在中段', () => {
	assert.equal(keyTarget('ArrowDown', 60, 60), 61);
	assert.equal(keyTarget('ArrowUp', 60, 60), 59);
	assert.equal(keyTarget('PageDown', 62, 60), 67);
	assert.equal(keyTarget('PageUp', 62, 60), 57);
	// Home / End 给的是中段两端：给 0 / n-1 会被下一次 foldPos 折到别处
	assert.equal(keyTarget('Home', 90, 60), 60);
	assert.equal(keyTarget('End', 60, 60), 119);
	assert.equal(keyTarget('a', 60, 60), null);
});

test('clampIndex：真实下标钳在 [0, n-1]', () => {
	assert.equal(clampIndex(-3, 24), 0);
	assert.equal(clampIndex(30, 24), 23);
	assert.equal(clampIndex(7, 24), 7);
});

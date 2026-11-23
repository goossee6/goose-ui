/**
 * 滚轮定位 / 滚轮输入 / 键盘步进的纯数学。
 *
 * 从 `Wheel.svelte` 里提出来，只为一件事：这些函数**错了不会报错，只会手感变差**
 * （59 → 00 绕一整圈、慢滚一格变三格、滚轮和触控板判反），靠肉眼在浏览器里看
 * 极难发现；写成纯函数就能在 `node --test` 里钉死。
 *
 * 全部函数都是「显式传 n（条目数）」的，不读组件状态：同一个函数三列复用
 * （时 / 分 / 秒的 n 分别是 24 / 60 / 60），独立可测。
 */

/** 三份内容：可见窗口恒落在中段 */
export const COPIES = 3;
/** 一次标准滚轮 tick 的 deltaY：Chrome/Windows 是 100 */
export const TICK_PX = 100;
/** 触控板按像素推进，多少 px 折一格（比 36 稍钝，配合平滑不至于滑过头） */
export const PAD_PX_PER_CELL = 40;

/** deltaMode 的像素折算：1 行 ≈ 16px，1 页 ≈ 180px */
export function deltaToPx(deltaY: number, deltaMode: number): number {
	return deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? 180 : 1);
}

/**
 * 把位置折叠回中段 `[n, 2n)`。
 *
 * 归一只做「整份平移」：坐标变了，画面一模一样（三份内容重复），所以既不用在
 * 到头时补位，复位时也不会跳一下。`n = 0` 时返回 0 —— 空列表没有中段可言。
 */
export function foldPos(p: number, n: number): number {
	if (!n) return 0;
	return (((p % n) + n) % n) + n;
}

/** 真实下标钳到 `[0, n-1]`；空列表给 0 */
export function clampIndex(i: number, n: number): number {
	return Math.max(0, Math.min(Math.max(0, n - 1), i));
}

/**
 * 到某个条带位置的最短位移。
 *
 * 同一个值在三份里各出现一次，`59 → 00` 必须走 +1 而不是 −59：
 * 少了这一步，分钟从 59 往上滚会倒着转一整圈。
 */
export function shortestDelta(d: number, n: number): number {
	if (!n) return 0;
	let x = ((d % n) + n) % n;
	if (x > n / 2) x -= n;
	return x;
}

/** 条带位置 → 落在中段的那一格 */
export function activeIndexAt(pos: number, n: number): number {
	return n ? Math.round(foldPos(pos, n)) : 0;
}

/** 条带位置 → 真实下标（中段偏移 −n 后取模） */
export function selectedAt(pos: number, n: number): number {
	if (!n) return 0;
	const active = activeIndexAt(pos, n);
	return ((active % n) + n) % n;
}

/** 条带位移：让当前格的中心对准容器中心 */
export function stripOffsetY(pos: number, itemH: number): number {
	return -((pos + 0.5) * itemH);
}

export interface WheelStepInput {
	/** 已按 deltaMode 折算成像素的 deltaY */
	px: number;
	/** 原始 deltaMode，用于区分「行/页」这类整数步进设备 */
	deltaMode: number;
	/** 距上一次 tick 的毫秒数 */
	gap: number;
	/** 平滑后的历史间隔（停手时 ≈150） */
	tickGap: number;
	/** 上一次 tick 是否还在滑行 */
	inGlide: boolean;
}

export interface WheelStepResult {
	/** 本次推进的格数。可带小数：连续加速靠它，吸附留到停稳时统一做 */
	cells: number;
	/** 归一化后的间隔，交给下一次调用 */
	tickGap: number;
	/** 是否重新起步：停手 320ms 以上，或上一轮已落定 → 目标从当前位置起算，不留残量 */
	fresh: boolean;
	/** 是否按「整数 tick」处理（传统滚轮）；否 = 按像素推进（触控板） */
	discrete: boolean;
}

/**
 * 一次滚轮事件该推进几格。
 *
 * 两类设备的判据是「单次幅度大 + 间隔长」：传统滚轮一个 tick 就是 100px、
 * 间隔几十毫秒；触控板一次只有几像素、十几毫秒一次。混为一谈的话，
 * 触控板会被当成「一次滚一格」而疯狂加速，滚轮则慢得像卡住。
 */
export function wheelStep(i: WheelStepInput): WheelStepResult {
	const fresh = i.gap > 320 || !i.inGlide;
	const tickGap = fresh ? 150 : i.tickGap * 0.4 + i.gap * 0.6;

	const mag = Math.abs(i.px);
	const dir = Math.sign(i.px);
	const discrete = mag >= 40 && (i.deltaMode !== 0 || i.gap > 24);

	let cells: number;
	if (discrete) {
		// 慢滚一格走一格；连滚越快步长越大（上限 3 格/tick），0-59 才不至于划半天
		const mul = 1 + (Math.max(0, 150 - Math.min(tickGap, 150)) / 150) * 2;
		const ticks = Math.max(1, Math.round(mag / TICK_PX));
		cells = dir * Math.max(1, ticks * mul);
	} else {
		cells = i.px / PAD_PX_PER_CELL;
	}
	return { cells, tickGap, fresh, discrete };
}

/**
 * 键盘步进的目标条带位置；不认识的键返回 null（调用方不要 preventDefault）。
 *
 * Home / End 落在中段两端，不是 `0` / `n-1`：中段之外的位置会被下一次
 * `foldPos` 折回去，视觉上就是「按 End 反而跳到别的值」。
 */
export function keyTarget(key: string, activeIdx: number, n: number): number | null {
	switch (key) {
		case 'ArrowUp':
			return activeIdx - 1;
		case 'ArrowDown':
			return activeIdx + 1;
		case 'PageUp':
			return activeIdx - 5;
		case 'PageDown':
			return activeIdx + 5;
		case 'Home':
			return n;
		case 'End':
			return n * 2 - 1;
		default:
			return null;
	}
}

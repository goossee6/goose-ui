/**
 * 浮层定位统一实现：fixed 定位 + 视口坐标 + 越界钳位 + 空间不足翻转。
 * 替换各组件中重复的 getBoundingClientRect + 手写 top/left 拼接逻辑。
 */

export interface FloatingRect {
	left: number;
	right: number;
	top: number;
	bottom: number;
	width: number;
	height: number;
}

export interface FloatingOptions {
	/** 面板期望宽度（用于水平钳位与 width 输出）；不传则不输出 width，仅钳位 left */
	panelW?: number;
	/** 面板期望高度（翻转判断与 max-height 上限）；不传则不翻转也不输出 max-height */
	panelH?: number;
	/** 触发器与面板间距，默认 6 */
	gap?: number;
	/** 视口边缘留白，默认 8 */
	edge?: number;
	/** 优先展示方向，默认 'bottom'（下方容不下且上方能容时翻上） */
	prefer?: 'bottom' | 'top';
	/** 侧弹模式（左右），忽略 prefer/翻转，垂直居中 */
	side?: 'left' | 'right';
	/** @internal 侧弹时用于计算垂直居中，缺省用 window 尺寸 */
	vw?: number;
	vh?: number;
}

export interface FloatingResult {
	/** 内联样式片段（top/bottom/left[/width][/max-height]），不含 position/z-index */
	style: string;
	/** true = 面板位于触发器上方 */
	flipUp: boolean;
}

export function floatingPosition(rect: FloatingRect, opts: FloatingOptions = {}): FloatingResult {
	const vw = opts.vw ?? window.innerWidth;
	const vh = opts.vh ?? window.innerHeight;
	const gap = opts.gap ?? 6;
	const edge = opts.edge ?? 8;
	const { panelW, panelH } = opts;

	// ── 水平 ──
	let left = rect.left;
	if (panelW !== undefined) {
		if (left + panelW > vw - edge) left = vw - edge - panelW;
		if (left < edge) left = edge;
	} else if (left < edge) {
		left = edge;
	}

	// ── 侧弹：垂直居中 + 钳位 ──
	if (opts.side) {
		const sideGap = 4;
		let style: string;
		if (opts.side === 'left') {
			if (rect.left - sideGap - (panelW ?? 0) < edge) {
				style = `left: ${rect.right + sideGap}px; right: auto;`;
			} else {
				style = `right: ${vw - rect.left + sideGap}px; left: auto;`;
			}
		} else {
			if (rect.right + sideGap + (panelW ?? 0) > vw - edge) {
				style = `right: ${vw - rect.left + sideGap}px; left: auto;`;
			} else {
				style = `left: ${rect.right + sideGap}px; right: auto;`;
			}
		}
		const h = panelH ?? 0;
		const center = rect.top + rect.height / 2;
		let top = center - h / 2;
		if (top < edge) top = edge;
		if (top + h > vh - edge) top = Math.max(edge, vh - edge - h);
		style += ` top: ${top}px; bottom: auto;`;
		if (panelW !== undefined) style += ` width: ${panelW}px;`;
		if (panelH !== undefined) {
			const maxAvail = opts.side === 'left' ? vw - rect.right - sideGap - edge : rect.left - sideGap - edge;
			style += ` max-height: ${Math.max(80, Math.min(panelH, maxAvail))}px;`;
		}
		return { style, flipUp: false };
	}

	// ── 垂直翻转 ──
	if (panelH === undefined) {
		// 无高度信息：固定下方
		return {
			style: `top: ${rect.bottom + gap}px; bottom: auto; left: ${left}px;${panelW !== undefined ? ` width: ${panelW}px;` : ''}`,
			flipUp: false,
		};
	}
	const spaceBelow = vh - rect.bottom - gap - edge;
	const spaceAbove = rect.top - gap - edge;
	const fitBelow = spaceBelow >= panelH;
	const fitAbove = spaceAbove >= panelH;
	const prefer = opts.prefer ?? 'bottom';
	let flipUp: boolean;
	if (prefer === 'bottom') flipUp = !fitBelow && fitAbove;
	else flipUp = fitAbove || !fitBelow;

	// 当前侧可用空间做 max-height 兜底（内容再长也不溢出视口）
	const avail = flipUp ? spaceAbove : spaceBelow;
	const maxH = Math.max(80, Math.min(panelH, avail));

	const style = flipUp
		? `top: auto; bottom: ${vh - rect.top + gap}px; left: ${left}px;`
		: `top: ${rect.bottom + gap}px; bottom: auto; left: ${left}px;`;
	return {
		style: `${style}${panelW !== undefined ? ` width: ${panelW}px;` : ''} max-height: ${maxH}px;`,
		flipUp,
	};
}

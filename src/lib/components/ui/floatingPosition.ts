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
	/** 触发器与面板间距，默认 8 */
	gap?: number;
	/** 视口边缘留白，默认 8 */
	edge?: number;
	/** 优先展示方向，默认 'bottom'（下方容不下且上方能容时翻上） */
	prefer?: 'bottom' | 'top';
	/**
	 * 横向对齐：相对触发器左边缘 'start'（默认，行为不变）、居中 'center'、右边缘 'end'。
	 * 三种对齐都会做视口钳位。
	 */
	align?: 'start' | 'center' | 'end';
	/**
	 * 翻转判定策略：
	 * - 'fit'（默认）：仅当优先侧放不下**且**对侧放得下时才翻转；
	 * - 'space'：对侧可用空间比优先侧大就翻转（面板比两侧都高时选空间更大的一侧）。
	 */
	flip?: 'fit' | 'space';
	/**
	 * 是否把 panelH 钳成当前侧可用空间并输出 max-height，默认 true。
	 * 传 false 可保持「只定位、不限制面板高度」的旧行为。
	 */
	capHeight?: boolean;
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
	/** 面板左边缘（视口坐标，已钳位） */
	left: number;
	/** 面板上边缘（视口坐标，已钳位） */
	top: number;
	/** 判定出的面板高度上限（px）；未传 panelH 时为 undefined */
	maxHeight?: number;
}

export function floatingPosition(rect: FloatingRect, opts: FloatingOptions = {}): FloatingResult {
	const vw = opts.vw ?? window.innerWidth;
	const vh = opts.vh ?? window.innerHeight;
	const gap = opts.gap ?? 8;
	const edge = opts.edge ?? 8;
	const { panelW, panelH } = opts;

	// ── 水平 ──
	let left = rect.left;
	if (opts.align === 'center') left = rect.left + rect.width / 2 - (panelW ?? 0) / 2;
	else if (opts.align === 'end') left = rect.right - (panelW ?? 0);
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
		let maxHeight: number | undefined;
		if (panelH !== undefined) {
			const maxAvail = opts.side === 'left' ? vw - rect.right - sideGap - edge : rect.left - sideGap - edge;
			maxHeight = Math.max(80, Math.min(panelH, maxAvail));
			style += ` max-height: ${maxHeight}px;`;
		}
		const sideLeft = /left: ([\d.-]+)px/.exec(style);
		return {
			style,
			flipUp: false,
			left: sideLeft ? Number(sideLeft[1]) : edge,
			top,
			maxHeight,
		};
	}

	// ── 垂直翻转 ──
	if (panelH === undefined) {
		// 无高度信息：固定下方
		const top = rect.bottom + gap;
		return {
			style: `top: ${top}px; bottom: auto; left: ${left}px;${panelW !== undefined ? ` width: ${panelW}px;` : ''}`,
			flipUp: false,
			left,
			top,
		};
	}
	const spaceBelow = vh - rect.bottom - gap - edge;
	const spaceAbove = rect.top - gap - edge;
	const prefer = opts.prefer ?? 'bottom';
	const fitBelow = spaceBelow >= panelH;
	const fitAbove = spaceAbove >= panelH;
	let flipUp: boolean;
	if (opts.flip === 'space') {
		// 宽松：优先侧放不下、对侧放得下就翻；两侧都放不下（或都放得下）时选空间更大的一侧。
		// 不能直接比大小：面板比两侧都高时比大小会把面板翻到空间稍大但同样放不下的一侧，
		// 反而越出视口（LinkPreview 卡片高于两侧可用空间时曾出现 top:-64）。
		if (prefer === 'bottom') flipUp = !fitBelow && fitAbove ? true : spaceAbove > spaceBelow;
		else flipUp = !fitAbove && fitBelow ? true : spaceAbove < spaceBelow;
	} else {
		// 严格（默认）
		flipUp = prefer === 'bottom' ? !fitBelow && fitAbove : fitAbove || !fitBelow;
	}

	// 当前侧可用空间做 max-height 兜底（内容再长也不溢出视口）
	const avail = flipUp ? spaceAbove : spaceBelow;
	const maxH = Math.max(80, Math.min(panelH, avail));
	const cap = opts.capHeight === false ? '' : ` max-height: ${maxH}px;`;

	const top0 = flipUp ? rect.top - gap - panelH : rect.bottom + gap;
	// capHeight=false 时组件不会用 max-height 兜底，必须把 top 钳进视口，
	// 否则会返回「贴底」式的负坐标（CSS bottom 定位成立，但组件拿 top 当视觉坐标就飞到视口外）。
	const top = opts.capHeight === false
		? Math.max(edge, Math.min(top0, vh - edge - panelH))
		: top0;
	const style = flipUp
		? `top: auto; bottom: ${vh - rect.top + gap}px; left: ${left}px;`
		: `top: ${rect.bottom + gap}px; bottom: auto; left: ${left}px;`;
	return {
		style: `${style}${panelW !== undefined ? ` width: ${panelW}px;` : ''}${cap}`,
		flipUp,
		left,
		top,
		maxHeight: opts.capHeight === false ? undefined : maxH,
	};
}

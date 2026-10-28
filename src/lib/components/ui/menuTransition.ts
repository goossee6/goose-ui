/**
 * 浮层（菜单 / 下拉 / 气泡 / 预览卡）统一的进出场动效。
 *
 * 为什么集中成一处：这些浮层散在十几个组件里，原先要么各抄一份
 * 「淡入 + 上移 4px」的 css 回调，要么干脆没有（Select / MultiSelect /
 * CreatableSelect / Combobox / TimePicker、右键菜单只有透明度）。
 * 结果同一个界面里，点不同的入口手感并不一致，而且很容易只补了进入、
 * 忘了离开。现在统一成一条曲线，改手感只改这里。
 *
 * 动效本身刻意做得很轻：
 * - 进入 120ms：透明度 0→1、位移 6px→0、缩放 0.96→1。
 *   缩放原点贴在**触发器那一侧**（面板在下方就从顶边展开，在上方就从底边），
 *   这样看起来是「从按钮里长出来」，而不是从中心膨胀。
 * - 离开 80ms：更短、只做透明度与一半幅度的位移，不做缩放。
 *   菜单是点一下就没的东西，出场拖太久会盖住下一次点击的目标。
 *
 * 用法（两个指令配合，而不是 `transition:`）：
 *   in:menuIn={{ up: flipUp }}  out:menuOut={{ up: flipUp }}
 * 分开写是因为进出时长不同；`transition:` 只能给一个 duration。
 *
 * 关闭期间的语义不变：Svelte 的 transition 只延后 DOM 移除，`open=false`
 * 立刻生效，外点判断、焦点恢复、aria-expanded 都不受影响。
 *
 * prefers-reduced-motion：时长归零（仍然走一遍 transition 生命周期）。
 * 不直接 `return {}` 跳过，是为了让 DOM 移除时序和动画版保持一致——
 * 否则「减少动效」的用户会走进一条没人测过的分支。
 */

export interface MenuPopParams {
	/** 面板在触发器上方（向上翻转）。位移方向与缩放锚边都随之反向。 */
	up?: boolean;
	/** 水平锚边，决定缩放原点：'start' 从左边展开（默认），'end' 从右边。 */
	align?: 'start' | 'end' | 'center';
	/** 位移距离（px），默认 6。 */
	distance?: number;
	/** 起始缩放，默认 0.96；传 1 等于关掉缩放。 */
	scale?: number;
}

/** 进入时长（ms）。 */
const ENTER_MS = 120;
/** 离开时长（ms）。比进入短，避免挡住下一次点击。 */
const EXIT_MS = 80;

function prefersReducedMotion(): boolean {
	return typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
}

/** 缩放原点：垂直贴触发器一侧，水平按对齐方式。 */
function originOf(p: MenuPopParams): string {
	const vertical = p.up ? 'bottom' : 'top';
	const horizontal = p.align === 'end' ? 'right' : p.align === 'center' ? 'center' : 'left';
	return `${vertical} ${horizontal}`;
}

export function menuIn(_node: HTMLElement, params: MenuPopParams = {}) {
	const scale = params.scale ?? 0.96;
	const distance = params.distance ?? 6;
	const origin = originOf(params);

	return {
		duration: prefersReducedMotion() ? 0 : ENTER_MS,
		// transform-origin 必须写在 css 回调里，不能只在函数体里 node.style 设一次：
		// 这些面板的 style 是 Svelte 表达式（`style="left:{x}px;top:{y}px"`），
		// 定位在打开后还会被写一次，整条 style 属性被覆盖，一次性设的原点就没了。
		// 每帧输出一次，代价是一次 setProperty，换来的是定位更新也不会把原点抹掉。
		css: (t: number) => {
			const dy = (1 - t) * (params.up ? distance : -distance);
			const s = 1 - (1 - t) * (1 - scale);
			return `opacity:${t};transform:translateY(${dy.toFixed(3)}px) scale(${s.toFixed(4)});transform-origin:${origin};`;
		},
	};
}

export function menuOut(_node: HTMLElement, params: MenuPopParams = {}) {
	const distance = params.distance ?? 6;
	const origin = originOf(params);

	return {
		duration: prefersReducedMotion() ? 0 : EXIT_MS,
		css: (t: number) => {
			// t 从 1 走到 0；只回退一半位移，退场幅度比入场小，看着更「收」。
			const dy = (1 - t) * (params.up ? distance : -distance) * 0.5;
			return `opacity:${t};transform:translateY(${dy.toFixed(3)}px);transform-origin:${origin};`;
		},
	};
}

<script lang="ts">
	let {
		container = null,
		itemSelector = '',
		activeSelector = '',
		disabledMatch = ':disabled',
		showSelected = true,
		variant = 'box',
		insetX,
		background = 'transparent',
		hoverBackground = 'var(--hover)',
		radius = 'var(--radius-md)',
		shadow = '',
		disabled = false,
	}: {
		/** 容器：测量参照 + hover 事件挂载点（通常 bind:this 的定位/滚动容器） */
		container?: HTMLElement | null;
		/** hover 目标项选择器（closest 委托） */
		itemSelector?: string;
		/** 选中项选择器；缺省或查不到 → 选中 pill 隐藏 */
		activeSelector?: string;
		/** 禁用项匹配（hover 跳过） */
		disabledMatch?: string;
		/** 是否渲染选中 pill（多选分组等场景关闭） */
		showSelected?: boolean;
		/** box = 四边随项；line = 底部指示线（仅 left/width） */
		variant?: 'box' | 'line';
		/** 横向内缩：left=insetX，width=容器宽-2×insetX（替代项的 x 几何） */
		insetX?: number;
		/** 选中 pill 底色 */
		background?: string;
		/** hover pill 底色 */
		hoverBackground?: string;
		/** 圆角（line 变体固定 1px，忽略此值） */
		radius?: string;
		/** 选中 pill 阴影 */
		shadow?: string;
		/** 选中 pill 减淡（整组禁用时） */
		disabled?: boolean;
	} = $props();

	// 几何与可见性分离：隐藏只翻可见性，保留最后几何（否则 pill 会回落到 0,0，
	// 下次显示时从顶部飞入）
	let hoverGeom = $state('');
	let hoverOn = $state(false);
	let selectedGeom = $state('');
	let selectedOn = $state(false);
	// 选中 pill 移动时长：按位移距离自适应（近快远慢），写入 --pill-dur 供 transition 读取
	let selectedDur = $state(0.26);
	let selectedBox: Box | null = null;

	const hoverStyle = $derived(`${hoverGeom} opacity: ${hoverOn ? 1 : 0};`);
	const selectedStyle = $derived(
		`${selectedGeom} --pill-dur: ${selectedDur}s; opacity: ${selectedOn ? (disabled ? 0.5 : 1) : 0};`
	);

	const hoverBase = $derived(
		`background: ${hoverBackground};${variant === 'line' ? '' : ` border-radius: ${radius};`}`
	);
	const selectedBase = $derived(
		`background: ${background};${variant === 'line' ? '' : ` border-radius: ${radius};`}${
			shadow ? ` box-shadow: ${shadow};` : ''
		}`
	);

	// 视口 rect + 容器滚动量 → 内容坐标（相对 padding edge）：
	// 非滚动容器与 offset 等价；滚动/sticky 项（如吸顶分组头）位置正确；扣 clientLeft/Top 消除边框偏差
	type Box = { l: number; t: number; w: number; h: number };

	function measureBox(el: HTMLElement): Box | null {
		if (!container) return null;
		const er = el.getBoundingClientRect();
		const cr = container.getBoundingClientRect();
		const l = er.left - cr.left + container.scrollLeft - container.clientLeft;
		const t = er.top - cr.top + container.scrollTop - container.clientTop;
		// line：t/h 恒 0（只有 left 动）；insetX：l/w 恒定（只有 top 动）→ 位移距离自然只含真实移动分量
		if (variant === 'line') return { l, t: 0, w: er.width, h: 0 };
		if (insetX !== undefined) {
			return {
				l: insetX,
				t,
				w: Math.max(container.clientWidth - insetX * 2, 0),
				h: er.height,
			};
		}
		return { l, t, w: er.width, h: er.height };
	}

	function boxStyle(b: Box): string {
		if (variant === 'line') return `left: ${b.l}px; width: ${b.w}px;`;
		return `left: ${b.l}px; top: ${b.t}px; width: ${b.w}px; height: ${b.h}px;`;
	}

	function geometry(el: HTMLElement): string {
		const b = measureBox(el);
		return b ? boxStyle(b) : '';
	}

	function measureSelected() {
		if (!container || !showSelected || !activeSelector) {
			selectedOn = false;
			return;
		}
		const el = container.querySelector<HTMLElement>(activeSelector);
		if (!el) {
			selectedOn = false;
			return;
		}
		const box = measureBox(el);
		if (!box) {
			selectedOn = false;
			return;
		}
		// box 未变（340ms 补测/重复触发）不重算，否则 d=0 会把时长重置为下限，飞行中途改写 transition
		if (selectedBox && (box.l !== selectedBox.l || box.t !== selectedBox.t || box.w !== selectedBox.w || box.h !== selectedBox.h)) {
			const d = Math.hypot(box.l - selectedBox.l, box.t - selectedBox.t);
			selectedDur = Math.min(0.4, Math.max(0.18, 0.16 + d / 1200));
		}
		selectedBox = box;
		selectedGeom = boxStyle(box);
		selectedOn = true;
	}

	let raf = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	function scheduleMeasure() {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(measureSelected);
		// 过渡动画（slide/宽度变化）期间布局渐变，收尾后按最终布局补测
		clearTimeout(timer);
		timer = setTimeout(measureSelected, 340);
	}

	// 选中项变化（class/子节点增删）→ rAF 合帧重测；props 变化 → 同步重测
	$effect(() => {
		measureSelected();
	});

	$effect(() => {
		const c = container;
		if (!c) return;
		const mo = new MutationObserver(scheduleMeasure);
		mo.observe(c, { subtree: true, childList: true, attributeFilter: ['class'] });
		return () => {
			mo.disconnect();
			cancelAnimationFrame(raf);
			clearTimeout(timer);
		};
	});

	// hover 委托：挂原生监听（无模板事件 → 无 a11y warning）
	$effect(() => {
		const c = container;
		const sel = itemSelector;
		if (!c || !sel) return;
		const onOver = (e: PointerEvent) => {
			const target = e.target as HTMLElement | null;
			const item = target?.closest?.<HTMLElement>(sel) ?? null;
			if (!item || !c.contains(item) || (disabledMatch && item.matches(disabledMatch))) {
				hoverOn = false;
				return;
			}
			hoverGeom = geometry(item);
			hoverOn = true;
		};
		const onLeave = () => {
			hoverOn = false;
		};
		c.addEventListener('pointerover', onOver);
		c.addEventListener('pointerleave', onLeave);
		return () => {
			c.removeEventListener('pointerover', onOver);
			c.removeEventListener('pointerleave', onLeave);
			hoverOn = false;
		};
	});
</script>

<div
	class="pill-track pill-track--hover"
	class:pill-track--line={variant === 'line'}
	aria-hidden="true"
	style="{hoverBase} {hoverStyle}"
></div>
<div
	class="pill-track pill-track--sel"
	class:pill-track--line={variant === 'line'}
	aria-hidden="true"
	style="{selectedBase} {selectedStyle}"
></div>

<style>
	.pill-track {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 0;
		pointer-events: none;
		transition: opacity 0.15s;
	}
	/* hover：维持原手感（0.22s ease-out） */
	.pill-track--hover {
		transition:
			left 0.22s ease-out,
			top 0.22s ease-out,
			width 0.22s ease-out,
			height 0.22s ease-out,
			opacity 0.15s;
	}
	/* 选中：位移 back-out 过冲回弹 + 距离自适应时长；尺寸 expo-out 柔收（不过冲，避免 insetX/line 宽度越界） */
	.pill-track--sel {
		transition:
			left var(--pill-dur, 0.26s) cubic-bezier(0.34, 1.4, 0.64, 1),
			top var(--pill-dur, 0.26s) cubic-bezier(0.34, 1.4, 0.64, 1),
			width 0.24s cubic-bezier(0.22, 1, 0.36, 1),
			height 0.24s cubic-bezier(0.22, 1, 0.36, 1),
			opacity 0.15s;
	}
	.pill-track--line {
		top: auto;
		bottom: -1px;
		height: 2px;
		border-radius: 1px;
	}
	.pill-track--hover.pill-track--line {
		transition: left 0.22s ease-out, width 0.22s ease-out, opacity 0.15s;
	}
	.pill-track--sel.pill-track--line {
		transition:
			left var(--pill-dur, 0.26s) cubic-bezier(0.34, 1.4, 0.64, 1),
			width 0.24s cubic-bezier(0.22, 1, 0.36, 1),
			opacity 0.15s;
	}
</style>

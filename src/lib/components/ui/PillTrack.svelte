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

	// 几何与可见性分离：几何持久、隐藏只翻 opacity，避免下次显示时从 0,0 飞入。
	// 但残留几何必须落在容器内容起点：绝对定位元素即使 opacity:0 仍参与 scroll 范围计算
	// （transform / contain:layout 均无效，只有 display:none 才行，而那会打断过渡），
	// 隐藏时把 box 收敛到 (0,0,0,0)，既保留"不回落到 nil"的性质，也不会撑大 scrollHeight。
	let hoverGeom = $state('');
	let hoverOn = $state(false);
	let hoverBg = $state('');
	let selectedGeom = $state('');
	let selectedOn = $state(false);
	// 选中 pill 移动时长：按位移距离自适应（近快远慢），写入 --pill-dur 供 transition 读取
	let selectedDur = $state(0.26);
	let selectedBox: Box | null = null;
	// 从停放位恢复：当帧不播位移过渡（否则 pill 会从左上角飞过来）
	let restoring = $state(false);
	let hoverRestoring = $state(false);

	const hoverStyle = $derived(
		`${hoverGeom} opacity: ${hoverOn ? 1 : 0};` + (hoverRestoring ? ' transition: none;' : '')
	);
	const selectedStyle = $derived(
		`${selectedGeom} --pill-dur: ${selectedDur}s; opacity: ${selectedOn ? (disabled ? 0.5 : 1) : 0};` +
			(restoring ? ' transition: none;' : '')
	);

	const hoverBase = $derived(
		`background: ${hoverBg || hoverBackground};${variant === 'line' ? '' : ` border-radius: ${radius};`}`
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

	// 停放几何：绝对定位元素即使 opacity:0 仍撑大容器的 scroll 范围（实测 transform /
	// contain:layout / visibility:hidden 均无效，只有 display:none 行，但那会打断过渡）。
	// Sidebar 收起等场景下，旧坐标留在原地会把容器撑到上千像素、凭空多出滚动条，
	// 故淡出结束后把 box 收敛到内容起点 —— 这也是避免"下次显示从 0,0 飞入"所需的停放位。
	const PARKED = 'left: 0px; top: 0px; width: 0px; height: 0px;';

	// 淡出尾声（与 opacity 0.15s 对齐）后收敛到停放位；淡出期间若重新显示则取消。
	// hover pill 同样要停放：它也是 absolute，鼠标在展开态停在列表底部的残留坐标
	// （如 top:2318px）同样会把 scrollHeight 撑到上千像素。
	let parkTimer: ReturnType<typeof setTimeout> | undefined;
	let hoverParkTimer: ReturnType<typeof setTimeout> | undefined;

	function schedulePark() {
		clearTimeout(parkTimer);
		parkTimer = setTimeout(() => {
			parkTimer = undefined;
			if (!selectedOn) selectedGeom = PARKED;
		}, 160);
	}

	function scheduleHoverPark() {
		clearTimeout(hoverParkTimer);
		hoverParkTimer = setTimeout(() => {
			hoverParkTimer = undefined;
			if (!hoverOn) hoverGeom = PARKED;
		}, 160);
	}

	function measureSelected() {
		if (!container || !showSelected || !activeSelector) {
			setSelected(false);
			return;
		}
		const el = container.querySelector<HTMLElement>(activeSelector);
		if (!el) {
			setSelected(false);
			return;
		}
		const box = measureBox(el);
		if (!box) {
			setSelected(false);
			return;
		}
		const wasParked = !selectedOn && selectedGeom === PARKED;
		// box 未变（340ms 补测/重复触发）不重算，否则 d=0 会把时长重置为下限，飞行中途改写 transition
		if (selectedBox && (box.l !== selectedBox.l || box.t !== selectedBox.t || box.w !== selectedBox.w || box.h !== selectedBox.h)) {
			const d = wasParked ? 0 : Math.hypot(box.l - selectedBox.l, box.t - selectedBox.t);
			selectedDur = Math.min(0.4, Math.max(0.18, 0.16 + d / 1200));
		}
		selectedBox = box;
		selectedGeom = boxStyle(box);
		// 停放恢复：先禁用过渡落地，下一帧恢复常规过渡
		if (wasParked) {
			restoring = true;
			requestAnimationFrame(() => (restoring = false));
		}
		setSelected(true);
	}

	function setSelected(on: boolean) {
		if (selectedOn === on) return;
		selectedOn = on;
		if (on) clearTimeout(parkTimer);
		else schedulePark();
	}

	// hover 走同一套路：仅在可见性翻转时取消 / 排定停放
	function setHover(on: boolean) {
		if (hoverOn === on) return;
		hoverOn = on;
		if (on) clearTimeout(hoverParkTimer);
		else scheduleHoverPark();
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
			if (!item || !c.contains(item)) {
				// 分割线：保持上一个 pill（跨分割线移动不断档），仅真正离开容器才隐藏
				if (target?.closest?.('[role="separator"]')) return;
				setHover(false);
				return;
			}
			if (disabledMatch && item.matches(disabledMatch)) {
				setHover(false);
				return;
			}
			// 停放恢复：当帧不播位移过渡，避免从左上角飞过来
			const wasParked = !hoverOn && hoverGeom === PARKED;
			hoverGeom = geometry(item);
			hoverBg = item.dataset.pillBg ?? '';
			if (wasParked) {
				hoverRestoring = true;
				requestAnimationFrame(() => (hoverRestoring = false));
			}
			setHover(true);
		};
		const onLeave = () => {
			setHover(false);
			hoverBg = '';
		};
		c.addEventListener('pointerover', onOver);
		c.addEventListener('pointerleave', onLeave);
		return () => {
			c.removeEventListener('pointerover', onOver);
			c.removeEventListener('pointerleave', onLeave);
			setHover(false);
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
	/* hover：维持原手感（0.22s ease-out）+ 背景色 0.15s 缓动 */
	.pill-track--hover {
		transition:
			left 0.22s ease-out,
			top 0.22s ease-out,
			width 0.22s ease-out,
			height 0.22s ease-out,
			background-color 0.15s,
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

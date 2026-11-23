<script lang="ts">
	import { untrack } from 'svelte';
	import {
		COPIES,
		activeIndexAt,
		clampIndex,
		deltaToPx,
		foldPos,
		keyTarget,
		selectedAt,
		shortestDelta,
		stripOffsetY,
		wheelStep,
	} from './wheelMath';

	const ITEM_H = 36;

	let {
		items = [],
		index = 0,
		ariaLabel = '',
		onSettle,
	}: {
		items?: string[];
		index?: number;
		ariaLabel?: string;
		onSettle?: (index: number) => void;
	} = $props();

	let boxEl = $state<HTMLElement | null>(null);
	/**
	 * 条带位置，单位「格」，浮点。
	 * 所有写入都过 norm()，恒落在中段 [N, 2N)：平移恰好一整份，画面一模一样，
	 * 所以既没有「到头要补位」，也没有「复位时跳一下」——位置本身是连续的，只是坐标被折叠。
	 */
	let pos = $state(0);

	const N = $derived(items.length);
	const strip = $derived(N ? Array(COPIES).fill(items).flat() : []);
	/** 归一化后的位置：初值 pos=0 也落在中段，首帧不会闪一屏空白 */
	const cur = $derived(norm(pos));
	/** 条带整体位移：让 cur 那一格的中心对准容器中心 */
	const offsetY = $derived(stripOffsetY(cur, ITEM_H));
	const activeIdx = $derived(activeIndexAt(pos, N));
	const sel = $derived(selectedAt(pos, N));

	let raf = 0;
	let wheelTimer: ReturnType<typeof setTimeout> | null = null;
	/** 滚轮自己的目标位置（格，已归一化）。只在 glide() 里被消费，其他入口不碰它 */
	let wGoal = 0;
	/** 上一次滚轮 tick 的时间戳 + 平滑后的间隔，用来判断「慢滚」还是「快滚」 */
	let lastTick = 0;
	let tickGap = 0;
	let inGlide = false;
	/** 已提交的真实下标，用来判重 */
	let lastEmitted = -1;
	/** 上一次处理过的外部 index：区分「父级回灌我刚发出的值」和「真的改了值」 */
	let seenIndex = -1;

	/** 把位置折叠回中段：±N 是整份平移，内容重复，视觉等价（数学见 wheelMath.ts） */
	function norm(p: number) {
		return foldPos(p, N);
	}

	function clampReal(i: number) {
		return clampIndex(i, N);
	}

	/** 到某个条带位置的最短位移：同一个值可能出现在三份里，别为了它绕一整圈 */
	function wrapDelta(d: number) {
		return shortestDelta(d, N);
	}

	function stopAnim() {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
		inGlide = false;
	}

	/** 停稳：精确对齐到整格，把当前选中值提交出去 */
	function finish() {
		pos = norm(activeIdx);
		if (sel !== lastEmitted) {
			lastEmitted = sel;
			seenIndex = sel;
			onSettle?.(sel);
		}
	}

	/** 点选/吸附用：收尾柔和，起步就要跟手 */
	const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
	/** 外部跳转用：两端都缓，从静止滑出、轻轻落位，不会有「弹一下才出发」的突兀 */
	const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

	/**
	 * 平滑滚到某个条带位置。
	 * `target` 可以是任意一份副本里的等价位置：内部取最短位移，不会为了同一个值绕一整圈。
	 * `dur` 不传时按距离估算（点一格约 110ms，甩到对头也不过 240ms）。
	 */
	function animateTo(target: number, dur?: number, ease = easeOutCubic) {
		stopAnim();
		const from = cur;
		const dist = wrapDelta(target - from);
		if (Math.abs(dist) < 0.01) {
			finish();
			return;
		}
		const ms = Math.max(1, dur ?? Math.min(240, 80 + Math.abs(dist) * 32));
		const t0 = performance.now();
		const step = (now: number) => {
			const t = Math.min(1, (now - t0) / ms);
			const e = ease(t);
			pos = norm(from + dist * e);
			if (t < 1) {
				raf = requestAnimationFrame(step);
			} else {
				raf = 0;
				finish();
			}
		};
		raf = requestAnimationFrame(step);
	}

	function settle() {
		animateTo(activeIdx);
	}

	/**
	 * 外部整组改值（点「现在」/ 预设 / 键入回填）：按最短路径滑过去，别瞬移。
	 * 距离越远时间越长，但封顶 480ms —— 0-59 从 59 绕到 00 也只滑一格，不会转完一圈。
	 */
	function glideTo(target: number) {
		const dist = Math.abs(wrapDelta(target - cur));
		animateTo(target, Math.min(480, 150 + dist * 16), easeInOutCubic);
	}

	/** 松手后的惯性：速度在格坐标系里积分，位置永远不撞墙，成不了「尽头」 */
	function fling() {
		stopAnim();
		let v = vel;
		let prev = performance.now();
		const step = (now: number) => {
			const dt = Math.min(32, now - prev);
			prev = now;
			v *= Math.exp(-dt / 165);
			pos = norm(cur + (v * dt) / ITEM_H);
			if (Math.abs(v) > 0.02) {
				raf = requestAnimationFrame(step);
			} else {
				raf = 0;
				settle();
			}
		};
		raf = requestAnimationFrame(step);
	}

	let pid = -1;
	let dragStartY = 0;
	let lastY = 0;
	let lastT = 0;
	let dragMoved = false;
	let vel = 0;
	let suppressClick = false;

	/**
	 * 指针是否还压在这个滚轮上。
	 * 横向只留 20px：三列滚轮并排，横向离开本列基本就是去拖旁边的控件了，必须立刻停手；
	 * 纵向留 64px：拖拽时手/鼠标越过上下沿很常见，留一点宽容不至于刚出头就断。
	 */
	function insideBox(x: number, y: number): boolean {
		if (!boxEl) return false;
		const r = boxEl.getBoundingClientRect();
		return x >= r.left - 20 && x <= r.right + 20 && y >= r.top - 64 && y <= r.bottom + 64;
	}

	/** 拖拽中在别处按下（另一个滚轮 / 面板里的按钮）：先停手，别让两列同时跟着动 */
	function onOtherDown(e: PointerEvent) {
		if (e.pointerId !== pid) return;
		if (boxEl && e.target instanceof Node && boxEl.contains(e.target)) return;
		endDrag(false);
	}

	function onPointerDown(e: PointerEvent) {
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		stopAnim();
		if (wheelTimer) {
			clearTimeout(wheelTimer);
			wheelTimer = null;
		}
		pid = e.pointerId;
		dragStartY = lastY = e.clientY;
		lastT = performance.now();
		dragMoved = false;
		vel = 0;
		// 不用 setPointerCapture：捕获后鼠标移到别处仍继续拖这一列，想拖旁边的列会变成继续拖它。
		// 改成 window 上监听 + 离开本控件即停手。
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('pointercancel', onPointerUp);
		window.addEventListener('pointerdown', onOtherDown, true);
	}

	function onPointerMove(e: PointerEvent) {
		if (e.pointerId !== pid) return;
		const dy = e.clientY - lastY;
		if (!dragMoved) {
			if (Math.abs(e.clientY - dragStartY) < 3) return;
			dragMoved = true;
		}
		e.preventDefault();
		const now = performance.now();
		const dt = Math.max(1, now - lastT);
		pos = norm(cur - dy / ITEM_H);
		vel = vel * 0.7 + (-dy / dt) * 0.3;
		lastY = e.clientY;
		lastT = now;
		// 拖出这一列就停手：就地吸附，不再跟着鼠标走
		if (!insideBox(e.clientX, e.clientY)) endDrag(false);
	}

	function onPointerUp(e: PointerEvent) {
		if (e.pointerId !== pid) return;
		endDrag(true);
	}

	function endDrag(withFling: boolean) {
		pid = -1;
		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerup', onPointerUp);
		window.removeEventListener('pointercancel', onPointerUp);
		window.removeEventListener('pointerdown', onOtherDown, true);
		if (!dragMoved) return;
		dragMoved = false;
		// 拖完松手紧跟一次 click，别把它当成「点选某一格」
		suppressClick = true;
		requestAnimationFrame(() => (suppressClick = false));
		if (withFling && Math.abs(vel) > 0.03) fling();
		else {
			vel = 0;
			settle();
		}
	}

	function onItemClick(i: number) {
		if (suppressClick) return;
		stopAnim();
		const goal = N + (((i % N) + N) % N);
		animateTo(cur + wrapDelta(goal - cur));
	}

	/**
	 * 滚轮走「指数趋近」而不是固定时长补间：
	 * 滚轮 tick 是离散事件，用 easeOut 补间时每次重启速度会突增（顿挫）；
	 * 指数趋近的速度天生连续，目标还能随时前移，连滚几个 tick 会合成一条顺滑的运动。
	 */
	function glide() {
		if (inGlide) return;
		inGlide = true;
		let prev = performance.now();
		const step = (now: number) => {
			// 首帧的 dt 可能只有 1~2ms（rAF 紧跟着当前任务），给个下限，起步才不会有一下"顿"
			const dt = Math.min(32, Math.max(8, now - prev));
			prev = now;
			const d = wrapDelta(wGoal - cur);
			if (Math.abs(d) < 0.012) {
				inGlide = false;
				raf = 0;
				// 落到最近整格：慢滚 / 触控板可能停在半格上，用一小段补间吸附，不硬跳
				const snap = Math.round(wGoal);
				if (Math.abs(cur - snap) > 0.02) animateTo(cur + wrapDelta(snap - cur));
				else finish();
				return;
			}
			// 落后越多时间常数越小：快滚跟得住，慢滚更柔和
			const tau = Math.abs(d) > 2.5 ? 22 : 46;
			pos = norm(cur + d * (1 - Math.exp(-dt / tau)));
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	}

	function restartWheelTimer() {
		if (wheelTimer) clearTimeout(wheelTimer);
		wheelTimer = setTimeout(() => {
			wheelTimer = null;
			// glide 还在收尾就别打断，它落定时自己会吸附并提交
			if (!inGlide) settle();
		}, 140);
	}

	function onWheel(e: WheelEvent) {
		if (!N) return;
		e.preventDefault();
		const px = deltaToPx(e.deltaY, e.deltaMode);
		if (!px) return;

		const now = performance.now();
		const gap = lastTick ? now - lastTick : 200;
		lastTick = now;

		const step = wheelStep({ px, deltaMode: e.deltaMode, gap, tickGap, inGlide });
		// 拖拽松手的惯性可能还在跑：先把它停掉，否则它和 glide 会同时改 pos。
		// 必须在 wheelStep 之后 —— 它会清掉 inGlide，先清就永远判成「重新起步」
		stopAnim();
		// 停手之后又滚，或上一轮已落定：目标从当前位置重新起步，不留残量。
		// 上一轮停手的间隔（可能几百毫秒）也不代表滚动速度，重置成「慢」而不是沿用
		if (step.fresh) wGoal = cur;
		tickGap = step.tickGap;

		wGoal = norm(wGoal + step.cells);
		glide();
		restartWheelTimer();
	}

	function onKeydown(e: KeyboardEvent) {
		if (!N) return;
		const target = keyTarget(e.key, activeIdx, N);
		if (target === null) return;
		e.preventDefault();
		stopAnim();
		animateTo(target);
	}

	// 外部值（打开面板 / 回填 / 预设）滑到对应位置；自己发出的值被父级回灌时不动，
	// 否则会把用户刚滑到的位置拽回去
	$effect(() => {
		if (!N) return;
		const want = clampReal(index);
		if (seenIndex < 0) {
			// 首次挂载直接定位：面板刚打开不该从 00 一路滚到当前值
			pos = norm(N + want);
			seenIndex = want;
			lastEmitted = want;
			return;
		}
		if (want === seenIndex) return;
		seenIndex = want;
		lastEmitted = want;
		// 动效里要读当前 pos，用 untrack 挡住 —— 否则这个 effect 会每帧跟着 pos 重跑
		untrack(() => glideTo(N + want));
	});

	// wheel 必须非 passive，才拦得住页面跟着一起滚
	$effect(() => {
		const el = boxEl;
		if (!el) return;
		const onW = (e: WheelEvent) => onWheel(e);
		el.addEventListener('wheel', onW, { passive: false });
		return () => el.removeEventListener('wheel', onW);
	});

	$effect(() => {
		return () => {
			if (raf) cancelAnimationFrame(raf);
			if (wheelTimer) clearTimeout(wheelTimer);
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
			window.removeEventListener('pointercancel', onPointerUp);
			window.removeEventListener('pointerdown', onOtherDown, true);
		};
	});
</script>

<div
	class="wheel"
	style="--wheel-item-h: {ITEM_H}px"
	bind:this={boxEl}
	role="listbox"
	tabindex="0"
	aria-label={ariaLabel}
	onpointerdown={onPointerDown}
	onkeydown={onKeydown}
>
	<div class="wheel-band" aria-hidden="true"></div>
	<div class="wheel-view">
		<div class="wheel-strip" style="transform: translate3d(0, {offsetY}px, 0)">
			{#each strip as item, i (i)}
				{@const inMiddle = i >= N && i < N * 2}
				<button
					type="button"
					class="wheel-item"
					class:center={i === activeIdx}
					role="option"
					aria-selected={i === activeIdx}
					aria-hidden={inMiddle ? undefined : 'true'}
					tabindex="-1"
					onclick={() => onItemClick(i)}
				>
					{item}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.wheel {
		position: relative;
		width: 56px;
		/* 可见窗口 5 格；格高由 JS 的 ITEM_H 通过内联变量下发，避免位移与 CSS 各写一个 36 后走偏 */
		height: calc(var(--wheel-item-h) * 5);
		flex-shrink: 0;
		border-radius: var(--radius-md);
		/* 轮廓用 inset 阴影画：mask 会连边框一起渐隐，边框套在里面上下两截会被吃掉 */
		box-shadow: inset 0 0 0 1px var(--border);
		/* 拖拽由自己接管（transform 位移），别让浏览器把页面一起滚走 */
		touch-action: none;
		user-select: none;
		cursor: grab;
	}
	.wheel:active {
		cursor: grabbing;
	}
	.wheel:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: -2px;
	}
	.wheel-band {
		position: absolute;
		left: var(--space-0-5);
		right: var(--space-0-5);
		top: calc(50% - var(--wheel-item-h) / 2);
		height: var(--wheel-item-h);
		border-radius: var(--radius-sm);
		background: var(--accent-sub);
		border: 1px solid var(--accent-ring);
		pointer-events: none;
		z-index: 0;
	}
	.wheel-view {
		position: absolute;
		inset: 0;
		z-index: 1;
		overflow: hidden;
		border-radius: var(--radius-md);
		mask-image: linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%);
	}
	/* 条带每帧只改 transform：一次样式写入、不重排；位移连续，不存在「补位」 */
	.wheel-strip {
		position: absolute;
		top: 50%;
		left: 0;
		width: 100%;
	}
	.wheel-item {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: var(--wheel-item-h);
		border: none;
		background: none;
		font-family: var(--font-mono);
		font-size: var(--fs-13);
		color: var(--text-muted);
		cursor: pointer;
		transition: color 0.15s;
	}
	.wheel-item.center {
		color: var(--primary);
		font-weight: 700;
		font-size: var(--fs-14);
	}
</style>

<script lang="ts">
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

	let el = $state<HTMLElement | null>(null);
	let centerIdx = $state(0);
	let noSnap = $state(false);

	let dragging = false;
	let userScrolling = false;
	let programmatic = false;
	let lastEmitted = 0;
	let quietTimer: ReturnType<typeof setTimeout> | null = null;
	let inertiaRaf = 0;
	let pid = -1;
	let lastY = 0;
	let lastT = 0;
	let dragStartY = 0;
	let dragMoved = false;
	let vel = 0;

	function clampIdx(i: number): number {
		return Math.max(0, Math.min(items.length - 1, i));
	}

	function idxFromScroll(): number {
		return clampIdx(Math.round((el?.scrollTop ?? 0) / ITEM_H));
	}

	// 外部定位（打开/值同步）：静默滚动，不触发 onSettle
	function positionTo(i: number, smooth = false) {
		if (!el) return;
		const want = clampIdx(i);
		programmatic = true;
		userScrolling = false;
		if (quietTimer) clearTimeout(quietTimer);
		centerIdx = want;
		lastEmitted = want;
		if (smooth) noSnap = true;
		el.scrollTo({ top: want * ITEM_H, behavior: smooth ? 'smooth' : 'auto' });
		if (!smooth) {
			requestAnimationFrame(() => {
				programmatic = false;
			});
		}
	}

	// 用户触发的动画滚动（点击/惯性收尾）：停稳后提交
	function flyTo(i: number) {
		if (!el) return;
		userScrolling = true;
		noSnap = true;
		if (quietTimer) clearTimeout(quietTimer);
		el.scrollTo({ top: clampIdx(i) * ITEM_H, behavior: 'smooth' });
		quietTimer = setTimeout(finishUserScroll, 400);
	}

	function finishUserScroll() {
		if (quietTimer) clearTimeout(quietTimer);
		quietTimer = null;
		if (dragging) return; // 按住拖拽中不结算，松手由 pointerup 收尾
		userScrolling = false;
		noSnap = false;
		if (programmatic) return;
		const i = idxFromScroll();
		centerIdx = i;
		if (i !== lastEmitted) {
			lastEmitted = i;
			onSettle?.(i);
		}
	}

	function onScroll() {
		if (!el) return;
		centerIdx = idxFromScroll();
		if (programmatic) return;
		userScrolling = true;
		if (quietTimer) clearTimeout(quietTimer);
		quietTimer = setTimeout(finishUserScroll, 150);
	}

	function onScrollEnd() {
		if (programmatic) {
			programmatic = false;
			return;
		}
		finishUserScroll();
	}

	$effect(() => {
		void el;
		void index;
		if (!el) return;
		const want = clampIdx(index);
		const cur = idxFromScroll();
		if (want !== cur && !userScrolling) positionTo(want, false);
	});

	function startInertia() {
		let v = vel;
		let prev = performance.now();
		const step = (now: number) => {
			const dt = Math.min(32, now - prev);
			prev = now;
			if (!el) return;
			v *= Math.exp(-dt / 180);
			el.scrollTop += v * dt;
			if (Math.abs(v) > 0.05) {
				inertiaRaf = requestAnimationFrame(step);
			} else {
				flyTo(idxFromScroll());
			}
		};
		inertiaRaf = requestAnimationFrame(step);
	}

	function onPointerDown(e: PointerEvent) {
		if (e.pointerType !== 'mouse' || e.button !== 0) return;
		pid = e.pointerId;
		dragStartY = lastY = e.clientY;
		lastT = performance.now();
		dragMoved = false;
		vel = 0;
		if (inertiaRaf) cancelAnimationFrame(inertiaRaf);
	}

	function onPointerMove(e: PointerEvent) {
		if (pid !== e.pointerId || !el) return;
		const dy = e.clientY - lastY;
		if (!dragMoved) {
			if (Math.abs(e.clientY - dragStartY) < 4) return;
			dragMoved = true;
			dragging = true;
			userScrolling = true;
			noSnap = true;
			el.setPointerCapture(pid);
		}
		e.preventDefault();
		const now = performance.now();
		const dt = Math.max(1, now - lastT);
		el.scrollTop -= dy;
		vel = vel * 0.7 + (-dy / dt) * 0.3;
		lastY = e.clientY;
		lastT = now;
	}

	function onPointerUp(e: PointerEvent) {
		if (pid !== e.pointerId) return;
		pid = -1;
		if (!dragMoved) return;
		dragging = false;
		if (inertiaRaf) cancelAnimationFrame(inertiaRaf);
		if (Math.abs(vel) > 0.05) {
			startInertia();
		} else {
			flyTo(idxFromScroll());
		}
	}

	function onItemClick(i: number) {
		if (dragMoved) {
			requestAnimationFrame(() => (dragMoved = false));
			return;
		}
		flyTo(i);
	}

	$effect(() => {
		return () => {
			if (quietTimer) clearTimeout(quietTimer);
			if (inertiaRaf) cancelAnimationFrame(inertiaRaf);
		};
	});
</script>

<div class="wheel-wrap">
	<div class="wheel-band" aria-hidden="true"></div>
	<div
		class="wheel"
		class:no-snap={noSnap}
		bind:this={el}
		role="listbox"
		tabindex="0"
		aria-label={ariaLabel}
		onscroll={onScroll}
		onscrollend={onScrollEnd}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	>
		{#each items as item, i (item)}
			<button
				type="button"
				class="wheel-item"
				class:center={i === centerIdx}
				role="option"
				aria-selected={i === centerIdx}
				onclick={() => onItemClick(i)}
			>
				{item}
			</button>
		{/each}
	</div>
</div>

<style>
	.wheel-wrap {
		position: relative;
		height: 180px;
		flex-shrink: 0;
	}
	.wheel-band {
		position: absolute;
		left: 2px;
		right: 2px;
		top: 72px;
		height: 36px;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--primary) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--primary) 22%, transparent);
		pointer-events: none;
		z-index: 0;
	}
	.wheel {
		position: relative;
		z-index: 1;
		width: 56px;
		height: 100%;
		overflow-y: auto;
		scroll-snap-type: y mandatory;
		scrollbar-width: none;
		padding: 72px 0;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		touch-action: pan-y;
		user-select: none;
		overscroll-behavior: contain;
		mask-image: linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%);
	}
	.wheel.no-snap {
		scroll-snap-type: none;
	}
	.wheel::-webkit-scrollbar {
		display: none;
	}
	.wheel-item {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 36px;
		border: none;
		background: none;
		scroll-snap-align: center;
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-muted);
		cursor: pointer;
		position: relative;
		transition: color 0.15s;
	}
	.wheel-item.center {
		color: var(--primary);
		font-weight: 700;
		font-size: 14px;
	}
</style>

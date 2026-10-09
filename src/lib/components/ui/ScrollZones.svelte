<script lang="ts">
	import ChevronsUp from '@lucide/svelte/icons/chevrons-up';
	import ChevronsDown from '@lucide/svelte/icons/chevrons-down';

	let { target = null, bg = 'var(--surface)' }: { target?: HTMLElement | null; bg?: string } = $props();

	// 该方向是否还能滚：到边界即关区（pointer-events:none），不拦截边界处的点击
	let canUp = $state(false);
	let canDown = $state(false);

	let raf = 0;
	let measureRaf = 0;
	let dir = 0;
	let lastTs = 0;
	let startTs = 0;

	function measure() {
		if (!target) {
			canUp = false;
			canDown = false;
			return;
		}
		canUp = target.scrollTop > 1;
		canDown = target.scrollTop < target.scrollHeight - target.clientHeight - 1;
	}

	// 匀速爬升滚动：500ms 内 60 → 480 px/s
	function tickScroll(ts: number) {
		if (!dir || !target) {
			raf = 0;
			return;
		}
		if (!lastTs) {
			lastTs = ts;
			startTs = ts;
		}
		const dt = Math.min(64, ts - lastTs);
		lastTs = ts;
		const ramp = Math.min(1, (ts - startTs) / 500);
		target.scrollTop += (dir * (60 + 420 * ramp) * dt) / 1000;
		measure();
		if ((dir < 0 && !canUp) || (dir > 0 && !canDown)) {
			stop();
			return;
		}
		raf = requestAnimationFrame(tickScroll);
	}

	function start(d: number) {
		if (dir === d || !target) return;
		stop();
		dir = d;
		lastTs = 0;
		startTs = 0;
		raf = requestAnimationFrame(tickScroll);
	}

	function stop() {
		dir = 0;
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
	}

	$effect(() => {
		measure();
		const el = target;
		if (!el) return;
		const onScroll = () => {
			cancelAnimationFrame(measureRaf);
			measureRaf = requestAnimationFrame(measure);
		};
		el.addEventListener('scroll', onScroll, { passive: true });
		// 宽度变化（面板重定位）与内容增删（过滤/选中）都会改变可滚性
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		const mo = new MutationObserver(measure);
		mo.observe(el, { childList: true, subtree: true });
		return () => {
			el.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(measureRaf);
			ro.disconnect();
			mo.disconnect();
			stop();
		};
	});
</script>

{#if target}
	<div
		class="sz-zone sz-zone--up"
		class:on={canUp}
		aria-hidden="true"
		style="--sz-bg: {bg}"
		onpointerenter={() => canUp && start(-1)}
		onpointerleave={stop}
	>
		<span class="sz-badge"><ChevronsUp size={12} /></span>
	</div>
	<div
		class="sz-zone sz-zone--down"
		class:on={canDown}
		aria-hidden="true"
		style="--sz-bg: {bg}"
		onpointerenter={() => canDown && start(1)}
		onpointerleave={stop}
	>
		<span class="sz-badge"><ChevronsDown size={12} /></span>
	</div>
{/if}

<style>
	.sz-zone {
		position: absolute;
		left: 0;
		right: 0;
		height: 22px;
		z-index: 3;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.15s;
		cursor: pointer;
	}
	.sz-zone--up {
		top: 0;
		background: linear-gradient(to bottom, var(--sz-bg) 35%, transparent);
	}
	.sz-zone--down {
		bottom: 0;
		background: linear-gradient(to top, var(--sz-bg) 35%, transparent);
	}
	.sz-zone.on {
		pointer-events: auto;
		opacity: 1;
	}
	/* 裸双箭头（无圆底）：直接浮在渐变带上 */
	.sz-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
	}
</style>

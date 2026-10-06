<script lang="ts">
	let {
		visibilityHeight = 200,
		duration = 300,
		label = '返回顶部',
		target = '',
		class: cls = '',
		style = '',
	}: {
		visibilityHeight?: number;
		duration?: number;
		label?: string;
		/** 滚动容器选择器（如 '.layout-content'）；缺省时自动查找最近可滚动祖先，都没有则回退 window */
		target?: string;
		class?: string;
		style?: string;
	} = $props();

	let rootEl = $state<HTMLElement | null>(null);
	let visible = $state(false);

	function findScroller(): HTMLElement | Window {
		if (typeof window === 'undefined') return window;
		if (target) {
			const el = document.querySelector<HTMLElement>(target);
			if (el) return el;
		}
		// 从自身向上找第一个实际可滚动的祖先（Layout 的 .layout-content 场景）
		let node: HTMLElement | null = rootEl ?? null;
		while (node) {
			const oy = getComputedStyle(node).overflowY;
			if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight) return node;
			node = node.parentElement;
		}
		return window;
	}

	function scrollTop(el: HTMLElement | Window): number {
		return el instanceof HTMLElement ? el.scrollTop : el.scrollY;
	}

	function setScrollTop(el: HTMLElement | Window, y: number) {
		if (el instanceof HTMLElement) el.scrollTop = y;
		else el.scrollTo(0, y);
	}

	let scroller: HTMLElement | Window | null = null;

	function onScroll() {
		if (!scroller) return;
		visible = scrollTop(scroller) > visibilityHeight;
	}

	function easeOutCubic(t: number): number {
		return 1 - Math.pow(1 - t, 3);
	}

	let raf = 0;

	function backTop() {
		if (typeof window === 'undefined' || !scroller) return;
		const start = scrollTop(scroller);
		if (start === 0) return;
		const t0 = performance.now();
		const step = (now: number) => {
			const p = Math.min(1, (now - t0) / duration);
			setScrollTop(scroller!, start * (1 - easeOutCubic(p)));
			if (p < 1) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	}

	$effect(() => {
		if (typeof window === 'undefined') return;
		scroller = findScroller();
		onScroll();
		scroller.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			scroller?.removeEventListener('scroll', onScroll);
			window.removeEventListener('scroll', onScroll);
			if (raf) cancelAnimationFrame(raf);
		};
	});
</script>

<span class="back-top-root" bind:this={rootEl}>
	{#if visible}
		<button type="button" class="back-top {cls}" style={style} aria-label={label} title={label} onclick={backTop}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="m18 15-6-6-6 6" />
			</svg>
		</button>
	{/if}
</span>

<style>
	.back-top-root {
		position: fixed;
		right: 24px;
		bottom: 24px;
		z-index: var(--z-fixed);
		line-height: 0;
	}
	.back-top {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: 1px solid var(--border-strong);
		border-radius: 50%;
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
		box-shadow: 0 4px 12px color-mix(in srgb, #000 12%, transparent);
		animation: back-top-in 0.2s ease-out;
		transition: border-color 0.15s, color 0.15s, transform 0.15s;
	}
	.back-top:hover {
		border-color: var(--primary);
		color: var(--primary);
		transform: translateY(-2px);
	}
	.back-top:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	@keyframes back-top-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.back-top {
			animation: none;
		}
	}
</style>

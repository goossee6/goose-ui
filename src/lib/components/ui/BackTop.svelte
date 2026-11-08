<script lang="ts">
	import Tooltip from './Tooltip.svelte';

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

	/** 距容器（或视口）右/下内边距 */
	const INSET = 24;

	/**
	 * fixed 定位 + JS 跟随：按钮始终贴在滚动容器**可见区域**的右下角。
	 * 不能用 absolute 锚进容器 —— 绝对定位的元素会随容器内容一起滚走（实测 y 差值正好等于 scrollTop），
	 * 所以改算容器 boundingRect 换算成视口坐标。
	 */
	function place() {
		if (!rootEl) return;
		if (scroller instanceof HTMLElement) {
			const r = scroller.getBoundingClientRect();
			rootEl.style.right = `${window.innerWidth - r.right + INSET}px`;
			rootEl.style.bottom = `${window.innerHeight - r.bottom + INSET}px`;
		} else {
			rootEl.style.right = `${INSET}px`;
			rootEl.style.bottom = `${INSET}px`;
		}
	}

	function onMove() {
		// target 指向的元素可能被整页替换（路由切页、列表重渲染）；
		// 元素容器失连（已从 DOM 摘除）时也重查一次。初次解析落在 window
		// 兜底（target 还没渲染出来）时，同样靠这里在首次滚动时纠正。
		if (target || (scroller instanceof HTMLElement && !scroller.isConnected)) {
			const next = findScroller();
			if (next !== scroller) {
				scroller?.removeEventListener('scroll', onScroll);
				scroller = next;
				scroller.addEventListener('scroll', onScroll, { passive: true });
			}
		}
		place();
		onScroll();
	}

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
		place();
		onScroll();
		scroller.addEventListener('scroll', onScroll, { passive: true });
		// capture 监听所有滚动（含中间容器与页面滚动）：容器在页面里被滚走时按钮跟着挪，
		// 仍然贴在它的可见右下角；resize 同理
		window.addEventListener('scroll', onMove, { capture: true, passive: true });
		window.addEventListener('resize', onMove);
		return () => {
			scroller?.removeEventListener('scroll', onScroll);
			window.removeEventListener('scroll', onMove, { capture: true });
			window.removeEventListener('resize', onMove);
			if (raf) cancelAnimationFrame(raf);
		};
	});
</script>

<span class="back-top-root" bind:this={rootEl}>
	{#if visible}
		<!-- 纯图标按钮，提示走 Tooltip：原生 title 的样式与主题无关，
		     暗色下会弹出一块系统浅色方块。 -->
		<Tooltip title={label} placement="left">
			<button type="button" class="back-top {cls}" style={style} aria-label={label} onclick={backTop}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="m18 15-6-6-6 6" />
				</svg>
			</button>
		</Tooltip>
	{/if}
</span>

<style>
	.back-top-root {
		position: fixed;
		right: var(--space-6);
		bottom: var(--space-6);
		z-index: var(--z-fixed);
		line-height: 0;
		/* right/bottom 由 place() 按滚动容器可见区域实时计算（元素容器）或保持 24px（window） */
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

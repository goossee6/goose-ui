<script lang="ts">
	let {
		size = 24,
		outline = true,
		trail = false,
		hideNative = true,
		label = '',
		children,
		class: cls = '',
		style = '',
	}: {
		size?: number;
		outline?: boolean;
		trail?: boolean;
		hideNative?: boolean;
		label?: string;
		children?: import('svelte').Snippet;
		class?: string;
		style?: string;
	} = $props();

	let rootEl = $state<HTMLElement | null>(null);
	let dotEl = $state<HTMLSpanElement | null>(null);
	let trailEl = $state<HTMLSpanElement | null>(null);
	let active = $state(false);

	// 最近一次鼠标相对位置（未减半尺寸）；dot 首帧渲染时 mousemove 已跑完、dotEl 尚 null，用它补定位
	let last = { x: 0, y: 0, inside: false };

	$effect(() => {
		// dot/trail 元素挂载（active 翻转渲染）时补一次 transform
		void dotEl;
		void trailEl;
		if (last.inside && dotEl) dotEl.style.transform = `translate(${last.x - size / 2}px, ${last.y - size / 2}px)`;
		if (last.inside && trailEl) trailEl.style.transform = `translate(${last.x - size * 0.9}px, ${last.y - size * 0.9}px)`;
	});

	$effect(() => {
		if (typeof window === 'undefined' || !rootEl) return;

		let raf = 0;
		let target = { x: 0, y: 0 };
		let pos = { x: 0, y: 0 };
		let running = false;

		// 拖尾用 rAF lerp（LERP=0.18/帧 ≈ 60fps 下 ~120ms 跟随），比 CSS transition 更稳且不掉帧重排
		const tick = () => {
			const dx = target.x - pos.x;
			const dy = target.y - pos.y;
			pos.x += dx * 0.18;
			pos.y += dy * 0.18;
			if (trailEl) trailEl.style.transform = `translate(${pos.x - size * 0.9}px, ${pos.y - size * 0.9}px)`;
			if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) {
				raf = requestAnimationFrame(tick);
			} else {
				pos = { ...target };
				if (trailEl) trailEl.style.transform = `translate(${pos.x - size * 0.9}px, ${pos.y - size * 0.9}px)`;
				running = false;
			}
		};

		const onMove = (e: MouseEvent) => {
			const el = rootEl;
			if (!el) return;
			const rect = el.getBoundingClientRect();
			const inside =
				e.clientX >= rect.left &&
				e.clientX <= rect.right &&
				e.clientY >= rect.top &&
				e.clientY <= rect.bottom;
			active = inside;
			last.inside = inside;
			if (!inside) return;
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			last = { x, y, inside: true };
			target = { x, y };
			if (dotEl) dotEl.style.transform = `translate(${x - size / 2}px, ${y - size / 2}px)`;
			if (trail && !running) {
				running = true;
				raf = requestAnimationFrame(tick);
			}
		};

		window.addEventListener('mousemove', onMove, { passive: true });
		return () => {
			window.removeEventListener('mousemove', onMove);
			if (raf) cancelAnimationFrame(raf);
		};
	});
</script>

<div
	class="cursor-zone {cls}"
	bind:this={rootEl}
	style:cursor={hideNative ? 'none' : undefined}
	style={style}
>
	{@render children?.()}
	{#if active}
		<span
			bind:this={dotEl}
			class="cursor-dot"
			class:outline
			style:width="{size}px"
			style:height="{size}px"
			aria-hidden="true"
		>
			{#if label}<span class="cursor-label">{label}</span>{/if}
		</span>
		{#if trail}
			<span
				bind:this={trailEl}
				class="cursor-trail"
				style:width="{size * 1.8}px"
				style:height="{size * 1.8}px"
				aria-hidden="true"
			></span>
		{/if}
	{/if}
</div>

<style>
	.cursor-zone {
		position: relative;
	}
	.cursor-dot {
		position: absolute;
		left: 0;
		top: 0;
		pointer-events: none;
		will-change: transform;
		z-index: 60;
		box-sizing: border-box;
	}
	.cursor-dot.outline {
		border: 1.5px solid var(--primary);
		border-radius: 50%;
		background: var(--accent-sub);
		transform-origin: center;
	}
	.cursor-trail {
		position: absolute;
		left: 0;
		top: 0;
		pointer-events: none;
		border: 1px solid var(--accent-strong);
		border-radius: 50%;
		will-change: transform;
		z-index: 59;
		box-sizing: border-box;
	}
	.cursor-label {
		position: absolute;
		left: 50%;
		top: calc(100% + var(--space-1));
		transform: translateX(-50%);
		font-size: var(--fs-11);
		color: var(--primary);
		white-space: nowrap;
	}
</style>

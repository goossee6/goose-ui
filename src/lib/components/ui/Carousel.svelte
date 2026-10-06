<script lang="ts" module>
	export interface CarouselItem {
		src?: string;
		title?: string;
		desc?: string;
		color?: string;
	}
</script>

<script lang="ts">
	let {
		items = [],
		autoplay = false,
		interval = 3000,
		loop = true,
		showArrows = true,
		showDots = true,
		pauseOnHover = true,
		class: cls = '',
		style = '',
		onchange,
	}: {
		items?: CarouselItem[];
		autoplay?: boolean;
		interval?: number;
		loop?: boolean;
		showArrows?: boolean;
		showDots?: boolean;
		pauseOnHover?: boolean;
		class?: string;
		style?: string;
		onchange?: (index: number) => void;
	} = $props();

	let index = $state(0);
	let hovering = $state(false);
	let timer: ReturnType<typeof setInterval> | null = null;

	const count = $derived(items.length);

	function go(next: number) {
		if (count === 0) return;
		let i = next;
		if (i < 0) i = loop ? count - 1 : 0;
		if (i >= count) i = loop ? 0 : count - 1;
		if (i === index) return;
		index = i;
		onchange?.(index);
	}

	$effect(() => {
		if (!autoplay || count <= 1 || hovering) {
			if (timer) clearInterval(timer);
			timer = null;
			return;
		}
		timer = setInterval(() => go(index + 1), interval);
		return () => {
			if (timer) clearInterval(timer);
		};
	});
</script>

<div
	class="carousel {cls}"
	style={style}
	onmouseenter={() => pauseOnHover && (hovering = true)}
	onmouseleave={() => (hovering = false)}
	role="region"
	aria-roledescription="carousel"
	aria-label="轮播图"
>
	<div class="carousel-viewport">
		<div class="carousel-track" style:transform="translateX(-{index * 100}%)">
			{#each items as item, i (i)}
				<div class="carousel-slide" role="group" aria-roledescription="slide" aria-label="{i + 1} / {count}">
					{#if item.src}
						<img class="carousel-img" src={item.src} alt={item.title || `幻灯片 ${i + 1}`} />
					{:else}
						<div class="carousel-fallback" style:background={item.color || `hsl(${(i * 47) % 360} 60% 82%)`}>
							{#if item.title}<span class="carousel-title">{item.title}</span>{/if}
							{#if item.desc}<span class="carousel-desc">{item.desc}</span>{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if showArrows && count > 1}
			<button type="button" class="carousel-arrow carousel-arrow--left" aria-label="上一张" onclick={() => go(index - 1)}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
			</button>
			<button type="button" class="carousel-arrow carousel-arrow--right" aria-label="下一张" onclick={() => go(index + 1)}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
			</button>
		{/if}
	</div>

	{#if showDots && count > 1}
		<div class="carousel-dots" role="tablist" aria-label="选择幻灯片">
			{#each items as _, i (i)}
				<button
					type="button"
					class="carousel-dot"
					class:active={i === index}
					role="tab"
					aria-selected={i === index}
					aria-label="第 {i + 1} 张"
					onclick={() => go(i)}
				></button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.carousel {
		position: relative;
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--surface-2);
	}
	.carousel-viewport {
		position: relative;
		overflow: hidden;
	}
	.carousel-track {
		display: flex;
		transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.carousel-slide {
		flex: 0 0 100%;
		min-width: 100%;
	}
	.carousel-img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.carousel-fallback {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--sp-xs);
		min-height: 200px;
		height: 100%;
	}
	.carousel-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-strong);
	}
	.carousel-desc {
		font-size: 13px;
		color: var(--text-muted);
	}
	.carousel-arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 50%;
		background: color-mix(in srgb, #000 45%, transparent);
		color: var(--primary-text);
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s, background 0.15s;
	}
	.carousel:hover .carousel-arrow,
	.carousel-arrow:focus-visible {
		opacity: 1;
	}
	.carousel-arrow:hover {
		background: color-mix(in srgb, #000 65%, transparent);
	}
	.carousel-arrow--left {
		left: var(--sp-sm);
	}
	.carousel-arrow--right {
		right: var(--sp-sm);
	}
	.carousel-dots {
		position: absolute;
		left: 0;
		right: 0;
		bottom: var(--sp-sm);
		display: flex;
		justify-content: center;
		gap: var(--sp-xs);
	}
	.carousel-dot {
		width: 8px;
		height: 8px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: color-mix(in srgb, #fff 55%, transparent);
		cursor: pointer;
		transition: background 0.15s, transform 0.15s;
	}
	.carousel-dot.active {
		background: #fff;
		transform: scale(1.3);
	}
	@media (prefers-reduced-motion: reduce) {
		.carousel-track {
			transition: none;
		}
	}
</style>

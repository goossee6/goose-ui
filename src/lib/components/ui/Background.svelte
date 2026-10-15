<script lang="ts">
	let {
		variant = 'gradient',
		fixed = false,
		animated = true,
		opacity = 1,
		children,
		class: cls = '',
		style = '',
	}: {
		variant?: 'gradient' | 'grid' | 'dots' | 'noise';
		fixed?: boolean;
		animated?: boolean;
		opacity?: number;
		children?: import('svelte').Snippet;
		class?: string;
		style?: string;
	} = $props();
</script>

<div
	class="bg bg--{variant} {cls}"
	class:fixed
	class:animated
	style:opacity
	style={style}
	aria-hidden="true"
>
	<span class="bg-blob bg-blob--a"></span>
	<span class="bg-blob bg-blob--b"></span>
	{#if children}
		<div class="bg-content">{@render children()}</div>
	{/if}
</div>

<style>
	.bg {
		position: relative;
		overflow: hidden;
		isolation: isolate;
	}
	.bg.fixed {
		position: fixed;
		inset: 0;
		z-index: -1;
	}
	.bg--gradient {
		background: linear-gradient(135deg, var(--primary-soft) 0%, var(--surface) 45%, color-mix(in srgb, #fbcfe8 35%, var(--surface)) 100%);
	}
	.bg--grid {
		background-color: var(--surface);
		background-image:
			color-mix(in srgb, var(--border) 65%, transparent) 1px,
			transparent 1px;
		background-size: 24px 24px;
	}
	.bg--dots {
		background-color: var(--surface);
		background-image: radial-gradient(color-mix(in srgb, var(--text-muted) 45%, transparent) 1px, transparent 1px);
		background-size: 20px 20px;
	}
	.bg--noise {
		background-color: var(--surface-2);
		background-image: repeating-linear-gradient(
				45deg,
				color-mix(in srgb, var(--border) 45%, transparent) 0 2px,
				transparent 2px 8px
			);
	}
	.bg-blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(60px);
		pointer-events: none;
		z-index: -1;
	}
	.bg-blob--a {
		width: 40%;
		padding-top: 40%;
		left: -8%;
		top: -18%;
		background: var(--accent-ring);
	}
	.bg-blob--b {
		width: 35%;
		padding-top: 35%;
		right: -6%;
		bottom: -16%;
		background: color-mix(in srgb, #f472b6 20%, transparent);
	}
	.bg--grid .bg-blob,
	.bg--dots .bg-blob,
	.bg--noise .bg-blob {
		display: none;
	}
	.bg.animated .bg-blob--a {
		animation: bg-drift-a 14s ease-in-out infinite alternate;
	}
	.bg.animated .bg-blob--b {
		animation: bg-drift-b 18s ease-in-out infinite alternate;
	}
	.bg-content {
		position: relative;
		z-index: 1;
	}
	@keyframes bg-drift-a {
		from { transform: translate(0, 0) scale(1); }
		to { transform: translate(10%, 12%) scale(1.15); }
	}
	@keyframes bg-drift-b {
		from { transform: translate(0, 0) scale(1); }
		to { transform: translate(-12%, -8%) scale(1.1); }
	}
	@media (prefers-reduced-motion: reduce) {
		.bg.animated .bg-blob--a,
		.bg.animated .bg-blob--b {
			animation: none;
		}
	}
</style>

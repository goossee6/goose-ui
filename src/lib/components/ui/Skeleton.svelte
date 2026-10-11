<script lang="ts">
	let {
		shape = 'text',
		width = '',
		height = '',
		rows = 1,
		animated = true,
		class: cls = '',
		style = '',
	}: {
		shape?: 'text' | 'circle' | 'rect';
		width?: string;
		height?: string;
		rows?: number;
		animated?: boolean;
		class?: string;
		style?: string;
	} = $props();

	const n = $derived(Math.max(1, rows));
</script>

<div class="skeleton-group skeleton-group--{shape} {cls}" class:animated style={style} aria-hidden="true">
	{#each Array.from({ length: n }) as _, i (i)}
		<span
			class="skeleton skeleton--{shape}"
			style:width={i === n - 1 && shape === 'text' && n > 1 ? '60%' : width || '100%'}
			style:height={height || (shape === 'text' ? '14px' : shape === 'circle' ? '40px' : '80px')}
		></span>
	{/each}
</div>

<style>
	.skeleton-group {
		display: block;
	}
	.skeleton-group--circle,
	.skeleton-group--rect {
		display: inline-block;
	}
	.skeleton {
		display: block;
		background: linear-gradient(
			90deg,
			var(--surface-2) 25%,
			color-mix(in srgb, var(--surface-2) 60%, var(--border)) 50%,
			var(--surface-2) 75%
		);
		background-size: 200% 100%;
		border-radius: var(--radius-md);
	}
	.skeleton-group--text .skeleton + .skeleton {
		margin-top: var(--sp-sm);
	}
	.skeleton--circle {
		border-radius: 50%;
	}
	.skeleton--rect {
		border-radius: var(--radius-lg);
	}
	.animated .skeleton {
		animation: skeleton-shimmer 1.4s ease-in-out infinite;
	}
	@keyframes skeleton-shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.animated .skeleton {
			animation: none;
		}
	}
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		gap = 'md',
		align = 'center',
		wrap = true,
		class: cls = '',
		style = '',
		children,
	}: {
		gap?: 'sm' | 'md' | 'lg';
		align?: 'start' | 'center' | 'stretch';
		wrap?: boolean;
		class?: string;
		style?: string;
		children?: Snippet;
	} = $props();
</script>

<div class="row row--gap-{gap} row--align-{align} {cls}" class:row--wrap={wrap} style={style}>
	{@render children?.()}
</div>

<style>
	.row {
		display: flex;
		align-items: center;
	}
	.row--wrap {
		flex-wrap: wrap;
	}
	.row--sp-md {
		gap: var(--sp-md);
	}
	.row--sp-md {
		gap: var(--sp-lg);
	}
	.row--gap-lg {
		gap: var(--sp-lg);
	}
	.row--align-start {
		align-items: flex-start;
	}
	.row--align-center {
		align-items: center;
	}
	.row--align-stretch {
		align-items: stretch;
	}
</style>

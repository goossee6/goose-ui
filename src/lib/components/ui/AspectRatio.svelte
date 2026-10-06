<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		ratio = '16 / 9',
		class: cls = '',
		style = '',
		children,
	}: {
		ratio?: string | number;
		class?: string;
		style?: string;
		children?: Snippet;
	} = $props();
</script>

<div class="aspect-ratio {cls}" style="aspect-ratio: {ratio}; {style}">
	{@render children?.()}
</div>

<style>
	.aspect-ratio {
		width: 100%;
		overflow: hidden;
	}
	.aspect-ratio > :global(img),
	.aspect-ratio > :global(video) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>

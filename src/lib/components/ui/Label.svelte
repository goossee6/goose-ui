<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		for: htmlFor = '',
		class: cls = '',
		children,
	}: {
		for?: string;
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<label for={htmlFor || undefined} class="label {cls}">
	{@render children?.()}
</label>

<style>
	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-muted);
		line-height: 1.4;
	}
</style>

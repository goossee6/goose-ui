<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		for: htmlFor = '',
		class: cls = '',
		style = '',
		children,
	}: {
		for?: string;
		class?: string;
		style?: string;
		children?: Snippet;
	} = $props();
</script>

<label for={htmlFor || undefined} class="label {cls}" style={style}>
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

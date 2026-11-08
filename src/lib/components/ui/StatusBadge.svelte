<script lang="ts">
	let {
		variant = 'normal',
		class: cls = '',
		style = '',
		children,
	}: {
		variant?: 'normal' | 'warning';
		class?: string;
		style?: string;
		children?: import('svelte').Snippet;
	} = $props();

	const resolved = $derived(variant);
</script>

<span class="badge badge-{resolved} {cls}" style={style}>
	{#if children}
		{@render children()}
	{:else}
		{resolved === 'warning' ? '超额' : '正常'}
	{/if}
</span>

<style>
	.badge {
		font-size: var(--fs-12);
		font-weight: 600;
		padding: var(--space-0-5) var(--space-2);
		border-radius: var(--radius-full);
		display: inline-block;
		line-height: 1.4;
	}
	.badge-normal {
		background-color: var(--success-soft);
		color: var(--success-text);
	}
	.badge-warning {
		background-color: var(--danger-soft);
		color: var(--danger-text);
	}
</style>

<script lang="ts">
	let {
		status = 'normal',
		variant,
		children,
	}: {
		status?: 'normal' | 'warning';
		variant?: 'normal' | 'warning';
		children?: import('svelte').Snippet;
	} = $props();

	const resolved = $derived(variant || status);
</script>

<span class="badge badge-{resolved}">
	{#if children}
		{@render children()}
	{:else}
		{resolved === 'warning' ? '超额' : '正常'}
	{/if}
</span>

<style>
	.badge {
		font-size: 12px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 9999px;
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

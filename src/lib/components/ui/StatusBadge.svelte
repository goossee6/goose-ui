<script lang="ts">
	let {
		variant = 'normal',
		status,
		children,
	}: {
		variant?: 'normal' | 'warning';
		/** @deprecated Use variant instead */
		status?: 'normal' | 'warning';
		children?: import('svelte').Snippet;
	} = $props();

	const resolved = $derived(variant || status || 'normal');
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

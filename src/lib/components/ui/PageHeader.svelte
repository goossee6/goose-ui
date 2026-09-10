<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title = '',
		description = '',
		class: cls = '',
		children,
		right,
	}: {
		title?: string;
		description?: string;
		class?: string;
		children?: Snippet;
		right?: Snippet;
	} = $props();
</script>

<div class="page-header {cls}">
	<div class="page-header-left">
		{#if title}
			<h1 class="page-header-title">{title}</h1>
		{/if}
		{#if description}
			<p class="page-header-desc">{description}</p>
		{/if}
		{#if children}
			<div class="page-header-children">
				{@render children()}
			</div>
		{/if}
	</div>
	{#if right}
		<div class="page-header-right">
			{@render right()}
		</div>
	{/if}
</div>

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--gap-xl);
		margin-bottom: var(--sp-3xl);
	}
	.page-header-left {
		display: flex;
		align-items: center;
		gap: var(--gap-xl);
		min-width: 0;
	}
	.page-header-title {
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: -0.025em;
		color: var(--text-strong);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin: 0;
	}
	.page-header-desc {
		font-size: 0.875rem;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin: 0;
	}
	.page-header-children {
		display: flex;
		align-items: center;
		gap: var(--gap-md);
	}
	.page-header-right {
		display: flex;
		align-items: center;
		gap: var(--gap-md);
		flex-shrink: 0;
	}
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title = '',
		description = '',
		class: cls = '',
		style = '',
		children,
		right,
	}: {
		title?: string;
		description?: string;
		class?: string;
		style?: string;
		children?: Snippet;
		right?: Snippet;
	} = $props();
</script>

<div class="page-header {cls}" style={style}>
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
		flex-wrap: wrap;
		gap: var(--sp-lg);
		margin-bottom: var(--ph-gap);
	}
	.page-header-left {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-1);
		min-width: 0;
		flex: 1 1 auto;
	}
	.page-header-title {
		font-size: 1.375rem;
		font-weight: 700;
		line-height: 1.35;
		letter-spacing: -0.02em;
		color: var(--text-strong);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin: 0;
		max-width: 100%;
	}
	.page-header-desc {
		font-size: 0.8125rem;
		line-height: 1.6;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin: 0;
		max-width: 100%;
	}
	.page-header-children {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--sp-md);
		margin-top: var(--space-1);
	}
	.page-header-right {
		display: flex;
		align-items: center;
		gap: var(--sp-md);
		flex-shrink: 0;
		margin-left: auto;
	}
</style>

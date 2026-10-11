<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		class: cls = '',
		style = '',
		title,
		right,
		children,
	}: {
		class?: string;
		style?: string;
		title?: string;
		right?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<div class="card {cls}" style={style}>
	{#if title}
		<div class="card-header">
			<span class="card-title">{title}</span>
			{#if right}
				<div class="card-right">
					{@render right()}
				</div>
			{/if}
		</div>
	{/if}
	<div class="card-body">
		{@render children?.()}
	</div>
</div>

<style>
	.card {
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-lg);
		padding: var(--sp-lg) var(--sp-lg);
		border-bottom: 1px solid var(--border);
		background-color: var(--surface-2);
	}
	.card-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-strong);
	}
	.card-right {
		display: flex;
		align-items: center;
		gap: var(--sp-md);
	}
	.card-body {
		display: flex;
		flex-direction: column;
		gap: var(--sp-md);
		padding: var(--sp-lg);
	}
</style>

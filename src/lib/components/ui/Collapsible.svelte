<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = false,
		disabled = false,
		onchange,
		trigger,
		children,
		class: cls = '',
		style = '',
	}: {
		open?: boolean;
		disabled?: boolean;
		onchange?: (open: boolean) => void;
		trigger?: Snippet;
		children?: Snippet;
		class?: string;
		style?: string;
	} = $props();

	function toggle() {
		if (disabled) return;
		onchange?.(!open);
	}
</script>

<div class="collapsible {cls}" class:collapsible--open={open} style={style}>
	<button
		type="button"
		class="collapsible-trigger"
		{disabled}
		aria-expanded={open}
		onclick={toggle}
	>
		{@render trigger?.()}
	</button>
	<div class="collapsible-content" class:open>
		<div class="collapsible-inner">
			{@render children?.()}
		</div>
	</div>
</div>

<style>
	.collapsible {
		display: flex;
		flex-direction: column;
	}
	.collapsible-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-sm);
		width: 100%;
		padding: var(--sp-md) var(--sp-lg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--text);
		font-size: 14px;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.15s, border-color 0.15s;
	}
	.collapsible-trigger:hover:not(:disabled) {
		background-color: var(--hover);
	}
	.collapsible-trigger:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.collapsible-trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.collapsible-content {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.25s ease;
	}
	.collapsible-content.open {
		grid-template-rows: 1fr;
	}
	.collapsible-inner {
		overflow: hidden;
		min-height: 0;
	}
</style>

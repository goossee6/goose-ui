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
		<svg
			class="collapsible-chevron"
			class:open
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<polyline points="6 9 12 15 18 9" />
		</svg>
	</button>
	<div class="collapsible-content" class:open>
		<div class="collapsible-inner">
			<div class="collapsible-body">
				{@render children?.()}
			</div>
		</div>
	</div>
</div>

<style>
	.collapsible {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	.collapsible-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-md);
		width: 100%;
		padding: var(--sp-lg);
		border: none;
		background: transparent;
		color: var(--text);
		font-size: 14px;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.15s;
	}
	.collapsible-trigger:hover:not(:disabled) {
		background-color: var(--hover);
	}
	.collapsible-trigger:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: -2px;
	}
	.collapsible-trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.collapsible-chevron {
		flex-shrink: 0;
		margin-left: auto;
		color: var(--text-muted);
		transition: transform 0.25s ease;
	}
	.collapsible-chevron.open {
		transform: rotate(180deg);
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
	.collapsible-body {
		padding: var(--sp-lg);
		border-top: 1px solid var(--border);
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.7;
	}
</style>

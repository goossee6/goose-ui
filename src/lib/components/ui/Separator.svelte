<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		orientation = 'horizontal',
		dashed = false,
		class: cls = '',
		style = '',
		children,
	}: {
		orientation?: 'horizontal' | 'vertical';
		dashed?: boolean;
		class?: string;
		style?: string;
		children?: Snippet;
	} = $props();
</script>

<div
	class="separator separator--{orientation} {cls}"
	class:separator--dashed={dashed}
	class:separator--label={Boolean(children)}
	{style}
	role="separator"
	aria-orientation={orientation}
>
	{#if children}
		<span class="separator-label">{@render children()}</span>
	{/if}
</div>

<style>
	.separator {
		background-color: var(--border);
		border: none;
		padding: 0;
		margin: 0;
	}
	.separator--horizontal {
		width: 100%;
		height: 1px;
	}
	.separator--vertical {
		width: 1px;
		min-height: var(--sp-lg);
		align-self: stretch;
	}
	.separator--dashed {
		background: none;
	}
	.separator--horizontal.separator--dashed {
		height: 0;
		border-top: 1px dashed var(--border);
	}
	.separator--vertical.separator--dashed {
		width: 0;
		border-left: 1px dashed var(--border);
	}
	.separator--label {
		color: var(--text-muted);
		font-size: 12px;
		line-height: 1.4;
	}
	.separator--horizontal.separator--label {
		display: flex;
		align-items: center;
		gap: var(--sp-md);
		height: auto;
		background: none;
	}
	.separator--horizontal.separator--label.separator--dashed {
		height: auto;
		border-top: none;
	}
	.separator--horizontal.separator--label::before,
	.separator--horizontal.separator--label::after {
		content: '';
		flex: 1;
		height: 1px;
		background-color: var(--border);
	}
	.separator--horizontal.separator--label.separator--dashed::before,
	.separator--horizontal.separator--label.separator--dashed::after {
		height: 0;
		background: none;
		border-top: 1px dashed var(--border);
	}
	.separator--vertical.separator--label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--sp-md);
		width: auto;
		background: none;
	}
	.separator--vertical.separator--label.separator--dashed {
		width: auto;
		border-left: none;
	}
	.separator--vertical.separator--label::before,
	.separator--vertical.separator--label::after {
		content: '';
		flex: 1;
		width: 1px;
		background-color: var(--border);
	}
	.separator--vertical.separator--label.separator--dashed::before,
	.separator--vertical.separator--label.separator--dashed::after {
		width: 0;
		background: none;
		border-left: 1px dashed var(--border);
	}
	.separator-label {
		white-space: nowrap;
	}
	.separator--vertical .separator-label {
		writing-mode: vertical-rl;
	}
</style>

<script lang="ts">
	import type { Component } from 'svelte';
	import { onMount } from 'svelte';

	interface TabItem {
		value: string;
		label: string;
		icon?: Component<{ size?: number }>;
		iconHtml?: string;
	}

	let {
		items = [],
		value = $bindable(''),
		disabled = false,
		mode = 'segmented',
		class: cls = '',
		onchange,
		size = 'middle',
		style = '',
	}: {
		items?: readonly TabItem[];
		value?: string;
		disabled?: boolean;
		mode?: 'segmented' | 'underline' | 'vertical';
		class?: string;
		onchange?: (value: string) => void;
		size?: 'small' | 'middle' | 'large';
		style?: string;
	} = $props();

	const sizeClass = $derived(`tabs-root--${size}`);

	let groupEl: HTMLElement;

	let pillLeft = $state(0);
	let pillTop = $state(0);
	let pillWidth = $state(0);
	let pillHeight = $state(0);
	let pillOpacity = $state(0);

	function select(v: string) {
		if (disabled) return;
		if (onchange) onchange(v);
		else value = v;
	}

	function measure() {
		if (!groupEl) return;
		const btn = groupEl.querySelector<HTMLElement>('.tab-active');
		if (!btn) { pillOpacity = 0; return; }
		const br = btn.getBoundingClientRect();
		const gr = groupEl.getBoundingClientRect();
		const cs = getComputedStyle(groupEl);
		const bl = parseInt(cs.borderLeftWidth) || 0;
		const bt = parseInt(cs.borderTopWidth) || 0;
		if (mode === 'vertical') {
			pillLeft = 4;
			pillTop = br.top - gr.top - bt;
			pillWidth = gr.width - 8;
			pillHeight = br.height;
		} else {
			pillLeft = br.left - gr.left - bl;
			pillTop = 0;
			pillWidth = br.width;
			pillHeight = 0;
		}
		pillOpacity = 1;
	}

	onMount(() => {
		measure();
	});

	$effect(() => {
		value;
		measure();
	});

	$effect(() => {
		items;
		measure();
	});
</script>

<div class="tabs-root {sizeClass} {cls}" style={style}>
	<div
		bind:this={groupEl}
		class="tabs-group tabs-group--{mode}"
		role="tablist"
	>
		{#if mode === 'segmented'}
			<div
				class="tabs-pill"
				style="left: {pillLeft}px; width: {pillWidth}px; opacity: {pillOpacity}"
			></div>
		{/if}
		{#if mode === 'vertical'}
			<div
				class="tabs-pill tabs-pill--vertical"
				style="top: {pillTop}px; height: {pillHeight}px; width: calc(100% - 8px); opacity: {pillOpacity}"
			></div>
		{/if}
		{#if mode === 'underline'}
			<div
				class="tabs-indicator"
				style="left: {pillLeft}px; width: {pillWidth}px; opacity: {pillOpacity}"
			></div>
		{/if}
		{#each items as item}
			{@const isActive = value === item.value}
			<button
				type="button"
				class="tab {isActive ? 'tab-active' : ''} tabs-mode--{mode}"
				role="tab"
				aria-selected={isActive}
				{disabled}
				onclick={() => select(item.value)}
			>
				{#if item.icon}
					<svelte:component this={item.icon} size={16} />
				{:else if item.iconHtml}
					<svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">{@html item.iconHtml}</svg>
				{/if}
				{item.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.tabs-root { display: inline-flex; align-items: center; }
	.tabs-root--small .tabs-mode--segmented { padding: 4px 12px; font-size: var(--ui-sm-font); }
	.tabs-root--small .tabs-mode--underline { padding: 8px 12px; font-size: var(--ui-sm-font); }
	.tabs-root--small .tabs-mode--vertical { padding: 6px 10px; font-size: var(--ui-sm-font); }
	.tabs-root--large .tabs-mode--segmented { padding: 8px 20px; font-size: var(--ui-lg-font); }
	.tabs-root--large .tabs-mode--underline { padding: 16px 20px; font-size: var(--ui-lg-font); }
	.tabs-root--large .tabs-mode--vertical { padding: 12px 16px; font-size: var(--ui-lg-font); }
	.tabs-group {
		display: flex;
		position: relative;
	}
	.tabs-group--segmented {
		gap: 4px;
		width: fit-content;
		padding: 4px;
		border-radius: var(--radius-lg);
		background-color: var(--surface-2);
		border: 1px solid var(--border);
	}
	.tabs-group--underline {
		gap: 0;
		width: 100%;
		border-bottom: 1px solid var(--border);
	}
	.tabs-group--vertical {
		flex-direction: column;
		gap: 2px;
		width: 100%;
	}
	.tabs-pill {
		position: absolute;
		left: 0;
		top: 4px;
		bottom: 4px;
		border-radius: var(--radius-md);
		background-color: var(--primary);
		z-index: 0;
		pointer-events: none;
		transition: left 0.22s ease-out, top 0.22s ease-out, width 0.22s ease-out, height 0.22s ease-out, opacity 0.15s;
	}
	.tabs-pill--vertical {
		left: 4px;
		right: 4px;
		top: auto;
		bottom: auto;
	}
	.tabs-indicator {
		position: absolute;
		bottom: -1px;
		height: 2px;
		background: var(--primary);
		border-radius: 1px;
		transition: left 0.22s ease-out, width 0.22s ease-out;
		z-index: 0;
		pointer-events: none;
	}
	.tab {
		position: relative;
		z-index: 10;
		border: none;
		background: transparent;
		cursor: pointer;
		white-space: nowrap;
		transition: color 0.15s;
		font-weight: 500;
	}
	.tab:disabled { opacity: 0.5; cursor: not-allowed; }
	.tabs-mode--segmented {
		padding: 6px 16px;
		border-radius: var(--radius-md);
		font-size: 14px;
	}
	.tabs-mode--segmented.tab-active { color: var(--primary-text); }
	.tabs-mode--segmented:not(.tab-active) { color: var(--text-muted); }
	.tabs-mode--segmented:not(.tab-active):hover { background-color: var(--hover); color: var(--text-strong); }
	.tabs-mode--underline {
		flex: 1;
		text-align: center;
		padding: 12px 16px;
		font-size: 14px;
	}
	.tabs-mode--underline.tab-active { color: var(--primary); }
	.tabs-mode--underline:not(.tab-active) { color: var(--text-muted); }
	.tabs-mode--underline:not(.tab-active):hover { color: var(--text-strong); }
	.tabs-mode--vertical {
		width: 100%;
		text-align: left;
		padding: 8px 12px;
		border-radius: var(--radius-md);
		font-size: 13px;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.tabs-mode--vertical.tab-active { color: var(--primary-text); }
	.tabs-mode--vertical:not(.tab-active) { color: var(--text-muted); }
	.tabs-mode--vertical:not(.tab-active):hover { background-color: var(--hover); color: var(--text-strong); }
</style>

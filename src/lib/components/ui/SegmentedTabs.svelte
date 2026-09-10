<script lang="ts">
	import type { Component } from 'svelte';

	interface TabItem {
		value: string;
		label: string;
		icon?: Component<{ size?: number }>;
	}

	let {
		items,
		value = $bindable(''),
		disabled = false,
		mode = 'segmented',
		class: cls = '',
		onchange,
	}: {
		items: readonly TabItem[];
		value?: string;
		disabled?: boolean;
		mode?: 'segmented' | 'underline' | 'vertical';
		class?: string;
		onchange?: (value: string) => void;
	} = $props();

	let groupEl: HTMLElement;
	let pillStyle = $state({ left: 0, top: 0, width: 0, height: 0, opacity: 0 });

	function select(v: string) {
		if (disabled) return;
		if (onchange) onchange(v);
		else value = v;
	}

	$effect(() => {
		value;
		items;
		requestAnimationFrame(() => {
			if (!groupEl) return;
			const btn = groupEl.querySelector<HTMLElement>('.tab-active');
			if (!btn) { pillStyle = { ...pillStyle, opacity: 0 }; return; }
			const br = btn.getBoundingClientRect();
			const gr = groupEl.getBoundingClientRect();
			if (mode === 'vertical') {
				pillStyle = { left: 4, top: br.top - gr.top, width: gr.width - 8, height: br.height, opacity: 1 };
			} else {
				pillStyle = { left: br.left - gr.left, top: 0, width: br.width, height: 0, opacity: 1 };
			}
		});
	});
</script>

<div class="tabs-root {cls}">
	<div
		bind:this={groupEl}
		class="tabs-group tabs-group--{mode}"
		role="tablist"
	>
		{#if mode === 'segmented'}
			<div
				class="tabs-pill"
				style="transform: translateX({pillStyle.left}px); width: {pillStyle.width}px; opacity: {pillStyle.opacity}"
			></div>
		{/if}
		{#if mode === 'vertical'}
			<div
				class="tabs-pill tabs-pill--vertical"
				style="transform: translateY({pillStyle.top}px); height: {pillStyle.height}px; width: calc(100% - 8px); opacity: {pillStyle.opacity}"
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
				{/if}
				{item.label}
			</button>
		{/each}
	</div>
</div>

<style>
	.tabs-root { display: inline-flex; align-items: center; }
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
	}
	.tabs-group--vertical {
		flex-direction: column;
		gap: 2px;
		width: 100%;
	}
	.tabs-pill {
		position: absolute;
		top: 4px;
		bottom: 4px;
		border-radius: var(--radius-md);
		background-color: var(--primary);
		z-index: 0;
		pointer-events: none;
		transition: all 0.22s ease-out;
	}
	.tabs-pill--vertical {
		left: 4px;
		right: 4px;
		top: auto;
		bottom: auto;
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
		border-bottom: 2px solid transparent;
	}
	.tabs-mode--underline.tab-active { color: var(--primary); border-bottom-color: var(--primary); }
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

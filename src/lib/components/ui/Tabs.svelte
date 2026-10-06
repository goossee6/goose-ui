<script lang="ts" module>
	export const TABS_KEY = Symbol('goose-tabs');

	export interface TabsContext {
		/** 当前选中的 tab value，供 TabsPanel 匹配 */
		get activeValue(): string;
	}

	/** value → 可用于 id 的安全片段 */
	export function tabId(value: string): string {
		return String(value).replace(/[^\w-]/g, '-');
	}
</script>

<script lang="ts">
	import type { Component } from 'svelte';
	import { setContext } from 'svelte';
	import PillTrack from './PillTrack.svelte';

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

	let groupEl = $state<HTMLElement>();

	const ctx: TabsContext = {
		get activeValue() {
			return value;
		},
	};
	setContext(TABS_KEY, ctx);

	function select(v: string) {
		if (disabled) return;
		if (v === value) return;
		if (onchange) onchange(v);
		else value = v;
	}

	// 键盘：方向键在 tab 间移动焦点并跟随选中（automatic activation），Home/End 到首尾
	function onGroupKeydown(e: KeyboardEvent) {
		if (!groupEl || disabled) return;
		const tabs = [...groupEl.querySelectorAll<HTMLButtonElement>('.tab:not(:disabled)')];
		if (!tabs.length) return;
		const cur = tabs.indexOf(document.activeElement as HTMLButtonElement);
		if (cur < 0) return;
		const vertical = mode === 'vertical';
		let next = -1;
		if (e.key === 'ArrowRight' && !vertical) next = cur + 1;
		else if (e.key === 'ArrowLeft' && !vertical) next = cur - 1;
		else if (e.key === 'ArrowDown' && vertical) next = cur + 1;
		else if (e.key === 'ArrowUp' && vertical) next = cur - 1;
		else if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = tabs.length - 1;
		else return;
		e.preventDefault();
		const target = tabs[(next + tabs.length) % tabs.length];
		target.focus();
		const v = target.dataset.value;
		if (v !== undefined) select(v);
	}
</script>

<div class="tabs-root {sizeClass} {cls}" style={style}>
	<div
		bind:this={groupEl}
		class="tabs-group tabs-group--{mode}"
		role="tablist"
		aria-orientation={mode === 'vertical' ? 'vertical' : 'horizontal'}
		onkeydown={onGroupKeydown}
	>
		<PillTrack
			container={groupEl}
			itemSelector=".tab"
			activeSelector=".tab-active"
			disabledMatch=":disabled"
			variant={mode === 'underline' ? 'line' : 'box'}
			insetX={mode === 'vertical' ? 4 : undefined}
			background="var(--primary)"
			hoverBackground={mode === 'underline' ? 'var(--border-strong)' : 'var(--hover)'}
			radius="var(--radius-md)"
		/>
		{#each items as item}
			{@const isActive = value === item.value}
			<button
				type="button"
				class="tab {isActive ? 'tab-active' : ''} tabs-mode--{mode}"
				role="tab"
				id="tabs-trigger-{tabId(item.value)}"
				aria-selected={isActive}
				aria-controls="tabs-panel-{tabId(item.value)}"
				tabindex={isActive ? 0 : -1}
				data-value={item.value}
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
	.tabs-mode--segmented:not(.tab-active):hover { color: var(--text-strong); }
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
	.tabs-mode--vertical:not(.tab-active):hover { color: var(--text-strong); }
</style>

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
	import type { Component, Snippet } from 'svelte';
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
		lead,
		children,
		style = '',
	}: {
		items?: readonly TabItem[];
		value?: string;
		disabled?: boolean;
		mode?: 'segmented' | 'underline' | 'vertical';
		class?: string;
		onchange?: (value: string) => void;
		size?: 'small' | 'middle' | 'large';
		/**
		 * 提供后（含空 snippet）标签条会并入卡片式标题栏行（surface-2 背景 + 下边框 + 内边距）。
		 * lead 内容渲染在标题栏左侧、标签条在右；空 lead 时标题栏只含标签条（单子元素靠左）。
		 */
		lead?: Snippet;
		/** 面板内容（放 TabsPanel 用，需在 Tabs 内部才能共享选中状态） */
		children?: Snippet;
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
		// 先写自己的 value 再回调，与库内 Select/Combobox/Slider/Accordion/ToggleGroup 一致。
		// 若写成 `if (onchange) onchange(v); else value = v;`，则 bind:value 与 onchange 并存时
		// 绑定永远收不到新值（父级回调不改 value → 选中态不变），是 API 陷阱。
		value = v;
		onchange?.(v);
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

{#snippet bar()}
	<!-- 子 tab 用 roving tabindex（仅活动项 tabindex=0）并自行处理方向键，tablist 不应再成为焦点停靠点 -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
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
					{@const TabIcon = item.icon}
					<TabIcon size={16} />
				{:else if item.iconHtml}
					<svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">{@html item.iconHtml}</svg>
				{/if}
				{item.label}
			</button>
		{/each}
	</div>
{/snippet}

<div class="tabs-root {sizeClass} {cls}" style={style}>
	{#if lead}
		<div class="tabs-topline">
			{@render lead()}
			{@render bar()}
		</div>
	{:else}
		{@render bar()}
	{/if}
	{@render children?.()}
</div>

<style>
	/* inline-flex 的 min-width 默认 auto，窄容器下会被 tab 的 nowrap 文字撑开；
	   min-width:0 + max-width:100% 让它在放不下时收缩而不是顶破父级。 */
	.tabs-root { display: inline-flex; flex-direction: column; align-items: flex-start; min-width: 0; max-width: 100%; }
	.tabs-topline {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-lg);
		width: 100%;
		padding: var(--sp-md) var(--sp-lg);
		border-bottom: 1px solid var(--border);
		background-color: var(--surface);
	}
	.tabs-root--small .tabs-mode--segmented { padding: var(--tab-seg-pad-sm); font-size: var(--tab-font-sm); }
	.tabs-root--small .tabs-mode--underline { padding: var(--tab-line-pad-sm); font-size: var(--tab-font-sm); }
	.tabs-root--small .tabs-mode--vertical { padding: var(--tab-col-pad-sm); font-size: var(--tab-font-sm); }
	.tabs-root--large .tabs-mode--segmented { padding: var(--tab-seg-pad-lg); font-size: var(--tab-font-lg); }
	.tabs-root--large .tabs-mode--underline { padding: var(--tab-line-pad-lg); font-size: var(--tab-font-lg); }
	.tabs-root--large .tabs-mode--vertical { padding: var(--tab-col-pad-lg); font-size: var(--tab-font-lg); }
	.tabs-group {
		display: flex;
		position: relative;
		/* 收缩到父级宽度以内而不是顶出去；放不下时横向滚动，
		   避免 tab 的 nowrap 文字把整页撑出横向滚动条。 */
		min-width: 0;
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.tabs-group::-webkit-scrollbar { display: none; }
	.tabs-group--segmented {
		gap: 4px;
		/* fit-content 会被 nowrap 的 tab 撑到内容宽度而顶出父级，
		   max-width:100% 把它压回容器内，配合上面的 overflow-x 横向滚动。 */
		width: fit-content;
		max-width: 100%;
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
		z-index: 1;
		border: none;
		background: transparent;
		cursor: pointer;
		white-space: nowrap;
		transition: color 0.15s;
		font-weight: 500;
	}
	.tab:disabled { opacity: 0.5; cursor: not-allowed; }
	.tabs-mode--segmented {
		padding: var(--tab-seg-pad-md);
		border-radius: var(--radius-md);
		font-size: var(--tab-font-md);
	}
	.tabs-mode--segmented.tab-active { color: var(--primary-text); }
	.tabs-mode--segmented:not(.tab-active) { color: var(--text-muted); }
	.tabs-mode--segmented:not(.tab-active):hover { color: var(--text-strong); }
	.tabs-mode--underline {
		flex: 1;
		text-align: center;
		padding: var(--tab-line-pad-md);
		font-size: var(--tab-font-md);
	}
	.tabs-mode--underline.tab-active { color: var(--primary); }
	.tabs-mode--underline:not(.tab-active) { color: var(--text-muted); }
	.tabs-mode--underline:not(.tab-active):hover { color: var(--text-strong); }
	.tabs-mode--vertical {
		width: 100%;
		text-align: left;
		padding: var(--tab-col-pad-md);
		border-radius: var(--radius-md);
		font-size: var(--tab-col-font-md);
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.tabs-mode--vertical.tab-active { color: var(--primary-text); }
	.tabs-mode--vertical:not(.tab-active) { color: var(--text-muted); }
	.tabs-mode--vertical:not(.tab-active):hover { color: var(--text-strong); }
</style>

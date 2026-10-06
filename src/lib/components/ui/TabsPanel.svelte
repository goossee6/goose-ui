<script lang="ts">
	import { getContext, type Snippet } from 'svelte';
	import { TABS_KEY, tabId, type TabsContext } from './Tabs.svelte';

	let {
		value,
		children,
		class: cls = '',
		style = '',
	}: {
		/** 对应的 tab value，与 Tabs 的 value 匹配时渲染 */
		value: string;
		children?: Snippet;
		class?: string;
		style?: string;
	} = $props();

	// Tabs 外使用时无 context → 恒渲染（宽容降级，可当普通容器）
	const tabs = getContext<TabsContext | null>(TABS_KEY);
	const active = $derived(!tabs || tabs.activeValue === value);
</script>

{#if active}
	<div
		class="tabs-panel {cls}"
		style={style}
		role="tabpanel"
		id="tabs-panel-{tabId(value)}"
		aria-labelledby="tabs-trigger-{tabId(value)}"
		tabindex="0"
	>
		{@render children?.()}
	</div>
{/if}

<style>
	.tabs-panel {
		outline: none;
	}
	.tabs-panel:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
</style>

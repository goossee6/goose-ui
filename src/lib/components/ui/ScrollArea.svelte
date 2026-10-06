<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		maxHeight = '',
		orientation = 'vertical',
		label = '可滚动区域',
		class: cls = '',
		style = '',
		children,
	}: {
		maxHeight?: string;
		orientation?: 'vertical' | 'horizontal' | 'both';
		label?: string;
		class?: string;
		style?: string;
		children?: Snippet;
	} = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class="scroll-area scroll-area--{orientation} {cls}"
	style="{maxHeight ? `max-height: ${maxHeight}; ` : ''}{style}"
	role="region"
	aria-label={label}
	tabindex="0"
>
	{@render children?.()}
</div>

<style>
	.scroll-area {
		overflow: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar) transparent;
	}
	.scroll-area--vertical {
		overflow-x: hidden;
		overflow-y: auto;
	}
	.scroll-area--horizontal {
		overflow-x: auto;
		overflow-y: hidden;
	}
	.scroll-area::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}
	.scroll-area::-webkit-scrollbar-track {
		background: transparent;
	}
	.scroll-area::-webkit-scrollbar-thumb {
		background-color: var(--scrollbar);
		border-radius: 9999px;
		border: 2px solid transparent;
		background-clip: padding-box;
	}
	.scroll-area::-webkit-scrollbar-thumb:hover {
		background-color: var(--scrollbar-hover);
	}
	.scroll-area::-webkit-scrollbar-corner {
		background: transparent;
	}
	.scroll-area:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
</style>

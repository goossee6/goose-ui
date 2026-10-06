<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import TitleBar from './TitleBar.svelte';

	let {
		title = '',
		logo,
		subtitle,
		theme = 'light',
		onThemeToggle,
		controls,
		windowControls = true,
		tabs,
		children,
		scroll = true,
		resize = false,
		class: cls = '',
		style = '',
	}: {
		title?: string;
		logo?: string | Component<{ size?: number; class?: string }>;
		subtitle?: string;
		theme?: 'light' | 'dark';
		onThemeToggle?: (e: MouseEvent) => void;
		/** 透传给 TitleBar 的自定义按钮区（与默认窗口键共存，用 windowControls 控制默认键） */
		controls?: Snippet;
		/** 透传给 TitleBar：false 不渲染默认窗口三键（如浏览器环境） */
		windowControls?: boolean;
		/** 左侧侧边栏内容（通常放 Sidebar） */
		tabs?: Snippet;
		/** 内容区 */
		children?: Snippet;
		/** 内容卡片整页滚动；false = 框架不滚、页内滚动区自理 */
		scroll?: boolean;
		/** Wails 窗口支持：全域拖拽调整 + 四角手柄（浏览器环境无效果） */
		resize?: boolean;
		class?: string;
		style?: string;
	} = $props();
</script>

<div class="layout {cls}" class:layout--resize={resize} style={style}>
	<div class="layout-titlebar">
		<TitleBar {title} {logo} {subtitle} {theme} {onThemeToggle} {controls} {windowControls} />
	</div>
	<div class="layout-body">
		{#if tabs}
			<aside class="layout-tabs">
				{@render tabs()}
			</aside>
		{/if}
		<main class="layout-content" class:layout-content--fixed={!scroll}>
			{@render children?.()}
		</main>
		{#if resize}
			<div class="layout-handle layout-handle-tl"></div>
			<div class="layout-handle layout-handle-tr"></div>
			<div class="layout-handle layout-handle-bl"></div>
			<div class="layout-handle layout-handle-br"></div>
		{/if}
	</div>
</div>

<style>
	.layout {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--background, var(--bg, #fff));
	}
	.layout--resize {
		--wails-resize: all;
	}
	.layout-titlebar {
		flex-shrink: 0;
	}
	.layout-body {
		position: relative;
		flex: 1;
		display: flex;
		min-height: 0;
	}
	.layout-tabs {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		width: max-content;
		background: transparent;
		padding: 0 8px 8px;
		overflow-y: auto;
		overflow-x: hidden;
	}
	.layout-content {
		--page-pad: 20px 24px;
		--layout-pad-y: 20px;
		--layout-pad-x: 24px;
		position: relative;
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 0;
		margin: 0 8px 8px;
		border: 1px solid var(--border);
		border-radius: var(--radius-xl);
		background: var(--surface, var(--bg));
	}
	.layout-content--fixed {
		overflow: hidden;
	}

	/* ── Wails 四角 resize 手柄 ─────────────────────────────────────────── */
	.layout-handle {
		position: fixed;
		z-index: var(--z-max);
		width: 6px;
		height: 6px;
	}
	.layout-handle-tl {
		top: 0;
		left: 0;
		--wails-resize: top-left;
		cursor: nwse-resize;
	}
	.layout-handle-tr {
		top: 0;
		right: 0;
		--wails-resize: top-right;
		cursor: nesw-resize;
	}
	.layout-handle-bl {
		bottom: 0;
		left: 0;
		--wails-resize: bottom-left;
		cursor: nesw-resize;
	}
	.layout-handle-br {
		bottom: 0;
		right: 0;
		--wails-resize: bottom-right;
		cursor: nwse-resize;
	}
</style>

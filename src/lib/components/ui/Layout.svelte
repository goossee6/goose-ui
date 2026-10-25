<script lang="ts">
	import type { Snippet } from 'svelte';

	/* 纯布局外壳：只提供「顶栏 / 可选侧栏 / 内容卡片」三个区域，
	   不内置 TitleBar、Sidebar 等组件，由使用方自行组合。 */
	let {
		titlebar,
		aside,
		children,
		scroll = true,
		resize = false,
		class: cls = '',
		style = '',
	}: {
		/** 顶部区域（通常放 TitleBar） */
		titlebar?: Snippet;
		/** 左侧区域（通常放 Sidebar；省略则不渲染，内容区占满整宽） */
		aside?: Snippet;
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
	{#if titlebar}
		<div class="layout-titlebar">
			{@render titlebar()}
		</div>
	{/if}
	<div class="layout-body">
		{#if aside}
			<aside class="layout-aside">
				{@render aside()}
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
	/* 栏间距和四周边距分开由两条规则各自负责，不再靠子元素"往外留白"叠加：
	   gap 只在有相邻兄弟时生效，侧栏不渲染时不会凭空多出左留白。 */
	.layout-body {
		position: relative;
		flex: 1;
		display: flex;
		gap: 8px;
		padding: 0 8px 8px;
		min-height: 0;
	}
	.layout-aside {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		width: max-content;
		background: transparent;
		padding: 0;
		overflow-y: auto;
		overflow-x: hidden;
	}
	.layout-content {
		/* 页面只留左右留白：上下由 Page 自己清零（padding-block: 0），
		   所以镜像给 Header 的 --layout-pad-y 也必须是 0 —— 否则 Header 的
		   负 margin 会把吸顶条往上拽出滚动口，顶部被裁掉一截。 */
		--page-pad: var(--layout-pad-x);
		--layout-pad-y: 0px;
		--layout-pad-x: 24px;
		position: relative;
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 0;
		margin: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
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
		cursor: nesw-resize;
	}
</style>

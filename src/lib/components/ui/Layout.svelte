<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import TitleBar from './TitleBar.svelte';

	let {
		title = '',
		logo,
		subtitle,
		theme = 'light',
		onThemeToggle,
		tabs,
		children,
	}: {
		title?: string;
		logo?: string | Component<{ size?: number; class?: string }>;
		subtitle?: string;
		theme?: 'light' | 'dark';
		onThemeToggle?: (e: MouseEvent) => void;
		tabs?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<div class="layout">
	<div class="layout-titlebar">
		<TitleBar {title} {logo} {subtitle} {theme} {onThemeToggle} />
	</div>
	<div class="layout-body">
		{#if tabs}
			<aside class="layout-tabs">
				{@render tabs()}
			</aside>
		{/if}
		<main class="layout-content">
			{@render children?.()}
		</main>
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
	.layout-titlebar {
		flex-shrink: 0;
	}
	.layout-body {
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
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 20px 24px;
		margin: 0 8px 8px;
		border: 1px solid var(--border);
		border-radius: var(--radius-xl);
		background: var(--surface, var(--bg));
	}
</style>

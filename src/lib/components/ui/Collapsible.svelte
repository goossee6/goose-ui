<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = false,
		disabled = false,
		onchange,
		variant = 'card',
		chevron = 'end',
		lazy = false,
		trigger,
		header,
		children,
		class: cls = '',
		triggerClass = '',
		bodyClass = '',
		style = '',
	}: {
		open?: boolean;
		disabled?: boolean;
		onchange?: (open: boolean) => void;
		/** card：独立卡片（默认）；plain：无边框/内边距，适合嵌入列表或自定义容器 */
		variant?: 'card' | 'plain';
		/** 内置触发器的箭头位置；none 表示自绘箭头（配合 header 使用） */
		chevron?: 'end' | 'start' | 'none';
		/** 收起时不渲染 children（不做收起动画），长列表可省下大量 DOM */
		lazy?: boolean;
		trigger?: Snippet;
		/**
		 * 自定义头部：提供时用普通 div 代替内置 button，由调用方自己渲染
		 * 触发器（可包含多个按钮），并拿到 contentId 设 aria-controls。
		 */
		header?: Snippet<[{ open: boolean; contentId: string }]>;
		children?: Snippet;
		class?: string;
		triggerClass?: string;
		bodyClass?: string;
		style?: string;
	} = $props();

	const uid = $props.id();
	const contentId = `${uid}-content`;
	const triggerId = `${uid}-trigger`;

	function toggle() {
		if (disabled) return;
		onchange?.(!open);
	}
</script>

{#snippet chevronIcon()}
	<svg
		class="collapsible-chevron"
		class:open
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<polyline points="6 9 12 15 18 9" />
	</svg>
{/snippet}

<div
	class="collapsible collapsible--{variant} {cls}"
	class:collapsible--open={open}
	{style}
>
	{#if header}
		<div class="collapsible-header">
			{@render header({ open, contentId })}
		</div>
	{:else}
		<button
			type="button"
			id={triggerId}
			class="collapsible-trigger {triggerClass}"
			{disabled}
			aria-expanded={open}
			aria-controls={contentId}
			onclick={toggle}
		>
			{#if chevron === 'start'}
				{@render chevronIcon()}
			{/if}
			{@render trigger?.()}
			{#if chevron === 'end'}
				{@render chevronIcon()}
			{/if}
		</button>
	{/if}
	{#if !lazy || open}
		<div
			id={contentId}
			class="collapsible-content"
			class:open
			role="region"
			aria-labelledby={header ? undefined : triggerId}
		>
			<div class="collapsible-inner">
				<div class="collapsible-body {bodyClass}">
					{@render children?.()}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.collapsible {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	/* 嵌入列表：去掉卡片外观，头部/内容的内边距交给调用方 */
	.collapsible--plain {
		border: none;
		border-radius: 0;
		overflow: visible;
	}
	.collapsible-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-md);
		width: 100%;
		padding: var(--sp-lg);
		border: none;
		background: transparent;
		color: var(--text);
		font-size: 14px;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.15s;
	}
	.collapsible-trigger:hover:not(:disabled) {
		background-color: var(--hover);
	}
	.collapsible-trigger:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: -2px;
	}
	.collapsible-trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.collapsible-chevron {
		flex-shrink: 0;
		margin-left: auto;
		color: var(--text-muted);
		transition: transform 0.25s ease;
	}
	.collapsible-chevron.open {
		transform: rotate(180deg);
	}
	/* 自定义头部：自身不承担点击，只做布局容器 */
	.collapsible-header {
		min-width: 0;
	}
	.collapsible-content {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.25s ease;
	}
	.collapsible-content.open {
		grid-template-rows: 1fr;
	}
	.collapsible-inner {
		overflow: hidden;
		min-height: 0;
	}
	.collapsible-body {
		padding: var(--sp-lg);
		border-top: 1px solid var(--border);
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.7;
	}
	.collapsible--plain .collapsible-trigger {
		padding: 0;
	}
	.collapsible--plain .collapsible-body {
		padding: 0;
		border-top: none;
		font-size: inherit;
		color: inherit;
		line-height: inherit;
	}
</style>

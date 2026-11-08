<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	let {
		icon,
		title = '暂无数据',
		hint = '',
		class: cls = '',
		style = '',
		children,
	}: {
		/** lucide 图标组件，如 Shield、HardDrive */
		icon?: Component<{ size?: number }>;
		title?: string;
		hint?: string;
		class?: string;
		style?: string;
		/** 操作区（如按钮） */
		children?: Snippet;
	} = $props();
</script>

<div class="empty {cls}" style={style} role="status">
	{#if icon}
		{@const I = icon}
		<span class="empty-icon"><I size={40} /></span>
	{/if}
	<p class="empty-title">{title}</p>
	{#if hint}
		<p class="empty-hint">{hint}</p>
	{/if}
	{#if children}
		<div class="empty-actions">{@render children()}</div>
	{/if}
</div>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-10);
		text-align: center;
	}
	.empty-icon {
		display: flex;
		color: var(--text-muted);
		opacity: 0.6;
	}
	.empty-title {
		margin: 0;
		font-size: var(--fs-14);
		color: var(--text-muted);
	}
	.empty-hint {
		margin: 0;
		font-size: var(--fs-12);
		color: var(--text-muted);
		opacity: 0.75;
	}
	.empty-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-top: var(--space-1);
	}
</style>

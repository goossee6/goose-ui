<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Minus from '@lucide/svelte/icons/minus';
	import Square from '@lucide/svelte/icons/square';
	import X from '@lucide/svelte/icons/x';
	import Icon from './Icon.svelte';

	let {
		title = '',
		logo,
		subtitle,
		theme = 'light',
		onThemeToggle,
		controls,
		windowControls = true,
		class: cls = '',
		style = '',
	}: {
		title?: string;
		logo?: string | Component<{ size?: number; class?: string }>;
		subtitle?: string;
		theme?: 'light' | 'dark';
		onThemeToggle?: (e: MouseEvent) => void;
		/** 自定义按钮区 snippet（渲染在窗口控制键之前，与默认键共存） */
		controls?: Snippet;
		/** false 不渲染默认窗口三键（如浏览器环境） */
		windowControls?: boolean;
		class?: string;
		style?: string;
	} = $props();

	const logoText = $derived(typeof logo === 'string' ? logo : logo === undefined ? title : '');

	let isMaximised = $state(false);
	let isWails = $state(false);
	let Window: any = null;

	onMount(async () => {
		try {
			const mod = await import('@wailsio/runtime');
			const w = mod.Window;
			const maximised = await w.IsMaximised();
			Window = w;
			isMaximised = maximised;
			isWails = true;
		} catch {
			Window = null;
			isWails = false;
		}
	});

	function handleMinimise() {
		Window?.Minimise();
	}

	async function handleMaximise() {
		if (!Window) return;
		if (isMaximised) {
			await Window.Restore();
		} else {
			await Window.Maximise();
		}
		isMaximised = await Window.IsMaximised();
	}

	function handleClose() {
		Window?.Close();
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="titlebar {cls}" style={style} ondblclick={handleMaximise}>
	<div class="titlebar-left">
		{#if logo !== undefined && typeof logo !== 'string'}
			<span class="titlebar-logo-icon">
				<Icon icon={logo} size={18} />
			</span>
			<div class="titlebar-subtitle">{subtitle ?? title}</div>
		{:else}
			{#if logoText}
				<div class="titlebar-title titlebar-logo">{logoText}</div>
			{/if}
			{#if subtitle}
				<div class="titlebar-subtitle">{subtitle}</div>
			{/if}
		{/if}
	</div>
	<div class="titlebar-controls">
		{#if onThemeToggle}
			<button type="button" class="win-btn" onclick={onThemeToggle} title={theme === 'dark' ? '浅色模式' : '深色模式'}>
				<Icon icon={theme === 'dark' ? Sun : Moon} size={14} />
			</button>
		{/if}
		{#if controls}
			{@render controls()}
		{/if}
		{#if windowControls}
			<button type="button" class="win-btn" disabled={!isWails} onclick={handleMinimise} aria-label="最小化">
				<Icon icon={Minus} size={14} />
			</button>
			<button type="button" class="win-btn" disabled={!isWails} onclick={handleMaximise} aria-label={isMaximised ? '还原' : '最大化'}>
				<Icon icon={Square} size={12} />
			</button>
			<button type="button" class="win-btn win-btn-close" disabled={!isWails} onclick={handleClose} aria-label="关闭">
				<Icon icon={X} size={16} />
			</button>
		{/if}
	</div>
</div>

<style>
	.titlebar {
		--wails-draggable: drag;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: var(--titlebar-h, 42px);
		min-height: var(--titlebar-h, 42px);
		padding: 0 0 0 16px;
		background: transparent;
		user-select: none;
	}

	.titlebar-left {
		display: flex;
		align-items: baseline;
		gap: 12px;
		min-width: 0;
	}

	.titlebar-title {
		font-size: 12px;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		pointer-events: none;
	}

	.titlebar-logo {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-strong);
		background: var(--titlebar-logo-gradient, linear-gradient(135deg, #3b82f6, #8b5cf6));
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.titlebar-logo-icon {
		display: flex;
		align-items: center;
		align-self: center;
		color: var(--titlebar-logo-color, var(--primary, #3b82f6));
		pointer-events: none;
	}

	.titlebar-subtitle {
		font-size: 12px;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		pointer-events: none;
	}

	.titlebar-controls {
		--wails-draggable: no-drag;
		display: flex;
		align-items: center;
	}

	.win-btn {
		--wails-draggable: no-drag;
		width: 46px;
		height: var(--titlebar-h, 42px);
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.win-btn:hover {
		background-color: var(--hover);
		color: var(--text-strong);
	}

	.win-btn:disabled {
		color: var(--border-strong);
		cursor: default;
	}

	.win-btn:disabled:hover {
		background-color: transparent;
	}

	.win-btn-close:hover {
		background-color: #c42b1c;
		color: white;
	}
</style>

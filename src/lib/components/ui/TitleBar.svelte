<script lang="ts">
	import { onMount } from 'svelte';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Minus from '@lucide/svelte/icons/minus';
	import Square from '@lucide/svelte/icons/square';
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import X from '@lucide/svelte/icons/x';
	import Icon from './Icon.svelte';

	let {
		title = '',
		theme = 'light',
		onThemeToggle,
	}: {
		title?: string;
		theme?: 'light' | 'dark';
		onThemeToggle?: (e: MouseEvent) => void;
	} = $props();

	let isMaximised = $state(false);
	let Window: any = null;
	const isWails = typeof window !== 'undefined' && '__wailsInvoke__' in window;

	onMount(async () => {
		if (isWails) {
			try {
				const mod = await import('@wailsio/runtime');
				Window = mod.Window;
				Window.IsMaximised().then((v: boolean) => { isMaximised = v; });
			} catch {}
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
<div class="titlebar" ondblclick={handleMaximise}>
	<div class="titlebar-title">{title}</div>
	<div class="titlebar-controls">
		{#if onThemeToggle}
			<button type="button" class="win-btn" onclick={onThemeToggle} title={theme === 'dark' ? '浅色模式' : '深色模式'}>
				<Icon icon={theme === 'dark' ? Sun : Moon} size={14} />
			</button>
		{/if}
		<button type="button" class="win-btn" onclick={handleMinimise} aria-label="最小化">
			<Icon icon={Minus} size={14} />
		</button>
		<button type="button" class="win-btn" disabled={!isWails} onclick={handleMaximise} aria-label={isMaximised ? '还原' : '最大化'}>
			<Icon icon={isMaximised ? Undo2 : Square} size={12} />
		</button>
		<button type="button" class="win-btn win-btn-close" onclick={handleClose} aria-label="关闭">
			<Icon icon={X} size={16} />
		</button>
	</div>
</div>

<style>
	.titlebar {
		--wails-draggable: drag;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 42px;
		min-height: 42px;
		padding: 0 0 0 8px;
		background: transparent;
		user-select: none;
	}

	.titlebar-title {
		font-size: 12px;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		height: 42px;
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

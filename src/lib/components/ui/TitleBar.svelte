<script lang="ts">
	import { onMount } from 'svelte';
	import { Window } from '@wailsio/runtime';
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
	const isWails = typeof window !== 'undefined' && '__wailsInvoke__' in window;

	onMount(() => {
		if (isWails) {
			Window.IsMaximised().then((v: boolean) => { isMaximised = v; });
		}
	});

	function handleMinimise() {
		Window.Minimise();
	}

	async function handleMaximise() {
		if (isMaximised) {
			await Window.Restore();
		} else {
			await Window.Maximise();
		}
		isMaximised = await Window.IsMaximised();
	}

	function handleClose() {
		Window.Close();
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="titlebar" ondblclick={handleMaximise}>
	<div class="titlebar-title">{title}</div>
	<div class="titlebar-controls">
		{#if onThemeToggle}
			<button type="button" class="win-btn" onclick={onThemeToggle} title={theme === 'dark' ? '浅色模式' : '深色模式'}>
				<Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} />
			</button>
		{/if}
		<button type="button" class="win-btn" onclick={handleMinimise} aria-label="最小化">
			<Icon name="minimize" size={11} />
		</button>
		<button type="button" class="win-btn" onclick={handleMaximise} aria-label={isMaximised ? '还原' : '最大化'}>
			<Icon name={isMaximised ? 'restore' : 'maximize'} size={11} />
		</button>
		<button type="button" class="win-btn win-btn-close" onclick={handleClose} aria-label="关闭">
			<Icon name="close-window" size={11} />
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
		background-color: rgba(255, 255, 255, 0.15);
		color: var(--text-strong);
	}

	.win-btn-close:hover {
		background-color: #c42b1c;
		color: white;
	}
</style>

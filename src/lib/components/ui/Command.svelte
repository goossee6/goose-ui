<script lang="ts" module>
	export interface CommandItem {
		value: string;
		label: string;
		group?: string;
		keywords?: string;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import PillTrack from './PillTrack.svelte';

	let {
		open = $bindable(false),
		items = [],
		placeholder = '输入命令或搜索…',
		emptyText = '无匹配结果',
		onSelect,
		class: cls = '',
		style = '',
	}: {
		open?: boolean;
		items?: CommandItem[];
		placeholder?: string;
		emptyText?: string;
		onSelect?: (item: CommandItem) => void;
		class?: string;
		style?: string;
	} = $props();

	let inputEl = $state<HTMLInputElement | null>(null);
	let listEl = $state<HTMLElement | null>(null);
	let query = $state('');
	let activeIndex = $state(0);

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return items;
		return items.filter(
			(it) =>
				!it.disabled &&
				(it.label.toLowerCase().includes(q) ||
					(it.keywords ?? '').toLowerCase().includes(q) ||
					it.value.toLowerCase().includes(q))
		);
	});

	const groups = $derived.by(() => {
		const map = new Map<string, CommandItem[]>();
		for (const it of filtered) {
			const g = it.group ?? '';
			if (!map.has(g)) map.set(g, []);
			map.get(g)!.push(it);
		}
		return [...map.entries()];
	});

	function show() {
		open = true;
		query = '';
		activeIndex = 0;
		requestAnimationFrame(() => inputEl?.focus());
	}

	function hide() {
		open = false;
	}

	function toggle() {
		open ? hide() : show();
	}

	function pick(idx: number) {
		const it = filtered[idx];
		if (!it || it.disabled) return;
		hide();
		onSelect?.(it);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.stopPropagation();
			hide();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (filtered.length) activeIndex = (activeIndex + 1) % filtered.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (filtered.length) activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			// filtered 可能因输入变短，先钳位再取
			pick(Math.min(activeIndex, filtered.length - 1));
		} else if (e.key === 'Home') {
			activeIndex = 0;
		} else if (e.key === 'End') {
			activeIndex = Math.max(0, filtered.length - 1);
		}
	}

	$effect(() => {
		const onDocKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				open ? hide() : show();
			}
		};
		window.addEventListener('keydown', onDocKey);
		return () => window.removeEventListener('keydown', onDocKey);
	});
</script>

<button
	type="button"
	class="command-trigger {cls}"
	onclick={toggle}
	style={style}
	aria-haspopup="dialog"
	aria-expanded={open}
>
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
	<span class="command-trigger-text">{placeholder}</span>
	<kbd class="command-kbd">Ctrl K</kbd>
</button>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="command-overlay" role="presentation" transition:fade={{ duration: 120 }} onclick={hide}>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="command-dialog"
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-label="命令面板"
			transition:scale={{ duration: 140, start: 0.96 }}
			onkeydown={onKeydown}
			onclick={(e) => e.stopPropagation()}
		>
			<div class="command-input-row">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
				<input
					bind:this={inputEl}
					class="command-input"
					type="text"
					{placeholder}
					bind:value={query}
					role="combobox"
					aria-expanded="true"
					aria-controls="command-list"
					aria-activedescendant={filtered[activeIndex] ? `command-opt-${activeIndex}` : undefined}
				/>
				<kbd class="command-kbd">Esc</kbd>
			</div>
			<ul class="command-list" id="command-list" role="listbox" bind:this={listEl}>
				<PillTrack
					container={listEl}
					activeSelector=".command-item.active"
					background="color-mix(in srgb, var(--primary) 15%, transparent)"
					radius="var(--radius-md)"
				/>
				{#if !filtered.length}
					<li class="command-empty" role="presentation">{emptyText}</li>
				{/if}
				{#each groups as [group, list] (group)}
					{#if group}
						<li class="command-group" role="presentation">{group}</li>
					{/if}
					{#each list as it (it.value)}
						{@const i = filtered.indexOf(it)}
						<li
							class="command-item"
							class:active={i === activeIndex}
							id="command-opt-{i}"
							role="option"
							aria-selected={i === activeIndex}
							onmousedown={(e) => {
								e.preventDefault();
								pick(i);
							}}
							onmouseenter={() => (activeIndex = i)}
						>
							<span>{it.label}</span>
							{#if it.value !== it.label}
								<span class="command-item-value">{it.value}</span>
							{/if}
						</li>
					{/each}
				{/each}
			</ul>
		</div>
	</div>
{/if}

<style>
	.command-trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-md);
		padding: var(--sp-md) var(--sp-lg);
		min-width: 240px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--text-muted);
		font-size: 13px;
		cursor: pointer;
		transition: border-color 0.15s, background-color 0.15s;
	}
	.command-trigger:hover {
		border-color: var(--primary);
		background: var(--hover);
	}
	.command-trigger-text {
		flex: 1;
		text-align: left;
	}
	.command-kbd {
		font-family: var(--font-mono);
		font-size: 11px;
		padding: 2px 6px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		background: var(--surface-2);
		color: var(--text-muted);
	}
	.command-overlay {
		position: fixed;
		inset: 0;
		z-index: var(--z-dialog);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 12vh var(--sp-lg) var(--sp-lg);
		background: var(--overlay);
		backdrop-filter: blur(2px);
	}
	.command-dialog {
		width: 100%;
		max-width: 480px;
		background: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		max-height: 60vh;
	}
	.command-input-row {
		display: flex;
		align-items: center;
		gap: var(--sp-md);
		padding: var(--sp-lg) var(--sp-lg);
		border-bottom: 1px solid var(--border);
		color: var(--text-muted);
	}
	.command-input {
		flex: 1;
		border: none;
		background: none;
		outline: none;
		font-size: 14px;
		color: var(--text-strong);
		font-family: inherit;
	}
	.command-input::placeholder {
		color: var(--text-muted);
	}
	.command-list {
		position: relative;
		list-style: none;
		margin: 0;
		padding: var(--sp-sm);
		overflow-y: auto;
	}
	.command-group {
		padding: var(--sp-sm) var(--sp-lg) 2px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}
	.command-item {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-md);
		padding: var(--sp-md) var(--sp-lg);
		border-radius: var(--radius-md);
		font-size: 13px;
		color: var(--text);
		cursor: pointer;
	}
	.command-item.active {
		color: var(--text-strong);
	}
	.command-item-value {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-muted);
	}
	.command-empty {
		padding: 24px;
		text-align: center;
		font-size: 13px;
		color: var(--text-muted);
	}
</style>

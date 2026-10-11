<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface DropdownMenuItem {
		value?: string;
		label?: string;
		icon?: Snippet | string;
		disabled?: boolean;
		danger?: boolean;
		separator?: boolean;
	}
</script>

<script lang="ts">
	import PillTrack from './PillTrack.svelte';

	let {
		open = $bindable(false),
		items = [],
		placement = 'bottom-start',
		onselect,
		onOpenChange,
		trigger,
		children,
		class: cls = '',
		style = '',
	}: {
		open?: boolean;
		items?: DropdownMenuItem[];
		placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
		onselect?: (item: DropdownMenuItem, index: number) => void;
		onOpenChange?: (open: boolean) => void;
		trigger?: Snippet;
		children?: Snippet;
		class?: string;
		style?: string;
	} = $props();

	let rootEl = $state<HTMLElement | null>(null);
	let menuEl = $state<HTMLElement | null>(null);
	let flipUp = $state(false);
	let flipX = $state(false);
	let activeIndex = $state(-1);

	const selectable = $derived(items.map((it, i) => ({ it, i })).filter(({ it }) => !it.separator && !it.disabled));

	function measure() {
		if (!rootEl || !menuEl) return;
		const r = rootEl.getBoundingClientRect();
		const h = menuEl.offsetHeight;
		const w = menuEl.offsetWidth;
		flipUp = placement.startsWith('top') ? false : r.bottom + h + 8 > window.innerHeight && r.top - h - 8 > 8;
		if (placement.startsWith('top')) flipUp = true;
		flipX = placement.endsWith('end');
		if (flipX && r.right - w < 8) flipX = false;
	}

	function openMenu(idx = -1) {
		open = true;
		onOpenChange?.(true);
		activeIndex = idx;
		requestAnimationFrame(() => {
			measure();
			focusItem(idx);
		});
	}

	function close(focusTrigger = false) {
		if (open) onOpenChange?.(false);
		open = false;
		activeIndex = -1;
		if (focusTrigger) rootEl?.querySelector<HTMLElement>('button, [role="button"]')?.focus();
	}

	function focusItem(idx: number) {
		const btns = menuEl?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)');
		if (!btns?.length) return;
		const real = [...btns].findIndex((b) => b.dataset.idx === String(idx));
		if (real >= 0) btns[real].focus();
	}

	function step(dir: 1 | -1) {
		if (!selectable.length) return;
		const pos = selectable.findIndex(({ i }) => i === activeIndex);
		const next = pos < 0 ? 0 : (pos + dir + selectable.length) % selectable.length;
		activeIndex = selectable[next].i;
		focusItem(activeIndex);
	}

	function onTriggerClick() {
		open ? close() : openMenu();
	}

	function onMenuKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.stopPropagation();
			close(true);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			step(1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			step(-1);
		} else if (e.key === 'Home') {
			e.preventDefault();
			if (selectable.length) { activeIndex = selectable[0].i; focusItem(activeIndex); }
		} else if (e.key === 'End') {
			e.preventDefault();
			if (selectable.length) { activeIndex = selectable[selectable.length - 1].i; focusItem(activeIndex); }
		} else if (e.key === 'Tab') {
			close();
		}
	}

	function pick(item: DropdownMenuItem, i: number) {
		if (item.disabled || item.separator) return;
		close(true);
		onselect?.(item, i);
	}

	$effect(() => {
		if (!open) return;
		const onDocDown = (e: MouseEvent) => {
			if (rootEl && !rootEl.contains(e.target as Node)) close();
		};
		const onScroll = () => measure();
		const onResize = () => measure();
		document.addEventListener('mousedown', onDocDown);
		window.addEventListener('scroll', onScroll, true);
		window.addEventListener('resize', onResize);
		return () => {
			document.removeEventListener('mousedown', onDocDown);
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', onResize);
		};
	});

	function dropdownFade(node: HTMLElement, params: { up: boolean }) {
		return {
			duration: 120,
			css: (t: number) => {
				const y = params.up ? 4 : -4;
				return `opacity: ${t}; transform: translateY(${(1 - t) * y}px);`;
			},
		};
	}
</script>

<div class="dropdown-root {cls}" bind:this={rootEl} style={style}>
	<button
		type="button"
		class="dropdown-trigger"
		aria-haspopup="menu"
		aria-expanded={open}
		onclick={onTriggerClick}
		onkeydown={(e) => {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				openMenu(selectable[0]?.i ?? -1);
			} else if (e.key === 'Escape' && open) {
				e.stopPropagation();
				close();
			}
		}}
	>
		{@render trigger?.()}
	</button>
	{#if open}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="dropdown-menu"
			class:flip-up={flipUp}
			class:flip-x={flipX}
			role="menu"
			tabindex="-1"
			bind:this={menuEl}
			onkeydown={onMenuKeydown}
			transition:dropdownFade={{ up: flipUp }}
		>
			<PillTrack
				container={menuEl}
				itemSelector=".dropdown-item:not(.danger)"
				showSelected={false}
				hoverBackground="color-mix(in srgb, var(--primary) 15%, transparent)"
				radius="var(--radius-md)"
			/>
			{@render children?.()}
			{#each items as item, i (i)}
				{#if item.separator}
					<div class="dropdown-separator" role="separator"></div>
				{:else}
					<button
						type="button"
						class="dropdown-item"
						class:danger={item.danger}
						role="menuitem"
						data-idx={i}
						tabindex={activeIndex === i ? 0 : -1}
						disabled={item.disabled}
						onclick={() => pick(item, i)}
						onfocus={() => (activeIndex = i)}
					>
						{#if typeof item.icon === 'string'}
							<span class="dropdown-item-icon">{item.icon}</span>
						{:else if item.icon}
							{@render item.icon()}
						{/if}
						<span class="dropdown-item-label">{item.label}</span>
					</button>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.dropdown-root {
		position: relative;
		display: inline-block;
	}
	.dropdown-trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-sm);
		padding: var(--sp-md) var(--sp-lg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--text);
		font-size: 13px;
		cursor: pointer;
		transition: background-color 0.15s, border-color 0.15s;
	}
	.dropdown-trigger:hover {
		background-color: var(--hover);
		border-color: var(--border-strong);
	}
	.dropdown-trigger:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.dropdown-menu {
		position: absolute;
		z-index: var(--z-dropdown);
		min-width: 180px;
		max-width: min(320px, calc(100vw - 16px));
		padding: var(--sp-sm);
		background-color: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		top: calc(100% + 6px);
		left: 0;
	}
	.dropdown-menu.flip-up {
		top: auto;
		bottom: calc(100% + 6px);
	}
	.dropdown-menu.flip-x {
		left: auto;
		right: 0;
	}
	.dropdown-item {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--sp-md);
		width: 100%;
		padding: var(--sp-md) var(--sp-lg);
		border: none;
		border-radius: var(--radius-md);
		background: none;
		color: var(--text);
		font-size: 13px;
		text-align: left;
		cursor: pointer;
		white-space: nowrap;
	}
	.dropdown-item:hover:not(:disabled) {
		color: var(--text-strong);
	}
	.dropdown-item:focus-visible {
		background-color: var(--hover);
		color: var(--text-strong);
		outline: none;
	}
	.dropdown-item:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.dropdown-item.danger {
		color: var(--danger);
	}
	.dropdown-item.danger:hover:not(:disabled) {
		background-color: color-mix(in srgb, var(--danger) 12%, transparent);
	}
	.dropdown-item-icon {
		color: var(--text-muted);
		flex-shrink: 0;
	}
	.dropdown-item-label {
		flex: 1;
	}
	.dropdown-separator {
		height: 1px;
		margin: var(--sp-sm) 0;
		background-color: var(--border);
	}
</style>

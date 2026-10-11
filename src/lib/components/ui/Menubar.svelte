<script lang="ts" module>
	import type { DropdownMenuItem } from './DropdownMenu.svelte';

	export interface MenubarMenu {
		value: string;
		label: string;
		items: DropdownMenuItem[];
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import DropdownMenu from './DropdownMenu.svelte';

	let {
		menus = [],
		onselect,
		class: cls = '',
		style = '',
	}: {
		menus?: MenubarMenu[];
		onselect?: (menuValue: string, item: DropdownMenuItem, index: number) => void;
		class?: string;
		style?: string;
	} = $props();

	let openValue = $state<string | null>(null);
	let barEl = $state<HTMLElement | null>(null);

	function openMenu(v: string) {
		if (menus.find((m) => m.value === v)?.disabled) return;
		openValue = v;
	}

	function closeMenu() {
		if (openValue !== null) openValue = null;
	}

	function handleSelect(menuValue: string) {
		return (item: DropdownMenuItem, index: number) => {
			openValue = null;
			onselect?.(menuValue, item, index);
		};
	}

	function onBarKeydown(e: KeyboardEvent) {
		if (!barEl) return;
		const triggers = [...barEl.querySelectorAll<HTMLElement>('.menubar-trigger')];
		const idx = triggers.indexOf(document.activeElement as HTMLElement);
		if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
			e.preventDefault();
			if (idx < 0) return;
			const next = (idx + (e.key === 'ArrowRight' ? 1 : -1) + triggers.length) % triggers.length;
			triggers[next].focus();
			if (openValue !== null) {
				const v = triggers[next].dataset.menu;
				if (v) openMenu(v);
			}
		} else if (e.key === 'Escape' && openValue !== null) {
			e.stopPropagation();
			closeMenu();
		}
	}
</script>

<div
	class="menubar {cls}"
	role="menubar"
	tabindex="-1"
	bind:this={barEl}
	onkeydown={onBarKeydown}
	style={style}
>
	{#each menus as menu (menu.value)}
		<DropdownMenu
			open={openValue === menu.value}
			items={menu.items}
			onOpenChange={(o) => (o ? openMenu(menu.value) : closeMenu())}
			onselect={handleSelect(menu.value)}
		>
			{#snippet trigger()}
				<span class="menubar-trigger" data-menu={menu.value} class:disabled={menu.disabled} aria-disabled={menu.disabled}>
					{menu.label}
				</span>
			{/snippet}
		</DropdownMenu>
	{/each}
</div>

<style>
	.menubar {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: var(--sp-sm);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
	}
	.menubar :global(.dropdown-root) {
		display: inline-block;
	}
	.menubar :global(.dropdown-trigger) {
		border: none;
		background: none;
		padding: var(--sp-md) var(--sp-lg);
		border-radius: var(--radius-md);
	}
	.menubar :global(.dropdown-trigger:hover) {
		background-color: var(--hover);
	}
	.menubar :global(.dropdown-trigger[aria-expanded='true']) {
		background-color: var(--hover);
		color: var(--text-strong);
	}
	.menubar-trigger {
		display: inline-flex;
		align-items: center;
		font-size: 13px;
		white-space: nowrap;
	}
	.menubar-trigger.disabled {
		opacity: 0.45;
	}
</style>

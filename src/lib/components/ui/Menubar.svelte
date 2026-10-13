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
		// 必须选真正可聚焦的 <button class="dropdown-trigger">：
		// 触发器 snippet 里的 <span class="menubar-trigger"> 不可聚焦，
		// 用它当 roving 目标会让 document.activeElement 永远对不上、focus() 也是空操作。
		const triggers = [...barEl.querySelectorAll<HTMLElement>('.dropdown-trigger:not(:disabled)')];
		const idx = triggers.indexOf(document.activeElement as HTMLElement);
		if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
			e.preventDefault();
			if (idx < 0 || !triggers.length) return;
			const next = (idx + (e.key === 'ArrowRight' ? 1 : -1) + triggers.length) % triggers.length;
			triggers[next].focus();
			if (openValue !== null) {
				const v = triggers[next].dataset.menu;
				// openMenu 内部已有 disabled 守卫
				if (v) openMenu(v);
			}
		} else if (e.key === 'Escape' && openValue !== null) {
			e.stopPropagation();
			closeMenu();
		}
	}

	// menubar 的 roving 模式：已有菜单展开时，焦点落到相邻触发器即切换该菜单
	function onTriggerFocus(value: string) {
		if (openValue !== null) openMenu(value);
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
			disabled={menu.disabled}
			triggerMenu={menu.value}
			onOpenChange={(o) => (o ? openMenu(menu.value) : closeMenu())}
			onselect={handleSelect(menu.value)}
		>
			{#snippet trigger()}
				<span
					class="menubar-trigger"
					class:disabled={menu.disabled}
					onfocusin={() => onTriggerFocus(menu.value)}
				>
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

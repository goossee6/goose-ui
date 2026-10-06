<script lang="ts" module>
	export interface NavMenuItem {
		value: string;
		label: string;
		href?: string;
		disabled?: boolean;
		children?: { value: string; label: string; href?: string; description?: string; disabled?: boolean }[];
	}
</script>

<script lang="ts">
	import { floatingPosition } from './floatingPosition';

	let {
		items = [],
		active = '',
		onselect,
		class: cls = '',
		style = '',
	}: {
		items?: NavMenuItem[];
		active?: string;
		onselect?: (value: string) => void;
		class?: string;
		style?: string;
	} = $props();

	let openValue = $state<string | null>(null);
	let navEl = $state<HTMLElement | null>(null);
	let panelEl = $state<HTMLElement | null>(null);
	let panelStyle = $state('');
	let flipUp = $state(false);

	function panelWidth(item: NavMenuItem): number {
		return Math.min(
			Math.max(240, ...((item.children ?? []).map((c) => c.label.length * 8 + (c.description?.length ?? 0) * 6 + 48))),
			560
		);
	}

	function openMenu(v: string) {
		openValue = v;
		const item = items.find((i) => i.value === v);
		if (!item?.children?.length) return;
		requestAnimationFrame(() => {
			if (!navEl) return;
			const trigger = navEl.querySelector<HTMLElement>(`[data-nav-value="${v}"]`);
			if (!trigger) return;
			const r = floatingPosition(trigger.getBoundingClientRect(), {
				panelW: panelWidth(item),
				panelH: panelEl?.offsetHeight ?? 200,
				gap: 6,
			});
			flipUp = r.flipUp;
			panelStyle = r.style;
		});
	}

	function closeMenu() {
		openValue = null;
	}

	function handleSelect(value: string) {
		openValue = null;
		onselect?.(value);
	}

	function onNavKeydown(e: KeyboardEvent) {
		if (!navEl) return;
		const triggers = [...navEl.querySelectorAll<HTMLElement>('[data-nav-value]')];
		const idx = triggers.indexOf(document.activeElement as HTMLElement);
		if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
			e.preventDefault();
			if (idx < 0) return;
			const next = (idx + (e.key === 'ArrowRight' ? 1 : -1) + triggers.length) % triggers.length;
			triggers[next].focus();
			const v = triggers[next].dataset.navValue;
			if (openValue !== null && v) openMenu(v);
		} else if (e.key === 'ArrowDown' && idx >= 0 && triggers[idx].getAttribute('aria-haspopup')) {
			e.preventDefault();
			openMenu(triggers[idx].dataset.navValue ?? '');
		} else if (e.key === 'Escape' && openValue) {
			e.stopPropagation();
			closeMenu();
		}
	}

	$effect(() => {
		if (!openValue) return;
		const onDocDown = (e: MouseEvent) => {
			if (navEl && !navEl.contains(e.target as Node)) closeMenu();
		};
		const onScroll = () => closeMenu();
		document.addEventListener('mousedown', onDocDown);
		window.addEventListener('scroll', onScroll, true);
		return () => {
			document.removeEventListener('mousedown', onDocDown);
			window.removeEventListener('scroll', onScroll, true);
		};
	});

	function panelFade(node: HTMLElement, params: { up: boolean }) {
		return {
			duration: 120,
			css: (t: number) => {
				const y = params.up ? 4 : -4;
				return `opacity: ${t}; transform: translateY(${(1 - t) * y}px);`;
			},
		};
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<nav class="navmenu {cls}" bind:this={navEl} aria-label="主导航" onkeydown={onNavKeydown} style={style}>
	<ul class="navmenu-list">
		{#each items as item (item.value)}
			<li class="navmenu-item" class:disabled={item.disabled}>
				{#if item.children?.length}
					<button
						type="button"
						class="navmenu-trigger"
						data-nav-value={item.value}
						aria-haspopup="menu"
						aria-expanded={openValue === item.value}
						disabled={item.disabled}
						onclick={() => (openValue === item.value ? closeMenu() : openMenu(item.value))}
						onmouseenter={() => openValue !== null && openMenu(item.value)}
					>
						{item.label}
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
					</button>
				{:else}
					<a
						href={item.href ?? '#/'}
						class="navmenu-trigger"
						class:active={active === item.value}
						data-nav-value={item.value}
						aria-disabled={item.disabled}
						onclick={(e) => {
							if (item.disabled) {
								e.preventDefault();
								return;
							}
							handleSelect(item.value);
						}}
					>
						{item.label}
					</a>
				{/if}
			</li>
		{/each}
	</ul>

	{#if openValue}
		{@const item = items.find((i) => i.value === openValue)}
		{#if item?.children?.length}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				class="navmenu-panel"
				class:flip-up={flipUp}
				role="menu"
				style={panelStyle}
				bind:this={panelEl}
				transition:panelFade={{ up: flipUp }}
			>
				{#each item.children as child (child.value)}
					<a
						href={child.href ?? '#/'}
						class="navmenu-panel-item"
						class:active={active === child.value}
						role="menuitem"
						aria-disabled={child.disabled}
						onclick={(e) => {
							if (child.disabled) {
								e.preventDefault();
								return;
							}
							handleSelect(child.value);
						}}
					>
						<span class="navmenu-panel-label">{child.label}</span>
						{#if child.description}
							<span class="navmenu-panel-desc">{child.description}</span>
						{/if}
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</nav>

<style>
	.navmenu {
		position: relative;
		display: inline-block;
	}
	.navmenu-list {
		display: flex;
		align-items: center;
		gap: var(--sp-2xs);
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.navmenu-item.disabled {
		opacity: 0.45;
	}
	.navmenu-trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2xs);
		padding: var(--sp-sm) var(--sp-md);
		border: none;
		border-radius: var(--radius-md);
		background: none;
		color: var(--text);
		font-size: 13px;
		text-decoration: none;
		cursor: pointer;
		white-space: nowrap;
		transition: background-color 0.15s, color 0.15s;
	}
	.navmenu-trigger:hover,
	.navmenu-trigger.active {
		background-color: var(--hover);
		color: var(--text-strong);
	}
	.navmenu-trigger[aria-expanded='true'] {
		background-color: var(--hover);
		color: var(--text-strong);
	}
	.navmenu-trigger:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.navmenu-trigger svg {
		color: var(--text-muted);
	}
	.navmenu-panel {
		position: fixed;
		z-index: var(--z-dropdown);
		max-width: calc(100vw - 16px);
		padding: var(--sp-xs);
		background-color: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.navmenu-panel-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: var(--sp-sm) var(--sp-md);
		border-radius: var(--radius-md);
		color: var(--text);
		text-decoration: none;
		transition: background-color 0.15s;
	}
	.navmenu-panel-item:hover,
	.navmenu-panel-item.active {
		background-color: var(--hover);
	}
	.navmenu-panel-item:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: -2px;
	}
	.navmenu-panel-label {
		font-size: 13px;
	}
	.navmenu-panel-desc {
		font-size: 12px;
		color: var(--text-muted);
	}
</style>

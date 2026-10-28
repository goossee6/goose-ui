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
	import { menuIn, menuOut } from './menuTransition';

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
	let activeIdx = $state(-1);

	/**
	 * 当前要展开的那个「带子项」的项。
	 *
	 * 单独派生出来是为了把模板里的两层 {#if} 压成一层：
	 * Svelte 5 里嵌套 {#if} 内层元素**不会播放 in: 过渡**（实测：单层 if 能动画，
	 * 外面再包一层 if 就整段跳过 intro）。原来的写法是
	 * `{#if openValue}` → `{#if item?.children?.length}` → 面板，
	 * 于是面板的进入动画从来没生效过，只有离开是自己写的所以看不出来。
	 */
	const openItem = $derived(items.find((i) => i.value === openValue && i.children?.length));
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

	// 面板内可聚焦项（跳过 aria-disabled）
	function panelItems(): HTMLElement[] {
		return [...(panelEl?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])].filter(
			(el) => el.getAttribute('aria-disabled') !== 'true'
		);
	}

	// pos 为过滤后列表位置；activeIdx 存模板原始下标（data-panel-idx 对齐）
	function focusPanelPos(pos: number, wrap = true) {
		const els = panelItems();
		if (!els.length) return;
		const idx = wrap ? (pos + els.length) % els.length : Math.max(0, Math.min(pos, els.length - 1));
		const raw = Number(els[idx].dataset.panelIdx);
		activeIdx = Number.isNaN(raw) ? idx : raw;
		els[idx].focus();
	}

	// 当前焦点在过滤列表中的位置；不在面板内时按 dir 决定起点
	function stepPanel(dir: 1 | -1) {
		const els = panelItems();
		if (!els.length) return;
		const cur = els.findIndex((el) => Number(el.dataset.panelIdx) === activeIdx);
		focusPanelPos(cur < 0 ? (dir === 1 ? 0 : els.length - 1) : cur + dir);
	}

	function openMenu(v: string, focusTarget: 'first' | 'last' | null = null) {
		openValue = v;
		activeIdx = -1;
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
			// 键盘打开：焦点进入面板（鼠标 hover/点击不抢焦点）
			if (focusTarget === 'first') focusPanelPos(0);
			else if (focusTarget === 'last') focusPanelPos(-1);
		});
	}

	function closeMenu() {
		openValue = null;
		activeIdx = -1;
	}

	function handleSelect(value: string) {
		openValue = null;
		activeIdx = -1;
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
			const v = triggers[idx].dataset.navValue ?? '';
			if (openValue === v) focusPanelPos(0);
			else openMenu(v, 'first');
		} else if (e.key === 'ArrowUp' && idx >= 0 && triggers[idx].getAttribute('aria-haspopup')) {
			e.preventDefault();
			const v = triggers[idx].dataset.navValue ?? '';
			// ArrowUp 打开并聚焦最后一项（WAI-ARIA menu button）
			if (openValue === v) focusPanelPos(-1);
			else openMenu(v, 'last');
		} else if (e.key === 'Escape' && openValue) {
			e.stopPropagation();
			closeMenu();
		}
	}

	function onPanelKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			stepPanel(1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			stepPanel(-1);
		} else if (e.key === 'Home') {
			e.preventDefault();
			focusPanelPos(0, false);
		} else if (e.key === 'End') {
			e.preventDefault();
			focusPanelPos(panelItems().length - 1, false);
		} else if (e.key === 'Escape') {
			e.stopPropagation();
			const v = openValue;
			closeMenu();
			if (v) navEl?.querySelector<HTMLElement>(`[data-nav-value="${v}"]`)?.focus();
		} else if (e.key === 'Tab') {
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

	{#if openItem}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="navmenu-panel"
			class:flip-up={flipUp}
			role="menu"
			tabindex="-1"
			style={panelStyle}
			bind:this={panelEl}
			onkeydown={onPanelKeydown}
			in:menuIn={{ up: flipUp }}
			out:menuOut={{ up: flipUp }}
		>
			{#each openItem.children as child, i (child.value)}
				<a
					href={child.href ?? '#/'}
					class="navmenu-panel-item"
					class:active={active === child.value}
					role="menuitem"
					aria-disabled={child.disabled}
					data-panel-idx={i}
					tabindex={activeIdx === i ? 0 : -1}
					onfocus={() => (activeIdx = i)}
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
</nav>

<style>
	.navmenu {
		position: relative;
		display: inline-block;
	}
	.navmenu-list {
		display: flex;
		align-items: center;
		gap: 2px;
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
		gap: 2px;
		padding: var(--sp-md) var(--sp-lg);
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
		padding: var(--sp-sm);
		background-color: var(--popup-surface);
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
		padding: var(--sp-md) var(--sp-lg);
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

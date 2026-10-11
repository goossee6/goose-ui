<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { Snippet } from 'svelte';
	import { floatingPosition } from './floatingPosition';
	import PillTrack from './PillTrack.svelte';
	import ScrollZones from './ScrollZones.svelte';
	import Search from '@lucide/svelte/icons/search';
	import Plus from '@lucide/svelte/icons/plus';
	import Check from '@lucide/svelte/icons/check';

	interface Props {
		value?: string;
		items?: string[];
		loadItems?: () => Promise<string[]>;
		placeholder?: string;
		title?: string;
		disabled?: boolean;
		class?: string;
		style?: string;
		createText?: string;
		onCreateItem?: (name: string) => Promise<void>;
		loadingIndicator?: Snippet;
	}

	let {
		value = $bindable(''),
		items = [],
		loadItems,
		placeholder = '请选择',
		title = '请选择',
		disabled = false,
		class: cls = '',
		style = '',
		createText = '新建',
		onCreateItem,
		loadingIndicator,
	}: Props = $props();

	let open = $state(false);
	let mounted = $state(false);
	let query = $state('');
	let data = $state<string[]>(items);
	let loading = $state(false);
	let loaded = $state(false);
	let creating = $state(false);
	let activeIdx = $state(-1);
	let dropdownStyle = $state('');
	let wrapperEl: HTMLElement;
	let ddEl = $state<HTMLElement | null>(null);
	let listEl = $state<HTMLElement | null>(null);
	let searchEl = $state<HTMLInputElement>();

	const filtered = $derived(
		query.trim() === ''
			? data
			: data.filter((t) => t.toLowerCase().includes(query.trim().toLowerCase()))
	);

	const canCreate = $derived(
		query.trim() !== '' && !data.some((t) => t === query.trim())
	);

	function toggle() {
		if (disabled) return;
		if (open) {
			close();
		} else {
			open = true;
			query = '';
			activeIdx = -1;
			if (!loaded) loadData();
			tick().then(positionDropdown);
		}
	}

	function close() {
		open = false;
		mounted = false;
		query = '';
	}

	async function loadData() {
		loading = true;
		try {
			if (loadItems) {
				data = await loadItems();
			} else {
				data = items;
			}
			loaded = true;
		} catch {
			data = [];
		} finally {
			loading = false;
		}
	}

	function choose(name: string) {
		value = name;
		close();
	}

	async function handleCreate() {
		const name = query.trim();
		if (!name || creating || !onCreateItem) return;
		creating = true;
		try {
			await onCreateItem(name);
			data = [name, ...data];
			value = name;
			close();
		} catch {
			// 创建失败由父组件提示，保持打开供重试
		} finally {
			creating = false;
		}
	}

	function confirmSelection() {
		if (activeIdx >= 0 && filtered[activeIdx]) {
			choose(filtered[activeIdx]);
		} else if (query.trim() !== '') {
			if (data.some((t) => t === query.trim())) {
				choose(query.trim());
			} else if (canCreate) {
				handleCreate();
			}
		}
	}

	function onDropdownKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIdx = Math.min(activeIdx + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIdx = Math.max(activeIdx - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			confirmSelection();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			close();
		}
	}

	function onTriggerKeydown(e: KeyboardEvent) {
		if (disabled) return;
		if (!open && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
			e.preventDefault();
			toggle();
		}
	}

	async function positionDropdown() {
		if (!wrapperEl) return;
		const rect = wrapperEl.getBoundingClientRect();
		// 头部/搜索/页脚高度随 title、onCreateItem 变化 → 先写估算值，渲染后按实测 scrollHeight 校准
		const write = (h: number) => {
			const r = floatingPosition(rect, { panelW: Math.max(240, rect.width), panelH: h, gap: 4 });
			dropdownStyle = `position: fixed; z-index: var(--z-max); ${r.style}`;
		};
		write(estimateHeight());
		mounted = true;
		await tick();
		// scrollHeight 不含面板 1px×2 边框（border-box 的 max-height 含边框）→ 补 2
		const real = ddEl ? ddEl.scrollHeight + 2 : 0;
		if (real && Math.abs(real - estimateHeight()) > 1) write(real);
		searchEl?.focus();
	}

	/** 面板高度估算：chrome + 前 10 行 × 36px（无分组行）+ 面板边框 */
	function estimateHeight(): number {
		let chrome = 43 + 42; // .cs-header + .cs-search 恒在
		if (onCreateItem) chrome += 45; // .cs-footer（边框 1 + padding 4×2 + 按钮 36）
		const rows = filtered.length ? filtered.length * 36 : 44; // 空态文案行下限
		return chrome + Math.min(rows, 360) + 2;
	}

	// 打开期间跟随页面滚动/缩放（面板为 fixed，否则会脱离触发器）；输入过滤/异步加载后面板高度也会变
	$effect(() => {
		if (!open) return;
		void query;
		void filtered;
		tick().then(() => { if (open) positionDropdown(); });
		const onWin = (e: Event) => {
			if (listEl && e.target === listEl) return;
			positionDropdown();
		};
		window.addEventListener('scroll', onWin, true);
		window.addEventListener('resize', onWin);
		return () => {
			window.removeEventListener('scroll', onWin, true);
			window.removeEventListener('resize', onWin);
		};
	});

	function handleOutsideClick(e: MouseEvent) {
		if (wrapperEl && !wrapperEl.contains(e.target as Node)) close();
	}

	onMount(() => {
		document.addEventListener('mousedown', handleOutsideClick);
		return () => document.removeEventListener('mousedown', handleOutsideClick);
	});
</script>

<div bind:this={wrapperEl} class="cs-wrapper {cls}" style={style}>
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<button
		type="button"
		{disabled}
		onclick={toggle}
		onkeydown={onTriggerKeydown}
		aria-haspopup="listbox"
		aria-expanded={open}
		class="cs-trigger"
		class:cs-trigger--open={open}
		class:cs-trigger--placeholder={!value}
	>
		<span class="cs-value">{value || placeholder}</span>
		<svg class="cs-chevron" class:cs-chevron--open={open} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
	</button>

	{#if open && mounted}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="cs-dropdown" bind:this={ddEl} style={dropdownStyle} role="listbox" tabindex="-1" onkeydown={onDropdownKeydown}>
			<div class="cs-header">{title}</div>
			<div class="cs-search">
				<Search size={14} class="cs-search-icon" />
				<input
					bind:this={searchEl}
					bind:value={query}
					oninput={() => { activeIdx = filtered.length ? 0 : -1; }}
					placeholder="搜索或新建…"
					class="cs-search-input"
				/>
			</div>
			<div class="cs-listwrap">
				<div class="cs-list" bind:this={listEl}>
					<PillTrack
						container={listEl}
						activeSelector=".cs-option--active:not(.cs-option--selected)"
						background="color-mix(in srgb, var(--primary) 15%, transparent)"
						radius="var(--radius-md)"
					/>
					{#if loading}
						<div class="cs-loading">
							{#if loadingIndicator}
								{@render loadingIndicator()}
							{/if}
						</div>
					{:else if filtered.length === 0}
						<div class="cs-empty">
							{#if query.trim()}
								{#if onCreateItem}
									无匹配，可新建「{query.trim()}」
								{:else}
									无匹配项
								{/if}
							{:else}
								暂无数据
							{/if}
						</div>
					{:else}
						{#each filtered as item, i (item)}
							<button
								type="button"
								class="cs-option"
								class:cs-option--active={i === activeIdx}
								class:cs-option--selected={item === value}
								onclick={() => choose(item)}
								onmouseenter={() => activeIdx = i}
								role="option"
								aria-selected={item === value}
								title={item}
							>
								<span class="cs-option-label">{item}</span>
								{#if item === value}
									<Check size={14} class="cs-option-check" />
								{/if}
							</button>
						{/each}
					{/if}
				</div>
				<ScrollZones target={listEl} />
			</div>
			{#if onCreateItem}
				<div class="cs-footer">
					<button
						type="button"
						class="cs-create"
						onclick={handleCreate}
						disabled={!canCreate || creating}
						title={canCreate ? `新建「${query.trim()}」` : '输入新名称后可新建'}
					>
						<Plus size={14} />
						{canCreate ? `${createText}「${query.trim()}」` : createText}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.cs-wrapper { position: relative; }
	.cs-trigger {
		display: flex;
		height: var(--height-md);
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-md);
		padding: var(--padding-md);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background-color: var(--bg);
		color: var(--text);
		font-size: var(--font-md);
		cursor: pointer;
		transition: border-color 0.15s;
	}
	.cs-trigger:hover:not(:disabled) { border-color: var(--text-muted); }
	.cs-trigger:focus { border-color: var(--primary); outline: none; }
	.cs-trigger:disabled { opacity: 0.5; cursor: not-allowed; }
	.cs-trigger--open { border-color: var(--primary); }
	.cs-trigger--placeholder { color: var(--text-muted); }
	.cs-value { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
	.cs-chevron { color: var(--text-muted); flex-shrink: 0; transition: transform 0.2s; }
	.cs-chevron--open { transform: rotate(180deg); }

	.cs-dropdown {
		position: relative;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		background-color: var(--surface);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
		color: var(--text);
	}
	.cs-header {
		padding: var(--sp-lg) var(--sp-lg);
		font-size: 12px;
		font-weight: 600;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border);
		background-color: var(--surface-2);
	}
	.cs-search {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: var(--sp-lg) var(--sp-lg);
		border-bottom: 1px solid var(--border);
	}
	:global(.cs-search-icon) { color: var(--text-muted); flex-shrink: 0; }
	.cs-search-input {
		flex: 1;
		min-width: 0;
		border: none;
		background: none;
		outline: none;
		color: var(--text);
		font-size: 13px;
	}
	/* 列表区（滚动视口）：触发区的定位基准 */
	.cs-listwrap { position: relative; flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
	/* 唯一滚动体：隐藏滚动条 → 左右内边距一致；360 = 严格前 10 行 × 36px */
	.cs-list { position: relative; flex: 1 1 auto; min-height: 0; overflow-y: auto; max-height: 360px; scrollbar-width: none; -ms-overflow-style: none; }
	.cs-list::-webkit-scrollbar { display: none; }
	.cs-loading { display: flex; justify-content: center; padding: 12px 0; }
	.cs-empty { padding: var(--sp-lg) var(--sp-lg); font-size: 12px; color: var(--text-muted); }
	.cs-option {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-md);
		width: 100%;
		height: var(--height-md);
		padding: 0 var(--sp-lg);
		border: none;
		background: none;
		color: var(--text);
		font-size: 13px;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.1s;
	}
	.cs-option:hover { color: var(--text-strong); }
	.cs-option--active { color: var(--text-strong); }
	.cs-option--selected { background-color: var(--primary-soft); color: var(--text-strong); }
	.cs-option-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	:global(.cs-option-check) { color: var(--primary); flex-shrink: 0; }
	.cs-footer {
		padding: var(--sp-sm) var(--sp-lg);
		border-top: 1px solid var(--border);
		background-color: var(--surface);
	}
	.cs-create {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		height: var(--height-md);
		padding: 0 var(--sp-lg);
		border: none;
		background: none;
		color: var(--primary);
		font-size: 13px;
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: background-color 0.1s;
	}
	.cs-create:hover:not(:disabled) { background-color: var(--primary-soft); }
	.cs-create:disabled { color: var(--text-muted); cursor: not-allowed; }
</style>

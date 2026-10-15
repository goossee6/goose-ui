<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
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
	// combobox/listbox 的 ARIA 关联 id（与 Combobox 同一写法）
	const listId = `cs-${Math.random().toString(36).slice(2, 8)}`;
	let query = $state('');
	// items 只作首次数据源快照；之后 data 由 loadItems 结果与「新建」项独占维护
	let data = $state<string[]>(untrack(() => items));
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
		// 校准不能用 ddEl.scrollHeight：列表自身 min-height:0 + overflow:auto 会被面板 max-height
		// 夹扁而不溢出，面板 scrollHeight 看不穿这层收缩 → 少量结果时列表被压到小于内容高，
		// 被误判可滚、点亮下触发区遮挡项。改用实测 chrome + 列表真实内容高。
		if (ddEl) {
			const panel = ddEl;
			const q = (s: string) => (panel.querySelector(s) as HTMLElement | null)?.offsetHeight ?? 0;
			const chrome = q('.cs-header') + q('.cs-search') + q('.cs-footer');
			// listwrap 上下内边距 4×2；列表内容高按 360 上限（与 max-height 一致）
			const listH = listEl ? Math.min(listEl.scrollHeight, 360) : 0;
			const real = chrome + listH + 8 + 2; // 8 = listwrap 内边距，2 = 面板边框
			if (Math.abs(real - estimateHeight()) > 1) write(real);
		}
		searchEl?.focus();
	}

	/** 面板高度估算：chrome + 前 10 行 × 36px（无分组行）+ listwrap 内边距 + 面板边框 */
	function estimateHeight(): number {
		let chrome = 43 + 42; // .cs-header + .cs-search 恒在
		if (onCreateItem) chrome += 45; // .cs-footer（边框 1 + padding 4×2 + 按钮 36）
		const rows = filtered.length ? filtered.length * 36 : 44; // 空态文案行下限
		return chrome + Math.min(rows, 360) + 8 + 2; // 8 = .cs-listwrap 上下内边距 4×2
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
		role="combobox"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-controls={open ? listId : undefined}
		class="cs-trigger"
		class:cs-trigger--open={open}
		class:cs-trigger--placeholder={!value}
	>
		<span class="cs-value">{value || placeholder}</span>
		<svg class="cs-chevron" class:cs-chevron--open={open} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
	</button>

	{#if open && mounted}
		<!-- 面板本身不再是 listbox：它含 header/搜索框/footer，listbox 的子孙里不允许出现 input/button。
		     role=listbox 下移到真正承载选项的 .cs-list，组合框语义放在搜索框上（它才是键盘焦点所在）。
		     本 div 只是键盘代理（Esc/上下/回车），因此显式忽略「无 role 的静态元素带 keydown」。 -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="cs-dropdown" bind:this={ddEl} style={dropdownStyle} tabindex="-1" onkeydown={onDropdownKeydown}>
			<div class="cs-header">{title}</div>
			<div class="cs-search">
				<Search size={14} class="cs-search-icon" />
				<input
					bind:this={searchEl}
					bind:value={query}
					oninput={() => { activeIdx = filtered.length ? 0 : -1; }}
					placeholder="搜索或新建…"
					class="cs-search-input"
					role="combobox"
					aria-expanded={open}
					aria-controls={listId}
					aria-activedescendant={activeIdx >= 0 ? `${listId}-${activeIdx}` : undefined}
				/>
				{#if filtered.length > 0}
					<span class="cs-count">{filtered.length} 项</span>
				{/if}
			</div>
			<div class="cs-listwrap">
				<div class="cs-list" bind:this={listEl} role="listbox" id={listId}>
					<PillTrack
						container={listEl}
						activeSelector=".cs-option--active:not(.cs-option--selected)"
						background="var(--accent-sub)"
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
								id={`${listId}-${i}`}
								aria-selected={item === value}
								title={item}
							>
								<span class="cs-option-check" aria-hidden="true">
									{#if item === value}
										<Check size={14} />
									{/if}
								</span>
								<span class="cs-option-label">{item}</span>
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
	.cs-count {
		flex-shrink: 0;
		font-size: var(--font-sm);
		color: var(--text-muted);
		white-space: nowrap;
	}
	.cs-search-input {
		flex: 1;
		min-width: 0;
		border: none;
		background: none;
		outline: none;
		color: var(--text);
		font-size: 13px;
	}
	/* 列表区（滚动视口）：触发区的定位基准；四边 4px 内边距 → pill 不贴面板边框（与 Select/Combobox/MultiSelect 一致） */
	.cs-listwrap { position: relative; flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; padding: var(--sp-sm); }
	/* 唯一滚动体：隐藏滚动条 → 左右内边距一致；360 = 严格前 10 行 × 36px */
	.cs-list { position: relative; flex: 1 1 auto; min-height: 0; overflow-y: auto; max-height: 360px; scrollbar-width: none; -ms-overflow-style: none; }
	.cs-list::-webkit-scrollbar { display: none; }
	.cs-loading { display: flex; justify-content: center; padding: 12px 0; }
	.cs-empty { padding: var(--sp-lg) var(--sp-lg); font-size: 12px; color: var(--text-muted); }
	.cs-option {
		position: relative;
		display: flex;
		align-items: center;
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
		transition: color 0.1s, background-color 0.1s;
	}
	.cs-option:hover { color: var(--text-strong); }
	.cs-option--active { color: var(--text-strong); }
	.cs-option--selected { background-color: var(--primary-soft); color: var(--text-strong); font-weight: 500; }
	/* 勾槽常驻 16px：选中渲染勾，未选中留空 → 文字列恒定不跳动 */
	.cs-option-check { display: flex; align-items: center; justify-content: center; width: 16px; flex-shrink: 0; color: var(--primary); }
	.cs-option-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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

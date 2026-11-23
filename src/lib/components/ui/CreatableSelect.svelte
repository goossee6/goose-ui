<script lang="ts">
	import { tick, untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import PillTrack from './PillTrack.svelte';
	import ScrollZones from './ScrollZones.svelte';
	import Tooltip from './Tooltip.svelte';
	import DropdownPanel from './DropdownPanel.svelte';
	import DropdownOption from './DropdownOption.svelte';
	import { createDropdownPanel, createEllipsisTip, revealOption, OPTION_SEL } from './dropdown.svelte';
	import { MAX_ROWS, ROW_H, rowsHeight } from './rowHeight';
	import Search from '@lucide/svelte/icons/search';
	import Plus from '@lucide/svelte/icons/plus';

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

	// combobox/listbox 的 ARIA 关联 id（与 Combobox 同一写法）
	const listId = `cs-${Math.random().toString(36).slice(2, 8)}`;
	const optionId = (i: number) => `${listId}-${i}`;

	let query = $state('');
	// items 只作首次数据源快照；之后 data 由 loadItems 结果与「新建」项独占维护
	let data = $state<string[]>(untrack(() => items));
	let loading = $state(false);
	let loaded = $state(false);
	let creating = $state(false);
	let activeIdx = $state(-1);

	let wrapperEl: HTMLElement | undefined = $state();
	let listEl = $state<HTMLElement | null>(null);
	let searchEl = $state<HTMLInputElement | undefined>();
	// 三块「面板装饰」的高度要参与面板定高，绑住它们比 querySelector 省一层查找
	let headerEl = $state<HTMLElement | undefined>();
	let searchBoxEl = $state<HTMLElement | undefined>();
	let footerEl = $state<HTMLElement | undefined>();

	const filtered = $derived(
		query.trim() === ''
			? data
			: data.filter((t) => t.toLowerCase().includes(query.trim().toLowerCase()))
	);

	const canCreate = $derived(query.trim() !== '' && !data.some((t) => t === query.trim()));

	/** 标题栏 + 搜索栏 + 页脚。首帧面板还没挂载，只能估算；挂载后一律用实测值。 */
	function chromeHeight(): number {
		if (headerEl && searchBoxEl) {
			return headerEl.offsetHeight + searchBoxEl.offsetHeight + (footerEl?.offsetHeight ?? 0);
		}
		return 43 + 42 + (onCreateItem ? 45 : 0);
	}

	/**
	 * 面板高度 = 装饰块 + 列表内容高 + listwrap 内边距 + 面板边框。
	 *
	 * 列表高不量 `panel.scrollHeight`：列表自身 `min-height: 0` + `overflow: auto`
	 * 会被面板 max-height 夹扁而不溢出，看不穿这层收缩 → 少量结果时被误判可滚、
	 * 点亮下触发区遮住最后一项。挂载后量列表自己的 `scrollHeight` 才是真内容高。
	 */
	function panelHeight(): number {
		const rows = listEl ? Math.min(listEl.scrollHeight, ROW_H * MAX_ROWS) : rowsHeight(filtered).height;
		return chromeHeight() + rows + 8 + 2; // 8 = .cs-listwrap 上下内边距，2 = 面板边框
	}

	const panel = createDropdownPanel({
		anchor: () => wrapperEl ?? null,
		size: (rect) => ({ w: Math.max(240, rect.width), h: panelHeight() }),
		scroller: () => listEl,
		onOpen: () => {
			query = '';
			activeIdx = -1;
			if (!loaded) loadData();
		},
		onClose: () => {
			query = '';
		},
	});

	// 首帧用的是估算高度，面板挂载后按实测重排一次；顺便把焦点放进搜索框
	let calibrated = false;
	$effect(() => {
		if (!panel.open) {
			calibrated = false;
			return;
		}
		if (!panel.mounted || calibrated) return;
		calibrated = true;
		panel.place();
		searchEl?.focus();
	});

	async function loadData() {
		loading = true;
		try {
			data = loadItems ? await loadItems() : items;
			loaded = true;
		} catch {
			data = [];
		} finally {
			loading = false;
		}
	}

	function choose(name: string) {
		value = name;
		panel.hide();
	}

	async function handleCreate() {
		const name = query.trim();
		if (!name || creating || !onCreateItem) return;
		creating = true;
		try {
			await onCreateItem(name);
			data = [name, ...data];
			value = name;
			panel.hide();
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
			panel.hide();
		}
	}

	function onTriggerKeydown(e: KeyboardEvent) {
		if (disabled) return;
		if (!panel.open && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
			e.preventDefault();
			panel.toggle();
		}
	}

	// 键盘导航须把活动项滚进可视区（原先缺这一步，方向键移出列表就看不见落点）
	$effect(() => {
		if (panel.open) revealOption(listEl, activeIdx);
	});

	// 选项文字会按列宽省略，完整值走一个共享气泡
	const tip = createEllipsisTip({
		isOpen: () => panel.open,
		container: () => listEl,
		index: () => activeIdx,
		deps: () => filtered,
	});
</script>

<div bind:this={wrapperEl} class="cs-wrapper {cls}" style={style}>
	<button
		type="button"
		{disabled}
		onclick={() => panel.toggle()}
		onkeydown={onTriggerKeydown}
		role="combobox"
		aria-haspopup="listbox"
		aria-expanded={panel.open}
		aria-controls={panel.open ? listId : undefined}
		class="cs-trigger"
		class:cs-trigger--open={panel.open}
		class:cs-trigger--placeholder={!value}
	>
		<span class="cs-value">{value || placeholder}</span>
		<svg class="cs-chevron" class:cs-chevron--open={panel.open} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
	</button>

	{#if panel.open && panel.mounted}
		<!-- 面板本身不是 listbox：它含 header / 搜索框 / footer，listbox 的子孙里
		     不允许出现 input / button。role=listbox 在 .cs-list 上，组合框语义放在
		     搜索框上（它才是键盘焦点所在）；面板只当键盘代理（Esc / 上下 / 回车）。 -->
		<DropdownPanel style={panel.panelStyle} flipUp={panel.flipUp} tabindex={-1} onkeydown={onDropdownKeydown}>
			<div class="cs-header" bind:this={headerEl}>{title}</div>
			<div class="cs-search" bind:this={searchBoxEl}>
				<Search size={14} class="cs-search-icon" />
				<input
					bind:this={searchEl}
					bind:value={query}
					oninput={() => {
						activeIdx = filtered.length ? 0 : -1;
					}}
					placeholder="搜索或新建…"
					class="cs-search-input"
					role="combobox"
					aria-expanded={panel.open}
					aria-controls={listId}
					aria-activedescendant={activeIdx >= 0 ? optionId(activeIdx) : undefined}
				/>
				{#if filtered.length > 0}
					<span class="cs-count">{filtered.length} 项</span>
				{/if}
			</div>
			<div class="cs-listwrap">
				<div class="cs-list" bind:this={listEl} role="listbox" id={listId}>
					<!-- 选中 = 常驻主题色，指针落点 = 中性灰（见 DropdownOption 里的说明） -->
					<PillTrack
						container={listEl}
						itemSelector={OPTION_SEL}
						activeSelector=".dd-option--selected"
						background="var(--primary)"
						hoverBackground="var(--hover)"
						activeHoverBackground="var(--primary-hover)"
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
							<DropdownOption
								label={item}
								id={optionId(i)}
								selected={item === value}
								active={i === activeIdx}
								onpick={() => choose(item)}
								onhover={() => (activeIdx = i)}
							/>
						{/each}
					{/if}
				</div>
				<ScrollZones target={listEl} />
			</div>
			{#if onCreateItem}
				<div class="cs-footer" bind:this={footerEl}>
					<Tooltip title={canCreate ? `新建「${query.trim()}」` : '输入新名称后可新建'} class="cs-create-tip" maxWidth={320}>
						<button
							type="button"
							class="cs-create"
							onclick={handleCreate}
							disabled={!canCreate || creating}
						>
							<Plus size={14} />
							{canCreate ? `${createText}「${query.trim()}」` : createText}
						</button>
					</Tooltip>
				</div>
			{/if}
		</DropdownPanel>
	{/if}

	<!-- 长选项的完整值：一个实例，锚点由 activeIndex 驱动（见 createEllipsisTip） -->
	<Tooltip anchor={tip.anchor} open={tip.visible} title={tip.text} placement="right" maxWidth={420} delay={0} />
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

	.cs-header {
		padding: var(--sp-lg);
		font-size: var(--fs-12);
		font-weight: 600;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border);
		background-color: var(--surface-2);
	}
	.cs-search {
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
		padding: var(--sp-lg);
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
		font-size: var(--fs-13);
	}
	/* 列表区（滚动视口）：触发区的定位基准；四边 4px 内边距 → pill 不贴面板边框 */
	.cs-listwrap { position: relative; flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; padding: var(--sp-sm); }
	/* 唯一滚动体：隐藏滚动条 → 左右内边距一致。
	   上限 = 行高 × 最多行数，两个数都由 DropdownPanel 按 rowHeight.ts 写进 CSS 变量，
	   面板高度估算读的是同一组常量 —— 写死 360 时只要行高改一档就会对不上。 */
	.cs-list { position: relative; flex: 1 1 auto; min-height: 0; overflow-y: auto; max-height: calc(var(--dd-row-h) * var(--dd-max-rows)); scrollbar-width: none; -ms-overflow-style: none; }
	.cs-list::-webkit-scrollbar { display: none; }
	.cs-loading { display: flex; justify-content: center; padding: var(--space-3) 0; }
	.cs-empty { padding: var(--sp-lg); font-size: var(--fs-12); color: var(--text-muted); }
	.cs-footer {
		padding: var(--sp-sm) var(--sp-lg);
		border-top: 1px solid var(--border);
		background-color: var(--popup-surface);
	}
	/* 新建按钮外面套了 Tooltip 触发器：用 flex 撑满，别让它多出一层行盒行高
	   （.cs-footer 的高度会参与面板高度估算，多几像素就会抖一下）。 */
	.cs-footer :global(.cs-create-tip) {
		display: flex;
		width: 100%;
	}
	.cs-create {
		display: flex;
		align-items: center;
		gap: var(--space-1-5);
		width: 100%;
		height: var(--height-md);
		padding: 0 var(--sp-lg);
		border: none;
		background: none;
		color: var(--primary);
		font-size: var(--fs-13);
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: background-color 0.1s;
	}
	.cs-create:hover:not(:disabled) { background-color: var(--hover); }
	.cs-create:disabled { color: var(--text-muted); cursor: not-allowed; }
</style>

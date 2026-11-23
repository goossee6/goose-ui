<script lang="ts" module>
	export interface ComboboxOption {
		value: string;
		label: string;
		disabled?: boolean;
		/** 分组名：连续同名的选项归入同组，组头吸顶 */
		group?: string;
	}
</script>

<script lang="ts">
	import PillTrack from './PillTrack.svelte';
	import ScrollZones from './ScrollZones.svelte';
	import Tooltip from './Tooltip.svelte';
	import DropdownPanel from './DropdownPanel.svelte';
	import DropdownGroup from './DropdownGroup.svelte';
	import DropdownOption from './DropdownOption.svelte';
	import { createDropdownPanel, createEllipsisTip, revealOption, OPTION_SEL } from './dropdown.svelte';
	import { rowsHeight } from './rowHeight';

	let {
		options = [],
		value = $bindable(''),
		placeholder = '请选择…',
		disabled = false,
		clearable = true,
		filter = true,
		onchange,
		class: cls = '',
		style = '',
	}: {
		options?: ComboboxOption[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		clearable?: boolean;
		filter?: boolean;
		onchange?: (value: string) => void;
		class?: string;
		style?: string;
	} = $props();

	let rootEl = $state<HTMLElement | null>(null);
	let controlEl = $state<HTMLElement | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);
	let listEl = $state<HTMLElement | null>(null);
	let query = $state('');
	let activeIndex = $state(0);

	const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? '');

	const filtered = $derived.by(() => {
		if (!filter || !query.trim()) return options;
		const q = query.trim().toLowerCase();
		return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
	});

	const isGroupHead = (i: number) => {
		const g = filtered[i]?.group;
		return !!g && (i === 0 || filtered[i - 1].group !== g);
	};

	const listId = `combobox-${Math.random().toString(36).slice(2, 8)}`;
	const optionId = (i: number) => `${listId}-${i}`;

	const panel = createDropdownPanel({
		// 量控件而非 root：面板挂载初期若还在文档流里会把 root 撑高 → 首次打开误判空间不足翻到上方
		anchor: () => controlEl,
		// 但「内部」要算上整个 .combobox —— 面板是它的兄弟节点，不在 controlEl 子树里
		root: () => rootEl,
		// 面板高度 = 前 10 行（组头算一行）的实际高度，不足则自适应；8 为列表内边距，2 为边框
		size: (rect) => ({ w: Math.max(120, rect.width), h: rowsHeight(filtered, 8).height + 2 }),
		scroller: () => listEl,
		onOpen: () => {
			query = '';
			activeIndex = Math.max(0, filtered.findIndex((o) => o.value === value));
		},
		onClose: () => {
			query = '';
		},
		// 气泡是 fixed 定位、不会跟着面板走，页面一动就得收掉
		onFollow: () => tip.close(),
	});

	function openMenu() {
		if (disabled) return;
		panel.show();
	}

	function select(opt: ComboboxOption) {
		if (opt.disabled) return;
		value = opt.value;
		onchange?.(opt.value);
		panel.hide();
		inputEl?.focus();
	}

	function clear() {
		if (disabled) return;
		value = '';
		onchange?.('');
		query = '';
		inputEl?.focus();
	}

	function step(dir: 1 | -1) {
		if (!filtered.length) return;
		let i = Math.max(0, Math.min(activeIndex, filtered.length - 1));
		for (let n = 0; n < filtered.length; n++) {
			i = (i + dir + filtered.length) % filtered.length;
			if (!filtered[i].disabled) break;
		}
		activeIndex = i;
	}

	function onInputKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			panel.open ? step(1) : openMenu();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (panel.open) step(-1);
		} else if (e.key === 'Enter') {
			if (panel.open && filtered[activeIndex]) {
				e.preventDefault();
				select(filtered[activeIndex]);
			}
		} else if (e.key === 'Escape') {
			if (panel.open) {
				e.stopPropagation();
				panel.hide();
			}
		} else if (e.key === 'Tab') {
			panel.hide();
		}
	}

	// 隐藏滚动条后键盘导航须把活动项滚进可视区
	$effect(() => {
		if (panel.open) revealOption(listEl, activeIndex);
	});

	// ── 长选项的完整值 ────────────────────────────────────────────────────
	//
	// 面板宽度只跟触发器（`min(视口 - 16, max(120, 控件宽))`），不按内容加宽，
	// 所以长 label 必然被省略号截掉、而且没有任何补救。这里补一个气泡 ——
	// 「一个气泡 + 一个锚点」而不是每项包一层 Tooltip，理由见 dropdown.svelte.ts。
	const tip = createEllipsisTip({
		isOpen: () => panel.open,
		container: () => listEl,
		index: () => activeIndex,
		// 过滤后列表重建，索引要重新取
		deps: () => filtered,
	});
</script>

<div class="combobox {cls}" bind:this={rootEl} style={style}>
	<div class="combobox-control" bind:this={controlEl} class:open={panel.open} class:disabled>
		<input
			bind:this={inputEl}
			class="combobox-input"
			type="text"
			role="combobox"
			{placeholder}
			{disabled}
			readonly={!filter}
			value={panel.open && filter ? query : selectedLabel}
			aria-expanded={panel.open}
			aria-controls={listId}
			aria-autocomplete={filter ? 'list' : 'none'}
			aria-activedescendant={panel.open ? optionId(activeIndex) : undefined}
			onfocus={openMenu}
			onclick={() => {
				if (!panel.open) openMenu();
			}}
			oninput={(e) => (query = e.currentTarget.value)}
			onkeydown={onInputKeydown}
		/>
		{#if clearable && value && !disabled}
			<button type="button" class="combobox-clear" aria-label="清除" onclick={clear}>
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
			</button>
		{/if}
		<svg class="combobox-arrow" class:open={panel.open} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
	</div>

	{#if panel.open && panel.mounted}
		<DropdownPanel style={panel.panelStyle} flipUp={panel.flipUp}>
			{#if filtered.length > 0}
				<span class="combobox-count">{filtered.length} 项</span>
			{/if}
			<!-- 列表滚动用 hideTip 而不是 closeTip：键盘上下键会先把活动项滚进视区，
			     那次滚动若连排队中的 timer 一起清掉，长选项的气泡就永远弹不出来。
			     只收起、不清 timer，滚完按 anchor 的新位置再弹。 -->
			<div class="combobox-list" role="listbox" id={listId} bind:this={listEl} onscroll={tip.hide}>
				<!-- 选中 = 常驻主题色，指针落点 = 中性灰（见 DropdownOption 里的说明） -->
				<PillTrack
					container={listEl}
					itemSelector={OPTION_SEL}
					activeSelector=".dd-option--selected"
					disabledMatch=".dd-option--disabled"
					background="var(--primary)"
					hoverBackground="var(--hover)"
					activeHoverBackground="var(--primary-hover)"
				/>
				{#if !filtered.length}
					<div class="combobox-empty" role="presentation">无匹配项</div>
				{/if}
				{#each filtered as opt, i (opt.value)}
					{#if isGroupHead(i)}
						<DropdownGroup label={opt.group} />
					{/if}
					<DropdownOption
						label={opt.label}
						id={optionId(i)}
						selected={opt.value === value}
						active={i === activeIndex}
						disabled={opt.disabled}
						onpick={() => select(opt)}
						onhover={() => (activeIndex = i)}
					/>
				{/each}
			</div>
			<ScrollZones target={listEl} bg="var(--popup-surface)" />
		</DropdownPanel>
	{/if}

	<!-- 长选项的完整值：全表一个实例，锚点由 activeIndex 驱动（见 createEllipsisTip）。
	     delay={0}：停顿判断已经在宿主里做了（240ms），这里再叠一层就成了双重延迟。 -->
	<Tooltip anchor={tip.anchor} open={tip.visible} title={tip.text} placement="right" maxWidth={420} delay={0} />
</div>

<style>
	.combobox {
		position: relative;
		display: inline-block;
		min-width: 180px;
	}
	.combobox-control {
		display: flex;
		align-items: center;
		gap: var(--sp-sm);
		height: var(--height-md);
		padding: 0 var(--sp-md);
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.combobox-control.open {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px var(--accent-ring);
	}
	.combobox-control.disabled {
		opacity: 0.5;
		background: var(--surface-2);
	}
	.combobox-input {
		flex: 1;
		min-width: 0;
		padding: var(--sp-md) 0;
		border: none;
		background: none;
		outline: none;
		font-size: var(--fs-13);
		color: var(--text-strong);
		font-family: inherit;
	}
	.combobox-input::placeholder {
		color: var(--text-muted);
	}
	.combobox-clear {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: none;
		border-radius: 50%;
		background: var(--surface-2);
		color: var(--text-muted);
		cursor: pointer;
		flex-shrink: 0;
	}
	.combobox-clear:hover {
		background: var(--hover);
		color: var(--text-strong);
	}
	.combobox-arrow {
		color: var(--text-muted);
		flex-shrink: 0;
		transition: transform 0.2s;
	}
	.combobox-arrow.open {
		transform: rotate(180deg);
	}
	/* 结果计数：absolute 不进 rowsHeight 高度模型；pointer-events:none 不拦顶部滚动触发区 */
	.combobox-count {
		position: absolute;
		top: var(--space-1);
		right: var(--space-2);
		z-index: 4;
		font-size: var(--font-sm);
		color: var(--text-muted);
		white-space: nowrap;
		pointer-events: none;
	}
	/* 唯一滚动体：隐藏滚动条 → 左右内边距一致；高度由面板 max-height（前 10 行）控制 */
	.combobox-list {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		scrollbar-gutter: stable;
		margin: 0;
		list-style: none;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	.combobox-list::-webkit-scrollbar {
		display: none;
	}
	.combobox-empty {
		padding: var(--sp-lg);
		font-size: var(--fs-13);
		color: var(--text-muted);
		text-align: center;
		position: relative;
		z-index: 1;
	}
</style>

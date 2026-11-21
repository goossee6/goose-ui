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
	import Check from '@lucide/svelte/icons/check';
	import { floatingPosition } from './floatingPosition';
	import { menuIn, menuOut } from './menuTransition';
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
	let open = $state(false);
	let query = $state('');
	let activeIndex = $state(0);
	let dropdownStyle = $state('');
	let flipUp = $state(false);

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

	function position() {
		// 量控件而非 root：面板挂载初期 dropdownStyle 尚未写入（position: relative 内联流），
		// 会把 root 撑高 → 首次打开误判空间不足翻转到上方
		if (!controlEl) return;
		const rect = controlEl.getBoundingClientRect();
		// 面板高度 = 前 10 行（组头算一行）的实际高度，不足则自适应；8 为列表内边距，2 为边框
		const panelH = rowsHeight(filtered, 8).height + 2;
		const r = floatingPosition(rect, { panelW: Math.max(120, rect.width), panelH, gap: 4 });
		dropdownStyle = `position: fixed; z-index: var(--z-max); ${r.style}`;
		flipUp = r.flipUp;
	}

	function openMenu() {
		if (disabled) return;
		open = true;
		query = '';
		activeIndex = Math.max(0, filtered.findIndex((o) => o.value === value));
	}

	function closeMenu() {
		open = false;
		query = '';
	}

	function select(opt: ComboboxOption) {
		if (opt.disabled) return;
		value = opt.value;
		onchange?.(opt.value);
		closeMenu();
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
			open ? step(1) : openMenu();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (open) step(-1);
		} else if (e.key === 'Enter') {
			if (open && filtered[activeIndex]) {
				e.preventDefault();
				select(filtered[activeIndex]);
			}
		} else if (e.key === 'Escape') {
			if (open) {
				e.stopPropagation();
				closeMenu();
			}
		} else if (e.key === 'Tab') {
			closeMenu();
		}
	}

	$effect(() => {
		if (!open) return;
		const onDocDown = (e: MouseEvent) => {
			if (rootEl && !rootEl.contains(e.target as Node)) closeMenu();
		};
		document.addEventListener('mousedown', onDocDown);
		// 面板为 fixed：跟随页面滚动/缩放；过滤结果变化时翻转/高度也需重算
		void query;
		position();
		const onWin = (e: Event) => {
			if (listEl && e.target === listEl) return;
			position();
			// 气泡是 fixed 定位、不会跟着面板走，页面一动就得收掉
			closeTip();
		};
		window.addEventListener('scroll', onWin, true);
		window.addEventListener('resize', onWin);
		return () => {
			document.removeEventListener('mousedown', onDocDown);
			window.removeEventListener('scroll', onWin, true);
			window.removeEventListener('resize', onWin);
		};
	});

	// 隐藏滚动条后键盘导航须把活动项滚进可视区（手写边界，避免 fixed 面板连带滚页面）
	$effect(() => {
		const idx = activeIndex;
		const el = listEl;
		if (!open || !el) return;
		const item = el.querySelectorAll<HTMLElement>('.combobox-option')[idx];
		if (!item) return;
		const top = item.offsetTop;
		const bottom = top + item.offsetHeight;
		if (top < el.scrollTop) el.scrollTop = top;
		else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight;
	});

	// ── 长选项的完整值 ────────────────────────────────────────────────────
	//
	// 面板宽度只跟触发器（`min(视口 - 16, max(120, 控件宽))`），不按内容加宽，
	// 所以长 label 必然被省略号截掉、而且没有任何补救。这里补一个气泡。
	//
	// 用「一个气泡 + 一个锚点」而不是每项包一层 Tooltip：选项是数据驱动的，
	// 过滤后可能有上百项，每项一个组件实例就是上百个响应式节点 + 监听器
	// （与 DataTable 单元格同一套办法）。
	let tipAnchor = $state<HTMLElement | null>(null);
	let tipText = $state('');
	let tipOpen = $state(false);
	/** 延迟计时器。必须能被 closeTip 清掉 —— 否则滚动/关闭面板后，
	 *  一个已经排上队的 timer 还会把气泡重新弹出来。 */
	let tipTimer: ReturnType<typeof setTimeout> | null = null;

	/** 只收起当前气泡，不打断排队中的显示任务 */
	function hideTip() {
		tipOpen = false;
		tipAnchor = null;
	}

	function closeTip() {
		if (tipTimer) {
			clearTimeout(tipTimer);
			tipTimer = null;
		}
		hideTip();
	}

	/**
	 * 气泡跟随「活动项」，而不是另挂一套 pointerover 委托。
	 *
	 * 选项上本来就有 `onmouseenter → activeIndex`，键盘上下键改的也是它，
	 * 所以 activeIndex 已经是「当前项」的唯一来源，再监听一次指针只会多一条
	 * 可能与它对不上的路径。
	 *
	 * 延迟 240ms（贴近 Tooltip 默认的 200ms）：指针纵向扫过整列时每项都立刻
	 * 弹一下，比原生 title 还吵；停住才弹。
	 */
	$effect(() => {
		if (!open) {
			closeTip();
			return;
		}
		const i = activeIndex;
		void filtered; // 过滤后列表重建，索引要重新取
		// 换项先收掉上一个（同时清掉它排队中的 timer），等停住再弹新的一
		closeTip();
		tipTimer = setTimeout(() => {
			tipTimer = null;
			const el = listEl?.querySelectorAll<HTMLElement>('.combobox-option')[i];
			if (!el) return;
			const label = el.querySelector<HTMLElement>('.combobox-option-label');
			// 完整可见就不提示：把看到的字再念一遍没有意义
			if (!label || label.scrollWidth <= label.clientWidth + 1) return;
			tipText = label.textContent ?? '';
			tipAnchor = el;
			tipOpen = true;
		}, 240);
		return closeTip;
	});
</script>

<div class="combobox {cls}" bind:this={rootEl} style={style}>
	<div class="combobox-control" bind:this={controlEl} class:open class:disabled>
		<input
			bind:this={inputEl}
			class="combobox-input"
			type="text"
			role="combobox"
			{placeholder}
			{disabled}
			readonly={!filter}
			value={open && filter ? query : selectedLabel}
			aria-expanded={open}
			aria-controls={listId}
			aria-autocomplete={filter ? 'list' : 'none'}
			aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
			onfocus={openMenu}
			onclick={() => { if (!open) openMenu(); }}
			oninput={(e) => (query = e.currentTarget.value)}
			onkeydown={onInputKeydown}
		/>
		{#if clearable && value && !disabled}
			<button type="button" class="combobox-clear" aria-label="清除" onclick={clear}>
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
			</button>
		{/if}
		<svg class="combobox-arrow" class:open width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
	</div>

	{#if open}
		<div class="combobox-panel" style={dropdownStyle} in:menuIn={{ up: flipUp }} out:menuOut={{ up: flipUp }}>
			{#if filtered.length > 0}
				<span class="combobox-count">{filtered.length} 项</span>
			{/if}
			<!-- 列表滚动用 hideTip 而不是 closeTip：键盘上下键会先把活动项滚进视区，
			     那次滚动若连排队中的 timer 一起清掉，长选项的气泡就永远弹不出来。
			     只收起、不清 timer，滚完按 anchor 的新位置再弹。 -->
			<div class="combobox-list" role="listbox" id={listId} bind:this={listEl} onscroll={hideTip}>
				<!-- 选中 = 常驻主题色，指针落点 = 中性灰（见 Select 里的说明） -->
				<PillTrack
					container={listEl}
					itemSelector=".combobox-option"
					activeSelector=".combobox-option.selected"
					disabledMatch=".disabled"
					background="var(--primary)"
					hoverBackground="var(--hover)"
					activeHoverBackground="var(--primary-hover)"
					radius="var(--radius-md)"
				/>
				{#if !filtered.length}
					<div class="combobox-empty" role="presentation">无匹配项</div>
				{/if}
				{#each filtered as opt, i (opt.value)}
					{#if isGroupHead(i)}
						<div class="combobox-group" role="presentation">{opt.group}</div>
					{/if}
					<div
						class="combobox-option"
						class:active={i === activeIndex}
						class:selected={opt.value === value}
						class:disabled={opt.disabled}
						id={`${listId}-${i}`}
						role="option"
						tabindex="-1"
						aria-selected={opt.value === value}
						aria-disabled={opt.disabled || undefined}
						onmousedown={(e) => {
							e.preventDefault();
							select(opt);
						}}
						onmouseenter={() => (activeIndex = i)}
					>
						<span class="combobox-option-check" aria-hidden="true">
							{#if opt.value === value}
								<Check size={14} />
							{/if}
						</span>
						<span class="combobox-option-label">{opt.label}</span>
					</div>
				{/each}
			</div>
			<ScrollZones target={listEl} bg="var(--popup-surface)" />
		</div>
	{/if}

	<!-- 长选项的完整值：全表一个实例，锚点由 activeIndex 驱动（见上方 effect）。
	     delay={0}：停顿判断已经在宿主里做了（240ms），这里再叠一层就成了双重延迟。 -->
	<Tooltip anchor={tipAnchor} open={tipOpen} title={tipText} placement="right" maxWidth={420} delay={0} />
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
	.combobox-panel {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		/* fixed 而不是等内联 style 写进来再 fixed：面板挂载的第一帧 dropdownStyle
		   还是空串，若那时它是 in-flow 的，超长选项会把 .combobox（inline-block）
		   一起撑宽，紧接着 position() 量 controlEl 就量到被撑宽的宽度，
		   于是面板宽度被自己的内容反向决定、长选项永远不截断。
		   这里先 fixed 掉，面板从一开始就脱离文档流，量到的永远是控件自己的宽度。 */
		position: fixed;
		/* 面板层内边距（原在列表上）：pill 不贴边、sticky 组头上方无内容透出 */
		padding: var(--sp-sm);
		/* 与 Select / MultiSelect 同一个弹出层底色，不用 --surface-2（那层灰是页面内嵌区块的底） */
		background-color: var(--popup-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
		color: var(--text);
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
	.combobox-group {
		position: sticky;
		top: 0;
		z-index: 2;
		display: flex;
		align-items: center;
		height: 24px;
		/* 与选项文字列对齐：选项 padding-left 16 + 勾槽 16 + gap 8 = 40 */
		padding: 0 var(--space-10);
		font-size: var(--fs-12);
		font-weight: 600;
		color: color-mix(in srgb, var(--text-muted) 70%, transparent);
		/* 吸顶时轻微磨砂：半透明底 + 弱模糊，滚动经过的选项在组头下若隐若现 */
		background-color: color-mix(in srgb, var(--popup-surface) 80%, transparent);
		backdrop-filter: blur(12px);
	}
	.combobox-option {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: var(--sp-md);
		height: var(--height-md);
		padding: 0 var(--sp-lg);
		border-radius: var(--radius-md);
		font-size: var(--fs-13);
		color: var(--text);
		cursor: pointer;
		transition: color 0.1s, background-color 0.1s;
	}
	/* 落点行 pill 是实心主题色 → 文字转白（--accent-text）；选中行不在此列 */
	.combobox-option:hover:not(.selected) { color: var(--text-strong); }
	/* 方向键落点：中性灰兜底。:not(:hover) 避免鼠标划过时先亮一层 CSS 底、pill 再滑到 */
	.combobox-option.active:not(.selected):not(:hover) {
		background-color: var(--hover);
		color: var(--text-strong);
	}
	.combobox-option.selected {
		color: var(--accent-text);
		font-weight: 500;
	}
	/* 勾槽常驻 16px：选中渲染勾，未选中留空 → 文字列恒定不跳动 */
	.combobox-option-check { display: flex; align-items: center; justify-content: center; width: 16px; flex-shrink: 0; color: var(--primary); }
	.combobox-option.selected .combobox-option-check { color: inherit; }
	.combobox-option-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.combobox-option.disabled {
		opacity: 0.45;
		cursor: not-allowed;
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

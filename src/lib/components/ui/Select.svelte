<script lang="ts" generics="T extends string | number">
	import { createDropdownPanel, revealOption, OPTION_SEL } from './dropdown.svelte';
	import { rowsHeight } from './rowHeight';
	import { createLayerId } from './overlayLayer';
	import PillTrack from './PillTrack.svelte';
	import ScrollZones from './ScrollZones.svelte';
	import DropdownPanel from './DropdownPanel.svelte';
	import DropdownGroup from './DropdownGroup.svelte';
	import DropdownOption from './DropdownOption.svelte';

	interface Option {
		value: string | number;
		label: string;
		meta?: string;
		metaClass?: 'good' | 'medium' | 'bad' | 'default';
		/** 分组名：连续同名的选项归入同组，组头吸顶 */
		group?: string;
	}

	let {
		value = $bindable<T>(),
		onchange,
		options = [],
		placeholder = '请选择',
		class: cls = '',
		style = '',
		ariaLabel = '',
		id = '',
		disabled = false,
		width = '100%',
		placement = 'bottom',
	}: {
		value?: T;
		onchange?: (v: T) => void;
		options?: Option[];
		placeholder?: string;
		class?: string;
		style?: string;
		ariaLabel?: string;
		id?: string;
		disabled?: boolean;
		width?: string;
		placement?: 'top' | 'bottom' | 'left' | 'right';
	} = $props();

	// 本层浮层 id：下拉面板上挂 data-overlay-layer。放在 Popover / Drawer 里时，
	// 父层靠它认出「这点的是我弹出的子面板」，不会一碰就关（见 overlayLayer.ts）
	const layerId = createLayerId('select');

	let wrapperEl: HTMLElement | undefined = $state();
	let scrollEl = $state<HTMLElement | null>(null);
	let activeIdx = $state(-1);

	// combobox/listbox 的 ARIA 关联 id（每个实例唯一，供 aria-controls / aria-activedescendant 使用）
	const listId = `select-${Math.random().toString(36).slice(2, 8)}`;
	const optionId = (i: number) => `${listId}-${i}`;

	const selected = $derived(options.find((o) => o.value === value));
	const isGroupHead = (i: number) => {
		const g = options[i]?.group;
		return !!g && (i === 0 || options[i - 1].group !== g);
	};

	let measureCtx: CanvasRenderingContext2D | null = null;

	/**
	 * 选项行的内容宽度（最宽一行：勾选列 + 间距 + 标签/meta 文本）。
	 *
	 * 用 canvas measureText 离屏测量，不用等 DOM 渲染——面板宽度在
	 * 定位时就要确定，而那时选项还没挂载。字体族继承触发器，
	 * 字号取 .dd-option 固定的 13px（meta 12px）。
	 */
	function optionContentWidth(): number {
		if (options.length === 0) return 0;
		measureCtx ??= document.createElement('canvas').getContext('2d');
		if (!measureCtx) return 0;
		const family = wrapperEl ? getComputedStyle(wrapperEl).fontFamily : 'sans-serif';
		measureCtx.font = `13px ${family}`;
		let w = 0;
		for (const opt of options) {
			let row = measureCtx.measureText(opt.label).width;
			if (opt.meta) {
				// meta 前有 8px 间距，自身左右 padding 6+6
				measureCtx.font = `12px ${family}`;
				row += 8 + measureCtx.measureText(opt.meta).width + 12;
				measureCtx.font = `13px ${family}`;
			}
			w = Math.max(w, row);
		}
		// 勾选列 16px + 列间距 8px + 选项行左右内边距 32px
		return w + 56;
	}

	const panel = createDropdownPanel({
		anchor: () => wrapperEl ?? null,
		size: (rect) => ({
			// 默认跟触发器，但不窄于选项内容的自然宽度——窄触发器配长选项文本时
			// 不截断（.dd-label 是 nowrap + ellipsis，宽度不够就会出省略号）。
			// canvas 测量与实际排版有几像素级出入，留 8px 安全余量；
			// 再压一个视口上限兜底超长选项。
			w: Math.min(window.innerWidth - 16, Math.max(120, rect.width, optionContentWidth() + 18)),
			// 面板高度 = 前 10 行（组头算一行）的实际高度，不足则自适应；8 为面板内边距，2 为边框
			h: rowsHeight(options, 8).height + 2,
		}),
		prefer: () => (placement === 'top' ? 'top' : 'bottom'),
		side: () => (placement === 'left' || placement === 'right' ? placement : undefined),
		scroller: () => scrollEl,
		layerId,
		onOpen: () => {
			activeIdx = options.findIndex((o) => o.value === value);
		},
	});

	function toggle() {
		if (disabled) return;
		panel.toggle();
	}

	function choose(opt: Option) {
		value = opt.value as T;
		onchange?.(opt.value as T);
		panel.hide();
	}

	function onKeydown(e: KeyboardEvent) {
		if (disabled) return;
		if (!panel.open) {
			if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
				e.preventDefault();
				panel.show();
			}
			return;
		}
		if (e.key === 'Escape') {
			e.stopPropagation();
			panel.hide();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (options.length) activeIdx = activeIdx < 0 ? 0 : (activeIdx + 1) % options.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (options.length) activeIdx = activeIdx < 0 ? options.length - 1 : (activeIdx - 1 + options.length) % options.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (activeIdx >= 0 && options[activeIdx]) choose(options[activeIdx]);
		}
	}

	// 隐藏滚动条后键盘导航须把活动项滚进可视区
	$effect(() => {
		if (panel.open) revealOption(scrollEl, activeIdx);
	});
</script>

<div bind:this={wrapperEl} class="select-wrapper {cls}" style="{width !== '100%' ? `width: ${width};` : ''}{style ? ` ${style}` : ''}">
	<button
		type="button"
		{disabled}
		{id}
		aria-label={ariaLabel || undefined}
		onclick={toggle}
		onkeydown={onKeydown}
		role="combobox"
		aria-haspopup="listbox"
		aria-expanded={panel.open}
		aria-controls={panel.open ? listId : undefined}
		aria-activedescendant={panel.open && activeIdx >= 0 ? optionId(activeIdx) : undefined}
		class="select-trigger"
		class:select-trigger--open={panel.open}
		class:select-trigger--placeholder={!selected}
	>
		<span class="select-value">{selected?.label ?? placeholder}</span>
		<svg class="select-chevron" class:select-chevron--open={panel.open} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
	</button>

	{#if panel.open && panel.mounted}
		<DropdownPanel style={panel.panelStyle} flipUp={panel.flipUp} {layerId}>
			<div class="select-scroll" bind:this={scrollEl} role="listbox" id={listId}>
				<!-- 两个 pill 分工：选中 = 主题色常驻，指针落点 = 中性灰（见 DropdownOption 里的说明） -->
				<PillTrack
					container={scrollEl}
					itemSelector={OPTION_SEL}
					activeSelector=".dd-option--selected"
					background="var(--primary)"
					hoverBackground="var(--hover)"
					activeHoverBackground="var(--primary-hover)"
				/>
				{#if options.length === 0}
					<div class="select-empty">暂无选项</div>
				{:else}
					{#each options as opt, i (opt.value)}
						{#if isGroupHead(i)}
							<DropdownGroup label={opt.group} />
						{/if}
						<DropdownOption
							label={opt.label}
							id={optionId(i)}
							meta={opt.meta}
							metaClass={opt.metaClass}
							selected={opt.value === value}
							active={i === activeIdx}
							onpick={() => choose(opt)}
							onhover={() => (activeIdx = i)}
						/>
					{/each}
				{/if}
			</div>
			<ScrollZones target={scrollEl} />
		</DropdownPanel>
	{/if}
</div>

<style>
	.select-wrapper { position: relative; }
	.select-trigger {
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
	.select-trigger:hover:not(:disabled) { border-color: var(--text-muted); }
	.select-trigger:focus { border-color: var(--primary); outline: none; }
	.select-trigger:disabled { opacity: 0.5; cursor: not-allowed; }
	.select-trigger--open { border-color: var(--primary); }
	.select-trigger--placeholder { color: var(--text-muted); }
	.select-value { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
	.select-chevron { color: var(--text-muted); flex-shrink: 0; transition: transform 0.2s; }
	.select-chevron--open { transform: rotate(180deg); }

	/* 唯一滚动体：隐藏滚动条 → 左右内边距一致，上下触发区替代 */
	.select-scroll {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	.select-scroll::-webkit-scrollbar { display: none; }
	.select-empty { padding: var(--sp-lg); font-size: var(--fs-12); color: var(--text-muted); position: relative; z-index: 1; }
</style>

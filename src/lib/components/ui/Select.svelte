<script lang="ts" generics="T extends string | number">
	import { onMount, tick } from 'svelte';
	import { floatingPosition } from './floatingPosition';
	import { menuIn, menuOut } from './menuTransition';
	import { rowsHeight } from './rowHeight';
	import PillTrack from './PillTrack.svelte';
	import ScrollZones from './ScrollZones.svelte';
	import { createLayerId, isInsideLayer, layerOwnerOf, registerLayer, unregisterLayer } from './overlayLayer';
	import Check from '@lucide/svelte/icons/check';

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

	let open = $state(false);
	let mounted = $state(false);
	let activeIdx = $state(-1);
	let dropdownStyle = $state('');
	// 面板是否翻到触发器上方：进出场位移方向与缩放锚边都靠它决定
	let flipUp = $state(false);
	let wrapperEl: HTMLElement;
	let dropdownEl = $state<HTMLElement | null>(null);
	let scrollEl = $state<HTMLElement | null>(null);

	// combobox/listbox 的 ARIA 关联 id（每个实例唯一，供 aria-controls / aria-activedescendant 使用）
	const listId = `select-${Math.random().toString(36).slice(2, 8)}`;
	const optionId = (i: number) => `${listId}-${i}`;

	const selected = $derived(options.find((o) => o.value === value));
	const isGroupHead = (i: number) => {
		const g = options[i]?.group;
		return !!g && (i === 0 || options[i - 1].group !== g);
	};

	function toggle() {
		if (disabled) return;
		open = !open;
		if (open) activeIdx = options.findIndex((o) => o.value === value);
		else mounted = false;
	}

	function choose(opt: Option) {
		value = opt.value as T;
		onchange?.(opt.value as T);
		open = false;
		mounted = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (disabled) return;
		if (!open) {
			if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
				e.preventDefault();
				toggle();
			}
			return;
		}
		if (e.key === 'Escape') { e.stopPropagation(); open = false; mounted = false; }
		else if (e.key === 'ArrowDown') { e.preventDefault(); if (options.length) activeIdx = activeIdx < 0 ? 0 : (activeIdx + 1) % options.length; }
		else if (e.key === 'ArrowUp') { e.preventDefault(); if (options.length) activeIdx = activeIdx < 0 ? options.length - 1 : (activeIdx - 1 + options.length) % options.length; }
		else if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0 && options[activeIdx]) choose(options[activeIdx]); }
	}

	/**
	 * 把面板挂到 body。
	 *
	 * 面板是 position:fixed，但只要它还在触发器所在的 DOM 子树里，就会受
	 * 那棵树的包含块影响：祖先元素上的 backdrop-filter / transform / filter
	 * 会创建新的包含块，fixed 坐标随之相对它计算——放在 DataList 吸顶表头
	 * （有磨砂 backdrop-filter）里的下拉框会因此弹到错误位置。
	 * 挂到 body 后 fixed 才真正相对视口。
	 */
	function portal(node: HTMLElement) {
		// 先登记「我在哪一层里弹出来的」，再挂到 body
		const owner = layerOwnerOf(node);
		node.dataset.overlayLayer = layerId;
		registerLayer(layerId, owner);
		document.body.appendChild(node);
		return {
			destroy() {
				unregisterLayer(layerId);
				node.remove();
			},
		};
	}

	let measureCtx: CanvasRenderingContext2D | null = null;

	/**
	 * 选项行的内容宽度（最宽一行：勾选列 + 间距 + 标签/meta 文本）。
	 *
	 * 用 canvas measureText 离屏测量，不用等 DOM 渲染——面板宽度在
	 * 定位时就要确定，而那时选项还没挂载。字体族继承触发器，
	 * 字号取 .select-option 固定的 13px（meta 12px）。
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

	function position() {
		if (!wrapperEl) return;
		const rect = wrapperEl.getBoundingClientRect();
		// 面板高度 = 前 10 行（组头算一行）的实际高度，不足则自适应；8 为面板上下内边距，2 为边框
		const ddh = rowsHeight(options, 8).height + 2;
		// 面板宽度：默认跟触发器，但不窄于选项内容的自然宽度——
		// 窄触发器配长选项文本时不截断（.select-option-label 是 nowrap + ellipsis，
		// 宽度不够就会出省略号）。canvas 测量与实际排版有几像素级出入，
		// 留 8px 安全余量；再压一个视口上限兜底超长选项。
		const contentW = optionContentWidth() + 18; // 面板左右内边距 8 + 边框 2 + 测量安全余量 8
		const ddw = Math.min(window.innerWidth - 16, Math.max(120, rect.width, contentW));
		const r = floatingPosition(rect, {
			panelW: ddw,
			panelH: ddh,
			gap: 4,
			prefer: placement === 'top' ? 'top' : 'bottom',
			side: placement === 'left' || placement === 'right' ? placement : undefined,
		});
		dropdownStyle = `position: fixed; z-index: var(--z-max); ${r.style}`;
		flipUp = r.flipUp;
		mounted = true;
	}

	$effect(() => {
		if (!open) return;
		tick().then(position);
		// 打开期间跟随页面滚动/缩放：fixed 面板否则会脱离触发器
		const onWin = (e: Event) => {
			if (scrollEl && e.target === scrollEl) return;
			position();
		};
		window.addEventListener('scroll', onWin, true);
		window.addEventListener('resize', onWin);
		return () => {
			window.removeEventListener('scroll', onWin, true);
			window.removeEventListener('resize', onWin);
		};
	});

	// 隐藏滚动条后键盘导航须把活动项滚进可视区（手写边界，避免 fixed 面板连带滚页面）
	$effect(() => {
		const idx = activeIdx;
		const el = scrollEl;
		if (!open || idx < 0 || !el) return;
		const item = el.querySelectorAll<HTMLElement>('.select-option')[idx];
		if (!item) return;
		const top = item.offsetTop;
		const bottom = top + item.offsetHeight;
		if (top < el.scrollTop) el.scrollTop = top;
		else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight;
	});

	function handleOutsideClick(e: MouseEvent) {
		// 面板已 portal 到 body，不再是 wrapperEl 的后代，必须单独判断，
		// 否则点选项会先被这里判成「外部点击」直接关掉。
		if (wrapperEl && !isInsideLayer(e.target, layerId, [wrapperEl, dropdownEl])) { open = false; mounted = false; }
	}

	onMount(() => {
		document.addEventListener('mousedown', handleOutsideClick);
		return () => document.removeEventListener('mousedown', handleOutsideClick);
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
		aria-expanded={open}
		aria-controls={open ? listId : undefined}
		aria-activedescendant={open && activeIdx >= 0 ? optionId(activeIdx) : undefined}
		class="select-trigger"
		class:select-trigger--open={open}
		class:select-trigger--placeholder={!selected}
	>
		<span class="select-value">{selected?.label ?? placeholder}</span>
		<svg class="select-chevron" class:select-chevron--open={open} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
	</button>

	{#if open && mounted}
		<div
			class="select-dropdown"
			bind:this={dropdownEl}
			use:portal
			style={dropdownStyle}
			role="listbox"
			id={listId}
			in:menuIn={{ up: flipUp }}
			out:menuOut={{ up: flipUp }}
		>
			<div class="select-scroll" bind:this={scrollEl}>
				<!-- 两个 pill 分工：选中 = 主题色常驻，指针落点 = 中性灰。
				     主题色只表示「已选中」，不再跟着指针跑 —— 否则每一行被划过时
				     都像被选中了一次，真正的选中项反而要靠勾和淡染底去猜。
				     指针压在选中项上时换 --primary-hover（同一色相深一档），
				     既有悬停反馈，又不会把激活标识抹掉。 -->
				<PillTrack
					container={scrollEl}
					itemSelector=".select-option"
					activeSelector=".select-option--selected"
					background="var(--primary)"
					hoverBackground="var(--hover)"
					activeHoverBackground="var(--primary-hover)"
					radius="var(--radius-md)"
				/>
				{#if options.length === 0}
					<div class="select-empty">暂无选项</div>
				{:else}
					{#each options as opt, i (opt.value)}
						{#if isGroupHead(i)}
							<div class="select-group" role="presentation">{opt.group}</div>
						{/if}
						<button
							type="button"
							class="select-option"
							class:select-option--active={i === activeIdx}
							class:select-option--selected={opt.value === value}
							onclick={() => choose(opt)}
							onmouseenter={() => activeIdx = i}
							role="option"
							id={optionId(i)}
							aria-selected={opt.value === value}
						>
						<span class="select-option-check" aria-hidden="true">
							{#if opt.value === value}
								<Check size={14} />
							{/if}
						</span>
						<span class="select-option-label">{opt.label}</span>
							{#if opt.meta}
								<span class="select-meta select-meta--{opt.metaClass ?? 'default'}">{opt.meta}</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
			<ScrollZones target={scrollEl} />
		</div>
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

	.select-dropdown {
		position: fixed;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		/* 上下左右 4px 内边距：hover pill / 首末行不贴面板边框 */
		padding: var(--sp-sm);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		background-color: var(--popup-surface);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
		color: var(--text);
	}
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
	.select-group {
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
	.select-empty { padding: var(--sp-lg) var(--sp-lg); font-size: var(--fs-12); color: var(--text-muted); position: relative; z-index: 1; }
	.select-option {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: var(--sp-md);
		width: 100%;
		height: var(--height-md);
		padding: 0 var(--sp-lg);
		border: none;
		background: none;
		color: var(--text);
		font-size: var(--fs-13);
		text-align: left;
		cursor: pointer;
		transition: color 0.1s, background-color 0.1s;
	}
	/* 落点行的 pill 是实心主题色，文字必须转成 --accent-text（白），
	   否则深色字压在品牌色上看不清。选中行不在此列：它靠勾 + 淡染底表达状态。 */
	/* 悬停行：底是中性灰 pill，文字用常规深色（白字只留给主题色底） */
	.select-option:hover:not(.select-option--selected) { color: var(--text-strong); }
	/* 方向键落点：同样一块中性灰。:not(:hover) 是必须的 —— 鼠标划过时也会写 activeIdx，
	   不加这个限定就会「CSS 灰底先亮、灰 pill 后到」，同一行闪两次。 */
	.select-option--active:not(.select-option--selected):not(:hover) {
		background-color: var(--hover);
		color: var(--text-strong);
	}
	/* 选中行：底交给常驻的主题色 pill，这里只负责把文字翻成前景色 */
	.select-option--selected { color: var(--accent-text); font-weight: 500; }
	/* 勾槽常驻 16px：选中渲染勾，未选中留空 → 文字列恒定不跳动 */
	.select-option-check { display: flex; align-items: center; justify-content: center; width: 16px; flex-shrink: 0; color: var(--primary); }
	/* 勾压在主题色 pill 上，必须跟着行文字一起翻白，否则深蓝勾配深蓝底等于消失 */
	.select-option--selected .select-option-check { color: inherit; }
	.select-option-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.select-meta {
		font-size: var(--fs-12);
		padding: var(--space-0-5) var(--space-1-5);
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}
	.select-meta--default { background-color: var(--surface-2); color: var(--text-muted); }
	.select-meta--good { background-color: var(--success-soft); color: var(--success-text); }
	.select-meta--medium { background-color: #fef3c7; color: #d97706; }
	.select-meta--bad { background-color: var(--danger-soft); color: var(--danger-text); }
	/* 选中行是主题色实心块，标签自带的浅灰/浅彩色底压在蓝上会显得脏，
	   统一换成一层白纱 + 行文字色；语义色在选中态让位给「可读」 */
	.select-option--selected .select-meta {
		background-color: rgba(255, 255, 255, 0.18);
		color: var(--accent-text);
	}
	:global(.dark) .select-dropdown { background-color: var(--popup-surface); color: var(--text); }
	:global(.dark) .select-group { background-color: var(--popup-surface); }
	:global(.dark) .select-option { color: var(--text); }
	/* 0,2,0 的 .dark .select-option 会盖掉 0,1,0 的选中行配色，必须同时抬一档 */
	:global(.dark) .select-option--selected { color: var(--accent-text); }
</style>

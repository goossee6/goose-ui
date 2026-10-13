<script lang="ts" generics="T extends string | number">
	import { onMount, tick } from 'svelte';
	import { floatingPosition } from './floatingPosition';
	import { rowsHeight } from './rowHeight';
	import PillTrack from './PillTrack.svelte';
	import ScrollZones from './ScrollZones.svelte';
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

	let open = $state(false);
	let mounted = $state(false);
	let activeIdx = $state(-1);
	let dropdownStyle = $state('');
	let wrapperEl: HTMLElement;
	let scrollEl = $state<HTMLElement | null>(null);

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

	function position() {
		if (!wrapperEl) return;
		const rect = wrapperEl.getBoundingClientRect();
		// 面板高度 = 前 10 行（组头算一行）的实际高度，不足则自适应；8 为面板上下内边距，2 为边框
		const ddh = rowsHeight(options, 8).height + 2;
		const ddw = Math.max(120, rect.width);
		const r = floatingPosition(rect, {
			panelW: ddw,
			panelH: ddh,
			gap: 4,
			prefer: placement === 'top' ? 'top' : 'bottom',
			side: placement === 'left' || placement === 'right' ? placement : undefined,
		});
		dropdownStyle = `position: fixed; z-index: var(--z-max); ${r.style}`;
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
		if (wrapperEl && !wrapperEl.contains(e.target as Node)) { open = false; mounted = false; }
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
		aria-haspopup="listbox"
		aria-expanded={open}
		class="select-trigger"
		class:select-trigger--open={open}
		class:select-trigger--placeholder={!selected}
	>
		<span class="select-value">{selected?.label ?? placeholder}</span>
		<svg class="select-chevron" class:select-chevron--open={open} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
	</button>

	{#if open && mounted}
		<div class="select-dropdown" style={dropdownStyle} role="listbox">
			<div class="select-scroll" bind:this={scrollEl}>
				<PillTrack
					container={scrollEl}
					activeSelector=".select-option--active:not(.select-option--selected)"
					background="color-mix(in srgb, var(--primary) 15%, transparent)"
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
		background-color: var(--surface);
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
		padding: 0 40px;
		font-size: 12px;
		font-weight: 600;
		color: color-mix(in srgb, var(--text-muted) 70%, transparent);
		background-color: var(--surface);
	}
	.select-empty { padding: var(--sp-lg) var(--sp-lg); font-size: 12px; color: var(--text-muted); position: relative; z-index: 1; }
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
		font-size: 13px;
		text-align: left;
		cursor: pointer;
		transition: color 0.1s, background-color 0.1s;
	}
	.select-option:hover { color: var(--text-strong); }
	.select-option--active { color: var(--text-strong); }
	.select-option--selected { background-color: var(--primary-soft); color: var(--text-strong); font-weight: 500; }
	/* 勾槽常驻 16px：选中渲染勾，未选中留空 → 文字列恒定不跳动 */
	.select-option-check { display: flex; align-items: center; justify-content: center; width: 16px; flex-shrink: 0; color: var(--primary); }
	.select-option-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.select-meta {
		font-size: 12px;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}
	.select-meta--default { background-color: var(--surface-2); color: var(--text-muted); }
	.select-meta--good { background-color: var(--success-soft); color: var(--success-text); }
	.select-meta--medium { background-color: #fef3c7; color: #d97706; }
	.select-meta--bad { background-color: var(--danger-soft); color: var(--danger-text); }
	:global(.dark) .select-dropdown { background-color: var(--surface); color: var(--text); }
	:global(.dark) .select-group { background-color: var(--surface); }
	:global(.dark) .select-option { color: var(--text); }
	:global(.dark) .select-option:hover,
	:global(.dark) .select-option--active,
	:global(.dark) .select-option--selected { color: var(--text-strong); }
</style>

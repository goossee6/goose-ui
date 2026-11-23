<script lang="ts">
	import { weekdayLabels, toISO, fromISO, buildCells, shiftByArrow, shiftMonth, blocked } from './calendarGrid';
	import Button from './Button.svelte';
	import PillTrack from './PillTrack.svelte';
	import PickerFooter from './PickerFooter.svelte';

	let {
		value = $bindable(''),
		min = '',
		max = '',
		disabled = false,
		disabledDate,
		weekStart = 1,
		showToday = true,
		onchange,
		oncancel,
		onconfirm,
		class: cls = '',
		style = '',
	}: {
		value?: string;
		min?: string;
		max?: string;
		disabled?: boolean;
		disabledDate?: (iso: string) => boolean;
		weekStart?: 0 | 1;
		showToday?: boolean;
		onchange?: (value: string) => void;
		/** 传了才渲染底部「取消 / 确认」；纯展示用（静态卡片）不要传 */
		oncancel?: () => void;
		onconfirm?: () => void;
		class?: string;
		style?: string;
	} = $props();

	const today = $derived(new Date());
	const selected = $derived(fromISO(value));

	// PillTrack 容器：header（导航）/ grid（日期格）/ footer（今天按钮）
	let headerEl = $state<HTMLElement | null>(null);
	let gridEl = $state<HTMLElement | null>(null);
	let footerEl = $state<HTMLElement | null>(null);

	let viewYear = $state(new Date().getFullYear());
	let viewMonth = $state(new Date().getMonth());

	const weekdays = $derived(weekdayLabels(weekStart));
	const cells = $derived(buildCells(viewYear, viewMonth, weekStart, today));

	function isDisabled(iso: string): boolean {
		return blocked(iso, { disabled, min, max, disabledDate });
	}

	function moveMonth(delta: number) {
		const next = shiftMonth(viewYear, viewMonth, delta);
		viewYear = next.year;
		viewMonth = next.month;
	}

	function pick(iso: string) {
		if (isDisabled(iso)) return;
		value = iso;
		onchange?.(iso);
	}

	function goToday() {
		viewYear = today.getFullYear();
		viewMonth = today.getMonth();
		pick(toISO(today));
	}

	function onKeydown(e: KeyboardEvent) {
		if (disabled) return;
		const next = shiftByArrow(selected ?? today, e.key);
		if (next) {
			e.preventDefault();
			viewYear = next.getFullYear();
			viewMonth = next.getMonth();
			pick(toISO(next));
			return;
		}
		if (e.key === 'PageUp' || e.key === 'PageDown') {
			e.preventDefault();
			moveMonth(e.key === 'PageUp' ? -1 : 1);
		}
	}
</script>

<div class="calendar {cls}" class:disabled style={style}>
	<div class="calendar-header" bind:this={headerEl}>
		<PillTrack
			container={headerEl}
			itemSelector=".calendar-nav"
			showSelected={false}
			hoverBackground="var(--hover)"
			radius="var(--radius-md)"
		/>
		<button type="button" class="calendar-nav" aria-label="上个月" disabled={disabled} onclick={() => moveMonth(-1)}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
		</button>
		<span class="calendar-title" aria-live="polite">{viewYear} 年 {viewMonth + 1} 月</span>
		<button type="button" class="calendar-nav" aria-label="下个月" disabled={disabled} onclick={() => moveMonth(1)}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
		</button>
	</div>

	<div class="calendar-weekdays" role="row">
		{#each weekdays as w (w)}
			<span class="calendar-weekday" role="columnheader">{w}</span>
		{/each}
	</div>

	<div class="calendar-grid" role="grid" tabindex={disabled ? -1 : 0} aria-label="日历" onkeydown={onKeydown} bind:this={gridEl}>
		<PillTrack
			container={gridEl}
			itemSelector=".calendar-day"
			activeSelector=".calendar-day.selected"
			hoverBackground="var(--hover)"
			background="var(--primary)"
			activeHoverBackground="var(--primary-hover)"
			radius="var(--radius-md)"
		/>
		{#each cells as cell (cell.iso)}
			{@const off = isDisabled(cell.iso)}
			<button
				type="button"
				class="calendar-day"
				class:out={!cell.inMonth}
				class:today={cell.today}
				class:selected={value === cell.iso}
				disabled={off}
				aria-current={cell.today ? 'date' : undefined}
				data-selected={value === cell.iso}
				onclick={() => pick(cell.iso)}
			>
				{cell.date.getDate()}
			</button>
		{/each}
	</div>

	{#if showToday || onconfirm}
		<div class="calendar-footer" class:with-actions={!!onconfirm} bind:this={footerEl}>
			{#if showToday}
				<PillTrack
					container={footerEl}
					itemSelector=".calendar-today-btn"
					showSelected={false}
					hoverBackground="var(--hover)"
					radius="var(--radius-sm)"
				/>
				<Button variant="text-primary" size="xs" class="calendar-today-btn" {disabled} onclick={goToday}>今天</Button>
			{/if}
			{#if onconfirm}
				<div class="calendar-actions">
					<Button variant="ghost" size="small" {disabled} onclick={() => oncancel?.()}>取消</Button>
					<Button variant="primary" size="small" {disabled} onclick={onconfirm}>确认</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.calendar {
		width: 280px;
		padding: var(--sp-lg);
		/* 与下拉 / 菜单同一个浮层底色（见 theme.css 里 --popup-surface 的说明）：
		   surface 系是页面内的面，日历是浮在页面之上（或被 Card 垫着）的一块面板 */
		background: var(--popup-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-sizing: border-box;
	}
	.calendar.disabled {
		opacity: 0.5;
	}
	.calendar-header {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--sp-md);
	}
	.calendar-title {
		font-size: var(--fs-13);
		font-weight: 600;
		color: var(--text-strong);
	}
	.calendar-nav {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		border-radius: var(--radius-md);
		background: none;
		color: var(--text-muted);
		cursor: pointer;
	}
	.calendar-nav:hover:not(:disabled) {
		color: var(--text-strong);
	}
	.calendar-nav:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.calendar-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		margin-bottom: var(--space-0-5);
	}
	.calendar-weekday {
		text-align: center;
		font-size: var(--fs-11);
		color: var(--text-muted);
		padding: var(--sp-sm) 0;
	}
	.calendar-grid {
		position: relative;
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: var(--space-0-5);
		outline: none;
	}
	.calendar-grid:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
		border-radius: var(--radius-md);
	}
	.calendar-day {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		border: none;
		border-radius: var(--radius-md);
		background: none;
		color: var(--text);
		font-size: var(--fs-13);
		font-family: var(--font-mono);
		cursor: pointer;
		transition: background-color 0.12s, color 0.12s;
	}
	.calendar-day:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.calendar-day.out {
		color: var(--text-muted);
		opacity: 0.5;
	}
	.calendar-day.today {
		font-weight: 700;
		color: var(--primary);
		box-shadow: inset 0 0 0 1px var(--primary);
	}
	.calendar-day.selected {
		color: var(--primary-text);
		box-shadow: none;
	}
	.calendar-footer {
		position: relative;
		display: flex;
		justify-content: center;
		margin-top: var(--sp-md);
		padding-top: var(--sp-md);
		border-top: 1px solid var(--border);
	}
	/* 有「取消 / 确认」时「今天」贴左、按钮贴右 */
	.calendar-footer.with-actions {
		justify-content: flex-start;
		gap: var(--sp-sm);
	}
	.calendar-actions {
		display: flex;
		align-items: center;
		gap: var(--sp-sm);
		margin-left: auto;
	}
	/* 样式全在 Button 的 text-primary + xs 档，这里只剩 PillTrack 需要的一件事：
	   悬停 pill 沉在条目下面（z-index:-1），条目必须自身定位才盖得住它。 */
	.calendar-today-btn {
		position: relative;
	}
</style>

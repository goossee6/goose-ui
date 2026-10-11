<script lang="ts">
	import { WEEKDAYS, toISO, fromISO, isSameDay, type CalendarCell } from './Calendar.svelte';

	let {
		start = $bindable(''),
		end = $bindable(''),
		min = '',
		max = '',
		disabled = false,
		disabledDate,
		weekStart = 1,
		onchange,
		class: cls = '',
		style = '',
	}: {
		start?: string;
		end?: string;
		min?: string;
		max?: string;
		disabled?: boolean;
		disabledDate?: (iso: string) => boolean;
		weekStart?: 0 | 1;
		onchange?: (range: { start: string; end: string }) => void;
		class?: string;
		style?: string;
	} = $props();

	const today = $derived(new Date());
	let picking = $state<'start' | 'end'>('start');
	let hoverIso = $state('');

	let viewYear = $state(new Date().getFullYear());
	let viewMonth = $state(new Date().getMonth());

	const startDate = $derived(fromISO(start));
	const endDate = $derived(fromISO(end));

	const weekdays = $derived.by(() => {
		if (weekStart === 1) return WEEKDAYS;
		return [...WEEKDAYS.slice(6), ...WEEKDAYS.slice(0, 6)];
	});

	const cells = $derived.by(() => {
		const first = new Date(viewYear, viewMonth, 1);
		const offset = (first.getDay() - weekStart + 7) % 7;
		const s = new Date(viewYear, viewMonth, 1 - offset);
		const list: CalendarCell[] = [];
		for (let i = 0; i < 42; i++) {
			const d = new Date(s.getFullYear(), s.getMonth(), s.getDate() + i);
			list.push({ date: d, iso: toISO(d), inMonth: d.getMonth() === viewMonth, today: isSameDay(d, today) });
		}
		return list;
	});

	function isDisabled(iso: string): boolean {
		if (disabled) return true;
		if (min && iso < min) return true;
		if (max && iso > max) return true;
		if (picking === 'end' && start && iso < start) return true;
		if (picking === 'start' && end && iso > end) return true;
		return disabledDate?.(iso) ?? false;
	}

	function inRange(iso: string): boolean {
		if (!start || !end) return false;
		return iso > start && iso < end;
	}

	function shiftMonth(delta: number) {
		const d = new Date(viewYear, viewMonth + delta, 1);
		viewYear = d.getFullYear();
		viewMonth = d.getMonth();
	}

	function pick(iso: string) {
		if (isDisabled(iso)) return;
		if (picking === 'start') {
			start = iso;
			if (end && iso > end) end = '';
			picking = 'end';
			hoverIso = '';
			onchange?.({ start, end });
		} else {
			if (iso < start) {
				end = '';
				start = iso;
				picking = 'end';
				onchange?.({ start, end });
				return;
			}
			end = iso;
			picking = 'start';
			hoverIso = '';
			onchange?.({ start, end });
		}
	}

	function previewBounds(): { from: string; to: string } {
		if (picking === 'end' && start && hoverIso) {
			return hoverIso >= start ? { from: start, to: hoverIso } : { from: hoverIso, to: start };
		}
		return { from: start, to: end };
	}

	const preview = $derived(hoverIso ? previewBounds() : { from: start, to: end });

	function onKeydown(e: KeyboardEvent) {
		if (disabled) return;
		const cur = startDate ?? today;
		let next: Date | null = null;
		if (e.key === 'ArrowLeft') next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 1);
		else if (e.key === 'ArrowRight') next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
		else if (e.key === 'ArrowUp') next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 7);
		else if (e.key === 'ArrowDown') next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 7);
		if (next) {
			e.preventDefault();
			viewYear = next.getFullYear();
			viewMonth = next.getMonth();
			pick(toISO(next));
		}
	}
</script>

<div class="range-calendar {cls}" class:disabled style={style}>
	<div class="rc-header">
		<button type="button" class="rc-nav" aria-label="上个月" disabled={disabled} onclick={() => shiftMonth(-1)}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
		</button>
		<span class="rc-title" aria-live="polite">{viewYear} 年 {viewMonth + 1} 月</span>
		<button type="button" class="rc-nav" aria-label="下个月" disabled={disabled} onclick={() => shiftMonth(1)}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
		</button>
	</div>

	<div class="rc-weekdays">
		{#each weekdays as w (w)}
			<span class="rc-weekday">{w}</span>
		{/each}
	</div>

	<div
		class="rc-grid"
		role="grid"
		tabindex={disabled ? -1 : 0}
		aria-label="日期范围"
		onkeydown={onKeydown}
		onmouseleave={() => (hoverIso = '')}
	>
		{#each cells as cell (cell.iso)}
			{@const off = isDisabled(cell.iso)}
			<button
				type="button"
				class="rc-day"
				class:out={!cell.inMonth}
				class:today={cell.today}
				class:selected={cell.iso === start || cell.iso === end}
				class:in-range={inRange(cell.iso)}
				class:preview={cell.iso === preview.from || cell.iso === preview.to}
				class:preview-mid={cell.iso > preview.from && cell.iso < preview.to}
				disabled={off}
				data-selected={cell.iso === start || cell.iso === end}
				onclick={() => pick(cell.iso)}
				onmouseenter={() => !off && (hoverIso = cell.iso)}
			>
				{cell.date.getDate()}
			</button>
		{/each}
	</div>

	<div class="rc-footer">
		<span class="rc-hint">{picking === 'start' ? '选择开始日期' : '选择结束日期'}</span>
		<button
			type="button"
			class="rc-clear"
			disabled={disabled || (!start && !end)}
			onclick={() => {
				start = '';
				end = '';
				picking = 'start';
				hoverIso = '';
				onchange?.({ start: '', end: '' });
			}}
		>
			清除
		</button>
	</div>
</div>

<style>
	.range-calendar {
		width: 280px;
		padding: var(--sp-lg);
		background: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-sizing: border-box;
	}
	.range-calendar.disabled {
		opacity: 0.5;
	}
	.rc-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--sp-md);
	}
	.rc-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-strong);
	}
	.rc-nav {
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
	.rc-nav:hover:not(:disabled) {
		background: var(--hover);
		color: var(--text-strong);
	}
	.rc-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		margin-bottom: 2px;
	}
	.rc-weekday {
		text-align: center;
		font-size: 11px;
		color: var(--text-muted);
		padding: var(--sp-sm) 0;
	}
	.rc-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
		outline: none;
	}
	.rc-grid:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
		border-radius: var(--radius-md);
	}
	.rc-day {
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		border: none;
		border-radius: var(--radius-md);
		background: none;
		color: var(--text);
		font-size: 13px;
		font-family: var(--font-mono);
		cursor: pointer;
		transition: background-color 0.12s, color 0.12s;
	}
	.rc-day:hover:not(:disabled) {
		background: var(--hover);
	}
	.rc-day:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.rc-day.out {
		color: var(--text-muted);
		opacity: 0.5;
	}
	.rc-day.today {
		font-weight: 700;
		color: var(--primary);
	}
	.rc-day.in-range,
	.rc-day.preview-mid {
		background: var(--primary-soft);
		border-radius: 0;
	}
	.rc-day.preview {
		background: color-mix(in srgb, var(--primary) 30%, transparent);
	}
	.rc-day.selected,
	.rc-day.selected.preview {
		background: var(--primary);
		color: var(--primary-text);
		font-weight: 600;
	}
	.rc-day.selected:hover:not(:disabled) {
		background: var(--primary-hover);
	}
	.rc-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: var(--sp-md);
		padding-top: var(--sp-md);
		border-top: 1px solid var(--border);
	}
	.rc-hint {
		font-size: 12px;
		color: var(--text-muted);
	}
	.rc-clear {
		border: none;
		background: none;
		color: var(--primary);
		font-size: 12px;
		cursor: pointer;
		padding: 2px var(--sp-sm);
		border-radius: var(--radius-sm);
	}
	.rc-clear:hover:not(:disabled) {
		background: var(--primary-soft);
	}
	.rc-clear:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>

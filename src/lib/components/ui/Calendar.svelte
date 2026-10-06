<script lang="ts" module>
	export const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

	export function toISO(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	export function fromISO(iso: string): Date | null {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
		const [y, m, d] = iso.split('-').map(Number);
		const date = new Date(y, m - 1, d);
		return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
	}

	export function isSameDay(a: Date, b: Date): boolean {
		return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
	}

	export interface CalendarCell {
		date: Date;
		iso: string;
		inMonth: boolean;
		today: boolean;
	}
</script>

<script lang="ts">
	let {
		value = $bindable(''),
		min = '',
		max = '',
		disabled = false,
		disabledDate,
		weekStart = 1,
		showToday = true,
		onchange,
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
		class?: string;
		style?: string;
	} = $props();

	const today = $derived(new Date());
	const selected = $derived(fromISO(value));

	let viewYear = $state(new Date().getFullYear());
	let viewMonth = $state(new Date().getMonth());

	const weekdays = $derived.by(() => {
		if (weekStart === 1) return WEEKDAYS;
		return [...WEEKDAYS.slice(6), ...WEEKDAYS.slice(0, 6)];
	});

	const cells = $derived.by(() => {
		const first = new Date(viewYear, viewMonth, 1);
		const offset = (first.getDay() - weekStart + 7) % 7;
		const start = new Date(viewYear, viewMonth, 1 - offset);
		const list: CalendarCell[] = [];
		for (let i = 0; i < 42; i++) {
			const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
			list.push({ date: d, iso: toISO(d), inMonth: d.getMonth() === viewMonth, today: isSameDay(d, today) });
		}
		return list;
	});

	function isDisabled(iso: string): boolean {
		if (disabled) return true;
		if (min && iso < min) return true;
		if (max && iso > max) return true;
		return disabledDate?.(iso) ?? false;
	}

	function shiftMonth(delta: number) {
		const d = new Date(viewYear, viewMonth + delta, 1);
		viewYear = d.getFullYear();
		viewMonth = d.getMonth();
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
		const cur = selected ?? today;
		let next: Date | null = null;
		if (e.key === 'ArrowLeft') next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 1);
		else if (e.key === 'ArrowRight') next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
		else if (e.key === 'ArrowUp') next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 7);
		else if (e.key === 'ArrowDown') next = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 7);
		else if (e.key === 'PageUp') shiftMonth(-1);
		else if (e.key === 'PageDown') shiftMonth(1);
		if (next) {
			e.preventDefault();
			viewYear = next.getFullYear();
			viewMonth = next.getMonth();
			pick(toISO(next));
		} else if (e.key === 'PageUp' || e.key === 'PageDown') {
			e.preventDefault();
		}
	}
</script>

<div class="calendar {cls}" class:disabled style={style}>
	<div class="calendar-header">
		<button type="button" class="calendar-nav" aria-label="上个月" disabled={disabled} onclick={() => shiftMonth(-1)}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
		</button>
		<span class="calendar-title" aria-live="polite">{viewYear} 年 {viewMonth + 1} 月</span>
		<button type="button" class="calendar-nav" aria-label="下个月" disabled={disabled} onclick={() => shiftMonth(1)}>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
		</button>
	</div>

	<div class="calendar-weekdays" role="row">
		{#each weekdays as w (w)}
			<span class="calendar-weekday" role="columnheader">{w}</span>
		{/each}
	</div>

	<div class="calendar-grid" role="grid" tabindex={disabled ? -1 : 0} aria-label="日历" onkeydown={onKeydown}>
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

	{#if showToday}
		<div class="calendar-footer">
			<button type="button" class="calendar-today-btn" disabled={disabled} onclick={goToday}>今天</button>
		</div>
	{/if}
</div>

<style>
	.calendar {
		width: 280px;
		padding: var(--sp-md);
		background: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-sizing: border-box;
	}
	.calendar.disabled {
		opacity: 0.5;
	}
	.calendar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--sp-sm);
	}
	.calendar-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-strong);
	}
	.calendar-nav {
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
		background: var(--hover);
		color: var(--text-strong);
	}
	.calendar-nav:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.calendar-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		margin-bottom: var(--sp-2xs);
	}
	.calendar-weekday {
		text-align: center;
		font-size: 11px;
		color: var(--text-muted);
		padding: var(--sp-xs) 0;
	}
	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
		outline: none;
	}
	.calendar-grid:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
		border-radius: var(--radius-md);
	}
	.calendar-day {
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
	.calendar-day:hover:not(:disabled) {
		background: var(--hover);
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
		background: var(--primary);
		color: var(--primary-text);
		box-shadow: none;
	}
	.calendar-day.selected:hover:not(:disabled) {
		background: var(--primary-hover);
	}
	.calendar-footer {
		display: flex;
		justify-content: center;
		margin-top: var(--sp-sm);
		padding-top: var(--sp-sm);
		border-top: 1px solid var(--border);
	}
	.calendar-today-btn {
		border: none;
		background: none;
		color: var(--primary);
		font-size: 12px;
		cursor: pointer;
		padding: var(--sp-2xs) var(--sp-sm);
		border-radius: var(--radius-sm);
	}
	.calendar-today-btn:hover:not(:disabled) {
		background: var(--primary-soft);
	}
</style>

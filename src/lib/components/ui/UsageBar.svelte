<script lang="ts">
	import { formatNum } from '../../utils/format';
	import type { Snippet } from 'svelte';

	let {
		label = '',
		value = 0,
		limit = 0,
		used,
		total,
		formatValue = formatNum,
		barHeight = '6px',
		labelRight,
		class: cls = '',
		style = '',
	}: {
		label?: string;
		value?: number;
		limit?: number;
		used?: number;
		total?: number;
		formatValue?: (n: number) => string;
		barHeight?: string;
		class?: string;
		style?: string;
		labelRight?: Snippet<[{ value: number; limit: number; percent: number; overQuota: boolean; formatValue: (n: number) => string }]>;
	} = $props();

	const v = $derived(used ?? value);
	const t = $derived(total ?? limit);
	const percent = $derived(t > 0 ? Math.min(100, (v / t) * 100) : 0);
	const overQuota = $derived(v > t);
	const high = $derived(t > 0 && v / t > 0.8);
</script>

<div class="usage-bar {cls}" style={style}>
	<div class="usage-label">
		<span class="usage-label-text">{label}</span>
		{#if labelRight}
			{@render labelRight({ value: v, limit: t, percent, overQuota, formatValue })}
		{:else}
			<span class={overQuota ? 'usage-over' : ''}>
				{formatValue(v)} / {formatValue(t)}
				<span class="usage-pct">({percent.toFixed(1)}%)</span>
			</span>
		{/if}
	</div>
	<div class="usage-track" style="height: {barHeight}">
		<div
			class="usage-fill"
			class:usage-fill--over={overQuota}
			class:usage-fill--high={high && !overQuota}
			style="width: {Math.min(100, percent)}%"
		></div>
	</div>
</div>

<style>
	.usage-bar { display: flex; flex-direction: column; gap: var(--space-0-5); }
	.usage-label { display: flex; align-items: center; justify-content: space-between; font-size: var(--fs-12); }
	.usage-label-text { color: var(--text-muted); }
	.usage-over { color: var(--danger-text); font-weight: 600; }
	.usage-pct { margin-left: var(--space-1-5); }
	.usage-track { width: 100%; background-color: var(--surface-2); border-radius: var(--radius-full); overflow: hidden; }
	.usage-fill { height: 100%; border-radius: var(--radius-full); background-color: var(--primary); transition: width 0.5s; }
	.usage-fill--over { background-color: var(--danger); }
	.usage-fill--high { background-color: #f59e0b; }
</style>

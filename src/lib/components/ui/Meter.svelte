<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		value = 0,
		min = 0,
		max = 100,
		label = '',
		threshold = 80,
		critical = 100,
		format,
		labelRight,
		class: cls = '',
		style = '',
	}: {
		value?: number;
		min?: number;
		max?: number;
		label?: string;
		threshold?: number;
		critical?: number;
		format?: (n: number) => string;
		labelRight?: Snippet<[{ value: number; percent: number }]>;
		class?: string;
		style?: string;
	} = $props();

	const span = $derived(max - min);
	const percent = $derived(span > 0 ? Math.min(100, Math.max(0, ((value - min) / span) * 100)) : 0);
	// critical 是「转危险色的百分比」prop，必须参与判定：
	// 原实现写死 percent >= 100，导致 critical 完全无效（传 critical={85} 也要满 100% 才变色）。
	// critical <= 0 视为未配置，回退到 100 以免任何值都判为 critical。
	const criticalAt = $derived(critical > 0 ? critical : 100);
	const state = $derived(
		percent >= criticalAt ? 'critical' : percent >= threshold ? 'high' : 'normal'
	);
	const display = $derived(format ? format(value) : String(value));
</script>

<div class="meter meter--{state} {cls}" style={style}>
	{#if label || labelRight}
		<div class="meter-label">
			{#if label}<span class="meter-label-text">{label}</span>{/if}
			{#if labelRight}
				{@render labelRight({ value, percent })}
			{:else if label}
				<span class="meter-label-value">{display} / {max}</span>
			{/if}
		</div>
	{/if}
	<div
		class="meter-track"
		role="progressbar"
		aria-valuenow={value}
		aria-valuemin={min}
		aria-valuemax={max}
		aria-label={label || '度量'}
	>
		<div class="meter-fill" style="width: {percent}%"></div>
	</div>
</div>

<style>
	.meter {
		display: flex;
		flex-direction: column;
		gap: 2px;
		width: 100%;
	}
	.meter-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 12px;
		color: var(--text-muted);
	}
	.meter-label-text {
		color: var(--text);
	}
	.meter-label-value {
		font-family: var(--font-mono);
	}
	.meter-track {
		height: 8px;
		width: 100%;
		border-radius: 9999px;
		background-color: var(--surface-2);
		overflow: hidden;
	}
	.meter-fill {
		height: 100%;
		border-radius: 9999px;
		/* 统一强调渐变：主色 -30° → +30°（见 theme.css） */
		background: var(--gradient-accent);
		transition: width 0.5s ease-out, background 0.3s ease;
	}
	.meter--high .meter-fill {
		background: var(--warning);
	}
	.meter--critical .meter-fill {
		background: var(--danger);
	}
</style>

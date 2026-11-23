<script lang="ts">
	import { pad2 } from './dateParts';

	let {
		mode = 'time',
		showSeconds = true,
		hour12 = false,
		showDate = true,
		interval = 1000,
		prefix = '',
		class: cls = '',
		style = '',
	}: {
		mode?: 'time' | 'date' | 'datetime';
		showSeconds?: boolean;
		hour12?: boolean;
		showDate?: boolean;
		interval?: number;
		prefix?: string;
		class?: string;
		style?: string;
	} = $props();

	let now = $state(new Date());
	let timer: ReturnType<typeof setInterval> | null = null;

	$effect(() => {
		timer = setInterval(() => (now = new Date()), interval);
		return () => {
			if (timer) clearInterval(timer);
		};
	});

	const timeStr = $derived.by(() => {
		let h = now.getHours();
		let suffix = '';
		if (hour12) {
			suffix = h >= 12 ? ' PM' : ' AM';
			h = h % 12 || 12;
		}
		const base = showSeconds
			? `${pad2(h)}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
			: `${pad2(h)}:${pad2(now.getMinutes())}`;
		return base + suffix;
	});

	const dateStr = $derived(
		`${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
	);

	const weekdayStr = $derived(
		['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
	);
</script>

<time
	class="time {cls}"
	style={style}
	datetime={now.toISOString()}
	aria-label="当前时间"
>
	{#if prefix}<span class="time-prefix">{prefix}</span>{/if}
	{#if mode === 'date' || (mode === 'datetime' && showDate)}
		<span class="time-date">{dateStr} 周{weekdayStr}</span>
	{/if}
	{#if mode === 'time' || mode === 'datetime'}
		<span class="time-clock" class:colon={showSeconds}>{timeStr}</span>
	{/if}
</time>

<style>
	.time {
		display: inline-flex;
		align-items: baseline;
		gap: var(--sp-sm);
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		color: var(--text);
	}
	.time-prefix {
		color: var(--text-muted);
	}
	.time-date {
		color: var(--text-muted);
		font-size: 0.9em;
	}
	.time-clock {
		font-weight: 600;
		letter-spacing: 0.02em;
	}
</style>

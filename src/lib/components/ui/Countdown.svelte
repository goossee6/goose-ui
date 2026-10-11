<script lang="ts" module>
	function pad(n: number): string {
		return String(n).padStart(2, '0');
	}
</script>

<script lang="ts">
	let {
		duration = 0,
		target = 0,
		showDays = true,
		separator = ':',
		onfinish,
		onchange,
		autostart = true,
		paused = $bindable(false),
		class: cls = '',
		style = '',
	}: {
		duration?: number;
		target?: number;
		showDays?: boolean;
		separator?: string;
		onfinish?: () => void;
		onchange?: (remaining: number) => void;
		autostart?: boolean;
		paused?: boolean;
		class?: string;
		style?: string;
	} = $props();

	const initial = $derived(target > 0 ? Math.max(0, target - Date.now()) : Math.max(0, duration));

	let remaining = $state(0);
	let done = $state(false);
	// 非响应式：$effect 会读它做一次性启动判断，若用 $state 会在 start() 写入时
	// 触发 effect 重跑 → cleanup 清掉刚建的 timer → 倒计时永远不动
	let started = false;
	let timer: ReturnType<typeof setInterval> | null = null;
	let lastTick = 0;

	function stop() {
		if (timer) clearInterval(timer);
		timer = null;
	}

	function start(from: number) {
		stop();
		if (from <= 0) {
			remaining = 0;
			finish();
			return;
		}
		remaining = from;
		done = false;
		lastTick = Date.now();
		timer = setInterval(() => {
			if (paused) {
				lastTick = Date.now();
				return;
			}
			const next = target > 0 ? Math.max(0, target - Date.now()) : Math.max(0, remaining - (Date.now() - lastTick));
			lastTick = Date.now();
			remaining = next;
			onchange?.(remaining);
			if (remaining <= 0) finish();
		}, 250);
	}

	function finish() {
		stop();
		remaining = 0;
		done = true;
		onfinish?.();
	}

	$effect(() => {
		const init = initial;
		if (autostart && !started) {
			started = true;
			start(init);
		}
		return () => stop();
	});

	const parts = $derived.by(() => {
		let s = Math.ceil(remaining / 1000);
		const d = Math.floor(s / 86400);
		s -= d * 86400;
		const h = Math.floor(s / 3600);
		s -= h * 3600;
		const m = Math.floor(s / 60);
		s -= m * 60;
		return { d, h, m, s };
	});

	const display = $derived.by(() => {
		const segs: string[] = [];
		if (showDays && parts.d > 0) segs.push(String(parts.d).padStart(2, '0'));
		segs.push(pad(parts.h), pad(parts.m), pad(parts.s));
		return segs.join(separator);
	});
</script>

<div class="countdown {cls}" class:done style={style} role="timer" aria-live="off">
	<span class="countdown-value">{display}</span>
	{#if parts.d > 0 && !showDays}
		<span class="countdown-note">（含 {parts.d} 天）</span>
	{/if}
</div>

<style>
	.countdown {
		display: inline-flex;
		align-items: baseline;
		gap: var(--sp-sm);
	}
	.countdown-value {
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		color: var(--text);
		letter-spacing: 0.04em;
	}
	.countdown.done .countdown-value {
		color: var(--primary);
	}
	.countdown-note {
		font-size: 12px;
		color: var(--text-muted);
	}
</style>

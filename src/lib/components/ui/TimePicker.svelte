<script lang="ts" module>
	function pad(n: number): string {
		return String(n).padStart(2, '0');
	}
</script>

<script lang="ts">
	import { floatingPosition } from './floatingPosition';
	import PillTrack from './PillTrack.svelte';

	let {
		value = $bindable(''),
		showSeconds = true,
		disabled = false,
		clearable = true,
		placeholder = '选择时间…',
		hourStep = 1,
		minuteStep = 1,
		secondStep = 1,
		onchange,
		class: cls = '',
		style = '',
	}: {
		value?: string;
		showSeconds?: boolean;
		disabled?: boolean;
		clearable?: boolean;
		placeholder?: string;
		hourStep?: number;
		minuteStep?: number;
		secondStep?: number;
		onchange?: (value: string) => void;
		class?: string;
		style?: string;
	} = $props();

	let rootEl = $state<HTMLElement | null>(null);
	let panelEl = $state<HTMLElement | null>(null);
	let hColEl = $state<HTMLElement | null>(null);
	let mColEl = $state<HTMLElement | null>(null);
	let sColEl = $state<HTMLElement | null>(null);
	let panelStyle = $state('');
	let open = $state(false);
	let flipUp = $state(false);

	const parts = $derived.by(() => {
		const segs = (value || '').split(':');
		return {
			h: segs[0] ?? '',
			m: segs[1] ?? '',
			s: segs[2] ?? '',
		};
	});

	// 草稿态：半成品选择（compose 合不出完整值）存在这里，空状态逐步点选才不会丢；
	// 只有 value 被外部改动（bind/清除/外部赋值）时才由 parts 重置
	let draft = $state({ h: '', m: '', s: '' });

	$effect(() => {
		draft = { h: parts.h, m: parts.m, s: parts.s };
	});

	const hours = $derived.by(() => {
		// xxStep<=0 会让 length 变 Infinity，Array.from 直接 RangeError
		const hs = Number.isFinite(hourStep) && hourStep >= 1 ? Math.floor(hourStep) : 1;
		return Array.from({ length: Math.ceil(24 / hs) }, (_, i) => pad((i * hs) % 24));
	});
	const minutes = $derived.by(() => {
		const iv = Number.isFinite(minuteStep) && minuteStep >= 1 ? Math.floor(minuteStep) : 1;
		return Array.from({ length: Math.min(60, Math.floor(60 / iv)) }, (_, i) => pad(i * iv));
	});
	const secs = $derived.by(() => {
		const sv = Number.isFinite(secondStep) && secondStep >= 1 ? Math.floor(secondStep) : 1;
		return Array.from({ length: Math.min(60, Math.floor(60 / sv)) }, (_, i) => pad(i * sv));
	});

	function valid(): boolean {
		if (draft.h === '' || draft.m === '') return false;
		if (showSeconds && draft.s === '') return false;
		return true;
	}

	function compose(h: string, m: string, s: string): string {
		if (!h || !m) return '';
		if (showSeconds) return s ? `${h}:${m}:${s}` : '';
		return `${h}:${m}`;
	}

	function setPart(k: 'h' | 'm' | 's', v: string) {
		draft = { ...draft, [k]: v };
		const out = compose(draft.h, draft.m, draft.s);
		value = out;
		if (valid()) onchange?.(out);
	}

	// 原子写入：各列一次填齐 → 只写一次 value、只发一次 onchange（避免 showSeconds 模式发出中间态 HH:mm）
	function now() {
		const d = new Date();
		draft = { h: pad(d.getHours()), m: pad(d.getMinutes()), s: showSeconds ? pad(d.getSeconds()) : '' };
		const out = compose(draft.h, draft.m, draft.s);
		value = out;
		if (valid()) onchange?.(out);
		hide();
	}

	function show() {
		if (disabled) return;
		open = true;
		requestAnimationFrame(() => {
			if (!rootEl || !panelEl) return;
			const r = floatingPosition(rootEl.getBoundingClientRect(), {
				panelW: panelEl.offsetWidth,
				panelH: panelEl.offsetHeight,
				gap: 6,
			});
			flipUp = r.flipUp;
			panelStyle = r.style;
		});
	}
	function hide() {
		open = false;
	}
	function toggle() {
		open ? hide() : show();
	}

	function clear(e: MouseEvent) {
		e.stopPropagation();
		value = '';
		onchange?.('');
	}

	$effect(() => {
		if (!open) return;
		const onDocDown = (e: MouseEvent) => {
			if (rootEl && !rootEl.contains(e.target as Node)) hide();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				hide();
			}
		};
		document.addEventListener('mousedown', onDocDown);
		document.addEventListener('keydown', onKey, true);
		return () => {
			document.removeEventListener('mousedown', onDocDown);
			document.removeEventListener('keydown', onKey, true);
		};
	});
</script>

<div class="time-picker {cls}" bind:this={rootEl} style={style}>
	<button
		type="button"
		class="tp-trigger"
		class:open
		disabled={disabled}
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={toggle}
	>
		{#if value}
			<span class="tp-value">{value}</span>
		{:else}
			<span class="tp-placeholder">{placeholder}</span>
		{/if}
		<span class="tp-actions">
			{#if clearable && value && !disabled}
				<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_interactive_supports_focus -->
				<span class="tp-clear" role="button" aria-label="清除" tabindex="-1" onclick={clear}>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
				</span>
			{/if}
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
		</span>
	</button>

	{#if open}
		<div class="tp-panel" bind:this={panelEl} style={panelStyle} class:flip-up={flipUp} role="dialog" aria-label="选择时间">
			<div class="tp-columns">
				<div class="tp-col" role="listbox" aria-label="小时" bind:this={hColEl}>
					<PillTrack
						container={hColEl}
						itemSelector=".tp-opt"
						showSelected={false}
						hoverBackground="color-mix(in srgb, var(--primary) 15%, transparent)"
						radius="var(--radius-sm)"
					/>
					{#each hours as h (h)}
						<button type="button" class="tp-opt" class:active={draft.h === h} aria-pressed={draft.h === h} onclick={() => setPart('h', h)}>{h}</button>
					{/each}
				</div>
				<div class="tp-col" role="listbox" aria-label="分钟" bind:this={mColEl}>
					<PillTrack
						container={mColEl}
						itemSelector=".tp-opt"
						showSelected={false}
						hoverBackground="color-mix(in srgb, var(--primary) 15%, transparent)"
						radius="var(--radius-sm)"
					/>
					{#each minutes as m (m)}
						<button type="button" class="tp-opt" class:active={draft.m === m} aria-pressed={draft.m === m} onclick={() => setPart('m', m)}>{m}</button>
					{/each}
				</div>
				{#if showSeconds}
					<div class="tp-col" role="listbox" aria-label="秒" bind:this={sColEl}>
						<PillTrack
							container={sColEl}
							itemSelector=".tp-opt"
							showSelected={false}
							hoverBackground="color-mix(in srgb, var(--primary) 15%, transparent)"
							radius="var(--radius-sm)"
						/>
						{#each secs as s (s)}
							<button type="button" class="tp-opt" class:active={draft.s === s} aria-pressed={draft.s === s} onclick={() => setPart('s', s)}>{s}</button>
						{/each}
					</div>
				{/if}
			</div>
			<div class="tp-footer">
				<span class="tp-hint">{value || '未选择'}</span>
				<button type="button" class="tp-now" onclick={now}>现在</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.time-picker {
		position: relative;
		display: inline-block;
	}
	.tp-trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-md);
		min-width: 160px;
		padding: var(--sp-md) var(--sp-md) var(--sp-md) var(--sp-lg);
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		font-size: 13px;
		font-family: var(--font-mono);
		color: var(--text-strong);
		cursor: pointer;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.tp-trigger:hover:not(:disabled) {
		border-color: var(--primary);
	}
	.tp-trigger.open {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
	}
	.tp-trigger:disabled {
		opacity: 0.5;
		background: var(--surface-2);
		cursor: not-allowed;
	}
	.tp-trigger:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.tp-value {
		flex: 1;
		text-align: left;
	}
	.tp-placeholder {
		flex: 1;
		text-align: left;
		color: var(--text-muted);
		font-family: inherit;
	}
	.tp-actions {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-sm);
		color: var(--text-muted);
	}
	.tp-clear {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--surface-2);
		cursor: pointer;
	}
	.tp-clear:hover {
		background: var(--hover);
		color: var(--text-strong);
	}
	.tp-panel {
		position: fixed;
		z-index: var(--z-popover);
		max-width: calc(100vw - 16px);
		padding: var(--sp-md);
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px color-mix(in srgb, #000 12%, transparent);
	}
	.tp-columns {
		display: flex;
		gap: var(--sp-sm);
	}
	.tp-col {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 2px;
		height: 220px;
		overflow-y: auto;
		padding: 2px;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface-2);
	}
	.tp-opt {
		position: relative;
		min-width: 44px;
		padding: 5px 8px;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--text);
		font-family: var(--font-mono);
		font-size: 13px;
		cursor: pointer;
	}
	.tp-opt.active {
		background: var(--primary);
		color: var(--primary-text);
		font-weight: 600;
	}
	.tp-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: var(--sp-md);
		padding-top: var(--sp-md);
		border-top: 1px solid var(--border);
	}
	.tp-hint {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-muted);
	}
	.tp-now {
		border: none;
		background: none;
		color: var(--primary);
		font-size: 12px;
		cursor: pointer;
		padding: 2px var(--sp-sm);
		border-radius: var(--radius-sm);
	}
	.tp-now:hover {
		background: var(--primary-soft);
	}
</style>

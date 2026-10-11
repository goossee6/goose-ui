<script lang="ts">
	import RangeCalendar from './RangeCalendar.svelte';
	import { floatingPosition } from './floatingPosition';

	let {
		start = $bindable(''),
		end = $bindable(''),
		min = '',
		max = '',
		disabled = false,
		clearable = true,
		placeholder = '选择日期范围…',
		disabledDate,
		onchange,
		class: cls = '',
		style = '',
	}: {
		start?: string;
		end?: string;
		min?: string;
		max?: string;
		disabled?: boolean;
		clearable?: boolean;
		placeholder?: string;
		disabledDate?: (iso: string) => boolean;
		onchange?: (range: { start: string; end: string }) => void;
		class?: string;
		style?: string;
	} = $props();

	let rootEl = $state<HTMLElement | null>(null);
	let panelEl = $state<HTMLElement | null>(null);
	let panelStyle = $state('');
	let open = $state(false);
	let flipUp = $state(false);

	const label = $derived(start && end ? `${start} → ${end}` : '');

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

	function handle(range: { start: string; end: string }) {
		start = range.start;
		end = range.end;
		onchange?.(range);
		if (range.end) hide();
	}

	function clear(e: MouseEvent) {
		e.stopPropagation();
		start = '';
		end = '';
		onchange?.({ start: '', end: '' });
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

	function panelFade(node: HTMLElement, params: { up: boolean }) {
		return {
			duration: 120,
			css: (t: number) => {
				const y = params.up ? 4 : -4;
				return `opacity: ${t}; transform: translateY(${(1 - t) * y}px);`;
			},
		};
	}
</script>

<div class="drp {cls}" bind:this={rootEl} style={style}>
	<button
		type="button"
		class="drp-trigger"
		class:open
		disabled={disabled}
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={toggle}
	>
		{#if label}
			<span class="drp-value">{label}</span>
		{:else}
			<span class="drp-placeholder">{placeholder}</span>
		{/if}
		<span class="drp-actions">
			{#if clearable && label && !disabled}
				<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_interactive_supports_focus -->
				<span class="drp-clear" role="button" aria-label="清除" tabindex="-1" onclick={clear}>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
				</span>
			{/if}
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
		</span>
	</button>

	{#if open}
		<div class="drp-panel" bind:this={panelEl} style={panelStyle} class:flip-up={flipUp} transition:panelFade={{ up: flipUp }}>
			<RangeCalendar bind:start bind:end {min} {max} {disabledDate} onchange={handle} />
		</div>
	{/if}
</div>

<style>
	.drp {
		position: relative;
		display: inline-block;
	}
	.drp-trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-md);
		min-width: 240px;
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
	.drp-trigger:hover:not(:disabled) {
		border-color: var(--primary);
	}
	.drp-trigger.open {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
	}
	.drp-trigger:disabled {
		opacity: 0.5;
		background: var(--surface-2);
		cursor: not-allowed;
	}
	.drp-trigger:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.drp-value {
		flex: 1;
		text-align: left;
	}
	.drp-placeholder {
		flex: 1;
		text-align: left;
		color: var(--text-muted);
		font-family: inherit;
	}
	.drp-actions {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-sm);
		color: var(--text-muted);
	}
	.drp-clear {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--surface-2);
		color: var(--text-muted);
		cursor: pointer;
	}
	.drp-clear:hover {
		background: var(--hover);
		color: var(--text-strong);
	}
	.drp-panel {
		position: fixed;
		z-index: var(--z-popover);
		min-width: 340px;
		max-width: calc(100vw - 16px);
	}
</style>

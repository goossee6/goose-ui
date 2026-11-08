<script lang="ts">
	import RangeCalendar from './RangeCalendar.svelte';
	import { floatingPosition } from './floatingPosition';
	import { menuIn, menuOut } from './menuTransition';

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
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
		</span>
	</button>

	<!-- 清除按钮必须是触发器的兄弟节点：<button> 不能是 <button> 的后代（SSR 会 hydration mismatch）。
	     用绝对定位叠在日历图标位上。 -->
	{#if clearable && label && !disabled}
		<button type="button" class="drp-clear" aria-label="清除" onclick={clear}>
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
		</button>
	{/if}

	{#if open}
		<div
			class="drp-panel"
			bind:this={panelEl}
			style={panelStyle}
			class:flip-up={flipUp}
			in:menuIn={{ up: flipUp }}
			out:menuOut={{ up: flipUp }}
		>
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
		/* 定高：空状态渲染的是 CJK 占位文案，回退字体的行高比等宽数字大，
		   靠 padding 撑高会让空/非空状态差 1~3px（矮的那个还会跟 Input 对不齐）。
		   锁死高度并显式给 line-height，行盒就不再受字体度量影响 */
		height: var(--height-md);
		line-height: 1.2;
		padding: 0 var(--sp-md) 0 var(--sp-lg);
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		font-size: var(--fs-13);
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
		box-shadow: 0 0 0 3px var(--accent-ring);
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
		min-width: 0;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.drp-placeholder {
		flex: 1;
		min-width: 0;
		text-align: left;
		color: var(--text-muted);
		font-family: inherit;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.drp-actions {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-sm);
		color: var(--text-muted);
	}
	.drp-clear {
		position: absolute;
		top: 50%;
		right: var(--sp-md);
		transform: translateY(-50%);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: var(--surface-2);
		color: var(--text-muted);
		cursor: pointer;
	}
	.drp-clear:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 1px;
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
	/* 阴影必须挂在日历本体上，不能挂 .drp-panel：面板 min-width 340 比日历的 280 宽，
	   挂在外层会露出一截 60px 宽的方形投影。 */
	.drp-panel :global(.range-calendar) {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
	}
</style>

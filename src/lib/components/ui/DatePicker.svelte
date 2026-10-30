<script lang="ts">
	import Calendar from './Calendar.svelte';
	import { floatingPosition } from './floatingPosition';
	import { menuIn, menuOut } from './menuTransition';

	let {
		value = $bindable(''),
		min = '',
		max = '',
		disabled = false,
		clearable = true,
		placeholder = '选择日期…',
		disabledDate,
		onchange,
		class: cls = '',
		style = '',
	}: {
		value?: string;
		min?: string;
		max?: string;
		disabled?: boolean;
		clearable?: boolean;
		placeholder?: string;
		disabledDate?: (iso: string) => boolean;
		onchange?: (value: string) => void;
		class?: string;
		style?: string;
	} = $props();

	let rootEl = $state<HTMLElement | null>(null);
	let panelEl = $state<HTMLElement | null>(null);
	let panelStyle = $state('');
	let open = $state(false);
	let flipUp = $state(false);

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

	function handle(v: string) {
		value = v;
		onchange?.(v);
		if (v) hide();
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
				// capture 拦截，阻止冒泡到外层 Modal 的 Esc 监听（只关本层）
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

<div class="date-picker {cls}" bind:this={rootEl} style={style}>
	<button
		type="button"
		class="dp-trigger"
		class:open
		disabled={disabled}
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={toggle}
	>
		{#if value}
			<span class="dp-value">{value}</span>
		{:else}
			<span class="dp-placeholder">{placeholder}</span>
		{/if}
		<span class="dp-actions">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
		</span>
	</button>

	<!-- 清除按钮必须是触发器的兄弟节点：<button> 不能是 <button> 的后代（SSR 会 hydration mismatch）。
	     用绝对定位叠在日历图标位上。 -->
	{#if clearable && value && !disabled}
		<button type="button" class="dp-clear" aria-label="清除" onclick={clear}>
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
		</button>
	{/if}

	{#if open}
		<div
			class="dp-panel"
			bind:this={panelEl}
			style={panelStyle}
			class:flip-up={flipUp}
			in:menuIn={{ up: flipUp }}
			out:menuOut={{ up: flipUp }}
		>
			<Calendar bind:value {min} {max} {disabledDate} onchange={handle} />
		</div>
	{/if}
</div>

<style>
	.date-picker {
		position: relative;
		display: inline-block;
	}
	.dp-trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-md);
		min-width: 180px;
		/* 定高：空状态渲染的是 CJK 占位文案，回退字体的行高比等宽数字大，
		   靠 padding 撑高会让空/非空状态差 1~3px（矮的那个还会跟 Input 对不齐）。
		   锁死高度并显式给 line-height，行盒就不再受字体度量影响 */
		height: var(--height-md);
		line-height: 1.2;
		padding: 0 var(--sp-md) 0 var(--sp-lg);
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		font-size: 13px;
		font-family: var(--font-mono);
		color: var(--text-strong);
		cursor: pointer;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.dp-trigger:hover:not(:disabled) {
		border-color: var(--primary);
	}
	.dp-trigger.open {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px var(--accent-ring);
	}
	.dp-trigger:disabled {
		opacity: 0.5;
		background: var(--surface-2);
		cursor: not-allowed;
	}
	.dp-trigger:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.dp-value {
		flex: 1;
		min-width: 0;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.dp-placeholder {
		flex: 1;
		min-width: 0;
		text-align: left;
		color: var(--text-muted);
		font-family: inherit;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.dp-actions {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-sm);
		color: var(--text-muted);
	}
	.dp-clear {
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
	.dp-clear:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 1px;
	}
	.dp-clear:hover {
		background: var(--hover);
		color: var(--text-strong);
	}
	.dp-panel {
		position: fixed;
		z-index: var(--z-popover);
		min-width: 280px;
		max-width: calc(100vw - 16px);
	}
	/* 面板底色/边框由 Calendar 自己给（它也能当静态卡片用，所以阴影不写在组件里）。
	   浮起来这一层才补阴影，与 Select / Combobox 的浮层同一个值。
	   选择器落不到子组件根节点上，最后一段必须 :global。 */
	.dp-panel :global(.calendar) {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
	}
</style>

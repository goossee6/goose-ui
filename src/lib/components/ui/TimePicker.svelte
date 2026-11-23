<script lang="ts">
	import { pad2, indexFloor, indexNearest, joinTrimmed, timeColumns } from './dateParts';
	import { menuIn, menuOut } from './menuTransition';
	import { createPickerPanel } from './pickerPanel.svelte';
	import Button from './Button.svelte';
	import PickerFooter from './PickerFooter.svelte';
	import TimeField from './TimeField.svelte';
	import TimeWheelPanel from './TimeWheelPanel.svelte';

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
		/** 小时列步长；可选值只有网格上的档位，「现在」会向下对齐到最近档 */
		hourStep?: number;
		/** 分钟列步长；网格外的外部值滚轮就近停靠，提交仍以输入框为准 */
		minuteStep?: number;
		/** 秒列步长 */
		secondStep?: number;
		onchange?: (value: string) => void;
		class?: string;
		style?: string;
	} = $props();

	/** 打开时重置草稿：取消过的半成品不该在下次打开时还留着 */
	const panel = createPickerPanel({
		onOpen: () => (draft = { h: parts.h, m: parts.m, s: parts.s }),
	});

	function onTrigger() {
		if (disabled) return;
		panel.toggle();
	}

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

	/** 步长兜底：<=0 会让 length 变 Infinity，Array.from 直接 RangeError */
	const stepOf = (v: number) => (Number.isFinite(v) && v >= 1 ? Math.floor(v) : 1);
	const hStep = $derived(stepOf(hourStep));
	const mStep = $derived(stepOf(minuteStep));
	const sStep = $derived(stepOf(secondStep));

	/** 三列档位；「现在」对齐步长也用这份，避免列里有什么和 now() 算的对不上 */
	const columns = $derived(timeColumns([hStep, mStep, sStep], showSeconds));

	/** 面板顶部那行分段输入显示什么：padding 会打断逐位键入，所以只拼已填的段，不补零（见 joinTrimmed） */
	const draftText = $derived(joinTrimmed(showSeconds ? [draft.h, draft.m, draft.s] : [draft.h, draft.m]));

	/** 哪一列正在编辑：点顶部的时 / 分 / 秒，或滚轮停稳后跟着走 */
	let focusCol = $state(0);

	function onFieldChange(v: string) {
		const [h = '', m = '', s = ''] = v.split(':');
		draft = { h, m, s: showSeconds ? s : '' };
	}

	function valid(): boolean {
		if (draft.h === '' || draft.m === '') return false;
		if (showSeconds && draft.s === '') return false;
		return true;
	}

	/** 提交用：手敲的 `3` 在这里补成 `03`，输出恒为 HH:mm(:ss) */
	function compose(h: string, m: string, s: string): string {
		if (!h || !m) return '';
		const hh = pad2(h);
		const mm = pad2(m);
		if (showSeconds) {
			const ss = pad2(s);
			return ss ? `${hh}:${mm}:${ss}` : '';
		}
		return `${hh}:${mm}`;
	}

	// 轮盘停稳：只更新草稿，等「确认」才写回 value（「取消」直接丢弃）
	function onSettle(col: 'h' | 'm' | 's', v: string) {
		focusCol = col === 'h' ? 0 : col === 'm' ? 1 : 2;
		const next = { ...draft, [col]: v };
		// 空档从当前列的实际停靠档补齐（打开空值时其他列停在首档）
		if (next.h === '') next.h = columns[0][indexNearest(columns[0], draft.h)];
		if (next.m === '') next.m = columns[1][indexNearest(columns[1], draft.m)];
		if (showSeconds && next.s === '') next.s = columns[2][indexNearest(columns[2], draft.s)];
		draft = next;
	}

	// 原子写入：各列一次填齐，确认时只写一次 value、只发一次 onchange（避免 showSeconds 模式发出中间态 HH:mm）
	function now() {
		const d = new Date();
		// 按各列的步长向下对齐：直接塞 18 进 5 步长的列会落空，滚轮只能停在最近格上
		draft = {
			h: columns[0][indexFloor(columns[0], String(d.getHours()))],
			m: columns[1][indexFloor(columns[1], String(d.getMinutes()))],
			s: showSeconds ? columns[2][indexFloor(columns[2], String(d.getSeconds()))] : '',
		};
	}

	function confirm() {
		// 半成品（缺分/秒）不提交，避免把已有值清成空串
		if (valid()) {
			const out = compose(draft.h, draft.m, draft.s);
			if (out !== value) {
				value = out;
				onchange?.(out);
			}
		}
		panel.hide();
	}

	function clear(e: MouseEvent) {
		e.stopPropagation();
		value = '';
		onchange?.('');
	}
</script>

<div class="time-picker {cls}" bind:this={panel.rootEl} style={style}>
	<button
		type="button"
		class="tp-trigger"
		class:open={panel.open}
		{disabled}
		aria-haspopup="dialog"
		aria-expanded={panel.open}
		onclick={onTrigger}
	>
		{#if value}
			<span class="tp-value">{value}</span>
		{:else}
			<span class="tp-placeholder">{placeholder}</span>
		{/if}
		<span class="tp-actions">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
		</span>
	</button>

	<!-- 清除按钮必须是触发器的兄弟节点：<button> 不能是 <button> 的后代（SSR 会 hydration mismatch）。
	     用绝对定位叠在时钟图标位上，视觉与原来一致。 -->
	{#if clearable && value && !disabled}
		<button type="button" class="tp-clear" aria-label="清除" onclick={clear}>
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
		</button>
	{/if}

	{#if panel.open}
		<div
			class="tp-panel"
			bind:this={panel.panelEl}
			style={panel.panelStyle}
			class:flip-up={panel.flipUp}
			role="dialog"
			aria-label="选择时间"
			in:menuIn={{ up: panel.flipUp }}
			out:menuOut={{ up: panel.flipUp }}
		>
			<div class="tp-field">
				<TimeField
					value={draftText}
					seconds={showSeconds}
					{disabled}
					ariaLabel="时间"
					onsegmentfocus={(i) => (focusCol = i)}
					onchange={onFieldChange}
				/>
			</div>
			<TimeWheelPanel
				time={draftText}
				seconds={showSeconds}
				steps={[hStep, mStep, sStep]}
				{focusCol}
				onselect={(i, v) => onSettle((['h', 'm', 's'] as const)[i], v)}
			/>
			<PickerFooter {disabled} oncancel={panel.hide} onconfirm={confirm}>
				{#snippet leading()}
					<Button variant="text-primary" size="xs" {disabled} onclick={now}>现在</Button>
				{/snippet}
			</PickerFooter>
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
	.tp-trigger:hover:not(:disabled) {
		border-color: var(--primary);
	}
	.tp-trigger.open {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px var(--accent-ring);
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
		min-width: 0;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.tp-placeholder {
		flex: 1;
		min-width: 0;
		text-align: left;
		color: var(--text-muted);
		font-family: inherit;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.tp-actions {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-sm);
		color: var(--text-muted);
	}
	.tp-clear {
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
		cursor: pointer;
	}
	.tp-clear:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 1px;
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
		/* 浮层底色：亮色比页面更白、暗色比页面更黑（--surface 在暗色下反而比页面浅） */
		background: var(--popup-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
	}
	.tp-field {
		margin-bottom: var(--sp-sm);
	}
	.tp-field :global(.time-field) {
		display: block;
	}
	.tp-field :global(.segment-field) {
		width: 100%;
		box-sizing: border-box;
		justify-content: center;
	}
</style>

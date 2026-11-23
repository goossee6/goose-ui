<script lang="ts">
	import RangeCalendar from './RangeCalendar.svelte';
	import DateField from './DateField.svelte';
	import TimeField from './TimeField.svelte';
	import TimeWheelPanel from './TimeWheelPanel.svelte';
	import Button from './Button.svelte';
	import PickerFooter from './PickerFooter.svelte';
	import PillTrack from './PillTrack.svelte';
	import { normalizeTime } from './dateParts';
	import { menuIn, menuOut } from './menuTransition';
	import { createPickerPanel } from './pickerPanel.svelte';
	import {
		RANGE_PRESETS,
		joinDateTime,
		orderRange,
		presetDates,
		splitDateTime,
		type RangePresetId,
	} from './datetimeRange';

	type RangeValidator = (range: { start: string; end: string }) => string | boolean | null | void;

	let {
		start = $bindable(''),
		end = $bindable(''),
		min = '',
		max = '',
		disabled = false,
		disabledDate,
		weekStart = 1,
		placeholder = '选择时间范围…',
		validate,
		oninvalid,
		onchange,
		class: cls = '',
		style = '',
	}: {
		start?: string;
		end?: string;
		min?: string;
		max?: string;
		disabled?: boolean;
		disabledDate?: (iso: string) => boolean;
		weekStart?: 0 | 1;
		placeholder?: string;
		/** 区间校验：返回错误文案即不接受，两端回到改动前的值 */
		validate?: RangeValidator;
		oninvalid?: (msg: string) => void;
		onchange?: (range: { start: string; end: string }) => void;
		class?: string;
		style?: string;
	} = $props();


	let presetsEl = $state<HTMLElement | null>(null);
	let timeSide = $state<'start' | 'end' | null>(null);
	let timeUp = $state(false);
	let timeEl = $state<HTMLElement | null>(null);
	/** 时间正在编辑哪一段（0 时 / 1 分 / 2 秒）：点输入框就定位，滚轮停稳也跟着走 */
	let focusSeg = $state(0);
	/** 两行时间字段的宿主，用来判断滚轮浮层朝上还是朝下 */
	let startFieldEl = $state<HTMLElement | null>(null);
	let endFieldEl = $state<HTMLElement | null>(null);
	let errMsg = $state('');
	/** 面板打开时定住「今天」，跨午夜时预设与 active 判断不会前后不一致 */
	let today = $state(new Date());
	/** 草稿区间：面板内所有选择先落这里，点「确认」才写回 start/end */
	let dStart = $state('');
	let dEnd = $state('');
	/** 时间浮层自己的草稿：滚轮和键入只改它，点浮层的「确认」才落到上面的区间草稿 */
	let tmpT = $state('');

	const draftStart = $derived(splitDateTime(dStart));
	const draftEnd = $derived(splitDateTime(dEnd));
	const startT = $derived(draftStart.time || '00:00:00');
	const endT = $derived(draftEnd.time || '23:59:59');
	/** 浮层开着时输入框显示浮层草稿，否则显示区间草稿 —— 滚轮和上面的数字必须是同一份 */
	const startShown = $derived(timeSide === 'start' && tmpT ? tmpT : startT);
	const endShown = $derived(timeSide === 'end' && tmpT ? tmpT : endT);
	const label = $derived(start && end ? `${start} → ${end}` : '');

	const activePreset = $derived(
		RANGE_PRESETS.find((p) => {
			const r = presetDates(p.id, today);
			return dStart === joinDateTime(r.start, '00:00:00') && dEnd === joinDateTime(r.end, '23:59:59');
		})?.id ?? ''
	);

	function checkRange(range: { start: string; end: string }): string | null {
		if (!validate) return null;
		try {
			const r = validate(range);
			if (r === false) return '范围不合法';
			return typeof r === 'string' && r ? r : null;
		} catch {
			return '校验失败';
		}
	}

	/** 键入中的时间可能是 `12:3`，比较前补零，否则字典序会把 `12:3` 排在 `12:05` 之后 */
	function padRange(v: string): string {
		const { date, time } = splitDateTime(v);
		return date ? joinDateTime(date, normalizeTime(time)) : '';
	}

	/**
	 * 草稿唯一的写入口：排序 → 校验 → 不接受就原样返回。
	 * `raw` 用于「手敲时间」的中间态：此时 `12:3` 还没补零，排序会把两端互换、
	 * 自定义校验也会把半成品判成非法，所以先照抄，等确认时再统一 pad + orderRange。
	 */
	function write(nextStart: string, nextEnd: string, raw = false) {
		const r = raw ? { start: nextStart, end: nextEnd } : orderRange(nextStart, nextEnd);
		if (!raw) {
			const msg = checkRange(r);
			if (msg) {
				errMsg = msg;
				oninvalid?.(msg);
				return;
			}
		}
		errMsg = '';
		dStart = r.start;
		dEnd = r.end;
		// 日期被清空后时间没有落点（字段会转禁用），顺手收起对应的滚轮浮层
		if (timeSide === 'start' && !splitDateTime(dStart).date) timeSide = null;
		else if (timeSide === 'end' && !splitDateTime(dEnd).date) timeSide = null;
	}

	function confirm() {
		const r = orderRange(padRange(dStart), padRange(dEnd));
		// 手敲的中间态没走校验，确认时补一次；不合法就留在面板里改
		const msg = checkRange(r);
		if (msg) {
			errMsg = msg;
			oninvalid?.(msg);
			return;
		}
		if (r.start !== start || r.end !== end) {
			start = r.start;
			end = r.end;
			onchange?.({ start, end });
		}
		panel.hide();
	}

	function clear() {
		errMsg = '';
		dStart = '';
		dEnd = '';
	}

	function setSide(side: 'start' | 'end', value: string, raw = false) {
		if (side === 'start') write(value, dEnd, raw);
		else write(dStart, value, raw);
	}

	function onCalendar(r: { start: string; end: string }) {
		write(r.start ? joinDateTime(r.start, startT) : '', r.end ? joinDateTime(r.end, endT) : '');
	}

	function applyPreset(id: RangePresetId) {
		const r = presetDates(id, today);
		write(joinDateTime(r.start, '00:00:00'), joinDateTime(r.end, '23:59:59'));
	}

	/** 滚轮改一列：只动浮层草稿，其余两列保持，等浮层的「确认」才写回区间 */
	// 浮层高度随内容变（有无秒列、footer 一行），用实测高度决定向下还是向上展开。
	// 别改回「估算 244px」：之前就是估的值，footer 一加高就不再准。
	$effect(() => {
		if (!timeSide) return;
		const field = timeSide === 'start' ? startFieldEl : endFieldEl;
		if (!field || !timeEl) return;
		timeUp = field.getBoundingClientRect().bottom + 4 + timeEl.offsetHeight > window.innerHeight;
	});

	function setTimePart(i: number, value: string) {
		if (!timeSide) return;
		focusSeg = i;
		const parts = normalizeTime(tmpT || (timeSide === 'start' ? startT : endT)).split(':');
		parts[i] = value;
		tmpT = parts.join(':');
	}

	/** 浮层里的键入：同样只改草稿；浮层没开时（直接点字段敲）沿用原来的即时写入 */
	function onTimeType(side: 'start' | 'end', v: string) {
		if (timeSide === side) tmpT = v;
		else setSide(side, joinDateTime(splitDateTime(side === 'start' ? dStart : dEnd).date, v), true);
	}

	/** 浮层「确认」：把草稿落到区间草稿上；校验不过就留在浮层里继续改 */
	function applyTime() {
		if (!timeSide) return;
		const side = timeSide;
		const date = splitDateTime(side === 'start' ? dStart : dEnd).date;
		if (date && tmpT) {
			setSide(side, joinDateTime(date, normalizeTime(tmpT)));
			if (errMsg) return;
		}
		timeSide = null;
	}

	/** 浮层「取消」/ Esc / 点外部：丢掉草稿，字段回到区间草稿里的时间 */
	function cancelTime() {
		timeSide = null;
	}

	const panel = createPickerPanel({
		// 面板两侧都放不下时，选空间更大的一侧（日历比视口还高的极端情况）
		flip: 'space',
		onOpen: () => {
			today = new Date();
			dStart = start;
			dEnd = end;
			errMsg = '';
		},
		onClose: () => {
			timeSide = null;
			errMsg = '';
		},
		// Esc 只收一层：时间浮层开着就收它，否则交给面板
		onEscape: () => {
			if (!timeSide) return false;
			timeSide = null;
			return true;
		},
	});

	function onTrigger() {
		if (disabled) return;
		panel.toggle();
	}

	/**
	 * 点时间字段的某一段：这一段立刻可键入（SegmentField 自己处理），
	 * 同时把滚轮浮层打开并定位到该列，两种输入方式并行。
	 */
	function focusTime(side: 'start' | 'end', seg: number) {
		if (disabled) return;
		focusSeg = seg;
		const cur = side === 'start' ? dStart : dEnd;
		// 日期还没填：没有地方落时间，字段本身也是禁用态，不弹
		if (!splitDateTime(cur).date) return;
		if (timeSide === side) return;
		// 换到另一侧：上一侧没确认的改动一并丢弃（与「取消」同义）
		tmpT = side === 'start' ? startT : endT;
		timeSide = side;
	}

	// 面板级的关闭交给 createPickerPanel；这里只管「点面板内其它地方时收掉时间浮层」
	$effect(() => {
		if (!panel.open) return;
		const onDown = (e: MouseEvent) => {
			const target = e.target as Element;
			if (timeSide && !target.closest('.dtr-time, .dtr-time-field')) timeSide = null;
		};
		document.addEventListener('mousedown', onDown);
		return () => document.removeEventListener('mousedown', onDown);
	});
</script>

{#snippet wheelCols(time: string)}
	<TimeWheelPanel time={time} focusCol={focusSeg} align="center" onselect={setTimePart} />
{/snippet}

{#snippet calIcon()}
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
{/snippet}

{#snippet watchIcon()}
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="8" /><path d="M12 14l3-3" /><path d="M9 2h6M12 2v3" /></svg>
{/snippet}

<div class="dtr {cls}" bind:this={panel.rootEl} style={style}>
	<button
		type="button"
		class="dtr-trigger"
		class:open={panel.open}
		class:invalid={!!errMsg}
		{disabled}
		aria-haspopup="dialog"
		aria-expanded={panel.open}
		title={errMsg || undefined}
		onclick={onTrigger}
	>
		{#if label}
			<span class="dtr-value">{label}</span>
		{:else}
			<span class="dtr-placeholder">{placeholder}</span>
		{/if}
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
	</button>

	{#if panel.open}
		<div
			class="dtr-panel"
			bind:this={panel.panelEl}
			style={panel.panelStyle}
			class:flip-up={panel.flipUp}
			role="dialog"
			aria-label="选择时间范围"
			in:menuIn={{ up: panel.flipUp }}
			out:menuOut={{ up: panel.flipUp }}
		>
			<div class="dtr-body">
				<div class="dtr-presets" role="group" aria-label="快捷选择" bind:this={presetsEl}>
					<PillTrack
						container={presetsEl}
						itemSelector=".dtr-preset"
						activeSelector=".dtr-preset.active"
						{disabled}
						background="var(--primary-soft)"
						hoverBackground="var(--hover)"
						radius="var(--radius-sm)"
					/>
					{#each RANGE_PRESETS as p (p.id)}
						<button
							type="button"
							class="dtr-preset"
							class:active={activePreset === p.id}
							aria-pressed={activePreset === p.id}
							{disabled}
							onclick={() => applyPreset(p.id)}
						>
							{p.label}
						</button>
					{/each}
				</div>

				<div class="dtr-main">
					<div class="dtr-row">
						<DateField
							value={draftStart.date}
							ariaLabel="开始日期"
							{disabled}
							leading={calIcon}
							onchange={(v) => setSide('start', joinDateTime(v, startT), true)}
						/>
						<div class="dtr-time-field" class:open={timeSide === 'start'} bind:this={startFieldEl}>
							<TimeField
								value={startShown}
								seconds
								disabled={disabled || !draftStart.date}
								ariaLabel="开始时间"
								leading={watchIcon}
								onsegmentfocus={(i) => focusTime('start', i)}
								onchange={(v) => onTimeType('start', v)}
							/>
						</div>
						{#if timeSide === 'start'}
							<div
								class="dtr-time"
								class:up={timeUp}
								bind:this={timeEl}
								role="dialog"
								aria-label="选择开始时间"
								in:menuIn={{ distance: 4, scale: 1 }}
								out:menuOut
							>
								{@render wheelCols(tmpT || startT)}
								<PickerFooter {disabled} oncancel={cancelTime} onconfirm={applyTime} />
							</div>
						{/if}
					</div>

					<div class="dtr-arrow" aria-hidden="true">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
					</div>

					<div class="dtr-row">
						<DateField
							value={draftEnd.date}
							ariaLabel="结束日期"
							{disabled}
							leading={calIcon}
							onchange={(v) => setSide('end', joinDateTime(v, endT), true)}
						/>
						<div class="dtr-time-field" class:open={timeSide === 'end'} bind:this={endFieldEl}>
							<TimeField
								value={endShown}
								seconds
								disabled={disabled || !draftEnd.date}
								ariaLabel="结束时间"
								leading={watchIcon}
								onsegmentfocus={(i) => focusTime('end', i)}
								onchange={(v) => onTimeType('end', v)}
							/>
						</div>
						{#if timeSide === 'end'}
							<div
								class="dtr-time"
								class:up={timeUp}
								bind:this={timeEl}
								role="dialog"
								aria-label="选择结束时间"
								in:menuIn={{ distance: 4, scale: 1 }}
								out:menuOut
							>
								{@render wheelCols(tmpT || endT)}
								<PickerFooter {disabled} oncancel={cancelTime} onconfirm={applyTime} />
							</div>
						{/if}
					</div>

					<RangeCalendar
						start={draftStart.date}
						end={draftEnd.date}
						{min}
						{max}
						{disabled}
						{disabledDate}
						{weekStart}
						view={draftStart.date.slice(0, 7)}
						onchange={onCalendar}
					/>
				</div>
			</div>

			<PickerFooter {disabled} oncancel={panel.hide} onconfirm={confirm}>
				{#snippet leading()}
					<Button variant="text-primary" size="xs" {disabled} onclick={clear}>清除</Button>
				{/snippet}
			</PickerFooter>
		</div>
	{/if}
</div>

<style>
	.dtr {
		position: relative;
		display: inline-block;
	}
	.dtr-trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-md);
		min-width: 300px;
		max-width: 100%;
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
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}
	.dtr-trigger:hover:not(:disabled) {
		border-color: var(--primary);
	}
	.dtr-trigger.open {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px var(--accent-ring);
	}
	.dtr-trigger.invalid {
		border-color: var(--danger-text);
	}
	.dtr-trigger:disabled {
		opacity: 0.5;
		background: var(--surface-2);
		cursor: not-allowed;
	}
	.dtr-trigger:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.dtr-value {
		flex: 1;
		min-width: 0;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.dtr-placeholder {
		flex: 1;
		min-width: 0;
		text-align: left;
		color: var(--text-muted);
		font-family: inherit;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.dtr-panel {
		position: fixed;
		z-index: var(--z-popover);
		display: flex;
		flex-direction: column;
		/* 内容本身就有四块，视口 900 左右时 16px 内边距会把面板顶出 max-height、逼出滚动，
		   收一档到 12px：视觉上仍与浮层留白一致，常见视口下日历能整块显示 */
		padding: var(--space-3);
		max-width: calc(100vw - 16px);
		/* 视口矮时 floatingPosition 会写 max-height：内容区自己滚，
		   底部「取消 / 确认」常驻，不遮日历也不被滚出面板 */
		overflow: hidden;
		background: var(--popup-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
	}
	.dtr-body {
		display: flex;
		align-items: flex-start;
		gap: var(--sp-lg);
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		/* 滚动条会吃掉 8~15px 宽，把 280 的日历挤出面板；
		   这里只留滚轮/触控板滚动，不占宽度 */
		scrollbar-width: none;
	}
	.dtr-body::-webkit-scrollbar {
		width: 0;
		height: 0;
	}
	.dtr-panel > :global(.picker-footer) {
		flex: 0 0 auto;
		margin-top: var(--sp-sm);
		padding-top: var(--sp-sm);
		background: var(--popup-surface);
	}
	.dtr-presets {
		position: relative;
		/* 本地层叠上下文：pill 用 z-index:-1 沉到文字下面当底色，
		   离开它就会沉到面板背景之后（整块看不见） */
		isolation: isolate;
		display: flex;
		flex-direction: column;
		/* 7 个按钮紧挨着排，不再拉伸铺满整列高度 */
		gap: 0;
		width: 92px;
		flex-shrink: 0;
		padding-right: var(--sp-md);
		border-right: 1px solid var(--border);
	}
	.dtr-presets :global(.pill-track) {
		z-index: -1;
	}
	.dtr-preset {
		position: relative;
		height: 30px;
		padding: 0 var(--sp-md);
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--text);
		font-size: var(--fs-12);
		text-align: left;
		cursor: pointer;
	}
	/* 底色交给滑动 pill（hover 块 / 选中块），按钮自身透明才看得见它 */
	.dtr-preset:hover:not(:disabled) {
		color: var(--text-strong);
	}
	.dtr-preset.active {
		color: var(--primary);
		font-weight: 600;
	}
	.dtr-preset:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: -2px;
	}
	.dtr-main {
		display: flex;
		flex-direction: column;
		gap: var(--space-0-5);
		width: 280px;
		flex-shrink: 0;
	}
	/* 日历本体的边框与底色交给面板，避免卡片里再套一张卡片 */
	.dtr-main :global(.range-calendar) {
		padding: 0;
		background: none;
		border: none;
	}
	/* 两行「日期 + 时间」撑满右列宽：两框各占一半（等宽），视觉上左右对称。
	   用 grid 的 1fr 而不是 flex 的 flex:1 —— flex-basis:0 在 border-box 下仍按
	   内容盒起算，带 padding/border 的按钮会比日期框宽出 10px（实测 133 / 143）。 */
	.dtr-row {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		align-items: center;
		gap: var(--sp-sm);
		width: 100%;
	}
	.dtr-row > :global(.date-field) {
		min-width: 0;
		height: var(--height-md);
	}
	.dtr-row > :global(.date-field) :global(.segment-field) {
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		/* 框内是「图标 + 年-月-日」，整体居中而不是贴左：两行左右两列的视觉重心才对得齐 */
		justify-content: center;
	}
	.dtr-arrow {
		display: flex;
		justify-content: center;
		color: var(--text-muted);
	}
	/* 时间字段的宿主：占满格子，同时作为滚轮浮层的定位锚点 */
	.dtr-time-field {
		min-width: 0;
		height: var(--height-md);
	}
	.dtr-time-field :global(.time-field) {
		display: block;
		width: 100%;
		height: 100%;
	}
	.dtr-time-field :global(.segment-field) {
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		/* 与日期框一致：图标 + 时分秒整体居中 */
		justify-content: center;
		padding: 0 var(--sp-sm);
	}
	.dtr-time {
		position: absolute;
		top: calc(100% + var(--space-1));
		/* 对齐右侧的时间字段，而不是压住左边的日期框 */
		right: 0;
		z-index: 2;
		/* 定宽：三列滚轮 + footer 两个按钮，宽度交给内容撑会随字体漂 */
		width: 240px;
		box-sizing: border-box;
		padding: var(--sp-md);
		background: var(--popup-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
	}
	.dtr-time.up {
		top: auto;
		bottom: calc(100% + var(--space-1));
	}
	/* 浮层比面板矮一档，footer 的上下留白跟着收一点，别让按钮离滚轮太远 */
	.dtr-time :global(.picker-footer) {
		margin-top: var(--sp-sm);
		padding-top: var(--sp-sm);
	}
</style>

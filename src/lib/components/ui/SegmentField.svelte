<script lang="ts">
	import type { Snippet } from 'svelte';
	import PillTrack from './PillTrack.svelte';
	import { checkField, type FieldValidator } from './fieldValidation';
	import { cellValues, isLegal, isOutOfRange, normalizeCells, pasteCells } from './segmentCells';

	let {
		widths = [],
		value = $bindable<string[]>([]),
		separator = '-',
		numeric = true,
		placeholders = [],
		ranges = [],
		disabled = false,
		leading,
		class: cls = '',
		style = '',
		onchange,
		onsegmentfocus,
		validate,
		oninvalid,
	}: {
		widths?: number[];
		value?: string[];
		separator?: string;
		numeric?: boolean;
		placeholders?: string[];
		/** 每段的合法数值区间（含端点），缺省按位数取 [0, 10^n - 1]；日期字段用它传「日 ≤ 当月天数」这类结论 */
		ranges?: ([number, number] | undefined)[];
		disabled?: boolean;
		/** 段左侧的前置图标（日历 / 秒表），与输入段同处一个边框内 */
		leading?: Snippet;
		class?: string;
		style?: string;
		onchange?: (value: string[]) => void;
		/** 某一格拿到焦点（含格间自动跳转）；父级用它把滚轮 / 日历联动到这一段 */
		onsegmentfocus?: (index: number) => void;
		/** 离开字段时校验整串：返回错误文案即不接受，值回滚到本次编辑前 */
		validate?: FieldValidator;
		oninvalid?: (msg: string) => void;
	} = $props();

	let inputs = $state<HTMLInputElement[]>([]);
	let fieldEl = $state<HTMLElement | null>(null);
	let errMsg = $state('');
	/** 进入字段时的快照，越界或不合法就回到这里 */
	let goodCells = $state<string[]>([]);

	/**
	 * 聚焦即全选：每格只有 2~4 个字符，全选后直接敲数字就是整段覆盖，不用先退格。
	 * - 键盘聚焦（Tab / 自动跳格 / 退格回跳）：focus 里 select() 就够。
	 * - 鼠标首次点进来：focus 之后浏览器还会按点击位置再落一次光标，选区会被打掉，
	 *   所以在同一次 mouseup 里拦掉默认收起；已聚焦的再次点击不拦，
	 *   否则没法点选光标、也没法双击选词。
	 */
	let focusByPointer = false;

	function handlePointerDown(e: PointerEvent) {
		focusByPointer = document.activeElement !== e.currentTarget;
	}

	function handleFocus(i: number, e: FocusEvent) {
		const from = e.relatedTarget as Node | null;
		// 只有从字段外进来才重新快照；格间跳转（年 → 月）不覆盖，否则刚打的年会被当成「原值」
		if (!from || !fieldEl?.contains(from)) goodCells = cells.slice();
		(e.currentTarget as HTMLInputElement).select();
		onsegmentfocus?.(i);
	}

	function handleMouseUp(e: MouseEvent) {
		if (!focusByPointer) return;
		focusByPointer = false;
		e.preventDefault();
	}

	/** 段配置：取值运算全在 segmentCells.ts，组件只管 DOM 与焦点 */
	const spec = $derived({ widths, ranges, numeric });

	const cells = $derived(cellValues(widths, value));

	/** 写入一段；越界当场拒绝，该段回到进入字段时的值，返回最终落到状态里的文本 */
	function setCell(i: number, ch: string): string {
		const arr = cells.slice();
		arr[i] = isLegal(spec, i, ch) ? ch : (goodCells[i] ?? '');
		value = arr;
		onchange?.(arr);
		return arr[i];
	}

	/**
	 * 把 DOM 拉回状态。
	 *
	 * 被拒绝的键入（月填 13）在状态里是**旧值**，`value` 压根没变 —— Svelte 于是
	 * 不会重写 `value` 属性，框里就留着那个没被接受的数字。看起来像「收下了但标红」，
	 * 实际提交的是另一个值；下次失焦规整也发现不了（状态是干净的）。
	 * 所以每次写完状态都显式对齐一次，只动真的不一致的格子。
	 */
	function syncDom(from = 0, to = widths.length) {
		for (let k = from; k < to; k++) {
			const el = inputs[k];
			const want = value[k] ?? '';
			if (el && el.value !== want) el.value = want;
		}
	}

	/** 段已填但越界：输入过程中只标红，不打断（否则「1」想打「12」会被立刻改掉） */
	function isInvalid(i: number): boolean {
		return isOutOfRange(spec, i, cells[i]);
	}

	/**
	 * 离开整个字段时才规整：位数不足左补零；越界不接受，回到进入字段时的值。
	 * 字段内部跳格（年 → 月）不触发，否则打「13」月会立刻被改掉，红字提示还没看清就没了。
	 */
	function normalize(): string[] {
		const r = normalizeCells(spec, cells, goodCells);
		if (r.changed) {
			value = r.cells;
			onchange?.(r.cells);
		}
		return r.cells;
	}

	function handleBlur(e: FocusEvent) {
		const next = e.relatedTarget as Node | null;
		if (next && fieldEl?.contains(next)) return;
		const final = normalize();
		const msg = checkField(validate, final.join(separator));
		if (msg) {
			value = goodCells.slice();
			errMsg = msg;
			onchange?.(value);
			oninvalid?.(msg);
			return;
		}
		errMsg = '';
	}

	function focusCell(i: number) {
		if (i < 0 || i >= widths.length) return;
		requestAnimationFrame(() => inputs[i]?.focus());
	}

	function handleInput(i: number, e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		let text = el.value;
		if (numeric) text = text.replace(/\D/g, '');
		text = text.slice(0, widths[i]);
		el.value = setCell(i, text);
		syncDom(i, i + 1);
		if (text.length >= widths[i] && i < widths.length - 1) focusCell(i + 1);
	}

	function handleKeydown(i: number, e: KeyboardEvent) {
		if (e.key === 'Backspace') {
			e.preventDefault();
			if (cells[i]) setCell(i, '');
			else if (i > 0) {
				setCell(i - 1, '');
				focusCell(i - 1);
			}
		} else if (e.key === 'ArrowLeft' && i > 0) {
			e.preventDefault();
			focusCell(i - 1);
		} else if (e.key === 'ArrowRight' && i < widths.length - 1) {
			e.preventDefault();
			focusCell(i + 1);
		} else if (e.key === 'Delete') {
			e.preventDefault();
			setCell(i, '');
		}
	}

	function handlePaste(i: number, e: ClipboardEvent) {
		e.preventDefault();
		const r = pasteCells(spec, cells, e.clipboardData?.getData('text') ?? '', i, goodCells);
		if (r.cells === cells) return;
		value = r.cells;
		onchange?.(r.cells);
		syncDom(i, widths.length);
		focusCell(r.next);
	}
</script>

<div
	class="segment-field {cls}"
	class:invalid={!!errMsg}
	style={style}
	role="group"
	aria-disabled={disabled || undefined}
	title={errMsg || undefined}
	bind:this={fieldEl}
>
	<PillTrack
		container={fieldEl}
		itemSelector=".segment-cell"
		showSelected={false}
		hoverBackground="var(--hover)"
		radius="var(--radius-sm)"
	/>
	{#if leading}
		<span class="segment-lead" aria-hidden="true">{@render leading()}</span>
	{/if}
	{#each cells as ch, i (i)}
		{@const bad = isInvalid(i)}
		{#if i > 0}
			<span class="segment-sep" aria-hidden="true">{separator}</span>
		{/if}
		<input
			class="segment-cell"
			style="width: {widths[i] + 0.6}ch"
			bind:this={inputs[i]}
			type="text"
			inputmode={numeric ? 'numeric' : 'text'}
			autocomplete="off"
			{disabled}
			maxlength={widths[i]}
			placeholder={placeholders[i] ?? ''}
			value={ch}
			aria-label="第 {i + 1} 段"
			aria-invalid={bad || errMsg ? 'true' : undefined}
			oninput={(e) => handleInput(i, e)}
			onkeydown={(e) => handleKeydown(i, e)}
			onpaste={(e) => handlePaste(i, e)}
			onblur={handleBlur}
			onpointerdown={handlePointerDown}
			onfocus={(e) => handleFocus(i, e)}
			onmouseup={handleMouseUp}
		/>
	{/each}
</div>

<style>
	.segment-field {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--space-0-5);
		padding: 0 var(--sp-md);
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		font-family: var(--font-mono);
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.segment-field:focus-within {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px var(--accent-ring);
	}
	.segment-field.invalid {
		border-color: var(--danger-text);
	}
	.segment-field:has(:disabled) {
		opacity: 0.5;
		background: var(--surface-2);
	}
	.segment-cell {
		position: relative;
		width: 4ch;
		padding: var(--sp-md) var(--space-0-5);
		border: none;
		background: none;
		outline: none;
		font-family: inherit;
		font-size: var(--fs-13);
		text-align: center;
		color: var(--text-strong);
	}
	.segment-cell::placeholder {
		color: var(--text-muted);
		font-family: inherit;
	}
	/* 越界只在当段标红：定位到具体哪一格，失焦规整后自动消失 */
	.segment-cell[aria-invalid='true'] {
		color: var(--danger);
	}
	.segment-sep {
		color: var(--text-muted);
		font-size: var(--fs-13);
		user-select: none;
	}
	/* 前置图标不参与段宽计算，只占自身尺寸；颜色弱一档，不与数字抢视线 */
	.segment-lead {
		display: inline-flex;
		align-items: center;
		flex: none;
		margin-right: var(--space-0-5);
		color: var(--text-muted);
	}
</style>

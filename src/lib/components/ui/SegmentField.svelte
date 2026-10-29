<script lang="ts">
	import PillTrack from './PillTrack.svelte';

	let {
		widths = [],
		value = $bindable<string[]>([]),
		separator = '-',
		numeric = true,
		placeholders = [],
		ranges = [],
		disabled = false,
		class: cls = '',
		style = '',
		onchange,
	}: {
		widths?: number[];
		value?: string[];
		separator?: string;
		numeric?: boolean;
		placeholders?: string[];
		/** 每段的合法数值区间（含端点），缺省按位数取 [0, 10^n - 1]；日期字段用它传「日 ≤ 当月天数」这类结论 */
		ranges?: ([number, number] | undefined)[];
		disabled?: boolean;
		class?: string;
		style?: string;
		onchange?: (value: string[]) => void;
	} = $props();

	let inputs = $state<HTMLInputElement[]>([]);
	let fieldEl = $state<HTMLElement | null>(null);

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

	function handleFocus(e: FocusEvent) {
		(e.currentTarget as HTMLInputElement).select();
	}

	function handleMouseUp(e: MouseEvent) {
		if (!focusByPointer) return;
		focusByPointer = false;
		e.preventDefault();
	}

	const cells = $derived.by(() => {
		const arr: string[] = [];
		for (let i = 0; i < widths.length; i++) arr.push(value[i] ?? '');
		return arr;
	});

	function setCell(i: number, ch: string) {
		const arr = cells.slice();
		arr[i] = ch;
		value = arr;
		onchange?.(arr);
	}

	/** 段的合法区间；没指定就按位数取满，等于不加额外约束 */
	function rangeOf(i: number): [number, number] {
		const r = ranges[i];
		if (r) return r;
		return [0, 10 ** widths[i] - 1];
	}

	/** 段已填但越界：输入过程中只标红，不打断（否则「1」想打「12」会被立刻改掉） */
	function isInvalid(i: number): boolean {
		if (!numeric) return false;
		const raw = cells[i];
		if (!raw) return false;
		const n = Number(raw);
		const [lo, hi] = rangeOf(i);
		return n < lo || n > hi;
	}

	/**
	 * 离开整个字段时才规整：位数不足左补零，越界夹到区间端点。
	 * 字段内部跳格（年 → 月）不触发，否则打「13」月会立刻变「12」，
	 * 红字提示还没看清就被改掉；也让「日 ≤ 当月天数」这类依赖段有稳定的判断依据。
	 */
	function normalize() {
		if (!numeric) return;
		const arr = cells.slice();
		let changed = false;
		for (let i = 0; i < arr.length; i++) {
			if (!arr[i]) continue;
			const [lo, hi] = rangeOf(i);
			const next = String(Math.min(hi, Math.max(lo, Number(arr[i])))).padStart(widths[i], '0');
			if (next !== arr[i]) {
				arr[i] = next;
				changed = true;
			}
		}
		if (!changed) return;
		value = arr;
		onchange?.(arr);
	}

	function handleBlur(e: FocusEvent) {
		const next = e.relatedTarget as Node | null;
		if (next && fieldEl?.contains(next)) return;
		normalize();
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
		el.value = text;
		setCell(i, text);
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
		let text = e.clipboardData?.getData('text') ?? '';
		if (numeric) text = text.replace(/\D/g, '');
		if (!text) return;
		const arr = cells.slice();
		let pos = 0;
		for (let k = i; k < widths.length && pos < text.length; k++) {
			const take = text.slice(pos, pos + widths[k]);
			arr[k] = take;
			pos += widths[k];
		}
		if (pos < text.length && i === 0) arr[0] = text.slice(0, widths[0]);
		value = arr;
		onchange?.(arr);
		focusCell(Math.min(widths.length - 1, i + Math.ceil(pos / Math.max(...widths))));
	}
</script>

<div class="segment-field {cls}" style={style} role="group" aria-disabled={disabled || undefined} bind:this={fieldEl}>
	<PillTrack
		container={fieldEl}
		itemSelector=".segment-cell"
		showSelected={false}
		hoverBackground="var(--hover)"
		radius="var(--radius-sm)"
	/>
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
			aria-invalid={bad ? 'true' : undefined}
			oninput={(e) => handleInput(i, e)}
			onkeydown={(e) => handleKeydown(i, e)}
			onpaste={(e) => handlePaste(i, e)}
			onblur={handleBlur}
			onpointerdown={handlePointerDown}
			onfocus={handleFocus}
			onmouseup={handleMouseUp}
		/>
	{/each}
</div>

<style>
	.segment-field {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 2px;
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
	.segment-field:has(:disabled) {
		opacity: 0.5;
		background: var(--surface-2);
	}
	.segment-cell {
		position: relative;
		width: 4ch;
		padding: var(--sp-md) 2px;
		border: none;
		background: none;
		outline: none;
		font-family: inherit;
		font-size: 13px;
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
		font-size: 13px;
		user-select: none;
	}
</style>

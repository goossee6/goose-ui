<script lang="ts">
	import type { Snippet } from 'svelte';
	import SegmentField from './SegmentField.svelte';
	import { joinTrimmed, splitFixed } from './dateParts';
	import type { FieldValidator } from './fieldValidation';

	/**
	 * 「字符串值 ⇄ 定长段」的中间层。`DateField` / `TimeField` 原先各写一份：
	 * 同样的 split → 补空 → 交给 SegmentField → 回拼 → 向上抛，只有分隔符、
	 * 位宽、区间、占位符不同。这里只留差异，行为（回拼语义、空态长度）统一。
	 *
	 * 不对外导出：它是两个公开字段组件的底座，不该让使用者按段拼装。
	 */
	let {
		value = $bindable(''),
		widths,
		ranges,
		separator,
		placeholders,
		disabled = false,
		leading,
		onchange,
		onsegmentfocus,
		validate,
		oninvalid,
	}: {
		/** 整串值，形如 `2026-11-23` / `09:30:00` */
		value?: string;
		/** 每段的字符宽度，同时决定段数 */
		widths: number[];
		/** 每段的合法数值区间；缺省按位数取满 */
		ranges: ([number, number] | undefined)[];
		separator: string;
		placeholders: string[];
		disabled?: boolean;
		leading?: Snippet;
		onchange?: (value: string) => void;
		onsegmentfocus?: (index: number) => void;
		validate?: FieldValidator;
		oninvalid?: (msg: string) => void;
	} = $props();

	const segs = $derived(splitFixed(value, separator, widths.length));

	/**
	 * 回拼必须保留空段：`['', '07', '00']` 若丢成 `07:00`，分钟会被读成小时。
	 * 只去尾部连续空段，所以 `2026-11` 这种「还没填完」的中间态也是合法值。
	 */
	function handle(segments: string[]) {
		const v = joinTrimmed(segments, separator);
		value = v;
		onchange?.(v);
	}
</script>

<SegmentField
	{widths}
	{ranges}
	{separator}
	{placeholders}
	{disabled}
	{leading}
	value={segs}
	onchange={handle}
	{onsegmentfocus}
	{validate}
	{oninvalid}
/>

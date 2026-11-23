<script lang="ts">
	import type { Snippet } from 'svelte';
	import SegmentedTextField from './SegmentedTextField.svelte';
	import type { FieldValidator } from './fieldValidation';

	let {
		value = $bindable(''),
		disabled = false,
		ariaLabel = '日期',
		onchange,
		onsegmentfocus,
		validate,
		oninvalid,
		leading,
		class: cls = '',
		style = '',
	}: {
		value?: string;
		disabled?: boolean;
		ariaLabel?: string;
		onchange?: (value: string) => void;
		/** 某一格拿到焦点（年 / 月 / 日）；父级用它把日历联动到这一段 */
		onsegmentfocus?: (index: number) => void;
		/** 离开输入框时校验整串，不合法回滚到本次编辑前 */
		validate?: FieldValidator;
		oninvalid?: (msg: string) => void;
		/** 年月日左侧的前置图标 */
		leading?: Snippet;
		class?: string;
		style?: string;
	} = $props();

	const widths = [4, 2, 2];

	/** 当月天数：年缺省时按闰年算，免得 2/29 还没填年份就被夹成 28 */
	const dayMax = $derived.by(() => {
		const [y, m] = value.split('-');
		const year = Number(y) || 2000;
		const month = Math.min(12, Math.max(1, Number(m) || 1));
		return new Date(year, month, 0).getDate();
	});

	const ranges = $derived<[number, number][]>([
		[1, 9999],
		[1, 12],
		[1, dayMax],
	]);
</script>

<div class="date-field {cls}" style={style} aria-label={ariaLabel} role="group">
	<SegmentedTextField
		bind:value
		{widths}
		{ranges}
		separator="-"
		placeholders={['年', '月', '日']}
		{disabled}
		{leading}
		{onchange}
		{onsegmentfocus}
		{validate}
		{oninvalid}
	/>
</div>

<style>
	.date-field {
		display: inline-block;
	}
</style>

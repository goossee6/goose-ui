<script lang="ts">
	import type { Snippet } from 'svelte';
	import SegmentedTextField from './SegmentedTextField.svelte';
	import type { FieldValidator } from './fieldValidation';

	let {
		value = $bindable(''),
		seconds = false,
		disabled = false,
		ariaLabel = '时间',
		onchange,
		onsegmentfocus,
		validate,
		oninvalid,
		leading,
		class: cls = '',
		style = '',
	}: {
		value?: string;
		seconds?: boolean;
		disabled?: boolean;
		ariaLabel?: string;
		onchange?: (value: string) => void;
		/** 某一格拿到焦点（时 / 分 / 秒）；父级用它把滚轮联动到这一列 */
		onsegmentfocus?: (index: number) => void;
		/** 离开输入框时校验整串，不合法回滚到本次编辑前 */
		validate?: FieldValidator;
		oninvalid?: (msg: string) => void;
		/** 时分秒左侧的前置图标（秒表） */
		leading?: Snippet;
		class?: string;
		style?: string;
	} = $props();

	const widths = $derived(seconds ? [2, 2, 2] : [2, 2]);

	const ranges = $derived<[number, number][]>(
		seconds
			? [
					[0, 23],
					[0, 59],
					[0, 59],
				]
			: [
					[0, 23],
					[0, 59],
				]
	);

	const placeholders = $derived(['时', '分', ...(seconds ? ['秒'] : [])]);
</script>

<div class="time-field {cls}" style={style} aria-label={ariaLabel} role="group">
	<SegmentedTextField
		bind:value
		{widths}
		{ranges}
		separator=":"
		{placeholders}
		{disabled}
		{leading}
		{onchange}
		{onsegmentfocus}
		{validate}
		{oninvalid}
	/>
</div>

<style>
	.time-field {
		display: inline-block;
	}
</style>

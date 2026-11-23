<script lang="ts">
	import type { Snippet } from 'svelte';
	import SegmentField from './SegmentField.svelte';
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

	const segs = $derived.by(() => {
		const parts = value.split(':');
		const n = seconds ? 3 : 2;
		const arr: string[] = [];
		for (let i = 0; i < n; i++) arr.push(parts[i] ?? '');
		return arr;
	});

	function join(arr: string[]): string {
		// 空段必须占位：时分秒靠位置对齐，`['', '07', '00']` 若丢成 `07:00`，
		// 分钟就会被读成小时。只有尾部连续空段可以省（`12:30` 不必写成 `12:30:`）。
		let last = arr.length - 1;
		while (last > 0 && !arr[last]) last--;
		return arr.slice(0, last + 1).join(':');
	}

	function handle(segments: string[]) {
		const v = join(segments);
		value = v;
		onchange?.(v);
	}
</script>

<div class="time-field {cls}" style={style} aria-label={ariaLabel} role="group">
	<SegmentField
		{widths}
		{ranges}
		value={segs}
		{disabled}
		separator=":"
		placeholders={['时', '分', ...(seconds ? ['秒'] : [])]}
		onchange={handle}
		{onsegmentfocus}
		{validate}
		{oninvalid}
		{leading}
	/>
</div>

<style>
	.time-field {
		display: inline-block;
	}
</style>

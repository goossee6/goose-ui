<script lang="ts">
	import SegmentField from './SegmentField.svelte';

	let {
		value = $bindable(''),
		disabled = false,
		ariaLabel = '日期',
		onchange,
		class: cls = '',
		style = '',
	}: {
		value?: string;
		disabled?: boolean;
		ariaLabel?: string;
		onchange?: (value: string) => void;
		class?: string;
		style?: string;
	} = $props();

	const widths = [4, 2, 2];

	const segs = $derived.by(() => {
		const parts = value.split('-');
		const arr: string[] = [];
		for (let i = 0; i < 3; i++) arr.push(parts[i] ?? '');
		return arr;
	});

	function join(arr: string[]): string {
		const [y, mo, d] = arr;
		if (!y) return '';
		if (!mo) return y;
		if (!d) return `${y}-${mo}`;
		return `${y}-${mo}-${d}`;
	}

	function handle(segments: string[]) {
		const v = join(segments);
		value = v;
		onchange?.(v);
	}
</script>

<div class="date-field {cls}" style={style} aria-label={ariaLabel} role="group">
	<SegmentField
		{widths}
		value={segs}
		{disabled}
		separator="-"
		placeholders={['年', '月', '日']}
		onchange={handle}
	/>
</div>

<style>
	.date-field {
		display: inline-block;
	}
</style>

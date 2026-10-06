<script lang="ts">
	import SegmentField from './SegmentField.svelte';

	let {
		value = $bindable(''),
		seconds = false,
		disabled = false,
		ariaLabel = '时间',
		onchange,
		class: cls = '',
		style = '',
	}: {
		value?: string;
		seconds?: boolean;
		disabled?: boolean;
		ariaLabel?: string;
		onchange?: (value: string) => void;
		class?: string;
		style?: string;
	} = $props();

	const widths = $derived(seconds ? [2, 2, 2] : [2, 2]);

	const segs = $derived.by(() => {
		const parts = value.split(':');
		const n = seconds ? 3 : 2;
		const arr: string[] = [];
		for (let i = 0; i < n; i++) arr.push(parts[i] ?? '');
		return arr;
	});

	function join(arr: string[]): string {
		const parts: string[] = [];
		for (const s of arr) {
			if (!s) break;
			parts.push(s);
		}
		return parts.join(':');
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
		value={segs}
		{disabled}
		separator=":"
		placeholders={['时', '分', ...(seconds ? ['秒'] : [])]}
		onchange={handle}
	/>
</div>

<style>
	.time-field {
		display: inline-block;
	}
</style>

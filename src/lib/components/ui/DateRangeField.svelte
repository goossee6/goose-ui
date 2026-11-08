<script lang="ts">
	import DateField from './DateField.svelte';

	let {
		start = $bindable(''),
		end = $bindable(''),
		disabled = false,
		separator = '→',
		onchange,
		class: cls = '',
		style = '',
	}: {
		start?: string;
		end?: string;
		disabled?: boolean;
		separator?: string;
		onchange?: (range: { start: string; end: string }) => void;
		class?: string;
		style?: string;
	} = $props();

	function emit() {
		onchange?.({ start, end });
	}
</script>

<div class="date-range-field {cls}" style={style} role="group" aria-label="日期范围">
	<DateField
		bind:value={start}
		{disabled}
		ariaLabel="开始日期"
		onchange={(v) => {
			start = v;
			emit();
		}}
	/>
	<span class="range-sep" aria-hidden="true">{separator}</span>
	<DateField
		bind:value={end}
		{disabled}
		ariaLabel="结束日期"
		onchange={(v) => {
			end = v;
			emit();
		}}
	/>
</div>

<style>
	.date-range-field {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-md);
	}
	.range-sep {
		color: var(--text-muted);
		font-size: var(--fs-13);
	}
</style>

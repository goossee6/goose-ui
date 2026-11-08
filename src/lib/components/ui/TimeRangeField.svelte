<script lang="ts">
	import TimeField from './TimeField.svelte';

	let {
		start = $bindable(''),
		end = $bindable(''),
		seconds = false,
		disabled = false,
		separator = '→',
		onchange,
		class: cls = '',
		style = '',
	}: {
		start?: string;
		end?: string;
		seconds?: boolean;
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

<div class="time-range-field {cls}" style={style} role="group" aria-label="时间范围">
	<TimeField
		bind:value={start}
		{seconds}
		{disabled}
		ariaLabel="开始时间"
		onchange={(v) => {
			start = v;
			emit();
		}}
	/>
	<span class="range-sep" aria-hidden="true">{separator}</span>
	<TimeField
		bind:value={end}
		{seconds}
		{disabled}
		ariaLabel="结束时间"
		onchange={(v) => {
			end = v;
			emit();
		}}
	/>
</div>

<style>
	.time-range-field {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-md);
	}
	.range-sep {
		color: var(--text-muted);
		font-size: var(--fs-13);
	}
</style>

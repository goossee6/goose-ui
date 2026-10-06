<script lang="ts" module>
	export interface RadioGroupOption {
		value: string;
		label: string;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import { setContext } from 'svelte';
	import Radio, { RADIO_GROUP_KEY, type RadioGroupContext } from './Radio.svelte';

	let {
		options = [],
		value = $bindable(''),
		name = '',
		disabled = false,
		orientation = 'horizontal',
		onchange,
		class: cls = '',
		style = '',
	}: {
		options?: RadioGroupOption[];
		value?: string;
		name?: string;
		disabled?: boolean;
		orientation?: 'horizontal' | 'vertical';
		onchange?: (value: string) => void;
		class?: string;
		style?: string;
	} = $props();

	function handleSelect(v: string) {
		if (v === value) return;
		value = v;
		onchange?.(v);
	}

	const ctx: RadioGroupContext = {
		get value() {
			return value;
		},
		get name() {
			return name;
		},
		get disabled() {
			return disabled;
		},
		onSelect: handleSelect,
	};
	setContext(RADIO_GROUP_KEY, ctx);
</script>

<div
	class="radio-group radio-group--{orientation} {cls}"
	role="radiogroup"
	aria-orientation={orientation}
	style={style}
>
	{#each options as opt (opt.value)}
		<Radio value={opt.value} disabled={opt.disabled || disabled} size="middle">
			{opt.label}
		</Radio>
	{/each}
</div>

<style>
	.radio-group {
		display: flex;
		gap: var(--sp-lg);
	}
	.radio-group--vertical {
		flex-direction: column;
		gap: var(--sp-md);
	}
</style>

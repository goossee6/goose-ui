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
	import PillTrack from './PillTrack.svelte';

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

	let groupEl = $state<HTMLElement>();
</script>

<div
	class="radio-group radio-group--{orientation} {cls}"
	role="radiogroup"
	aria-orientation={orientation}
	bind:this={groupEl}
	style={style}
>
	<PillTrack
		container={groupEl}
		itemSelector=".radio-group-item"
		activeSelector=".radio--checked"
		disabledMatch=".radio--disabled"
		background="var(--surface)"
		hoverBackground="var(--hover)"
		radius="calc(var(--radius-lg) - 4px)"
		shadow="0 1px 3px rgba(0, 0, 0, 0.12)"
		disabled={disabled}
	/>
	{#each options as opt (opt.value)}
		<Radio
			value={opt.value}
			disabled={opt.disabled || disabled}
			size="middle"
			class="radio-group-item"
		>
			{opt.label}
		</Radio>
	{/each}
</div>

<style>
	.radio-group {
		position: relative;
		display: flex;
		gap: 2px;
		padding: 4px;
		border-radius: var(--radius-lg);
		background: var(--surface-2);
		width: fit-content;
	}
	.radio-group--vertical {
		flex-direction: column;
		gap: 2px;
	}
	.radio-group :global(.radio-group-item) {
		position: relative;
		z-index: 1;
		padding: 6px 10px;
		border-radius: calc(var(--radius-lg) - 4px);
		line-height: 1;
		transition: color 0.15s;
	}
	.radio-group :global(.radio--checked) {
		color: var(--primary);
	}
</style>

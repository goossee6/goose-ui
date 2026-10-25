<script lang="ts" module>
	import { getContext } from 'svelte';

	export interface RadioGroupContext {
		value: string;
		name: string;
		disabled: boolean;
		onSelect: (value: string) => void;
	}

	export const RADIO_GROUP_KEY = Symbol('goose-radio-group');

	export function getRadioGroup(): RadioGroupContext | null {
		return getContext<RadioGroupContext | null>(RADIO_GROUP_KEY);
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		value = $bindable(''),
		checked = $bindable(false),
		name = '',
		disabled = false,
		size = 'middle',
		onchange,
		class: cls = '',
		style = '',
		children,
	}: {
		value?: string;
		checked?: boolean;
		name?: string;
		disabled?: boolean;
		size?: 'small' | 'middle' | 'large';
		onchange?: (checked: boolean) => void;
		class?: string;
		style?: string;
		children?: Snippet;
	} = $props();

	const group = getRadioGroup();

	const isDisabled = $derived(disabled || (group?.disabled ?? false));
	const isChecked = $derived(group ? group.value === value : checked);

	function toggle() {
		if (isDisabled) return;
		if (group) {
			if (group.value !== value) {
				group.onSelect(value);
				onchange?.(true);
			}
		} else {
			checked = !checked;
			onchange?.(checked);
		}
	}
</script>

<label
	class="radio radio--{size} {cls}"
	class:radio--disabled={isDisabled}
	class:radio--checked={isChecked}
	style={style}
>
	<input
		class="radio-input"
		type="radio"
		name={group?.name || name}
		{value}
		checked={isChecked}
		disabled={isDisabled}
		aria-checked={isChecked}
		onchange={(e) => {
			e.preventDefault();
			toggle();
		}}
	/>
	<span class="radio-indicator" aria-hidden="true"></span>
	{#if children}
		<span class="radio-label">{@render children()}</span>
	{/if}
</label>

<style>
	.radio {
		/* 必须定位：隐藏的 input 是 absolute，没有定位祖先时会跑出 label 很远的距离，
		   键盘/点击聚焦时浏览器会滚动到那个位置 → 页面跳动 */
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--sp-md);
		cursor: pointer;
		font-size: 13px;
		color: var(--text);
		line-height: 1;
		transition: color 0.15s;
	}
	.radio--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.radio-input {
		position: absolute;
		top: 0;
		left: 0;
		opacity: 0;
		width: 1px;
		height: 1px;
		margin: 0;
		pointer-events: none;
	}
	.radio-indicator {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		border: 1.5px solid var(--border-strong);
		border-radius: 50%;
		background: var(--surface);
		transition: border-color 0.15s, background-color 0.15s;
		flex-shrink: 0;
	}
	.radio--small .radio-indicator {
		width: 14px;
		height: 14px;
	}
	.radio--large .radio-indicator {
		width: 18px;
		height: 18px;
	}
	.radio:hover:not(.radio--disabled) {
		color: var(--primary);
	}
	.radio:hover:not(.radio--disabled) .radio-indicator {
		border-color: var(--primary);
	}
	.radio-input:focus-visible + .radio-indicator {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.radio--checked {
		color: var(--primary);
	}
	.radio--checked .radio-indicator {
		border-color: var(--primary);
		background: var(--primary);
	}
	.radio--checked .radio-indicator::after {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #fff;
	}
	.radio--small .radio-indicator::after {
		width: 5px;
		height: 5px;
	}
	.radio--large .radio-indicator::after {
		width: 7px;
		height: 7px;
	}
	.radio-label {
		user-select: none;
	}
</style>

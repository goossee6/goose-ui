<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getContext } from 'svelte';
	import X from '@lucide/svelte/icons/x';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import Icon from './Icon.svelte';
	import { FORM_ITEM_KEY, type FormItemContext } from './form.context';

	let {
		id = '',
		name = '',
		value = $bindable(''),
		placeholder = '',
		disabled = false,
		readonly = false,
		clearable = true,
		prefix,
		suffix,
		status,
		class: cls = '',
		style = '',
		type = 'text',
		onkeydown,
		onenter,
		digitsOnly = false,
		onClear,
		onclick,
	}: {
		id?: string;
		name?: string;
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		readonly?: boolean;
		clearable?: boolean;
		/** 输入框前缀区（snippet，可放图标/文本/按钮） */
		prefix?: Snippet;
		/** 输入框后缀区（snippet，可放图标/文本/可点击按钮） */
		suffix?: Snippet;
		status?: 'error' | 'warning';
		class?: string;
		style?: string;
		type?: string;
		onkeydown?: (e: KeyboardEvent) => void;
		onenter?: () => void;
		digitsOnly?: boolean;
		onClear?: () => void;
		onclick?: (e: MouseEvent) => void;
	} = $props();

	// FormItem 内且该项有 error 时自动进入 error 态（FormItem 之外为 null，行为不变）
	const itemCtx = getContext<FormItemContext | null>(FORM_ITEM_KEY);
	const effStatus = $derived(status ?? (itemCtx?.error ? 'error' : undefined));

	const statusIcon = $derived(effStatus === 'error' ? AlertCircle : effStatus === 'warning' ? AlertTriangle : null);
	const statusColor = $derived(effStatus === 'error' ? 'var(--danger-text)' : effStatus === 'warning' ? 'var(--warning-text)' : '');
	const statusStyle = $derived(
		effStatus === 'error'
			? 'border-color:var(--danger-text);box-shadow:0 0 0 2px var(--danger-soft);'
			: effStatus === 'warning'
				? 'border-color:var(--warning-text);box-shadow:0 0 0 2px var(--warning-soft);'
				: ''
	);
	const mergedStyle = $derived(statusStyle ? `${statusStyle}${style}` : style);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') onenter?.();
		onkeydown?.(e);
	}

	function handleInput(e: Event) {
		if (!digitsOnly) return;
		const input = e.target as HTMLInputElement;
		const cleaned = input.value.replace(/\D/g, '');
		if (input.value !== cleaned) {
			input.value = cleaned;
			value = cleaned;
		}
	}
</script>

<div
	class="input-wrapper {cls}"
	class:input--disabled={disabled}
	style={mergedStyle}
>
	{#if prefix}
		<span class="input-affix input-prefix">
			{@render prefix()}
		</span>
	{/if}
	<input
		{id}
		{name}
		{type}
		{placeholder}
		{disabled}
		{readonly}
		class="input"
		onkeydown={handleKeydown}
		oninput={handleInput}
		onclick={(e) => onclick?.(e)}
		bind:value
	/>
	{#if suffix}
		<span class="input-affix input-suffix">
			{@render suffix()}
		</span>
	{/if}
	{#if statusIcon}
		<span class="input-affix input-status" style="color:{statusColor}">
			<Icon icon={statusIcon} size={16} />
		</span>
	{/if}
	{#if clearable && !readonly}
		<button class="input-clear" class:input-clear--hidden={!value} onclick={() => { if (value) { value = ''; onClear?.(); } }} aria-label="清除">
			<Icon icon={X} size={14} />
		</button>
	{/if}
</div>

<style>
	.input-wrapper {
		display: flex;
		align-items: center;
		height: var(--height-md);
		padding: var(--padding-md);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background-color: transparent;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.input-wrapper:focus-within {
		border-color: var(--primary);
		box-shadow: 0 0 0 2px var(--primary-soft);
	}
	.input-wrapper.input--disabled { opacity: 0.5; cursor: not-allowed; background-color: var(--surface-2); pointer-events: none; }
	.input {
		flex: 1;
		min-width: 0;
		width: 100%;
		height: 100%;
		border: none;
		background: transparent;
		padding: 0;
		color: var(--text-strong);
		font-size: var(--font-md);
		outline: none;
	}
	.input::placeholder { color: var(--text-muted); }
	.input:disabled { cursor: not-allowed; }
	.input-affix {
		display: flex;
		align-items: center;
		color: var(--text-muted);
		flex-shrink: 0;
		padding: 0 4px;
	}
	.input-clear {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		margin-left: 2px;
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		transition: color 0.15s;
		flex-shrink: 0;
	}
	.input-clear:hover { color: var(--text-strong); }
	.input-clear--hidden { opacity: 0.3; pointer-events: none; }
</style>

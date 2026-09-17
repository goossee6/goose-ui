<script lang="ts">
	import type { Component } from 'svelte';
	import X from '@lucide/svelte/icons/x';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import Icon from './Icon.svelte';

	let {
		id = '',
		name = '',
		value = $bindable(''),
		placeholder = '',
		disabled = false,
		readonly = false,
		clearable = true,
		prefix = null,
		suffix = null,
		status,
		class: cls = '',
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
		prefix?: Component<{ size?: number }> | null;
		suffix?: Component<{ size?: number }> | null;
		status?: 'error' | 'warning';
		class?: string;
		type?: string;
		onkeydown?: (e: KeyboardEvent) => void;
		onenter?: () => void;
		digitsOnly?: boolean;
		onClear?: () => void;
		onclick?: (e: MouseEvent) => void;
	} = $props();

	const statusIcon = $derived(status === 'error' ? AlertCircle : status === 'warning' ? AlertTriangle : null);
	const statusColor = $derived(status === 'error' ? 'var(--danger-text)' : status === 'warning' ? 'var(--warning-text)' : '');
	const statusStyle = $derived(
		status === 'error'
			? 'border-color:var(--danger-text);box-shadow:0 0 0 2px var(--danger-soft)'
			: status === 'warning'
				? 'border-color:var(--warning-text);box-shadow:0 0 0 2px var(--warning-soft)'
				: ''
	);

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
	style={statusStyle}
>
	{#if prefix}
		<span class="input-affix input-prefix">
			<Icon icon={prefix} size={16} />
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
			<Icon icon={suffix} size={16} />
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
		height: var(--ui-md-height);
		padding: var(--ui-md-padding);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background-color: transparent;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.input-wrapper:focus-within {
		border-color: var(--primary);
		box-shadow: 0 0 0 2px var(--primary-soft);
	}
	.input-wrapper.input--disabled { opacity: 0.5; cursor: not-allowed; background-color: var(--surface-2); }
	.input {
		flex: 1;
		min-width: 0;
		width: 100%;
		height: 100%;
		border: none;
		background: transparent;
		padding: 0;
		color: var(--text-strong);
		font-size: var(--ui-md-font);
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

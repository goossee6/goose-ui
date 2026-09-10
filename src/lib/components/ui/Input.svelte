<script lang="ts">
	import type { Component } from 'svelte';
	import X from '@lucide/svelte/icons/x';
	import Icon from './Icon.svelte';

	let {
		id = '',
		value = $bindable(''),
		placeholder = '',
		disabled = false,
		readonly = false,
		clearable = false,
		prefix = undefined,
		suffix = undefined,
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
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		readonly?: boolean;
		clearable?: boolean;
		prefix?: Component<{ size?: number }>;
		suffix?: Component<{ size?: number }>;
		status?: 'error' | 'warning';
		class?: string;
		type?: string;
		onkeydown?: (e: KeyboardEvent) => void;
		onenter?: () => void;
		digitsOnly?: boolean;
		onClear?: () => void;
		onclick?: (e: MouseEvent) => void;
	} = $props();

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

<div class="input-wrapper {cls}">
	{#if prefix}
		<span class="input-affix input-prefix">
			<Icon icon={prefix} size={16} />
		</span>
	{/if}
	<input
		{id}
		{type}
		{placeholder}
		{disabled}
		{readonly}
		class="input"
		class:input--error={status === 'error'}
		class:input--warning={status === 'warning'}
		class:input--has-prefix={!!prefix}
		class:input--has-suffix={!!suffix || clearable}
		onkeydown={handleKeydown}
		oninput={handleInput}
		onclick={(e) => onclick?.(e)}
		bind:value
	/>
	{#if clearable && value}
		<button class="input-clear" onclick={() => { value = ''; onClear?.(); }} aria-label="清除">
			<Icon icon={X} size={14} />
		</button>
	{/if}
	{#if suffix}
		<span class="input-affix input-suffix">
			<Icon icon={suffix} size={16} />
		</span>
	{/if}
</div>

<style>
	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}
	.input {
		height: 36px;
		width: 100%;
		min-width: 0;
		padding: 0 var(--sp-md);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background-color: transparent;
		color: var(--text-strong);
		font-size: 14px;
		outline: none;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.input::placeholder { color: var(--text-muted); }
	.input:focus { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-soft); }
	.input:disabled { opacity: 0.5; cursor: not-allowed; background-color: var(--surface-2); }
	.input--error { border-color: var(--danger-text); }
	.input--error:focus { box-shadow: 0 0 0 2px var(--danger-soft); }
	.input--warning { border-color: #f59e0b; }
	.input--has-prefix { padding-left: 36px; }
	.input--has-suffix { padding-right: 36px; }
	.input-affix {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
		display: flex;
		align-items: center;
		pointer-events: none;
	}
	.input-prefix { left: 10px; }
	.input-suffix { right: 10px; }
	.input-clear {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		transition: color 0.15s;
	}
	.input-clear:hover { color: var(--text-strong); }
</style>

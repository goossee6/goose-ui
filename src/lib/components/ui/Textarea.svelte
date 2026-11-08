<script lang="ts">
	import { getContext } from 'svelte';
	import { FORM_ITEM_KEY, type FormItemContext } from './form.context';

	let {
		id = '',
		name = '',
		value = $bindable(''),
		placeholder = '',
		rows = 3,
		disabled = false,
		readonly = false,
		maxlength,
		status,
		ariaLabel = '',
		oninput,
		onkeydown,
		class: cls = '',
		style = '',
	}: {
		id?: string;
		name?: string;
		value?: string;
		placeholder?: string;
		rows?: number;
		disabled?: boolean;
		readonly?: boolean;
		maxlength?: number;
		status?: 'error' | 'warning';
		ariaLabel?: string;
		oninput?: (e: Event) => void;
		onkeydown?: (e: KeyboardEvent) => void;
		class?: string;
		style?: string;
	} = $props();

	// FormItem 内且该项有 error 时自动进入 error 态（FormItem 之外为 null，行为不变）
	const itemCtx = getContext<FormItemContext | null>(FORM_ITEM_KEY);
	const effStatus = $derived(status ?? (itemCtx?.error ? 'error' : undefined));

	const statusStyle = $derived(
		effStatus === 'error'
			? 'border-color:var(--danger-text);box-shadow:0 0 0 2px var(--danger-soft);'
			: effStatus === 'warning'
				? 'border-color:var(--warning-text);box-shadow:0 0 0 2px var(--warning-soft);'
				: ''
	);
	const mergedStyle = $derived(statusStyle ? `${statusStyle}${style}` : style);
</script>

<textarea
	class="textarea {cls}"
	{id}
	{name}
	{placeholder}
	{rows}
	{disabled}
	{readonly}
	maxlength={maxlength}
	bind:value
	aria-label={ariaLabel || undefined}
	aria-invalid={effStatus === 'error' ? 'true' : undefined}
	style={mergedStyle || undefined}
	{oninput}
	{onkeydown}
></textarea>

<style>
	.textarea {
		display: block;
		width: 100%;
		min-width: 0;
		min-height: 72px;
		padding: var(--sp-lg) var(--space-3);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background-color: transparent;
		color: var(--text-strong);
		font-size: var(--font-md);
		font-family: inherit;
		line-height: 1.6;
		outline: none;
		resize: vertical;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-soft); }
	.textarea:disabled { opacity: 0.5; cursor: not-allowed; background-color: var(--surface-2); }
	.textarea:read-only:not(:disabled) { cursor: default; }
	.textarea::placeholder { color: var(--text-muted); }
</style>

<script lang="ts">
	import { getContext } from 'svelte';
	import { FORM_ITEM_KEY, type FormItemContext } from './form.context';
	import { checkField, type FieldValidator } from './fieldValidation';

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
		validate,
		oninvalid,
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
		/** 失焦校验：返回错误文案即不接受，值回滚到本次编辑前 */
		validate?: FieldValidator;
		oninvalid?: (msg: string) => void;
		class?: string;
		style?: string;
	} = $props();

	// FormItem 内且该项有 error 时自动进入 error 态（FormItem 之外为 null，行为不变）
	const itemCtx = getContext<FormItemContext | null>(FORM_ITEM_KEY);
	let errMsg = $state('');
	let lastGood = '';
	const effStatus = $derived(status ?? (errMsg || itemCtx?.error ? 'error' : undefined));

	const statusStyle = $derived(
		effStatus === 'error'
			? 'border-color:var(--danger-text);box-shadow:0 0 0 2px var(--danger-soft);'
			: effStatus === 'warning'
				? 'border-color:var(--warning-text);box-shadow:0 0 0 2px var(--warning-soft);'
				: ''
	);
	const mergedStyle = $derived(statusStyle ? `${statusStyle}${style}` : style);

	function handleFocus() {
		lastGood = value;
	}

	function handleBlur() {
		const msg = checkField(validate, value);
		if (!msg) {
			errMsg = '';
			return;
		}
		value = lastGood;
		errMsg = msg;
		oninvalid?.(msg);
	}
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
	title={errMsg || undefined}
	style={mergedStyle || undefined}
	onfocus={handleFocus}
	onblur={handleBlur}
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

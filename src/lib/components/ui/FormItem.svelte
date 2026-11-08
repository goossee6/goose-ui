<script lang="ts">
	import { getContext, setContext } from 'svelte';
	import { FORM_KEY, FORM_ITEM_KEY, type FormContext, type FormItemContext } from './form.context';

	let {
		label = '',
		required = false,
		error = '',
		hint = '',
		htmlFor = '',
		children,
		class: cls = '',
		style = '',
	}: {
		label?: string;
		required?: boolean;
		error?: string;
		hint?: string;
		htmlFor?: string;
		children?: import('svelte').Snippet;
		class?: string;
		style?: string;
	} = $props();

	const form = getContext<FormContext | null>(FORM_KEY);

	setContext(FORM_ITEM_KEY, {
		get error() {
			return error;
		},
		get required() {
			return required;
		},
		get disabled() {
			return form?.disabled ?? false;
		},
	} satisfies FormItemContext);
</script>

<div
	class="form-item form-item--{form?.layout ?? 'vertical'} {cls}"
	class:has-error={!!error}
	class:required
	style={style}
>
	{#if label || required}
		<label class="form-label" for={htmlFor} style:width={form?.layout === 'horizontal' ? (form?.labelWidth ?? '96px') : undefined}>
			{#if required}<span class="form-req" aria-hidden="true">*</span>{/if}
			{label}
		</label>
	{/if}
	<div class="form-control">
		{@render children?.()}
		{#if error}
			<p class="form-error" role="alert">{error}</p>
		{:else if hint}
			<p class="form-hint">{hint}</p>
		{/if}
	</div>
</div>

<style>
	.form-item {
		display: flex;
		flex-direction: column;
		gap: var(--sp-sm);
	}
	.form-item--horizontal {
		flex-direction: row;
		align-items: flex-start;
		gap: var(--sp-md);
	}
	.form-label {
		display: block;
		font-size: var(--fs-13);
		color: var(--text);
		line-height: 32px;
		flex-shrink: 0;
	}
	.form-item--vertical .form-label {
		line-height: 1.4;
	}
	.form-req {
		color: var(--danger-text);
		margin-right: var(--space-0-5);
	}
	.form-control {
		flex: 1;
		min-width: 0;
	}
	.form-error {
		margin: var(--space-0-5) 0 0;
		font-size: var(--fs-12);
		color: var(--danger-text);
	}
	.form-hint {
		margin: var(--space-0-5) 0 0;
		font-size: var(--fs-12);
		color: var(--text-muted);
	}
</style>

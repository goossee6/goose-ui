<script lang="ts" module>
	// 兼容再导出：真实定义在 form.context.ts（避免 FormItem/Input 从组件文件反向导入）
	export { FORM_KEY, FORM_ITEM_KEY, type FormContext, type FormItemContext } from './form.context';
</script>

<script lang="ts">
	import { setContext } from 'svelte';
	import { FORM_KEY, type FormContext } from './form.context';

	let {
		layout = 'vertical',
		labelWidth = '96px',
		disabled = false,
		onsubmit,
		children,
		class: cls = '',
		style = '',
	}: {
		layout?: 'horizontal' | 'vertical';
		labelWidth?: string;
		disabled?: boolean;
		onsubmit?: (e: SubmitEvent) => void;
		children?: import('svelte').Snippet;
		class?: string;
		style?: string;
	} = $props();

	const ctx: FormContext = {
		get layout() {
			return layout;
		},
		get labelWidth() {
			return labelWidth;
		},
		get disabled() {
			return disabled;
		},
	};
	setContext(FORM_KEY, ctx);
</script>

<form
	class="form form--{layout} {cls}"
	style={style}
	onsubmit={(e) => {
		e.preventDefault();
		onsubmit?.(e);
	}}
>
	{@render children?.()}
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: var(--sp-md);
	}
	.form--horizontal {
		align-items: flex-start;
	}
</style>

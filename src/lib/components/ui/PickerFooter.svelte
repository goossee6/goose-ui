<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';

	/**
	 * 日期/时间浮层共用的底部操作条：左侧可选快捷（今天/现在），右侧固定「取消 + 确认」。
	 *
	 * 抽成组件而不是各面板各写一遍：四个选择器的面板内宽都是 280，按钮尺寸、
	 * 分隔线、间距必须一致，否则并排放在一个页面里能看出高低差。
	 */
	let {
		disabled = false,
		cancelLabel = '取消',
		confirmLabel = '确认',
		leading,
		oncancel,
		onconfirm,
	}: {
		disabled?: boolean;
		cancelLabel?: string;
		confirmLabel?: string;
		/** 左侧快捷动作（如「今天」「现在」），不传则只有右侧两个按钮 */
		leading?: Snippet;
		oncancel?: () => void;
		onconfirm?: () => void;
	} = $props();
</script>

<div class="picker-footer">
	{#if leading}
		<div class="pf-leading">{@render leading()}</div>
	{/if}
	<div class="pf-actions">
		<Button variant="ghost" size="small" {disabled} onclick={() => oncancel?.()}>{cancelLabel}</Button>
		<Button variant="primary" size="small" {disabled} onclick={() => onconfirm?.()}>{confirmLabel}</Button>
	</div>
</div>

<style>
	.picker-footer {
		display: flex;
		align-items: center;
		gap: var(--sp-sm);
		margin-top: var(--sp-md);
		padding-top: var(--sp-md);
		border-top: 1px solid var(--border);
	}
	.pf-leading {
		margin-right: auto;
		min-width: 0;
	}
	.pf-actions {
		display: flex;
		align-items: center;
		gap: var(--sp-sm);
		margin-left: auto;
	}
</style>

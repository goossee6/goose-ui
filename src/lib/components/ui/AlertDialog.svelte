<script lang="ts" module>
	/** 同页可能同时挂多个 AlertDialog，id 必须唯一，否则 aria-labelledby 会指到别人身上 */
	let alertSeq = 0;
	function nextAlertId(): number {
		return ++alertSeq;
	}
</script>

<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import { trapTabKey } from './focusTrap';

	let {
		open = $bindable(false),
		title = '确认操作',
		description = '',
		cancelText = '取消',
		confirmText = '确定',
		danger = false,
		loading = false,
		onCancel,
		onConfirm,
		content,
		class: cls = '',
		style = '',
	}: {
		open?: boolean;
		title?: string;
		description?: string;
		cancelText?: string;
		confirmText?: string;
		danger?: boolean;
		loading?: boolean;
		onCancel?: () => void;
		onConfirm?: () => void;
		content?: Snippet;
		class?: string;
		style?: string;
	} = $props();

	let panelEl = $state<HTMLElement | null>(null);
	let cancelBtn = $state<HTMLButtonElement | null>(null);
	const uid = nextAlertId();
	const titleId = `goose-alert-title-${uid}`;
	const descId = `goose-alert-desc-${uid}`;

	function cancel() {
		if (loading) return;
		open = false;
		onCancel?.();
	}

	function confirm() {
		if (loading) return;
		onConfirm?.();
	}

	$effect(() => {
		if (!open) return;
		const opener = document.activeElement as HTMLElement | null;
		requestAnimationFrame(() => cancelBtn?.focus());
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				cancel();
			} else if (e.key === 'Tab') {
				trapTabKey(e, panelEl);
			}
		};
		document.addEventListener('keydown', onKey, true);
		return () => {
			document.removeEventListener('keydown', onKey, true);
			// 关闭后把焦点还给打开它的按钮，键盘用户不会掉回 document.body
			if (opener?.isConnected) opener.focus();
		};
	});
</script>

{#if open}
	<div class="alert-overlay" transition:fade={{ duration: 150 }}>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="alert-dialog {cls}"
			role="alertdialog"
			tabindex="-1"
			aria-modal="true"
			aria-labelledby={titleId}
			aria-describedby={description ? descId : undefined}
			bind:this={panelEl}
			transition:scale={{ duration: 150, start: 0.95 }}
			style={style}
			onkeydown={(e) => e.stopPropagation()}
		>
			<h2 class="alert-title" id={titleId}>{title}</h2>
			{#if description}
				<p class="alert-desc" id={descId}>{description}</p>
			{/if}
			{#if content}
				<div class="alert-content">{@render content()}</div>
			{/if}
			<div class="alert-actions">
				<Button
					variant="default"
					size="middle"
					disabled={loading}
					bind:element={cancelBtn}
					onclick={cancel}>{cancelText}</Button
				>
				<Button
					variant={danger ? 'danger-solid' : 'primary'}
					size="middle"
					loading={loading}
					onclick={confirm}>{confirmText}</Button
				>
			</div>
		</div>
	</div>
{/if}

<style>
	.alert-overlay {
		position: fixed;
		inset: 0;
		z-index: var(--z-dialog);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--sp-lg);
		background: var(--overlay);
		backdrop-filter: blur(2px);
	}
	.alert-dialog {
		width: 100%;
		max-width: 420px;
		padding: var(--space-6);
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
	}
	.alert-title {
		margin: 0 0 var(--sp-md);
		font-size: var(--fs-16);
		font-weight: 600;
		color: var(--text-strong);
	}
	.alert-desc {
		margin: 0 0 var(--sp-lg);
		font-size: var(--fs-13);
		color: var(--text-muted);
		line-height: 1.7;
	}
	.alert-content {
		margin-bottom: var(--sp-lg);
		font-size: var(--fs-13);
		color: var(--text-muted);
	}
	.alert-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--sp-md);
	}
</style>

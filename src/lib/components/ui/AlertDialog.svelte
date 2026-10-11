<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import type { Snippet } from 'svelte';

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
		requestAnimationFrame(() => cancelBtn?.focus());
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				cancel();
			} else if (e.key === 'Tab' && panelEl) {
				const focusables = panelEl.querySelectorAll<HTMLElement>('button:not(:disabled)');
				if (!focusables.length) return;
				const first = focusables[0];
				const last = focusables[focusables.length - 1];
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					last.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		};
		document.addEventListener('keydown', onKey, true);
		return () => document.removeEventListener('keydown', onKey, true);
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
			aria-labelledby="alert-dialog-title"
			aria-describedby={description || undefined}
			bind:this={panelEl}
			transition:scale={{ duration: 150, start: 0.95 }}
			style={style}
			onkeydown={(e) => e.stopPropagation()}
		>
			<h2 class="alert-title" id="alert-dialog-title">{title}</h2>
			{#if description}
				<p class="alert-desc">{description}</p>
			{/if}
			{#if content}
				<div class="alert-content">{@render content()}</div>
			{/if}
			<div class="alert-actions">
				<button type="button" class="alert-btn alert-btn--cancel" bind:this={cancelBtn} disabled={loading} onclick={cancel}>
					{cancelText}
				</button>
				<button
					type="button"
					class="alert-btn alert-btn--confirm"
					class:danger
					disabled={loading}
					onclick={confirm}
				>
					{#if loading}
						<span class="alert-spinner" aria-hidden="true"></span>
					{/if}
					{confirmText}
				</button>
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
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(2px);
	}
	.alert-dialog {
		width: 100%;
		max-width: 420px;
		padding: 24px;
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
	}
	.alert-title {
		margin: 0 0 var(--sp-md);
		font-size: 16px;
		font-weight: 600;
		color: var(--text-strong);
	}
	.alert-desc {
		margin: 0 0 var(--sp-lg);
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.7;
	}
	.alert-content {
		margin-bottom: var(--sp-lg);
		font-size: 13px;
		color: var(--text-muted);
	}
	.alert-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--sp-md);
	}
	.alert-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-sm);
		padding: var(--sp-md) var(--sp-lg);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.15s, border-color 0.15s, opacity 0.15s;
	}
	.alert-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.alert-btn:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.alert-btn--cancel {
		background: var(--surface);
		color: var(--text);
	}
	.alert-btn--cancel:hover:not(:disabled) {
		background: var(--hover);
	}
	.alert-btn--confirm {
		background: var(--primary);
		border-color: var(--primary);
		color: var(--primary-text);
	}
	.alert-btn--confirm:hover:not(:disabled) {
		background: var(--primary-hover);
	}
	.alert-btn--confirm.danger {
		background: var(--danger);
		border-color: var(--danger);
	}
	.alert-btn--confirm.danger:hover:not(:disabled) {
		background: var(--danger-hover);
	}
	.alert-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid rgba(255, 255, 255, 0.4);
		border-top-color: var(--primary-text);
		border-radius: 50%;
		animation: alert-spin 0.7s linear infinite;
	}
	@keyframes alert-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>

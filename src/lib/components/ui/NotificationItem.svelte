<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Info from '@lucide/svelte/icons/info';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import X from '@lucide/svelte/icons/x';
	import Icon from './Icon.svelte';
	import type { NotificationItem as NotificationItemType } from '../notification';
	import { notificationStore } from '../notification';

	let {
		toast,
		class: cls = '',
		style = '',
	}: {
		toast: NotificationItemType;
		class?: string;
		style?: string;
	} = $props();

	let rootEl = $state<HTMLElement | null>(null);

	// 静止光标不派发 mouseenter：通知滑入时若已落在光标下，需主动检测 :hover 补暂停
	$effect(() => {
		const el = rootEl;
		if (!el || !toast.pauseOnHover || toast.duration <= 0) return;
		requestAnimationFrame(() => {
			if (el.isConnected && el.matches(':hover')) {
				notificationStore.pause(toast.position, toast.id);
			}
		});
	});

	function close() {
		notificationStore.remove(toast.position, toast.id);
	}

	function handleMouseEnter() {
		if (toast.pauseOnHover && toast.duration > 0) {
			notificationStore.pause(toast.position, toast.id);
		}
	}

	function handleMouseLeave() {
		if (toast.pauseOnHover && toast.duration > 0) {
			notificationStore.resume(toast.position, toast.id);
		}
	}

	function handleClick() {
		toast.onClick?.();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="notification notification-{toast.type} {cls}"
	style={style}
	bind:this={rootEl}
	role="alert"
	aria-live="polite"
	onclick={handleClick}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<div class="notification-icon notification-icon-{toast.type}">
		{#if toast.icon}
			<Icon icon={toast.icon} size={24} />
		{:else if toast.type === 'success'}
			<Icon icon={CircleCheck} size={24} />
		{:else if toast.type === 'info'}
			<Icon icon={Info} size={24} />
		{:else if toast.type === 'warning'}
			<Icon icon={AlertTriangle} size={24} />
		{:else}
			<Icon icon={CircleX} size={24} />
		{/if}
	</div>
	<div class="notification-body">
		<span class="notification-title">{toast.title}</span>
		{#if toast.description}
			<span class="notification-desc">{toast.description}</span>
		{/if}
	</div>
	{#if toast.closable}
		<button type="button" class="notification-close" onclick={close} aria-label="关闭">
			{#if toast.closeIcon}
				<Icon icon={toast.closeIcon} size={14} />
			{:else}
				<Icon icon={X} size={14} />
			{/if}
		</button>
	{/if}
	{#if toast.btn}
		<div class="notification-btn">{@render toast.btn()}</div>
	{/if}
	{#if toast.showProgress && toast.duration > 0}
		<div class="notification-progress">
			<div
				class="notification-progress-bar"
				class:paused={toast._paused}
				style="animation-duration: {toast.duration}ms"
			></div>
		</div>
	{/if}
</div>

<style>
	.notification {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--sp-md);
		padding: var(--sp-lg) var(--sp-lg);
		width: var(--notif-width);
		max-width: calc(100vw - 48px);
		border-radius: var(--radius-lg);
		font-size: 14px;
		color: var(--text-strong);
		background-color: var(--notif-bg, var(--surface));
		border: 1px solid var(--border);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06);
		cursor: pointer;
		overflow: hidden;
	}

	.notification-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		color: var(--text-strong);
	}

	.notification-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
	.notification-title { font-weight: 500; word-break: break-word; }
	.notification-desc { font-size: 13px; color: var(--text-muted); line-height: 1.5; word-break: break-word; }

	.notification-btn { display: flex; align-items: center; }

	.notification-close {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2px;
		margin: 0;
		border: none;
		background: none;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: color 0.15s, background-color 0.15s;
	}
	.notification-close:hover { color: var(--text-strong); background-color: var(--hover); }

	.notification-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--border);
		overflow: hidden;
	}
	.notification-progress-bar {
		width: 100%;
		height: 100%;
		background: currentColor;
		opacity: 0.4;
		animation: notif-countdown linear forwards;
		transform-origin: left;
	}
	.notification-progress-bar.paused { animation-play-state: paused; }
	@keyframes notif-countdown {
		from { transform: scaleX(1); }
		to { transform: scaleX(0); }
	}
</style>

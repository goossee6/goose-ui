<script lang="ts">
	import { backOut } from 'svelte/easing';
	import { notificationStore, type NotificationItem as NotificationItemType, type NotificationPosition } from '../notification';
	import NotificationItem from './NotificationItem.svelte';

	let {
		class: cls = '',
		style = '',
	}: {
		class?: string;
		style?: string;
	} = $props();

	const positions: NotificationPosition[] = [
		'top-left', 'top', 'top-right',
		'bottom-left', 'bottom', 'bottom-right',
	];

	const state: Record<NotificationPosition, NotificationItemType[]> = $state({
		'top-left': [], 'top': [], 'top-right': [],
		'bottom-left': [], 'bottom': [], 'bottom-right': [],
	});

	$effect(() => {
		const unsubs = positions.map((p) =>
			notificationStore.subscribe(p, (items) => {
				state[p] = items;
			})
		);
		return () => unsubs.forEach((u) => u());
	});

	const positionMap: Record<NotificationPosition, string> = {
		'top-left':    'top:24px;left:24px;',
		'top':         'top:24px;left:50%;transform:translateX(-50%);',
		'top-right':   'top:24px;right:24px;',
		'bottom-left': 'bottom:24px;left:24px;',
		'bottom':      'bottom:24px;left:50%;transform:translateX(-50%);',
		'bottom-right':'bottom:24px;right:24px;',
	};

	function slideIn(_node: Element, { duration = 300 }: { duration?: number } = {}) {
		return {
			duration,
			easing: backOut,
			css: (t: number, u: number) => `opacity: ${t}; transform: translateY(${u * -12}px);`,
		};
	}

	function slideOut(_node: Element, { duration = 180 }: { duration?: number } = {}) {
		return {
			duration,
			css: (t: number) => `opacity: ${t}; transform: translateX(${(1 - t) * 20}px);`,
		};
	}
</script>

<div class="notification-root {cls}" style={style}>
	{#each positions as pos}
		<div class="nc" style={positionMap[pos]}>
			{#each state[pos] as item (item.id)}
				<div class="ns" in:slideIn out:slideOut>
					<NotificationItem toast={item} />
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.notification-root {
		position: fixed;
		inset: 0;
		z-index: var(--z-notification);
		pointer-events: none;
	}
	.nc {
		position: fixed;
		display: flex;
		flex-direction: column;
		gap: var(--gap-md);
		pointer-events: none;
		max-height: 100vh;
		/* overflow: hidden; */
	}
	.nc > :global(*) { pointer-events: auto; }
	.ns { will-change: transform, opacity; }
</style>

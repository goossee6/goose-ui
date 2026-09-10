<script lang="ts">
	import { onMount } from 'svelte';

	let {
		children,
		speed = 20,
		trigger,
		autoPlay = true,
		onDone,
	}: {
		children: import('svelte').Snippet;
		speed?: number;
		trigger?: unknown;
		autoPlay?: boolean;
		onDone?: () => void;
	} = $props();

	let visible = $state(false);
	let prevTrigger = trigger;

	onMount(() => {
		if (autoPlay) {
			visible = true;
			onDone?.();
		}
	});

	$effect(() => {
		if (trigger !== prevTrigger) {
			prevTrigger = trigger;
			visible = false;
			requestAnimationFrame(() => {
				visible = true;
				onDone?.();
			});
		}
	});
</script>

<div class="typewriter-wrapper" class:visible>
	{@render children()}
</div>

<style>
	.typewriter-wrapper {
		opacity: 0;
		transform: translateY(4px);
		transition: opacity 0.3s ease, transform 0.3s ease;
	}
	.typewriter-wrapper.visible {
		opacity: 1;
		transform: translateY(0);
	}
</style>

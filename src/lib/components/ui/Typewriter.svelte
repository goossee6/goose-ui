<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let {
		text = '',
		children,
		duration = 2000,
		speed,
		trigger,
		autoPlay = true,
		cursor = true,
		onDone,
		class: cls = '',
		style = '',
	}: {
		text?: string;
		children?: Snippet;
		duration?: number;
		speed?: number;
		trigger?: unknown;
		autoPlay?: boolean;
		cursor?: boolean;
		onDone?: () => void;
		class?: string;
		style?: string;
	} = $props();

	let chars: { char: string; visible: boolean }[] = $state([]);
	let mounted = $state(false);
	let prevTrigger = trigger;
	let timer: ReturnType<typeof setInterval> | null = null;
	let charIndex = $state(0);
	let totalChars = $state(0);

	const isTyping = $derived(totalChars > 0 && charIndex < totalChars);

	function startTyping() {
		if (timer) { clearInterval(timer); timer = null; }
		const currentText = text;
		const len = currentText.length;
		totalChars = len;
		charIndex = 0;
		chars = currentText.split('').map(char => ({ char, visible: false }));
		if (len === 0) {
			onDone?.();
			return;
		}
		const interval = speed ?? Math.max(5, duration / len);
		timer = setInterval(() => {
			charIndex++;
			if (charIndex <= len) {
				chars[charIndex - 1].visible = true;
				chars = chars;
			}
			if (charIndex >= len) {
				clearInterval(timer!);
				timer = null;
				onDone?.();
			}
		}, interval);
	}

	onMount(() => {
		mounted = true;
		if (autoPlay && text.length > 0) startTyping();
		return () => { if (timer) clearInterval(timer); };
	});

	$effect(() => {
		if (trigger !== prevTrigger) {
			prevTrigger = trigger;
			startTyping();
		}
	});

	$effect(() => {
		if (mounted && text) startTyping();
	});
</script>

{#if totalChars > 0}
	<span class="tw-text {cls}" style={style} class:tw-cursor={cursor && isTyping}>
		{#each chars as c}{#if c.visible}<span>{c.char}</span>{/if}{/each}{#if cursor && isTyping}<span class="tw-cursor-char">|</span>{/if}
	</span>
{:else if children}
	<div class="tw-fade {cls}" style={style} class:tw-fade--visible={mounted}>
		{@render children()}
	</div>
{/if}

<style>
	.tw-text {
		white-space: pre-wrap;
		word-break: break-word;
		display: inline;
	}
	.tw-cursor {
		cursor: default;
	}
	.tw-cursor-char {
		color: var(--primary, #6366f1);
		font-weight: 300;
		animation: tw-blink 0.8s step-end infinite;
		margin-left: 1px;
	}
	@keyframes tw-blink {
		50% { opacity: 0; }
	}

	.tw-fade {
		opacity: 0;
		transform: translateY(4px);
		transition: opacity 0.3s ease, transform 0.3s ease;
	}
	.tw-fade--visible {
		opacity: 1;
		transform: translateY(0);
	}
</style>

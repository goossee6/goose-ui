<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		orientation = 'horizontal',
		children,
		class: cls = '',
		style = '',
	}: {
		orientation?: 'horizontal' | 'vertical';
		children?: Snippet;
		class?: string;
		style?: string;
	} = $props();

	let toolbarEl = $state<HTMLElement | null>(null);

	function focusables(): HTMLElement[] {
		if (!toolbarEl) return [];
		return [...toolbarEl.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])')];
	}

	function onKeydown(e: KeyboardEvent) {
		const forward = orientation === 'horizontal' ? e.key === 'ArrowRight' : e.key === 'ArrowDown';
		const backward = orientation === 'horizontal' ? e.key === 'ArrowLeft' : e.key === 'ArrowUp';
		if (!forward && !backward) return;
		const els = focusables();
		if (!els.length) return;
		e.preventDefault();
		const idx = els.indexOf(document.activeElement as HTMLElement);
		const next = idx < 0 ? 0 : (idx + (forward ? 1 : -1) + els.length) % els.length;
		els[next].focus();
	}
</script>

<div
	class="toolbar toolbar--{orientation} {cls}"
	role="toolbar"
	tabindex="-1"
	aria-orientation={orientation}
	bind:this={toolbarEl}
	onkeydown={onKeydown}
	style={style}
>
	{@render children?.()}
</div>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		gap: var(--sp-xs);
	}
	.toolbar--horizontal {
		flex-direction: row;
		flex-wrap: wrap;
	}
	.toolbar--vertical {
		flex-direction: column;
		align-items: flex-start;
	}
</style>

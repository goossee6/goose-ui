<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		placement = 'bottom-start',
		title = '',
		onOpenChange,
		trigger,
		children,
		class: cls = '',
		style = '',
	}: {
		open?: boolean;
		placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
		title?: string;
		onOpenChange?: (open: boolean) => void;
		trigger?: Snippet;
		children?: Snippet;
		class?: string;
		style?: string;
	} = $props();

	let rootEl = $state<HTMLElement | null>(null);
	let popEl = $state<HTMLElement | null>(null);
	let flipUp = $state(false);
	let flipX = $state(false);

	function measure() {
		if (!rootEl || !popEl) return;
		const r = rootEl.getBoundingClientRect();
		const h = popEl.offsetHeight;
		flipUp = placement.startsWith('top') ? true : r.bottom + h + 8 > window.innerHeight && r.top - h - 8 > 8;
		flipX = placement.endsWith('end');
		if (flipX && r.left - popEl.offsetWidth < 8) flipX = false;
	}

	function show() {
		open = true;
		onOpenChange?.(true);
		requestAnimationFrame(measure);
	}

	function hide() {
		if (open) onOpenChange?.(false);
		open = false;
	}

	function toggle() {
		open ? hide() : show();
	}

	$effect(() => {
		if (!open) return;
		const onDocDown = (e: MouseEvent) => {
			if (rootEl && !rootEl.contains(e.target as Node)) hide();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				// capture 阶段拦截：阻止冒泡到外层 Modal 的 window Esc 监听（只关本层）
				e.stopPropagation();
				hide();
			}
		};
		const onScroll = () => measure();
		document.addEventListener('mousedown', onDocDown);
		document.addEventListener('keydown', onKey, true);
		window.addEventListener('scroll', onScroll, true);
		window.addEventListener('resize', onScroll);
		return () => {
			document.removeEventListener('mousedown', onDocDown);
			document.removeEventListener('keydown', onKey, true);
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', onScroll);
		};
	});

	function popFade(node: HTMLElement, params: { up: boolean }) {
		return {
			duration: 120,
			css: (t: number) => {
				const y = params.up ? 4 : -4;
				return `opacity: ${t}; transform: translateY(${(1 - t) * y}px);`;
			},
		};
	}
</script>

<div class="popover-root {cls}" bind:this={rootEl} style={style}>
	<button
		type="button"
		class="popover-trigger"
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={toggle}
		onkeydown={(e) => {
			if (e.key === 'ArrowDown' && !open) {
				e.preventDefault();
				show();
			}
		}}
	>
		{@render trigger?.()}
	</button>
	{#if open}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="popover-panel"
			class:flip-up={flipUp}
			class:flip-x={flipX}
			role="dialog"
			tabindex="-1"
			bind:this={popEl}
			transition:popFade={{ up: flipUp }}
		>
			<button type="button" class="popover-close" aria-label="关闭" onclick={hide}>
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
			</button>
			{#if title}
				<div class="popover-title">{title}</div>
			{/if}
			<div class="popover-body">
				{@render children?.()}
			</div>
		</div>
	{/if}
</div>

<style>
	.popover-root {
		position: relative;
		display: inline-block;
	}
	.popover-trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-xs);
		padding: var(--sp-sm) var(--sp-md);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--text);
		font-size: 13px;
		cursor: pointer;
		transition: background-color 0.15s, border-color 0.15s;
	}
	.popover-trigger:hover {
		background: var(--hover);
		border-color: var(--border-strong);
	}
	.popover-trigger:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.popover-panel {
		position: absolute;
		z-index: var(--z-popover);
		top: calc(100% + 8px);
		left: 0;
		min-width: 220px;
		max-width: min(320px, calc(100vw - 16px));
		padding: var(--sp-lg);
		background: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}
	.popover-panel.flip-up {
		top: auto;
		bottom: calc(100% + 8px);
	}
	.popover-panel.flip-x {
		left: auto;
		right: 0;
	}
	.popover-close {
		position: absolute;
		top: var(--sp-sm);
		right: var(--sp-sm);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--text-muted);
		cursor: pointer;
	}
	.popover-close:hover {
		background: var(--hover);
		color: var(--text-strong);
	}
	.popover-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-strong);
		margin-bottom: var(--sp-sm);
		padding-right: var(--sp-xl);
	}
	.popover-body {
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.7;
	}
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		href = '',
		title = '',
		description = '',
		image = '',
		siteName = '',
		disabled = false,
		delay = 400,
		placement = 'top',
		children,
		class: cls = '',
		style = '',
	}: {
		href?: string;
		title?: string;
		description?: string;
		image?: string;
		siteName?: string;
		disabled?: boolean;
		delay?: number;
		placement?: 'top' | 'bottom';
		children?: Snippet;
		class?: string;
		style?: string;
	} = $props();

	let rootEl = $state<HTMLElement | null>(null);
	let cardEl = $state<HTMLElement | null>(null);
	let visible = $state(false);
	let flipUp = $state(true);

	let hoverTimer: ReturnType<typeof setTimeout> | null = null;

	function measure() {
		if (!rootEl || !cardEl) return;
		const r = rootEl.getBoundingClientRect();
		const h = cardEl.offsetHeight;
		// .flip-up 类 = 卡片显示在 anchor 下方（默认 CSS 为上方）
		// placement='top'：默认上方，仅在上方空间不足时翻下
		// placement='bottom'：默认下方，仅在下方空间不足时翻上
		flipUp =
			placement === 'top'
				? r.top - h - 8 < 8
				: !(r.bottom + h + 8 > window.innerHeight);
	}

	function onEnter() {
		if (disabled) return;
		if (hoverTimer) clearTimeout(hoverTimer);
		hoverTimer = setTimeout(() => {
			visible = true;
			requestAnimationFrame(measure);
		}, delay);
	}

	function onLeave() {
		if (hoverTimer) clearTimeout(hoverTimer);
		visible = false;
	}

	function cardFade(node: HTMLElement, params: { up: boolean }) {
		return {
			duration: 120,
			css: (t: number) => {
				const y = params.up ? 4 : -4;
				return `opacity: ${t}; transform: translateX(-50%) translateY(${(1 - t) * y}px);`;
			},
		};
	}

	$effect(() => {
		if (!visible) return;
		// capture 阶段响应 Esc，阻止冒泡到外层 Modal 的 Esc 监听
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				visible = false;
			}
		};
		document.addEventListener('keydown', onKey, true);
		return () => document.removeEventListener('keydown', onKey, true);
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="link-preview-root {cls}"
	bind:this={rootEl}
	onmouseenter={onEnter}
	onmouseleave={onLeave}
	onfocusin={onEnter}
	onfocusout={onLeave}
	style={style}
>
	<a class="link-preview-anchor" {href} class:disabled aria-disabled={disabled || undefined} onclick={(e) => disabled && e.preventDefault()}>
		{@render children?.()}
	</a>
	{#if visible && (title || description || image)}
		<div
			class="link-preview-card"
			class:flip-up={flipUp}
			role="tooltip"
			bind:this={cardEl}
			transition:cardFade={{ up: flipUp }}
		>
			{#if image}
				<img class="link-preview-image" src={image} alt="" loading="lazy" />
			{/if}
			<div class="link-preview-meta">
				{#if siteName}
					<span class="link-preview-site">{siteName}</span>
				{/if}
				{#if title}
					<div class="link-preview-title">{title}</div>
				{/if}
				{#if description}
					<div class="link-preview-desc">{description}</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.link-preview-root {
		position: relative;
		display: inline-block;
	}
	.link-preview-anchor {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}
	.link-preview-anchor.disabled {
		color: var(--text-muted);
		text-decoration: none;
		cursor: not-allowed;
	}
	.link-preview-card {
		position: absolute;
		z-index: var(--z-popover);
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		width: 280px;
		background: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		overflow: hidden;
		pointer-events: none;
	}
	.link-preview-card.flip-up {
		bottom: auto;
		top: calc(100% + 8px);
	}
	.link-preview-image {
		display: block;
		width: 100%;
		height: 140px;
		object-fit: cover;
		background: var(--surface-2);
	}
	.link-preview-meta {
		padding: var(--sp-lg);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.link-preview-site {
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.link-preview-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-strong);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.link-preview-desc {
		font-size: 12px;
		color: var(--text-muted);
		line-height: 1.6;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>

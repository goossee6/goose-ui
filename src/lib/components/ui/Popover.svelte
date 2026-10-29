<script lang="ts">
	import type { Snippet } from 'svelte';
	import { floatingPosition } from './floatingPosition';
	import { menuIn, menuOut } from './menuTransition';
	import { createLayerId, isInsideLayer, layerOwnerOf, registerLayer, unregisterLayer } from './overlayLayer';

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

	// 本层浮层 id：panel 上挂 data-overlay-layer，供「子面板（Select 下拉等）
	// 是否算内部点击」的判断用，见 overlayLayer.ts
	const layerId = createLayerId('popover');

	let rootEl = $state<HTMLElement | null>(null);
	let popEl = $state<HTMLElement | null>(null);
	let flipUp = $state(false);
	let pos = $state({ left: 0, top: 0 });

	// 定位统一走 floatingPosition（视口钳位 + 翻转）；align 由 placement 的 start/end 决定
	function measure() {
		if (!rootEl || !popEl) return;
		const res = floatingPosition(rootEl.getBoundingClientRect(), {
			panelW: popEl.offsetWidth,
			panelH: popEl.offsetHeight,
			gap: 8,
			align: placement.endsWith('end') ? 'end' : 'start',
			prefer: placement.startsWith('top') ? 'top' : 'bottom',
			flip: 'space',
			capHeight: false,
		});
		flipUp = res.flipUp;
		pos = { left: res.left, top: res.top };
	}

	function show() {
		open = true;
		onOpenChange?.(true);
	}

	function hide() {
		if (open) onOpenChange?.(false);
		open = false;
	}

	function toggle() {
		open ? hide() : show();
	}

	$effect(() => {
		if (open && popEl) measure();
	});

	$effect(() => {
		if (!open) return;
		const onDocDown = (e: MouseEvent) => {
			// 面板已 portal 到 body，不再是 rootEl 的后代：既要认自己的面板，
			// 也要认「面板里再弹出来的那一层」（Select 的下拉、DropdownMenu 的菜单
			// 同样 portal 到 body）。不然后者会被当成点了外面，面板先关、子组件
			// 随即卸载，click 压根派发不出去 —— 表现就是「选项点了没反应」。
			if (rootEl && !isInsideLayer(e.target, layerId, [rootEl, popEl])) hide();
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

	/**
	 * 把面板挂到 body。
	 *
	 * 面板是 position:fixed + 视口坐标，但只要它还在某个带 backdrop-filter /
	 * transform / filter 的祖先里，那个祖先就成了 fixed 的包含块：top/left 会被
	 * 当成「相对该祖先」而不是相对视口，面板整体偏移。DataList 的表头为了磨砂底
	 * 有 backdrop-filter，筛选项正好长在表头里，弹窗因此偏到右下（实测 +9/+43px）。
	 * 挂到 body 才真正回到视口坐标。
	 */
	function portal(node: HTMLElement) {
		// 先记下「我是谁弹出来的」，再挂到 body —— 挂走之后祖先链就断了
		const owner = layerOwnerOf(node);
		node.dataset.overlayLayer = layerId;
		registerLayer(layerId, owner);
		document.body.appendChild(node);
		return {
			destroy() {
				unregisterLayer(layerId);
				node.remove();
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
			role="dialog"
			tabindex="-1"
			use:portal
			bind:this={popEl}
			style="left:{pos.left}px;top:{pos.top}px"
			in:menuIn={{ up: flipUp, align: placement.endsWith('end') ? 'end' : 'start' }}
			out:menuOut={{ up: flipUp, align: placement.endsWith('end') ? 'end' : 'start' }}
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
		gap: var(--sp-sm);
		padding: var(--sp-md) var(--sp-lg);
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
		position: fixed;
		z-index: var(--z-dialog);
		min-width: 220px;
		max-width: min(320px, calc(100vw - 16px));
		padding: var(--sp-lg);
		background: var(--popup-surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}
	.popover-close {
		position: absolute;
		top: var(--sp-md);
		right: var(--sp-md);
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
		margin-bottom: var(--sp-md);
		padding-right: var(--sp-lg);
	}
	.popover-body {
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.7;
	}
</style>

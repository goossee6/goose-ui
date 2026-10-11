<script lang="ts">
	import type { Snippet } from 'svelte';
	import PageHeader from './PageHeader.svelte';
	import Separator from './Separator.svelte';
	import {
		pageInConfig,
		pageOutConfig,
		unpinPage,
		runTransition,
		resetScrollOnPageLeave,
		type TransitionRun,
	} from './pageTransitions.js';

	let {
		title = '',
		description = '',
		maxWidth,
		right,
		active = undefined,
		transition = true,
		class: cls = '',
		style = '',
		children,
		footer,
	}: {
		title?: string;
		description?: string;
		/** 内容限宽，如 '800px' */
		maxWidth?: string;
		right?: Snippet;
		/**
		 * keep-alive 模式：由该 prop 控制显隐与进入/离开过渡，页面常驻不卸载。
		 * 不传则配合外层 {#if} 使用，挂载/卸载时自动播放同一套过渡。
		 */
		active?: boolean;
		/** 关闭过渡（嵌套 Page 场景） */
		transition?: boolean;
		class?: string;
		style?: string;
		children?: Snippet;
		/** 页脚：渲染在内容区末尾，随内容滚；内容不足一屏时吸内容区底 */
		footer?: Snippet;
	} = $props();

	let root = $state<HTMLDivElement | undefined>(undefined);
	let prevActive: boolean | undefined = undefined;
	let driver: TransitionRun | null = null;

	function pageIn(node: HTMLElement) {
		if (!transition) return { duration: 0 };
		return pageInConfig(node);
	}

	function pageOut(node: HTMLElement) {
		if (!transition) {
			resetScrollOnPageLeave(node);
			return { duration: 0 };
		}
		return pageOutConfig(node);
	}

	$effect(() => {
		if (active === undefined) return;
		const el = root;
		if (!el) return;
		const first = prevActive === undefined;
		const was = prevActive;
		prevActive = active;

		if (first) {
			el.style.display = active ? '' : 'none';
			return;
		}

		if (active && !was) {
			driver?.cancel();
			driver = null;
			unpinPage(el);
			el.style.display = '';
			if (transition) {
				const run = runTransition(el, pageInConfig(el));
				driver = run;
				run.finished.then(() => {
					if (driver === run) driver = null;
				});
			}
		} else if (!active && was) {
			driver?.cancel();
			driver = null;
			if (transition) {
				const run = runTransition(el, pageOutConfig(el));
				driver = run;
				run.finished.then(() => {
					if (driver !== run) return;
					driver = null;
					el.style.display = 'none';
					unpinPage(el);
				});
			} else {
				resetScrollOnPageLeave(el);
				el.style.display = 'none';
			}
		}
	});
</script>

<div
	bind:this={root}
	class="page {cls}"
	style={maxWidth ? `max-width: ${maxWidth}; ${style}` : style}
	in:pageIn
	out:pageOut
>
	{#if title || description || right}
		<PageHeader {title} {description}>
			{#snippet right()}
				{#if right}{@render right()}{/if}
			{/snippet}
		</PageHeader>
		<Separator />
	{/if}
	<div class="page-body">
		{@render children?.()}
		{#if footer}
			<div class="page-footer">{@render footer()}</div>
		{/if}
	</div>
</div>

<style>
	.page {
		--ph-gap: 0;
		display: flex;
		flex-direction: column;
		min-height: 100%;
		min-width: 0;
		/* 定高约束：flex 列内 header 固定、page-body 成为唯一滚动区；
		   裸壳父级不定高时 100% 退化 auto，由 100dvh 接管（Layout 内该项永不生效） */
		height: 100%;
		max-height: 100dvh;
		padding: var(--page-pad);
		gap: var(--page-gap);
	}
	.page-body {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: var(--page-gap);
		overflow-y: auto;
		overscroll-behavior: contain;
		padding-block: var(--page-gap);
		/* 滚动条贴容器右缘：负边距吃掉页面右 padding，内容右留白由 padding-right 补回 */
		margin-right: calc(-1 * var(--page-pad-r));
		padding-right: var(--page-pad-r);
	}
	.page-body > :global(*) {
		flex-shrink: 0;
	}
	.page-footer {
		margin-top: auto;
	}
</style>

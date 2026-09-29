<script lang="ts">
	import type { Snippet } from 'svelte';
	import PageHeader from './PageHeader.svelte';
	import {
		pageInConfig,
		pageOutConfig,
		unpinPage,
		runTransition,
		type TransitionRun,
	} from './pageTransitions.js';

	let {
		title = '',
		description = '',
		scroll = false,
		maxWidth,
		right,
		active = undefined,
		transition = true,
		class: cls = '',
		style = '',
		children,
	}: {
		title?: string;
		description?: string;
		/** body 整页滚动（默认 false：body 不滚，由页面内部滚动区处理） */
		scroll?: boolean;
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
	} = $props();

	let root = $state<HTMLDivElement | undefined>(undefined);
	let prevActive: boolean | undefined = undefined;
	let driver: TransitionRun | null = null;

	function pageIn(node: HTMLElement) {
		if (!transition) return { duration: 0 };
		return pageInConfig(node);
	}

	function pageOut(node: HTMLElement) {
		if (!transition) return { duration: 0 };
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
				el.style.display = 'none';
			}
		}
	});
</script>

<div
	bind:this={root}
	class="page {cls}"
	class:page--scroll={scroll}
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
	{/if}
	<div class="page-body">
		{@render children?.()}
	</div>
</div>

<style>
	.page {
		--ph-gap: 0;
		display: flex;
		flex-direction: column;
		min-height: 100%;
		min-width: 0;
		padding: var(--page-pad, 16px);
		gap: var(--page-gap, 16px);
	}
	.page-body {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: var(--page-gap, 16px);
	}
	.page--scroll .page-body {
		overflow-y: auto;
		overscroll-behavior: contain;
	}
</style>

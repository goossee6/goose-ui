<script lang="ts">
	import type { Snippet } from 'svelte';
	import PageHeader from './PageHeader.svelte';
	import Separator from './Separator.svelte';
	import { activeTocId, collectToc, type TocItem } from '../toc.js';
	import {
		pageInConfig,
		pageOutConfig,
		unpinPage,
		runTransition,
		resetScrollOnPageLeave,
		type TransitionRun,
	} from './pageTransitions.js';

	/**
	 * 页面容器。
	 *
	 * 结构只有两层，职责分得很开：
	 *
	 *   .page        外框：定高、内边距、进出场过渡，自己不滚动
	 *   └ .page-body 唯一滚动区：页头 + 正文（+ 目录列）
	 *
	 * 页头（`.page-head`）**并入滚动区**并 sticky 吸顶，内容从它下方滚过；
	 * 目录（`.toc`）是同一滚动区里的第二列，只在宽屏出现。
	 * 页内目录的摘取与高亮在 `toc.ts`，这里只负责布局与滚动。
	 */
	let {
		title = '',
		description = '',
		maxWidth,
		right,
		active = undefined,
		transition = true,
		toc = false,
		tocTitle = '本页目录',
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
		/**
		 * 显示页内目录（右侧一列 `--toc-width` 宽的 sticky 目录）。
		 *
		 * 目录内容自动从本页的锚点摘出来，不用手写：
		 * 带 id 的 `h2` / `h3`，或任何带 `data-toc-title` 的元素（`Card`、`PropsTable`
		 * 都支持 `anchor` prop 生成这种锚点）。给容器加 `data-toc-skip` 可排除整段。
		 * 锚点跳转要留出吸顶页头的高度，`.toc-content` 已统一给 `scroll-margin-top`。
		 */
		toc?: boolean;
		/** 目录小标题，传空串则不渲染 */
		tocTitle?: string;
		class?: string;
		style?: string;
		children?: Snippet;
		/** 页脚：渲染在内容区末尾，随内容滚；内容不足一屏时吸内容区底 */
		footer?: Snippet;
	} = $props();

	// ── 进出场过渡 ────────────────────────────────────────────────────────
	//
	// 两条路径共用同一套配置（pageTransitions.js）：
	// · 挂载 / 卸载由 {@html in:pageIn out:pageOut} 驱动，交给 svelte 管理；
	// · keep-alive 由 `active` prop 驱动，手动跑 runTransition 并接管 display，
	//   因为元素不卸载，svelte 的过渡不会自己启动。
	let root = $state<HTMLDivElement | undefined>(undefined);
	let bodyEl = $state<HTMLDivElement | undefined>(undefined);
	/** keep-alive：上一轮的 active 值。undefined = 首次运行 */
	let prevActive: boolean | undefined = undefined;
	/** keep-alive：当前正在跑的那段过渡，切换时用它取消上一段 */
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
			// 首次只对齐显隐，不播过渡 —— 否则页面一进来看一次多余的淡入
			el.style.display = active ? '' : 'none';
			return;
		}

		const start = (config: typeof pageInConfig extends (n: HTMLElement) => infer C ? C : never) => {
			const run = runTransition(el, config);
			driver = run;
			run.finished.then(() => {
				if (driver === run) driver = null;
			});
			return run;
		};

		if (active && !was) {
			driver?.cancel();
			driver = null;
			unpinPage(el);
			el.style.display = '';
			if (transition) start(pageInConfig(el));
		} else if (!active && was) {
			driver?.cancel();
			driver = null;
			if (transition) {
				const run = start(pageOutConfig(el));
				run.finished.then(() => {
					if (driver !== run) return;
					el.style.display = 'none';
					unpinPage(el);
				});
			} else {
				resetScrollOnPageLeave(el);
				el.style.display = 'none';
			}
		}
	});

	// ── 页内目录 ──────────────────────────────────────────────────────────
	//
	// 数据摘取与高亮判定都在 `toc.ts`，这里只做三件与 DOM 生命周期相关的事：
	//
	// 1. 刷新时机：children 渲染完之后才摘得到锚点。首次在 $effect 里跑，
	//    之后靠 MutationObserver 兜住异步渲染（演示按需 import 时 children 晚一帧）。
	//    刷新时先比对内容，没变就不写 state —— 观察器会因高亮 class 自身变化再次触发。
	// 2. 高亮时机：scroll 事件里只登记 rAF，真正计算时只读 getBoundingClientRect，
	//    不在滚动路径上写任何布局属性。
	// 3. 让位高度：吸顶页头的真实高度写进 `--toc-head-h`，供目录的 sticky top 与
	//    锚点的 scroll-margin-top 使用（两者共用这一个实测量）。
	let tocItems = $state.raw<TocItem[]>([]);
	let activeId = $state<string | null>(null);

	$effect(() => {
		if (!toc) return;
		const scroller = bodyEl;
		if (!scroller) return;

		let last: TocItem[] = [];

		const refresh = () => {
			const next = collectToc(scroller);
			const same =
				next.length === last.length &&
				next.every((n, i) => n.id === last[i].id && n.text === last[i].text && n.level === last[i].level);
			if (same) return;
			last = next;
			tocItems = next;
			activeId = next[0]?.id ?? null;
		};

		const mo = new MutationObserver(refresh);
		mo.observe(scroller, { childList: true, subtree: true });

		let raf = 0;
		const onScroll = () => {
			if (raf) return;
			raf = requestAnimationFrame(() => {
				raf = 0;
				activeId = activeTocId(scroller, scroller, last);
			});
		};
		scroller.addEventListener('scroll', onScroll, { passive: true });

		refresh();
		onScroll();

		return () => {
			mo.disconnect();
			scroller.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(raf);
		};
	});

	/** 点目录：滚动而不改 hash —— 改 hash 会把 SPA 路由（#/tab）顶掉 */
	function goTo(e: MouseEvent, id: string) {
		e.preventDefault();
		const el = bodyEl?.querySelector<HTMLElement>(
			`#${id.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`)}`
		);
		if (!el) return;
		// 锚点偏移由 .toc-content 上的 scroll-margin-top 统一给
		el.scrollIntoView({ block: 'start', behavior: 'smooth' });
		activeId = id;
	}

	/**
	 * 量出吸顶页头的真实高度，写进 --toc-head-h。
	 *
	 * 不能写死 calc(--header-height + --page-gap)：--header-height 是「页面之外的
	 * 固定顶栏」锚点，而 .page-head 是页面内部自己渲染的吸顶页头，高度随标题与
	 * 描述折行而变。目录滚起来会被它压住，必须按实测让位。没有页头时整段为 0。
	 */
	$effect(() => {
		if (!toc) return;
		const scroller = bodyEl;
		if (!scroller) return;
		const head = scroller.querySelector<HTMLElement>(':scope > .page-head');

		const apply = () => {
			if (!head) {
				scroller.style.removeProperty('--toc-head-h');
				return;
			}
			// 页头的 margin-bottom 已经承担了「页头 → 正文」的间距，直接加上它，
			// 不再叠加 grid 的 row-gap（否则间距会翻倍）
			const mb = parseFloat(getComputedStyle(head).marginBottom) || 0;
			scroller.style.setProperty('--toc-head-h', `${head.getBoundingClientRect().height + mb}px`);
		};

		apply();
		// 标题换行、描述折行都会改页头高度；只观察页头自身，不碰整个滚动区
		const ro = new ResizeObserver(apply);
		if (head) ro.observe(head);

		return () => {
			ro.disconnect();
			scroller.style.removeProperty('--toc-head-h');
		};
	});
</script>

<!-- 正文与页脚：两条分支共用，避免 children 渲染两遍 -->
{#snippet pageContent()}
	{@render children?.()}
	{#if footer}
		<div class="page-footer">{@render footer()}</div>
	{/if}
{/snippet}

<div
	bind:this={root}
	class="page {cls}"
	style={maxWidth ? `max-width: ${maxWidth}; ${style}` : style}
	in:pageIn
	out:pageOut
>
	<div bind:this={bodyEl} class="page-body" class:page-body--titled={title || description || right}>
		{#if title || description || right}
			<!-- 页头并入滚动区并吸顶：内容从下方滚过，页头半透明磨砂 -->
			<div class="page-head">
				<PageHeader {title} {description}>
					{#snippet right()}
						{#if right}{@render right()}{/if}
					{/snippet}
				</PageHeader>
				<Separator />
			</div>
		{/if}

		{#if toc}
			<!-- 正文的 DOM 必须原地不动（组件实例、bind:this 都挂在这棵子树上），
			     所以只把它包进 .toc-content 充当网格第一列，不套额外包装 -->
			<div class="toc-content">
				{@render pageContent()}
			</div>
			<aside class="toc" aria-label={tocTitle || '页内目录'}>
				<!-- 标题和列表包在同一个 sticky 容器里：只让列表粘的话，
				     标题会先滚走，只剩列表孤零零地贴在下面 -->
				<div class="toc-sticky">
					{#if tocTitle}
						<div class="toc-title">{tocTitle}</div>
					{/if}
					<nav class="toc-nav">
						<ul>
							{#each tocItems as item (item.id)}
								<li class:lvl3={item.level === 3}>
									<a
										href="#{item.id}"
										class="toc-link"
										class:active={activeId === item.id}
										aria-current={activeId === item.id ? 'location' : undefined}
										onclick={(e) => goTo(e, item.id)}
									>{item.text}</a>
								</li>
							{/each}
						</ul>
					</nav>
				</div>
			</aside>
		{:else}
			{@render pageContent()}
		{/if}
	</div>
</div>

<style>
	/* ══ 外框 ══════════════════════════════════════════════════════════════
	   .page 定高 + 内边距 + 过渡，自己**不滚动**；
	   .page-body 是唯一的滚动区。两层分开是为了让页头能吸顶。 */

	/* ph-gap 是 PageHeader 自己用的间距，这里复位 */
	.page {
		--ph-gap: 0;
		display: flex;
		flex-direction: column;
		min-height: 100%;
		min-width: 0;
		/* 定高约束：flex 列内 page-body 成为唯一滚动区；
		   裸壳父级不定高时 100% 退化 auto，由 100dvh 接管（Layout 内该项永不生效） */
		height: 100%;
		max-height: 100dvh;
		padding: var(--page-pad);
	}

	/* ══ 滚动区 ════════════════════════════════════════════════════════════ */

	.page-body {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: var(--page-gap);
		/* 任何子项宽度超出时由本层承担滚动，不让它继续往外传；
		   这是「内容不溢出窗口」的最后一道闸 */
		overflow: auto;
		min-width: 0;
		overscroll-behavior: contain;
		padding-block: var(--page-gap);
		/* 滚动条贴容器右缘：负边距吃掉页面右 padding，内容右留白由 padding-right 补回 */
		margin-right: calc(-1 * var(--page-pad-r));
		padding-right: var(--page-pad-r);
	}
	/* 有页头：顶部内边距清零，页头才能贴到滚动口顶边（sticky 受内容盒约束） */
	.page-body--titled {
		padding-top: 0;
	}
	.page-body > :global(*) {
		flex-shrink: 0;
	}

	/* ══ 吸顶页头 ══════════════════════════════════════════════════════════
	   并入滚动区成为首个子项。负 margin-right + 同值 padding-right 让磨砂底
	   铺到滚动条贴边处。半透明底 + 弱模糊，与 Header / 表格表头 / 下拉 /
	   侧栏同一套视觉。 */
	.page-head {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		flex-direction: column;
		gap: var(--page-gap);
		margin-right: calc(-1 * var(--page-pad-r));
		margin-bottom: var(--page-gap);
		padding-right: var(--page-pad-r);
		background-color: color-mix(in srgb, var(--surface) 80%, transparent);
		backdrop-filter: blur(12px);
	}

	/* ══ 页内目录 ══════════════════════════════════════════════════════════
	   窄屏（< 1100px）目录不出现，正文独占一列；宽屏见文件末尾的媒体查询。
	   布局关键三条：
	   1. 两列是 grid 而不是再套一层滚动容器 —— .page-body 已经是唯一滚动区，
	      套第二层会让里面每个 sticky（页头、表头、目录）多一层坐标重算。
	   2. 内容列 min-width: 0：子项默认 min-width: auto，宽表格会撑破内容列。
	   3. 目录 sticky 的 top 用实测页头高度，别写死像素。 */

	.toc-content {
		display: flex;
		flex-direction: column;
		gap: var(--page-gap);
		flex: 1 1 auto;
		min-width: 0;
		/* 锚点跳转时给吸顶页头让位 —— 三个量要叠加，少一个都会被压住：
		   ① --header-height  页面之外的固定顶栏（Layout 顶栏等，默认 0）
		   ② --toc-head-h     Page 自己渲染的吸顶页头，实测高度（见脚本里的 $effect）
		   ③ 12px             留白，否则标题会紧贴页头下沿
		   --toc-head-h 写在 .page-body 上，这里是继承值；没有页头时未定义，按 0 处理。 */
		--toc-anchor: calc(var(--header-height, 0px) + var(--toc-head-h, 0px) + 12px);
	}
	.toc-content > :global(*) {
		flex-shrink: 0;
	}
	/* 锚点偏移统一由这里给，标题和 data-toc-title 元素都不用自己写 */
	.toc-content :global(:is(h1, h2, h3, h4)[id]),
	.toc-content :global([data-toc-title][id]) {
		scroll-margin-top: var(--toc-anchor);
	}

	.toc {
		display: none;
		width: var(--toc-width);
		flex-shrink: 0;
		font-size: 13px;
		/* 目录列给吸顶页头让位的总高度。页头是 .page-body 的首个子项且 sticky，
		   所以目录自己的 sticky 顶边必须落在页头下缘之外，否则滚起来被压住一半。
		   优先用脚本量出的真实页头高度（有页头 ≈ 页头高 + --page-gap，无页头 = 0），
		   量不到时退回全局锚点 --header-height（固定顶栏场景）。 */
		--toc-sticky-top: var(--toc-head-h, calc(var(--header-height, 0px) + var(--page-gap)));
	}

	.toc-title {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-muted);
		/* 与列表的间距由 .toc-sticky 的 gap 统一给 */
		flex-shrink: 0;
	}

	/* 标题 + 列表一起粘住：整块贴到页头下缘。只让列表 sticky 的话标题会先滚走 */
	.toc-sticky {
		position: sticky;
		top: var(--toc-sticky-top);
		/* 高度上限扣掉让位量，目录底部不会滑出可视区 */
		max-height: min(var(--toc-max-h), calc(100vh - var(--toc-sticky-top) - 16px));
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.toc-nav {
		/* 列表在 sticky 容器内部滚动，标题始终可见；滚动条不占正文宽度 */
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
	}

	.toc-nav ul {
		list-style: none;
		margin: 0;
		padding: 0;
		/* 左侧竖线：当前项用一条同位置的实线盖住，视觉上就是「指示条在滑动」 */
		border-left: 1px solid var(--border);
	}

	.toc-link {
		display: block;
		padding: 5px 0 5px var(--toc-indent);
		/* 往左移 1px 盖住 ul 的左边框 */
		margin-left: -1px;
		border-left: 1px solid transparent;
		color: var(--text-muted);
		text-decoration: none;
		line-height: 1.4;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: color 0.15s, border-color 0.15s;
	}
	/* 三级条目多缩进一级，但共用同一条竖线；选中时颜色比二级轻，靠缩进区分层级 */
	.toc-nav li.lvl3 > .toc-link {
		padding-left: calc(var(--toc-indent) * 2);
		font-size: 12px;
	}
	.toc-link:hover,
	.toc-link.active {
		color: var(--text);
	}
	.toc-link.active {
		border-left-color: var(--accent);
	}

	/* ══ 宽屏两列 ══════════════════════════════════════════════════════════
	   必须是 grid 而不是 flex：flex 的 align-items: flex-start 会让目录列只有
	   内容高，sticky 没有可滑动的余量；grid 默认 stretch，目录列与正文列同高，
	   列表才能一路粘在可视区顶部。列宽用 minmax(0, 1fr) 而不是 1fr ——
	   grid 子项默认 min-width: auto，宽表格会把正文列撑破、把目录挤出去。 */
	@media (min-width: 1100px) {
		.page-body:has(> .toc) {
			display: grid;
			grid-template-columns: minmax(0, 1fr) var(--toc-width);
			align-items: stretch;
			gap: var(--page-gap);
		}
		/* 页头横跨两列，吸顶逻辑不变 */
		.page-body:has(> .toc) > .page-head {
			grid-column: 1 / -1;
		}
		/* 正文列居中并限宽。
		   为什么限宽放在网格列上而不是 .toc-content 自己：.toc-content 是网格子项，
		   它上面的 `width: 100%` 量的是自己那一列；再叠加 margin-inline: auto 会被
		   挤窄，而里面标题/卡片写的 `max-width: 100%` 又是相对被挤窄后的宽度算 ——
		   越缩越窄且各元素宽度不一致，看起来就是「标题没居中」。
		   放在列上：列宽由 minmax(0, 1fr) 定死，子项的 100% 都对着同一个数，
		   标题、卡片、Props 表的左右边缘自然齐平。
		   不用 justify-items: center —— 那会让子项按内容宽收缩，正文不再撑满。 */
		.page-body:has(> .toc) > .toc-content {
			width: 100%;
			max-width: var(--page-content-max, 1080px);
			margin-inline: auto;
			min-width: 0;
		}
		.toc {
			display: block;
			/* 让目录列自己成为滚动余量的容器：sticky 需要祖先有高度余量 */
			align-self: stretch;
			min-height: 0;
		}
	}

	/* ══ 页脚 ══════════════════════════════════════════════════════════════
	   内容不足一屏时吸底，超出时随内容滚。 */
	.page-footer {
		margin-top: auto;
	}
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';

	/* 纯布局外壳：只提供「顶栏 / 可选侧栏 / 内容卡片」三个区域，
	   不内置 TitleBar、Sidebar 等组件，由使用方自行组合。 */
	let {
		titlebar,
		aside,
		children,
		scroll = true,
		resize = false,
		framed = true,
		class: cls = '',
		style = '',
	}: {
		/** 顶部区域（通常放 TitleBar） */
		titlebar?: Snippet;
		/** 左侧区域（通常放 Sidebar；省略则不渲染，内容区占满整宽） */
		aside?: Snippet;
		/** 内容区 */
		children?: Snippet;
		/** 内容卡片整页滚动；false = 框架不滚、页内滚动区自理 */
		scroll?: boolean;
		/** Wails 窗口支持：全域拖拽调整 + 四角手柄（浏览器环境无效果） */
		resize?: boolean;
		/**
		 * 内容区是否画成卡片（边框 / 圆角 / 底色），默认 true。
		 *
		 * 传 false 得到一块「裸容器」：适合首页这类要把背景铺满整窗、或者内容
		 * 自己画分区的场景。以前这类需求只能靠 `:global(.layout-content)`
		 * 加一串 `!important` 把卡片剥掉 —— 那是使用方不该写的样式，
		 * 也会在升级时随内部类名一起失效。
		 *
		 * 内边距与 `--layout-pad-x` 不跟着变：那是 `Page` / 吸顶 `Header`
		 * 对齐的依据，剥掉会让页头错位。
		 */
		framed?: boolean;
		class?: string;
		style?: string;
	} = $props();
</script>

<div class="layout {cls}" class:layout--resize={resize} style={style}>
	{#if titlebar}
		<div class="layout-titlebar">
			{@render titlebar()}
		</div>
	{/if}
	<div class="layout-body">
		{#if aside}
			<aside class="layout-aside">
				{@render aside()}
			</aside>
		{/if}
		<main class="layout-content" class:layout-content--fixed={!scroll} class:layout-content--plain={!framed}>
			{@render children?.()}
		</main>
		{#if resize}
			<div class="layout-handle layout-handle-tl"></div>
			<div class="layout-handle layout-handle-tr"></div>
			<div class="layout-handle layout-handle-bl"></div>
			<div class="layout-handle layout-handle-br"></div>
		{/if}
	</div>
</div>

<style>
	.layout {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: var(--background, var(--bg, #fff));
	}
	.layout--resize {
		--wails-resize: all;
	}
	.layout-titlebar {
		flex-shrink: 0;
	}
	/* 栏间距和四周边距分开由两条规则各自负责，不再靠子元素"往外留白"叠加：
	   gap 只在有相邻兄弟时生效，侧栏不渲染时不会凭空多出左留白。 */
	.layout-body {
		position: relative;
		flex: 1;
		display: flex;
		gap: var(--space-2);
		padding: 0 var(--space-2) var(--space-2);
		min-height: 0;
	}
	.layout-aside {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		width: max-content;
		background: transparent;
		padding: 0;
		overflow-y: auto;
		overflow-x: hidden;
	}
	.layout-content {
		/* 页面只留左右留白：上下由 Page 自己清零（padding-block: 0），
		   所以镜像给 Header 的 --layout-pad-y 也必须是 0 —— 否则 Header 的
		   负 margin 会把吸顶条往上拽出滚动口，顶部被裁掉一截。 */
		--page-pad: var(--layout-pad-x);
		--layout-pad-y: 0px;
		--layout-pad-x: 24px;
		position: relative;
		flex: 1;
		min-width: 0;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 0;
		margin: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface, var(--bg));
	}
	.layout-content--fixed {
		overflow: hidden;
	}
	/* 无卡片模式（framed=false）：只当容器用，不画边框 / 圆角 / 底色。
	   放在 .layout-content 之后 —— 同特异性、后写者胜，不需要 !important。
	   内边距与 --layout-pad-x 刻意不动：Page 的留白和吸顶 Header 的反向
	   margin 都靠它，一改页头就错位。 */
	.layout-content--plain {
		border: none;
		border-radius: 0;
		background: transparent;
	}
	/* 内容区装的是 Page 时，外框不再承担滚动：Page 的 .page-body 才是滚动区，
	   它的溢出全部落在自己身上，外框这一层滚不到任何东西。
	   反过来留着 auto 会出事：页面切换的 fly 过渡把整页上下平移 24px，平移后
	   盒子的底边伸到外框之外，外框就会为这 24px 临时长出一条滚动条，过渡结束
	   再收回去 —— 表现是「切换页面时闪出第二条滚动条，然后消失，页面横跳」。
	   实测（真实 Chrome）：外框 gutter 2px → 12px → 2px，正文宽度跟着变 10px。
	   用 :global 是因为 .page 属于 Page 组件，不在 Layout 的样式作用域内。 */
	.layout-content:has(> :global(.page)) {
		overflow: hidden;
	}

	/* ── Wails 四角 resize 手柄 ─────────────────────────────────────────── */
	.layout-handle {
		position: fixed;
		z-index: var(--z-max);
		width: 6px;
		height: 6px;
	}
	.layout-handle-tl {
		top: 0;
		left: 0;
		--wails-resize: top-left;
		cursor: nwse-resize;
	}
	.layout-handle-tr {
		top: 0;
		right: 0;
		--wails-resize: top-right;
		cursor: nesw-resize;
	}
	.layout-handle-bl {
		bottom: 0;
		left: 0;
		--wails-resize: bottom-left;
		cursor: nesw-resize;
	}
	.layout-handle-br {
		bottom: 0;
		right: 0;
		--wails-resize: bottom-right;
		cursor: nesw-resize;
	}
</style>

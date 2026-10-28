<script lang="ts" module>
	/** 标题栏搜索框的候选项（与 Command 的 CommandItem 同形） */
	export interface TitleBarSearchItem {
		value: string;
		label: string;
		group?: string;
		keywords?: string;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Minus from '@lucide/svelte/icons/minus';
	import Square from '@lucide/svelte/icons/square';
	import X from '@lucide/svelte/icons/x';
	import Icon from './Icon.svelte';
	import PillTrack from './PillTrack.svelte';
	import Tooltip from './Tooltip.svelte';

	/**
	 * 窗口控制抽象：库不依赖任何桌面 runtime。
	 * Wails3 使用者把 @wailsio/runtime 的 Window 包成该接口传入（见 demo 的 TitleBar 页）。
	 */
	export interface WindowController {
		isMaximised(): Promise<boolean> | boolean;
		minimise(): void;
		toggleMaximise(): Promise<void> | void;
		close(): void;
	}

	let {
		title = '',
		logo,
		subtitle,
		theme = 'light',
		onThemeToggle,
		controls,
		windowControls = true,
		windowApi,
		searchable = false,
		searchItems = [],
		searchPlaceholder = '搜索…',
		searchEmptyText = '无匹配结果',
		onSearchSelect,
		class: cls = '',
		style = '',
	}: {
		title?: string;
		logo?: string | Component<{ size?: number; class?: string }>;
		subtitle?: string;
		theme?: 'light' | 'dark';
		onThemeToggle?: (e: MouseEvent) => void;
		/** 自定义按钮区 snippet（渲染在主题键之前，与默认键共存） */
		controls?: Snippet;
		/** false 不渲染默认窗口三键（如浏览器环境） */
		windowControls?: boolean;
		/** 窗口控制实现。未传时三键渲染为禁用（纯浏览器预览）；
		 *  Wails3：传入包好 @wailsio/runtime Window 的适配器 */
		windowApi?: WindowController;
		/** 显示内联搜索框（默认 false 不显示）。开启后输入即出下拉结果，
		 *  ↑↓ 移动、Enter 选中、Esc 关闭 */
		searchable?: boolean;
		/** 搜索候选项 */
		searchItems?: TitleBarSearchItem[];
		searchPlaceholder?: string;
		searchEmptyText?: string;
		/** 选中回调（选中后自动收起下拉） */
		onSearchSelect?: (item: TitleBarSearchItem) => void;
		class?: string;
		style?: string;
	} = $props();

	const logoText = $derived(typeof logo === 'string' ? logo : logo === undefined ? title : '');

	let isMaximised = $state(false);

	$effect(() => {
		const api = windowApi;
		if (!api) return;
		let alive = true;
		void Promise.resolve(api.isMaximised()).then((m) => {
			if (alive) isMaximised = m;
		});
		return () => {
			alive = false;
		};
	});

	function handleMinimise() {
		// 环境守卫：未注入 windowApi（纯浏览器/介绍预览）时点击无副作用，UI 三键在所有环境保持同样观感
		if (!windowApi) return;
		windowApi.minimise();
	}

	async function handleMaximise() {
		if (!windowApi) return;
		const api = windowApi;
		await api.toggleMaximise();
		isMaximised = await api.isMaximised();
	}

	function handleClose() {
		if (!windowApi) return;
		windowApi.close();
	}

	/* ── 内联搜索（searchable=false 时整块不渲染，组件行为与从前完全一致） ── */
	let searchEl = $state<HTMLInputElement | null>(null);
	/** 下拉列表容器：PillTrack 的测量参照 + hover 事件挂载点 */
	let searchListEl = $state<HTMLUListElement | null>(null);
	let query = $state('');
	let activeIndex = $state(0);
	let searchOpen = $state(false);

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return searchItems;
		return searchItems.filter(
			(it) =>
				!it.disabled &&
				(it.label.toLowerCase().includes(q) ||
					(it.keywords ?? '').toLowerCase().includes(q) ||
					it.value.toLowerCase().includes(q))
		);
	});

	const searchGroups = $derived.by(() => {
		const map = new Map<string, TitleBarSearchItem[]>();
		for (const it of filtered) {
			const g = it.group ?? '';
			if (!map.has(g)) map.set(g, []);
			map.get(g)!.push(it);
		}
		return [...map.entries()];
	});

	function showSearch() {
		searchOpen = true;
		activeIndex = 0;
	}

	// reset 为 true 时连输入一起清掉（选中项后收尾）；Esc 只收起下拉，保留已输入的词
	function hideSearch(reset = false) {
		searchOpen = false;
		activeIndex = 0;
		if (reset) query = '';
	}

	function pickSearch(idx: number) {
		const it = filtered[idx];
		if (!it || it.disabled) return;
		hideSearch(true);
		searchEl?.blur();
		onSearchSelect?.(it);
	}

	function onSearchKeydown(e: KeyboardEvent) {
		// Esc / ↑↓ / Enter 只在打开下拉时拦截，避免影响宿主页面的快捷键
		if (e.key === 'Escape') {
			if (!searchOpen) return;
			e.stopPropagation();
			hideSearch();
			searchEl?.blur();
		} else if (e.key === 'ArrowDown') {
			if (!searchOpen || !filtered.length) return;
			e.preventDefault();
			activeIndex = (activeIndex + 1) % filtered.length;
		} else if (e.key === 'ArrowUp') {
			if (!searchOpen || !filtered.length) return;
			e.preventDefault();
			activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
		} else if (e.key === 'Enter') {
			if (!searchOpen) return;
			e.preventDefault();
			pickSearch(Math.min(activeIndex, filtered.length - 1));
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="titlebar {cls}" style={style} ondblclick={handleMaximise}>
	<div class="titlebar-left">
		{#if logo !== undefined && typeof logo !== 'string'}
			<span class="titlebar-logo-icon">
				<Icon icon={logo} size={18} />
			</span>
			<div class="titlebar-subtitle">{subtitle ?? title}</div>
		{:else}
			{#if logoText}
				<div class="titlebar-title titlebar-logo">{logoText}</div>
			{/if}
			{#if subtitle}
				<div class="titlebar-subtitle">{subtitle}</div>
			{/if}
		{/if}
	</div>
	<!-- 搜索居中：绝对定位到 titlebar 自身，左右两侧内容宽度变化不影响它 -->
	{#if searchable}
		<div class="titlebar-search-wrap">
			<!-- 内联搜索：--wails-draggable 关掉，否则 Wails 下输入框会被窗口拖拽吃掉 -->
			<!-- onfocusout 用 relatedTarget 判断焦点是否离开整块搜索区（含下拉）：
			     比 window 上挂 click 更省，不需要 onMount/onDestroy 和事件清理，
			     也不会在组件卸载后残留监听。候选行用 onmousedown 选中，早于 blur，不受影响。 -->
			<div
				class="titlebar-search"
				onfocusout={(e) => {
					if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hideSearch();
				}}
			>
				<svg
					class="titlebar-search-icon"
					width="13"
					height="13"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.3-4.3" />
				</svg>
				<input
					bind:this={searchEl}
					class="titlebar-search-input"
					type="text"
					placeholder={searchPlaceholder}
					bind:value={query}
					onfocus={showSearch}
					onkeydown={onSearchKeydown}
					role="combobox"
					aria-expanded={searchOpen}
					aria-controls="titlebar-search-list"
					aria-autocomplete="list"
					aria-activedescendant={searchOpen && filtered[activeIndex]
						? `titlebar-search-opt-${activeIndex}`
						: undefined}
				/>
				{#if searchOpen && query}
					<button
						type="button"
						class="titlebar-search-clear"
						aria-label="清空搜索"
						onmousedown={(e) => {
							e.preventDefault();
							query = '';
							activeIndex = 0;
							searchEl?.focus();
						}}
					>
						<Icon icon={X} size={12} />
					</button>
				{/if}
				{#if searchOpen}
					<ul class="titlebar-search-list" id="titlebar-search-list" role="listbox" bind:this={searchListEl}>
						<!-- 只给 activeSelector，不传 itemSelector：行的 onmouseenter 会把
						     activeIndex 设成该行，sel pill 自己滑过去就完成了 hover 反馈。
						     再传 itemSelector 会让 hover pill 叠到同一行，同色画两遍 → 双重底色。
						     单 pill → 主题色实心（与 Select / 下拉菜单同一套）。 -->
						<PillTrack
							container={searchListEl}
							activeSelector=".titlebar-search-item.active"
							background="var(--primary)"
							radius="var(--radius-md)"
						/>
						{#if !filtered.length}
							<li class="titlebar-search-empty" role="presentation">{searchEmptyText}</li>
						{/if}
						{#each searchGroups as [group, list] (group)}
							{#if group}
								<li class="titlebar-search-group" role="presentation">{group}</li>
							{/if}
							{#each list as it (it.value)}
								{@const i = filtered.indexOf(it)}
								<li
									class="titlebar-search-item"
									class:active={i === activeIndex}
									id="titlebar-search-opt-{i}"
									role="option"
									aria-selected={i === activeIndex}
									onmousedown={(e) => {
										e.preventDefault();
										pickSearch(i);
									}}
									onmouseenter={() => (activeIndex = i)}
								>
									<span>{it.label}</span>
									{#if it.value !== it.label}
										<span class="titlebar-search-value">{it.value}</span>
									{/if}
								</li>
							{/each}
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
	<div class="titlebar-controls">
		{#if controls}
			{@render controls()}
		{/if}
		{#if onThemeToggle}
			<Tooltip title={theme === 'dark' ? '浅色模式' : '深色模式'} placement="bottom">
				<button type="button" class="win-btn" onclick={onThemeToggle} aria-label={theme === 'dark' ? '浅色模式' : '深色模式'}>
					<Icon icon={theme === 'dark' ? Sun : Moon} size={14} />
				</button>
			</Tooltip>
		{/if}
		{#if windowControls}
			<Tooltip title="最小化" placement="bottom">
				<button type="button" class="win-btn" onclick={handleMinimise} aria-label="最小化">
					<Icon icon={Minus} size={14} />
				</button>
			</Tooltip>
			<Tooltip title={isMaximised ? '还原' : '最大化'} placement="bottom">
				<button type="button" class="win-btn" onclick={handleMaximise} aria-label={isMaximised ? '还原' : '最大化'}>
					<Icon icon={Square} size={12} />
				</button>
			</Tooltip>
			<Tooltip title="关闭" placement="bottom">
				<button type="button" class="win-btn win-btn-close" onclick={handleClose} aria-label="关闭">
					<Icon icon={X} size={16} />
				</button>
			</Tooltip>
		{/if}
	</div>
</div>

<style>
	.titlebar {
		--wails-draggable: drag;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		/* 三段之间的最小间距：搜索框自适应伸缩到极限时，
		   也不会贴到 logo 或窗口键上（三段的「不互相影响」由 gap 兜底，
		   而不是靠各段自己的 margin —— 中间的搜索段是唯一的弹性段）。 */
		gap: 12px;
		/* 作为容器查询容器，让 .titlebar-search 的 max-width:40cqw 以
		   「整条标题栏宽度」为参照 —— 40% 指的是标题栏的 40%。
		   放在这里而不是 .titlebar-search-wrap：wrap 是弹性段，它自身宽度
		   由搜索框倒推，拿它当参照会把「搜索框宽度」和「参照物宽度」耦合
		   成同一个量，比例失去意义。
		   命名 bar：下面 wrap 也是容器（服务 @container 隐藏规则），
		   两个同类容器并存，靠名字让 cqw 明确指向本层。 */
		container: titlebar / inline-size;
		height: var(--titlebar-h);
		min-height: var(--titlebar-h);
		padding: 0 0 0 16px;
		background: transparent;
		user-select: none;
	}

	.titlebar-left {
		display: flex;
		align-items: baseline;
		gap: 12px;
		/* 标题/副标题过长时自身省略号收缩，不挤压搜索段与窗口键 */
		flex: 0 1 auto;
		min-width: 0;
		overflow: hidden;
	}

	.titlebar-title {
		font-size: 12px;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		pointer-events: none;
	}

	.titlebar-logo {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-strong);
		/*
		 * 品牌渐变（统一为 主色 -30° → +30°，见 theme.css 的 --gradient-accent）
		 * + 高光条自左上向右下斜扫。
		 * 两层背景全部被 background-clip:text 裁进笔画（注意：不可加 background-blend-mode，
		 *   它与 clip:text 同用会让背景整体不渲染——Chromium 已知行为）。
		 *   第 1 层  高光条：135deg（左上→右下），白 55%→90%→55%，no-repeat
		 *   第 2 层  品牌渐变：引用 theme.css 预解析的 --titlebar-logo-gradient
		 *
		 * 高光条单独提成局部变量 --logo-shine：hover 只换第 2 层，
		 * 第 1 层的同一串渐变得照抄一遍，改一处忘一处很容易漏。
		 *
		 * 斜向扫过的几何（按 logo 约 64×24 计算，改动尺寸需重算这两个数）：
		 *   135deg 的渐变轴长 = (图宽+图高)×0.707；background-size:250% 时图 160×60 → 轴长 156px。
		 *   高光带占轴长 40%→60% = 31px 宽；logo 的对角投影 = (64+24)×0.707 = 62px。
		 *   带沿轴需走 62+31 = 93px；background-position 100%→0% 的对角位移
		 *   = (96+36)/1.414 = 93px —— 恰好一次完整扫过，无空转。
		 *   斜带只沿渐变轴平移才可见；垂直轴方向的位移是无效的（条纹沿自身方向不变）。
		 * 注意：这里刻意不用 var(--titlebar-logo-gradient, ...) 回退写法 ——
		 * var() 回退值中出现任何 var()（哪怕一层渐变引用一个自定义属性）都会让
		 * 整条 background 在计算值阶段失效 → background-image:none → logo 隐形。
		 * 想换品牌渐变，覆盖 :root 上的 --gradient-accent（或旧名 --titlebar-logo-gradient）即可。
		 */
		--logo-shine: linear-gradient(
			135deg,
			transparent 40%,
			rgba(255, 255, 255, 0.55) 47%,
			rgba(255, 255, 255, 0.9) 50%,
			rgba(255, 255, 255, 0.55) 53%,
			transparent 60%
		);
		background-image: var(--logo-shine), var(--titlebar-logo-gradient);
		background-repeat: no-repeat, no-repeat;
		background-size: 250% 250%, 100% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: titlebar-logo-shine 5s linear infinite;
	}

	/* hover：整条渐变提亮一档（--gradient-accent-hover，色相不变） */
	.titlebar:hover .titlebar-logo {
		background-image: var(--logo-shine), var(--titlebar-logo-gradient-hover);
	}

	@keyframes titlebar-logo-shine {
		/*
		 * 必须 x/y 同时位移：斜条纹只沿渐变轴平移才可见，沿垂直于轴的方向移动是无效的
		 * （条纹在自身方向上是均匀的）。100%→0% 让图向右下移动 = 高光自左上掠向右下。
		 * 位移 0%→100% 的两端恰好是光带刚出/刚进的临界点，故循环接缝不可见。
		 */
		from {
			background-position:
				 100% 100%,
				0% 0%;
		}
		to {
			background-position:
				-200% -200%,
				0% 0%;
		}
	}

	/* 用户偏好减少动效时回到静态品牌渐变（颜色仍随主题色相） */
	@media (prefers-reduced-motion: reduce) {
		.titlebar-logo {
			animation: none;
			background-image: var(--titlebar-logo-gradient);
			-webkit-background-clip: text;
			background-clip: text;
		}
		/* 这条必须写在媒体查询里：上面 .titlebar:hover 选择器更重，
		   不覆盖回来时静音模式下 hover 会凭空多出一条静止的白色高光带 */
		.titlebar:hover .titlebar-logo {
			background-image: var(--titlebar-logo-gradient-hover);
		}
	}

	.titlebar-logo-icon {
		display: flex;
		align-items: center;
		align-self: center;
		color: var(--titlebar-logo-color, var(--primary, #3b82f6));
		pointer-events: none;
	}

	.titlebar-subtitle {
		font-size: 12px;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		pointer-events: none;
	}

	.titlebar-controls {
		--wails-draggable: no-drag;
		display: flex;
		align-items: center;
		/* 窗口键是固定尺寸的刚体：绝不参与收缩，否则窄窗口下关闭键会被压扁 */
		flex: 0 0 auto;
	}

	/* ── 内联搜索（flex 自适应） ────────────────────────────────────────
	 * 布局：.titlebar 是 flex + space-between 的三段式（左 / 中 / 右），三段间有 12px gap。
	 *   .titlebar-search-wrap 作为中间那段，是唯一的弹性段（flex:1 1 auto）：
	 *   两侧是 flex:0 0 auto 的刚体，所以剩余空间全部归搜索段，
	 *   搜索框伸缩时既不推挤也不压迫左右两侧。
	 *   min-width:0 是关键 —— 没有它，弹性段的 min-width 默认取内容宽度，
	 *   窄窗口下会撑破容器把窗口键顶出去。它自身 flex 居中，
	 *   所以搜索框始终落在标题栏中点。
	 * 宽度：不写固定 width，也没有像素级的 min/max 区间。搜索框由可用空间决定：
	 *   宽窗口下它跟随标题栏一起变宽（上限为标题栏宽度的 40%），
	 *   窄窗口下它收窄到 0 并隐藏。
	 * 下拉锚在 .titlebar-search 上（position:relative），right:0 让 280px 的
	 *   面板向左侧展开 —— 居中的输入框左右都有余量，不会顶出窗口。 */
	.titlebar-search-wrap {
		--wails-draggable: no-drag;
		display: flex;
		align-items: center;
		justify-content: center;
		/* 唯一的弹性段：只吸收剩余空间，两侧刚体不受影响 */
		flex: 1 1 auto;
		min-width: 0;
		height: 100%;
		/* 注意：这里不能写 overflow:hidden。
		   .titlebar-search-list 是绝对定位面板，锚在 .titlebar-search 下方，
		   而本段只有 42px 高 —— 一旦裁切，整个 320px 的下拉会被裁光：
		   computed style 看着一切正常（display:block / opacity:1 / z-index:3000），
		   但 elementsFromPoint 里根本找不到它，既点不到也没有 hover。
		   （曾误以为是 .titlebar-search 自己的 overflow:hidden，实测那是干扰项。）
		   窄宽度下搜索框收到 0 的保护改由 .titlebar-search 的 min-width:0
		   与 @container 隐藏规则承担，不依赖这里的裁切。 */
		/* 注意：这里刻意不声明 container-type。
		   .titlebar-search 的 max-width:40cqw 需要参照「标题栏」宽度，
		   而 cqw 永远取最近的 query container —— 一旦本段成为容器，
		   参照物就变成弹性段自身（宽度由搜索框倒推），比例会自指失效。
		   所以容器只留在 .titlebar 那一层。 */
	}

	.titlebar-search {
		--wails-draggable: no-drag;
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		/* 自适应：只吸收 .titlebar-search-wrap 给的空间，没有像素级的 min/max 区间。
		   flex-basis:auto 时基准是内容宽度，输入框自身有 size 属性会把它顶大，
		   所以基准取 0，让 flex-grow 从零开始分配剩余空间。
		   min-width 必须是 0：没有它 min-width:auto 会退化成内容宽度，
		   窄窗口下搜索框撑破容器、把窗口键顶出去。 */
		flex: 1 1 0;
		width: auto;
		min-width: 0;
		/* 宽度上限按比例：40cqw = 最近的 inline-size 容器宽度的 40%，
		   即整条标题栏的 40%（容器命名 titlebar，指向 .titlebar 那一层）。
		   用 cqw 而非 %：% 按包含块（wrap，弹性段自身宽度）解析，那会把
		   「搜索框宽度」与「参照物宽度」耦合起来，比例失去意义。 */
		max-width: 40cqw;
		/* 高度 36px：标题栏默认 42px，上下各留 3px 余量。
		   超过这条线会挤没上下间隙，改大前先确认 --titlebar-h 也一起调。 */
		height: 36px;
		padding: 0 8px;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		/* 常态透明：搜索框是标题栏的浮层控件，不参与标题栏的分块排版。
		   边框 + 放大镜 + 占位文字已经说清「这里能点」，再压一块 --surface-2
		   只会让 42px 高的标题栏凭空多出一个灰块。 */
		background: transparent;
		color: var(--text-muted);
		/* 这里绝对不能写 overflow:hidden。
		   .titlebar-search-list 是本元素的绝对定位子元素，而本元素 position:relative
		   就是它的包含块 —— 于是裁切真实生效，整个 320px 的面板被裁到
		   36px 的搜索框内。表现极具迷惑性：computed style 全部正常
		   （display:block / opacity:1 / z-index:3000 / 无 clip-path），
		   但 elementsFromPoint 里找不到它，候选项既点不到也没有 hover，
		   看起来像「被后面的卡片盖住」，其实是根本没被绘制。
		   文字的溢出裁切交给 .titlebar-search-input 自己负责。 */
		/* 动效统一走这一条 transition，避免各伪类各自声明时长导致不同步。
		   只列真正会变的属性：背景/边框/文字色 + 聚焦辉光扩散。 */
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			box-shadow 0.2s ease,
			color 0.15s ease;
	}
	/* hover：底色提亮到 --hover，边框收到 --border-strong，文字转强。
	   不用 transform 放大 —— 标题栏是固定 42px 高的刚体，缩放会让
	   36px 的搜索框在视觉上顶破上下 3px 余量。
	   底色是「从透明浮起来」的第一个台阶：常态 invisible → hover 浅灰 →
	   聚焦仅剩主色边框与辉光（见下），互相区分得开。 */
	.titlebar-search:hover {
		background: var(--hover);
		border-color: var(--border-strong);
		color: var(--text-strong);
	}
	/* 聚焦：底色回到透明，只靠主色边框 + 一圈柔和辉光表态。
	   刻意不再用 hover 的 --hover 底色：hover 与聚焦同时成立时两者同色，
	   用户就看不出「已聚焦、正在输入」。辉光用 color-mix 跟着主题色走。 */
	.titlebar-search:focus-within {
		border-color: var(--primary);
		background: transparent;
		color: var(--text-strong);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 22%, transparent);
	}
	/* 放大镜：hover / 聚焦时轻微提色并放大，给「可以输入」一点暗示。
	   transform-origin 定在中心，缩放不会把图标挤出左内边距。 */
	.titlebar-search-icon {
		flex: 0 0 auto;
		transition: transform 0.2s ease, color 0.15s ease;
		transform-origin: center;
	}
	.titlebar-search:hover .titlebar-search-icon {
		color: var(--primary);
		transform: scale(1.12);
	}
	.titlebar-search:focus-within .titlebar-search-icon {
		color: var(--primary);
		transform: scale(1.12);
	}

	/* 减少动效偏好：保留颜色/边框的即时反馈（不影响可用性），
	   去掉位移与缩放这类会动的部分。 */
	@media (prefers-reduced-motion: reduce) {
		.titlebar-search,
		.titlebar-search-icon {
			transition: none;
		}
		.titlebar-search:hover .titlebar-search-icon,
		.titlebar-search:focus-within .titlebar-search-icon {
			transform: none;
		}
	}
	/* 可用宽度不足时搜索框没有可用形态（输入内容区已小于 22px），整体隐藏，
	   而不是让容器裁出一条无边框的窄缝。
	   注意只靠 flex 收缩解决不了：padding(8px×2) + border(1px×2) 共 18px
	   是不可压缩的，宽度趋于 0 时它仍会撑在那儿。
	   判定条件与 max-width 同源 —— 都是「标题栏宽度的 40%」这一个量：
	   当 40% 连 180px 都不到（即标题栏窄于 450px）时，搜索框已放不下
	   有意义的查询词，直接隐藏。这样阈值不是拍脑袋的常数，而是从
	   「搜索框至少要多宽才有用」反推出来的。 */
	@container titlebar (max-width: 450px) {
		.titlebar-search {
			display: none;
		}
	}

	.titlebar-search-input {
		flex: 1 1 auto;
		min-width: 0;
		border: none;
		/* 输入框自身永远透明，底色全交给外层 .titlebar-search（上面的三态规则）。
		   这里额外覆盖 -webkit-autofill：Chrome 自动填充会给输入框塞一层
		   #e8f0fe 的浅蓝底，且优先级高于 background，靠 background 改不掉。
		   官方绕法是给一个超长内阴影把填充层盖住，配合 -webkit-text-fill-color
		   让自动填充的文字仍用 --text。 */
		background: transparent;
		outline: none;
		color: var(--text);
		font-size: 12px;
		font-family: inherit;
		/* 文字过长时省略号：原本靠 .titlebar-search 的 overflow:hidden 裁切，
		   但那一层不能裁（会把下拉面板一起裁掉），所以收回输入框自己做。 */
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.titlebar-search-input:-webkit-autofill,
	.titlebar-search-input:-webkit-autofill:hover,
	.titlebar-search-input:-webkit-autofill:focus {
		-webkit-box-shadow: 0 0 0 1000px transparent inset;
		-webkit-text-fill-color: var(--text);
		transition: background-color 100000s ease-in-out 0s;
	}
	.titlebar-search-input::placeholder {
		color: var(--text-muted);
	}

	.titlebar-search-clear {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		background: none;
		color: var(--text-muted);
		cursor: pointer;
		transition: color 0.15s ease, transform 0.15s ease;
	}
	.titlebar-search-clear:hover {
		color: var(--text-strong);
		transform: scale(1.15);
	}
	@media (prefers-reduced-motion: reduce) {
		.titlebar-search-clear {
			transition: none;
		}
		.titlebar-search-clear:hover {
			transform: none;
		}
	}

	/* 下拉锚在输入框下方，宽度跟随搜索框。
	   不设 min-width：搜索框收窄到 50px 时面板跟着收窄（内容靠 ellipsis 截断），
	   强行保底宽会让面板反过来把搜索框顶出标题栏。 */
	.titlebar-search-list {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		z-index: var(--z-dialog);
		/* width:100% + right:0 对齐到搜索框边框内沿，需补回自身 1px×2 边框，
		   否则面板比搜索框窄 2px。 */
		width: calc(100% + 2px);
		max-height: 320px;
		margin: 0;
		padding: var(--sp-sm);
		list-style: none;
		overflow-y: auto;
		scrollbar-gutter: stable;
		background: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
		/* 出现动画：淡入 + 从锚点方向微微下落。
		   用 animation 而非 transition —— 这个 <ul> 是 {#if} 条件挂载的，
		   元素从无到有，transition 没有「起始值」可插值，不会触发。
		   只用 translateY + opacity，不加 scale：本元素同时是 PillTrack 的测量容器，
		   transform 会让容器内所有 getBoundingClientRect() 返回被缩放后的值，
		   pill 会按 98% 尺寸落位后卡住（偏移被 340ms 补测修正不掉）。 */
		animation: titlebar-search-in 0.16s ease-out;
	}
	@keyframes titlebar-search-in {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.titlebar-search-group {
		padding: var(--sp-sm) var(--sp-lg) 2px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	/* 面板宽度跟随搜索框，长 label 要能自己收住。
	   position:relative 是 PillTrack 的前提：pill 绝对定位在容器里，
	   项必须自建层叠上下文才能压住 pill（否则底色会盖在文字上）。 */
	.titlebar-search-item {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-md);
		min-width: 0;
		padding: var(--sp-md) var(--sp-lg);
		border-radius: var(--radius-md);
		font-size: 13px;
		color: var(--text);
		cursor: pointer;
	}
	.titlebar-search-item > span:first-child {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	/* 底色交给 PillTrack 的滑动 pill（hover 与键盘 active 共用同一块，会滑动跟随），
	   这里只管文字强度，避免「鼠标划过」与「方向键移动」出现两种不同强度的反馈。
	   pill 是品牌色实心 → 文字与右侧路径一起转白。 */
	.titlebar-search-item:hover,
	.titlebar-search-item.active {
		color: var(--accent-text);
	}
	.titlebar-search-item:hover .titlebar-search-value,
	.titlebar-search-item.active .titlebar-search-value {
		color: var(--accent-text);
		opacity: 0.8;
	}

	.titlebar-search-value {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-muted);
		/* 右侧 value 不参与收缩：面板跟随搜索框变窄时，先截断左侧 label */
		flex: none;
	}

	.titlebar-search-empty {
		padding: 24px;
		text-align: center;
		font-size: 13px;
		color: var(--text-muted);
	}

	.win-btn {
		--wails-draggable: no-drag;
		width: 46px;
		height: var(--titlebar-h);
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.win-btn:hover {
		background-color: var(--hover);
		color: var(--text-strong);
	}

	.win-btn-close:hover {
		background-color: #c42b1c;
		color: white;
	}
</style>

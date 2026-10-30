<script lang="ts">
	let {
		container = null,
		itemSelector = '',
		activeSelector = '',
		disabledMatch = ':disabled',
		showSelected = true,
		variant = 'box',
		insetX,
		background = 'transparent',
		hoverBackground = '',
		activeHoverBackground = '',
		radius = 'var(--radius-md)',
		shadow = '',
		disabled = false,
		portal = false,
		zIndex = -1,
		gapBridge = 12,
	}: {
		/** 容器：测量参照 + hover 事件挂载点（通常 bind:this 的定位/滚动容器） */
		container?: HTMLElement | null;
		/** hover 目标项选择器（closest 委托） */
		itemSelector?: string;
		/** 选中项选择器；缺省或查不到 → 选中 pill 隐藏 */
		activeSelector?: string;
		/** 禁用项匹配（hover 跳过） */
		disabledMatch?: string;
		/** 是否渲染选中 pill（多选分组等场景关闭） */
		showSelected?: boolean;
		/** box = 四边随项；line = 底部指示线（仅 left/width） */
		variant?: 'box' | 'line';
		/** 横向内缩：left=insetX，width=容器宽-2×insetX（替代项的 x 几何） */
		insetX?: number;
		/** 选中 pill 底色 */
		background?: string;
		/**
		 * hover pill 底色。**一律传不透明颜色**（默认 `var(--hover)`）。
		 * 半透明值（`--accent-sub`、`color-mix(… transparent)` 之类）在深浅不同的
		 * 宿主底色上浓淡不一：同一个菜单，压在纯白浮层和压在灰卡片上就是两种颜色；
		 * 叠两层（行 hover + 分组底色）还会更深一档，没法用「改一个变量」控制。
		 * 需要带色相的 hover 也请混成实色：`color-mix(in srgb, var(--danger) 12%, var(--popup-surface))`。
		 */
		hoverBackground?: string;
		/**
		 * 指针落在**已选中项**上时 hover pill 的底色。缺省 = 继续用 `hoverBackground`。
		 *
		 * 为什么要单独一档：选中 pill 是常驻的主题色实心块，指针压上去时如果 hover pill
		 * 仍是那块中性灰，就会出现两种坏结果 ——
		 * · hover pill 压在选中 pill 之上 → 主题色被灰盖掉，激活项「一碰就看不出来了」；
		 * · hover pill 被选中 pill 盖住 → 选中项对悬停毫无反应，与其余行的手感断开。
		 * 两者都不是「连贯」，而是把两个状态混成一个。
		 *
		 * 传主题色的加深档（`var(--primary-hover)`）即可两全：色相不变、只是浓度变一档，
		 * 指针扫过时同一块 pill 一路滑到底、颜色由灰转深，落定后看起来就是「选中块被按了一下」，
		 * 激活语义也一直在。想改成「悬停时选中项真的变灰」（macOS 那种）就把这里设成 `var(--hover)`。
		 */
		activeHoverBackground?: string;
		/** 圆角（line 变体固定 1px，忽略此值） */
		radius?: string;
		/** 选中 pill 阴影 */
		shadow?: string;
		/** 选中 pill 减淡（整组禁用时） */
		disabled?: boolean;
		/**
		 * 挂到 document.body 并用 position:fixed 定位，脱离 container 的层叠/裁剪。
		 *
		 * 为什么需要：pill 原本是 container 内的 absolute 元素。当 container 是
		 * overflow:auto 的滚动容器时，它同时是合成层边界 —— pill 每变一次位置，
		 * 浏览器都要重新判定整个容器（含内部全部元素）如何分层。
		 * 实测 11 张表同页时单帧 Layerize 26ms、掉帧 12%；把 pill 移出滚动容器
		 * 后掉帧降到 0%。
		 *
		 * 代价：坐标依赖视口位置，容器滚动/窗口尺寸变化时必须重算（见下方 effect），
		 * 因此不要指望「滚动时 pill 完全静止」，它每帧都会跟随。
		 */
		portal?: boolean;
		/**
		 * 选中 pill 挂到 body 时的 z-index，默认 -1。
		 *
		 * -1 = 当「行底色」用，沉到内容下面：填充式选中（左栏导航那种实心 pill）
		 * 才不会把文字盖住。前提是整条祖先链背景透明、且有本地层叠上下文兜底，
		 * 否则会沉到页面背景之后。
		 *
		 * 1 = 当「覆盖层」用（表格的常驻高亮），任何底色都压不掉它。
		 */
		zIndex?: number;
		/**
		 * 项间间隙的归属半径（px）：指针落在两项之间的空隙里时，把空隙算作
		 * **离它最近那一项**的触发区；超出这个距离才认为指针真的离开了列表。
		 *
		 * 为什么需要：项与项之间几乎总有 2~10px 的布局间隙（flex `gap`、
		 * 兄弟项 `margin`、菜单分隔线、分组内边距）。这些空隙属于**容器**而不是项，
		 * 按 `target.closest(itemSelector)` 判断时命中不到任何项，于是走「隐藏 pill」
		 * 分支 —— 鼠标扫过列表时，每经过一条缝隙 pill 都会闪一下。
		 *
		 * 归属用「就近判定」，而不是简单的「还停在容器里就别动」：指针一过中线，
		 * pill 就该滑到下一项，否则会一直停在上一项上，体感是「卡住」而不是「跟手」。
		 *
		 * 判定要求两侧都有项（次近距离也算在阈值内），所以阈值放大到容器内边距那样
		 * 也不会把表头上方、列表下方的空白算进来 —— 那里只有一侧有项。
		 * 传 0 关闭桥接，回到「只有指针真的压在项上才算 hover」。
		 */
		gapBridge?: number;
	} = $props();

	// 几何与可见性分离：几何持久、隐藏只翻 opacity，避免下次显示时从 0,0 飞入。
	// 但残留几何必须落在容器内容起点：绝对定位元素即使 opacity:0 仍参与 scroll 范围计算
	// （transform / contain:layout 均无效，只有 display:none 才行，而那会打断过渡），
	// 隐藏时把 box 收敛到 (0,0,0,0)，既保留"不回落到 nil"的性质，也不会撑大 scrollHeight。
	let hoverGeom = $state('');
	let hoverOn = $state(false);
	let hoverBg = $state('');
	/**
	 * 指针当前是否压在**已选中项**上（匹配 activeSelector）。
	 *
	 * 只用来做两件事：给 hover pill 换 activeHoverBackground、把它抬到选中 pill 之上。
	 * 必须在「指针换了项」「选中项被重测」「指针离开」三条路径上都刷新 —— 少任何一条，
	 * 表现都是 pill 颜色/层级停在上一次的状态：比如点选一项后指针没动，选中项变了，
	 * 深色档却还挂在原来那一行上。
	 */
	let activeHovered = $state(false);
	/** 指针最后压住的那一项（effect 内外都要读，见 refreshActiveHover） */
	let hoveredEl: HTMLElement | null = null;
	/**
	 * 压在这一项上的 pill 用的是哪一档底色。三种来源与 hoverBgFor 一一对应：
	 * `hover` = hoverBackground（多数场景是主题色实心）、`active` = activeHoverBackground、
	 * `custom` = 行自己的 `data-pill-bg`。
	 *
	 * 使用方要靠它选前景色（见下面 syncMark 的注释），所以不能只存颜色值本身 ——
	 * 两个来源完全可能算出同一个颜色，但「深底要转白字 / 浅底要留深字」的结论不同。
	 */
	let hoverKind = $state<'hover' | 'active' | 'custom'>('hover');
	/** 打在「pill 当前压住的项」上的标记，值就是 hoverKind */
	const PILL_ON = 'data-pill-on';
	let markedEl: HTMLElement | null = null;
	let selectedGeom = $state('');
	let selectedOn = $state(false);
	/**
	 * pill 位移时长（秒），固定值，选中 pill 与 hover pill 共用。
	 * 需要不同节奏可用 --pill-dur / --pill-hover-dur 覆盖。
	 */
	const PILL_DUR = 0.2;
	// 从停放位恢复：当帧不播位移过渡（否则 pill 会从左上角飞过来）
	let restoring = $state(false);
	let hoverRestoring = $state(false);

	const hoverStyle = $derived(
		`${hoverGeom} --pill-hover-dur: ${PILL_DUR}s; opacity: ${hoverOn ? 1 : 0};` +
			(hoverRestoring ? ' transition: none;' : '')
	);
	const selectedStyle = $derived(
		`${selectedGeom} --pill-dur: ${PILL_DUR}s; opacity: ${
			selectedOn && !activeHovered ? (disabled ? 0.5 : 1) : 0
		};` + (restoring ? ' transition: none;' : '')
	);

	// portal 的定位方式写进内联 style，而不是靠 class 切换：
	// 节点被 appendChild 搬到 body 之后，Svelte 的 class 指令不保证还会应用上去，
	// 但 style 是它最基础的更新路径，且能与几何的 transform 合并进同一个字符串。
	// z-index 取 -1，而不是正数：pill 必须落在容器内容【下面】。
	//
	// 正数一开始看着没问题，是因为 DataTable 的单元格都有不透明背景把它挡住了；
	// DataList 的行是透明的，portal 又把 pill 挂到 document.body 上、跳过了行的
	// 层叠上下文，于是 pill 直接盖住行内文字，hover 时整行变成一块纯色。
	//
	// -1 的语义正是「贴在容器背景之上、排在所有内容之后」：行自身有不透明背景
	// （DataTable 的 td 与 td::after 分隔线）就自动挡住它，和加入 portal 之前的
	// 视觉完全一致；透明背景的行则让 pill 透出来当底色 —— 那也正是它的用途。
	// 前提是容器本身不设 z-index / isolation / transform，否则 pill 会被困在
	// 容器自己的层叠上下文里，露到任何页面背景上（DashSidebar 就是这么坏的）。
	const PORTAL_POS = ' position: fixed; top: 0; left: 0; z-index: -1;';
	/**
	 * hover pill 的定位：**只有选中 pill 走 portal**（见下方 pillHost 的注释）。
	 * hover 留在宿主容器内部，用内容坐标 —— 与加入 portal 之前完全一致。
	 */
	const parkPos = '';

	/**
	 * 宿主容器是不是「盒子类」元素，决定 pill 下沉（z-index:-1）后能不能被看见。
	 *
	 * 背景知识：选中 pill 默认沉到 z-index:-1（见样式表注释），条件是
	 * 「有本地层叠上下文兜底 + 祖先背景透明」。这两条对两类宿主成立的方式完全不同：
	 *
	 * · 盒子类（div / table / tbody / ul …，DataTable、DataList、Tabs、Sidebar 这些）：
	 *   容器自己往往有背景色。此时负 z-index 的 pill 会画到**容器背景的后面**而
	 *   整个消失 —— 表头/行底色把主题色挡掉了，用户看到的就是「pill 没了」。
	 *   所以这类宿主用 z-index:0 + 让行背景透明（见 .pill-track--in-box 注释），
	 *   pill 落在容器自己的层叠上下文里、画在容器背景之上。
	 *
	 * · 表格行单元格（tr / td / li 之类）：它们通常没有自己的背景，z-index:-1 正好
	 *   沉到行内容之下、页面背景之上。
	 *
	 * 这里只判断「是不是显式的行/单元格元素」—— 其余一律按盒子处理，
	 * 因为「容器有背景」才是常态，误判成盒子最多是 pill 回到 z-index:0（可见），
	 * 误判成行则可能整个 pill 消失。
	 */
	const inBox = $derived(!!container && !/^(tr|td|th|li)$/i.test(container.tagName));

	/**
	 * 圆角上限跟随 pill 实际短边：`var(--radius-md)` 在行高 40px 上下没问题，
	 * 但 pill 被塞进表头那种 36px 高的小格子里时，固定圆角会接近半高，
	 * 相邻圆角被浏览器挤成平角（视觉上像「方块被切了角」）。
	 * 用 min() 取「半径 / 半高 / 半宽」里最小的，圆角永远不超过短边的一半，
	 * 也不需要 JS 量尺寸 —— --pill-h / --pill-w 由 boxStyle() 写进内联 style。
	 */
	const radiusCss = $derived(
		variant === 'line'
			? ''
			: ` border-radius: min(${radius}, calc(var(--pill-h, 0px) / 2), calc(var(--pill-w, 0px) / 2));`
	);

	/** 把 pill 实际宽高写进 CSS 变量，供上面的圆角 min() 使用 */
	function boxSizeVars(b: Box): string {
		return `--pill-w: ${b.w}px; --pill-h: ${b.h}px;`;
	}


	/** 没显式传 hoverBackground 时按变体取默认：
	 *  box 用 --hover 铺一整块底；line 只有 2px 的条，压在 1px 的轨道线上，
	 *  --hover 比轨道还浅（亮色 #e5e5e8 vs #dfdfe3），盖上去像把线「擦掉」一段，
	 *  所以 line 变体默认取 --hover-line（比 --hover 深一档、仍然不透明）。 */
	const hoverBgDefault = $derived(variant === 'line' ? 'var(--hover-line)' : 'var(--hover)');

	const hoverBase = $derived(
		`background: ${hoverBg || hoverBackground || hoverBgDefault};${radiusCss}${parkPos}`
	);
	// 选中 pill 和 hover 一样是「行底色」，默认沉在文字下面（z-index:-1，见样式表）。
	// 只有 portal 时才需要内联的 fixed 定位；此时 zIndex 决定它压在哪一层。
	const SELECTED_POS = $derived(
		portal ? ` position: fixed; top: 0; left: 0; z-index: ${zIndex};` : ''
	);
	const selectedBase = $derived(
		`background: ${background};${radiusCss}${
			shadow ? ` box-shadow: ${shadow};` : ''
		}${SELECTED_POS}`
	);

	// 视口 rect + 容器滚动量 → 内容坐标（相对 padding edge）：
	// 非滚动容器与 offset 等价；滚动/sticky 项（如吸顶分组头）位置正确；扣 clientLeft/Top 消除边框偏差
	type Box = { l: number; t: number; w: number; h: number };

	function measureBox(el: HTMLElement): Box | null {
		if (!container) return null;
		const er = el.getBoundingClientRect();
		const cr = container.getBoundingClientRect();
		const l = er.left - cr.left + container.scrollLeft - container.clientLeft;
		const t = er.top - cr.top + container.scrollTop - container.clientTop;
		// line：t/h 恒 0（只有 left 动）；insetX：l/w 恒定（只有 top 动）→ pill 只画真实移动轴上的正确矩形
		if (variant === 'line') return { l, t: 0, w: er.width, h: 0 };
		if (insetX !== undefined) {
			return {
				l: insetX,
				t,
				w: Math.max(container.clientWidth - insetX * 2, 0),
				h: er.height,
			};
		}
		return { l, t, w: er.width, h: er.height };
	}

	/**
	 * 缓存版几何：滚动容器里的「内容坐标」在滚动时不变化，只取决于布局。
	 *
	 * 每次指针划过都调 getBoundingClientRect 会强制同步布局（reflow），这是列表类
	 * 组件卡顿的主因：鼠标扫过一屏行就是几十次 rect 读取。改为读 offset 系列
	 * （不触发布局），再一次性换算出相对容器的内容坐标：
	 *   - 项与容器在同一 offsetParent 下：l = offsetLeft - container.clientLeft
	 *   - 不同 offsetParent 下：用 offsetParent 的 rect 差把链推到容器
	 * 缓存按项 + 容器 / 变体 / insetX 校验，布局变化时由 ResizeObserver 与滚动/尺寸
	 * 事件作废。rect 版 measureBox 保留给需要「当下真实位置」的选中 pill 测量。
	 */
	let geomCache = new WeakMap<HTMLElement, Box>();
	let geomKey = '';
	/**
	 * 项 → 实时矩形（容器内容坐标）的快照，只给「间隙归属」用（见 itemNear）。
	 *
	 * 与 geomCache 的分工：geomCache 存的是 pill 的落点几何（按 variant / insetX 变形、
	 * line 变体还会把 t/h 归零），拿来算距离会把下划线变体的纵向位置全算错；
	 * 这里存未经变形的矩形，距离才和指针位置同一坐标系。
	 * 生命周期一致：同一套失效信号（布局变化 / 滚动 / 变体切换）一起清掉。
	 */
	let itemRects: { el: HTMLElement; l: number; t: number; w: number; h: number }[] | null = null;

	function invalidateGeom() {
		geomCache = new WeakMap();
		itemRects = null;
	}

	/** 元素与其 offsetParent 链上，相对容器 padding edge 的偏移（不读 rect 之外的信息） */
	function offsetPath(el: HTMLElement): { x: number; y: number } | null {
		if (!container) return null;
		let x = 0;
		let y = 0;
		let node: HTMLElement | null = el;
		while (node && node !== container) {
			x += node.offsetLeft;
			y += node.offsetTop;
			const op: HTMLElement | null = node.offsetParent as HTMLElement | null;
			// offsetParent 越过容器还能继续走，说明容器不是它的定位祖先，offset 基准不一致
			if (!op) return null;
			node = op;
		}
		if (node !== container) return null;
		return { x, y };
	}

	function cachedBox(el: HTMLElement): Box | null {
		if (!container) return null;
		// key 里的 portal 维度只与「选中 pill」有关；hover 永远在宿主内部用内容坐标。
		const key = `${variant}|${insetX ?? ''}`;
		if (key !== geomKey) {
			geomKey = key;
			invalidateGeom();
		}
		const hit = geomCache.get(el);
		if (hit) return hit;

		let box: Box | null = null;
		{
			// 内容坐标：几何与滚动无关，可缓存（offset 系列不触发布局）。
			// 选中 pill 用的是另一条路径 measureSelected()，它自己量实时 rect。
			const off = offsetPath(el);
			if (off) {
				// 扣容器边框：offsetLeft 相对 padding box，pill 也定位在 padding edge
				const l = off.x - container.clientLeft;
				const t = off.y - container.clientTop;
				if (variant === 'line') box = { l, t: 0, w: el.offsetWidth, h: 0 };
				else if (insetX !== undefined) {
					box = { l: insetX, t, w: Math.max(container.clientWidth - insetX * 2, 0), h: el.offsetHeight };
				} else box = { l, t, w: el.offsetWidth, h: el.offsetHeight };
			} else {
				// 布局不是常规文档流（transform / 绝对定位链）时退回 rect 测量，保证正确性
				box = measureBox(el);
			}
			if (box) geomCache.set(el, box);
			return box;
		}
	}

	/**
	 * 位移一律走 transform:translate，而不是 left/top。
	 *
	 * left/top 是布局属性：每次 hover 划过一行，浏览器都要为这一帧重算布局
	 * （Chrome 的性能面板里表现为每次 hover 都记一次 Layout shift，
	 * 一屏几十行就是几十次）。translate 是合成属性 —— 位移只改合成层的
	 * transform，不碰布局，滚动和悬停都不产生 layout shift。
	 *
	 * 宽高仍用 width/height：pill 的尺寸本来就是"贴合项"的结果，需要真实
	 * 尺寸参与布局；只有位移是高频的，把高频那部分挪到合成层就够了。
	 */
	function boxStyle(b: Box): string {
		if (variant === 'line') return `transform: translate(${b.l}px, 0); width: ${b.w}px; ${boxSizeVars(b)}`;
		return `transform: translate(${b.l}px, ${b.t}px); width: ${b.w}px; height: ${b.h}px; ${boxSizeVars(b)}`;
	}

	/**
	 * 全部项的矩形快照（容器内容坐标）。
	 *
	 * 只在指针真的落进「非项」区域时才建一次，之后复用，直到布局变化 / 滚动 /
	 * 变体切换把它作废（见 invalidateGeom）。量的是**未经 pill 变形的原始矩形**：
	 * cachedBox 会按 variant 把 line 的 t/h 归零、按 insetX 改宽度，拿它算距离
	 * 会把下划线变体的纵向偏差全部算进去。
	 */
	function itemsSnapshot(): { el: HTMLElement; l: number; t: number; w: number; h: number }[] {
		if (itemRects) return itemRects;
		const c = container;
		if (!c || !itemSelector) return (itemRects = []);
		const cr = c.getBoundingClientRect();
		const cl = c.clientLeft;
		const ct = c.clientTop;
		const sl = c.scrollLeft;
		const st = c.scrollTop;
		// 内容坐标与滚动无关，所以这里不必按可视区裁剪 —— 裁剪放到 itemNear 里按**当下**的
		// 滚动位置做（容器自身滚动不冒泡，收不到 scroll 事件，缓存里存不下"当时谁可见"）。
		// 仍然跳过零尺寸的项：display:none、折叠面板收起的子项都是 0×0，
		// 它们会在内容起点留下一堆坐标，指针扫过列表边缘时可能"就近"到看不见的项上。
		itemRects = [];
		for (const el of c.querySelectorAll<HTMLElement>(itemSelector)) {
			const r = el.getBoundingClientRect();
			if (r.width <= 0 || r.height <= 0) continue;
			itemRects.push({
				el,
				l: r.left - cr.left + sl - cl,
				t: r.top - cr.top + st - ct,
				w: r.width,
				h: r.height,
			});
		}
		return itemRects;
	}

	/**
	 * 指针落点命中的「最近项」—— 把项间间隙算进相邻两项的触发区。
	 *
	 * 判定要求**两侧都有项**：最近项与次近项都在 gapBridge 以内才算数。
	 * 这一条把「两项之间的缝」和「列表外的空白」区分开了：
	 * · 行间距 / 列间距 / 菜单分隔线：左右或上下紧挨着两项，两个距离都很小 → 命中；
	 * · 表头上方、列表下方的内边距：只有一侧有项，次近距离是「整行高度」→ 不命中，
	 *   否则指针扫过表头底边就会把第一行点亮。
	 */
	function itemNear(x: number, y: number): HTMLElement | null {
		const c = container;
		if (!c || gapBridge <= 0) return null;
		const cr = c.getBoundingClientRect();
		const px = x - cr.left + c.scrollLeft - c.clientLeft;
		const py = y - cr.top + c.scrollTop - c.clientTop;
		// 可视窗口（内容坐标）：滚出视口的项不参与，否则会"就近"到一个用户看不见的项上
		const vl = c.scrollLeft;
		const vt = c.scrollTop;
		const vr = vl + c.clientWidth;
		const vb = vt + c.clientHeight;
		let best: HTMLElement | null = null;
		let bestD = Infinity;
		let secondD = Infinity;
		for (const it of itemsSnapshot()) {
			if (it.l + it.w <= vl || it.l >= vr || it.t + it.h <= vt || it.t >= vb) continue;
			// 点到矩形的欧氏距离；落在矩形内为 0
			const dx = Math.max(it.l - px, 0, px - (it.l + it.w));
			const dy = Math.max(it.t - py, 0, py - (it.t + it.h));
			const d = dx === 0 && dy === 0 ? 0 : Math.hypot(dx, dy);
			if (d < bestD) {
				secondD = bestD;
				bestD = d;
				best = it.el;
			} else if (d < secondD) secondD = d;
		}
		return bestD <= gapBridge && secondD <= gapBridge ? best : null;
	}


	// 停放几何：绝对定位元素即使 opacity:0 仍撑大容器的 scroll 范围（实测 transform /
	// contain:layout / visibility:hidden 均无效，只有 display:none 行，但那会打断过渡）。
	// Sidebar 收起等场景下，旧坐标留在原地会把容器撑到上千像素、凭空多出滚动条，
	// 故淡出结束后把 box 收敛到内容起点 —— 这也是避免"下次显示从 0,0 飞入"所需的停放位。
	const PARKED = 'transform: translate(0px, 0px); width: 0px; height: 0px;';

	// 淡出尾声（与 opacity 0.15s 对齐）后收敛到停放位；淡出期间若重新显示则取消。
	// hover pill 同样要停放：它也是 absolute，鼠标在展开态停在列表底部的残留坐标
	// （如 top:2318px）同样会把 scrollHeight 撑到上千像素。
	let parkTimer: ReturnType<typeof setTimeout> | undefined;
	let hoverParkTimer: ReturnType<typeof setTimeout> | undefined;

	function schedulePark() {
		clearTimeout(parkTimer);
		parkTimer = setTimeout(() => {
			parkTimer = undefined;
			if (!selectedOn) selectedGeom = PARKED;
		}, 160);
	}

	function scheduleHoverPark() {
		clearTimeout(hoverParkTimer);
		hoverParkTimer = setTimeout(() => {
			hoverParkTimer = undefined;
			if (!hoverOn) hoverGeom = PARKED;
		}, 160);
	}

	/**
	 * 重算「指针是不是正压在选中项上」，并把 hover pill 的颜色档位一起校准。
	 *
	 * 三条路径都要调：指针换项、指针离开、选中项被重测。最后一条最容易被漏掉 ——
	 * 点选之后指针一动不动，activeSelector 命中的元素却换了：只更新 activeHovered
	 * 而不重算 hoverBg，就会出现「旧的那行恢复成灰、新的那行被选中却也是灰」——
	 * 选中 pill 已经被藏起来（opacity 0），hover pill 又是灰的，整行主题色凭空消失。
	 * 没有 activeHoverBackground 的用法直接短路，少一次 matches() 调用。
	 */
	function refreshActiveHover() {
		if (!activeHoverBackground || !activeSelector) {
			activeHovered = false;
			return;
		}
		activeHovered = !!(hoveredEl && hoveredEl.matches(activeSelector));
		if (hoveredEl) {
			applyHoverBg(hoveredEl);
			// 选中项被换掉时档位会变（active ⇄ hover）：标记的值不跟着改，使用方就还按
			// 旧档位上色 —— 例如指针没动、选中却挪走了，这一行从 active 退回 hover，
			// 字色规则若按 active 判就漏掉白字，深字压在品牌色上
			syncMark();
		}
	}

	/**
	 * 某一项该用哪种 hover 底色。三条来源，优先级从高到低：
	 * 1) 行自己的 `data-pill-bg` —— 逐项显式指定（脏行、禁用行、危险项都用它）；
	 * 2) 落在选中项上 → `activeHoverBackground`（见该 prop 的注释）；
	 * 3) 都没有 → 空串，落到 hoverBackground / 变体默认值。
	 *
	 * 抽成函数是因为 onOver 与 resync 是两条独立路径（指针移动 / 布局重排后补命中），
	 * 各写一遍必然分叉：最常见的坏法是重排后 pill 位置对了、颜色却还停在上一条的档位上。
	 *
	 * 返回 `kind` 而不只是颜色串：使用方要用它决定这一行的前景色（见 syncMark）。
	 */
	function hoverBgFor(item: HTMLElement): { bg: string; kind: 'hover' | 'active' | 'custom' } {
		if (item.dataset.pillBg) return { bg: item.dataset.pillBg, kind: 'custom' };
		if (activeHoverBackground && activeSelector && item.matches(activeSelector)) {
			return { bg: activeHoverBackground, kind: 'active' };
		}
		return { bg: '', kind: 'hover' };
	}

	/** 底色与档位一起落地：两者分开赋值时，标记可能先读到旧档位。 */
	function applyHoverBg(item: HTMLElement) {
		const r = hoverBgFor(item);
		hoverBg = r.bg;
		hoverKind = r.kind;
	}

	/**
	 * 把「pill 现在压在哪一项、压的是哪一档」同步成 DOM 标记 `data-pill-on`。
	 *
	 * 为什么需要标记，而不是让使用方继续用 `:hover` 决定前景色：
	 * pill 的落点由**指针最近项**决定（见 gapBridge），指针落进项间缝隙、分隔线
	 * 或面板内边距时，指针并不在那一项上 —— 于是 `:hover` 是 false，pill 却仍
	 * 压在那行上。两边各说各话的结果是：品牌色实心的那一行文字退回深色
	 * （深字压品牌色实测对比度约 1.4:1，「移开鼠标就读不清了」），开关行的轨道
	 * 也退回深灰压在蓝底上。反过来，隐藏 pill 时若前景色瞬时恢复、pill 还在做
	 * 150ms 淡出，同样会有一段时间读不清 —— 所以隐藏那一帧一并禁用淡出
	 * （见 `.pill-track--hover-off`）。
	 *
	 * 值分三档，使用方按档位上色：只有 `hover` 这一档可以假定「深底、要转白字」；
	 * `custom` 多半是浅底（禁用行的中性灰、危险项的浅红），转白反而更糟。
	 */
	function syncMark() {
		const el = hoverOn && hoveredEl ? hoveredEl : null;
		if (el) el.setAttribute(PILL_ON, hoverKind);
		if (el !== markedEl) {
			markedEl?.removeAttribute(PILL_ON);
			markedEl = el;
		}
	}

	function measureSelected() {
		// 选中项可能刚被换掉（点选 / 外部改 value）：先按新的 activeSelector 重判一次
		// 「指针还在不在选中项上」，颜色档位才不会留在上一行
		refreshActiveHover();
		if (!container || !showSelected || !activeSelector) {
			setSelected(false);
			return;
		}
		const el = container.querySelector<HTMLElement>(activeSelector);
		if (!el) {
			setSelected(false);
			return;
		}
		const box = measureBox(el);
		if (!box) {
			setSelected(false);
			return;
		}
		const wasParked = !selectedOn && selectedGeom === PARKED;
		selectedGeom = boxStyle(box);
		// 停放恢复：先禁用过渡落地，下一帧恢复常规过渡
		if (wasParked) {
			restoring = true;
			requestAnimationFrame(() => (restoring = false));
		}
		setSelected(true);
	}

	function setSelected(on: boolean) {
		if (selectedOn === on) return;
		selectedOn = on;
		if (on) clearTimeout(parkTimer);
		else schedulePark();
	}

	// hover 走同一套路：仅在可见性翻转时取消 / 排定停放
	function setHover(on: boolean) {
		if (hoverOn === on) return;
		hoverOn = on;
		if (on) clearTimeout(hoverParkTimer);
		else scheduleHoverPark();
		// 显隐与 DOM 标记必须同一帧落地：差一帧就是「蓝底还在、字已经变黑」
		syncMark();
	}

	let raf = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	function scheduleMeasure() {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(measureSelected);
		// 过渡动画（slide/宽度变化）期间布局渐变，收尾后按最终布局补测
		clearTimeout(timer);
		timer = setTimeout(measureSelected, 340);
	}

	// 选中项变化（class/子节点增删）→ rAF 合帧重测；props 变化 → 同步重测
	$effect(() => {
		measureSelected();
	});

	// 只有「需要选中 pill」时才观察 DOM：
	// MutationObserver 即使没回调，浏览器也要在每次 DOM 变更后维护一遍观察记录。
	// DataTable/DataList 这类只有 hover 的用法（showSelected=false 或无 activeSelector）
	// 根本不需要它 —— 一页几十个实例各挂一个 subtree 观察器是纯开销。
	$effect(() => {
		const c = container;
		if (!c || !showSelected || !activeSelector) return;
		const mo = new MutationObserver(scheduleMeasure);
		mo.observe(c, { subtree: true, childList: true, attributeFilter: ['class'] });
		return () => {
			mo.disconnect();
			cancelAnimationFrame(raf);
			clearTimeout(timer);
		};
	});

	// hover 委托：挂原生监听（无模板事件 → 无 a11y warning）
	//
	// 监听挂在 scroll 容器（.table-container / .list-container）而不是内容元素上：
	// pointerover 在整张表上冒泡时，浏览器要在每一层祖先上重新计算样式与布局；
	// 挂到最外层等于让这个容器在每次指针移动时都被卷入一次样式重算。
	// 命中判断仍然用 itemSelector + closest，所以选择器语义不变。
	$effect(() => {
		const c = container;
		const sel = itemSelector;
		if (!c || !sel) return;
		// 收窄后的别名：TS 不把 `if (!c)` 的收窄结果带进下面这些函数声明里
		const host = c;
		const matcher = sel;
		const root = scrollParent(c);
		// 指针最后落点：重排之后要靠它重新命中「现在指针下面是哪一行」。
		// 重排是布局变化，浏览器不会因此补发 pointerover —— 不主动补一次，
		// pill 会停在旧行的坐标上，直到用户真的动一下鼠标。
		let pointer: { x: number; y: number } | null = null;
		// 两个观察者都按需创建：几何缓存只在指针真的划过某项后才被写入。
		// 一页挂十几二十张表时，每实例常驻观察器意味着浏览器每次布局 /
		// DOM 变更都要回调所有实例（哪怕它们的缓存还是空的），纯开销。
		let ro: ResizeObserver | null = null;
		let mo: MutationObserver | null = null;
		let resyncRaf = 0;
		// 「等行落位」的重试预算：每次布局变化重新计数
		let settleTries = 0;

		/** 指针位置命中的项（含容器校验）；命中不到返回 null。 */
		function hitTest(x: number, y: number): HTMLElement | null {
			const el = document.elementFromPoint(x, y) as HTMLElement | null;
			const item = el?.closest?.<HTMLElement>(matcher) ?? null;
			if (item && host.contains(item)) return item;
			// 与 onOver 同一套间隙归属：重排后指针正好落在缝里时，
			// 不能因为「没压在项上」就把 pill 收掉
			const near = itemNear(x, y);
			return near && host.contains(near) ? near : null;
		}

		/**
		 * 该行的视觉位置是否已经等于它的布局位置。
		 *
		 * 行在做位置过渡（`animate:flip` 之类）时被 transform 顶着：命中测试用的是
		 * 视觉位置，而 pill 落点用的是布局位置（offsetPath），两者对不上 ——
		 * 此刻重定位会把 pill 甩到别的行上，过渡过程中来回跳几次。
		 */
		function visuallySettled(item: HTMLElement): boolean {
			const off = offsetPath(item);
			if (!off) return true;
			const cr = host.getBoundingClientRect();
			const visualY = item.getBoundingClientRect().top - cr.top + host.scrollTop;
			return Math.abs(visualY - off.y) < 1;
		}

		/**
		 * 布局变了之后，把 pill 挪到「指针当前所在的那一项」。
		 *
		 * 排序 / 筛选会整排搬动行节点：光标底下可能已经换了一行，
		 * 此时正确行为是 pill 跟着滑过去，而不是停在旧坐标上（看起来像串行）。
		 * 缓存在 onLayoutChange 里已作废，这里读到的是重排后的真实位置。
		 */
		function resync() {
			if (!hoverOn) return;
			const item = pointer ? hitTest(pointer.x, pointer.y) : null;
			if (!item) {
				hoveredEl = null;
				refreshActiveHover();
				setHover(false);
				return;
			}
			// 行还在过渡途中：等它落位再算（预算 90 帧 ≈1.5s，兜住动画异常不结束的情况）
			if (settleTries < 90 && !visuallySettled(item)) {
				settleTries += 1;
				resyncRaf = requestAnimationFrame(resync);
				return;
			}
			settleTries = 0;
			hoveredEl = item;
			const box = cachedBox(item);
			if (box) {
				hoverGeom = boxStyle(box);
			}
			applyHoverBg(item);
			refreshActiveHover();
			syncMark();
		}

		/**
		 * 布局失效：作废几何缓存；指针还停在列表上时补一次重新命中。
		 *
		 * 为什么非要 MutationObserver：几何缓存按「元素 → 位置」记账，而排序、
		 * 筛选只是把**已有节点**搬了个位置 —— 容器尺寸一点没变，ResizeObserver
		 * 不会触发；也没有滚动。少这一路信号，缓存里留着的就是重排前的
		 * offsetTop，下次 hover 时 pill 会落到别的行上（hover A、pill 在 B）。
		 */
		function onLayoutChange() {
			invalidateGeom();
			if (!hoverOn) return;
			cancelAnimationFrame(resyncRaf);
			settleTries = 0;
			resyncRaf = requestAnimationFrame(resync);
		}

		function ensureObservers() {
			if (!ro) {
				ro = new ResizeObserver(onLayoutChange);
				ro.observe(host);
			}
			if (!mo) {
				mo = new MutationObserver(onLayoutChange);
				mo.observe(host, { childList: true, subtree: true });
			}
		}

		const onOver = (e: PointerEvent) => {
			pointer = { x: e.clientX, y: e.clientY };
			const target = e.target as HTMLElement | null;
			const direct = target?.closest?.<HTMLElement>(sel) ?? null;
			// 命中不到项时按几何就近归属：项间间隙（flex gap / 兄弟 margin / 分隔线 /
			// 分组内边距）都属于容器，不做这一步的话指针每扫过一条缝 pill 就会消失一次。
			// 归属是「就近」，所以指针一过中线 pill 就滑到下一项，不会停在上一项上。
			const item = direct && c.contains(direct) ? direct : itemNear(e.clientX, e.clientY);
			if (!item) {
				hoveredEl = null;
				refreshActiveHover();
				setHover(false);
				return;
			}
			// 同一项内部移动（指针扫过文字/图标）不重算几何：每格都读一次 rect
			// 等于每次移动都强制一次同步布局，列表越长越卡
			if (item === hoveredEl) return;
			hoveredEl = item;
			if (disabledMatch && item.matches(disabledMatch)) {
				// 禁用项不参与「选中项加深」：它本来就点不动，给主题色是错误暗示
				activeHovered = false;
				setHover(false);
				return;
			}
			// 停放恢复：当帧不播位移/高度过渡，避免从左上角飞过来、或从 0 高度展开。
			// 首次 hover 时 hoverGeom 还是空串（等价于落在 0,0,0,0），一并按停放处理。
			const wasParked = !hoverOn && (!hoverGeom || hoverGeom === PARKED);
			const box = cachedBox(item);
			if (box) {
				hoverGeom = boxStyle(box);
				// 缓存已落地，此后布局变化（含排序这种「只搬家不变尺寸」的）必须让它失效
				ensureObservers();
			}
			applyHoverBg(item);
			refreshActiveHover();
			// 已经停在这一列上、指针换了项时 setHover(true) 是空操作，
			// 标记得在这里跟着换过去，否则白字还留在上一行
			syncMark();
			if (wasParked) {
				hoverRestoring = true;
				requestAnimationFrame(() => (hoverRestoring = false));
			}
			setHover(true);
		};
		const onLeave = () => {
			hoveredEl = null;
			pointer = null;
			setHover(false);
			hoverBg = '';
			hoverKind = 'hover';
			refreshActiveHover();
		};
		// hover pill 用「内容坐标」定位，滚动不影响它，滚动时作废缓存即可，
		// 下一次指针划过重新量。portal 只作用于选中 pill，它有自己的测量路径。
		const onScroll = () => {
			invalidateGeom();
		};
		root.addEventListener('pointerover', onOver);
		root.addEventListener('pointerleave', onLeave);
		// 滚动：pill 用内容坐标，滚动不改变它的落点，作废缓存供下次划过重算即可
		root.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			root.removeEventListener('pointerover', onOver);
			root.removeEventListener('pointerleave', onLeave);
			root.removeEventListener('scroll', onScroll);
			ro?.disconnect();
			mo?.disconnect();
			cancelAnimationFrame(resyncRaf);
			invalidateGeom();
			// 监听器拆了，指针落点就失效了：hoveredEl 是组件级状态（不随 effect 销毁），
			// 不清掉的话重新订阅后第一次 matches() 会拿旧元素判出错误的颜色档位
			hoveredEl = null;
			activeHovered = false;
			setHover(false);
		};
	});

	// portal 模式：只把「选中」pill 搬到 body 下。
	// 不用 use:action —— action 只在元素创建时跑一次，且它是否会在样式更新之后执行并不保证。
	// 用 $effect.pre 显式管理：pre 阶段拿到节点时它已插入 DOM、尚未绘制，搬走不会闪一帧。
	let selNode = $state<HTMLElement | null>(null);

	$effect.pre(() => {
		const el = selNode;
		if (!el || !portal) return;
		if (el.parentElement !== document.body) document.body.appendChild(el);
	});

	// 组件销毁时 body 下的节点不归 Svelte 的片段树管，得手动摘掉，否则一页几十个 pill 会累积。
	$effect(() => {
		return () => {
			selNode?.remove();
		};
	});

	/**
	 * 向上找最近的滚动祖先，作为指针事件的委托目标。
	 *
	 * 表格的 container 是 tbody、列表的是列表根，二者自身都不滚：
	 * 事件挂在它们身上时，指针从头到尾都停在一个巨大的元素上。
	 * 挂到滚动容器后，指针进入/离开的是「看得见的那一框」，语义也更准。
	 */
	function scrollParent(el: HTMLElement): HTMLElement {
		let node = el.parentElement;
		while (node) {
			const oy = getComputedStyle(node).overflowY;
			if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight) return node;
			node = node.parentElement;
		}
		return el;
	}
</script>

<!-- 默认只有 hover：没有 activeSelector 就没有选中 pill。

     两个 pill 的落点不同：
     · hover 就地渲染在宿主容器里（内容坐标），由行的层叠上下文管，
       行透明 / 行白底都能正常显示；
     · 选中才走 portal —— 它是常驻的覆盖层，挂到 body 后才能稳定压在所有内容之上，
       也才不受容器 overflow 裁剪。
     hover 若也搬去 body，就得要求整条祖先链背景透明、且有本地层叠上下文兜底，
     否则会沉到页面背景之后（DataList 的透明行就是这么「hover 不显示」的）。 -->
{#if itemSelector}
	<div
		class="pill-track pill-track--hover"
		class:pill-track--line={variant === 'line'}
		class:pill-track--in-box={inBox}
		class:pill-track--hover-off={!hoverOn}
		data-pill="hover"
		aria-hidden="true"
		style="{hoverBase} {hoverStyle}"
	></div>
{/if}
{#if showSelected}
	<div
		class="pill-track pill-track--sel"
		class:pill-track--line={variant === 'line'}
		class:pill-track--in-box={inBox}
		data-pill="selected"
		aria-hidden="true"
		style="{selectedBase} {selectedStyle}"
		bind:this={selNode}
	></div>
{/if}

<style>
	.pill-track {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		transition: opacity 0.15s;
		/* 回弹曲线：中段 y 超过 1（back-out），位置先冲过落点再落回来 ——
		   「回弹」就是这一段过冲。选中与 hover 共用同一条曲线、同一个固定时长
		   （PILL_DUR），落点和冲出去的幅度是同一个手感。

		   过冲幅度取 1.5：接近 Button 的 1.56，但 pill 是整块色块，同样的相对
		   过冲摊到几十上百像素的宽度上会比按钮缩放显眼，略收一点。
		   1.4 那种量在 0.19s 的短位移里几乎看不出「弹」，只是「快」。 */
		--pill-ease: cubic-bezier(0.34, 1.5, 0.64, 1);
		/* height 用的轻过冲版：高度不是位移，过冲会让人看到 pill 上下「撑一下」，
		   1.12 只够抹掉硬切感，不至于把上下边缘顶出去太多。 */
		--pill-ease-soft: cubic-bezier(0.34, 1.12, 0.64, 1);
		/* 位移走 transform，不触发布局。
		   刻意不加 will-change: transform —— 那会让每个 pill 常驻一个合成层，
		   一页十几张表就是十几层，反而更费显存和合成时间；
		   transform 过渡在 Chrome 里同样会被自动提升，只在动画期间存在。 */
	}
	/* 两种 pill 分工不同，层叠策略也不同：
	   hover 是「行底色」，就地画在宿主容器内部，
	   由宿主行的层叠上下文管，因此行透明、行白底都能正常显示；
	   选中是「当前项标记」，默认压在最上面（z-index:1），任何底色都压不掉它。
	   两者互不影响 —— hover 到已选中的项时能同时看到两层。
	   唯一例外是左栏导航那种实心填充：传 zIndex={-1} 让它沉到文字下面当底色。 */
	.pill-track--hover {
		/* 不下沉到 z-index:-1：那要求页面所有祖先背景都透明、且有本地层叠上下文兜底，
		   否则 pill 会沉到页面背景之后（DataList 的透明行就是这样「hover 不显示」的）。
		   0 让它在宿主行里当普通背景层，文字等后绘制的内容自然压在它上面。 */
		z-index: 0;
	}
	/* 选中 pill 是「行底色」，和 hover 一样沉在文字下面（z-index:-1）。
	   它绝不能压在最上面：填充式选中（左栏导航那种实心主题色块）一旦盖住行，
	   行里的文字就被整块吞掉，什么都看不见。

	   -1 生效的前提是「有本地层叠上下文兜底 + 祖先背景透明」：
	   · 行/单元格类宿主（tr / td …）本身没有背景，pill 沉在行内容之下、页面背景之上；
	   · 盒子类宿主（div / table / tbody …）几乎都有背景色，负 z-index 会让 pill
	     画到**容器背景后面**、整块看不见 —— 表头底色把主题色吞掉就是这么来的。
	     这类宿主改走 .pill-track--in-box（z-index:0），由宿主自己的层叠上下文兜底。 */
	.pill-track--sel {
		z-index: -1;
	}
	/* 盒子类宿主的 pill 回到 z-index:0，落在容器自己的层叠上下文里。
	   前提是宿主行/单元格的背景已经透明化 —— 那一侧由使用方负责：
	   · DataTable 的 td/th 在 .table-container 作用域里是 background-color: transparent，
	     tbody 有 position:relative，pill 与行同在 tbody 的层叠上下文；
	   · DataList 的 .list-row 同样是 transparent + position:relative；
	   · Tabs / ToggleGroup / Sidebar 的行本身不写背景。
	   只要行背景是透明的，pill 就画在容器底色之上、行内容之下，两种主题都是主题色。
	   hover 本来就是这个策略（见上面的 .pill-track--hover），这里让选中 pill 与之统一。 */
	.pill-track--in-box {
		z-index: 0;
	}
	/* hover 的定位用内容坐标（见 parkPos），没有内联的 position:fixed。 */
	/* hover：与选中 pill 同一条曲线、同一个固定时长（PILL_DUR），只是写进不同的变量。
	   位移过渡的是 transform 而不是 left/top —— 前者走合成器，不触发重排。

	   width 仍然瞬时对齐：它是布局属性，和 transform 放在同一条 transition 里会让
	   Chrome 无法把 pill 提升为独立合成层，于是每帧都要重新走
	   Paint → Layerize → Commit（实测单帧 Layerize 可达 32~37ms，主线程满载）。

	   但 height 必须过渡：列表项高度并不总是一致（多行文本、缩略图、行内标签等），
	   瞬时切换会让 pill 在两项之间「弹」一下。高度只作用在这个绝对定位的 pill 上，
	   不会引起兄弟节点重排，代价可控，所以单独给 height 同一条缓动。 */
	.pill-track--hover {
		transition:
			transform var(--pill-hover-dur, 0.2s) var(--pill-ease),
			height var(--pill-hover-dur, 0.2s) var(--pill-ease-soft),
			background-color 0.15s,
			opacity 0.15s;
	}
	/* 选中：位移 back-out 过冲回弹 + 固定时长（PILL_DUR）。
	   尺寸不参与过渡：选中标记切换频率低，且 width 还会随列宽变化（理由见上）。 */
	.pill-track--sel {
		transition:
			transform var(--pill-dur, 0.2s) var(--pill-ease),
			opacity 0.15s;
	}
	.pill-track--line {
		top: auto;
		bottom: -1px;
		height: 2px;
		border-radius: 1px;
	}
	/* 下划线变体只有横向位移：同样带回弹，否则同一套 Tabs 在两种模式下
	   一个会弹一个不会，正是这次要修的不一致。 */
	.pill-track--hover.pill-track--line {
		transition: transform var(--pill-hover-dur, 0.2s) var(--pill-ease), opacity 0.15s;
	}
	.pill-track--sel.pill-track--line {
		transition:
			transform var(--pill-dur, 0.2s) var(--pill-ease),
			opacity 0.15s;
	}
	/* 减少动效：过冲全部退回线性缓出，位移照样跟随，只是不再「弹」。
	   注意这里只换 transition，不要写 transform: none —— 那会把 pill 的位置压回原点。 */
	@media (prefers-reduced-motion: reduce) {
		.pill-track--hover,
		.pill-track--hover.pill-track--line {
			transition:
				transform var(--pill-hover-dur, 0.18s) ease-out,
				height var(--pill-hover-dur, 0.18s) ease-out,
				background-color 0.15s,
				opacity 0.15s;
		}
		.pill-track--sel,
		.pill-track--sel.pill-track--line {
			transition:
				transform var(--pill-dur, 0.18s) ease-out,
				opacity 0.15s;
		}
	}

	/* 隐藏当帧不给过渡 —— 必须写在最后，压过上面所有带 opacity 的 transition。
	   前景色（菜单文字、开关轨道）在隐藏同一帧按 data-pill-on 瞬时切回深色，
	   pill 若还做 0.15s 淡出，中间就有约 150ms 是「深字压着没退干净的品牌色」，
	   对比度掉到 1.4:1 左右，看上去就是「移开鼠标以后糊了」。

	   出现方向本来就不过渡：从停放位恢复的那一帧 hoverRestoring 会写 transition:none
	   （否则会从左上角飞过来），所以显隐现在都是瞬时，只有位移与高度在动 ——
	   pill 该「滑」，不该「淡」。 */
	.pill-track--hover.pill-track--hover-off {
		transition: none;
	}
</style>


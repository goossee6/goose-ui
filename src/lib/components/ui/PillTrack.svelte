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
		bounce = 10,
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
		/**
		 * 回弹的过冲距离（px，**固定值**）。
		 *
		 * 之所以要「固定」：CSS 的 `cubic-bezier` 过冲是**按位移比例**给的
		 * （1.5 的 back-out ≈ 位移的 5%），于是滑两行只弹 2px、滑二十行弹出 20px，
		 * 同一个组件在不同列表长度上手感完全不同。这里改成「不管多远都冲出去
		 * `bounce` 像素再落回」，位移只影响速度，不影响弹的幅度。
		 *
		 * 传 0 = 不过冲（纯缓出）；`prefers-reduced-motion: reduce` 下自动按 0 处理。
		 */
		bounce?: number;
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
	 *
	 * 位移由 JS 关键帧播（见 slidePill），所以这个时长只由这里决定；
	 * `--pill-hover-dur` 现在只管 hover pill 的**高度**过渡（行高不一致时那一下伸缩）。
	 */
	const PILL_DUR = 0.2;
	/** 位移动画的 id：`el.getAnimations()` 里混着 opacity 的 CSS transition，靠它区分自己起的动画 */
	const SLIDE_ID = 'pill-slide';
	// 从停放位恢复 / 起点不可用：当帧不播位移与淡入（否则 pill 会从左上角飞过来、或淡着出现）
	let restoring = $state(false);
	let hoverRestoring = $state(false);
	const hoverStyle = $derived(
		`${hoverGeom} --pill-hover-dur: ${PILL_DUR}s; opacity: ${hoverOn ? 1 : 0};` +
			(hoverRestoring ? ' transition: none;' : '')
	);
	/**
	 * 选中 pill **常显**（选中就可见），hover 到它身上也不隐藏。
	 *
	 * 曾经的做法是「指针压到选中项上就把选中 pill 藏起来，露出 hover pill 的
	 * activeHoverBackground」—— 这会让「激活项加深」这件事由**会移动**的那一层承担，
	 * 于是整行底色在位移途中一路跨色：
	 *   · 进入：hover pill 正从上一行滑过来，底色从 --hover 渐变到 --primary-hover，
	 *     跨色到一半时压在激活行上 —— 实测该行亮度 79 → 111 → 58（先亮后暗，就是闪烁）；
	 *   · 离开：hover pill 从 --primary-hover 渐变回 --hover，还压在激活行上时已经是
	 *     浅灰 —— 实测亮度 58 → 194 → 79（更明显的一次闪白）。
	 * 根因是「一个色块被要求同时对上两行」：它在这两行之间移动时，任何中间色对
	 * 目标行都是错的，而激活行的文字是浅色，浅色底就是读不清。
	 *
	 * 现在改为：底色由**静止的**选中 pill 自己换（见 selectedBase 的 background），
	 * 那是一次原地颜色过渡，亮度单调、没有中间态可言；hover pill 只负责指针位置，
	 * 它压在激活行上的那部分被选中 pill 完全盖住（同 z-index、DOM 在后，见样式表），
	 * 所以它跨色跨成什么样都看不见。
	 */
	const selectedStyle = $derived(
		`${selectedGeom} opacity: ${selectedOn ? (disabled ? 0.5 : 1) : 0};` +
			(restoring ? ' transition: none;' : '')
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
	/**
	 * 选中 pill 的底色：指针压在它身上时换成 activeHoverBackground（「按住」档）。
	 *
	 * 这一档原来写在 hover pill 上（指针一压上来就把选中 pill 藏起来）。但那层是
	 * 跟着指针**移动**的，让它承担「激活项加深」就意味着整行底色要在位移途中跨色 ——
	 * hover 到激活项与从激活项移开这两下都会闪（详见 selectedStyle 的注释）。
	 * 换到这里之后，跨色发生在静止元素上，只可能「由亮到暗」或「由暗到亮」一条直线。
	 */
	const selectedFill = $derived(
		activeHovered && activeHoverBackground ? activeHoverBackground : background
	);
	const selectedBase = $derived(
		`background: ${selectedFill};${radiusCss}${
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
	 * 项 → 实时矩形（容器内容坐标）的快照，只给「间隙归属」用（见 itemNear）。
	 *
	 * 与 itemBox 的分工：itemBox 算的是 pill 的落点几何（按 variant / insetX 变形、
	 * line 变体还会把 t/h 归零），拿来算距离会把下划线变体的纵向位置全算错；
	 * 这里存未经变形的矩形，距离才和指针位置同一坐标系。
	 */
	let itemRects: { el: HTMLElement; l: number; t: number; w: number; h: number }[] | null = null;
	/** 建快照那一刻的容器内容尺寸，用作一次廉价的失效校验（见 itemsSnapshot） */
	let itemRectsSize = '';

	function invalidateGeom() {
		itemRects = null;
		itemRectsSize = '';
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

	/**
	 * 某项的落点几何（容器内容坐标）。
	 *
	 * 每次 hover 都现算，不做「元素 → 位置」的缓存。缓存要正确，就必须能察觉
	 * **任何**让项移动的事件，而这类事件里至少有一种完全不给信号：
	 * 分组折叠只是把 `grid-template-rows` 从 1fr 过渡到 0fr —— 节点没增删（MutationObserver
	 * 不响）、容器尺寸没变（ResizeObserver 不响）、也没有滚动。留一份旧坐标的后果很具体：
	 * 收起一个分组后再 hover 同一项，pill 落在上一个布局的位置上（实测偏 264px），
	 * 而且这种偏差只在「hover 过的项」上出现，看起来像随机错位。
	 *
	 * 现算并不贵：offset 系列是纯读取，路径上只有三四个节点，且不要求计算完整 rect
	 * （当初要避开的正是「每次指针移动都对一屏几十行各读一次 getBoundingClientRect」，
	 * 那个代价在 itemsSnapshot 里，仍然保留快照）。
	 */
	function itemBox(el: HTMLElement): Box | null {
		if (!container) return null;
		// 内容坐标：几何与滚动无关。选中 pill 走另一条路径 measureSelected()，它自己量实时 rect。
		const off = offsetPath(el);
		// offsetParent 链走不到容器（transform / 绝对定位链 / sticky 吸附态）→ 用 rect 兜底，
		// 保证「当下真实位置」不会因为拿不到 offset 基准而算错
		if (!off) return measureBox(el);
		// 不再扣 clientLeft / clientTop：offsetLeft 本身就是相对 offsetParent 的 **padding edge**
		// 量的（实测容器 padding:4px + border:1px 时，tab.offsetLeft === 4），而绝对定位的
		// 包含块也正是 padding box —— 两者同一基准，再减一次边框就是重复扣减。
		// 症状很具体：容器只要有 1px 边框，hover pill 就固定比该项左/上各差 1px，
		// 而选中 pill 走 measureBox（rect 基准，减 clientLeft 是对的）不差 —— 于是同一个 tab
		// 上「hover 块」和「选中块」错开 1px，换 tab 时看着像块先歪一下再对齐。
		// 注意 itemsSnapshot / itemNear / measureBox 仍要减：它们以 getBoundingClientRect
		// （border box 基准）为起点，减 clientLeft 才是 padding 坐标，不要一起改掉。
		const l = off.x;
		const t = off.y;
		if (variant === 'line') return { l, t: 0, w: el.offsetWidth, h: 0 };
		if (insetX !== undefined) {
			return { l: insetX, t, w: Math.max(container.clientWidth - insetX * 2, 0), h: el.offsetHeight };
		}
		return { l, t, w: el.offsetWidth, h: el.offsetHeight };
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
	 * 两个 pill 各自的「上一次落点」。
	 *
	 * 位移改成 JS 关键帧后，起点必须显式给出（CSS 过渡那套是浏览器自己从
	 * 「当前计算值」接上去的，遇到首帧 / 停放位 / 元素被裁掉时就无从判断，
	 * 于是从 translate(0,0) 起步 —— 视觉上就是「pill 从页面顶部飞过来」）。
	 * `null` = 没有可用的起点（首次挂载、从停放位恢复、被滚出可视区），
	 * 此时直接落位、不播位移。
	 */
	let selBox: Box | null = null;
	let hovBox: Box | null = null;
	/**
	 * 每个 pill 上一段位移动画的**目标**（`translate(x, y)` 形式的落点串）。
	 *
	 * 只用来做一件事：落点没变就不重播（见 slidePill 里的说明）。
	 * 用 WeakMap 而非 `$state`：它是纯运行时记录，不参与渲染。
	 */
	const slideGoal = new WeakMap<HTMLElement, string>();

	/** 减少动效：位移照样跟随，但不过冲。 */
	const reduceMotion = () =>
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/**
	 * 落点是否落在容器的**可视区**里（内容坐标）。
	 *
	 * 用途只有一个：判断「pill 现在待的地方用户看得见吗」。
	 * 看不见就不能从那里起步 —— 把侧栏滚到 `scrollTop = 1700` 再点上面的项，
	 * 上一个选中项已经跑到视口上方，transition 却照旧从那儿播，
	 * 于是选中 pill 从页面顶部一路滑进来（实测起点 -1338px，看着像凭空多出一个 pill）。
	 *
	 * line 变体只有横向位移，纵向不参与判断。
	 */
	function boxInView(b: Box | null): boolean {
		const c = container;
		if (!b || !c) return false;
		if (variant === 'line') return b.l + b.w > c.scrollLeft && b.l < c.scrollLeft + c.clientWidth;
		return b.t + b.h > c.scrollTop && b.t < c.scrollTop + c.clientHeight;
	}

	/**
	 * 把 pill 从 `from` 滑到 `to`：**固定过冲**的回弹。
	 *
	 * 三段关键帧，过冲点固定 `bounce` 像素（不是 `cubic-bezier` 那种按位移比例的
	 * 相对过冲），所以滑一行和滑二十行的弹幅一致，只有速度不同：
	 *
	 *   0%   起点
	 *   60%  过冲点（沿位移方向再出去 bounce 像素）
	 *   100% 落点
	 *
	 * 为什么不用 CSS transition：缓动函数只能改写「进度」，无法改写「幅度」——
	 * 想要固定像素的过冲，就必须自己给出关键帧。
	 *
	 * 位移写入内联 style 的是**落点**，动画只是覆盖在上面（`fill: none`）：
	 * 播放结束自动露出内联落点，不会有一帧回跳。
	 */
	function slidePill(el: HTMLElement | null, from: Box | null, to: Box, durMs: number) {
		if (!el || !from) return;
		const line = variant === 'line';
		let dy0 = line ? 0 : from.t;
		let x0 = from.l;
		const dy1 = line ? 0 : to.t;
		// 上一段位移还没播完（指针快速地扫过好几行）：从**当下看得见的位置**接着走，
		// 而不是从上一段的落点重新起步 —— 否则每个格子都往回跳一下。
		// 只认自己起的动画（id）：getAnimations() 里还会有 opacity 的 CSS transition，
		// 把它 cancel 掉就成了「显隐瞬切」。也只在真有动画在跑时才读计算值。
		const running = el.getAnimations().filter((a) => a.id === SLIDE_ID);
		if (running.length) {
			const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
			x0 = m.m41;
			dy0 = line ? 0 : m.m42;
		}
		const dx = to.l - x0;
		const dy = dy1 - dy0;
		const dist = Math.hypot(dx, dy);
		// 位移小到看不出来（重测同一项 / 亚像素抖动）：什么都不做 —— 尤其别 cancel 掉
		// 正在跑的那一段，否则重排补测一来，半路的动画就被掐断、pill 瞬移到落点
		if (dist < 0.5) return;
		const goal = `translate(${to.l}px, ${dy1}px)`;
		// 已经在往**同一个落点**滑：不要再起一段。
		//
		// 重排补测（resync）会拿同一个落点再调一次，此时 pill 正处于过冲点、
		// 离落点还有几个像素 —— 距离判定放行，于是从半路重新起步、又过冲一次。
		// 用户看到的就是「滑到位之后莫名又弹一下」（实测第一次落定后 300ms 处
		// 还多出一段 303.5 → 298 的动画）。目标没变就没有重新起步的理由。
		if (running.length && slideGoal.get(el) === goal) return;
		slideGoal.set(el, goal);
		running.forEach((a) => a.cancel());
		const start = `translate(${x0}px, ${dy0}px)`;
		if (reduceMotion() || bounce <= 0) {
			// 不过冲也仍然要「动过去」：一趟缓出位移，避免瞬移感
			const a = el.animate([{ transform: start }, { transform: goal }], {
				duration: durMs,
				easing: 'ease-out',
				fill: 'none',
			});
			a.id = SLIDE_ID;
			return;
		}
		// 过冲不许把 pill 顶出目标项之外（否则 pill 会明显「弹到别的行上」）。
		//
		// 原来只按 `dist * 0.5` 收敛，可这个条件在最常见的「滑一行」上永远不成立：
		// 行高 36 + 间距 2 → dist 38，dist/2 = 19 > bounce 10，于是每一行都会先冲进
		// 下一行 10px（≈行高的 28%）再退回来。实测侧栏轨迹：146 → 184(落点) → 194(峰值)
		// → 184，落定前有 6 帧、约 100ms 是错位的 —— 肉眼看就是「块没对准这一行」。
		// 上限改成**目标项在移动主轴上的尺寸**：36px 的行 → 4.3px，116px 的 tab → 仍取到
		// bounce 的 10px（约 8%），过冲该有的「弹」还在，但不会跨出该项。
		const span = Math.abs(dy) >= Math.abs(dx) ? to.h : to.w;
		const ov = Math.min(bounce, dist * 0.5, span * 0.12);
		const peak = `translate(${to.l + (dx / dist) * ov}px, ${dy1 + (dy / dist) * ov}px)`;
		const anim = el.animate(
			[
				// 加速后收住，冲过落点
				{ offset: 0, transform: start, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
				// 回落到落点
				{ offset: 0.6, transform: peak, easing: 'cubic-bezier(0.33, 0, 0.4, 1)' },
				{ offset: 1, transform: goal },
			],
			{ duration: durMs, fill: 'none' }
		);
		anim.id = SLIDE_ID;
	}

	/**
	 * 项是不是被祖先「裁没了」。
	 *
	 * 折叠面板收起走的是 `grid-template-rows: 1fr → 0fr` + 内层 `overflow: hidden`：
	 * 裁剪盒高度归零，但里面的行**仍按原高度留在布局里**，`getBoundingClientRect()`
	 * 报的还是 36px。它们既看不见也点不到（`elementFromPoint` 命中不到），
	 * 却会混进间隙快照，把指针停在缝隙时的「就近归属」抢走 —— pill 于是落到
	 * 缝里某个看不见的行上，看着就是位置算错（侧栏收起分组后扫过分组间距最常见）。
	 *
	 * 判据用「祖先盒的 clientHeight / clientWidth 归零」：这种裁切必然是裁剪盒自身
	 * 收缩到 0，比逐层读 `getComputedStyle(overflow)` 便宜，也不会误伤滚动容器
	 * （它 clientHeight > 0）。`display: contents` 这类没有盒子的祖先要跳过，
	 * 否则它的 clientHeight 也是 0，会把可见项一起误判掉。
	 */
	function clippedAway(el: HTMLElement, host: HTMLElement): boolean {
		let node = el.parentElement;
		while (node && node !== host) {
			if (node.getClientRects().length > 0 && (node.clientHeight <= 0 || node.clientWidth <= 0)) return true;
			node = node.parentElement;
		}
		return false;
	}

	/**
	 * 全部项的矩形快照（容器内容坐标）。
	 *
	 * 只在指针真的落进「非项」区域时才建一次，之后复用，直到布局变化 / 滚动 /
	 * 变体切换把它作废（见 invalidateGeom）。量的是**未经 pill 变形的原始矩形**：
	 * itemBox 会按 variant 把 line 的 t/h 归零、按 insetX 改宽度，拿它算距离
	 * 会把下划线变体的纵向偏差全部算进去。
	 */
	function itemsSnapshot(): { el: HTMLElement; l: number; t: number; w: number; h: number }[] {
		const c = container;
		if (!c || !itemSelector) return (itemRects = []);
		if (itemRects) {
			// 廉价自检：DOM 没变、容器尺寸没变、也没滚动，但内容高度变了
			// （分组折叠把 grid-template-rows 从 1fr 缩到 0fr 就是这种），
			// 上面那些失效信号一个都不会响。一次 scrollHeight 读取足够挡住这类隐性重排。
			if (`${c.scrollHeight}x${c.scrollWidth}` === itemRectsSize) return itemRects;
			itemRects = null;
		}
		const cr = c.getBoundingClientRect();
		const cl = c.clientLeft;
		const ct = c.clientTop;
		const sl = c.scrollLeft;
		const st = c.scrollTop;
		// 内容坐标与滚动无关，所以这里不必按可视区裁剪 —— 裁剪放到 itemNear 里按**当下**的
		// 滚动位置做（容器自身滚动不冒泡，收不到 scroll 事件，缓存里存不下"当时谁可见"）。
		// 仍然跳过两类看不见的项：
		//   · 自身零尺寸（display:none）—— 会在内容起点留下一堆坐标；
		//   · 被折叠祖先裁没（见 clippedAway）—— 有尺寸、有坐标，但一个像素都露不出来。
		const next: { el: HTMLElement; l: number; t: number; w: number; h: number }[] = [];
		for (const el of c.querySelectorAll<HTMLElement>(itemSelector)) {
			if (clippedAway(el, c)) continue;
			const r = el.getBoundingClientRect();
			if (r.width <= 0 || r.height <= 0) continue;
			next.push({
				el,
				l: r.left - cr.left + sl - cl,
				t: r.top - cr.top + st - ct,
				w: r.width,
				h: r.height,
			});
		}
		itemRectsSize = `${c.scrollHeight}x${c.scrollWidth}`;
		return (itemRects = next);
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
			if (!selectedOn) {
				selectedGeom = PARKED;
				// 停放 = 没有可信起点：下次出现必须瞬时落位，不能从 (0,0) 起步
				selBox = null;
			}
		}, 160);
	}

	function scheduleHoverPark() {
		clearTimeout(hoverParkTimer);
		hoverParkTimer = setTimeout(() => {
			hoverParkTimer = undefined;
			if (!hoverOn) {
				hoverGeom = PARKED;
				hovBox = null;
			}
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
		const prev = selBox;
		const prevGeom = selectedGeom;
		// 停放恢复 / 首次落位：几何还是空串或停放值，起点无从判断
		const wasParked = !selectedOn && (prevGeom === PARKED || prevGeom === '');
		const next = boxStyle(box);
		// 落点真的变了才算「在滑动」（同一项重测、宽度 resize 也都走这里，不必开保护窗）
		const sliding = selectedOn && next !== prevGeom;
		selectedGeom = next;
		selBox = box;
		// 只有「本来就在可视区里」才播位移：起点在视口外（列表被滚远了）时，
		// 从那儿滑过来就是「凭空多出一个 pill 从页面顶部飞入」，直接落位更干净
		if (sliding && boxInView(prev)) {
			if (following) {
				// 布局过渡中（见 trackLayout）：位置是被布局推着走的，直接贴合。
				// 这里若照常播 slidePill，每帧都会从「当下位置」重新起一段 200ms 缓动，
				// 追不上连续位移，视觉上就是拖在后面越拖越远。
			} else if (activeHovered && hoverOn && hoverNode) {
				// 指针正压在新激活项上（点击切换的常态）：这段位移交给 **hover pill** 播。
				//
				// 此时 hover pill 早已停在目标项上，若仍让选中 pill 从旧项滑过来，
				// 目标行上会同时出现两层（浅色 hover 块 + 滑来的选中块），观感就是
				// 「激活项的动画和 hover 不是同一个」。改由 hover pill 从旧激活项起步，
				// 点击切换与普通 hover 就走完全相同的节点、关键帧、行高过渡与起点判定。
				//
				// 选中 pill 不滑，直接落在目标位当**底盘**：新激活项的文字这一帧就转成
				// 前景色（白字），底下没有块就是白字压白底。它现在常显（见 selectedStyle），
				// 所以底盘这一层不用再靠 holdSelected 撑一个窗口 —— hover pill 滑到位后
				// 压在底盘上，两者同色（都是 activeHoverBackground），本来就看不出来。
				slidePill(hoverNode, prev, box, PILL_DUR * 1000);
				restoring = true;
				requestAnimationFrame(() => (restoring = false));
			} else {
				slidePill(selNode, prev, box, PILL_DUR * 1000);
			}
		} else if (sliding || wasParked) {
			// 瞬时落位，且别淡入：pill 该「出现在该在的地方」，不该「从别处飞过来」
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

	/**
	 * 布局正在**连续**变形的时段（分组的 `1fr ⇄ 0fr`、侧栏宽度过渡）。
	 *
	 * 这期间不能只靠 `transitionend` 补测：那是收尾才有的一次跳跃，
	 * 而目标项整段过渡里一直在移动 —— 选中 pill 会先钉在原地，等动画结束再
	 * 「啪」地对过去（实测展开分组时 item 从 288 走到 362，pill 全程停在 288）。
	 * 反过来也不能靠 slidePill：它的时长是 200ms 的缓出，追不上每帧 3~5px 的
	 * 连续位移，表现是一路拖着走、越拖越远。
	 *
	 * 正确做法是「逐帧贴合」：过渡期间每帧重测一次，并且**跳过位移动画** ——
	 * pill 不是自己滑过去的，是被布局推着走的（见 measureSelected 的 following 分支）。
	 */
	let following = false;
	let followRaf = 0;
	let followUntil = 0;
	/** 过渡事件不保证成对（被打断时没有 transitionend），给一个定长兜底 */
	const FOLLOW_MS = 600;

	function trackLayout() {
		followUntil = performance.now() + FOLLOW_MS;
		if (following) return;
		following = true;
		// 起始那一帧可能还有一段 slidePill 在播：`fill: none` 的动画播放期间**压过**内联
		// transform，逐帧跟随要的是「内联写到哪就显示到哪」，否则整段跟随都被那 200ms
		// 的缓动拖在后面（实测展开侧栏时 pill 左缘一直比行多 3px，正是过冲点残留）。
		selNode?.getAnimations().filter((a) => a.id === SLIDE_ID).forEach((a) => a.cancel());
		const step = () => {
			measureSelected();
			if (!following) return;
			if (performance.now() > followUntil) {
				following = false;
				return;
			}
			followRaf = requestAnimationFrame(step);
		};
		followRaf = requestAnimationFrame(step);
	}

	function stopTrack() {
		following = false;
		cancelAnimationFrame(followRaf);
	}

	// 选中项变化（class/子节点增删）→ rAF 合帧重测；props 变化 → 同步重测
	$effect(() => {
		measureSelected();
	});

	// 只有「需要选中 pill」时才观察 DOM：
	// MutationObserver 即使没回调，浏览器也要在每次 DOM 变更后维护一遍观察记录。
	// DataTable/DataList 这类只有 hover 的用法（showSelected=false 或无 activeSelector）
	// 根本不需要它 —— 一页几十个实例各挂一个 subtree 观察器是纯开销。
	//
	// 三路信号缺一不可，各自兜的失效场景不同：
	// · MutationObserver：项被增删、选中项换了 class（点选 / 外部改 value）。
	// · ResizeObserver：**容器自身的尺寸在动画中渐变**。侧栏折叠态 → 展开态是
	//   `width: 56px ⇄ 220px` 的 0.3s 过渡，期间 DOM 一个节点没动，MutationObserver
	//   全程沉默；不跟这一路，pill 就停在展开动画第一帧量到的宽度上 —— 实测展开后
	//   pill 宽 30px 而激活行已经 178px，且此后永不回正（直到再 hover 或点一次）。
	// · transitionend：纯 CSS 过渡把项整体挪走（分组 `grid-template-rows: 1fr ⇄ 0fr`），
	//   DOM 与容器尺寸都不变，只有收尾这一下能听见。
	$effect(() => {
		const c = container;
		if (!c || !showSelected || !activeSelector) return;
		const mo = new MutationObserver(scheduleMeasure);
		mo.observe(c, { subtree: true, childList: true, attributeFilter: ['class'] });
		// 只有尺寸**真的变了**才跟随：observe() 会立刻回一次初始尺寸，
		// 不滤掉它等于每次挂载都白跑 600ms 的逐帧测量（这期间选中 pill 还不播位移）
		let lastSize = `${c.clientWidth}x${c.clientHeight}`;
		const ro = new ResizeObserver(() => {
			const s = `${c.clientWidth}x${c.clientHeight}`;
			if (s === lastSize) return;
			lastSize = s;
			trackLayout();
		});
		ro.observe(c);
		// 收尾补测：与 hover 侧同一策略（跳过 pill 自己的过渡，否则每次淡出都白跑一遍）
		const onEnd = (e: TransitionEvent) => {
			if ((e.target as HTMLElement | null)?.classList?.contains('pill-track')) return;
			scheduleMeasure();
			// 一个分组里可能同时有好几条布局过渡（各行的 grid 展开），
			// 全部收尾才停逐帧跟随 —— 少这一条，剩下的过渡段就成了「钉住 + 末了跳一下」
			if (!anyLayoutTransition()) stopTrack();
		};
		c.addEventListener('transitionend', onEnd);
		// 过渡**开始**就把 pill 挂上「逐帧跟随」：布局在 0.25s 里连续推开项，
		// 等 transitionend 才挪就是收尾时的一次跳跃（见 trackLayout）。
		//
		// 只认**影响布局**的属性：列表里几乎每行都有 `transition: color 0.15s`，
		// 指针一划过就有一串 transitionrun 冒泡上来，照单全收等于每次移动都开一轮
		// 逐帧测量 —— 而且 following 期间选中 pill 不播位移动画，键盘切换会变成瞬移。
		const LAYOUT_PROP =
			/^(?:width|height|inline-size|block-size|min-|max-|grid-|padding|margin|inset|top|left|right|bottom|flex-basis|font-size|line-height|gap|row-gap|column-gap|border-(?!radius))/;
		/** 容器内还有没有影响布局的过渡在跑（过渡收尾时问一次，不逐帧问） */
		function anyLayoutTransition(): boolean {
			const c = container;
			if (!c || typeof c.getAnimations !== 'function') return false;
			return c.getAnimations({ subtree: true }).some((a) => {
				if (!(a instanceof CSSTransition) || a.playState !== 'running') return false;
				const t = (a.effect as KeyframeEffect | null)?.target ?? null;
				if (t?.classList?.contains('pill-track')) return false;
				return LAYOUT_PROP.test(a.transitionProperty);
			});
		}
		const onStart = (e: TransitionEvent) => {
			if ((e.target as HTMLElement | null)?.classList?.contains('pill-track')) return;
			if (!LAYOUT_PROP.test(e.propertyName)) return;
			trackLayout();
		};
		c.addEventListener('transitionrun', onStart);
		// effect 重建的那一帧 DOM 已经变过了（activeSelector 正是随折叠/展开翻转的），
		// 新建的观察者看不到那次 mutation —— 不主动补这一次，展开侧栏后 pill 会一直
		// 停在旧几何上，直到用户碰巧 hover 一下导航。
		scheduleMeasure();
		return () => {
			mo.disconnect();
			ro.disconnect();
			c.removeEventListener('transitionend', onEnd);
			c.removeEventListener('transitionrun', onStart);
			stopTrack();
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
			const box = itemBox(item);
			if (box) {
				// 起点同样要在可视区内：列表被滚远之后指针还停在原处，缓存的落点在视口外，
				// 从那儿滑过来就是「pill 从顶上飞进来」
				if (boxInView(hovBox)) slidePill(hoverNode, hovBox, box, PILL_DUR * 1000);
				hoverGeom = boxStyle(box);
				hovBox = box;
			}
			applyHoverBg(item);
			refreshActiveHover();
			syncMark();
		}

		/**
		 * 布局失效：作废间隙快照；指针还停在列表上时补一次重新命中。
		 *
		 * 为什么非要 MutationObserver：排序、筛选只是把**已有节点**搬了个位置 ——
		 * 容器尺寸一点没变，ResizeObserver 不会触发，也没有滚动。浏览器也不会因为
		 * 重排补发 pointerover，少这一路信号，pill 就停在旧行的坐标上，
		 * 直到用户真的动一下鼠标（hover A、pill 在 B）。
		 */
		function onLayoutChange() {
			invalidateGeom();
			if (!hoverOn) return;
			cancelAnimationFrame(resyncRaf);
			settleTries = 0;
			resyncRaf = requestAnimationFrame(resync);
		}

		/**
		 * 纯 CSS 过渡收尾也算一次布局变化。
		 *
		 * 分组折叠/展开走的是 `grid-template-rows: 1fr ⇄ 0fr`：节点一个没增删、
		 * 容器尺寸也没变，MutationObserver 与 ResizeObserver 全程沉默。
		 * 但行确实整体上移/下移了，指针底下换了一行 —— 不补这一次重新命中，
		 * pill 会留在折叠前的位置上，视觉上就是「pill 没跟着分组走」。
		 * pill 自己的位移/淡出也会冒泡到这里，跳过它们，否则每次滑动都白跑一遍重算。
		 */
		function onTransitionEnd(e: TransitionEvent) {
			const el = e.target as HTMLElement | null;
			if (el?.classList?.contains('pill-track')) return;
			onLayoutChange();
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
			// 起点可用性：首次 hover（几何为空）、从停放位恢复（几何在 0,0）、
			// 或者上一处落点已经被滚出可视区 —— 这三种都不能当位移起点，
			// 否则 pill 会从左上角 / 页面顶部飞过来。此时直接落位。
			const prevBox = hovBox;
			const jump = !hoverOn || !prevBox || !boxInView(prevBox);
			const box = itemBox(item);
			if (box) {
				hoverGeom = boxStyle(box);
				hovBox = box;
				if (jump) {
					hoverRestoring = true;
					requestAnimationFrame(() => (hoverRestoring = false));
				} else {
					slidePill(hoverNode, prevBox, box, PILL_DUR * 1000);
				}
				// 定位一次之后再挂观察器：指针真的停进列表里，重排才可能影响到 pill
				ensureObservers();
			}
			applyHoverBg(item);
			refreshActiveHover();
			// 已经停在这一列上、指针换了项时 setHover(true) 是空操作，
			// 标记得在这里跟着换过去，否则白字还留在上一行
			syncMark();
			setHover(true);
		};
		const onLeave = () => {
			hoveredEl = null;
			pointer = null;
			setHover(false);
			hoverBg = '';
			hoverKind = 'hover';
			hovBox = null;
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
		// 纯 CSS 过渡（分组折叠那种）不会触发任何 DOM / 尺寸信号，只能靠过渡收尾补测
		root.addEventListener('transitionend', onTransitionEnd);
		return () => {
			root.removeEventListener('pointerover', onOver);
			root.removeEventListener('pointerleave', onLeave);
			root.removeEventListener('scroll', onScroll);
			root.removeEventListener('transitionend', onTransitionEnd);
			ro?.disconnect();
			mo?.disconnect();
			cancelAnimationFrame(resyncRaf);
			invalidateGeom();
			// 监听器拆了，指针落点就失效了：hoveredEl 是组件级状态（不随 effect 销毁），
			// 不清掉的话重新订阅后第一次 matches() 会拿旧元素判出错误的颜色档位
			hoveredEl = null;
			activeHovered = false;
			hovBox = null;
			setHover(false);
		};
	});

	// portal 模式：只把「选中」pill 搬到 body 下。
	// 不用 use:action —— action 只在元素创建时跑一次，且它是否会在样式更新之后执行并不保证。
	// 用 $effect.pre 显式管理：pre 阶段拿到节点时它已插入 DOM、尚未绘制，搬走不会闪一帧。
	let selNode = $state<HTMLElement | null>(null);
	// hover pill 的节点：位移动画要直接对元素起关键帧（见 slidePill）
	let hoverNode = $state<HTMLElement | null>(null);

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
		bind:this={hoverNode}
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
		/* 位移（transform）不在这里过渡：回弹的过冲幅度要是**固定像素**，
		   而缓动函数只能改写「进度」、改不了「幅度」——`cubic-bezier(…, 1.5, …)`
		   给出的过冲是位移的百分之几，滑一行弹 2px、滑二十行弹 20px。
		   所以位移改由 JS 关键帧播（见 slidePill），这里只留尺寸 / 颜色 / 显隐。

		   留下的 height 用带轻过冲的曲线：高度不是位移，过冲会让人看到 pill
		   上下「撑一下」，1.12 只够抹掉硬切感，不至于把上下边缘顶出去太多。 */
		--pill-ease-soft: cubic-bezier(0.34, 1.12, 0.64, 1);
		/* 位移走 transform，不触发布局。
		   刻意不加 will-change: transform —— 那会让每个 pill 常驻一个合成层，
		   一页十几张表就是十几层，反而更费显存和合成时间；
		   位移动画在播放期间 Chrome 会自动提升它。 */
	}
	/* 两种 pill 分工不同，层叠策略也不同：
	   hover 是「指针位置」，就地画在宿主容器内部，由宿主行的层叠上下文管；
	   选中是「当前项标记 + 行底色」，压在 hover 之上（理由见 .pill-track--in-box）。
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

	   这里两个 pill 拿到同一档 z-index，而模板里选中 pill **渲染在 hover 之后** ——
	   同档位按 DOM 顺序绘制，所以选中 pill 一定压在 hover pill 上面。
	   这条不是巧合，是「激活项加深」能做得干净的前提：hover pill 滑到激活项上时，
	   它那一段（以及它在途中跨成的任何中间色）都被选中 pill 整块盖住，
	   于是「底色」永远由静止的那一层决定（见 selectedStyle 的注释）。 */
	.pill-track--in-box {
		z-index: 0;
	}
	/* hover 的定位用内容坐标（见 parkPos），没有内联的 position:fixed。 */
	/* hover：位移由 slidePill 播（含固定过冲），这里只剩尺寸 / 颜色 / 显隐。

	   width 仍然瞬时对齐：它是布局属性，和位移动画放在同一帧里会让
	   Chrome 无法把 pill 提升为独立合成层，于是每帧都要重新走
	   Paint → Layerize → Commit（实测单帧 Layerize 可达 32~37ms，主线程满载）。

	   但 height 必须过渡：列表项高度并不总是一致（多行文本、缩略图、行内标签等），
	   瞬时切换会让 pill 在两项之间「弹」一下。高度只作用在这个绝对定位的 pill 上，
	   不会引起兄弟节点重排，代价可控，所以单独给 height 一条缓动。 */
	.pill-track--hover {
		transition:
			height var(--pill-hover-dur, 0.2s) var(--pill-ease-soft),
			background-color 0.15s,
			opacity 0.15s;
	}
	/* 选中：位移同样由 slidePill 播。
	   尺寸不参与过渡：选中标记切换频率低，且 width 还会随列宽变化（理由见上）。
	   background-color 必须过渡：指针压到激活项上时它换成 activeHoverBackground
	   （「按住」档），那是选中 pill 唯一的颜色变化，且必须是原地渐变 —— 换到会移动的
	   hover pill 上去做，就会在位移途中跨色，整行先变亮再变暗（见 selectedStyle）。 */
	.pill-track--sel {
		transition:
			opacity 0.15s,
			background-color 0.15s;
	}
	.pill-track--line {
		top: auto;
		bottom: -1px;
		height: 2px;
		border-radius: 1px;
	}
	/* 下划线变体只有横向位移：同样走 slidePill，否则同一套 Tabs 在两种模式下
	   一个会弹一个不会，正是之前修过的不一致。 */
	.pill-track--hover.pill-track--line {
		transition: opacity 0.15s;
	}
	/* 减少动效：位移照样跟随，只是不再「弹」（slidePill 内部按 ease-out 走一趟）。
	   注意这里不要写 transform: none —— 那会把 pill 的位置压回原点。 */
	@media (prefers-reduced-motion: reduce) {
		.pill-track--hover,
		.pill-track--hover.pill-track--line {
			transition:
				height var(--pill-hover-dur, 0.18s) ease-out,
				background-color 0.15s,
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


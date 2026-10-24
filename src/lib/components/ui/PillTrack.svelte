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
		hoverBackground = 'var(--hover)',
		radius = 'var(--radius-md)',
		shadow = '',
		disabled = false,
		portal = false,
		zIndex = -1,
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
		/** hover pill 底色 */
		hoverBackground?: string;
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
	} = $props();

	// 几何与可见性分离：几何持久、隐藏只翻 opacity，避免下次显示时从 0,0 飞入。
	// 但残留几何必须落在容器内容起点：绝对定位元素即使 opacity:0 仍参与 scroll 范围计算
	// （transform / contain:layout 均无效，只有 display:none 才行，而那会打断过渡），
	// 隐藏时把 box 收敛到 (0,0,0,0)，既保留"不回落到 nil"的性质，也不会撑大 scrollHeight。
	let hoverGeom = $state('');
	let hoverOn = $state(false);
	let hoverBg = $state('');
	let selectedGeom = $state('');
	let selectedOn = $state(false);
	// 选中 pill 移动时长：按位移距离自适应（近快远慢），写入 --pill-dur 供 transition 读取
	let selectedDur = $state(0.26);
	let selectedBox: Box | null = null;
	// 从停放位恢复：当帧不播位移过渡（否则 pill 会从左上角飞过来）
	let restoring = $state(false);
	let hoverRestoring = $state(false);

	const hoverStyle = $derived(
		`${hoverGeom} opacity: ${hoverOn ? 1 : 0};` + (hoverRestoring ? ' transition: none;' : '')
	);
	const selectedStyle = $derived(
		`${selectedGeom} --pill-dur: ${selectedDur}s; opacity: ${selectedOn ? (disabled ? 0.5 : 1) : 0};` +
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
	 *   所以这类宿主改用 z-index:0 + 让行背景透明（见 .pill-track--in-box 注释），
	 *   pill 落在容器自己的层叠上下文里、画在容器背景之上。
	 *
	 * · 表格行单元格（tr / td / li 之类）：它们通常没有自己的背景，z-index:-1 正好
	 *   沉到行内容之下、页面背景之上，维持原来的下沉行为。
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


	const hoverBase = $derived(
		`background: ${hoverBg || hoverBackground};${radiusCss}${parkPos}`
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
		// line：t/h 恒 0（只有 left 动）；insetX：l/w 恒定（只有 top 动）→ 位移距离自然只含真实移动分量
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

	function invalidateGeom() {
		geomCache = new WeakMap();
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
	 * transform，不碰布局，滚动和悬停都不再产生 layout shift。
	 *
	 * 宽高仍用 width/height：pill 的尺寸本来就是"贴合项"的结果，需要真实
	 * 尺寸参与布局；只有位移是高频的，把高频那部分挪到合成层就够了。
	 */
	function boxStyle(b: Box): string {
		if (variant === 'line') return `transform: translate(${b.l}px, 0); width: ${b.w}px; ${boxSizeVars(b)}`;
		return `transform: translate(${b.l}px, ${b.t}px); width: ${b.w}px; height: ${b.h}px; ${boxSizeVars(b)}`;
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

	function measureSelected() {
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
		// box 未变（340ms 补测/重复触发）不重算，否则 d=0 会把时长重置为下限，飞行中途改写 transition
		if (selectedBox && (box.l !== selectedBox.l || box.t !== selectedBox.t || box.w !== selectedBox.w || box.h !== selectedBox.h)) {
			const d = wasParked ? 0 : Math.hypot(box.l - selectedBox.l, box.t - selectedBox.t);
			selectedDur = Math.min(0.4, Math.max(0.18, 0.16 + d / 1200));
		}
		selectedBox = box;
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
		const root = scrollParent(c);
		let hovered: HTMLElement | null = null;
		// ResizeObserver 按需创建：几何缓存只在指针真的划过某项后才被写入。
		// 一页挂十几二十张表时，每实例常驻一个 ResizeObserver 意味着浏览器
		// 每次布局都要回调所有实例（哪怕它们的缓存还是空的），纯开销。
		let ro: ResizeObserver | null = null;
		const ensureRo = () => {
			if (ro) return;
			ro = new ResizeObserver(invalidateGeom);
			ro.observe(c);
		};
		const onOver = (e: PointerEvent) => {
			const target = e.target as HTMLElement | null;
			const item = target?.closest?.<HTMLElement>(sel) ?? null;
			if (!item || !c.contains(item)) {
				// 行间距 / 分隔线 / 容器空白：保持当前 pill，直接滑到下一个项。
				// 只有真正离开容器、或移到 header 等非列表内容上时才隐藏。
				if (!target || target === c || target.closest?.('[role="separator"]')) return;
				hovered = null;
				setHover(false);
				return;
			}
			// 同一项内部移动（指针扫过文字/图标）不重算几何：每格都读一次 rect
			// 等于每次移动都强制一次同步布局，列表越长越卡
			if (item === hovered) return;
			hovered = item;
			if (disabledMatch && item.matches(disabledMatch)) {
				setHover(false);
				return;
			}
			// 停放恢复：当帧不播位移/高度过渡，避免从左上角飞过来、或从 0 高度展开。
			// 首次 hover 时 hoverGeom 还是空串（等价于落在 0,0,0,0），一并按停放处理。
			const wasParked = !hoverOn && (!hoverGeom || hoverGeom === PARKED);
			const box = cachedBox(item);
			if (box) {
				hoverGeom = boxStyle(box);
				// 缓存已落地，此后布局变化必须让它失效
				ensureRo();
			}
			hoverBg = item.dataset.pillBg ?? '';
			if (wasParked) {
				hoverRestoring = true;
				requestAnimationFrame(() => (hoverRestoring = false));
			}
			setHover(true);
		};
		const onLeave = () => {
			hovered = null;
			setHover(false);
			hoverBg = '';
		};
		// hover pill 用「内容坐标」定位，滚动不影响它，滚动时作废缓存即可，
		// 下一次指针划过重新量。portal 只作用于选中 pill，它有自己的测量路径。
		const onScroll = () => {
			invalidateGeom();
		};
		root.addEventListener('pointerover', onOver);
		root.addEventListener('pointerleave', onLeave);
		// 布局变化后缓存的几何会失真：滚动与尺寸变化时作废，下一次划过重新量
		root.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			root.removeEventListener('pointerover', onOver);
			root.removeEventListener('pointerleave', onLeave);
			root.removeEventListener('scroll', onScroll);
			ro?.disconnect();
			invalidateGeom();
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
		/* 位移已改用 transform，位移本身不再触发布局。
		   刻意不加 will-change: transform —— 那会让每个 pill 常驻一个合成层，
		   一页十几张表就是十几层，反而更费显存和合成时间；
		   transform 过渡在 Chrome 里同样会被自动提升，只在动画期间存在。 */
	}
	/* 两种 pill 分工不同，层叠策略也不同：
	   hover 是「行底色」，就地画在宿主容器内部（和加入 portal 之前一样），
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
	/* hover 的定位回到内容坐标（见 parkPos）：不再走 portal，也就没有内联的 position:fixed。 */
	/* hover：维持原手感（0.22s ease-out）+ 背景色 0.15s 缓动。
	   位移过渡的是 transform 而不是 left/top —— 前者走合成器，不触发重排。

	   width 仍然瞬时对齐：它是布局属性，和 transform 放在同一条 transition 里会让
	   Chrome 无法把 pill 提升为独立合成层，于是每帧都要重新走
	   Paint → Layerize → Commit（实测单帧 Layerize 可达 32~37ms，主线程满载）。

	   但 height 必须过渡：列表项高度并不总是一致（多行文本、缩略图、行内标签等），
	   瞬时切换会让 pill 在两项之间「弹」一下。高度只作用在这个绝对定位的 pill 上，
	   不会引起兄弟节点重排，代价可控，所以单独给 height 同一条缓动。 */
	.pill-track--hover {
		transition:
			transform 0.22s ease-out,
			height 0.22s ease-out,
			background-color 0.15s,
			opacity 0.15s;
	}
	/* 选中：位移 back-out 过冲回弹 + 距离自适应时长。
	   尺寸不参与过渡：选中标记切换频率低，且 width 还会随列宽变化（理由见上）。 */
	.pill-track--sel {
		transition:
			transform var(--pill-dur, 0.26s) cubic-bezier(0.34, 1.4, 0.64, 1),
			opacity 0.15s;
	}
	.pill-track--line {
		top: auto;
		bottom: -1px;
		height: 2px;
		border-radius: 1px;
	}
	.pill-track--hover.pill-track--line {
		transition: transform 0.22s ease-out, opacity 0.15s;
	}
	.pill-track--sel.pill-track--line {
		transition:
			transform var(--pill-dur, 0.26s) cubic-bezier(0.34, 1.4, 0.64, 1),
			opacity 0.15s;
	}
</style>


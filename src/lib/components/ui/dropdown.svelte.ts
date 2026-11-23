/**
 * 下拉面板的「打开 / 关闭 / 定位 / 跟随页面 / 点外部关闭」与行滚动。
 *
 * 原先 Select、Combobox、MultiSelect、CreatableSelect 各写一份：
 * 同样的 `rowsHeight` 估高、同样的 `floatingPosition` 调用、同样的
 * `position: fixed; z-index: var(--z-max)` 拼接、同样的 scroll(capture) + resize
 * 双监听、同样的 `mousedown` 外部判定、同样的「把活动行滚进可视区」六行。
 *
 * 四份之间已经漂开了：只有 Select 把面板 portal 到 body（其余三个留在原地，
 * 因此压在 `backdrop-filter` 祖先里会定位错）；只有三个实现了「活动行跟随」，
 * CreatableSelect 方向键移出可视区后看不到落点；`mounted` 这个「已定位」闸门
 * 也只有两个组件有，另两个靠 CSS 里先写死 `position: fixed` 兜第一帧。
 *
 * 现在统一到这里。抽的是**行为**，不是标记 —— 四个触发器的宽度、图标位、
 * 搜素框、页脚本来就不一样，包一层 shell 反而要为一堆差异开 props
 * （与 pickerPanel.svelte.ts 同一判断）。标记层的复用见 DropdownPanel /
 * DropdownOption / DropdownGroup。
 */
import { floatingPosition } from './floatingPosition';
import { isInsideLayer } from './overlayLayer';

/** 选项行的类名。四处共用，PillTrack 的 itemSelector 与行滚动都按它找。 */
export const OPTION_SEL = '.dd-option';

export interface DropdownSize {
	/** 面板期望宽度。不传 = 只按触发器宽度（floatingPosition 会跳过 width 输出） */
	w?: number;
	/** 面板期望高度（通常来自 rowsHeight） */
	h?: number;
}

export interface DropdownPanelOptions {
	/** 定位锚点（触发器）。未挂载时返回 null */
	anchor: () => HTMLElement | null;
	/**
	 * 「点在这里算内部」的根。默认等于 `anchor`。
	 *
	 * 两者不能合并：Combobox 的锚点必须是输入框那一圈（面板定位、宽度都按它算），
	 * 但它的面板是 `.combobox` 里的**兄弟节点**，不在锚点子树里 —— 拿锚点判外部点击，
	 * 点选项会被先判成「点了外面」直接收面板，选项根本没机会响应。
	 */
	root?: () => HTMLElement | null;
	/**
	 * 面板尺寸。宽高都要用到触发器矩形（「不窄于触发器」「跟触发器等宽」），
	 * 所以把矩形一起传进来，避免组件再量第二遍。
	 * 返回 null = 这一帧还量不出来（例如选项列表尚未就绪），本次不定位。
	 */
	size: (rect: DOMRect) => DropdownSize | null;
	/** 触发器与面板的间距，默认 4px */
	gap?: number;
	/** 弹出方向偏好，默认 bottom */
	prefer?: () => 'top' | 'bottom';
	/** 侧弹（Select 的 placement="left" | "right"） */
	side?: () => 'left' | 'right' | undefined;
	/** 面板内的滚动容器：它自己滚动不该触发重定位（否则键盘翻页会把面板推走） */
	scroller?: () => HTMLElement | null;
	/**
	 * 除触发器外还算「内部」的元素。portal 到 body 的面板不必传 ——
	 * 它自己挂着 `data-overlay-layer`，靠层链就能认出来。
	 */
	inside?: () => (Element | null | undefined)[];
	/**
	 * 本层浮层 id（配合 `data-overlay-layer`）。传了才走层链判定：
	 * 放在 Popover / Drawer 里时，点自己弹出的子浮层不算外部点击。
	 */
	layerId?: string;
	/** 打开后调用：重置查询词、加载数据、聚焦搜索框 */
	onOpen?: () => void;
	/** 关闭后调用（含点外部、Esc、选中某项） */
	onClose?: () => void;
	/**
	 * 每次跟随定位（页面滚动 / 窗口缩放）后调用。
	 * Combobox 用它收起「长选项完整值」气泡 —— 气泡是 fixed 的，不会跟着面板走。
	 */
	onFollow?: () => void;
}

export function createDropdownPanel(options: DropdownPanelOptions) {
	const gap = options.gap ?? 4;
	let open = $state(false);
	/** 面板是否已经定位过。首帧没定位就先不渲染，否则会以自然宽度闪一下 */
	let mounted = $state(false);
	let flipUp = $state(false);
	let panelStyle = $state('');

	/**
	 * 定位。三个细节都在这里统一，别再让各自组件各写一遍：
	 * · 锚点量的是**触发器**而不是 wrapper（挂载初期面板在文档流里，会把 wrapper 撑高）；
	 * · 高度由调用方给（rowsHeight 的「严格前 N 行」），不量面板自身——
	 *   列表的 max-height 会把 scrollHeight 夹住，量出来是个假值；
	 * · `mounted` 与 `panelStyle` 同一次写入，面板第一帧就是最终位置。
	 */
	function place() {
		const el = options.anchor();
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const size = options.size(rect);
		if (!size) return;
		const r = floatingPosition(rect, {
			panelW: size.w,
			panelH: size.h,
			gap,
			prefer: options.prefer?.(),
			side: options.side?.(),
		});
		flipUp = r.flipUp;
		panelStyle = r.style;
		mounted = true;
	}

	function show() {
		if (open) return;
		open = true;
		options.onOpen?.();
		place();
	}

	function hide() {
		if (!open) return;
		open = false;
		mounted = false;
		options.onClose?.();
	}

	function toggle() {
		open ? hide() : show();
	}

	$effect(() => {
		if (!open) return;
		// 先按当前状态定位一次。这一步顺带把 effect 的依赖接上 —— place() 会读
		// 调用方的 size()（那里读的是 options / filtered / items），于是「选项变了」
		// 自然触发重新定位，不需要各组件再自己挂一条 effect 盯查询词。
		place();
		const scroller = options.scroller?.() ?? null;
		// 跟随页面滚动 / 缩放。面板是 fixed 的，锚点一动就得重算
		const follow = (e: Event) => {
			if (scroller && e.target === scroller) return;
			place();
			options.onFollow?.();
		};
		const onDocDown = (e: MouseEvent) => {
			const target = e.target;
			if (!(target instanceof Node)) return;
			const root = options.root?.() ?? options.anchor();
			if (root?.contains(target)) return;
			if (options.inside?.().some((el) => el?.contains(target))) return;
			if (options.layerId && isInsideLayer(target, options.layerId, [])) return;
			hide();
		};
		document.addEventListener('mousedown', onDocDown);
		window.addEventListener('scroll', follow, true);
		window.addEventListener('resize', follow);
		return () => {
			document.removeEventListener('mousedown', onDocDown);
			window.removeEventListener('scroll', follow, true);
			window.removeEventListener('resize', follow);
		};
	});

	return {
		get open() {
			return open;
		},
		get mounted() {
			return mounted;
		},
		get flipUp() {
			return flipUp;
		},
		get panelStyle() {
			return panelStyle;
		},
		show,
		hide,
		toggle,
		place,
	};
}

/**
 * 把第 `index` 个选项滚进可视区。
 *
 * 手写边界而不是 `scrollIntoView({ block: 'nearest' })`：后者在 fixed 面板里
 * 会连带滚动最近的**可滚祖先**（页面本身的滚动容器），把整页顶上去。
 *
 * 依赖「行是滚动容器的直接子元素」：`offsetTop` 相对 offsetParent，
 * 而四个面板的滚动容器都是 `position: relative`，正好是行的 offsetParent。
 */
export function revealOption(container: HTMLElement | null | undefined, index: number) {
	if (!container || index < 0) return;
	const row = container.querySelectorAll<HTMLElement>(OPTION_SEL)[index];
	if (!row) return;
	const top = row.offsetTop;
	const bottom = top + row.offsetHeight;
	if (top < container.scrollTop) container.scrollTop = top;
	else if (bottom > container.scrollTop + container.clientHeight) {
		container.scrollTop = bottom - container.clientHeight;
	}
}

export interface EllipsisTipOptions {
	/** 面板是否打开（关了就一律收起） */
	isOpen: () => boolean;
	/** 选项所在的滚动容器 */
	container: () => HTMLElement | null;
	/** 当前活动行序号 */
	index: () => number;
	/** 列表内容变化时读一下，气泡才会按重建后的行重取 */
	deps?: () => unknown;
	/** 行内文字节点的选择器，默认 .dd-label */
	labelSel?: string;
	/** 停顿多久才弹，默认 240ms（贴近 Tooltip 默认的 200ms） */
	delay?: number;
}

/**
 * 「选项文字被省略号截断时，补一个显示完整值的气泡」。
 *
 * 为什么是**一个气泡 + 一个锚点**，而不是每项包一层 Tooltip：选项是数据驱动的，
 * 过滤后可能有上百项，每项一个组件实例就是上百个响应式节点 + 监听器
 * （与 DataTable 单元格同一套办法）。Combobox 与 CreatableSelect 都这么做，
 * 逻辑放在这里，两处只有「谁的 activeIndex」不同。
 *
 * 跟随的是 activeIndex 而不是另挂一套 pointerover 委托：选项上本来就有
 * `onmouseenter → activeIndex`，键盘上下键改的也是它，它已经是「当前项」的
 * 唯一来源，再监听一次指针只会多一条可能与它对不上的路径。
 */
export function createEllipsisTip(options: EllipsisTipOptions) {
	const delay = options.delay ?? 240;
	const labelSel = options.labelSel ?? '.dd-label';
	let anchor = $state<HTMLElement | null>(null);
	let text = $state('');
	let visible = $state(false);
	/** 延迟计时器。必须能被 close 清掉 —— 否则滚动/关闭面板后，
	 *  一个已经排上队的 timer 还会把气泡重新弹出来。 */
	let timer: ReturnType<typeof setTimeout> | null = null;

	/** 只收起当前气泡，不打断排队中的显示任务 */
	function hide() {
		visible = false;
		anchor = null;
	}

	function close() {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		hide();
	}

	$effect(() => {
		if (!options.isOpen()) {
			close();
			return;
		}
		const i = options.index();
		options.deps?.();
		// 换项先收掉上一个（同时清掉它排队中的 timer），等停住再弹新的一
		close();
		timer = setTimeout(() => {
			timer = null;
			const el = options.container()?.querySelectorAll<HTMLElement>(OPTION_SEL)[i];
			if (!el) return;
			const label = el.querySelector<HTMLElement>(labelSel);
			// 完整可见就不提示：把看到的字再念一遍没有意义
			if (!label || label.scrollWidth <= label.clientWidth + 1) return;
			text = label.textContent ?? '';
			anchor = el;
			visible = true;
		}, delay);
		return close;
	});

	return {
		get anchor() {
			return anchor;
		},
		get text() {
			return text;
		},
		get visible() {
			return visible;
		},
		hide,
		close,
	};
}

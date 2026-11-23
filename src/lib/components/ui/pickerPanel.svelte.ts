/**
 * 选择器浮层的「打开 / 关闭 / 定位 / 点外部关闭 / Esc」。
 *
 * 原先 DatePicker、DateRangePicker、TimePicker、DateTimeRangePicker 各写一份：
 * 同样的 `floatingPosition` 调用、同样的两帧定位、同样的 document 监听与清理。
 * 四份之间有细微漂移 —— 有的只量一次高度（日历排完版会变高就压到底部），
 * 有的量 `scrollHeight`；有的 Esc 忘了 `stopPropagation`（放进 Modal 里会连弹窗一起关）。
 * 现在统一到这里，组件只管「打开时重置草稿、关闭时丢弃草稿」。
 *
 * 只抽行为、不抽标记：四个触发器的样式（宽度、图标位、清除按钮位置）本来就不一样，
 * 包一层 markup 反而要为一堆视觉差异开 props。样式留在各自组件里，逻辑只有一份。
 */
import { floatingPosition } from './floatingPosition';
import { createLayerId, isInsideLayer, layerOwnerOf, registerLayer, unregisterLayer } from './overlayLayer';

export interface PickerPanelOptions {
	/** 触发器与面板的间距，默认 6px */
	gap?: number;
	/** 面板最小宽度（仅用于首次估算，最终以实际 offsetWidth 为准） */
	minWidth?: number;
	/** 上下翻转策略，透传给 floatingPosition（`space` 表示「上方空间够就往上」） */
	flip?: 'fit' | 'space';
	/** 每次打开前调用：重置草稿、刷新「今天」、清错误 */
	onOpen?: () => void;
	/** 关闭后调用（含点外部、Esc、再次点触发器） */
	onClose?: () => void;
	/**
	 * Esc 先给内层用：返回 `true` 表示「我已经处理掉这一层了」，外层面板不关。
	 * 子浮层（如 DateTimeRangePicker 的时间滚轮）靠它实现「Esc 只收一层」。
	 */
	onEscape?: () => boolean;
}

export function createPickerPanel(options: PickerPanelOptions = {}) {
	const gap = options.gap ?? 6;
	let open = $state(false);
	let flipUp = $state(false);
	let panelStyle = $state('');
	let rootEl = $state<HTMLElement | null>(null);
	let panelEl = $state<HTMLElement | null>(null);

	/**
	 * 面板的浮层身份。四个选择器自己不出问题（面板就在 `rootEl` 里，contains 够用），
	 * 登记是为了**父层**：放在 Popover 面板里的选择器，面板虽然没 portal，
	 * 但一旦以后往页脚里塞个下拉、或者某个变体改成 portal，父层得认得出这是它的子层。
	 * 一处登记，四个组件一起具备这个性质，别再让下一个组件自己想。
	 */
	const layerId = createLayerId('picker');

	/**
	 * 面板高度取 `max(offsetHeight, scrollHeight)`：日历日期格是网格排出来的，
	 * 首帧量到的常常是「一个月的高度」，等字体/间距定下来会再长一截，
	 * 只量 offsetHeight 会让它在贴近视口底部时压到屏幕外。
	 */
	function place() {
		if (!rootEl || !panelEl) return;
		const r = floatingPosition(rootEl.getBoundingClientRect(), {
			panelW: Math.max(panelEl.offsetWidth, options.minWidth ?? 0),
			panelH: Math.max(panelEl.offsetHeight, panelEl.scrollHeight),
			gap,
			flip: options.flip,
		});
		flipUp = r.flipUp;
		panelStyle = r.style;
	}

	function show() {
		options.onOpen?.();
		open = true;
		// 首帧面板还是自然宽度，宽度一上身内容会重排，第二帧再定位一次
		requestAnimationFrame(() => {
			place();
			requestAnimationFrame(place);
		});
	}

	function hide() {
		if (!open) return;
		open = false;
		options.onClose?.();
	}

	function toggle() {
		open ? hide() : show();
	}

	/** 面板/窗口尺寸变化时重新定位（滚动容器里打开、或窗口被拉窄） */
	function reposition() {
		if (open) place();
	}

	$effect(() => {
		const el = panelEl;
		if (!el) return;
		const owner = layerOwnerOf(el);
		el.dataset.overlayLayer = layerId;
		registerLayer(layerId, owner);
		return () => {
			unregisterLayer(layerId);
			delete el.dataset.overlayLayer;
		};
	});

	$effect(() => {
		if (!open) return;
		const onDocDown = (e: MouseEvent) => {
			// 层链判定而不是纯 contains：面板里将来若出现 portal 出去的子浮层，点它不该收面板
			if (isInsideLayer(e.target, layerId, [rootEl])) return;
			hide();
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			// capture + stopPropagation：放进 Modal/Drawer 里时只关这一层
			e.stopPropagation();
			if (options.onEscape?.()) return;
			hide();
		};
		document.addEventListener('mousedown', onDocDown);
		document.addEventListener('keydown', onKey, true);
		window.addEventListener('resize', reposition, { passive: true });
		return () => {
			document.removeEventListener('mousedown', onDocDown);
			document.removeEventListener('keydown', onKey, true);
			window.removeEventListener('resize', reposition);
		};
	});

	return {
		get open() {
			return open;
		},
		get flipUp() {
			return flipUp;
		},
		get panelStyle() {
			return panelStyle;
		},
		get rootEl() {
			return rootEl;
		},
		set rootEl(v: HTMLElement | null) {
			rootEl = v;
		},
		get panelEl() {
			return panelEl;
		},
		set panelEl(v: HTMLElement | null) {
			panelEl = v;
		},
		show,
		hide,
		toggle,
		reposition,
	};
}

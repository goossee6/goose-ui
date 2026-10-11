<script lang="ts">
	import { onDestroy } from 'svelte';
	import { flip } from 'svelte/animate';
	import {
		notificationStore,
		type NotificationItem as NotificationItemType,
		type NotificationPosition,
	} from '../notification';
	import NotificationItem from './NotificationItem.svelte';

	let {
		class: cls = '',
		style = '',
		gap = 14,
		visibleToasts = 3,
		expand = false,
		hotkey = ['altKey', 'KeyT'],
	}: {
		class?: string;
		style?: string;
		gap?: number;
		visibleToasts?: number;
		expand?: boolean;
		hotkey?: string[];
	} = $props();

	const positions: NotificationPosition[] = [
		'top-left', 'top', 'top-right',
		'bottom-left', 'bottom', 'bottom-right',
	];

	// 注意：变量名不可叫 state —— 会与 $state rune 在 svelte-check 检测中冲突
	const stacks: Record<NotificationPosition, NotificationItemType[]> = $state({
		'top-left': [], 'top': [], 'top-right': [],
		'bottom-left': [], 'bottom': [], 'bottom-right': [],
	});

	let userExpanded = $state(false);
	let interacting = $state(false);
	let rootEl = $state<HTMLElement | null>(null);
	// prefers-reduced-motion：sonner 用 CSS 关闭全部过渡/动画；我们的入/退场/flip 是 JS 动画，需同步门控
	let reducedMotion = $state(false);
	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = mq.matches;
		const onChange = (e: MediaQueryListEvent) => (reducedMotion = e.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});
	const expanded = $derived(expand || userExpanded);
	const hotkeyLabel = $derived(hotkey.join('+').replace(/Key/g, ''));

	// margins-anim：margin 过渡窗口（展开/收起切换、纯内容更新）。列表增删时 margin 瞬时到位、由 flip 平滑。
	let marginsAnimTimer: ReturnType<typeof setTimeout> | undefined;
	function bumpMarginsAnim() {
		if (!rootEl) return;
		rootEl.classList.add('margins-anim');
		clearTimeout(marginsAnimTimer);
		marginsAnimTimer = setTimeout(() => rootEl?.classList.remove('margins-anim'), 450);
	}
	onDestroy(() => clearTimeout(marginsAnimTimer));

	$effect(() => {
		const unsubs = positions.map((p) =>
			notificationStore.subscribe(p, (items) => {
				stacks[p] = items;
			})
		);
		return () => unsubs.forEach((u) => u());
	});

	// 展开期间暂停全部倒计时
	$effect(() => {
		notificationStore.setSuspend('expanded', expanded);
	});

	// 展开/收起切换窗口内开启 margin 过渡（大距离展开动画）；窗口外 margin 瞬时到位
	let expandPrimed = false;
	$effect(() => {
		expanded;
		if (!expandPrimed) {
			expandPrimed = true;
			return;
		}
		bumpMarginsAnim();
	});

	// 仅剩 1 条时强制收起（sonner 行为）
	$effect(() => {
		const total = positions.reduce((s, p) => s + stacks[p].length, 0);
		if (total <= 1) userExpanded = false;
	});

	// 热键展开（默认 Alt+T）/ Escape 收起（焦点在通知内时）
	$effect(() => {
		function onKeydown(event: KeyboardEvent) {
			const pressed =
				hotkey.length > 0 &&
				hotkey.every((key) => (event as unknown as Record<string, boolean>)[key] || event.code === key);
			if (pressed) {
				userExpanded = true;
				requestAnimationFrame(() => {
					rootEl?.querySelector<HTMLElement>('.nc.has-items')?.focus();
				});
			}
			if (event.code === 'Escape' && userExpanded) {
				userExpanded = false;
			}
		}
		window.addEventListener('keydown', onKeydown);
		return () => window.removeEventListener('keydown', onKeydown);
	});

	// 离场中的卡片（ns-leaving）已移出文档流，不参与 front 判定
	function isFrontItem(node: Element): boolean {
		if (node.classList.contains('ns-leaving')) return false;
		let el = node.nextElementSibling;
		while (el) {
			if (el.classList.contains('ns') && !el.classList.contains('ns-leaving')) return false;
			el = el.nextElementSibling;
		}
		return true;
	}

	// --front-h：取各容器最新一张（非离场）卡片的自然高度
	let frontRaf = 0;
	function remeasureFronts() {
		if (!rootEl) return;
		for (const nc of rootEl.querySelectorAll<HTMLElement>('.nc')) {
			const items = [...nc.querySelectorAll(':scope > .ns')].filter(
				(el) => !el.classList.contains('ns-leaving')
			);
			const natural = items[items.length - 1]?.querySelector<HTMLElement>(
				':scope > .ni > .notification'
			);
			if (natural) nc.style.setProperty('--front-h', `${natural.offsetHeight}px`);
		}
	}
	// 纯内容更新（各位置列表长度不变）时开 margin 过渡窗口：与 .ni 的 height 400ms 同步，
	// 整栈平滑重排且 sliver 节距恒定（sonner height .4s 对齐）；列表增删不进此窗口（由 flip 平滑）
	let lastLengths: number[] | null = null;
	$effect(() => {
		const lengths = positions.map((p) => stacks[p].length);
		if (lastLengths !== null && lengths.every((n, i) => n === lastLengths![i])) {
			bumpMarginsAnim();
		}
		lastLengths = lengths;
		cancelAnimationFrame(frontRaf);
		frontRaf = requestAnimationFrame(remeasureFronts);
		return () => cancelAnimationFrame(frontRaf);
	});

	// 测量卡片自然高度写入 --h（取 .notification，收起钳制不影响测量）；最新一张同步容器 --front-h
	function stackHeight(node: HTMLElement) {
		let ro: ResizeObserver | null = null;
		const set = () => {
			const natural = node.querySelector<HTMLElement>(':scope > .ni > .notification');
			if (!natural) return;
			const h = `${natural.offsetHeight}px`;
			node.style.setProperty('--h', h);
			if (isFrontItem(node)) node.parentElement?.style.setProperty('--front-h', h);
		};
		const attach = () => {
			if (ro) return;
			const natural = node.querySelector<HTMLElement>(':scope > .ni > .notification');
			if (!natural) return;
			ro = new ResizeObserver(set);
			ro.observe(natural);
		};
		set();
		attach();
		requestAnimationFrame(() => {
			set();
			attach();
		});
		return {
			destroy() {
				ro?.disconnect();
				node.style.removeProperty('--h');
			},
		};
	}

	const positionMap: Record<NotificationPosition, string> = {
		'top-left':    'top:24px;left:24px;',
		'top':         'top:24px;left:50%;transform:translateX(-50%);',
		'top-right':   'top:24px;right:24px;',
		'bottom-left': 'bottom:24px;left:24px;',
		'bottom':      'bottom:24px;left:50%;transform:translateX(-50%);',
		'bottom-right':'bottom:24px;right:24px;',
	};

	// CSS 默认 ease（cubic-bezier(0.25, 0.1, 0.25, 1)），sonner 进出场 transition 使用此曲线
	function bezierEase(x1: number, y1: number, x2: number, y2: number) {
		const cx = 3 * x1;
		const bx = 3 * (x2 - x1) - cx;
		const ax = 1 - cx - bx;
		const cy = 3 * y1;
		const by = 3 * (y2 - y1) - cy;
		const ay = 1 - cy - by;
		const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
		const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
		const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
		return (x: number) => {
			let t = x;
			for (let i = 0; i < 5; i++) {
				const d = dX(t);
				if (Math.abs(d) < 1e-6) break;
				t -= (sampleX(t) - x) / d;
				t = Math.min(1, Math.max(0, t));
			}
			return sampleY(t);
		};
	}
	const easeSoner = bezierEase(0.25, 0.1, 0.25, 1);

	// 进场（sonner）：从贴边外（自身高度）滑入 + 淡入，400ms ease
	function slideIn(_node: Element, { top = true }: { top?: boolean } = {}) {
		if (reducedMotion) return { duration: 0 };
		const from = top ? -100 : 100;
		return {
			duration: 400,
			easing: easeSoner,
			css: (t: number, u: number) => `opacity: ${t}; transform: translateY(${u * from}%);`,
		};
	}

	// 退场（sonner 三态）：front 与展开态非 front 均为自身高度 ∓100%（sonner: lift*-100% 相对行程，
	// 展开态含 offset 基址）+ opacity .4s 截断至 200ms 卸载；收起态非 front 朝屏幕边缘 40%（方向为用户指定，
	// sonner 恒向下），transform 走 .5s 曲线截 40% 进度，opacity 独立 .2s 精确归零（消除卸载时 0.41 残影）
	let leavingCount = $state(0);
	function slideOut(
		node: Element,
		{
			top = true,
			front = true,
			expandedNow = false,
		}: { top?: boolean; front?: boolean; expandedNow?: boolean } = {}
	) {
		// 已在滑除动画中的卡片直接移除，避免 outro 闪回原位二次动画
		if (
			node.classList.contains('ns-swipe-out-up') ||
			node.classList.contains('ns-swipe-out-down') ||
			node.classList.contains('ns-swipe-out-left') ||
			node.classList.contains('ns-swipe-out-right')
		) {
			return { duration: 0 };
		}
		// front 判定必须在 prepend 之前用 DOM 实测：传入的 front 基于上次渲染的静态索引 i 与
		// 响应式 length 比较，删除中间卡时 length 已减 1，会把倒数第二张误判为 front（走 -100% 行程）。
		// isFrontItem 走 nextElementSibling 找非离场 .ns，不受 length 变化影响。
		const reallyFront = node instanceof HTMLElement ? isFrontItem(node) : front;
		// 离场节点 pin 到 absolute + prepend 到 DOM 首位（column-reverse 视觉底部）。
		// 离场窗口内 :last-child 边距规则立即对剩余兄弟生效（新 front margin-top:0，其余 gap-front-h），
		// 布局一次到位，由 svelte flip（400ms easeSoner）平滑剩余兄弟位移。
		// leavingCount 仅压制 array 删除 flush 中 svelte flip 的二次错误动画（pin 前布局已塌陷），
		// prepend 后立即归零，让本帧 flip 以正确目标（新布局）平滑过渡。
		if (node instanceof HTMLElement) {
			const nc = node.parentElement;
			// 钉住视觉原位（实测 rect.top）：离场 transform 相对原位滑动，收起/展开态均正确。
			// prepend 到 DOM 首位 → :last-child 立即指向新 front，边距一次到位，svelte flip 平滑兄弟位移。
			if (nc) {
				const cr = nc.getBoundingClientRect();
				const rect = node.getBoundingClientRect();
				node.style.position = 'absolute';
				node.style.top = `${rect.top - cr.top}px`;
				node.style.left = `${rect.left - cr.left}px`;
				node.style.width = `${rect.width}px`;
				node.classList.add('ns-leaving');
				node.style.margin = '0';
				nc.prepend(node);
				remeasureFronts();
				leavingCount = 0;
			}
		}
		// 离场结束后再测一次 front 高度（防止测量落在离场帧）
		setTimeout(remeasureFronts, 280);
		if (reducedMotion) return { duration: 0 };
		// svelte 5 out 过渡：css 回调收到 t = 1 - easing(p)（反转进度）。
		// (1-t) 还原为 easing(p)：起点 0、终点 easeSoner(截断值) —— front 行程 ~70%、sliver ~23%，
		// 与 sonner「.4s/.5s 曲线在 200ms 卸载」的截断视觉一致。
		if (reallyFront || expandedNow) {
			// front / 展开态非 front：贴边（或原位）滑出自身高度（sonner: translateY(lift * -100%)）
			const dir = top ? -100 : 100;
			return {
				duration: 200,
				easing: (t: number) => easeSoner(t / 2),
				css: (t: number) => `opacity: ${t}; transform: translateY(${(1 - t) * dir}%);`,
			};
		}
		// 收起态非 front：朝屏幕边缘方向 40% 位移（sonner .5s 曲线截 40% 进度）
		const shift = top ? -40 : 40;
		const ni = node instanceof HTMLElement ? node.querySelector<HTMLElement>(':scope > .ni') : null;
		if (ni) {
			ni.style.transition = 'opacity 200ms';
			ni.style.opacity = '0';
		}
		return {
			duration: 200,
			easing: (t: number) => easeSoner(t * 0.4),
			css: (t: number) => `transform: translateY(${(1 - t) * shift}%);`,
		};
	}

	// ---- swipe-to-dismiss（复刻 sonner：阈值 45px / 速度 >0.11 / 阻尼 / 方向限制）----
	const SWIPE_THRESHOLD = 45;

	interface SwipeSession {
		el: HTMLElement;
		ni: HTMLElement;
		id: number;
		position: NotificationPosition;
		pointerId: number;
		startX: number;
		startY: number;
		startT: number;
		axis: 'x' | 'y' | null;
		out: boolean;
	}

	let swipe: SwipeSession | null = null;
	let swipeId = $state(0);

	function swipeDirectionsFor(pos: NotificationPosition): string[] {
		return pos.startsWith('top') ? ['top', 'left', 'right'] : ['bottom', 'left', 'right'];
	}

	function dampen(delta: number) {
		const factor = Math.abs(delta) / 20;
		return delta / (1.5 + factor);
	}

	function handlePointerDown(event: PointerEvent, item: NotificationItemType) {
		if (event.button === 2) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('button')) return;
		const el = event.currentTarget as HTMLElement;
		const ni = el.querySelector<HTMLElement>(':scope > .ni');
		if (!ni) return;
		interacting = true;
		el.setPointerCapture(event.pointerId);
		swipe = {
			el,
			ni,
			id: item.id,
			position: item.position,
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			startT: Date.now(),
			axis: null,
			out: false,
		};
		swipeId = item.id;
	}

	function handlePointerMove(event: PointerEvent) {
		const s = swipe;
		if (!s || s.out || event.pointerId !== s.pointerId) return;
		const selection = window.getSelection()?.toString();
		if (selection && selection.length > 0) return;
		const xDelta = event.clientX - s.startX;
		const yDelta = event.clientY - s.startY;
		if (!s.axis && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
			s.axis = Math.abs(xDelta) > Math.abs(yDelta) ? 'x' : 'y';
		}
		const dirs = swipeDirectionsFor(s.position);
		let amountX = 0;
		let amountY = 0;
		if (s.axis === 'y') {
			if ((dirs.includes('top') && yDelta < 0) || (dirs.includes('bottom') && yDelta > 0)) {
				amountY = yDelta;
			} else {
				const d = dampen(yDelta);
				amountY = Math.abs(d) < Math.abs(yDelta) ? d : yDelta;
			}
		} else if (s.axis === 'x') {
			if ((dirs.includes('left') && xDelta < 0) || (dirs.includes('right') && xDelta > 0)) {
				amountX = xDelta;
			} else {
				const d = dampen(xDelta);
				amountX = Math.abs(d) < Math.abs(xDelta) ? d : xDelta;
			}
		}
		s.ni.style.setProperty('--sx', `${amountX}px`);
		s.ni.style.setProperty('--sy', `${amountY}px`);
	}

	function endSwipe(s: SwipeSession) {
		swipe = null;
		swipeId = 0;
		interacting = false;
	}

	function handlePointerUp(event: PointerEvent) {
		const s = swipe;
		if (!s || s.out || event.pointerId !== s.pointerId) return;
		endSwipe(s);
		if (s.axis) userExpanded = false;
		const get = (v: string) => Number(s.ni.style.getPropertyValue(v).replace('px', '')) || 0;
		const amountX = get('--sx');
		const amountY = get('--sy');
		const timeTaken = Math.max(1, Date.now() - s.startT);
		const amount = s.axis === 'x' ? amountX : amountY;
		const velocity = Math.abs(amount) / timeTaken;
		const dirs = swipeDirectionsFor(s.position);
		const isAllowed =
			s.axis === 'x'
				? dirs.includes(amountX > 0 ? 'right' : 'left')
				: s.axis === 'y'
					? dirs.includes(amountY > 0 ? 'bottom' : 'top')
					: false;
		if (s.axis && isAllowed && (Math.abs(amount) >= SWIPE_THRESHOLD || velocity > 0.11)) {
			const dir = s.axis === 'x' ? (amountX > 0 ? 'right' : 'left') : (amountY > 0 ? 'down' : 'up');
			s.el.classList.add(`ns-swipe-out-${dir}`);
			s.out = true;
			setTimeout(() => notificationStore.remove(s.position, s.id), 200);
			return;
		}
		s.ni.style.setProperty('--sx', '0px');
		s.ni.style.setProperty('--sy', '0px');
	}

	function handlePointerCancel(event: PointerEvent) {
		const s = swipe;
		if (!s || event.pointerId !== s.pointerId) return;
		endSwipe(s);
		if (s.axis) userExpanded = false;
		s.ni.style.setProperty('--sx', '0px');
		s.ni.style.setProperty('--sy', '0px');
	}
</script>

<div
	class="notification-root {cls}"
	style="--stack-gap:{gap}px;{style}"
	bind:this={rootEl}
	aria-label="Notifications {hotkeyLabel}"
>
	{#each positions as pos}
		<div
			class="nc {pos}"
			class:expanded
			class:has-items={stacks[pos].length > 0}
			style={positionMap[pos]}
			role="list"
			tabindex={-1}
			onmouseenter={() => (userExpanded = true)}
			onmousemove={() => (userExpanded = true)}
			onmouseleave={() => {
				if (!interacting) userExpanded = false;
			}}
		>
			{#each stacks[pos] as item, i (item.id)}
				{@const toastsBefore = stacks[pos].length - 1 - i}
				<div
					class="ns"
					class:beyond={!expanded && toastsBefore >= visibleToasts}
					class:swiping={swipeId === item.id}
					style="--i:{toastsBefore}"
					role="listitem"
					use:stackHeight
					in:slideIn={{ top: pos.startsWith('top') }}
					out:slideOut={{
						top: pos.startsWith('top'),
						front: i === stacks[pos].length - 1,
						expandedNow: expanded,
					}}
					animate:flip={{ duration: reducedMotion || leavingCount > 0 ? 0 : 400, easing: easeSoner }}
					onoutroend={() => (leavingCount = Math.max(0, leavingCount - 1))}
					onpointerdown={(e) => handlePointerDown(e, item)}
					onpointermove={handlePointerMove}
					onpointerup={handlePointerUp}
					onpointercancel={handlePointerCancel}
				>
					<div class="ni">
						<NotificationItem toast={item} />
					</div>
				</div>
			{/each}
		</div>
	{/each}
</div>

<style>
	.notification-root {
		position: fixed;
		inset: 0;
		z-index: var(--z-notification);
		pointer-events: none;
	}
	.nc {
		position: fixed;
		display: flex;
		flex-direction: column;
		pointer-events: none;
		outline: 0;
	}
	.nc.top-left, .nc.top, .nc.top-right {
		flex-direction: column-reverse;
	}

	/* 卡片外壳：flip/in/out 占用 transform */
	.ns {
		will-change: transform, opacity;
		--notif-bg: #fefefe;
	}
	.nc > .ns:last-child {
		--notif-bg: #ffffff;
	}
	/* 收起态卡片重叠：任何 drop shadow（含 front 往下投的）都会污染 sliver，导致中层比下层暗。
	   收起态全部去阴影，层级靠 border + 缩放区分；展开态卡片有真实间隙，保留阴影 */
	.nc:not(.expanded) > .ns :global(.notification) {
		box-shadow: none;
	}
	/* 仅展开/收起切换窗口内 margin 做过渡；插入/删除时 margin 瞬时到位（由 flip 平滑 ±gap 位移），
	   避免新卡入场时旧卡被布局先挤下再由 margin 拉回的「先位移后缩放」摆动 */
	.margins-anim > .nc > .ns {
		transition: margin 400ms;
	}
	.ns.ns-leaving {
		position: absolute;
		transition: none;
	}

	/* 内层：承载缩放、swipe 位移与收起高度钳制 */
	.ni {
		--sc: 1;
		transform: translate(var(--sx, 0px), var(--sy, 0px)) scale(var(--sc));
		transition: transform 400ms, opacity 400ms, height 400ms;
		height: var(--h);
	}
	.nc.top-left .ni, .nc.top .ni, .nc.top-right .ni {
		transform-origin: top center;
	}
	.nc.bottom-left .ni, .nc.bottom .ni, .nc.bottom-right .ni {
		transform-origin: bottom center;
	}

	/* 收起（sonner collapsed）：非最新卡钳制成最新卡高度、按 gap 错位、逐层缩小 5%、内容隐藏 */
	.nc:not(.expanded) > .ns:not(:last-child) .ni {
		height: var(--front-h, 36px);
		overflow: hidden;
		--sc: calc(1 - var(--i, 0) * 0.05);
	}
	.nc:not(.expanded) > .ns:not(:last-child) :global(.notification > *) {
		opacity: 0;
		transition: opacity 400ms;
	}

	/* 展开：自然高度、正 gap 间距、内容可见 */
	.nc.expanded.top-left > .ns:not(:last-child),
	.nc.expanded.top > .ns:not(:last-child),
	.nc.expanded.top-right > .ns:not(:last-child) {
		margin-top: var(--stack-gap);
	}
	.nc.expanded.bottom-left > .ns:not(:last-child),
	.nc.expanded.bottom > .ns:not(:last-child),
	.nc.expanded.bottom-right > .ns:not(:last-child) {
		margin-bottom: var(--stack-gap);
	}

	/* sonner：展开态每张卡向上伸出 gap+1px 透明触条填补间隙，指针跨越间隙不丢失 hover（防闪烁） */
	.nc.expanded > .ns {
		position: relative;
	}
	.nc.expanded > .ns::after {
		content: '';
		position: absolute;
		left: 0;
		width: 100%;
		height: calc(var(--stack-gap) + 1px);
		bottom: 100%;
	}

	/* 收起边距：每张非最新卡朝更新方向压缩为 gap - front-h */
	.nc:not(.expanded).top-left > .ns:not(:last-child),
	.nc:not(.expanded).top > .ns:not(:last-child),
	.nc:not(.expanded).top-right > .ns:not(:last-child) {
		margin-top: calc(var(--stack-gap) - var(--front-h, 36px));
	}
	.nc:not(.expanded).bottom-left > .ns:not(:last-child),
	.nc:not(.expanded).bottom > .ns:not(:last-child),
	.nc:not(.expanded).bottom-right > .ns:not(:last-child) {
		margin-bottom: calc(var(--stack-gap) - var(--front-h, 36px));
	}

	/* 超出 visibleToasts：不可见不可交互（数据保留） */
	.nc:not(.expanded) > .ns.beyond .ni {
		opacity: 0;
	}
	.nc:not(.expanded) > .ns.beyond {
		pointer-events: none;
	}

	/* swipe 拖拽中禁用 transform 过渡，保证跟手 */
	.ns.swiping .ni {
		transition: none;
	}

	/* swipe 滑出（200ms ease-out，sonner keyframes 等价） */
	@keyframes ns-swipe-out-up {
		from { transform: translate(var(--sx, 0px), var(--sy, 0px)); opacity: 1; }
		to { transform: translate(var(--sx, 0px), calc(var(--sy, 0px) - 100%)); opacity: 0; }
	}
	@keyframes ns-swipe-out-down {
		from { transform: translate(var(--sx, 0px), var(--sy, 0px)); opacity: 1; }
		to { transform: translate(var(--sx, 0px), calc(var(--sy, 0px) + 100%)); opacity: 0; }
	}
	@keyframes ns-swipe-out-left {
		from { transform: translate(var(--sx, 0px), var(--sy, 0px)); opacity: 1; }
		to { transform: translate(calc(var(--sx, 0px) - 100%), var(--sy, 0px)); opacity: 0; }
	}
	@keyframes ns-swipe-out-right {
		from { transform: translate(var(--sx, 0px), var(--sy, 0px)); opacity: 1; }
		to { transform: translate(calc(var(--sx, 0px) + 100%), var(--sy, 0px)); opacity: 0; }
	}
	.ns.ns-swipe-out-up .ni { animation: ns-swipe-out-up 200ms ease-out forwards; }
	.ns.ns-swipe-out-down .ni { animation: ns-swipe-out-down 200ms ease-out forwards; }
	.ns.ns-swipe-out-left .ni { animation: ns-swipe-out-left 200ms ease-out forwards; }
	.ns.ns-swipe-out-right .ni { animation: ns-swipe-out-right 200ms ease-out forwards; }

	.nc > :global(*) { pointer-events: auto; }

	/* sonner 对齐：prefers-reduced-motion 关闭全部过渡/动画（JS 入/退场/flip 由 reducedMotion 状态同步降 0） */
	@media (prefers-reduced-motion: reduce) {
		.ns,
		.ni,
		.notification > * {
			transition: none !important;
			animation: none !important;
		}
	}
</style>

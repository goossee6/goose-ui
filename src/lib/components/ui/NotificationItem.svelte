<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Info from '@lucide/svelte/icons/info';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import X from '@lucide/svelte/icons/x';
	import Icon from './Icon.svelte';
	import type { NotificationItem as NotificationItemType, NotificationStore } from '../notification';

	let {
		toast,
		store,
		/** 向下展开（top-* 位置）：揭幕层从上往下让开。false = 从下往上让开 */
		drop = true,
		class: cls = '',
		style = '',
	}: {
		toast: NotificationItemType;
		/** 所属 Provider 的 store 实例（每个 Provider 独立，不共享） */
		store: NotificationStore;
		drop?: boolean;
		class?: string;
		style?: string;
	} = $props();

	let rootEl = $state<HTMLElement | null>(null);

	/* ── 入场「彩色揭幕」 ──────────────────────────────────────────────
	   通知默认底色（亮色白 / 暗色 surface）在浅色界面里几乎看不出来，出现时
	   完全不起眼。所以入场那一下整条先铺满类型语义色（success 绿 / info 蓝 /
	   warning 橙 / error 红），滑入到位后这层色再从上往下让开、露出原本的
	   底色 —— 和英伟达驱动「开始录制 / 已保存」那条通知的观感一致：先用颜色
	   把注意力钉住，再由彩转回中性。

	   用独立覆盖层而不是直接 transition 背景色：底色来自 --notif-bg（还会被
	   Provider 按「是否最新一张」分两档），直接过渡要同时覆盖两层规则；覆盖层
	   只需要在盖着/让开两种状态间切换，也顺带保证文字色和白字的对比不受底色
	   影响。

	   用 WAAPI 而不是 CSS transition：Svelte 5 的 `class:` 由 $effect 统一
	   flush，而 inset:0 写出的 top/height 是计算值、初始值与终值由浏览器解析，
	   两帧之间浏览器可能合并成一次样式重算 —— 元素一上来就是终态，transition
	   根本没有起点可插值，视觉上直接消失。显式写 from/to 的关键帧没有这个
	   问题。 */
	const COVER_DELAY = 300;
	/** 让开动画时长 */
	const COVER_FADE = 1000;
	/**
	 * 让开动画的缓动曲线（per-property easing，作用在整段插值上）。
	 *
	 * 这里不能用「切成均匀台阶的多段关键帧」：一段关键帧内浏览器仍会抽帧，
	 * 台阶越多、每段越短，非整帧的时刻被采样到时色条高度就会出现 2~3px 的
	 * 台阶 —— 视觉上就是一顿一顿。改成**单个段 + 一条平滑曲线**，位置由
	 * 曲线连续给出，没有台阶边界可顿。
	 *
	 * 曲线形状：快 → 慢 → 最后约 30% 再抢一下收干净。
	 * - 起点 (0.08, 0.78)：开场就冲出去；
	 * - 终点控制点 (0.70, 0.97)：末端斜率 (1-0.97)/(1-0.70) = 0.1，
	 *   而前一段是 0.067 —— 斜率沿曲线持续变大（0.1 → 1），最后 30% 是
	 *   一段加速下坠，色条不会在边缘挂着。x2 越小，这段越长。
	 *
	 * 之前踩过的坑：y2 取 1 时终点斜率趋近 0，最后几个像素要熬掉近三成时长，
	 * 叠在**竖直方向**看就是一根细线在底边挂很久（水平方向行程以百像素计，
	 * 察觉不到；通知高度只有几十像素，同样比例就很显眼）。所以 y2 永远不取 1。
	 *
	 * 想更冲：y1 提到 0.9；想让最后一段更短促：把 x2 推近 1。
	 */
	const COVER_EASE = 'cubic-bezier(0.08, 0.78, 0.7, 0.97)';
	let coverEl = $state<HTMLElement | null>(null);
	let uncoverTimer: ReturnType<typeof setTimeout> | null = null;

	function playUncover() {
		const el = coverEl;
		if (!el) return;
		if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
			el.remove();
			return;
		}
		// 等入场滑入（400ms）走完再开始让开，避免两段动画抢注意力
		uncoverTimer = setTimeout(() => {
			uncoverTimer = null;
			// 两帧即可：起点铺满（高度用实测像素，写 auto 只在单帧有效），
			// 终点零高；中间完全交给 COVER_EASE 连续插值
			const h = `${el.getBoundingClientRect().height.toFixed(2)}px`;
			const frames = drop
				? [{ top: '0px', bottom: '0px', height: h, easing: COVER_EASE }, { top: '100%', bottom: '0px', height: '0px' }]
				: [{ top: '0px', bottom: '0px', height: h, easing: COVER_EASE }, { top: '0px', bottom: '100%', height: '0px' }];
			const anim = el.animate(frames, { duration: COVER_FADE, fill: 'forwards' });
			anim.onfinish = () => el.remove();
		}, COVER_DELAY);
	}

	$effect(() => {
		playUncover();
		return () => {
			if (uncoverTimer) clearTimeout(uncoverTimer);
		};
	});

	// 静止光标不派发 mouseenter：通知滑入时若已落在光标下，需主动检测 :hover 补暂停
	$effect(() => {
		const el = rootEl;
		if (!el || !toast.pauseOnHover || toast.duration <= 0) return;
		requestAnimationFrame(() => {
			if (el.isConnected && el.matches(':hover')) {
				store.pause(toast.position, toast.id);
			}
		});
	});

	function close() {
		store.remove(toast.position, toast.id);
	}

	function handleMouseEnter() {
		if (toast.pauseOnHover && toast.duration > 0) {
			store.pause(toast.position, toast.id);
		}
	}

	function handleMouseLeave() {
		if (toast.pauseOnHover && toast.duration > 0) {
			store.resume(toast.position, toast.id);
		}
	}

	function handleClick() {
		toast.onClick?.();
	}

	/** 带 onClick 的通知条本身才是可操作目标，给它补上键盘等价路径（Enter / 空格） */
	function handleKeydown(e: KeyboardEvent) {
		if (!toast.onClick) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}
</script>

<!-- 通知条是 role="alert" 的容器：点击转发 toast.onClick，鼠标进出暂停倒计时。
     带 onClick 时额外获得 tabindex + Enter/空格，键盘用户也能触发； -->
<!-- 没有 onClick 的纯展示通知不进入 Tab 序列，键盘路径由 toast.btn / 关闭按钮提供 -->
<!-- tabindex 这条是有意为之：容器只因 onClick 才可聚焦，改成 role="button" 反而会把
     内部的关闭按钮 / btn 嵌进 button 语义里（无效嵌套） -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions, a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex -->
<div
	class="notification notification-{toast.type} {cls}"
	style={style}
	bind:this={rootEl}
	role="alert"
	aria-live="polite"
	tabindex={toast.onClick ? 0 : undefined}
	onclick={handleClick}
	onkeydown={handleKeydown}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<div class="notification-icon">
		{#if toast.icon}
			<Icon icon={toast.icon} size={24} />
		{:else if toast.type === 'success'}
			<Icon icon={CircleCheck} size={24} />
		{:else if toast.type === 'info'}
			<Icon icon={Info} size={24} />
		{:else if toast.type === 'warning'}
			<Icon icon={AlertTriangle} size={24} />
		{:else}
			<Icon icon={CircleX} size={24} />
		{/if}
	</div>
	<div class="notification-body">
		<span class="notification-title">{toast.title}</span>
		{#if toast.description}
			<span class="notification-desc">{toast.description}</span>
		{/if}
	</div>
	{#if toast.closable}
		<button type="button" class="notification-close" onclick={close} aria-label="关闭">
			{#if toast.closeIcon}
				<Icon icon={toast.closeIcon} size={14} />
			{:else}
				<Icon icon={X} size={14} />
			{/if}
		</button>
	{/if}
	{#if toast.btn}
		<div class="notification-btn">{@render toast.btn()}</div>
	{/if}
	{#if toast.showProgress && toast.duration > 0}
		<div class="notification-progress">
			<div
				class="notification-progress-bar"
				class:paused={toast._paused}
				style="animation-duration: {toast.duration}ms"
			></div>
		</div>
	{/if}
	<!-- 彩色揭幕层：盖住整条，滑入后按 drop 方向上/下让开。
	     放在最后 → 压在内容之上，入场瞬间文字被暂时遮住，约 320ms 后露出 -->
	<div class="notification-cover" bind:this={coverEl} aria-hidden="true"></div>
</div>

<style>
	.notification {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--sp-md);
		padding: var(--sp-lg) var(--sp-lg);
		width: var(--notif-width);
		max-width: calc(100vw - 48px);
		border-radius: var(--radius-lg);
		font-size: 14px;
		color: var(--text-strong);
		background-color: var(--notif-bg, var(--surface));
		border: 1px solid var(--border);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06);
		cursor: pointer;
		overflow: hidden;
	}

	/* 带 onClick 的通知条会成为 Tab 站，键盘聚焦时必须看得见 */
	.notification:focus-visible {
		outline: 2px solid var(--accent-ring);
		outline-offset: 2px;
	}

	/* 图标容器统一中性色：类型由揭幕层的彩色一眼表达，图标区不必再抢色 */
	.notification-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		color: var(--text-strong);
	}

	/* ── 彩色揭幕层 ──
	   亮色主题用 --*-text 档（更深的色，白字压得住），暗色主题用 --* 档
	   （更亮的色），跟主题里的文字色用法保持一致。

	   位置/尺寸全部由脚本的 WAAPI 关键帧驱动（见 playUncover），这里只给
	   静态铺满的初始态；这里不写 transition —— 原因见脚本里的说明。 */
	.notification-cover {
		position: absolute;
		inset: 0;
		z-index: 1;
		pointer-events: none;
		background-color: var(--notif-cover, var(--primary));
	}
	.notification-success { --notif-cover: var(--success-text); }
	.notification-info { --notif-cover: var(--info-text); }
	.notification-warning { --notif-cover: var(--warning-text); }
	.notification-error { --notif-cover: var(--danger-text); }
	:global(.dark) .notification-success { --notif-cover: var(--success); }
	:global(.dark) .notification-info { --notif-cover: var(--info); }
	:global(.dark) .notification-warning { --notif-cover: var(--warning); }
	:global(.dark) .notification-error { --notif-cover: var(--danger); }

	.notification-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
	.notification-title { font-weight: 500; word-break: break-word; }
	.notification-desc { font-size: 13px; color: var(--text-muted); line-height: 1.5; word-break: break-word; }

	.notification-btn { display: flex; align-items: center; }

	.notification-close {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2px;
		margin: 0;
		border: none;
		background: none;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: color 0.15s, background-color 0.15s;
	}
	.notification-close:hover { color: var(--text-strong); background-color: var(--hover); }

	.notification-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--border);
		overflow: hidden;
	}
	.notification-progress-bar {
		width: 100%;
		height: 100%;
		background: currentColor;
		opacity: 0.4;
		animation: notif-countdown linear forwards;
		transform-origin: left;
	}
	.notification-progress-bar.paused { animation-play-state: paused; }
	@keyframes notif-countdown {
		from { transform: scaleX(1); }
		to { transform: scaleX(0); }
	}
</style>

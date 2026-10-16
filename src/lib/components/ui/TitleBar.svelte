<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Minus from '@lucide/svelte/icons/minus';
	import Square from '@lucide/svelte/icons/square';
	import X from '@lucide/svelte/icons/x';
	import Icon from './Icon.svelte';

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
		class: cls = '',
		style = '',
	}: {
		title?: string;
		logo?: string | Component<{ size?: number; class?: string }>;
		subtitle?: string;
		theme?: 'light' | 'dark';
		onThemeToggle?: (e: MouseEvent) => void;
		/** 自定义按钮区 snippet（渲染在窗口控制键之前，与默认键共存） */
		controls?: Snippet;
		/** false 不渲染默认窗口三键（如浏览器环境） */
		windowControls?: boolean;
		/** 窗口控制实现。未传时三键渲染为禁用（纯浏览器预览）；
		 *  Wails3：传入包好 @wailsio/runtime Window 的适配器 */
		windowApi?: WindowController;
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
	<div class="titlebar-controls">
		{#if onThemeToggle}
			<button type="button" class="win-btn" onclick={onThemeToggle} title={theme === 'dark' ? '浅色模式' : '深色模式'}>
				<Icon icon={theme === 'dark' ? Sun : Moon} size={14} />
			</button>
		{/if}
		{#if controls}
			{@render controls()}
		{/if}
		{#if windowControls}
			<button type="button" class="win-btn" onclick={handleMinimise} aria-label="最小化">
				<Icon icon={Minus} size={14} />
			</button>
			<button type="button" class="win-btn" onclick={handleMaximise} aria-label={isMaximised ? '还原' : '最大化'}>
				<Icon icon={Square} size={12} />
			</button>
			<button type="button" class="win-btn win-btn-close" onclick={handleClose} aria-label="关闭">
				<Icon icon={X} size={16} />
			</button>
		{/if}
	</div>
</div>

<style>
	.titlebar {
		--wails-draggable: drag;
		display: flex;
		align-items: center;
		justify-content: space-between;
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
		min-width: 0;
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
		 * 品牌渐变（主色 → 主色相邻色相 +40°）+ 高光条自左上向右下斜扫。
		 * 两层背景全部被 background-clip:text 裁进笔画（注意：不可加 background-blend-mode，
		 *   它与 clip:text 同用会让背景整体不渲染——Chromium 已知行为）。
		 *   第 1 层  高光条：135deg（左上→右下），白 55%→90%→55%，no-repeat
		 *   第 2 层  品牌渐变：引用 theme.css 预解析的 --titlebar-logo-gradient
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
		 * 想换品牌渐变，覆盖 :root 上的 --titlebar-logo-gradient 即可。
		 */
		background-image: linear-gradient(
				135deg,
				transparent 40%,
				rgba(255, 255, 255, 0.55) 47%,
				rgba(255, 255, 255, 0.9) 50%,
				rgba(255, 255, 255, 0.55) 53%,
				transparent 60%
			),
			var(--titlebar-logo-gradient);
		background-repeat: no-repeat, no-repeat;
		background-size: 250% 250%, 100% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: titlebar-logo-shine 5s linear infinite;
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

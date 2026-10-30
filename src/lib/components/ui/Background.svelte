<script lang="ts">
	let {
		variant = 'gradient',
		fixed = false,
		/**
		 * fixed 模式下的绘制层，只有 fixed 时才有意义。
		 *
		 * - `'behind'`（默认）：`z-index: -1`，画在当前层叠上下文里所有内容的后方。
		 *   局部容器用它是正确的。
		 * - `'overlay'`：与 behind 同为 `z-index: -1`，区别是它把网格/点阵底色调成
		 *   半透明，并保证绝不拦截指针事件。做「整页背景」时用它，但祖先容器
		 *   不能有不透明背景 —— 负 z-index 的元素绘制在那层背景之后。
		 *   两种消解办法：把祖宗容器的 background 设透明；或给背景一个
		 *   `position: relative` 的宿主祖先，改用 `position: absolute; inset: 0`
		 *   （不传 fixed）。
		 */
		layer = 'behind',
		animated = true,
		opacity = 1,
		children,
		class: cls = '',
		style = '',
	}: {
		variant?: 'gradient' | 'grid' | 'dots' | 'noise';
		fixed?: boolean;
		layer?: 'behind' | 'overlay';
		animated?: boolean;
		opacity?: number;
		children?: import('svelte').Snippet;
		class?: string;
		style?: string;
	} = $props();
</script>

<div
	class="bg bg--{variant} {cls}"
	class:fixed
	class:animated
	class:bg--overlay={fixed && layer === 'overlay'}
	style:opacity
	style={style}
	aria-hidden="true"
>
	<div class="bg-orbs">
		<span class="bg-blob bg-blob--a"></span>
		<span class="bg-blob bg-blob--b"></span>
		<span class="bg-blob bg-blob--c"></span>
	</div>
	{#if children}
		<div class="bg-content">{@render children()}</div>
	{/if}
</div>

<style>
	.bg {
		position: relative;
		overflow: hidden;
		isolation: isolate;
	}
	/* fixed 实例就是整页背景。overflow:hidden 会把它变成滚动容器 —— 视口尺寸
	   的固定元素在容器里没有可滚动的溢出，Chrome 直接不绘制（等于隐形），
	   所以固定层必须关掉它。isolation 同理：一旦成了独立层叠上下文，
	   z-index:-1 就只在内部有效，整块会跑到内容之上把页头也盖住。 */
	.bg.fixed {
		position: fixed;
		inset: 0;
		z-index: -1;
		isolation: auto;
		overflow: visible;
	}
	/* overlay：与 behind 同为 z-index:-1，区别是网格/点阵/斜纹的底色调成
	   半透明，且绝不拦截指针事件。做整页背景时，祖先链上的不透明底色必须
	   让位 —— 把它们的 background 设成 transparent，或用 <Page transparent>。 */
	.bg.fixed.bg--overlay {
		z-index: -1;
		pointer-events: none;
	}
	/* 网格 / 点阵 / 斜纹的底色是实色：overlay 下改成带透明度的 surface，
	   让下层容器的底色与光效透出来，否则整页就只剩一块纯色板。 */
	.bg--overlay.bg--grid,
	.bg--overlay.bg--dots {
		background-color: color-mix(in srgb, var(--surface) 55%, transparent);
	}
	.bg--overlay.bg--noise {
		background-color: color-mix(in srgb, var(--surface-2) 55%, transparent);
	}
	/* 渐变：底色让位，颜色全部由下面 3 个漂移的色点提供。*/
	.bg--gradient {
		background: var(--surface);
	}
	.bg--grid {
		background-color: var(--surface);
		background-image:
			color-mix(in srgb, var(--border) 65%, transparent) 1px,
			transparent 1px;
		background-size: 24px 24px;
	}
	.bg--dots {
		background-color: var(--surface);
		background-image: radial-gradient(color-mix(in srgb, var(--text-muted) 45%, transparent) 1px, transparent 1px);
		background-size: 20px 20px;
	}
	/* 斜纹的周期 8px 是沿 45° 轴量的，水平方向的周期要乘 √2 ≈ 11.3137px。
	   运动动画按这个值平移才能首尾相接，否则每圈结束会跳一下。 */
	.bg--noise {
		background-color: var(--surface-2);
		background-image: repeating-linear-gradient(
				45deg,
				color-mix(in srgb, var(--border) 45%, transparent) 0 2px,
				transparent 2px 8px
			);
	}
	/* 三个色点统一装在这一层里：模糊与色相旋转都挂在父级，只跑一次滤镜。
	   各自 blur + hue-rotate 的话，全屏三块大模糊会明显掉帧。
	   加 filter 会生成新的层叠上下文，所以负 z-index 由这一层自己承担。 */
	.bg-orbs {
		position: absolute;
		inset: 0;
		z-index: -1;
		pointer-events: none;
		filter: blur(60px);
		/* 极淡的整片底色，只用来兜住「三个球都没覆盖到」的角落，
		   浓度低到直观看不出来，但能避免四个角里总有一个是纯底色。 */
		background: radial-gradient(
			ellipse at 50% 50%,
			color-mix(in srgb, var(--primary) 6%, transparent) 0%,
			transparent 85%
		);
	}
	/* overlay 模式：光晕改到 0 层、内容压到 1 层。
	   负 z-index 的子元素在 overlay 里仍会掉到祖先背景之后，光晕就看不见了。 */
	.bg--overlay > .bg-orbs {
		z-index: 0;
	}
	.bg-blob {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		/* 球心浓、外围化开。60px 模糊会把边缘再稀释一轮，所以渐变自己先留一段
		   实色核心（0→38%），真正的淡出只发生在 38%→70% 这三分之一半径里。 */
		background: radial-gradient(
			circle at 50% 50%,
			var(--blob-color) 0%,
			var(--blob-color) 38%,
			transparent 70%
		);
	}
	/* 三个色点各用不同色相：蓝 → 青 → 品红。位置分别压在左上、右侧、左下三条边上，
	   中心区留空 —— 卡片不透明，光点落在中间等于被盖住，只有页边留缝能透出颜色。
	   竖直方向压得紧一些（±20%），球体高度只有宽度的一半多一点，露出太多会塌成横条。 */
	.bg-blob--a {
		--blob-color: color-mix(in srgb, var(--primary) 70%, transparent);
		width: 56%;
		padding-top: 56%;
		left: -22%;
		top: -30%;
	}
	.bg-blob--b {
		--blob-color: color-mix(in srgb, #22d3ee 66%, transparent);
		width: 46%;
		padding-top: 46%;
		right: -24%;
		top: 22%;
	}
	/* c 放右上：a 占左上、b 占右侧中部，c 补右上角，四个方向就都有光了 */
	.bg-blob--c {
		--blob-color: color-mix(in srgb, #f472b6 62%, transparent);
		width: 50%;
		padding-top: 50%;
		right: -20%;
		top: -32%;
	}
	.bg--grid .bg-orbs,
	.bg--dots .bg-orbs,
	.bg--noise .bg-orbs {
		display: none;
	}
	/* 三条路径的关键帧节点故意错开（不是对称的来回），周期也取互质的数
	   （17 / 23 / 19 秒），所以三者几乎不会同时回到起点 —— 观感上就是
	   颜色点在画面上随机游走。 */
	.bg.animated .bg-blob--a {
		animation: bg-wander-a 17s ease-in-out infinite alternate;
	}
	.bg.animated .bg-blob--b {
		animation: bg-wander-b 23s ease-in-out infinite alternate;
	}
	.bg.animated .bg-blob--c {
		animation: bg-wander-c 19s ease-in-out infinite alternate;
	}
	/* 色相在 ±30° 之间来回摆动，让整组颜色一起「变温」 */
	.bg.animated .bg-orbs {
		animation: bg-hue 13s ease-in-out infinite alternate;
	}
	/* ── 网格 / 点阵 / 斜纹各自的运动 ──────────────────────────────────────
	   网格 / 点阵：background-position 走一个完整 tile，绕回起点严丝合缝。
	   斜纹：水平方向平移一个周期（11.3137px），同样首尾相接。 */
	.bg.animated.bg--grid {
		animation: bg-pan-grid 6s linear infinite;
	}
	.bg.animated.bg--dots {
		animation: bg-pan-dots 6s linear infinite;
	}
	.bg.animated.bg--noise {
		animation: bg-pan-stripes 2s linear infinite;
	}
	.bg-content {
		position: relative;
		z-index: 1;
	}
	/* 色点沿画布边缘游走。路径里塞了不等距的中间节点（而非 from/to 直线往返），
	   再叠加各自的周期差，每个瞬间位置看起来都是随机的。
	   位移压在 ±16vw / ±20vh 以内：球本身已经压在边上，再往画面中心冲就会被卡片
	   整个盖住，纯粹白跑；冲太远又会自己跑出容器被 overflow:hidden 裁掉。 */
	@keyframes bg-wander-a {
		0% { transform: translate(0, 0) scale(1); }
		23% { transform: translate(12vw, 12vh) scale(1.18); }
		51% { transform: translate(2vw, 26vh) scale(0.92); }
		74% { transform: translate(16vw, 32vh) scale(1.24); }
		100% { transform: translate(8vw, 8vh) scale(1.05); }
	}
	@keyframes bg-wander-b {
		0% { transform: translate(0, 0) scale(1); }
		19% { transform: translate(-10vw, 16vh) scale(1.12); }
		47% { transform: translate(-4vw, -12vh) scale(0.9); }
		68% { transform: translate(-14vw, 4vh) scale(1.2); }
		100% { transform: translate(-7vw, 20vh) scale(1.08); }
	}
	@keyframes bg-wander-c {
		0% { transform: translate(0, 0) scale(1); }
		27% { transform: translate(-10vw, 16vh) scale(1.15); }
		56% { transform: translate(-14vw, 6vh) scale(0.95); }
		81% { transform: translate(-4vw, 22vh) scale(1.18); }
		100% { transform: translate(-8vw, 9vh) scale(1.02); }
	}
	/* 色相在 ±30° 之间摆动。模糊值必须写死在这里 —— filter 一旦参与动画，
	   就会整体由关键帧接管，不写 blur 的话模糊会消失。 */
	@keyframes bg-hue {
		from { filter: blur(60px) hue-rotate(-30deg); }
		to { filter: blur(60px) hue-rotate(30deg); }
	}
	@keyframes bg-pan-grid {
		from { background-position: 0 0; }
		to { background-position: 24px 24px; }
	}
	@keyframes bg-pan-dots {
		from { background-position: 0 0; }
		to { background-position: 20px 20px; }
	}
	@keyframes bg-pan-stripes {
		from { background-position: 0 0; }
		to { background-position: 11.3137px 0; }
	}
	@media (prefers-reduced-motion: reduce) {
		.bg.animated .bg-blob--a,
		.bg.animated .bg-blob--b,
		.bg.animated .bg-blob--c,
		.bg.animated .bg-orbs,
		.bg.animated.bg--grid,
		.bg.animated.bg--dots,
		.bg.animated.bg--noise {
			animation: none;
		}
	}
</style>

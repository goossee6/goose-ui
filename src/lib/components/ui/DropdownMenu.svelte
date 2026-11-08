<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface DropdownMenuItem {
		value?: string;
		label?: string;
		icon?: Snippet | string;
		disabled?: boolean;
		danger?: boolean;
		separator?: boolean;
		/**
		 * 渲染成「开关行」：左边是 label，右边一个小号开关。
		 *
		 * 点击它**不会关闭菜单**、也不代表执行了某个动作 —— 它表达的是
		 * 「一项设置」而不是「一次命令」，所以回调后菜单留着，用户能立刻
		 * 看到开关的状态变化。调用方在 onselect 里翻转自己的状态，
		 * 再把新的 checked 传回来即可。
		 */
		switch?: boolean;
		/** switch 行是否处于打开态（只有 switch 行有意义） */
		checked?: boolean;
	}
</script>

<script lang="ts">
	import Button from './Button.svelte';
	import PillTrack from './PillTrack.svelte';
	import { createLayerId, isInsideLayer, layerOwnerOf, registerLayer, unregisterLayer } from './overlayLayer';
	import { floatingPosition } from './floatingPosition';
	import { menuIn, menuOut } from './menuTransition';

	let {
		open = $bindable(false),
		items = [],
		placement = 'bottom-start',
		disabled = false,
		triggerMenu = '',
		triggerVariant = 'default',
		triggerSize = 'middle',
		triggerClass = '',
		triggerStyle = '',
		triggerAriaLabel = '',
		onselect,
		onOpenChange,
		trigger,
		children,
		class: cls = '',
		style = '',
	}: {
		open?: boolean;
		items?: DropdownMenuItem[];
		placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
		/** 禁用：触发器不可聚焦/展开（Menubar 用它让禁用菜单真的不可点开） */
		disabled?: boolean;
		/** 透传到触发器 button 的 data-menu，供 Menubar 之类的外层按名定位真实焦点元素 */
		triggerMenu?: string;
		/** 触发器就是一个标准 Button：外观全部交给它的 variant / size。
		 *  默认 default + middle，需要更紧凑的入口传 ghost + small。 */
		triggerVariant?: 'primary' | 'default' | 'ghost' | 'danger' | 'link';
		triggerSize?: 'small' | 'middle' | 'large' | 'icon' | 'icon-sm' | 'icon-md' | 'icon-lg' | number;
		/** 追加到触发器上的类名（Button 的 class 会与 btn / dropdown-trigger 并存） */
		triggerClass?: string;
		/** 触发器的内联样式，与 size 算出的高度/内边距合并 */
		triggerStyle?: string;
		/** 纯图标触发器时给一个可读的名字 */
		triggerAriaLabel?: string;
		onselect?: (item: DropdownMenuItem, index: number) => void;
		onOpenChange?: (open: boolean) => void;
		trigger?: Snippet;
		children?: Snippet;
		class?: string;
		style?: string;
	} = $props();

	// 本层浮层 id：菜单面板上挂 data-overlay-layer，供父层判断子面板用
	const layerId = createLayerId('menu');

	let rootEl = $state<HTMLElement | null>(null);
	let menuEl = $state<HTMLElement | null>(null);
	let flipUp = $state(false);
	let pos = $state({ left: 0, top: 0 });
	let activeIndex = $state(-1);

	const selectable = $derived(items.map((it, i) => ({ it, i })).filter(({ it }) => !it.separator && !it.disabled));

	/** 键盘可达的菜单项：普通项是 menuitem，开关行是 menuitemcheckbox */
	const FOCUSABLE_ITEM = '[role="menuitem"]:not(:disabled), [role="menuitemcheckbox"]:not(:disabled)';

	// 定位统一走 floatingPosition（gap 与其它浮层统一为 8）
	function measure() {
		if (!rootEl || !menuEl) return;
		const res = floatingPosition(rootEl.getBoundingClientRect(), {
			panelW: menuEl.offsetWidth,
			panelH: menuEl.offsetHeight,
			gap: 8,
			align: placement.endsWith('end') ? 'end' : 'start',
			prefer: placement.startsWith('top') ? 'top' : 'bottom',
			flip: 'space',
			capHeight: false,
		});
		flipUp = res.flipUp;
		pos = { left: res.left, top: res.top };
	}

	function openMenu(idx = -1) {
		if (disabled) return;
		open = true;
		onOpenChange?.(true);
		activeIndex = idx;
		requestAnimationFrame(() => {
			measure();
			focusItem(idx);
		});
	}

	/**
	 * 把菜单挂到 body。
	 *
	 * 菜单虽然 position:fixed，但只要它还在触发器所在的 DOM 子树里，就受那棵树的
	 * 层叠上下文约束。DataList 的 .list-row 设了 position:relative + z-index:0，
	 * 每行自成一个上下文：菜单 z-index 再高也只在那一行内部有效，后面渲染的行
	 * 会盖住它。挂到 body 才真正脱离。
	 */
	function portal(node: HTMLElement) {
		// 先登记「我在哪一层里弹出来的」，再挂到 body：菜单同样可能长在
		// Popover / Modal 里，父层要能认出这是它的子面板
		const owner = layerOwnerOf(node);
		node.dataset.overlayLayer = layerId;
		registerLayer(layerId, owner);
		document.body.appendChild(node);
		return {
			destroy() {
				unregisterLayer(layerId);
				node.remove();
			},
		};
	}

	function close(focusTrigger = false) {
		if (open) onOpenChange?.(false);
		open = false;
		activeIndex = -1;
		if (focusTrigger) rootEl?.querySelector<HTMLElement>('button, [role="button"]')?.focus();
	}

	function focusItem(idx: number) {
		const btns = menuEl?.querySelectorAll<HTMLElement>(FOCUSABLE_ITEM);
		if (!btns?.length) return;
		const real = [...btns].findIndex((b) => b.dataset.idx === String(idx));
		if (real >= 0) btns[real].focus();
	}

	function step(dir: 1 | -1) {
		if (!selectable.length) return;
		const pos = selectable.findIndex(({ i }) => i === activeIndex);
		const next = pos < 0 ? 0 : (pos + dir + selectable.length) % selectable.length;
		activeIndex = selectable[next].i;
		focusItem(activeIndex);
	}

	function onTriggerClick() {
		if (disabled) return;
		open ? close() : openMenu();
	}

	function onMenuKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.stopPropagation();
			close(true);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			step(1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			step(-1);
		} else if (e.key === 'Home') {
			e.preventDefault();
			if (selectable.length) { activeIndex = selectable[0].i; focusItem(activeIndex); }
		} else if (e.key === 'End') {
			e.preventDefault();
			if (selectable.length) { activeIndex = selectable[selectable.length - 1].i; focusItem(activeIndex); }
		} else if (e.key === 'Tab') {
			close();
		}
	}

	function pick(item: DropdownMenuItem, i: number) {
		if (item.disabled || item.separator) return;
		// 开关行是「一项设置」，改完还要接着看/接着设 → 不关菜单。
		// 其余项是「一次命令」，执行完就该收起。
		if (item.switch) {
			onselect?.(item, i);
			return;
		}
		close(true);
		onselect?.(item, i);
	}

	$effect(() => {
		if (open && menuEl) measure();
	});

	$effect(() => {
		if (!open) return;
		const onDocDown = (e: MouseEvent) => {
			// 菜单已 portal 到 body，不再是 rootEl 的后代，必须单独判一次，
			// 否则点菜单项时 mousedown 先关菜单、click 永远不触发。
			// 菜单里再弹出的子浮层（Select 下拉等）同样算内部，见 overlayLayer.ts
			if (rootEl && !isInsideLayer(e.target, layerId, [rootEl, menuEl])) close();
		};
		const onScroll = () => measure();
		const onResize = () => measure();
		document.addEventListener('mousedown', onDocDown);
		window.addEventListener('scroll', onScroll, true);
		window.addEventListener('resize', onResize);
		return () => {
			document.removeEventListener('mousedown', onDocDown);
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', onResize);
		};
	});

</script>

<div class="dropdown-root {cls}" bind:this={rootEl} style={style}>
	<!-- 触发器直接复用 Button：尺寸、配色、悬停、按压回弹、禁用态、焦点环都走它那一套，
	     这里只补菜单需要的 a11y 属性与键盘行为。dropdown-trigger 类保留：
	     Menubar 用它做 roving focus（.dropdown-trigger:not(:disabled)），
	     外层也可以按它做定位或样式覆盖。 -->
	<Button
		class="dropdown-trigger {triggerClass}"
		variant={triggerVariant}
		size={triggerSize}
		style={triggerStyle}
		ariaLabel={triggerAriaLabel}
		disabled={disabled}
		aria-haspopup="menu"
		aria-expanded={open}
		data-menu={triggerMenu}
		onclick={onTriggerClick}
		onkeydown={(e: KeyboardEvent) => {
			if (disabled) return;
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				openMenu(selectable[0]?.i ?? -1);
			} else if (e.key === 'ArrowUp') {
				// 与 ArrowDown 对称：从最后一项打开
				e.preventDefault();
				openMenu(selectable[selectable.length - 1]?.i ?? -1);
			} else if (e.key === 'Escape' && open) {
				e.stopPropagation();
				close();
			}
		}}
	>
		{@render trigger?.()}
	</Button>
	{#if open}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="dropdown-menu"
			role="menu"
			tabindex="-1"
			bind:this={menuEl}
			use:portal
			onkeydown={onMenuKeydown}
			in:menuIn={{ up: flipUp }}
			out:menuOut={{ up: flipUp }}
			style="left:{pos.left}px;top:{pos.top}px"
		>
			<!-- 单 pill（菜单没有常驻选中态）→ 主题色实心。
			     禁用项不隐藏 pill（否则指针扫过它时会闪一下），而是按行用 data-pill-bg
			     换成中性灰：底色说明「这里不可点」，滑动仍然连续。 -->
			<PillTrack
				container={menuEl}
				itemSelector=".dropdown-item"
				disabledMatch=""
				showSelected={false}
				hoverBackground="var(--primary)"
				radius="var(--radius-md)"
			/>
			{@render children?.()}
			{#each items as item, i (i)}
				{#if item.separator}
					<div class="dropdown-separator" role="separator"></div>
				{:else if item.switch}
					<!-- 开关行：整行就是一个 menuitemcheckbox，点击/空格/回车都走同一条 pick 路径。
					     右侧的开关是纯视觉元素（span，不是 Toggle）—— 菜单行本身已经是
					     button，里面再塞一个 button 就是按钮套按钮（无效 HTML，焦点也会打架）。
					     几何完全照 Toggle 的 small 档（轨道 token + 滑块 2px 内缩），静止态一致。 -->
					<button
						type="button"
						class="dropdown-item dropdown-item--switch"
						role="menuitemcheckbox"
						aria-checked={item.checked ?? false}
						data-idx={i}
						data-pill-bg={item.disabled ? 'var(--hover)' : undefined}
						tabindex={activeIndex === i ? 0 : -1}
						disabled={item.disabled}
						onclick={() => pick(item, i)}
						onfocus={() => (activeIndex = i)}
					>
						{#if typeof item.icon === 'string'}
							<span class="dropdown-item-icon">{item.icon}</span>
						{:else if item.icon}
							{@render item.icon()}
						{/if}
						<span class="dropdown-item-label">{item.label}</span>
						<span class="dropdown-switch" class:dropdown-switch--on={item.checked} aria-hidden="true">
							<span class="dropdown-switch-thumb"></span>
						</span>
					</button>
				{:else}
					<button
						type="button"
						class="dropdown-item"
						class:danger={item.danger}
						role="menuitem"
						data-idx={i}
						data-pill-bg={item.disabled
							? 'var(--hover)'
							: item.danger
								? 'color-mix(in srgb, var(--danger) 12%, var(--popup-surface))'
								: undefined}
						tabindex={activeIndex === i ? 0 : -1}
						disabled={item.disabled}
						onclick={() => pick(item, i)}
						onfocus={() => (activeIndex = i)}
					>
						{#if typeof item.icon === 'string'}
							<span class="dropdown-item-icon">{item.icon}</span>
						{:else if item.icon}
							{@render item.icon()}
						{/if}
						<span class="dropdown-item-label">{item.label}</span>
					</button>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.dropdown-root {
		position: relative;
		display: inline-block;
	}
	/* 触发器的外观全在 Button 里（它有自己的作用域哈希，这里写任何
	   .dropdown-trigger 的样式都命中不到那个节点），需要改外观就传
	   triggerVariant / triggerSize / triggerClass / triggerStyle。 */
	.dropdown-menu {
		position: fixed;
		z-index: var(--z-dialog);
		min-width: 180px;
		max-width: min(320px, calc(100vw - 16px));
		padding: var(--sp-sm);
		background-color: var(--popup-surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}
	.dropdown-item {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--sp-md);
		width: 100%;
		padding: var(--sp-md) var(--sp-lg);
		border: none;
		border-radius: var(--radius-md);
		background: none;
		color: var(--text);
		font-size: var(--fs-13);
		text-align: left;
		cursor: pointer;
		white-space: nowrap;
	}
	/* 菜单只有一块 pill（没有常驻选中态）→ 用主题色实心；
	   文字转 --accent-text，否则深字压在品牌色上读不清。危险项走自己的浅红 pill，
	   保留 --danger 文字与图标，所以下面这些规则都排除 .danger。

	   上色依据是 PillTrack 打在「pill 正压着的这一行」上的 `data-pill-on`，而**不是
	   `:hover`**：指针落进项间缝隙、分隔线或面板内边距时，pill 仍按「就近归属」停在
	   最近那一行，而 `:hover` 已经是 false —— 用 `:hover` 上色就会出现「鼠标移开了、
	   蓝底还没退、字却已经变回深色」，深字压品牌色实测对比度约 1.4:1。

	   只认 `hover` 档：`custom`（禁用行的中性灰、危险项的浅红）仍是浅底，转白更糟。

	   `data-pill-on` 是 PillTrack 在运行时打上行元素的，Svelte 的静态分析看不见这样的
	   属性选择器（会报 css_unused_selector，而 CSS 里没有 svelte-ignore）。所以这里把
	   行本身包进 :global()，作用域改由祖先 `.dropdown-menu` 兜住 —— 既不越出这个菜单，
	   也不会因为「编译器觉得没人用」而被删掉。 */
	.dropdown-menu :global(.dropdown-item[data-pill-on='hover']:not(:disabled)) {
		color: var(--accent-text);
	}
	.dropdown-menu :global(.dropdown-item[data-pill-on='hover']:not(:disabled):not(.danger) .dropdown-item-icon) {
		color: var(--accent-text);
	}
	/* 键盘落在菜单项上时没有指针，pill 不会出现，用同一套主题色补上（不能再用 --hover，
	   否则同一行鼠标是品牌色、键盘是灰色，像两个不同的控件） */
	.dropdown-item:focus-visible:not(.danger) {
		background-color: var(--primary);
		color: var(--accent-text);
		outline: none;
	}
	.dropdown-item:focus-visible:not(.danger) .dropdown-item-icon {
		color: var(--accent-text);
	}
	.dropdown-item:focus-visible {
		outline: none;
	}
	.dropdown-item:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.dropdown-item.danger {
		color: var(--danger);
	}
	/* 危险行的 pill 是浅红（data-pill-bg），本就不会被标成 hover 档；
	   这条只是兜底：万一以后给危险行换回主题色 pill，文字仍留在红色而不是转白。 */
	.dropdown-menu :global(.dropdown-item.danger[data-pill-on]:not(:disabled)) {
		color: var(--danger);
	}
	.dropdown-item-icon {
		color: var(--text-muted);
		flex-shrink: 0;
	}
	.dropdown-item-label {
		flex: 1;
	}
	/* switch 行 -------------------------------------------------------------
	   几何照 Toggle 的 small 档：轨道 --toggle-w-sm / --toggle-h-sm、
	   滑块 --toggle-thumb-sm、四边内缩 2px（Toggle 里是 --thumb-left: 2px / top: 2px）。
	   颜色也用同一组 token，静止态与真正的 Toggle 看不出差别。
	   这里不复用 Toggle 组件：菜单行是 button，Toggle 的根也是 button，
	   嵌套按钮是无效 HTML（焦点与点击都会被浏览器拆开）。 */
	.dropdown-item--switch {
		gap: var(--sp-lg);
	}
	.dropdown-switch {
		position: relative;
		flex-shrink: 0;
		box-sizing: border-box;
		width: var(--toggle-w-sm);
		height: var(--toggle-h-sm);
		border-radius: var(--radius-full);
		background-color: var(--surface-3);
		border: 1px solid var(--border-strong);
		transition:
			background-color 0.2s,
			border-color 0.2s;
	}
	.dropdown-switch--on {
		background-color: var(--primary);
		border-color: var(--primary);
	}
	.dropdown-switch-thumb {
		position: absolute;
		top: var(--space-0-5);
		left: var(--space-0-5);
		width: var(--toggle-thumb-sm);
		height: var(--toggle-thumb-sm);
		border-radius: var(--radius-full);
		background-color: var(--primary-text);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		transition: left 0.2s ease;
	}
	.dropdown-switch--on .dropdown-switch-thumb {
		left: calc(100% - var(--toggle-thumb-sm) - var(--space-0-5));
	}
	/* 悬停时整行是品牌色实心 pill：开态轨道原本也是 --primary，会整个「融进」去。
	   这里把轨道改成半透明白，靠明度差把自己勾出来；关态轨道也提亮一档，
	   否则深灰轨道压在品牌色上像块脏斑。
	   同样跟着 `data-pill-on` 走（不是 :hover）：轨道颜色和 pill 必须同进同退，
	   否则移开鼠标的瞬间会留下「深灰轨道 + 蓝色底」的一帧。 */
	.dropdown-menu :global(.dropdown-item--switch[data-pill-on='hover']:not(:disabled) .dropdown-switch) {
		background-color: color-mix(in srgb, var(--accent-text) 20%, transparent);
		border-color: color-mix(in srgb, var(--accent-text) 45%, transparent);
	}
	.dropdown-separator {
		height: 1px;
		/* padding 扩大命中区（替代 margin）：鼠标穿过分割线上下间隙时 target 仍是 separator，pill 不断档 */
		padding: var(--sp-sm) 0;
		box-sizing: content-box;
		background-color: var(--border);
		background-clip: content-box;
	}
</style>

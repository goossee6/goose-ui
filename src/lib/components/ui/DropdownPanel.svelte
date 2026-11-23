<script lang="ts">
	import type { Snippet } from 'svelte';
	import { menuIn, menuOut } from './menuTransition';
	import { layerOwnerOf, registerLayer, unregisterLayer } from './overlayLayer';
	import { MAX_ROWS, ROW_H } from './rowHeight';

	let {
		style = '',
		role,
		tabindex,
		flipUp = false,
		layerId,
		onkeydown,
		children,
	}: {
		/** 定位片段（top / left / width / max-height），由 createDropdownPanel 产出 */
		style?: string;
		role?: string;
		/** 键盘代理（只有 CreatableSelect 需要：它的焦点在搜索框上，按键冒泡到面板） */
		tabindex?: number;
		/** 面板在触发器上方：进出场位移方向与缩放锚边随之反向 */
		flipUp?: boolean;
		/** 传了就把面板挂到 body 并登记浮层层级（见 overlayLayer.ts） */
		layerId?: string;
		onkeydown?: (e: KeyboardEvent) => void;
		children: Snippet;
	} = $props();

	/**
	 * 把面板挂到 body。
	 *
	 * 面板是 position: fixed，但只要它还在触发器所在的 DOM 子树里，就会受
	 * 那棵树的包含块影响：祖先元素上的 backdrop-filter / transform / filter
	 * 会创建新的包含块，fixed 坐标随之相对它计算 —— 放在 DataList 吸顶表头
	 * （有磨砂 backdrop-filter）里的下拉框会因此弹到错误位置。
	 * 挂到 body 后 fixed 才真正相对视口。
	 *
	 * 不传 layerId 时是空操作：留在原地，只做 fixed 定位。
	 */
	function portalLayer(node: HTMLElement, id: string | undefined) {
		if (!id) return {};
		// 先登记「我在哪一层里弹出来的」，再挂到 body —— 挂走之后祖先链就没了
		const owner = layerOwnerOf(node);
		node.dataset.overlayLayer = id;
		registerLayer(id, owner);
		document.body.appendChild(node);
		return {
			destroy() {
				unregisterLayer(id);
				node.remove();
			},
		};
	}
	/**
	 * 行高与「最多几行」以 CSS 变量的形式交给面板内部（CreatableSelect 的列表
	 * 自带 max-height 时要用）。这两个数在 rowHeight.ts 里是唯一的真身，
	 * 面板高度估算也读它 —— 两处对不上就会「估高 10 行、实际只露出 9 行半」。
	 */
	const rowVars = `--dd-row-h: ${ROW_H}px; --dd-max-rows: ${MAX_ROWS};`;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_no_noninteractive_tabindex -->
<div
	class="dd-panel"
	style="{rowVars} {style}"
	{role}
	{tabindex}
	{onkeydown}
	use:portalLayer={layerId}
	in:menuIn={{ up: flipUp }}
	out:menuOut={{ up: flipUp }}
>
	{@render children()}
</div>

<style>
	/* 下拉面板的统一外壳：底色、描边、圆角、投影、内边距、固定定位。
	   四处（Select / Combobox / MultiSelect / CreatableSelect）原先各写一份，只有内边距和
	   圆角恰好一致，底色还漂出过 --surface-2 / --popup-surface 两种（前者是页面内嵌
	   区块的底，压在浮层上会发灰）。 */
	.dd-panel {
		position: fixed;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		/* 4px 内边距：hover pill / 首末行不贴面板边框 */
		padding: var(--sp-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background-color: var(--popup-surface);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
		color: var(--text);
		z-index: var(--z-max);
	}
</style>

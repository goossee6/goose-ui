<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		class: cls = '',
		style = '',
		title,
		anchor = '',
		anchorLevel = 2,
		right,
		children,
	}: {
		class?: string;
		style?: string;
		title?: string;
		/**
		 * 把这张卡片注册为页内目录（`Page` 的 `toc`）的锚点。
		 *
		 * 传了 id：卡片根节点加上 `id` 与 `data-toc-title`（文字取 `title`），
		 * 目录就会在对应位置多一条目、点击可跳转到这里。
		 * 适用于页面用卡片分节、又不希望额外插入 h2/h3 标题元素的场景。
		 *
		 * 不传：卡片与目录无关，原有行为不变。
		 */
		anchor?: string;
		/** 锚点层级，2 = 顶层条目（默认），3 = 挂在上一级下面的子条目 */
		anchorLevel?: 2 | 3;
		right?: Snippet;
		children?: Snippet;
	} = $props();

	let tocAttrs = $derived(
		anchor
			? {
					id: anchor,
					'data-toc-title': title ?? anchor,
					...(anchorLevel === 3 ? { 'data-toc-level': '3' } : {})
				}
			: {}
	);
</script>

<div class="card {cls}" style={style} {...tocAttrs}>
	{#if title}
		<div class="card-header">
			<span class="card-title">{title}</span>
			{#if right}
				<div class="card-right">
					{@render right()}
				</div>
			{/if}
		</div>
	{/if}
	<div class="card-body">
		{@render children?.()}
	</div>
</div>

<style>
	.card {
		background-color: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-lg);
		padding: var(--sp-lg) var(--sp-lg);
		border-bottom: 1px solid var(--border);
		background-color: var(--surface-2);
	}
	.card-title {
		font-size: var(--fs-14);
		font-weight: 600;
		color: var(--text-strong);
	}
	.card-right {
		display: flex;
		align-items: center;
		gap: var(--sp-md);
	}
	.card-body {
		display: flex;
		flex-direction: column;
		gap: var(--sp-md);
		padding: var(--sp-lg);
	}
</style>

<script lang="ts">
	let { label = '' }: { label?: string } = $props();
</script>

<div class="dd-group" role="presentation">{label}</div>

<style>
	/* 分组头：吸顶 + 轻微磨砂（滚动经过的选项在它下面若隐若现）。
	   高度与 rowHeight.ts 的 HEAD_H 一致 —— 那个常量是面板高度估算用的，
	   两处对不上就会出现「估高比实际矮一行、面板底部被裁半行」。 */
	.dd-group {
		position: sticky;
		top: 0;
		z-index: 2;
		display: flex;
		align-items: center;
		height: 24px;
		/* 与选项文字列对齐：选项 padding-left 16 + 勾槽 16 + gap 8 = 40 */
		padding: 0 var(--space-10);
		font-size: var(--fs-12);
		font-weight: 600;
		color: color-mix(in srgb, var(--text-muted) 70%, transparent);
		background-color: color-mix(in srgb, var(--popup-surface) 80%, transparent);
		backdrop-filter: blur(12px);
	}
</style>

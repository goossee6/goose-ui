<script lang="ts">
	import Wheel from './Wheel.svelte';
	import { indexNearest, timeColumns } from './dateParts';

	let {
		time = '',
		seconds = true,
		steps = [1, 1, 1],
		focusCol = -1,
		align = 'start',
		onselect,
	}: {
		/** 当前值，`HH:mm` 或 `HH:mm:ss`；允许半成品（`12:` / `12:3`） */
		time?: string;
		seconds?: boolean;
		/** 三列步长，[时, 分, 秒] */
		steps?: [number, number, number];
		/** 高亮列下标（-1 表示不高亮），由「点哪一段 / 滚轮停在哪一列」决定 */
		focusCol?: number;
		align?: 'start' | 'center';
		/** 某一列停稳后回传 (列下标, 该列的值) */
		onselect?: (col: number, value: string) => void;
	} = $props();

	const LABELS = ['小时', '分钟', '秒'];

	/** 列内容按步长生成；秒列只在 seconds 时存在，所以列表长度随 props 变 */
	const lists = $derived(timeColumns(steps, seconds));

	const parts = $derived(time.split(':'));
	/** 停靠档位按数值就近：键入中间态只有一位、外部值不在步长网格上时都不会落空 */
	const indexes = $derived(lists.map((list, i) => indexNearest(list, parts[i] ?? '')));
</script>

<div class="wp {align === 'center' ? 'center' : ''}">
	{#each lists as list, i (i)}
		{#if i > 0}<span class="wp-sep" aria-hidden="true">:</span>{/if}
		<div class="wp-col" class:active={focusCol === i}>
			<Wheel
				items={list}
				index={indexes[i]}
				ariaLabel={LABELS[i]}
				onSettle={(k) => onselect?.(i, list[k])}
			/>
		</div>
	{/each}
</div>

<style>
	.wp {
		display: flex;
		align-items: center;
		gap: var(--sp-sm);
	}
	.wp.center {
		justify-content: center;
	}
	.wp-col {
		display: flex;
		border-radius: var(--radius-md);
		transition: background 0.15s;
	}
	.wp-col.active {
		background: var(--accent-sub);
	}
	.wp-sep {
		font-family: var(--font-mono);
		font-size: var(--fs-16);
		font-weight: 600;
		color: var(--text-muted);
	}
</style>

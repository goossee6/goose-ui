/**
 * 下拉列表行高常量与「严格前 N 行」高度计算。
 * 选项行 = 触发器高度（--ui-md-height），分组行固定更矮，二者共同计入行数上限。
 */
export const ROW_H = 36;
export const HEAD_H = 24;
export const MAX_ROWS = 10;

export interface RowItem {
	group?: string;
}

export interface RowsHeight {
	/** 全部行的总高度（含容器 padding） */
	content: number;
	/** min(全部行, 前 MAX_ROWS 行之和)，并有空态下限 */
	height: number;
}

/**
 * 逐行累加：与 DOM 一致 —— 组头是独立元素，其后的选项另算一行。
 * height = min(content, 前 MAX_ROWS 行的实际高度之和) —— 组头也算一行。
 */
export function rowsHeight<T extends RowItem>(items: T[], pad = 0): RowsHeight {
	// 空列表（空态文案行）给最小高度，避免面板被压成几像素
	if (!items.length) return { content: pad, height: pad + 44 };
	let content = pad;
	let capped = pad;
	let rows = 0;
	let prev: string | undefined;
	const add = (h: number) => {
		content += h;
		if (rows < MAX_ROWS) {
			capped += h;
			rows++;
		}
	};
	for (const item of items) {
		const isHead = !!item.group && item.group !== prev;
		if (isHead) {
			prev = item.group;
			add(HEAD_H);
		}
		add(ROW_H);
	}
	return { content, height: Math.min(content, capped) };
}

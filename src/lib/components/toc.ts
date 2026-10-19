/**
 * 页内目录（Page 的 toc）的数据与滚动高亮。
 *
 * 目录不是靠调用方手写标题数组，而是从页面真实 DOM 里摘锚点 —— 文档页的
 * 章节边界本来就在正文里，手写一份等于维护两份、且加了新章节就会漏。
 *
 * 四条约束（都是实测踩出来的）：
 * 1. 只认带 id 的锚点。没有 id 就没有锚点，href="#undefined" 会把页面跳到顶部。
 * 2. 锚点不一定是标题元素：组件 demo 页面刻意不出现 h2/h3（节标题由卡片
 *    自己承担），用 `[data-toc-title]` 标记任意元素即可，目录文字从属性取。
 * 3. 观察范围限定在滚动容器内，且要排除「嵌在页面里的演示组件」自带的标题 ——
 *    演示区里的 h2/h3 是示例内容，不属于本页目录。用 `data-toc-skip` 标记排除。
 * 4. 高亮不能靠 IntersectionObserver 猜：一屏内可能同时可见多个锚点，
 *    判定「当前在读哪一节」要看锚点相对滚动容器顶边（吸顶页头下沿）的位置。
 */

export type TocLevel = 2 | 3;

export interface TocItem {
	/** 锚点元素 id */
	id: string;
	/** 目录条目文字 */
	text: string;
	/** 2 = 顶层（h2 或 data-toc-level="2"），3 = 子级（h3 或 data-toc-level="3"） */
	level: TocLevel;
	/** 子级条目归属的顶层条目 id，用于高亮父级；顶层为 null */
	parent: string | null;
}

/**
 * 锚点选择器。三种都算：
 * - `h2[id]` / `h3[id]`：常规文档页，标题本身就是锚点；
 * - `[data-toc-title][id]`：**没有标题元素**的页面（组件 demo 就是这种）。
 *   节标题由卡片自己承担，目录文字从 `data-toc-title` 属性取，元素只当锚点。
 *
 * 用属性而不是类名：类名会影响样式，`data-toc-*` 只是给目录的标记，
 * 加在任意元素上都不会改变它的外观。
 */
const HEADING_SELECTOR = 'h2[id], h3[id], [data-toc-title][id]';

/**
 * id 转义。CSS.escape 在部分无头环境（老 Safari、SSR polyfill 缺失）不存在，
 * 直接调会抛错把整个目录打掉；回落到只处理会破坏选择器的字符。
 */
function cssEscape(id: string): string {
	const g = globalThis as { CSS?: { escape?: (s: string) => string } };
	if (typeof g.CSS?.escape === 'function') return g.CSS.escape(id);
	return id.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

/** 标题与滚动容器顶边的判定偏移。页头是 sticky 的，要让出它 + 一点余量。 */
const ACTIVE_OFFSET = 72;

/** 判断锚点元素的层级：h3 / data-toc-level="3" 是子级，其余是顶层 */
function levelOf(el: HTMLElement): TocLevel {
	if (el.tagName === 'H3') return 3;
	if (el.dataset.tocLevel === '3') return 3;
	return 2;
}

/** 取目录条目文字：优先 data-toc-title，否则读元素文本 */
function textOf(el: HTMLElement): string {
	const explicit = el.dataset.tocTitle;
	const raw = explicit !== undefined ? explicit : (el.textContent ?? '');
	return raw.replace(/\s+/g, ' ').trim();
}

/** 把锚点元素摘成目录项。 */
export function collectToc(root: ParentNode): TocItem[] {
	const nodes = Array.from(root.querySelectorAll<HTMLElement>(HEADING_SELECTOR));
	const items: TocItem[] = [];
	let parent: string | null = null;

	for (const el of nodes) {
		if (el.closest('[data-toc-skip]')) continue;
		const id = el.id;
		if (!id) continue;
		const level = levelOf(el);
		const text = textOf(el);
		// 空文字跳过：没有可读名字的锚点在目录里是一行空白
		if (!text) continue;
		if (level === 2) parent = id;
		items.push({ id, text, level, parent: level === 3 ? parent : null });
	}
	return items;
}

/**
 * 计算滚动位置对应的「当前章节」。
 *
 * 从后往前找最后一个顶边已经越过判定线的标题：这就是正在读的那一节。
 * 全部标题都还在线下方时返回第一个（读者还在页面顶部）。
 */
export function activeTocId(
	scroller: HTMLElement,
	tocRoot: ParentNode,
	items: TocItem[],
	offset = ACTIVE_OFFSET
): string | null {
	if (items.length === 0) return null;
	const box = scroller.getBoundingClientRect();
	const line = box.top + offset;

	let current: string | null = null;
	for (const item of items) {
		const el = tocRoot.querySelector<HTMLElement>(`#${cssEscape(item.id)}`);
		if (!el) continue;
		if (el.getBoundingClientRect().top <= line) current = item.id;
		else break;
	}

	// 滚到底时最后一节可能永远越不过判定线（后面没有内容可滚了），强制选中
	if (scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= 2) {
		return items[items.length - 1].id;
	}
	return current ?? items[0].id;
}

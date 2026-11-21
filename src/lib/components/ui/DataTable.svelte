<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import Triangle from "@lucide/svelte/icons/triangle";
  import { cellMenuAttrString } from "../contextMenu";
  import type { Column, ColumnOverflow } from "../tableTypes";
  import Icon from "./Icon.svelte";
  import PillTrack from "./PillTrack.svelte";
  import Tooltip from "./Tooltip.svelte";
  import { sorted, toggleSort, type SortState } from "../sorting";
  import { resolvePercents, toPercents } from "../colWidths.svelte";

  interface Part {
    text: string;
    hit: boolean;
  }

  function highlightParts(text: string, kw: string): Part[] {
    const k = kw.trim();
    if (!k) return [{ text, hit: false }];
    try {
      const regex = new RegExp(k, "gi");
      const parts: Part[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ text: text.slice(lastIndex, match.index), hit: false });
        }
        parts.push({ text: match[0], hit: true });
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) {
        parts.push({ text: text.slice(lastIndex), hit: false });
      }
      return parts.length ? parts : [{ text, hit: false }];
    } catch {
      return [{ text, hit: false }];
    }
  }

	let {
		rows = [],
		columns = [],
		highlight = '',
		contextMenu = true,
		menu = '',
		loading = false,
		emptyText = '暂无数据',
		disabled,
		actions,
		cell,
		rowKey,
		actionsPercent,
		headerBleed = 0,
		maxHeight = '70vh',
		/**
		 * 折行单元格的高度上限（行数），默认 3 行。
		 *
		 * 超过上限的内容在单元格内部垂直滚动，行高因此不会随内容无限增长 ——
		 * 一屏能放下更多行，完整内容把指针移进格子滚一下就能看完。
		 * 只对 `overflow: 'wrap'`（默认）的列生效；传 0 表示不设上限、行高随内容撑开。
		 */
		cellMaxLines = 3,
		/**
		 * 单元格内容被裁掉时，悬停是否弹出完整文本（默认 true）。
		 *
		 * 气泡是库里的 Tooltip 组件，全表共用一个实例：`tbody` 上一次事件委托
		 * 找出被悬停的格子、量一次 scrollWidth/clientWidth，真正被裁掉才浮出。
		 * 内容本来就完整可见时不会弹 —— 那只是重复眼睛已经看到的东西。
		 *
		 * 表格极多、或本来就跑在指针设备以外的场景可以传 false 关掉。
		 */
		cellTip = true,
		stickyHeader = true,
		class: cls = '',
		style = '',
	}: {
		rows?: T[];
		columns?: Column<T>[];
		highlight?: string;
		contextMenu?: boolean;
		menu?: string;
		loading?: boolean;
		emptyText?: string;
		disabled?: (row: T) => boolean;
		actions?: Snippet<[T]>;
		cell?: Snippet<[string, T]>;
		rowKey?: (row: T, index: number) => string | number;
		/**
		 * 操作列的宽度声明，与 `Column.width` 同一种写法。
		 * 不传时占 1 份（等同 `Column` 不写 width 的列）。
		 */
		actionsPercent?: number | string;
		/**
		 * 表头磨砂层左右外扩的像素数（默认 0 不扩）。
		 *
		 * 表格自己滚时表头贴着自己的边，磨砂只需要盖住它本身；
		 * 但当表格和上方的列表 header 一起放在「外层滚动容器」里、
		 * 由外层滚时，表头会平移到容器边缘 —— 这时容器两侧的内边距
		 * 会露出一条没有磨砂的窄缝。传入该内边距的数值，磨砂层就能铺到边。
		 */
		headerBleed?: number;
		/**
		 * 容器最大高度，超出即由表格自己滚动（表头是 sticky，滚动时保持吸顶）。
		 * 默认 '70vh'：即便外面没给高度，行数一多也不会把整页撑长、
		 * 表头更不会跟着页面滚走。传 'none' 关闭，交给父容器决定高度。
		 */
		maxHeight?: string;
		/**
		 * 折行单元格最多显示几行（默认 3），超出后在单元格内垂直滚动。
		 * 传 0 关闭上限，行高随内容撑开。
		 */
		cellMaxLines?: number;
		/** 单元格内容被裁掉时悬停弹出完整文本（库内 Tooltip，默认 true） */
		cellTip?: boolean;
		/**
		 * 表头是否吸顶（`position: sticky`），默认 true。
		 *
		 * 常规用法（一页一两张表）保持吸顶，滚动时能一直看到列名。
		 * 但 sticky 表头处在可滚动容器里时，每一帧都要重新计算吸顶位置 ——
		 * 一页塞十几张表、且表格又嵌在别的滚动容器里时，这笔开销会明显拖慢帧率
		 * （实测 demo 表格页：13.0ms/帧、满帧率 54% → 关掉后 9.8ms、满帧 95%）。
		 * 这种极端场景可以传 false 换性能，代价是表头会跟着行一起滚走。
		 *
		 * 注意：关掉吸顶后仍保留纯色底色与下边框，表头与数据行在视觉上依然分得开。
		 */
		stickyHeader?: boolean;
		class?: string;
		style?: string;
	} = $props();

  let sortState = $state<SortState | null>(null);
  const displayRows = $derived.by(() => {
    const s = sortState;
    if (!s) return rows;
    const col = columns.find((c) => c.id === s.key);
    if (!col || !(col.sortable ?? true)) return rows;
    return sorted(rows, s, (row) => sortValue(col, row));
  });

  function sortValue(col: Column<T>, row: T): unknown {
    return col.sortAccessor ? col.sortAccessor(row) : renderText(col, row);
  }

  function colSortable(col: Column<T>): boolean {
    return col.sortable ?? true;
  }

  function ariaSort(col: Column<T>): "ascending" | "descending" | undefined {
    if (sortState?.key !== col.id) return undefined;
    return sortState.dir === "asc" ? "ascending" : "descending";
  }

  function renderText(col: Column<T>, row: T): string {
    return col.render(row);
  }

  /**
   * 高亮关键词（已 trim），空串表示不渲染 <mark>。
   *
   * 在组件顶部声明而不是挪到使用处附近：tdHtml/cellHtml 都读它，
   * 它是 $derived，提前算好可让一页几十张表共用一个 trim 结果，
   * 而不是每个单元格各 trim 一次。
   */
  const kw = $derived(highlight.trim());

  /**
   * 单元格可能的 class 只有 2×3×3 = 18 种组合，预先算好、按位取用。
   *
   * 模板里每写一个 `class:xxx={...}`，编译出来就是每行每格一次 effect；多个 class 指令
   * × 行数 × 列数，一页十几个表格就是几万个 effect 常驻。合并成一个 class 属性后
   * 每格只剩一个插值。为什么不用对象形式 `class={{...}}`：那会生成内联样式对象，
   * 每帧都是新对象引用，比手写字符串更费。
   *
   * 三个维度：等宽字体（2）× 水平对齐（3）× 溢出策略（3）；
   * 不传 align 即左对齐（样式里的默认值），故对齐只出 right / center 两种。
   * 下标 = (字体位 × 3 + 对齐位) × 3 + 溢出位，与下面的生成顺序一一对应。
   */
  const TD_CLASS = (() => {
    const out: string[] = [];
    for (const base of ['', 'mono']) {
      for (const align of ['', 'right', 'center']) {
        for (const ov of ['ov-wrap', 'ov-ellipsis', 'ov-scroll']) {
          out.push([base, align, ov].filter(Boolean).join(' '));
        }
      }
    }
    return out;
  })();

  /**
   * 单元格 class：18 种组合之一。
   *
   * 不带 Svelte 的作用域类也安全：对应规则写成 `.table-container :global(td.mono)`，
   * 编译成 `.table-container.svelte-xxxx td.mono`，命中的是任意 <td>（详见样式段注释）。
   */
  function tdClass(col: Column<T>): string {
    return TD_CLASS[(monoBit(col) * 3 + alignBit(col)) * 3 + overflowBit(col)];
  }

  function monoBit(col: Column<T>): number {
    return col.mono ? 1 : 0;
  }

  function alignBit(col: Column<T>): number {
    return col.align === 'right' ? 1 : col.align === 'center' ? 2 : 0;
  }

  /**
   * 该列实际生效的溢出策略。
   *
   * custom 列的内容是调用方自己的 snippet，没法安全复制第二份给跑马灯做无缝衔接，
   * 所以 'scroll' 在 custom 列降级为 'ellipsis' —— 否则就只剩「硬切」，最糟的一种。
   */
  function overflowOf(col: Column<T>): ColumnOverflow {
    const o = colOverflow(col);
    return o === 'scroll' && col.custom ? 'ellipsis' : o;
  }

  function overflowBit(col: Column<T>): number {
    const o = overflowOf(col);
    return o === 'ellipsis' ? 1 : o === 'scroll' ? 2 : 0;
  }

  /**
   * 单元格属性一次性拼好。
   *
   * 不用 `{...cellAttrs(col, row)}` 展开：展开要逐个 diff 键、并在不匹配时移除旧属性，
   * 行数一多代价明显。这里返回固定形状的字符串，值都做过转义 / base64。
   *
   * `text` 由调用方传入：renderText 是用户回调，同一格在头部与正文都要用，
   * 每处各调一次就是 3 倍回调开销（20 张表 × 30 行 × 7 列能到上万次）。
   *
   * 完整文本一律放 `data-tip`（不设长度阈值）：它只是个普通属性，浏览器不为它
   * 维护命中判定，不像原生 `title` 那样让指针每次移动都扫一遍上万个元素。
   * 真正要不要弹，由 onBodyOver 里量一次「内容是否被裁掉」决定。
   */
  function tdAttrs(col: Column<T>, row: T, text: string): string {
    // 'scroll' 列不写 data-tip：那一列的全文靠悬停滚动看，气泡本来就不会弹，
    // 属性白占字节（一页几千格，长文本能到几十 KB）
    let s = text && overflowOf(col) !== 'scroll' ? ` data-tip="${escapeAttr(text)}"` : '';
    const m = contextMenu ? (col.menu ?? menu) : undefined;
    if (m) {
      const data: Record<string, string> = { copy: text };
      Object.assign(data, col.menuData?.(row));
      s += ' ' + cellMenuAttrString(m, data);
    }
    return s;
  }

  function escapeAttr(v: string): string {
    return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escapeHtml(v: string): string {
    return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * 整个 <td> 一次拼成字符串。
   *
   * 为什么连标签一起拼：右键菜单属性是两个动态键值对，模板里只能用 {@html} 插字符串，
   * 而 {@html} 不允许出现在属性位置（Svelte 报 tag_invalid_placement）。整格拼成
   * HTML 是唯一能让「class + data-*」同时成立又不做逐键 diff 的写法。
   *
   * 样式怎么接上：这些节点不经过 Svelte 的 class 注入，而编译器产出的规则默认是
   * `td.svelte-xxxx`（带作用域类），两边对不上就会出现「单元格样式全没了」。
   * 因此单元格相关的 CSS 一律写成 `.table-container :global(td...)`，
   * 编译成 `.table-container.svelte-xxxx td`，命中任意 <td> 且不泄漏（详见样式段注释）。
   *
   * 安全：数据文本全部经过 escapeHtml / escapeAttr，结构部分是本文件写死的常量。
   */
  function tdHtml(col: Column<T>, row: T): string {
    if (col.custom && cell) return '';
    const text = renderText(col, row);
    const body = cellHtml(col, text);
    return `<td class="${tdClass(col)}"${tdAttrs(col, row, text)}>${body}</td>`;
  }

  /** 单元格内容：有高亮词时逐段包 <mark>，否则整段转义输出 */
  function cellHtml(col: Column<T>, text: string): string {
    const k = kw;
    let inner: string;
    if (!k) {
      inner = escapeHtml(text);
    } else {
      inner = '';
      for (const p of highlightParts(text, k)) {
        inner += p.hit ? `<mark>${escapeHtml(p.text)}</mark>` : escapeHtml(p.text);
      }
    }
    // 循环滚动列：同一段内容放两份，第二份 aria-hidden（读屏只念一遍）。
    // track 宽度 = 2 × (内容 + 尾部间距)，动画平移 -50% 恰好是一份，
    // 第一份滚到尽头时第二份已对齐起点，接缝看不出来 —— 这就是「无限」的来源，
    // 不需要 JS 改 transform，也就不会每帧回主线程。
    if (inner && overflowOf(col) === 'scroll') {
      return `<div class="cell-inner"><span class="mq"><span class="mq-i">${inner}</span><span class="mq-i" aria-hidden="true">${inner}</span></span></div>`;
    }
    return `<div class="cell-inner">${inner}</div>`;
  }

  // ── 表格 DOM ──────────────────────────────────────────────────────────────
  //
  // 表格默认 table-layout:auto：列宽仍由内容决定，但每个单元格都允许在任意位置折行
  // （overflow-wrap:anywhere），长内容只会让行变高、不会把表格撑出容器。
  // 一旦有列选了 ellipsis / scroll，整表切 fixed（见 fixedLayout）—— nowrap 的 min-content
  // 无法用 auto 布局压住，不换 fixed 的话省略号与滚动起点都不会出现。
  // 两种布局下容器宽度都是硬约束：横向不滚，溢出都在格子里消化（换行 / 省略号 / 格内滚动）。

  /**
   * 各列宽度：`width` 声明占比，`minWidth` / `maxWidth` 是可选约束。
   *
   * 三者都可以写成 `2`（份数）/ `'20%'` / `'200px'`；不写就是 `auto`，由内容自适应。
   * 求解在 ../colWidths.svelte.ts 的 resolvePercents 里完成：先按占比分一遍，
   * 再把越界的列夹到约束上、差额分摊给还有余量的列。
   */
  const colPercents = $derived(
    toPercents(
      resolvePercents([
        ...columns.map((c) => ({ width: c.width, minWidth: c.minWidth, maxWidth: c.maxWidth })),
        ...(actions ? [{ width: actionsPercent }] : []),
      ]),
    ),
  );

  /** 只有显式声明过宽度的列才落百分比，其余交给浏览器按内容自适应 */
  const colWidths = $derived(
    [
      ...columns.map((c) => !!(c.width ?? c.minWidth ?? c.maxWidth)),
      ...(actions ? [actionsPercent != null] : []),
    ].map((declared, i) => (declared ? (colPercents[i] ?? 'auto') : 'auto')),
  );

  let tableEl: HTMLTableElement | undefined = $state();
  let tbodyEl: HTMLTableSectionElement | undefined = $state();
  let scrollEl: HTMLDivElement | undefined = $state();

  /**
   * hover pill 的几何参照。
   *
   * PillTrack 是按「容器 clientWidth - 两侧滚动条」把项量成整行宽的，
   * 所以它量在 tbody 上得到的就是一条贯通行宽度的圆角带；若量在 table 上，
   * 竖向滚动条占的 8~15px 会让 pill 永远差一点、露在表格外。
   * 样式上 tbody 需要 position:relative 才能兜住 absolute 的 pill。
   * 挂在 table 上的指针监听会覆盖 tbody 的全部行。
   */
  const pillContainer = $derived<HTMLElement | null>(tbodyEl ?? null);
  const pillRowSelector = $derived(pillContainer ? 'tbody > tr:not(.disabled)' : '');

  /** 该列的溢出策略，默认换行（超出 cellMaxLines 后在格内垂直滚动） */
  function colOverflow(col: Column<T>): ColumnOverflow {
    return col.overflow ?? 'wrap';
  }

  /**
   * 是否有列选择了单行显示（ellipsis / scroll）。
   *
   * 「单行」与「不撑宽容器」只有 table-layout:fixed 能同时满足：
   * auto 布局下列的 min-content 就是 nowrap 文字的全宽，表格必然被顶开，
   * 截断与滚动都无从发生。所以只要出现单行列，整表切 fixed ——
   * 列宽按声明分配，未声明的列等分剩余宽度。
   * 全 wrap（默认）的表格仍是 auto 布局，列宽继续跟着内容走。
   */
  const fixedLayout = $derived(columns.some((c) => colOverflow(c) !== 'wrap'));

  /**
   * 折行单元格的最大高度 = cellMaxLines 行 × 1.5 行高。
   *
   * 用 em 而不是 px：mono 列与普通列字号一致，但主题若调整字号，上限会跟着走。
   * cellMaxLines 传 0 时给 'none'，行高随内容撑开。
   */
  const cellMaxH = $derived(cellMaxLines > 0 ? `calc(${cellMaxLines} * 1.5em)` : 'none');

  // ── 单元格气泡提示 / 循环滚动 ─────────────────────────────────────────────
  //
  // 全表共用一个 Tooltip：tdAttrs 只把完整文本写进 data-tip，指针真的停进
  // 某个格子时，这里量一次「内容是否真被裁掉」，再把该 <td> 交给 Tooltip 当锚点。
  // 为什么不在每格挂一个 Tooltip：一页十几张表就是上万个组件实例 + 上万个
  // mouseenter 监听，代价与「原生 title 上万个元素」是一样的，只是从浏览器
  // 内部挪到了我们自己的 JS 里。
  //
  // 判定用 scrollWidth/clientWidth：这是唯一能分清「文本刚好放得下」与
  // 「已经被省略号吃掉一截」的办法。读它会触发一次强制布局，但只在真正
  // 停住指针的那一小段时间发生（pointerover 一格一次），不在渲染路径上。
  //
  // 'scroll' 列走另一条路：不弹气泡，改成让格子里的内容自己循环滚 ——
  // 同样的信息，用滚动表达比用一个盖住表格的气泡更直接。两者共用这次
  // pointerover，也只在这一刻量一次尺寸。

  let tipAnchor = $state<HTMLElement | null>(null);
  let tipText = $state('');
  let tipOpen = $state(false);

  /** 指针当前所在的格子（普通变量即可：只用于去重，不参与渲染） */
  let hoverTd: HTMLElement | null = null;
  /** 正在跑的跑马灯 track。同一时刻最多一个 —— 指针只可能停在一个格子上 */
  let mqEl: HTMLElement | null = null;

  function closeTip() {
    if (!tipOpen) return;
    tipOpen = false;
    tipAnchor = null;
  }

  /**
   * 启动循环滚动。
   *
   * 时长按内容宽度算（60px/s），而不是写死一个秒数：短内容滚 12s 慢得像卡住，
   * 长内容滚 12s 又快得读不了。下限 4s 是给「只溢出两三个字」的格子兜底。
   *
   * 单份宽度要扣掉尾部间距（`.mq-i` 的 padding-right）：不扣的话，一段刚好
   * 放得下的文本会因为自己留的空隙被判成溢出，白白滚起来。
   */
  function startMarquee(inner: HTMLElement | null) {
    const mq = inner?.querySelector<HTMLElement>('.mq');
    const first = mq?.firstElementChild as HTMLElement | null;
    if (!inner || !mq || !first) return;
    const gapW = parseFloat(getComputedStyle(first).paddingRight) || 0;
    const textW = first.getBoundingClientRect().width - gapW;
    if (textW <= inner.clientWidth + 1) return;
    mq.style.setProperty('--dt-mq-dur', `${Math.max(4, (textW + gapW) / 60)}s`);
    mq.classList.add('run');
    mqEl = mq;
  }

  /**
   * 停下跑马灯。
   *
   * 移除 class 而不是 pause：每次悬停都应该从内容开头读起，
   * 暂停会停在上一轮的中途位置。动画被移除后重新添加，浏览器会从头播。
   */
  function stopMarquee() {
    if (!mqEl) return;
    mqEl.classList.remove('run');
    mqEl = null;
  }

  /** 指针离开单元格（换格 / 离开整张表 / 表格滚动）时的统一收尾 */
  function resetCells() {
    hoverTd = null;
    closeTip();
    stopMarquee();
  }

  function onBodyOver(ev: PointerEvent) {
    const td = (ev.target as HTMLElement | null)?.closest?.('td') as HTMLElement | null;
    if (!td) {
      resetCells();
      return;
    }
    // 同一格里换子节点（<mark>、图标）会再触发一次 pointerover，不必重量一遍
    if (hoverTd === td) return;
    hoverTd = td;
    // 换格：上一格的滚动必须先停，否则会留下一个继续滚的格子
    stopMarquee();

    // 循环滚动列：内容自己在格子里滚，气泡只会把同一段文字再念一遍
    if (td.classList.contains('ov-scroll')) {
      closeTip();
      startMarquee(td.querySelector<HTMLElement>('.cell-inner'));
      return;
    }

    if (!cellTip) {
      closeTip();
      return;
    }
    const inner = td.querySelector<HTMLElement>('.cell-inner');
    const text = td.dataset.tip ?? '';
    // 只提示真被裁掉的内容：完整可见时弹气泡，等于把看到的字再念一遍
    const clipped =
      !!inner && (inner.scrollWidth > inner.clientWidth + 1 || inner.scrollHeight > inner.clientHeight + 1);
    if (!inner || !text || !clipped) {
      closeTip();
      return;
    }
    tipText = text;
    tipAnchor = td;
    tipOpen = true;
  }

  /**
   * 一行 <tr>（下面的 {#snippet bodyRow}）。
   *
   * 用 snippet 而不是把行内联进 {#each}：这样每个 keyed 块只持有一个 key 计算，
   * 行内容本身不随 key 变化重建；无 rowKey 的分支还能走纯索引 key，
   * 否则每行都要挂一个读 rowKey 的 effect（上千行时就是上千个常驻响应式节点）。
   * 纯文本格仍由 tdHtml 一次拼好 —— 见 tdHtml() 的说明。
   */
</script>

{#snippet bodyRow(row: T)}
  <tr class:disabled={disabled?.(row)}>
    {#each columns as col (col.id)}
      {#if col.custom && cell}
        {@const text = renderText(col, row)}
        <td class={tdClass(col)} data-tip={text || undefined}>
          <div class="cell-inner">{@render cell(col.id, row)}</div>
        </td>
      {:else}
        {@html tdHtml(col, row)}
      {/if}
    {/each}
    {#if actions}
      <td class="actions-cell">
        <div class="actions">
          {@render actions(row)}
        </div>
      </td>
    {/if}
  </tr>
{/snippet}

<div
  class="table-container {cls}"
  style="--dt-max-h:{maxHeight};--dt-cell-max-h:{cellMaxH};{style}"
  bind:this={scrollEl}
  onscroll={resetCells}
>
  {#if loading}
    <div class="placeholder">加载中…</div>
  {:else if rows.length === 0}
    <div class="placeholder">{emptyText}</div>
  {:else}
    <table
      bind:this={tableEl}
      class:bleed={headerBleed > 0}
      class:not-sticky={!stickyHeader}
      class:fixed={fixedLayout}
      style:--th-bleed="{headerBleed}px"
    >
      <!-- 列宽：只有显式声明过的列才有百分比，其余 auto —— 表格是 auto 布局，
           列宽跟着内容走，声明值只是「建议宽度」。 -->
      <colgroup>
        {#each columns as col, ci (col.id)}
          <col style="width:{colWidths[ci] ?? 'auto'}" />
        {/each}
        {#if actions}
          <col style="width:{colWidths[colWidths.length - 1] ?? 'auto'}" />
        {/if}
      </colgroup>
      <thead>
        <tr>
          {#each columns as col, ci (col.id)}
            <th
              class:right={col.align === "right"}
              class:center={col.align === "center"}
              aria-sort={ariaSort(col)}
            >
              {#if colSortable(col)}
                <button type="button" class="sort-btn" class:active={sortState?.key === col.id} onclick={() => (sortState = toggleSort(sortState, col.id))}>
                  <span class="sort-label">{col.header}</span>
                  <Icon icon={Triangle} size={14} class={sortState?.key === col.id && sortState.dir === "desc" ? "sort-flip" : ""} />
                </button>
              {:else}
                {col.header}
              {/if}
            </th>
          {/each}
          {#if actions}
            <th class="right">
              操作
            </th>
          {/if}
        </tr>
      </thead>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_mouse_events_have_key_events -->
      <!-- 气泡提示是纯视觉补充：键盘用户拿不到的不是唯一信息，
           完整文本已经在 data-tip 里、并且（wrap 列）滚一下就能读完。
           委托在 tbody 上：监听器数量与行数、表数都无关。 -->
      <tbody bind:this={tbodyEl} onpointerover={onBodyOver} onpointerleave={resetCells}>
        <PillTrack
          container={pillContainer}
          itemSelector={pillRowSelector}
          activeSelector=""
          disabledMatch=""
          showSelected={false}
          background=""
          hoverBackground="var(--hover)"
          radius="var(--radius-md)"
          portal
        />
        <!-- {#key kw} 是必须的，不是装饰：
             {@html} 在 Svelte 5 里编译成一次性写入（外面没有 effect 包裹），
             不写 key 时高亮词一变，单元格内容不会重建，<mark> 永远停在首帧。
             把 key 放在行循环外层，而不是每格一个：一次只重建一次整块，
             每格的 {@html} 依旧是一次性写入，平时的性能特征完全不变。 -->
        {#key kw}
          {#if rowKey}
            {#each displayRows as row, i (rowKey(row, i))}
              {@render bodyRow(row)}
            {/each}
          {:else}
            {#each displayRows as row, i (i)}
              {@render bodyRow(row)}
            {/each}
          {/if}
        {/key}
      </tbody>
    </table>
  {/if}
  <!-- 全表共用的一个气泡（详见 onBodyOver 上方的说明）。
       放在容器里而不是 table 里：<div> 直接塞进 <tbody> 属于非法嵌套。 -->
  {#if cellTip}
    <Tooltip anchor={tipAnchor} open={tipOpen} title={tipText} placement="top-start" maxWidth={360} />
  {/if}
</div>

<style>
  /* min-width:0 是关键：作为 flex/grid 子项时 min-width 默认是 auto，
     会被内容的 min-content 撑大，导致 overflow:auto 不生效、表格直接冲出父容器。
     设成 0 后容器可以收缩到任意宽度，横向滚动由它自己兜底（正常情况用不到）。

     max-height:100% 是关键：没有它时 height:100% 在「父容器没有确定高度」的布局里
     会回落成内容高度，容器自身不产生滚动 —— 滚动被推给外层（页面 / 卡片），
     sticky 表头的参照物就变成了外层，表头于是跟着行一起滚走。
     100% 是有上限的缩放：父级高度确定时正好填满，父级只是 auto 时退化为内容高度、
     由表格自己滚动。max-height 与 height 在同一父高度下落成同一个值，
     所以父级高度确定时也不会把容器压扁。

     行内还有一条由 maxHeight prop 生成的上限（默认 70vh，传 'none' 关闭）：
     父级高度是 auto 时 100% 等于「不限制」，只有这一条能把表头固定住。
     写成 max(var(--dt-max-h), 0px) 而不是直接 `max-height: var(--dt-max-h)`：
     自定义属性取到 'none' 时整条声明会被判为无效而整条丢弃，外层的高度约束也就
     一并失效；max() 里非长度值只会让这一项失效并回落初始值 none，高度约束照常生效。 */
  .table-container { width: 100%; height: 100%; max-height: max(var(--dt-max-h), 0px); overflow: auto; scrollbar-gutter: stable; min-width: 0; }
  .placeholder { padding: var(--space-10); text-align: center; color: var(--text-muted); font-size: var(--fs-14); }

  /* 列宽由内容决定（table-layout: auto 是默认值，不写）。
     宽度是硬约束：宽度百分比只是「建议分配」，长内容一律在格子里折行，
     不会把表格顶宽 —— 单元格的 overflow-wrap:anywhere 把 min-content 压到一个字符，
     所以 auto 布局也能收进 100%。 */
  /* separate 而非 collapse：collapse 模式下 td 的 border-radius 与背景会被共享边吃掉。
     spacing:0 保证视觉上仍然是紧贴的表格，仅失去「边框合并」这一特性。
     背景铺在 table 而不是 td 上：td 有自己的背景层就会盖住 PillTrack 的 hover pill，
     行底与 hover 色都必须落在 pill 之下。 */
  table { width: 100%; max-width: 100%; border-collapse: separate; border-spacing: 0; font-size: var(--fs-14); background-color: var(--surface); }

  /* 有列选了 ellipsis / scroll 时的布局（见 fixedLayout）：
     列宽只认声明，未声明的列等分剩余宽度。auto 布局下 nowrap 列会把表格顶宽，
     截断与「容器宽度是硬约束」二者不可兼得，只能换 fixed。 */
  table.fixed { table-layout: fixed; }

  /* 左右内边距 16px 而不是 24px：24px 时相邻两列之间会空出 48px，
     用户看到的就是「每列左右各有一大片留白、列之间却没有分界」。
     16px 既留住呼吸感，又让列边界靠右侧的细分隔线立得住。 */
  /* 表头：纯色底 + 加粗下边框与行分隔。
     不用 backdrop-filter 磨砂：它要一层 GPU 合成层，而吸顶表头在滚动时背后一直
     在动，等于每帧重新采样重模糊一次。而它的视觉收益本来就接近零 —— 表头背后
     就是表格行的纯色底，blur 与一层半透明色几乎看不出区别，
     所以直接去掉，分层感交给底色与边框。 */
  /* 表头没有拖拽手柄，所以 overflow 可以留在 hidden，单元格内容溢出由 .cell-inner 处理。 */
  /* 表头也允许折行：nowrap 的 header 会给列定下「不可再窄」的 min-content，
     窄容器里没有单条长数据也会把表格顶宽。表头文案通常很短，折行几乎不出现。 */
  th { position: sticky; top: 0; z-index: 1; background-clip: padding-box; background-color: var(--surface-2); color: var(--text-muted); font-weight: 500; text-align: left; padding: var(--sp-lg) var(--space-4); border-bottom: 2px solid var(--border-strong); white-space: normal; overflow-wrap: anywhere; overflow: hidden; }

  /* 吸顶时的「压住内容」暗示：表头底缘一道极淡的投影。
     不用 box-shadow —— td/th 带 overflow:hidden，会把向外的阴影裁掉一半；
     改用 background-image 画在 th 内部的底缘，裁剪不会影响它。
     只在吸顶模式下画：不吸顶时表头跟着内容走，这层投影反而像一道多余的横线。 */
  table:not(.not-sticky) thead > tr > th {
    background-image: linear-gradient(to top, rgba(0, 0, 0, 0.05), transparent 4px);
  }

  /* 不吸顶模式（stickyHeader={false}）：sticky 表头在「可滚动容器 + 多张表」时会成为
     每帧的位置重算来源，极端场景下关掉能拿回大量帧时间（demo 表格页实测
     13.0ms/帧、满帧 54% → 9.8ms、满帧 95%）。底色与下边框都保留，
     只是表头会跟着行一起滚走。 */
  table.not-sticky > thead > tr > th { position: static; }

  /* 磨砂层外扩（--th-bleed，由 headerBleed 传入，默认 0 = 无效）：
     用 box-shadow 画一层与表头同色的外扩底，再用负边距把它伸出去。
     不用 padding 是因为那会把表头文字推离开头的 16px 对齐；
     不用 ::before 是因为竖向溢出会把 sticky 元素在滚动容器里顶出一段高度。
     外扩部分由外层容器的 overflow 裁掉，因此不会产生横向滚动条。 */
  table.bleed > thead > tr > th { margin-right: calc(var(--th-bleed, 0px) * -1); }
  table.bleed > thead > tr > th:first-child { margin-left: calc(var(--th-bleed, 0px) * -1); }
  thead > tr > th {
    box-shadow:
      calc(var(--th-bleed, 0px) * -1) 0 0 var(--surface-2),
      var(--th-bleed, 0px) 0 0 var(--surface-2);
  }

  /* 表头圆角：只圆首尾两列的外角，中间列保持直角，接缝才不会露出缺口。
     外扩（headerBleed）时角半径要加上外扩量，否则外扩出来的直角块会顶在圆角外。 */
  thead > tr > th:first-child { border-top-left-radius: calc(var(--radius-lg) + var(--th-bleed, 0px)); }
  thead > tr > th:last-child { border-top-right-radius: calc(var(--radius-lg) + var(--th-bleed, 0px)); }
  th.right { text-align: right; }
  th.center { text-align: center; }
  .sort-btn { display: inline-flex; align-items: center; gap: var(--space-1); padding: 0; background: none; border: none; cursor: pointer; font: inherit; color: inherit; white-space: normal; max-width: 100%; min-width: 0; text-align: inherit; }
  /* 文案单独成项并允许收缩：匿名 flex 项的 min-width 是 auto，不包一层的话
     长表头会把这个按钮撑到 th 之外，折行也就不会发生。 */
  .sort-btn .sort-label { min-width: 0; overflow-wrap: anywhere; }
  .sort-btn :global(svg) { color: var(--text-muted); opacity: 1; transition: color 0.15s; flex: none; }
  .sort-btn:hover :global(svg) { color: var(--text-strong); }
  .sort-btn.active :global(svg) { color: var(--primary); }
  .sort-btn :global(.sort-flip) { transform: rotate(180deg); }

  /* tbody 是 PillTrack 的测量容器，同时要兜住 absolute 的 pill */
  tbody { position: relative; }

  /* ── 单元格 ────────────────────────────────────────────────────────────

     这一段全部以 `.table-container :global(...)` 写出，原因很关键：

     tdHtml() 用 {@html} 拼出 <td>，这些节点不经过 Svelte 的 class 注入，
     而编译器的规则是 `td.svelte-xxxx`（选择器带作用域类）。两边对不上，
     单元格就一条规则都匹配不上 —— 表现就是「项样式全没了」。

     带 scoped 前缀的 :global 编译成 `.table-container.svelte-xxxx td`：
     命中任意 <td>，而前缀的 hash 保证规则不会泄漏到组件外。
     ⚠ 别再往里加需要 td 带 hash 的选择器，也别把 :global 写在最前面
     （那样整条规则会退化成全局规则、原样输出）。 */

  /* hover 底色改由 PillTrack 的 pill 绘制（行间滑动的圆角带），
     td 不再自己变色，否则整行方角底色会把 pill 盖住、圆角也看不出来。
     z-index 只为了压住表格背景层，table 本身上下都开着。 */
  .table-container :global(td) { position: relative; z-index: 0; padding: var(--sp-lg) var(--space-4); border-bottom: 1px solid var(--border); color: var(--text); background-color: transparent; overflow: hidden; }

  /* 表体也有列分隔线，但比表头淡得多：表体行本来就是「一条条」的视觉单位，
     实线会把行分割的横线切开；淡线只在不干扰横线的前提下提示列边界。
     上下留 8px（而不是百分比）：行高不同时百分比会让线的长度飘忽，
     短行里甚至缩成一小段，看着像残线。 */
  .table-container :global(tbody > tr > td:not(:last-child)::after) {
    content: '';
    position: absolute;
    top: var(--space-2);
    bottom: var(--space-2);
    right: 0;
    width: 1px;
    background-color: var(--border-strong);
    opacity: 0.6;
    pointer-events: none;
  }
  .table-container :global(td.right) { text-align: right; }
  .table-container :global(td.center) { text-align: center; }
  .table-container :global(tbody tr:last-child td) { border-bottom: none; }
  .table-container :global(tr.disabled td) { opacity: 0.5; }
  .table-container :global(td.mono) { font-family: var(--font-mono); font-size: var(--fs-14); font-variant-numeric: tabular-nums; word-break: break-all; }
  .table-container :global(.actions-cell) { white-space: nowrap; }
  .table-container :global(.actions) { display: flex; align-items: center; justify-content: flex-end; gap: var(--sp-md); }
  /* 高亮命中 */
  .table-container :global(mark) { background-color: rgba(255, 213, 0, 0.45); color: inherit; padding: 0 1px; border-radius: var(--radius-xs); }

  /* ── 单元格内容溢出策略 ──────────────────────────────────────────────── */

  /* 默认：换行 + 格内垂直滚动。
     max-height 由 cellMaxLines 推出（默认 3 行 × 1.5 行高），超过就在格子里滚，
     行高因此有上限；overflow-wrap:anywhere 同时把列的 min-content 压到一个字符，
     长内容也就不会把表格顶宽。 */
  .table-container :global(.cell-inner) {
    display: block;
    max-width: 100%;
    max-height: var(--dt-cell-max-h, 4.5em);
    overflow-x: hidden;
    overflow-y: auto;
    line-height: 1.5;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  /* 单行省略号：不折行、不滚动，超出即截断 */
  .table-container :global(td.ov-ellipsis .cell-inner) {
    max-height: none;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* ── 无限循环滚动（overflow: 'scroll'） ──────────────────────────────
     静止时和省略号一样只露开头、并在末尾画 …（让人知道还有内容，而不是
     像硬切那样「看起来就是这样」），指针停上来才滚。cellHtml 把同一段内容
     放了两份（第二份 aria-hidden），每份都带同样的右内边距，于是

       track 宽度 = 2 × (内容 + 间距)

     动画从 0 平移到 -50%，正好是一个「内容 + 间距」的循环单元：第一份
     滚到尽头时第二份已对齐起点，接缝看不出来。整个过程只有 transform 在变，
     走合成层，不触发布局、不需要 JS 每帧介入 —— 所以能一直滚下去。 */
  .table-container :global(td.ov-scroll .cell-inner) {
    max-height: none;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  /* 滚起来就把 … 收掉：它会一直钉在右边界上，压住正在滚出来的文字 */
  .table-container :global(td.ov-scroll .cell-inner:has(.mq.run)) { text-overflow: clip; }
  .table-container :global(td.ov-scroll .mq) {
    display: inline-block;
    white-space: nowrap;
  }
  .table-container :global(td.ov-scroll .mq-i) {
    display: inline-block;
    padding-right: 3em;
  }
  /* will-change 只挂在真正在动的那一个上：常驻会让每格都提升合成层，
     一页几千个格子就是几千个图层，比动画本身贵得多。 */
  .table-container :global(td.ov-scroll .mq.run) {
    will-change: transform;
    animation: dt-marquee var(--dt-mq-dur, 12s) linear infinite;
  }
  @keyframes dt-marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  /* 关掉动效时退回省略号：不然就只剩「硬切」，比原来更难读。
     第二条的选择器要带上 :has() —— 它和上面「滚动时收掉 …」那条特异性相同，
     必须写在后面才能覆盖（只写第一条压不住）。 */
  @media (prefers-reduced-motion: reduce) {
    .table-container :global(td.ov-scroll .mq.run) { animation: none; will-change: auto; }
    .table-container :global(td.ov-scroll .cell-inner),
    .table-container :global(td.ov-scroll .cell-inner:has(.mq.run)) { text-overflow: ellipsis; }
  }

  /* th 需要成为定位上下文，拖拽手柄才能贴在其边缘。
     sticky 本身已是定位元素，absolute 子元素相对它定位，故无需 position:relative。 */
  th { position: sticky; }
</style>






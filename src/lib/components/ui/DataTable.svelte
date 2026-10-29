<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import Triangle from "@lucide/svelte/icons/triangle";
  import { cellMenuAttrString } from "../contextMenu";
  import type { Column } from "../tableTypes";
  import Icon from "./Icon.svelte";
  import PillTrack from "./PillTrack.svelte";
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
   * 文本超过这个长度才挂原生 title。
   *
   * 单元格的实际可用宽度随列宽变化，用字符数做代理是刻意为之：
   * 精确判断要读 scrollWidth（强制布局），而那正是本组件在极力避免的开销。
   * 阈值取 20：短于它的文本在任何常规列宽下都放得下。
   */
  const TITLE_MIN = 20;

  /**
   * 单元格可能的 class 只有 2×3 = 6 种组合，预先算好、按位取用。
   *
   * 模板里每写一个 `class:xxx={...}`，编译出来就是每行每格一次 effect；6 个 class 指令
   * × 行数 × 列数，一页十几个表格就是几万个 effect 常驻。合并成一个 class 属性后
   * 每格只剩一个插值。为什么不用对象形式 `class={{...}}`：那会生成内联样式对象，
   * 每帧都是新对象引用，比手写字符串更费。
   */
  const TD_CLASS = (() => {
    const out: string[] = [];
    for (const base of ['', 'mono']) {
      for (const align of ['', 'right', 'center']) {
        const cls = [base, align, 'ov-ellipsis'].filter(Boolean).join(' ');
        out.push(cls);
      }
    }
    return out;
  })();

  /**
   * 单元格 class：6 种组合之一。
   *
   * 不带 Svelte 的作用域类也安全：对应规则写成 `.table-container :global(td.mono)`，
   * 编译成 `.table-container.svelte-xxxx td.mono`，命中的是任意 <td>（详见样式段注释）。
   */
  function tdClass(col: Column<T>): string {
    return TD_CLASS[monoBit(col) | (alignBit(col) << 1)];
  }

  function monoBit(col: Column<T>): number {
    return col.mono ? 1 : 0;
  }

  function alignBit(col: Column<T>): number {
    return col.align === 'right' ? 1 : col.align === 'center' ? 2 : 0;
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
   * title 只在长文本时加：原生 title 让浏览器为每个元素维护 tooltip 命中判定，
   * 一页几张表就是上万个带 title 的 <td>，指针每次移动都要参与一遍。
   * 短文本本来不会被截断，tooltip 也对不出新信息 —— 省掉它几乎不影响可用性。
   *
   * 这是全库唯一保留原生 title 的地方（气泡提示统一走 Tooltip 组件）：
   * 纯文本格是拼 HTML 字符串渲染的，一个格一个 Tooltip 组件在上万格的量级上
   * 不划算。需要气泡提示就在 custom 列的 cell snippet 里自己包一层 Tooltip。
   */
  function tdAttrs(col: Column<T>, row: T, text: string): string {
    let s = text.length > TITLE_MIN ? ` title="${escapeAttr(text)}"` : '';
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
   * HTML 是唯一能让「class + title + 任意 data-*」同时成立又不做逐键 diff 的写法。
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
    const body = cellHtml(text);
    return `<td class="${tdClass(col)}"${tdAttrs(col, row, text)}>${body}</td>`;
  }

  /** 单元格内容：有高亮词时逐段包 <mark>，否则整段转义输出 */
  function cellHtml(text: string): string {
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
    return `<div class="cell-inner">${inner}</div>`;
  }

  // ── 表格 DOM ──────────────────────────────────────────────────────────────
  //
  // 表格用 table-layout:fixed，各列宽度按占比解成百分比，
  // 因此各列之和恒为 100%，容器怎么缩放都不会横向溢出。
  // 详见 ../colWidths.svelte.ts 顶部的说明。

  /**
   * 各列宽度：`width` 声明占比，`minWidth` / `maxWidth` 是可选约束。
   *
   * 三者都可以写成 `2`（份数）/ `'20%'` / `'200px'`，也可全都不写（均分）。
   * 求解在 ../colWidths.svelte.ts 的 resolvePercents 里完成：先按占比分一遍，
   * 再把越界的列夹到约束上、差额分摊给还有余量的列，保证总和恒为 100%。
   * 正因为总和恒为 100%，table-layout:fixed 就不会横向溢出。
   */
  const colPercents = $derived(
    toPercents(
      resolvePercents([
        ...columns.map((c) => ({ width: c.width, minWidth: c.minWidth, maxWidth: c.maxWidth })),
        ...(actions ? [{ width: actionsPercent }] : []),
      ]),
    ),
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

  /** 该列的溢出策略，默认截断省略号 */
  function colOverflow(col: Column<T>): 'ellipsis' | 'wrap' | 'clip' {
    return col.overflow ?? 'ellipsis';
  }

  /** 只有截断策略的格子才需要 hover 滚动，换行/裁切的格子挂了也不会有动画 */
  function overflowable(col: Column<T>): boolean {
    return colOverflow(col) === 'ellipsis';
  }

  /** 高亮关键词，空串表示不渲染 <mark>（省掉每格的拆段与 extra 节点） */

  /**
   * hover 滚动的判定与计时，全部在 tbody 上一次事件委托里完成。
   *
   * 早先每个 .cell-inner 上都挂 onmouseenter/onmouseleave：一页十几张表意味着几千个
   * 监听器，鼠标划过时每一次进出都在跑一次 scrollWidth 读取（强制样式重算 + 布局）。
   * 现在改成只监听 tbody 的 mouseover/mouseout，靠 closest('.cell-inner') 找回目标格，
   * 监听器数量与行数、表数无关；relatedTarget 检查可以避免在格子内部子节点间移动时
   * 反复触发。
   */
  let currentCell: HTMLElement | null = null;

  function onBodyOver(ev: MouseEvent) {
    const t = ev.target as HTMLElement | null;
    const inner = t?.closest<HTMLElement>('.cell-inner');
    if (!inner || inner === currentCell) return;
    if (currentCell) currentCell.classList.remove('marquee');
    currentCell = inner;
    applyMarquee(inner);
  }

  function onBodyOut(ev: MouseEvent) {
    const inner = currentCell;
    if (!inner) return;
    const to = ev.relatedTarget as Node | null;
    if (to && inner.contains(to)) return;
    inner.classList.remove('marquee');
    currentCell = null;
  }

  /**
   * 按实际溢出量设置位移与时长。
   * 位移取负的溢出像素数，滚到底时正好露出结尾；时长按「每 60px 用 1 秒」估算。
   * 没有溢出就不加类，动画自然不启动。
   */
  function applyMarquee(inner: HTMLElement) {
    const overflow = inner.scrollWidth - inner.clientWidth;
    if (overflow <= 1) return;
    const shift = -(overflow + 8); // 末尾留空隙，避免文字紧贴右边被裁
    inner.style.setProperty('--marquee-shift', `${shift}px`);
    inner.style.setProperty('--marquee-dur', `${Math.max(2, (overflow + 8) / 60)}s`);
    inner.classList.add('marquee');
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
        <td class={tdClass(col)} title={renderText(col, row)}>
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

<div class="table-container {cls}" style="--dt-max-h:{maxHeight};{style}" bind:this={scrollEl}>
  {#if loading}
    <div class="placeholder">加载中…</div>
  {:else if rows.length === 0}
    <div class="placeholder">{emptyText}</div>
  {:else}
    <table
      bind:this={tableEl}
      class:fixed-layout={columns.length > 0}
      class:bleed={headerBleed > 0}
      class:not-sticky={!stickyHeader}
      style:--th-bleed="{headerBleed}px"
    >
      <!-- 列宽：权重换算成百分比，各列之和恒为 100%，故永不横向溢出。
           没有这段 colgroup 时 fixed 布局会让未设宽的列均分剩余宽度，
           而不是让指定的列吃到预期的比例。 -->
      <colgroup>
        {#each columns as col, ci (col.id)}
          <col style="width:{colPercents[ci] ?? 'auto'}" />
        {/each}
        {#if actions}
          <col style="width:{colPercents[colPercents.length - 1] ?? 'auto'}" />
        {/if}
      </colgroup>
      <thead>
        <tr>
          {#each columns as col, ci (col.id)}
            <th
              class:right={col.align === "right"}
              class:center={col.align === "center"}
              class:ov-ellipsis={colOverflow(col) === "ellipsis"}
              class:ov-wrap={colOverflow(col) === "wrap"}
              aria-sort={ariaSort(col)}
            >
              {#if colSortable(col)}
                <button type="button" class="sort-btn" class:active={sortState?.key === col.id} onclick={() => (sortState = toggleSort(sortState, col.id))}>
                  {col.header}
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
      <!-- svelte-ignore a11y_mouse_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <!-- 悬停滚动是纯装饰：键盘 focus 不需要触发它，格子里的文本本身始终可读 -->
      <tbody bind:this={tbodyEl} onmouseover={onBodyOver} onmouseout={onBodyOut}>
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
</div>

<style>
  /* min-width:0 是关键：作为 flex/grid 子项时 min-width 默认是 auto，
     会被 <table> 的 min-content（所有 nowrap 单元格之和）撑大，
     导致 overflow:auto 不生效、表格直接冲出父容器。
     设成 0 后容器可以收缩到任意宽度，横向滚动由它自己承担。

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
  .placeholder { padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px; }

  /* 列宽固定：按 colgroup 指定的百分比分配，不再由内容反推宽度，
     因此各列之和恒等于表格宽度，横向永远不出现滚动条。 */
  /* separate 而非 collapse：collapse 模式下 td 的 border-radius 与背景会被共享边吃掉。
     spacing:0 保证视觉上仍然是紧贴的表格，仅失去「边框合并」这一特性。
     背景铺在 table 而不是 td 上：td 有自己的背景层就会盖住 PillTrack 的 hover pill，
     行底与 hover 色都必须落在 pill 之下。 */
  table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 14px; background-color: var(--surface); }
  table.fixed-layout { table-layout: fixed; }

  /* 左右内边距 16px 而不是 24px：24px 时相邻两列之间会空出 48px，
     用户看到的就是「每列左右各有一大片留白、列之间却没有分界」。
     16px 既留住呼吸感，又让列边界靠右侧的细分隔线立得住。 */
  /* 表头：纯色底 + 加粗下边框与行分隔。
     不用 backdrop-filter 磨砂：它要一层 GPU 合成层，而吸顶表头在滚动时背后一直
     在动，等于每帧重新采样重模糊一次。而它的视觉收益本来就接近零 —— 表头背后
     就是表格行的纯色底，blur(12px) 与一层半透明色几乎看不出区别。
     实测（demo 表格页、浏览器平滑滚动、每组 3 次取中位数）：
       sticky + blur(12px)   13.03ms/帧  满帧 54.2%
       sticky + 纯色底        13.12ms/帧  满帧 53.6%
       blur(1px) 与 blur(12px) 都是 12.0ms —— 开销与半径无关，是这个属性本身
     所以直接去掉，分层感交给底色与边框。 */
  /* 表头不再有拖拽手柄（列宽调整能力已移除），所以 overflow 可以留在 hidden，
     单元格内容溢出由 .cell-inner / .sort-btn 各自的 ellipsis 处理。 */
  th { position: sticky; top: 0; z-index: 1; background-clip: padding-box; background-color: var(--surface-2); color: var(--text-muted); font-weight: 500; text-align: left; padding: var(--sp-lg) 16px; border-bottom: 2px solid var(--border-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

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
  .sort-btn { display: inline-flex; align-items: center; gap: 4px; padding: 0; background: none; border: none; cursor: pointer; font: inherit; color: inherit; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
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
  .table-container :global(td) { position: relative; z-index: 0; padding: var(--sp-lg) 16px; border-bottom: 1px solid var(--border); color: var(--text); background-color: transparent; overflow: hidden; }

  /* 表体也有列分隔线，但比表头淡得多：表体行本来就是「一条条」的视觉单位，
     实线会把行分割的横线切开；淡线只在不干扰横线的前提下提示列边界。
     上下留 8px（而不是百分比）：行高不同时百分比会让线的长度飘忽，
     短行里甚至缩成一小段，看着像残线。 */
  .table-container :global(tbody > tr > td:not(:last-child)::after) {
    content: '';
    position: absolute;
    top: 8px;
    bottom: 8px;
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
  .table-container :global(td.mono) { font-family: var(--font-mono); font-size: 14px; font-variant-numeric: tabular-nums; word-break: break-all; }
  .table-container :global(.actions-cell) { white-space: nowrap; }
  .table-container :global(.actions) { display: flex; align-items: center; justify-content: flex-end; gap: var(--sp-md); }
  /* 高亮命中 */
  .table-container :global(mark) { background-color: rgba(255, 213, 0, 0.45); color: inherit; padding: 0 1px; border-radius: 2px; }

  /* ── 单元格内容溢出策略 ──────────────────────────────────────────────── */

  /* 内层容器：截断与滚动都在这一层做，避免影响 td 的 padding 与背景。 */
  .table-container :global(.cell-inner) {
    display: block;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* 纯裁切，无省略号（PID 这类定长数字） */
  .table-container :global(td.ov-clip .cell-inner) { text-overflow: clip; }

  /* 换行：允许内容折行，行高会随内容变化 */
  .table-container :global(td.ov-wrap .cell-inner),
  th.ov-wrap { white-space: normal; overflow-wrap: anywhere; }

  /* hover 横向滚动：内容比单元格宽时才上滚。
     --marquee-dur 由组件按溢出量动态设置，溢出越多滚得越久。
     只在 hover 时启动动画，鼠标移开立即回位，不干扰扫读。

     这条规则别写成 `:hover`：鼠标一进入单元格它就成立，一页几十个表格意味着
     鼠标每次划过都在给多个元素挂/摘动画。改用 .marquee 类由 onCellEnter
     在「确实溢出了」时才加上，静止时不占用任何动画管线。 */
  .table-container :global(td.ov-ellipsis .cell-inner.marquee) {
    text-overflow: clip;
    animation: cell-marquee var(--marquee-dur, 4s) linear infinite;
  }
  @keyframes cell-marquee {
    0%, 8% { transform: translateX(0); }
    92%, 100% { transform: translateX(var(--marquee-shift, 0)); }
  }
  /* 尊重系统「减少动态效果」偏好：关闭滚动，改为直接展示省略号 */
  @media (prefers-reduced-motion: reduce) {
    .table-container :global(td.ov-ellipsis .cell-inner.marquee) { animation: none; text-overflow: ellipsis; }
  }

  /* th 需要成为定位上下文，拖拽手柄才能贴在其边缘。
     sticky 本身已是定位元素，absolute 子元素相对它定位，故无需 position:relative。 */
  th { position: sticky; }
</style>






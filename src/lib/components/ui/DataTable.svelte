<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import Triangle from "@lucide/svelte/icons/triangle";
  import { cellMenuAttrs } from "../contextMenu";
  import type { Column } from "../tableTypes";
  import Icon from "./Icon.svelte";
  import ColumnResizer from "./ColumnResizer.svelte";
  import PillTrack from "./PillTrack.svelte";
  import { sorted, toggleSort, type SortState } from "../sorting";
  import {
    DEFAULT_WEIGHT,
    MIN_COL_PX,
    loadWidthsVersioned,
    nextAutoKey,
    resizeWeights,
    saveWidthsVersioned,
    toPercents,
    weightsFingerprint,
  } from "../colWidths.svelte";

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
		resizable = true,
		persistKey,
		autofitOnDblClick = true,
		onColumnResize,
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
		/** 是否允许拖拽调整列宽，默认 true */
		resizable?: boolean;
		/**
		 * 列宽持久化键。传入则把拖拽结果写入 localStorage 并在下次加载时恢复。
		 * 不传时按组件实例自动生成一个键，同一实例刷新后仍能记住。
		 */
		persistKey?: string;
		/** 双击列分隔线时是否自动适应内容宽度，默认 true */
		autofitOnDblClick?: boolean;
		/** 列宽变化回调，参数是 列 id → 百分比(0~100) */
		onColumnResize?: (percents: Record<string, number>) => void;
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

  function cellAttrs(col: Column<T>, row: T): Record<string, string> {
    if (!contextMenu) return {};
    const m = col.menu ?? menu;
    if (!m) return {};
    const data: Record<string, string> = { copy: renderText(col, row) };
    Object.assign(data, col.menuData?.(row));
    return cellMenuAttrs(m, data);
  }

  // ── 表格 DOM ──────────────────────────────────────────────────────────────
  //
  // 表格用 table-layout:fixed，各列宽度以相对权重存、渲染成百分比，
  // 因此各列之和恒为 100%，容器怎么缩放都不会横向溢出。
  // 详见 ../colWidths.svelte.ts 顶部的说明。

  /** 实际参与布局的列数：columns 加上可选的 actions 列 */
  const totalCols = $derived(columns.length + (actions ? 1 : 0));

  /**
   * 是否为最后一个参与布局的列（仅指 columns 内，不含 actions 插槽列）。
   *
   * 只有「columns 的最后一列 + 没有 actions 插槽」时才是真正的末列。
   * 有 actions 时，columns 的最后一列右边还有 actions 可借，方向仍是 right。
   */
  function isLastCol(index: number): boolean {
    return index === columns.length - 1 && !actions;
  }

  /** 配置里声明的初始权重。没有 width 的列一律 DEFAULT_WEIGHT。 */
  function initialWeights(): number[] {
    const w = columns.map((c) => (c.width != null && c.width > 0 ? c.width : DEFAULT_WEIGHT));
    if (actions) w.push(DEFAULT_WEIGHT);
    return w;
  }

  /** 持久化键：显式传入优先，否则按实例自动生成（刷新后仍能记住） */
  const autoKey = nextAutoKey();
  const storageKey = $derived(persistKey || autoKey);

  /**
   * 计算初始权重：先看持久化记录，长度不符或配置已变就回到配置默认。
   * 三个参数都是显式传入的值，不在函数里读 `$derived`/props，
   * 这样在组件初始化期调用也不会触碰响应式依赖。
   */
  function resolveWeights(n: number, key: string): number[] {
    const fallback = initialWeights();
    return (
      loadWidthsVersioned(key, n, weightsFingerprint(fallback)) ?? fallback
    );
  }

  // 初值就地算出：不能留空等 $effect 填，否则第一帧 colgroup 全是 width:auto、
  // table-layout 也不是 fixed，表格会先按内容撑开再跳变（实测首帧确实如此）。
  //
  // `svelte-ignore` 是必须的：props 与 $derived 在这里的读取只用于「生成初值」，
  // 只取初值正是本意（后续变化由下方的 $effect 负责）。
  // svelte-ignore state_referenced_locally
  const initialCols = columns.length + (actions ? 1 : 0);
  let weights = $state<number[]>(
    // svelte-ignore state_referenced_locally
    initialCols > 0 ? resolveWeights(initialCols, persistKey || autoKey) : [],
  );

  // 列数变化（例如 actions 插槽出现/消失）或 persistKey 变更时重新初始化
  $effect(() => {
    const n = totalCols;
    const key = storageKey;
    if (n === 0) return;
    if (weights.length === n) return;
    weights = resolveWeights(n, key);
  });

  const colPercents = $derived(toPercents(weights));

  let tableEl: HTMLTableElement | undefined = $state();
  let tbodyEl: HTMLTableSectionElement | undefined = $state();

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

  function containerWidth(): number {
    return tableEl?.getBoundingClientRect().width ?? 0;
  }

  /** 该列当前实际宽度（px），只用于手柄的无障碍朗读值 */
  function colWidthPx(index: number): number {
    const pct = Number.parseFloat(colPercents[index] ?? '0');
    return (pct / 100) * containerWidth();
  }

  function commit(next: number[]) {
    if (next === weights) return;
    weights = next;
    saveWidthsVersioned(storageKey, next, weightsFingerprint(initialWeights()));
    onColumnResize?.(percentMap());
  }

  function percentMap(): Record<string, number> {
    const ps = toPercents(weights);
    const out: Record<string, number> = {};
    columns.forEach((c, i) => {
      const v = ps[i];
      if (v) out[c.id] = Number.parseFloat(v);
    });
    if (actions) {
      const v = ps[ps.length - 1];
      if (v) out.__actions = Number.parseFloat(v);
    }
    return out;
  }

  /**
   * 拖拽中的实际增量。
   *
   * 注意父级回调给的是「相对拖拽起点」的累计位移，而 resizeWeights 也按
   * 累计语义计算，所以这里只需把累计位移交给它即可，无需自己记 delta。
   */
  let dragBase: number[] | null = null;

  function beginDrag() {
    dragBase = [...weights];
  }

  function applyDrag(index: number, dx: number, dir: 'right' | 'left', maxPx?: number) {
    const base = dragBase ?? weights;
    const col = columns[index];
    const minPx = col?.minWidth ?? MIN_COL_PX;
    const next = resizeWeights(base, index, dx, containerWidth(), minPx, maxPx, dir);
    if (next !== base) commit(next);
  }

  function endDrag() {
    dragBase = null;
  }

  /** 双击自适应：按该列所有单元格的实际内容宽度重设权重 */
  function autofit(index: number) {
    if (!autofitOnDblClick) return;
    const t = tableEl;
    if (!t) return;
    const cw = containerWidth();
    if (!(cw > 0)) return;

    // 取该列所有 td（含表头）的最大内容宽度
    let maxContent = 0;
    const cells = t.querySelectorAll<HTMLElement>(
      `tbody > tr > td:nth-child(${index + 1}), thead > tr > th:nth-child(${index + 1})`
    );
    for (const el of cells) {
      const inner = el.firstElementChild as HTMLElement | null;
      const w = inner ? inner.scrollWidth : el.scrollWidth;
      if (w > maxContent) maxContent = w;
    }
    if (!(maxContent > 0)) return;

    // scrollWidth 不含 td 的左右 padding，补回来（左右各 16px，见样式里的 td padding）
    const cs = cells[0] ? getComputedStyle(cells[0]) : null;
    const padX = cs ? Number.parseFloat(cs.paddingLeft) + Number.parseFloat(cs.paddingRight) : 32;
    const desiredPx = Math.min(maxContent + padX + 2, cw * 0.8);

    // 与右邻列（或末列时为左邻）冻结总量，换算成权重
    const total = weights.reduce((a, b) => a + (b > 0 ? b : 0), 0);
    if (!(total > 0)) return;

    const isLast = index === weights.length - 1;
    const neighbor = isLast ? index - 1 : index + 1;
    if (neighbor < 0) return;

    const ownPx = (weights[index] / total) * cw;
    const dxPx = desiredPx - ownPx;
    const next = resizeWeights(weights, index, dxPx, cw, columns[index]?.minWidth ?? MIN_COL_PX, undefined, isLast ? 'left' : 'right');
    if (next !== weights) commit(next);
  }

  /** 该列是否允许拖拽 */
  function colResizable(col: Column<T> | undefined): boolean {
    if (!resizable) return false;
    return col?.resizable ?? true;
  }

  /** 该列的溢出策略，默认截断省略号 */
  function colOverflow(col: Column<T>): 'ellipsis' | 'wrap' | 'clip' {
    return col.overflow ?? 'ellipsis';
  }

  /**
   * hover 滚动：进入单元格时按实际溢出量设置位移与时长。
   *
   * 位移取负的溢出像素数，这样滚到底时正好露出结尾；
   * 时长按「每 60px 用 1 秒」估算，长文本滚得慢一些、短文本快一些。
   * 没有溢出就不设变量，动画自然不启动（位移 0 看不出效果）。
   */
  function marqueeAttrs(col: Column<T>, row: T): Record<string, string> {
    const text = renderText(col, row);
    if (!text) return {};
    return { 'data-marquee': 'on' };
  }

  function onCellEnter(ev: MouseEvent) {
    const inner = ev.currentTarget as HTMLElement | null;
    if (!inner) return;
    const overflow = inner.scrollWidth - inner.clientWidth;
    if (overflow <= 1) return;
    // 末尾留一点空隙，避免文字紧贴右边被裁掉
    const shift = -(overflow + 8);
    inner.style.setProperty('--marquee-shift', `${shift}px`);
    inner.style.setProperty('--marquee-dur', `${Math.max(2, (overflow + 8) / 60)}s`);
  }
</script>

<div class="table-container {cls}" style={style}>
  {#if loading}
    <div class="placeholder">加载中…</div>
  {:else if rows.length === 0}
    <div class="placeholder">{emptyText}</div>
  {:else}
    <table bind:this={tableEl} class:fixed-layout={weights.length > 0}>
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
                <button class="sort-btn" class:active={sortState?.key === col.id} onclick={() => (sortState = toggleSort(sortState, col.id))}>
                  {col.header}
                  <Icon icon={Triangle} size={14} class={sortState?.key === col.id && sortState.dir === "desc" ? "sort-flip" : ""} />
                </button>
              {:else}
                {col.header}
              {/if}
              {#if colResizable(col)}
                <ColumnResizer
                  direction="right"
                  label="调整「{col.header}」列宽"
                  valuePx={colWidthPx(ci)}
                  maxPx={col.maxWidth ?? 4000}
                  onresize={(dx) => {
                    if (!dragBase) beginDrag();
                    // 末列右边没有邻居可扣，改从左邻借：手柄虽挂在右边缘，
                    // 但方向的语义是「从哪一侧扣权重」，所以末列传 left。
                    applyDrag(ci, dx, isLastCol(ci) ? 'left' : 'right', col.maxWidth);
                  }}
                  onautofit={() => autofit(ci)}
                  onend={endDrag}
                />
              {/if}
            </th>
          {/each}
          {#if actions}
            <th class="right">
              操作
              {#if colResizable(undefined) && columns.length > 0}
                <!-- 末列手柄挂在左边缘：它右边没有列可扣，只能从左边借 -->
                <ColumnResizer
                  direction="left"
                  label="调整「操作」列宽"
                  onresize={(dx) => {
                    if (!dragBase) beginDrag();
                    applyDrag(columns.length, -dx, 'left');
                  }}
                  onautofit={() => autofit(columns.length)}
                  onend={endDrag}
                />
              {/if}
            </th>
          {/if}
        </tr>
      </thead>
      <tbody bind:this={tbodyEl}>
        <PillTrack
          container={pillContainer}
          itemSelector={pillRowSelector}
          activeSelector=""
          disabledMatch=""
          showSelected={false}
          background=""
          hoverBackground="var(--surface-3)"
          radius="var(--radius-md)"
        />
        {#each displayRows as row, i (rowKey ? rowKey(row, i) : i)}
          <tr class:disabled={disabled?.(row)}>
            {#each columns as col (col.id)}
              <td
                class:mono={col.mono}
                class:right={col.align === "right"}
                class:center={col.align === "center"}
                class:ov-ellipsis={colOverflow(col) === "ellipsis"}
                class:ov-wrap={colOverflow(col) === "wrap"}
                class:ov-clip={colOverflow(col) === "clip"}
                {...cellAttrs(col, row)}
              >
                {#if col.custom && cell}
                  <div class="cell-inner">{@render cell(col.id, row)}</div>
                {:else}
                  <div
                    class="cell-inner"
                    title={renderText(col, row)}
                    {...marqueeAttrs(col, row)}
                    onmouseenter={onCellEnter}
                  >
                    {#if highlight.trim()}
                      {#each highlightParts(renderText(col, row), highlight) as p, hi (col.id + "-" + p.text + "-" + hi)}
                        {#if p.hit}<mark>{p.text}</mark>{:else}{p.text}{/if}
                      {/each}
                    {:else}
                      {renderText(col, row)}
                    {/if}
                  </div>
                {/if}
              </td>
            {/each}
            {#if actions}
              <td class="actions-cell">
                <div class="actions">
                  {@render actions(row)}
                </div>
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  /* min-width:0 是关键：作为 flex/grid 子项时 min-width 默认是 auto，
     会被 <table> 的 min-content（所有 nowrap 单元格之和）撑大，
     导致 overflow:auto 不生效、表格直接冲出父容器。
     设成 0 后容器可以收缩到任意宽度，横向滚动由它自己承担。 */
  .table-container { width: 100%; height: 100%; overflow: auto; min-width: 0; }
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
  th { position: sticky; top: 0; z-index: 1; background-color: var(--surface-2); color: var(--text-muted); font-weight: 500; text-align: left; padding: var(--sp-lg) 16px; border-bottom: 2px solid var(--border-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* sticky 自身就是定位元素，::after 的 right:0 已能落在 th 右边界，
     不需要再加 position: relative（那会覆盖 sticky 的定位方式）。 */

  /* 列分隔线：画在 th 的右边界上（不用 border-right，避免与 sticky 的
     背景色叠加出重影），因此除最后一列外每列都有竖线，列边界可辨。 */
  thead > tr > th:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 25%;
    bottom: 25%;
    right: 0;
    width: 1px;
    background-color: var(--border-strong);
    pointer-events: none;
  }

  /* 表头圆角：只圆首尾两列的外角，中间列保持直角，接缝才不会露出缺口。 */
  thead > tr > th:first-child { border-top-left-radius: var(--radius-lg); }
  thead > tr > th:last-child { border-top-right-radius: var(--radius-lg); }
  th.right { text-align: right; }
  th.center { text-align: center; }
  .sort-btn { display: inline-flex; align-items: center; gap: 4px; padding: 0; background: none; border: none; cursor: pointer; font: inherit; color: inherit; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .sort-btn :global(svg) { color: var(--text-muted); opacity: 1; transition: color 0.15s; flex: none; }
  .sort-btn:hover :global(svg) { color: var(--text-strong); }
  .sort-btn.active :global(svg) { color: var(--primary); }
  .sort-btn :global(.sort-flip) { transform: rotate(180deg); }

  /* tbody 是 PillTrack 的测量容器，同时要兜住 absolute 的 pill */
  tbody { position: relative; }

  /* hover 底色改由 PillTrack 的 pill 绘制（行间滑动的圆角带），
     td 不再自己变色，否则整行方角底色会把 pill 盖住、圆角也看不出来。
     z-index 只为了压住表格背景层，table 本身上下都开着。 */
  td { position: relative; z-index: 0; padding: var(--sp-lg) 16px; border-bottom: 1px solid var(--border); color: var(--text); background-color: transparent; overflow: hidden; }

  /* 表体也有列分隔线，但比表头淡得多：表体行本来就是「一条条」的视觉单位，
     实线会把行分割的横线切开；淡线只在不干扰横线的前提下提示列边界。
     上下留 8px（而不是百分比）：行高不同时百分比会让线的长度飘忽，
     短行里甚至缩成一小段，看着像残线。 */
  tbody > tr > td:not(:last-child)::after {
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
  td.right { text-align: right; }
  td.center { text-align: center; }
  tbody tr:last-child td { border-bottom: none; }
  tr.disabled td { opacity: 0.5; }
  .mono { font-family: var(--font-mono); font-size: 14px; font-variant-numeric: tabular-nums; word-break: break-all; }
  .actions-cell { white-space: nowrap; }
  .actions { display: flex; align-items: center; justify-content: flex-end; gap: var(--sp-md); }
  mark { background-color: rgba(255, 213, 0, 0.45); color: inherit; padding: 0 1px; border-radius: 2px; }

  /* ── 单元格内容溢出策略 ──────────────────────────────────────────────── */

  /* 内层容器：截断与滚动都在这一层做，避免影响 td 的 padding 与背景 */
  .cell-inner {
    display: block;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
  }

  /* 默认：截断显示省略号 */
  .ov-ellipsis > .cell-inner { text-overflow: ellipsis; }

  /* 纯裁切，无省略号（PID 这类定长数字） */
  .ov-clip > .cell-inner { text-overflow: clip; }

  /* 换行：允许内容折行，行高会随内容变化 */
  .ov-wrap > .cell-inner,
  th.ov-wrap { white-space: normal; overflow-wrap: anywhere; }

  /* hover 横向滚动：内容比单元格宽时才上滚。
     --marquee-dur 由组件按溢出量动态设置，溢出越多滚得越久。
     只在 hover 时启动动画，鼠标移开立即回位，不干扰扫读。 */
  .ov-ellipsis > .cell-inner:hover {
    text-overflow: clip;
    animation: cell-marquee var(--marquee-dur, 4s) linear infinite;
  }
  @keyframes cell-marquee {
    0%, 8% { transform: translateX(0); }
    92%, 100% { transform: translateX(var(--marquee-shift, 0)); }
  }
  /* 尊重系统「减少动态效果」偏好：关闭滚动，改为直接展示完整文本 */
  @media (prefers-reduced-motion: reduce) {
    .ov-ellipsis > .cell-inner:hover { animation: none; text-overflow: ellipsis; }
  }

  /* th 需要成为定位上下文，拖拽手柄才能贴在其边缘。
     sticky 本身已是定位元素，absolute 子元素相对它定位，故无需 position:relative。 */
  th { position: sticky; }
</style>

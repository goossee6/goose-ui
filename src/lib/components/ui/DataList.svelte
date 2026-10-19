<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import PillTrack from './PillTrack.svelte';
  import Header from './Header.svelte';

  /**
   * 列表组件，自带可选的 header。
   *
   * header 不是另写的一套壳，而是直接复用通用的 Header 组件 ——
   * title / left(header) / center(headerCenter) / right(headerRight) /
   * --header-h 高度 / headerClass 全部原样可用，吸顶与磨砂也由 Header 自己负责，
   * 观感与页面级 Header 完全一致。
   * 这里只是替它铺好使用位置：容器负责滚动与内边距，
   * 并把 Header 的左右缩进对齐到行内容。
   *
   * 用法分两种：
   * 1. 塞进已有卡片 / 面板（外层已有内边距）——保持默认即可，
   *    `.list-container` 是唯一的滚动容器，header 在里面吸顶。
   * 2. 独立成块（列表外面没有内边距）——传 dataTableHeader={true}，
   *    容器自己补齐两侧内边距，看起来就像表格的表头。
   *
   * 不想显示 header 时不给 title / header / headerCenter / headerRight 即可，
   * 组件一像素都不会多出来。
   */
  let {
    rows = [],
    emptyText = '暂无数据',
    children,
    bindContainer,
    rowKey,
    title,
    header,
    headerCenter,
    headerRight,
    headerId,
    headerClass = '',
    headerStyle = '',
    headerSticky = true,
    dataTableHeader = false,
    maxHeight = '70vh',
    class: cls = '',
    style = '',
  }: {
    rows?: T[];
    emptyText?: string;
    children: Snippet<[T]>;
    bindContainer?: (el: HTMLElement | null) => void;
    rowKey?: (row: T, index: number) => string | number;
    /** header 标题（纯文本），对应 Header 的 title */
    title?: string;
    /** 对应 Header 的 left：放搜索框、面包屑、「共 N 项」等任意内容 */
    header?: Snippet;
    /** 对应 Header 的 center */
    headerCenter?: Snippet;
    /** 对应 Header 的 right：按钮、筛选器等 */
    headerRight?: Snippet;
    /** 传给 Header 的 id，可配合 <a href> 定位 */
    headerId?: string;
    /** 传给 Header 的附加类名 */
    headerClass?: string;
    /** 传给 Header 的内联样式；覆盖 --header-h 即可改这条 header 的高度 */
    headerStyle?: string;
    /** header 滚动时是否吸顶，默认 true */
    headerSticky?: boolean;
    /**
     * 「像表格表头那样」使用：容器自带两侧内边距，
     * header 的磨砂与分隔线也一直铺到容器边缘。默认 false（适配已有内边距的卡片）。
     */
    dataTableHeader?: boolean;
    /**
     * 容器最大高度，超出即由列表自己滚动（内置 header 是吸顶的）。
     * 默认 '70vh'：外面不给高度时行数一多也不会把整页撑长；传 'none' 关闭。
     */
    maxHeight?: string;
    class?: string;
    style?: string;
  } = $props();

  let listEl: HTMLElement | null = $state(null);

  $effect(() => {
    bindContainer?.(listEl);
  });

  /* PillTrack 不带容器时不会量任何东西，等到列表真的挂上再启用，
     免得每行都白白评估一次 itemSelector。 */
  const pillSelector = $derived(listEl ? '.list-row' : '');

  const hasHeader = $derived(!!(header || headerCenter || headerRight || title));

  /** 行两侧内边距：独立成块时 16px（与 DataTable 的单元格左右内边距一致），否则 0 */
  const rowPad = $derived(dataTableHeader ? '16px' : '0px');

  /* Header 自带 title / left / center / right / sticky / id 与吸顶磨砂，
     这里只把它的几何调成「列表里的一条」：高度交给内容、外边距清零、
     左右内边距与行内容对齐。其余特性一律原样保留。 */
  const headerFitStyle = $derived(
    ['--header-h:auto', 'margin:0', `padding:0 ${rowPad}`, headerStyle].filter(Boolean).join(';'),
  );

  /* 行的 key 只在「确实提供了 rowKey」时才走函数分支。
     写成 (rowKey ? rowKey(row, i) : i) 会让每个 keyed 块里的每个行节点都持有一个
     依赖 rowKey 的 effect（哪怕是 undefined），行数上千时就是上千个常驻响应式节点；
     拆成两个 {#each} 后，无 rowKey 的那条路径是纯静态索引 key，零额外开销。 */
  function keyed(rows: T[]): { key: string | number; row: T }[] {
    return rows.map((row, i) => ({ key: rowKey!(row, i), row }));
  }

  /** hover 的 pill 底宽与行内容对齐：独立成块时两侧各缩 16px */
  const pillInset = $derived(dataTableHeader ? 16 : 0);
</script>

<div
  class="list-container {cls}"
  class:bleed={dataTableHeader}
  class:with-header={hasHeader}
  style="--list-pad:{rowPad};--dl-max-h:{maxHeight};{style}"
  bind:this={listEl}
>
  {#if hasHeader}
    <Header
      {title}
      left={header}
      center={headerCenter}
      right={headerRight}
      id={headerId}
      sticky={headerSticky}
      class="list-header {headerClass}"
      style={headerFitStyle}
    />
  {/if}

  {#if rows.length === 0}
    <div class="placeholder">{emptyText}</div>
  {:else}
    <!-- hover 底色由 pill 绘制（跨行滑动的圆角带），故行本身不再变色。
         容器就是列表自身：clientWidth 已扣掉滚动条，pill 才能与行等宽。
         注意 pill 的坐标参照容器内容区，行若有自定义内边距，
         pill 会贴到内容区宽而不是行宽——需要整行铺满时别给行加横向 padding。 -->
    <PillTrack
      container={listEl}
      itemSelector={pillSelector}
      activeSelector=""
      disabledMatch=""
      showSelected={false}
      background=""
      hoverBackground="var(--surface-3)"
      radius="var(--radius-md)"
      insetX={pillInset}
      portal
    />
    {#if rowKey}
      {#each keyed(rows) as entry (entry.key)}
        <div class="list-row">
          {@render children(entry.row)}
        </div>
      {/each}
    {:else}
      {#each rows as row, i (i)}
        <div class="list-row">
          {@render children(row)}
        </div>
      {/each}
    {/if}
  {/if}
</div>

<style>
  /* 测量容器 + absolute pill 的定位上下文，两者都落在列表本身。

     与 DataTable 同一套高度策略：height:100% 在父级高度确定时填满，
     父级只是 auto 时回落成内容高度、由列表自己滚；max-height 由 maxHeight prop
     给出一条上限（默认 70vh），保证外面没给高度时列表也不会把整页撑长，
     内置 header 才能一直吸在列表顶部。max() 写法让 'none' 只废掉这一项、
     不连累外层的高度约束。 */
  .list-container {
    position: relative;
    width: 100%;
    height: 100%;
    max-height: max(var(--dl-max-h), 0px);
    overflow: auto;
    min-width: 0;
  }

  /* 独立成块：两侧补齐内边距，header 与行共用同一套左右缩进 */
  .bleed { padding-inline: 16px; }
  .with-header .list-row { padding-left: var(--list-pad); padding-right: var(--list-pad); }

  .placeholder { padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px; }

  /* z-index 只用于压住 pill 之上的内容层，容器本身不设 z-index，pill 才能照常显示 */
  .list-row {
    position: relative;
    z-index: 0;
    padding: var(--sp-lg) var(--list-pad, 0px);
    border-bottom: 1px solid var(--border);
  }
  .list-row:last-child { border-bottom: none; }
</style>

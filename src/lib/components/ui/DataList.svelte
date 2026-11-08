<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
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
   *    行盒向两侧各缩 16px（inset 可调，与 hover pill 同宽），每项自带边框；
   *    表头底色与分隔线仍铺到容器边缘。
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
    inset = dataTableHeader ? 16 : 0,
    animateRows = 0,
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
     * 「像表格表头那样」使用：行盒两侧各缩 inset px（与 hover pill 同宽），
     * header 的磨砂与分隔线仍铺到容器边缘。默认 false（适配已有内边距的卡片）。
     */
    dataTableHeader?: boolean;
    /** 行盒（以及 hover pill）两侧的横向内缩像素；默认 dataTableHeader 下 16，否则 0 */
    inset?: number;
    /**
     * 行重排（排序/过滤改变顺序）时的过渡时长（ms），0 = 不动画（默认）。
     *
     * 需要 rowKey 给出稳定的行身份，否则节点会被当成「换了一行」而不是「挪了位置」。
     * 开启后每次列表更新都会量一遍行的位置（FLIP 的前后两次 rect），
     * 行数上千且更新频繁的列表建议保持关闭。
     */
    animateRows?: number;
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

  /** 行盒横向内缩：dataTableHeader 下取 inset（默认 16px），与 hover pill 同宽 */
  const rowPad = $derived(`${inset}px`);

  /* Header 自带 title / left / center / right / sticky / id 与吸顶磨砂，
     这里只把它的几何调成「列表里的一条」：高度 64px、外边距清零、
     左右内边距对齐行的内容起点（行盒内缩 + 行内边距）。其余特性一律原样保留。
     高度走 Header 的 height prop；headerStyle 排在后面，传
     headerStyle="--header-h:56px" 仍可覆盖。 */
  const headerFitStyle = $derived(
    ['margin:0', `padding:0 calc(${rowPad} + var(--sp-lg))`, headerStyle].filter(Boolean).join(';'),
  );

  /* 行的 key 只在「确实提供了 rowKey」时才走函数分支。
     写成 (rowKey ? rowKey(row, i) : i) 会让每个 keyed 块里的每个行节点都持有一个
     依赖 rowKey 的 effect（哪怕是 undefined），行数上千时就是上千个常驻响应式节点；
     拆成两个 {#each} 后，无 rowKey 的那条路径是纯静态索引 key，零额外开销。 */
  function keyed(rows: T[]): { key: string | number; row: T }[] {
    return rows.map((row, i) => ({ key: rowKey!(row, i), row }));
  }

  /** 行盒的横向内缩量：与 pill 的 insetX 保持同一个值 */
  const pillInset = $derived(inset);
</script>

<div
  class="list-container {cls}"
  class:with-header={hasHeader}
  style="--list-pad:{rowPad};--dl-max-h:{maxHeight};{style}"
  bind:this={listEl}
>
  {#if hasHeader}
    <Header
      {title}
      height="64px"
      left={header}
      center={headerCenter}
      right={headerRight}
      id={headerId}
      sticky={headerSticky}
      class="list-header {headerClass}"
      style={headerFitStyle}
    />
    <!-- 表头与列表之间的留白，高度取 --header-gap（默认 0，等于不加）。
         必须在 header 与 pill 之间：pill 靠行的 rect 定位，会跟着一起下移。 -->
    <div class="header-gap" aria-hidden="true"></div>
  {/if}

  {#if rows.length === 0}
    <div class="placeholder">{emptyText}</div>
  {:else}
    <!-- hover 底色由 pill 绘制（跨行滑动的圆角带），故行本身不变色。
         容器就是列表自身：clientWidth 已扣掉滚动条，pill 才能与行等宽。
         注意 pill 的坐标参照容器内容区，行盒的横向内缩必须用 margin 而不是
         padding，否则 pill 会贴到内容区宽而不是行盒宽。 -->
    <PillTrack
      container={listEl}
      itemSelector={pillSelector}
      activeSelector=""
      disabledMatch=""
      showSelected={false}
      background=""
      hoverBackground="var(--hover)"
      radius="var(--radius-md)"
      insetX={pillInset}
      portal
    />
    {#if rowKey}
      {#if animateRows > 0}
        <!-- 排序变化时用 FLIP 把行滑到新位置（否则整列表瞬移，看起来像闪一下）。
             时长必须显式给：flip 默认按位移开方算（跳一行就 1s 以上），太拖。 -->
        {#each keyed(rows) as entry (entry.key)}
          <div class="list-row" animate:flip={{ duration: animateRows, easing: cubicOut }}>
            {@render children(entry.row)}
          </div>
        {/each}
      {:else}
        {#each keyed(rows) as entry (entry.key)}
          <div class="list-row">
            {@render children(entry.row)}
          </div>
        {/each}
      {/if}
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
    scrollbar-gutter: stable;
    min-width: 0;
  }

  /* 独立成块：行盒用 margin 让出两侧的 --list-pad（dataTableHeader 默认 16px，
     inset prop 可调），因此与 hover pill 的盒子完全重合；内边距只负责内容和
     边框之间的呼吸空间。容器不加 padding —— 那会再叠一层，把行盒和 pill 的
     对齐一起推歪。 */

  .placeholder { padding: var(--space-10); text-align: center; color: var(--text-muted); font-size: var(--fs-14); }

  /* 行间分隔线由每项自带的边框画出（方框 + 圆角与 pill 一致）。
     z-index 只用于压住 pill 之上的内容层，容器本身不设 z-index，pill 才能照常显示 */
  .list-row {
    position: relative;
    z-index: 0;
    padding: var(--sp-lg);
    margin: 0 var(--list-pad, 0px);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }
  /* 相邻项之间留一条缝，边框才不会连成一条线（相邻 margin 会合并，不会翻倍） */
  .list-row + .list-row { margin-top: var(--sp-md); }

  /* 表头与第一行之间的留白。用 spacer 而不是给行加 margin-top：
     行的前面还有 PillTrack 的绝对定位层，`header + .list-row` 这类相邻
     选择器写不出来（:global 不允许出现在选择器中间），而 :first-of-type
     会把 pill 那一层先数进去。高度由 --header-gap 控制，默认 0。 */
  .header-gap {
    height: var(--header-gap, 0px);
    flex: none;
  }
</style>

<script lang="ts">
  import { Button, CodeBlock, Notification, Tabs, copyToClipboard } from "goose-ui";
  import Copy from '@lucide/svelte/icons/copy';
  import ChevronsDown from '@lucide/svelte/icons/chevrons-down';
  import ChevronsUp from '@lucide/svelte/icons/chevrons-up';
  import { tick } from 'svelte';
  import type { Snippet } from 'svelte';

  let {
    title = '代码预览',
    code = '',
    language = 'svelte',
    maxHeight = '',
    flush = false,
    anchor = '',
    anchorLevel = 3,
    right,
    children
  }: {
    title?: string;
    code?: string;
    language?: string;
    maxHeight?: string;
    /**
     * 把卡片标题提升为页内目录的锚点。
     *
     * 不传（默认）：标题是普通 `<span>`，不进 TOC —— 适用于「分组 h2 下面挂着
     * 一堆卡片」的页面，此时卡片标题是各个示例的名字，属于子项而非章节。
     *
     * 传了 id：标题渲染成带 id 的 `<h2>`/`<h3>`，`toc.ts` 会把它当作一节收进去。
     * 适用于「一个章节只有一个示例」的页面 —— 那种页面里再单独写一个 `<h2>`
     * 等于和卡片标题同一句话说两遍，用这个属性合并成一处。
     *
     * 语义层级由 anchorLevel 决定：不在任何分组 h2 之下时用 2（与其它章节同级），
     * 落在某个分组 h2 之下时用 3（TOC 里缩进成子项）。
     */
    anchor?: string;
    /** 锚点标题的标题级别，2 = h2，3 = h3（默认） */
    anchorLevel?: 2 | 3;
    /**
     * 去掉预览区内边距，让内容直接贴到卡片边框。
     * 用于表格 / 列表（DataTable、DataList）：它们自带单元格内边距和外框，
     * 再叠一层 16px 会让表格看起来悬浮在中间。
     * 只作用于「效果」页签；「源码」页签的 CodeBlock 始终保留内边距。
     */
    flush?: boolean;
    /** 标题栏右侧附加内容（渲染在复制按钮左侧），替代原 Card 的 right snippet */
    right?: Snippet;
    children?: Snippet;
  } = $props();

  let active = $state('preview');
  let copied = $state(false);
  let expanded = $state(false);
  let bodyEl: HTMLDivElement | undefined = $state();
  let currentAnim: Animation | null = null;
  let copyTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 折叠阈值（行）：代码不超过这个行数就完整显示，超过了才折叠并给出「展开全部」。
   * 20 行太低了 —— demo 里绝大多数示例都在 30~60 行，于是每个卡片都挂着展开按钮，
   * 折叠反而成了默认态。
   */
  const FOLD_LINES = 40;
  /**
   * 卡片主体尺寸：最大宽高按 4:3（W:H）约束，最小高度取最大高度的一半。
   *
   * - 宽度：`--cp-max-w`，不再让卡片在宽屏上一路铺满整行 —— 占满全宽时
   *   「效果」页签里的组件被拉到几百像素宽，看不出真实观感。
   *   默认 1080px = 最大高度 810px × 4/3；只在内容区比这更宽时才生效，
   *   窄屏下卡片照常撑满、不会两边留白。
   * - 高度：`--cp-h` 上限 810px，超出（含源码页签的折叠）内部滚动；
   *   下限 `--cp-h` / 2 = 405px，避免空效果或只有一行代码时卡片塌成一条。
   * 外层 CodePreview 想单独调整时给 style 覆盖这两个变量即可。
   */
  const FOLD_HEIGHT = 'var(--cp-h, 810px)';

  const collapsible = $derived(code.split('\n').length > FOLD_LINES);
  /** 折叠态高度：显式 maxHeight 优先，否则用 4:3 比例里的高度上限 */
  const foldHeight = $derived(maxHeight || FOLD_HEIGHT);
  /** 展开态放开高度上限，源码长多高就多高（content 不会被裁） */
  const effectiveMaxHeight = $derived(expanded ? '' : foldHeight);

  const reduceMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  async function mutateWithHeight(fn: () => void) {
    const el = bodyEl;
    if (!el) {
      fn();
      return;
    }
    currentAnim?.cancel();
    currentAnim = null;
    const from = el.getBoundingClientRect().height;
    fn();
    await tick();
    if (reduceMotion()) return;
    const to = el.getBoundingClientRect().height;
    if (Math.abs(to - from) < 1) return;
    el.style.overflow = 'hidden';
    const anim = el.animate(
      [{ height: from + 'px' }, { height: to + 'px' }],
      { duration: 220, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
    );
    currentAnim = anim;
    try {
      await anim.finished;
    } catch {
      // 被下一次动画取消，正常
    }
    if (currentAnim === anim) {
      currentAnim = null;
      el.style.overflow = '';
    }
  }

  async function handleCopy() {
    const ok = await copyToClipboard(code);
    if (ok) {
      copied = true;
      Notification.success('已复制源码到剪贴板');
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 1600);
    } else {
      Notification.error('复制失败');
    }
  }

  function handleTabChange(v: string) {
    // 切回「效果」时重置展开状态：下次再点「源码」应该回到折叠态，
    // 而不是继承上一次手动展开的高度。
    mutateWithHeight(() => {
      active = v;
      expanded = false;
    });
  }

  function toggleExpand() {
    mutateWithHeight(() => {
      expanded = !expanded;
    });
  }
</script>

<!-- 自带单层外框（不再套 Card）：标题在 topline 左侧、紧邻 tab 切换，右侧复制 -->
<div class="cp-card">
  <div class="cp-topline">
    <div class="cp-head">
      {#if title}
        <!-- 传了 anchor 就把标题提升为真正的标题元素，供页内目录摘取
             （toc.ts 只认 `h2[id], h3[id]`）。样式统一挂 .cp-title 类，
             两种元素外观完全一致，所以视觉上不传/传没有区别。 -->
        {#if anchor}
          {#if anchorLevel === 2}
            <h2 class="cp-title" id={anchor}>{title}</h2>
          {:else}
            <h3 class="cp-title" id={anchor}>{title}</h3>
          {/if}
        {:else}
          <span class="cp-title">{title}</span>
        {/if}
      {/if}
      <Tabs
        items={[{ value: 'preview', label: '效果' }, { value: 'source', label: '源码' }]}
        value={active}
        onchange={handleTabChange}
      />
    </div>
    <div class="cp-actions">
      {#if right}{@render right()}{/if}
      <Button size="small" variant="default" icon={Copy} iconSize={14} onclick={handleCopy}>
        {copied ? '已复制' : '复制'}
      </Button>
    </div>
  </div>
  <div
    class="cp-body"
    class:cp-body--flush={flush && active === 'preview'}
    style:--cp-body-max={effectiveMaxHeight || 'none'}
    bind:this={bodyEl}
  >
    {#if active === 'preview'}
      <div class="cp-pane">
        {@render children?.()}
      </div>
    {:else}
      <div class="cp-pane cp-pane--source">
        <CodeBlock {code} {language} showHeader={false} />
        {#if collapsible}
          <Button
            class="cp-expand"
            size="small"
            variant="ghost"
            iconRight={expanded ? ChevronsUp : ChevronsDown}
            iconSize={14}
            onclick={toggleExpand}
          >
            {expanded ? '收起' : '展开全部'}
          </Button>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  /* demo 内的公共尺寸 token：CodePreview 卡片与 PropsTable 共用同一个宽度上限，
     改这里两边一起变。放 :root 而不是 .cp-card，否则兄弟组件拿不到。
     高度仍取 4:3 比例：1080 / 4 × 3 = 810。 */
  :global(:root) {
    --cp-max-w: 1080px;
    --cp-h: 810px;
  }
  .cp-card {
    /* 最大宽高按 4:3：1080 × 810。宽度限制只在内容区更宽时才生效，
       窄屏下自动退回撑满；高度下限取最大值的一半，避免卡片塌陷。
       两个变量用 var(..., 默认值) 读取而不是在这里定义，是为了让
       PropsTable 之类同级的兄弟元素也能用同一个宽度——见 :global(:root)。
       封顶后 margin-inline: auto 让卡片在 .page-body 里居中，
       否则宽屏下会贴着左边缘、右侧留一大片空白。 */
    width: 100%;
    max-width: var(--cp-max-w);
    margin-inline: auto;
    background-color: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    /* overflow 不再恒为 hidden：默认裁剪是为了圆角，但会连带把卡片内的
       浮层裁掉（例如 TitleBar 的搜索下拉、Select 的选项面板 —— 它们从
       触发器往下展开，高度远超卡片）。
       圆角裁剪改由子元素自持圆角实现，只在真的需要裁的时候（展开动画期间
       由 mutateWithHeight 临时设 overflow:hidden）才裁。
       注意：给 cp-card 加 isolated 之类的层叠上下文只会让情况更糟，
       这里要的是「不裁剪」，不是「盖住」。 */
    overflow: visible;
    /* 一枚很轻的落影，把卡片从页面底色上托起来。两段：小半径压边、
       大半径铺开，和 .page-head 同一套写法，避免卡片看起来像贴在纸上。
       不能太重 —— 卡片底色几乎等于页面底色，阴影一重就变成一块厚板。 */
    box-shadow:
      0 1px 2px color-mix(in srgb, #000 4%, transparent),
      0 8px 24px -12px color-mix(in srgb, #000 14%, transparent);
  }
  .cp-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-lg);
    padding: var(--sp-md) var(--sp-lg);
    border-bottom: 1px solid var(--border);
    background-color: var(--surface-2);
  }
  .cp-head {
    display: flex;
    align-items: center;
    gap: var(--sp-lg);
    min-width: 0;
  }
  .cp-actions {
    display: flex;
    align-items: center;
    gap: var(--sp-md);
    flex-shrink: 0;
  }
  .cp-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-strong);
    white-space: nowrap;
    /* 标题可能是 <h2>/<h3>（见 anchor 属性）也可能是 <span>，
       统一清掉浏览器给标题元素的默认外边距与字号，免得两种形态长得不一样。 */
    margin: 0;
    line-height: inherit;
  }
  /* 标题命中目录锚点时，跳转到它要避开吸顶页头（同 .toc-content 里的约定） */
  .cp-title[id] {
    scroll-margin-top: var(--toc-anchor, 72px);
  }
  .cp-body {
    min-height: calc(var(--cp-h) / 2);
    /* 上限来自折叠逻辑：折叠态 = --cp-h（810px）或显式 maxHeight，展开态 = none */
    max-height: var(--cp-body-max, var(--cp-h));
    /* 内容比卡片高时在这里滚，而不是把整页顶长 */
    overflow: auto;
    padding: var(--sp-lg);
    /* 双轴居中：演示内容在卡片正中央，不再贴左上角。
       用 place-content 而不是 place-items —— 子项（.cp-pane）需要保持
       撑满宽度（表格、列表这类内容要占满可用横向空间），只是整体居中。
       注意：居中容器一旦溢出，默认会把开头推出可视区且滚不回去，
       所以配合下面的 .cp-pane { margin: auto } 做兜底。 */
    display: flex;
    place-content: center;
  }
  /* 表格 / 列表类内容自带单元格内边距，再叠一层会让表格像悬浮在卡片中间 */
  .cp-body--flush {
    padding: 0;
  }
  /* 表格/列表贴边模式下，内容自己承担横向滚动。
     不加这层的话，表格的 nowrap 单元格会冲破 .cp-card（它为了不裁剪下拉
     浮层而设了 overflow:visible），把横向滚动条推到整个内容区上。 */
  .cp-body--flush .cp-pane { overflow-x: auto; }
  .cp-pane {
    display: flex;
    flex-direction: column;
    gap: var(--sp-md);
    /* 溢出兜底：margin:auto 在空间不足时会退化为 0，内容仍从起点开始排，
       不会像 place-content:center 那样把开头推到滚动口之外。 */
    margin: auto;
    /* 单轴居中：内容窄于卡片时水平居中，宽于卡片时仍撑满可横向滚 */
    max-width: 100%;
  }
  /* 源码页签：卡片高度是固定的（.cp-body 的 min/max-height），
     CodeBlock 吃掉剩余空间并自己滚 —— 只保留这一层滚动，避免嵌套两条滚动条。
     展开/收起时改的是 .cp-body 的 max-height（见 expanded），这里跟着变即可。 */
  .cp-pane--source {
    height: 100%;
  }
  .cp-pane--source :global(.code-block) {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .cp-pane--source :global(.cb-pre) {
    flex: 1 1 auto;
    min-height: 0;
  }
  .cp-pane :global(.cp-expand) {
    align-self: center;
  }
</style>

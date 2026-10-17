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
    right,
    children
  }: {
    title?: string;
    code?: string;
    language?: string;
    maxHeight?: string;
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

  const collapsible = $derived(code.split('\n').length > 20);
  const effectiveMaxHeight = $derived(expanded ? '' : (maxHeight || '360px'));

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
      {#if title}<span class="cp-title">{title}</span>{/if}
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
  <div class="cp-body" class:cp-body--flush={flush && active === 'preview'} bind:this={bodyEl}>
    {#if active === 'preview'}
      <div class="cp-pane">
        {@render children?.()}
      </div>
    {:else}
      <div class="cp-pane">
        <CodeBlock {code} {language} maxHeight={effectiveMaxHeight} showHeader={false} />
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
  .cp-card {
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
  }
  .cp-body {
    padding: var(--sp-lg);
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
  }
  .cp-pane :global(.cp-expand) {
    align-self: center;
  }
</style>

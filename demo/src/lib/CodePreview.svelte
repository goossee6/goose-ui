<script lang="ts">
  import { Button, Card, CodeBlock, Notification, Tabs, copyToClipboard } from "goose-ui";
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
    children
  }: {
    title?: string;
    code?: string;
    language?: string;
    maxHeight?: string;
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

<Card {title}>
  <div class="cp-card">
    <div class="cp-topline">
      <Tabs
        items={[{ value: 'preview', label: '效果' }, { value: 'source', label: '源码' }]}
        value={active}
        onchange={handleTabChange}
      />
      <Button size="small" variant="default" icon={Copy} iconSize={14} onclick={handleCopy}>
        {copied ? '已复制' : '复制'}
      </Button>
    </div>
    <div class="cp-body" bind:this={bodyEl}>
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
</Card>

<style>
  .cp-card {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .cp-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-md);
    padding: var(--sp-md) var(--sp-lg);
    border-bottom: 1px solid var(--border);
    background-color: var(--surface);
  }
  .cp-body {
    padding: var(--sp-lg);
  }
  .cp-pane {
    display: flex;
    flex-direction: column;
    gap: var(--sp-md);
  }
  .cp-pane :global(.cp-expand) {
    align-self: center;
  }
</style>

<script lang="ts" module>
  /* 弹层层级管理：Esc 只关最上面那层，滚动锁按引用计数叠加。
     这两个状态必须放在组件外，多个 Modal 实例才能互相看见。 */
  let modalSeq = 0;
  const openStack: number[] = [];
  let scrollLocks = 0;
  let savedOverflow = '';

  let instanceSeq = 0;
  function nextInstanceId(): number {
    return ++instanceSeq;
  }

  function registerLayer(lockScroll: boolean): number {
    const id = ++modalSeq;
    openStack.push(id);
    if (lockScroll && scrollLocks++ === 0 && typeof document !== 'undefined') {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    return id;
  }

  function unregisterLayer(id: number, lockScroll: boolean): void {
    const i = openStack.indexOf(id);
    if (i >= 0) openStack.splice(i, 1);
    if (lockScroll && scrollLocks > 0 && --scrollLocks === 0 && typeof document !== 'undefined') {
      document.body.style.overflow = savedOverflow;
    }
  }

  function isTopLayer(id: number): boolean {
    return openStack[openStack.length - 1] === id;
  }
</script>

<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { untrack } from "svelte";
  import type { Snippet } from "svelte";
  import X from '@lucide/svelte/icons/x';
  import Button from './Button.svelte';
  import { trapTabKey } from './focusTrap';

  let {
    open = $bindable(false),
    title,
    subtitle,
    width = 520,
    maskClosable = false,
    mask: maskProp = 'dark',
    blur = true,
    modeless = false,
    offsetTop,
    bodyPadding = '32px 40px',
    disableClose = false,
    typewriter = false,
    typewriterDuration = 1500,
    okText = '确定',
    cancelText = '取消',
    showOk = true,
    showCancel = true,
    showFooter = true,
    okDisabled = false,
    onClose,
    onCancel,
    onOk,
    class: cls = "",
    style = "",
    children,
    footer,
    headerActions,
  }: {
    open?: boolean;
    title?: string | Snippet;
    subtitle?: string | Snippet;
    width?: number | string;
    maskClosable?: boolean;
    mask?: 'dark' | 'light';
    blur?: boolean;
    modeless?: boolean;
    /** 遮罩顶部留白：遮罩从该位置开始（数字按 px），用于避开标题栏 */
    offsetTop?: number | string;
    /** 内容区内边距，默认 '32px 40px'；列表类弹窗可调小 */
    bodyPadding?: string;
    disableClose?: boolean;
    typewriter?: boolean;
    typewriterDuration?: number;
    okText?: string;
    cancelText?: string;
    showOk?: boolean;
    showCancel?: boolean;
    showFooter?: boolean;
    okDisabled?: boolean;
    onClose?: () => void;
    onCancel?: () => void;
    onOk?: () => void | boolean | Promise<void | boolean>;
    class?: string;
    style?: string;
    children?: Snippet;
    footer?: Snippet;
    /**
     * 标题行右侧的操作（渲染在关闭按钮左边）。
     *
     * 给「列表类弹窗」用：标题旁边直接放「全部清空」「关闭全部」这类针对整份
     * 数据集的动作用，用户不用把视线移到页脚、也不用先关掉弹窗回到原页面。
     * 不给就一像素都不占。
     */
    headerActions?: Snippet;
  } = $props();

  let okBusy = $state(false);

  const uid = nextInstanceId();
  const titleId = `goose-modal-title-${uid}`;

  let bodyEl: HTMLDivElement | null = $state(null);
  let dialogEl: HTMLDivElement | null = $state(null);
  let twHtml = $state('');
  let fullHtml = '';
  let twIndex = 0;
  let twTimer: ReturnType<typeof setTimeout> | null = null;

  /** 当前层在弹层栈里的 id；0 = 未打开。必须是响应式状态：层级（z-index）按它算，
      普通 let 在 effect 里赋值不会触发重渲染，后开的弹窗就永远压不上去。 */
  let layerId = $state(0);
  let lastFocused: HTMLElement | null = null;

  // 打开时登记到弹层栈（非模态不加滚动锁），关闭时摘掉并把焦点还给打开前的元素
  $effect(() => {
    if (!open) return;
    const lockScroll = !modeless;
    const id = registerLayer(lockScroll);
    layerId = id;
    lastFocused = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
    // 等面板真正挂到 DOM 上再抢焦点
    const t = setTimeout(() => dialogEl?.focus?.(), 0);
    return () => {
      clearTimeout(t);
      unregisterLayer(id, lockScroll);
      layerId = 0;
      // 打开它的按钮可能已被移除，focus 前先确认还在文档里
      if (lastFocused?.isConnected) lastFocused.focus();
      lastFocused = null;
    };
  });

  $effect(() => {
    const shouldType = open && typewriter;
    untrack(() => {
      if (shouldType) {
        twTimer = setTimeout(() => startTypewriter(), 0);
      }
    });
    return () => {
      if (twTimer) { clearTimeout(twTimer); twTimer = null; }
    };
  });

  function startTypewriter() {
    if (!bodyEl) return;
    const el = bodyEl.querySelector('.tw-source');
    if (!el) return;
    fullHtml = el.innerHTML;
    twHtml = '';
    twIndex = 0;
    const dur = typewriterDuration;
    const html = fullHtml;

    let totalSteps = 0;
    { let i = 0; while (i < html.length) { totalSteps++; if (html[i] === '<') { const end = html.indexOf('>', i); i = end === -1 ? html.length : end + 1; } else { i++; } } }
    if (totalSteps === 0) totalSteps = 1;

    const delay = Math.max(5, dur / totalSteps);
    function tick() {
      if (twIndex < html.length) {
        const ch = html[twIndex];
        if (ch === '<') {
          const end = html.indexOf('>', twIndex);
          twIndex = end === -1 ? html.length : end + 1;
        } else {
          twIndex++;
        }
        twHtml = html.slice(0, twIndex);
        twTimer = setTimeout(tick, delay);
      }
    }
    tick();
  }

  function doClose() {
    onClose?.();
    open = false;
  }

  function doCancel() {
    onCancel?.();
    doClose();
  }

  async function handleOk() {
    if (okBusy || okDisabled) return;
    okBusy = true;
    try {
      const result = await onOk?.();
      if (result === false) return;
      doClose();
    } catch {
      // 校验/请求失败：保持打开
    } finally {
      okBusy = false;
    }
  }

  function handleMaskClick(e: MouseEvent) {
    if (disableClose) return;
    // 只认遮罩自身：面板内部冒泡上来的点击不关窗。
    // 用 target 判断而不是给面板挂 stopPropagation，少一个无意义的交互处理器。
    if (e.target !== e.currentTarget) return;
    if (maskClosable) doCancel();
  }

  /** Tab 在面板内循环：面板外没有可聚焦元素时把焦点抢回来 */
  function trapTab(e: KeyboardEvent) {
    trapTabKey(e, dialogEl);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open || disableClose) return;
    // 多层弹窗叠加时只有最上面那层响应，否则一次 Esc 会把整摞全关掉
    if (!isTopLayer(layerId)) return;
    if (e.key === "Escape") {
      e.stopPropagation();
      doCancel();
    } else if (e.key === "Tab") {
      trapTab(e);
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <!-- 键盘只由上面的 window 监听统一处理：面板内冒泡上来的 Tab/Esc 也走它，
       若这里再挂一份 onkeydown，同一事件会被处理两次（Tab 会连跳两格） -->
  <div
    class="modal-overlay{maskProp === 'light' ? ' modal-overlay-light' : ''}{blur ? '' : ' modal-no-blur'}{modeless ? ' modal-overlay-modeless' : ''}"
    role="presentation"
    style:top={offsetTop == null ? undefined : typeof offsetTop === 'number' ? `${offsetTop}px` : offsetTop}
    style:z-index={layerId ? `calc(var(--z-overlay) + ${layerId})` : undefined}
    onclick={handleMaskClick}
    transition:fade={{ duration: 150 }}
  >
    <div
      class="modal {cls}"
      style="width: {typeof width === 'number' ? `${width}px` : width}; {style}"
      role="dialog"
      aria-modal={modeless ? undefined : 'true'}
      aria-labelledby={title ? titleId : undefined}
      tabindex="-1"
      bind:this={dialogEl}
      transition:scale={{ duration: 180, start: 0.92 }}
    >
      {#if title || headerActions}
        <div class="modal-header">
          <div class="modal-heading">
            {#if title}
              <span class="modal-title" id={titleId}>
                {#if typeof title === "string"}{@html title}{:else}{@render title()}{/if}
              </span>
            {/if}
            {#if subtitle}
              <span class="modal-subtitle">
                {#if typeof subtitle === "string"}{subtitle}{:else}{@render subtitle()}{/if}
              </span>
            {/if}
          </div>
          {#if headerActions}
            <div class="modal-actions">{@render headerActions()}</div>
          {/if}
          {#if !disableClose}
            <Button
              variant="ghost"
              icon={X}
              iconSize={14}
              class="modal-close"
              ariaLabel="关闭"
              onclick={doCancel}
            />
          {/if}
        </div>
      {/if}
      <div class="modal-body" style:padding={bodyPadding} bind:this={bodyEl}>
        {#if typewriter}
          <div class="tw-source" style="display:none">{@render children?.()}</div>
          <div class="tw-output">{@html twHtml}</div>
        {:else}
          {@render children?.()}
        {/if}
      </div>
      {#if footer}
        <div class="modal-footer">{@render footer()}</div>
      {:else if showFooter && (showCancel || showOk)}
        <div class="modal-footer">
          {#if showCancel}
            <Button variant="default" size="middle" onclick={doCancel}>{cancelText}</Button>
          {/if}
          {#if showOk}
            <Button
              variant="primary"
              size="middle"
              onclick={handleOk}
              disabled={okDisabled}
              loading={okBusy}
              aria-busy={okBusy}
            >{okBusy ? '处理中…' : okText}</Button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* 层级：所有弹窗的基础 z-index 相同，后开的靠 layerId 往上叠一层。
     只靠 DOM 顺序不可靠 —— 全局挂载的 ConfirmDialog / ErrorDialog 写在布局
     前面，而业务弹窗可能在布局里面的任意位置；同 z-index 下先出现在文档里的
     那份会被压住，于是「弹窗里再弹确认框」就点不到确认按钮了。 */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--overlay);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-overlay);
  }
  .modal-overlay-light {
    background-color: var(--overlay-light);
    backdrop-filter: blur(2px);
  }
  .modal-no-blur {
    backdrop-filter: none;
  }
  /* 非模态：去掉遮罩变暗与模糊，遮罩层点击穿透到页面；面板自身恢复接收指针 */
  .modal-overlay-modeless {
    background: none;
    backdrop-filter: none;
    pointer-events: none;
  }
  .modal-overlay-modeless .modal {
    pointer-events: auto;
  }
  .modal {
    background-color: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overscroll-behavior: contain;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--sp-lg) 32px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-strong);
    border-bottom: 1px solid var(--border-strong);
    flex-shrink: 0;
  }
  .modal-heading {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    gap: 2px;
  }
  .modal-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .modal-subtitle {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-muted);
    min-width: 0;
  }
  /* 关闭钮的视觉全交给 Button（ghost + icon-sm = 28×28、hover 提亮、
     焦点环、按压回弹），这里只补 Button 不管的两件事：与右侧操作区的间距、
     以及标题过长时不被压缩。
     Button 是子组件，本组件的 scope class 落不到它身上，所以选择器最后一段
     必须走 :global —— 否则这条规则一条都匹配不上。 */
  .modal :global(.modal-close) {
    margin-left: var(--sp-md);
    flex-shrink: 0;
  }
  /* 标题行操作区：不吃剩余宽度（标题优先占满并省略），也不被压缩。
     header 是 18px/600 的标题排版，按钮自带字号，这里不继承。 */
  .modal-actions {
    display: flex;
    align-items: center;
    gap: var(--sp-sm, 8px);
    flex-shrink: 0;
    margin-left: var(--sp-lg);
    font-size: 14px;
    font-weight: 500;
  }
  /* 传了 headerActions 但这次没有内容（调用方在里面用 if 控制显隐）时，
     整块收掉：否则标题和关闭按钮之间会凭空多出 24px。
     用 :has 而不是 :empty —— 片段里的 {#if} 会留下注释锚点，:empty 永远不成立。 */
  .modal-actions:not(:has(*)) {
    display: none;
  }
  .modal-body {
    padding: 32px 40px;
    min-width: 0;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  .tw-output {
    white-space: pre-wrap;
    line-height: 1.6;
  }
  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-lg);
    padding: var(--sp-lg) 32px;
    flex-shrink: 0;
  }
</style>

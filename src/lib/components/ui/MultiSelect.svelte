<script lang="ts">
  import { tick } from 'svelte';
  import { floatingPosition } from './floatingPosition';
  import { menuIn, menuOut } from './menuTransition';
  import { rowsHeight } from './rowHeight';
  import PillTrack from './PillTrack.svelte';
  import ScrollZones from './ScrollZones.svelte';
  import Check from '@lucide/svelte/icons/check';

  interface Option {
    value: string;
    label: string;
    /** 分组名：连续同名的选项归入同组，组头吸顶 */
    group?: string;
  }

  let {
    items = [],
    values = $bindable([]),
    placeholder = "请选择",
    disabled = false,
    class: cls = '',
    style = '',
  }: {
    items?: Option[];
    values?: string[];
    placeholder?: string;
    disabled?: boolean;
    class?: string;
    style?: string;
  } = $props();

  let open = $state(false);
  let rootEl: HTMLElement;
  let scrollEl = $state<HTMLElement | null>(null);
  let dropdownStyle = $state('');
  let flipUp = $state(false);
  // 键盘活动项：与 Select 一套交互（方向键移动、Enter 切换、Escape 关闭）
  let activeIdx = $state(-1);

  const isGroupHead = (i: number) => {
    const g = items[i]?.group;
    return !!g && (i === 0 || items[i - 1].group !== g);
  };

  function toggle() {
    if (disabled) return;
    if (!open) activeIdx = items.length ? 0 : -1;
    open = !open;
  }

  function closeMenu() {
    open = false;
    activeIdx = -1;
  }

  function onTriggerKeydown(e: KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        toggle();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length) activeIdx = activeIdx < 0 ? 0 : (activeIdx + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length) activeIdx = activeIdx < 0 ? items.length - 1 : (activeIdx - 1 + items.length) % items.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (activeIdx >= 0 && items[activeIdx]) toggleItem(items[activeIdx].value);
    }
  }

  function positionDropdown() {
    if (!rootEl) return;
    const rect = rootEl.getBoundingClientRect();
    // 面板高度 = 前 10 行（组头算一行）的实际高度，不足则自适应；8 为菜单内边距，2 为边框
    const ddh = rowsHeight(items, 8).height + 2;
    const r = floatingPosition(rect, { panelW: Math.max(120, rect.width), panelH: ddh, gap: 4 });
    dropdownStyle = `position: fixed; z-index: var(--z-max); ${r.style}`;
    flipUp = r.flipUp;
  }

  function toggleItem(val: string) {
    const idx = values.indexOf(val);
    if (idx >= 0) {
      values = values.filter((v) => v !== val);
    } else {
      values = [...values, val];
    }
  }

  function removeItem(val: string) {
    values = values.filter((v) => v !== val);
  }

  function labelOf(val: string): string {
    return items.find((i) => i.value === val)?.label ?? val;
  }

  $effect(() => {
    if (!open) return;
    tick().then(positionDropdown);
    // 打开期间跟随页面滚动/缩放：fixed 面板否则会脱离触发器
    const onWin = (e: Event) => {
      if (scrollEl && e.target === scrollEl) return;
      positionDropdown();
    };
    window.addEventListener('scroll', onWin, true);
    window.addEventListener('resize', onWin);
    function onDocDown(e: MouseEvent) {
      if (rootEl && !rootEl.contains(e.target as Node)) {
        open = false;
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => {
      window.removeEventListener('scroll', onWin, true);
      window.removeEventListener('resize', onWin);
      document.removeEventListener("mousedown", onDocDown);
    };
  });

  // 键盘导航须把活动项滚进可视区（手写边界，避免 fixed 面板连带滚页面）
  $effect(() => {
    const idx = activeIdx;
    const el = scrollEl;
    if (!open || idx < 0 || !el) return;
    const item = el.querySelector<HTMLElement>(`.option[data-idx="${idx}"]`);
    if (!item) return;
    const top = item.offsetTop;
    const bottom = top + item.offsetHeight;
    if (top < el.scrollTop) el.scrollTop = top;
    else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight;
  });
</script>

<div class="multi-select {cls}" style={style} bind:this={rootEl}>
  <div
    class="trigger"
    class:open
    class:disabled
    class:empty={values.length === 0}
    onclick={toggle}
    onkeydown={onTriggerKeydown}
    role="button"
    tabindex="0"
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-disabled={disabled}
  >
    <span class="trigger-content">
      {#if values.length === 0}
        <span class="placeholder">{placeholder}</span>
      {:else}
        {#each values as val (val)}
          <span class="badge">
            {labelOf(val)}
            <button
              type="button"
              class="badge-x"
              onclick={(e) => {
                e.stopPropagation();
                removeItem(val);
              }}
              aria-label="移除">&times;</button
            >
          </span>
        {/each}
      {/if}
    </span>
    <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
  </div>
  {#if open}
    <div
      class="menu"
      style={dropdownStyle}
      role="listbox"
      aria-multiselectable="true"
      in:menuIn={{ up: flipUp }}
      out:menuOut={{ up: flipUp }}
    >
      <div class="menu-scroll" bind:this={scrollEl}>
        <!-- 单 pill（只有 hover 这一块）→ 主题色实心；选中项不是 pill，
             而是常驻的勾 + 淡染底，两者不冲突。 -->
        <PillTrack
          container={scrollEl}
          itemSelector=".option:not(.selected)"
          showSelected={false}
          hoverBackground="var(--primary)"
          radius="var(--radius-md)"
        />
        {#each items as item, i (item.value)}
          {#if isGroupHead(i)}
            <div class="ms-group" role="presentation">{item.group}</div>
          {/if}
          <button
            type="button"
            class="option"
            class:selected={values.includes(item.value)}
            class:active={i === activeIdx}
            role="option"
            aria-selected={values.includes(item.value)}
            data-idx={i}
            onclick={() => toggleItem(item.value)}
            onmouseenter={() => (activeIdx = i)}
          >
            <span class="option-check" aria-hidden="true">
              {#if values.includes(item.value)}
                <Check size={14} />
              {/if}
            </span>
            {item.label}
          </button>
        {/each}
      </div>
      <ScrollZones target={scrollEl} />
    </div>
  {/if}
</div>

<style>
  .multi-select { position: relative; display: inline-block; min-width: 200px; }
  .trigger { display: flex; align-items: center; gap: var(--space-2); padding: var(--padding-md); height: var(--height-md); min-width: 140px; max-width: 280px; align-self: stretch; background-color: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--radius-lg); color: var(--text-strong); font-size: var(--font-md); cursor: pointer; transition: border-color 0.2s, background-color 0.2s; }
  .trigger:hover:not(.disabled) { background-color: var(--surface-3); }
  .trigger:focus-visible { border-color: var(--primary); outline: none; }
  .trigger.open { border-color: var(--primary); }
  .trigger.disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
  .trigger-content { flex: 1; display: flex; flex-wrap: wrap; gap: var(--space-1); min-width: 0; }
  .placeholder { color: var(--text-muted); white-space: nowrap; }
  .badge { display: inline-flex; align-items: center; gap: var(--space-0-5); padding: 1px var(--space-1-5); border-radius: var(--radius-sm); background: var(--primary-soft); color: var(--primary); font-size: var(--fs-11); font-weight: 500; white-space: nowrap; line-height: 18px; }
  .badge-x { display: inline-flex; align-items: center; justify-content: center; padding: 0; margin: 0; border: none; background: none; color: inherit; cursor: pointer; font-size: var(--fs-13); line-height: 1; width: 14px; height: 14px; border-radius: 50%; transition: background-color 0.15s; }
  .badge-x:hover { background-color: rgba(0, 0, 0, 0.15); }
  .chevron { color: var(--text-muted); transition: transform 0.2s; flex-shrink: 0; }
  .trigger.open .chevron { transform: rotate(180deg); }
    .menu { position: fixed; display: flex; flex-direction: column; overflow: hidden; padding: var(--sp-sm); background-color: var(--popup-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25); z-index: var(--z-max); }
  /* 唯一滚动体：隐藏滚动条 → 左右内边距一致 */
    /* 内边距在 .menu（面板层）：sticky 组头吸附滚动容器顶边，组头上方面板 padding 带无内容可透出 */
    .menu-scroll { position: relative; flex: 1 1 auto; min-height: 0; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; }
  .menu-scroll::-webkit-scrollbar { display: none; }
  /* 吸顶时轻微磨砂：半透明底 + 弱模糊，滚动经过的选项在组头下若隐若现 */
  .ms-group { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; height: 24px; /* 与选项文字列对齐：选项 padding-left 16 + 勾槽 16 + gap 8 = 40 */ padding: 0 var(--space-10); font-size: var(--fs-12); font-weight: 600; color: color-mix(in srgb, var(--text-muted) 70%, transparent); background-color: color-mix(in srgb, var(--surface) 80%, transparent); backdrop-filter: blur(12px); }
  .option { position: relative; display: flex; align-items: center; gap: var(--space-2); width: 100%; height: var(--height-md); padding: 0 var(--sp-lg); border: none; border-radius: var(--radius-md); background: none; color: var(--text); font-size: var(--fs-13); text-align: left; cursor: pointer; white-space: nowrap; }
  /* 白字必须由「pill 真的压在这一行上」决定，不能由 :hover / .active 决定。
     两个反例都会让整行文字凭空消失（白底白字）：
     · 菜单恰好在静止的指针下展开 —— CSS 的 :hover 立刻为真，pill 却要等
       pointerover 才会落位，这中间是白字压白底；
     · 指针划过某行后移出菜单，或方向键移动落点 —— activeIdx 还留在那一行，
       而 pill 只跟指针（pointerleave 后 opacity:0），同样是有字无色。
     所以上色认 PillTrack 打在行上的 `data-pill-on` 标记（与 DropdownMenu 同一套）。
     属性是运行时写的，Svelte 编译期看不到，属性段包进 :global()，
     作用域由祖先 .menu-scroll 兜住。 */
  .menu-scroll :global(.option[data-pill-on="hover"]:not(.selected)) { color: var(--accent-text); }
  /* 没有指针时的落点（方向键 / 指针刚移出菜单）：补一块与 pill 同色的实底。
     这里不能用中性灰：本组件的指针落点是品牌色实心，键盘落点若变灰，
     同一行在鼠标下和方向键下就是两种控件。与 DropdownMenu 的
     `:focus-visible` 处理一致。

     条件是 `:not(:hover)` 而不是「菜单里没有指针」：指针在列表里时按方向键，
     落点行必须亮起来 —— 否则 Enter 会作用在一行看不出被选中的项上。
     代价是指针行（pill）与键盘行（实底）会同时是蓝的，与 Select / Combobox
     同一种表现；二者本质是「当前项」的两个来源，宁可重影也不隐藏落点。 */
  .option.active:not(.selected):not(:hover) {
    background-color: var(--primary);
    color: var(--accent-text);
  }
  .option.selected { background-color: var(--primary-soft); color: var(--text-strong); font-weight: 500; }
  /* 勾槽常驻 16px：选中渲染勾，未选中留空 → 文字列恒定不跳动 */
  .option-check { display: flex; align-items: center; justify-content: center; width: 16px; flex-shrink: 0; color: var(--primary); }
</style>

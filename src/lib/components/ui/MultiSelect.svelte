<script lang="ts">
  import { tick } from 'svelte';
  import { floatingPosition } from './floatingPosition';
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

  const isGroupHead = (i: number) => {
    const g = items[i]?.group;
    return !!g && (i === 0 || items[i - 1].group !== g);
  };

  function toggle() {
    if (disabled) return;
    open = !open;
  }

  function positionDropdown() {
    if (!rootEl) return;
    const rect = rootEl.getBoundingClientRect();
    // 面板高度 = 前 10 行（组头算一行）的实际高度，不足则自适应；8 为菜单内边距，2 为边框
    const ddh = rowsHeight(items, 8).height + 2;
    const r = floatingPosition(rect, { panelW: Math.max(120, rect.width), panelH: ddh, gap: 4 });
    dropdownStyle = `position: fixed; z-index: var(--z-max); ${r.style}`;
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
</script>

<div class="multi-select {cls}" style={style} bind:this={rootEl}>
  <div
    class="trigger"
    class:open
    class:disabled
    class:empty={values.length === 0}
    onclick={toggle}
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    }}
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
    <div class="menu" style={dropdownStyle} role="listbox" aria-multiselectable="true">
      <div class="menu-scroll" bind:this={scrollEl}>
        <PillTrack
          container={scrollEl}
          itemSelector=".option:not(.selected)"
          showSelected={false}
          hoverBackground="color-mix(in srgb, var(--primary) 15%, transparent)"
          radius="var(--radius-md)"
        />
        {#each items as item, i (item.value)}
          {#if isGroupHead(i)}
            <div class="ms-group" role="presentation">{item.group}</div>
          {/if}
          <button type="button" class="option" class:selected={values.includes(item.value)} role="option" aria-selected={values.includes(item.value)} onclick={() => toggleItem(item.value)}>
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
  .trigger { display: flex; align-items: center; gap: 8px; padding: var(--padding-md); height: var(--height-md); min-width: 140px; max-width: 280px; align-self: stretch; background-color: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--radius-lg); color: var(--text-strong); font-size: var(--font-md); cursor: pointer; transition: border-color 0.2s, background-color 0.2s; }
  .trigger:hover:not(.disabled) { background-color: var(--surface-3); }
  .trigger:focus-visible { border-color: var(--primary); outline: none; }
  .trigger.open { border-color: var(--primary); }
  .trigger.disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
  .trigger-content { flex: 1; display: flex; flex-wrap: wrap; gap: 4px; min-width: 0; }
  .placeholder { color: var(--text-muted); white-space: nowrap; }
  .badge { display: inline-flex; align-items: center; gap: 2px; padding: 1px 6px; border-radius: 4px; background: var(--primary-soft); color: var(--primary); font-size: 11px; font-weight: 500; white-space: nowrap; line-height: 18px; }
  .badge-x { display: inline-flex; align-items: center; justify-content: center; padding: 0; margin: 0; border: none; background: none; color: inherit; cursor: pointer; font-size: 13px; line-height: 1; width: 14px; height: 14px; border-radius: 50%; transition: background-color 0.15s; }
  .badge-x:hover { background-color: rgba(0, 0, 0, 0.15); }
  .chevron { color: var(--text-muted); transition: transform 0.2s; flex-shrink: 0; }
  .trigger.open .chevron { transform: rotate(180deg); }
    .menu { position: fixed; display: flex; flex-direction: column; overflow: hidden; padding: var(--sp-sm); background-color: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25); z-index: var(--z-max); }
  /* 唯一滚动体：隐藏滚动条 → 左右内边距一致 */
    /* 内边距在 .menu（面板层）：sticky 组头吸附滚动容器顶边，组头上方面板 padding 带无内容可透出 */
    .menu-scroll { position: relative; flex: 1 1 auto; min-height: 0; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; }
  .menu-scroll::-webkit-scrollbar { display: none; }
  .ms-group { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; height: 24px; /* 与选项文字列对齐：选项 padding-left 16 + 勾槽 16 + gap 8 = 40 */ padding: 0 40px; font-size: 12px; font-weight: 600; color: color-mix(in srgb, var(--text-muted) 70%, transparent); background-color: var(--surface); }
  .option { position: relative; display: flex; align-items: center; gap: 8px; width: 100%; height: var(--height-md); padding: 0 var(--sp-lg); border: none; border-radius: var(--radius-md); background: none; color: var(--text); font-size: 13px; text-align: left; cursor: pointer; white-space: nowrap; }
  .option:hover { color: var(--text-strong); }
  .option.selected { background-color: var(--primary-soft); color: var(--text-strong); font-weight: 500; }
  /* 勾槽常驻 16px：选中渲染勾，未选中留空 → 文字列恒定不跳动 */
  .option-check { display: flex; align-items: center; justify-content: center; width: 16px; flex-shrink: 0; color: var(--primary); }
</style>

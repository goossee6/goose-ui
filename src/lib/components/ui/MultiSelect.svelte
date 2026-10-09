<script lang="ts">
  import { tick } from 'svelte';
  import { floatingPosition } from './floatingPosition';
  import PillTrack from './PillTrack.svelte';

  interface Option {
    value: string;
    label: string;
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
  let menuEl = $state<HTMLElement | null>(null);
  let dropdownStyle = $state('');

  function toggle() {
    if (disabled) return;
    open = !open;
    if (open) tick().then(positionDropdown);
  }

  function positionDropdown() {
    if (!rootEl) return;
    const rect = rootEl.getBoundingClientRect();
    const ddh = Math.min(items.length * 36 + 8, 260);
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
    function onDocDown(e: MouseEvent) {
      if (rootEl && !rootEl.contains(e.target as Node)) {
        open = false;
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
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
    <div class="menu" style={dropdownStyle} role="listbox" aria-multiselectable="true" bind:this={menuEl}>
      <PillTrack
        container={menuEl}
        itemSelector=".option:not(.selected)"
        showSelected={false}
        hoverBackground="color-mix(in srgb, var(--primary) 15%, transparent)"
        radius="var(--radius-md)"
      />
      {#each items as item (item.value)}
        <button type="button" class="option" class:selected={values.includes(item.value)} role="option" aria-selected={values.includes(item.value)} onclick={() => toggleItem(item.value)}>
          <input type="checkbox" class="option-check" checked={values.includes(item.value)} tabindex="-1" />
          {item.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .multi-select { position: relative; display: inline-block; min-width: 200px; }
  .trigger { display: flex; align-items: center; gap: 8px; padding: var(--ui-md-padding); height: var(--ui-md-height); min-width: 140px; max-width: 280px; align-self: stretch; background-color: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--radius-lg); color: var(--text-strong); font-size: var(--ui-md-font); cursor: pointer; transition: border-color 0.2s, background-color 0.2s; }
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
  .menu { position: fixed; overflow-y: auto; background-color: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25); padding: var(--sp-xs); z-index: var(--z-max); }
  .option { position: relative; display: flex; align-items: center; gap: 8px; width: 100%; padding: var(--sp-md) var(--sp-xl); border: none; border-radius: var(--radius-md); background: none; color: var(--text); font-size: 13px; text-align: left; cursor: pointer; white-space: nowrap; }
  .option:hover { color: var(--text-strong); }
  .option.selected { background-color: var(--primary-soft); color: var(--primary); }
  .option-check { width: auto; margin: 0; accent-color: var(--primary); pointer-events: none; }
</style>

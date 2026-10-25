<script lang="ts">
  import { fade } from "svelte/transition";
  import Icon from "../ui/Icon.svelte";
  import { menuStore } from "../contextMenuStore.svelte.js";
  import { getMenu, openMenuAt, closeMenu, dispatchMenuAction, decodeBase64, type MenuItemDef } from "../contextMenu";
  import PillTrack from "../ui/PillTrack.svelte";

  let menuEl = $state<HTMLElement | null>(null);
  let pos = $state({ left: 0, top: 0 });
  let activeIdx = $state(-1);

  const items = $derived(getMenu(menuStore.name) ?? []);

  function decodeData(raw: string | null): Record<string, string> {
    if (!raw) return {};
    try { return JSON.parse(decodeBase64(raw)); }
    catch { return { copy: raw }; }
  }

  function onContextMenu(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const el = target.closest?.("[data-menu-name]") as HTMLElement | null;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    const name = el.getAttribute("data-menu-name") || "";
    const data = decodeData(el.getAttribute("data-menu-data"));
    if (menuStore.visible && menuStore.name === name && pos.left === e.clientX && pos.top === e.clientY) return;
    activeIdx = -1;
    openMenuAt(e.clientX, e.clientY, name, data);
  }

  async function pick(item: MenuItemDef) {
    const { name, data } = menuStore;
    closeMenu();
    dispatchMenuAction({ menu: name, action: item.id, data });
  }

  /** 可聚焦项（分隔线与禁用项跳过）。 */
  function enabledIndices(): number[] {
    return items
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => !it.separator && !it.disabled)
      .map(({ i }) => i);
  }

  function focusIndex(i: number) {
    activeIdx = i;
    menuEl?.querySelector<HTMLElement>(`.ctxmenu-item[data-idx="${i}"]`)?.focus();
  }

  function focusStep(dir: 1 | -1) {
    const ids = enabledIndices();
    if (!ids.length) return;
    const at = ids.indexOf(activeIdx);
    const next = at < 0 ? (dir > 0 ? ids[0] : ids[ids.length - 1]) : ids[(at + dir + ids.length) % ids.length];
    focusIndex(next);
  }

  function focusEdge(last: boolean) {
    const ids = enabledIndices();
    if (ids.length) focusIndex(last ? ids[ids.length - 1] : ids[0]);
  }

  function onMenuKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusStep(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusStep(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusEdge(false);
    } else if (e.key === "End") {
      e.preventDefault();
      focusEdge(true);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      closeMenu();
    } else if (e.key === "Tab") {
      closeMenu();
    }
  }

  $effect(() => {
    if (!menuStore.visible) return;
    function onDocDown(e: MouseEvent) { if (menuEl && !menuEl.contains(e.target as Node)) closeMenu(); }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); closeMenu(); }
    }
    document.addEventListener("mousedown", onDocDown);
    // capture 拦截 Esc，避免冒泡触发外层 Modal 关闭
    document.addEventListener("keydown", onKey, true);
    return () => { document.removeEventListener("mousedown", onDocDown); document.removeEventListener("keydown", onKey, true); };
  });

  // 打开后聚焦首项（键盘可立即用方向键）
  $effect(() => {
    if (!menuStore.visible || !menuEl) return;
    if (activeIdx === -1) {
      requestAnimationFrame(() => {
        if (menuEl) focusEdge(false);
      });
    }
  });

  $effect(() => {
    if (!menuStore.visible || !menuEl) return;
    const r = menuEl.getBoundingClientRect();
    const vw = window.innerWidth; const vh = window.innerHeight;
    pos.left = menuStore.x + r.width > vw - 8 ? Math.max(8, vw - r.width - 8) : menuStore.x;
    pos.top = menuStore.y + r.height > vh - 8 ? Math.max(8, vh - r.height - 8) : menuStore.y;
  });
</script>

<svelte:window oncontextmenu={onContextMenu} />

{#if menuStore.visible}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="ctxmenu" style="left: {pos.left}px; top: {pos.top}px" transition:fade={{ duration: 90 }} bind:this={menuEl} role="menu" tabindex="-1" onkeydown={onMenuKeydown}>
    <PillTrack
      container={menuEl}
      itemSelector=".ctxmenu-item"
      showSelected={false}
      hoverBackground="color-mix(in srgb, var(--primary) 15%, transparent)"
      radius="var(--radius-md)"
    />
    {#each items as item, i (i)}
      {#if item.separator}
        <div class="ctxmenu-separator" role="separator"></div>
      {:else}
        <button
          type="button"
          class="ctxmenu-item"
          role="menuitem"
          data-idx={i}
          tabindex={activeIdx === i ? 0 : -1}
          disabled={item.disabled}
          onfocus={() => (activeIdx = i)}
          onclick={() => pick(item)}>
          {#if item.icon}<Icon icon={item.icon} size={14} class="ctxmenu-item-icon" />{/if}
          {item.label}
        </button>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .ctxmenu { position: fixed; z-index: var(--z-dialog); min-width: 180px; padding: var(--sp-sm); background-color: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--radius-lg); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); }
  .ctxmenu-item { position: relative; display: flex; align-items: center; gap: 8px; width: 100%; padding: var(--sp-lg) var(--sp-lg); border: none; border-radius: var(--radius-md); background: none; color: var(--text); font-size: 13px; text-align: left; cursor: pointer; white-space: nowrap; }
  .ctxmenu-item:hover { color: var(--text-strong); }
  .ctxmenu-item :global(.ctxmenu-item-icon) { color: var(--text-muted); flex-shrink: 0; }
  .ctxmenu-item:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
  .ctxmenu-item:disabled { color: var(--text-muted); cursor: default; opacity: 0.6; }
  .ctxmenu-separator { height: 1px; margin: var(--sp-sm) var(--sp-md); background: var(--border); }
</style>

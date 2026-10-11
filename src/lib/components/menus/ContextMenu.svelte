<script lang="ts">
  import { fade } from "svelte/transition";
  import Icon from "../ui/Icon.svelte";
  import { menuStore } from "../contextMenuStore.svelte.js";
  import { getMenu, openMenuAt, closeMenu, dispatchMenuAction, decodeBase64, type MenuItemDef } from "../contextMenu";
  import PillTrack from "../ui/PillTrack.svelte";

  let menuEl = $state<HTMLElement | null>(null);
  let pos = $state({ left: 0, top: 0 });

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
    openMenuAt(e.clientX, e.clientY, name, data);
  }

  async function pick(item: MenuItemDef) {
    const { name, data } = menuStore;
    closeMenu();
    dispatchMenuAction({ menu: name, action: item.id, data });
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
  <div class="ctxmenu" style="left: {pos.left}px; top: {pos.top}px" transition:fade={{ duration: 90 }} bind:this={menuEl} role="menu">
    <PillTrack
      container={menuEl}
      itemSelector=".ctxmenu-item"
      showSelected={false}
      hoverBackground="color-mix(in srgb, var(--primary) 15%, transparent)"
      radius="var(--radius-md)"
    />
    {#each items as item (item.id)}
      <button type="button" class="ctxmenu-item" role="menuitem" onclick={() => pick(item)}>
        {#if item.icon}<Icon icon={item.icon} size={14} class="ctxmenu-item-icon" />{/if}
        {item.label}
      </button>
    {/each}
  </div>
{/if}

<style>
  .ctxmenu { position: fixed; z-index: var(--z-dialog); min-width: 180px; padding: var(--sp-sm); background-color: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--radius-lg); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); }
  .ctxmenu-item { position: relative; display: flex; align-items: center; gap: 8px; width: 100%; padding: var(--sp-lg) var(--sp-lg); border: none; border-radius: var(--radius-md); background: none; color: var(--text); font-size: 13px; text-align: left; cursor: pointer; white-space: nowrap; }
  .ctxmenu-item:hover { color: var(--text-strong); }
  .ctxmenu-item :global(.ctxmenu-item-icon) { color: var(--text-muted); flex-shrink: 0; }
  .ctxmenu-item:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
</style>

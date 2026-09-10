<script lang="ts">
  import { fade } from "svelte/transition";
  import Icon from "../ui/Icon.svelte";
  import { menuStore } from "../contextMenuStore.svelte.ts";
  import { getMenu, openMenuAt, closeMenu, dispatchMenuAction, decodeBase64, type MenuItemDef } from "../contextMenu.ts";
  import { showToast } from "../toast.ts";

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
    if (!el) { closeMenu(); return; }
    e.preventDefault();
    const name = el.getAttribute("data-menu-name") || "";
    const data = decodeData(el.getAttribute("data-menu-data"));
    if (menuStore.visible && menuStore.name === name && pos.left === e.clientX && pos.top === e.clientY) return;
    openMenuAt(e.clientX, e.clientY, name, data);
  }

  function pick(item: MenuItemDef) {
    const { name, data } = menuStore;
    closeMenu();
    if (item.builtin === "copy") {
      const text = data.copy ?? "";
      if (!text) { showToast("复制失败", "error"); return; }
      navigator.clipboard.writeText(text).then(
        () => showToast("已复制", "success"),
        () => showToast("复制失败", "error")
      );
      return;
    }
    dispatchMenuAction({ menu: name, action: item.id, data });
  }

  $effect(() => {
    if (!menuStore.visible) return;
    function onDocDown(e: MouseEvent) { if (menuEl && !menuEl.contains(e.target as Node)) closeMenu(); }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeMenu(); }
    document.addEventListener("mousedown", onDocDown);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDocDown); window.removeEventListener("keydown", onKey); };
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
    {#each items as item (item.id)}
      <button type="button" class="ctxmenu-item" role="menuitem" onclick={() => pick(item)}>
        {#if item.icon}<Icon name={item.icon} size={14} class="ctxmenu-item-icon" />{/if}
        {item.label}
      </button>
    {/each}
  </div>
{/if}

<style>
  .ctxmenu { position: fixed; z-index: 2000; min-width: 180px; padding: var(--sp-xs); background-color: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--radius-lg); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); }
  .ctxmenu-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: var(--sp-md) var(--sp-xl); border: none; border-radius: var(--radius-md); background: none; color: var(--text); font-size: 13px; text-align: left; cursor: pointer; white-space: nowrap; }
  .ctxmenu-item :global(.ctxmenu-item-icon) { color: var(--text-muted); flex-shrink: 0; }
  .ctxmenu-item:hover { background-color: var(--hover); color: var(--text-strong); }
  .ctxmenu-item:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
</style>

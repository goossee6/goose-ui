<script lang="ts">
  import { menuIn, menuOut } from "../ui/menuTransition";
  import Icon from "../ui/Icon.svelte";
  import { menuStore } from "../contextMenuStore.svelte.js";
  import { getMenu, openMenuAt, closeMenu, dispatchMenuAction, decodeBase64, type MenuItemDef } from "../contextMenu";
  import PillTrack from "../ui/PillTrack.svelte";
  import { createLayerId, isInsideLayer, layerOwnerOf, registerLayer, unregisterLayer } from "../ui/overlayLayer";

  let menuEl = $state<HTMLElement | null>(null);
  let pos = $state({ left: 0, top: 0 });
  let activeIdx = $state(-1);

  /**
   * 浮层身份。菜单本身挂在根节点（不在任何触发器的 DOM 子树里），
   * 所以「谁弹出的我」只能在右键那一刻记下来 —— 之后再问就追不到祖先链了。
   * 见 overlayLayer.ts：Popover / DropdownMenu 里右键时，父层要能认出这是它的子面板。
   */
  const layerId = createLayerId('ctxmenu');
  let ownerLayer = $state<string | null>(null);

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
    // 落点还在原处，祖先链没断：此时记下「我在哪一层里弹出来的」
    ownerLayer = layerOwnerOf(el);
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
    function onDocDown(e: MouseEvent) {
      if (isInsideLayer(e.target, layerId, [menuEl])) return;
      closeMenu();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); closeMenu(); }
    }
    document.addEventListener("mousedown", onDocDown);
    // capture 拦截 Esc，避免冒泡触发外层 Modal 关闭
    document.addEventListener("keydown", onKey, true);
    return () => { document.removeEventListener("mousedown", onDocDown); document.removeEventListener("keydown", onKey, true); };
  });

  /** 面板挂载即登记浮层；卸载（换菜单 / 关闭）时摘掉，免得层链里留下死节点。 */
  $effect(() => {
    const el = menuEl;
    // 依赖 ownerLayer：同一个面板元素连续服务两次右键时，父层可能不同（换了个宿主）
    const owner = ownerLayer;
    if (!el) return;
    el.dataset.overlayLayer = layerId;
    registerLayer(layerId, owner);
    return () => {
      unregisterLayer(layerId);
      delete el.dataset.overlayLayer;
    };
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
    // 用 offsetWidth/offsetHeight 而不是 getBoundingClientRect：
    // 进场动画正在缩放这块面板（0.96 → 1），rect 量到的是缩小后的尺寸，
    // 贴右边/下边时会少算几个像素，钳位后仍然溢出视口。
    const w = menuEl.offsetWidth; const h = menuEl.offsetHeight;
    const vw = window.innerWidth; const vh = window.innerHeight;
    pos.left = menuStore.x + w > vw - 8 ? Math.max(8, vw - w - 8) : menuStore.x;
    pos.top = menuStore.y + h > vh - 8 ? Math.max(8, vh - h - 8) : menuStore.y;
  });
</script>

<svelte:window oncontextmenu={onContextMenu} />

{#if menuStore.visible}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="ctxmenu"
    style="left: {pos.left}px; top: {pos.top}px"
    in:menuIn
    out:menuOut
    bind:this={menuEl}
    role="menu"
    tabindex="-1"
    onkeydown={onMenuKeydown}>
    <!-- 单 pill：右键菜单没有常驻选中，落点就是当前项 → 主题色实心 -->
    <PillTrack
      container={menuEl}
      itemSelector=".ctxmenu-item"
      showSelected={false}
      hoverBackground="var(--primary)"
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
  .ctxmenu { position: fixed; z-index: var(--z-dialog); min-width: 180px; padding: var(--sp-sm); background-color: var(--popup-surface); border: 1px solid var(--border-strong); border-radius: var(--radius-lg); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); }
  .ctxmenu-item { position: relative; display: flex; align-items: center; gap: var(--space-2); width: 100%; padding: var(--sp-lg) var(--sp-lg); border: none; border-radius: var(--radius-md); background: none; color: var(--text); font-size: var(--fs-13); text-align: left; cursor: pointer; white-space: nowrap; }
  /* pill 用品牌色实心 → 文字与图标一起转白，深字压在品牌色上读不清。
     依据是 PillTrack 打的 `data-pill-on`，不是 `:hover`：指针落在项间缝隙/面板内边距里时
     pill 仍按就近归属停在这一行，`:hover` 却已经是 false，转不转白必须跟 pill 走。
     行选择器包 :global() 是因为该属性由运行时写入，静态分析会误判为未使用（同 DropdownMenu）。 */
  .ctxmenu :global(.ctxmenu-item[data-pill-on='hover']:not(:disabled)) { color: var(--accent-text); }
  .ctxmenu :global(.ctxmenu-item[data-pill-on='hover']:not(:disabled) .ctxmenu-item-icon) { color: var(--accent-text); }
  .ctxmenu-item :global(.ctxmenu-item-icon) { color: var(--text-muted); flex-shrink: 0; }
  .ctxmenu-item:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
  .ctxmenu-item:disabled { color: var(--text-muted); cursor: default; opacity: 0.6; }
  .ctxmenu-separator { height: 1px; margin: var(--sp-sm) var(--sp-md); background: var(--border); }
</style>

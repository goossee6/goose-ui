<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import Triangle from "@lucide/svelte/icons/triangle";
  import { cellMenuAttrs } from "../contextMenu";
  import type { Column } from "../tableTypes";
  import Icon from "./Icon.svelte";
  import { sorted, toggleSort, type SortState } from "../sorting";

  interface Part {
    text: string;
    hit: boolean;
  }

  function highlightParts(text: string, kw: string): Part[] {
    const k = kw.trim();
    if (!k) return [{ text, hit: false }];
    try {
      const regex = new RegExp(k, "gi");
      const parts: Part[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ text: text.slice(lastIndex, match.index), hit: false });
        }
        parts.push({ text: match[0], hit: true });
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) {
        parts.push({ text: text.slice(lastIndex), hit: false });
      }
      return parts.length ? parts : [{ text, hit: false }];
    } catch {
      return [{ text, hit: false }];
    }
  }

  let {
    rows,
    columns,
    menu,
    highlight = "",
    contextMenu = true,
    loading = false,
    emptyText = "暂无数据",
    disabled,
    actions,
    cell,
  }: {
    rows: T[];
    columns: Column<T>[];
    menu?: string;
    highlight?: string;
    contextMenu?: boolean;
    loading?: boolean;
    emptyText?: string;
    disabled?: (row: T) => boolean;
    actions?: Snippet<[T]>;
    cell?: Snippet<[string, T]>;
  } = $props();

  let sortState = $state<SortState | null>(null);
  const displayRows = $derived.by(() => {
    const s = sortState;
    if (!s) return rows;
    const col = columns.find((c) => c.id === s.key);
    if (!col || !(col.sortable ?? true)) return rows;
    return sorted(rows, s, (row) => sortValue(col, row));
  });

  function sortValue(col: Column<T>, row: T): unknown {
    return col.sortAccessor ? col.sortAccessor(row) : renderText(col, row);
  }

  function colSortable(col: Column<T>): boolean {
    return col.sortable ?? true;
  }

  function ariaSort(col: Column<T>): "ascending" | "descending" | undefined {
    if (sortState?.key !== col.id) return undefined;
    return sortState.dir === "asc" ? "ascending" : "descending";
  }

  function renderText(col: Column<T>, row: T): string {
    return col.render(row);
  }

  function cellAttrs(col: Column<T>, row: T): Record<string, string> {
    if (!contextMenu) return {};
    const m = col.menu ?? menu;
    if (!m) return {};
    const data: Record<string, string> = { copy: renderText(col, row) };
    return cellMenuAttrs(m, data);
  }
</script>

<div class="table-container">
  {#if loading}
    <div class="placeholder">加载中…</div>
  {:else if rows.length === 0}
    <div class="placeholder">{emptyText}</div>
  {:else}
    <table>
      <thead>
        <tr>
          {#each columns as col (col.id)}
            <th class:right={col.align === "right"} class:center={col.align === "center"} aria-sort={ariaSort(col)}>
              {#if colSortable(col)}
                <button class="sort-btn" class:active={sortState?.key === col.id} onclick={() => (sortState = toggleSort(sortState, col.id))}>
                  {col.header}
                  <Icon icon={Triangle} size={14} class={sortState?.key === col.id && sortState.dir === "desc" ? "sort-flip" : ""} />
                </button>
              {:else}
                {col.header}
              {/if}
            </th>
          {/each}
          {#if actions}
            <th class="right">操作</th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each displayRows as row, i (i)}
          <tr class:disabled={disabled?.(row)}>
            {#each columns as col (col.id)}
              <td class:mono={col.mono} class:right={col.align === "right"} class:center={col.align === "center"} {...cellAttrs(col, row)}>
                {#if col.custom && cell}
                  {@render cell(col.id, row)}
                {:else if highlight.trim()}
                  {#each highlightParts(renderText(col, row), highlight) as p, hi (col.id + "-" + p.text + "-" + hi)}
                    {#if p.hit}<mark>{p.text}</mark>{:else}{p.text}{/if}
                  {/each}
                {:else}
                  {renderText(col, row)}
                {/if}
              </td>
            {/each}
            {#if actions}
              <td class="actions-cell">
                <div class="actions">
                  {@render actions(row)}
                </div>
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .table-container { width: 100%; height: 100%; overflow: auto; }
  .placeholder { padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { position: sticky; top: 0; z-index: 1; background-color: var(--surface-2); color: var(--text-muted); font-weight: 500; text-align: left; padding: var(--sp-xl) var(--sp-2xl); border-bottom: 2px solid var(--border-strong); white-space: nowrap; }
  th.right { text-align: right; }
  th.center { text-align: center; }
  .sort-btn { display: inline-flex; align-items: center; gap: 4px; padding: 0; background: none; border: none; cursor: pointer; font: inherit; color: inherit; white-space: nowrap; }
  .sort-btn :global(svg) { color: var(--text-muted); opacity: 1; transition: color 0.15s; }
  .sort-btn:hover :global(svg) { color: var(--text-strong); }
  .sort-btn.active :global(svg) { color: var(--primary); }
  .sort-btn :global(.sort-flip) { transform: rotate(180deg); }
  td { padding: var(--sp-xl) var(--sp-2xl); border-bottom: 1px solid var(--border); color: var(--text); background-color: var(--surface); transition: background-color 0.15s; }
  td.right { text-align: right; }
  td.center { text-align: center; }
  tr:hover td { background-color: var(--surface-3); }
  tbody tr:last-child td { border-bottom: none; }
  tr.disabled td { opacity: 0.5; }
  .mono { font-family: var(--font-mono); font-size: 14px; font-variant-numeric: tabular-nums; word-break: break-all; }
  .actions-cell { white-space: nowrap; width: 1%; }
  .actions { display: flex; align-items: center; justify-content: flex-end; gap: var(--gap-md); }
  mark { background-color: rgba(255, 213, 0, 0.45); color: inherit; padding: 0 1px; border-radius: 2px; }
</style>

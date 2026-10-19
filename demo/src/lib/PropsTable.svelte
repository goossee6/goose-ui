<script lang="ts" module>
  export interface PropsTableItem {
    name: string;
    desc: string;
    type: string;
    default?: string;
  }
</script>

<script lang="ts">
  let {
    items,
    anchor = '',
    anchorTitle = 'Props'
  }: {
    items: PropsTableItem[];
    /**
     * 把「属性表」这一节注册为页内目录的锚点（用法同 CodePreview 的 anchor）。
     *
     * 传了 id：表格外面套一层 `<section id=… data-toc-title=…>` 供 toc.ts 摘取。
     * 输出 section 而不是 h2 —— demo 页面刻意不出现标题元素（节标题由
     * CodePreview / PropsTable 自己承担），目录文字走 data-toc-title 属性。
     *
     * 不传：保持原样，只是一个表格。
     */
    anchor?: string;
    /** 目录里的条目文字，默认「Props」 */
    anchorTitle?: string;
  } = $props();
</script>

{#snippet table()}
  <table class="props-table">
    <thead>
      <tr>
        <th>属性</th>
        <th>说明</th>
        <th>类型</th>
        <th>默认值</th>
      </tr>
    </thead>
    <tbody>
      {#each items as item (item.name)}
        <tr>
          <td class="prop-name">{item.name}</td>
          <td class="prop-desc">{item.desc}</td>
          <td class="prop-type">{item.type}</td>
          <td class="prop-default">{item.default ?? '—'}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/snippet}

{#if anchor}
  <section id={anchor} data-toc-title={anchorTitle}>
    {@render table()}
  </section>
{:else}
  {@render table()}
{/if}

<style>
  /* 宽度不在这里限死：PropsTable 通常被 <Card> 包着，只收窄表格会让外层
     Card 依旧铺满整行（看起来像「卡片是全宽的」）。封顶统一放在 Card 上，
     见 App.svelte 里 .card:has(.props-table) 那条全局规则。 */
  .props-table {
    width: 100%;
    table-layout: auto;
    border-collapse: collapse;
    font-size: 13px;
  }
  .props-table th,
  .props-table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
    text-align: left;
  }
  .props-table th:first-child,
  .props-table td:first-child {
    padding-left: 0;
  }
  .props-table th:last-child,
  .props-table td:last-child {
    padding-right: 0;
  }
  .props-table tbody tr:last-child td {
    border-bottom: none;
  }
  .props-table th {
    font-weight: 600;
    color: var(--text-strong);
    border-bottom-width: 2px;
    white-space: nowrap;
  }
  .prop-name {
    white-space: nowrap;
    font-weight: 600;
    color: var(--text-strong);
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .prop-desc {
    color: var(--text-muted);
    line-height: 1.6;
    min-width: 14em;
  }
  .prop-type {
    color: var(--primary);
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.6;
    max-width: 30em;
    overflow-wrap: anywhere;
  }
  .prop-default {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 12px;
    white-space: nowrap;
  }
</style>

<script lang="ts" module>
  export interface PropsTableItem {
    name: string;
    desc: string;
    type: string;
    default?: string;
  }
</script>

<script lang="ts">
  let { items }: { items: PropsTableItem[] } = $props();
</script>

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

<style>
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

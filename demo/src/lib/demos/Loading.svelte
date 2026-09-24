<script lang="ts">
  import { Card, PageHeader, Loading } from 'goose-ui';
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const loadingProps: PropsTableItem[] = [
    { name: "size", desc: "尺寸(px)", type: "number", default: "30" },
    { name: "src", desc: "自定义图片地址，为空时使用默认图", type: "string", default: "''" },
  ];
</script>

<PageHeader title="加载 Loading" description="加载动画指示器" />

<div class="demo-grid">
  <Card title="加载动画 Loading">
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="demo-row">
        <Loading size={20} src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50'%3E%3Cpath fill='%236366f1' d='M25 5a20 20 0 1 0 20 20h-5a15 15 0 1 1-15-15z'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 25 25' to='360 25 25' dur='1s' repeatCount='indefinite'/%3E%3C/path%3E%3C/svg%3E" />
        <span style="font-size:13px;color:var(--text-muted)">加载中…</span>
      </div>
    </div>
  </Card>
  <Card title="Props">
    <PropsTable items={loadingProps} />
  </Card>
</div>

<style>
  .demo-grid { display: flex; flex-direction: column; gap: var(--gap-2xl); }
  .demo-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--gap-md);
  }
</style>

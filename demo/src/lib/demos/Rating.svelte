<script lang="ts">
  import {Card, Page, Rating, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "value", desc: "当前分值（双向绑定）", type: "number", default: "0" },
    { name: "max", desc: "星数", type: "number", default: "5" },
    { name: "size", desc: "尺寸档", type: "'small' | 'middle' | 'large'", default: "'middle'" },
    { name: "readonly", desc: "只读展示", type: "boolean", default: "false" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "allowHalf", desc: "允许半星", type: "boolean", default: "false" },
    { name: "onchange", desc: "变更回调", type: "(value: number) => void", default: "—" },
  ];

  let basic = $state(3.5);
  let half = $state(2.5);
</script>

<Page title="Rating 评分" description="星级评分，支持半星、只读与键盘操作">
  <Card title="基础用法">
    <div style="display:flex;flex-direction:column;gap:16px">
      <Row>
        <Rating bind:value={basic} allowHalf onchange={(v) => (basic = v)} />
        <span class="rating-val">{basic} / 5</span>
      </Row>
      <Row>
        <span class="rating-label">半星：</span>
        <Rating bind:value={half} allowHalf />
        <span class="rating-val">{half}</span>
      </Row>
      <Row>
        <span class="rating-label">只读：</span>
        <Rating value={4} readonly />
        <span class="rating-label">禁用：</span>
        <Rating value={2} disabled />
      </Row>
      <Row>
        <span class="rating-label">小：</span>
        <Rating size="small" value={3} readonly />
        <span class="rating-label">大：</span>
        <Rating size="large" value={4} readonly />
        <span class="rating-label">10 星：</span>
        <Rating max={10} value={7} readonly />
      </Row>
    </div>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .rating-val { font-family: var(--font-mono); font-size: 13px; color: var(--text-muted); }
  .rating-label { font-size: 13px; color: var(--text-muted); }
</style>

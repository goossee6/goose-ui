<script lang="ts">
  import { Card, Page, Rating, Row } from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "value", desc: "当前分值（双向绑定）", type: "number", default: "0" },
    { name: "max", desc: "星数", type: "number", default: "5" },
    { name: "size", desc: "尺寸档", type: "'small' | 'middle' | 'large'", default: "'middle'" },
    { name: "readonly", desc: "只读展示", type: "boolean", default: "false" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "allowHalf", desc: "允许半星", type: "boolean", default: "false" },
    { name: "onchange", desc: "变更回调", type: "(value: number) => void", default: "—" },
  ];

  let basic = $state(4);
  let half = $state(2.5);
  let smallV = $state(3);
  let largeV = $state(4);
  let tenV = $state(7);

  const basicSource = `<script lang="ts">
  import { Rating } from "goose-ui";

  let basic = $state(4);
  let half = $state(2.5);
<\/script>

<!-- 基础：双向绑定 -->
<Rating bind:value={basic} />

<!-- 半星 -->
<Rating bind:value={half} allowHalf />

<!-- 只读 / 禁用 -->
<Rating value={4} readonly />
<Rating value={2} disabled />

<!-- 尺寸与星数 -->
<Rating size="small" bind:value={basic} />
<Rating size="large" bind:value={basic} />
<Rating max={10} bind:value={basic} />`;
</script>

<Page title="Rating 评分" description="星级评分，支持半星、只读与键盘操作">
  <CodePreview title="基础用法" code={basicSource}>
    <div style="display:flex;flex-direction:column;gap:16px">
      <Row
        ><span class="rating-label">基础：</span>
        <Rating bind:value={basic} />
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
        <Rating size="small" bind:value={smallV} />
        <span class="rating-label">大：</span>
        <Rating size="large" bind:value={largeV} />
        <span class="rating-label">10 星：</span>
        <Rating max={10} bind:value={tenV} />
      </Row>
    </div>
  </CodePreview>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .rating-val {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-muted);
  }
  .rating-label {
    font-size: 13px;
    color: var(--text-muted);
  }
</style>

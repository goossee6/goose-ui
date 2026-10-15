<script lang="ts">
  import {Card, Page, Loading, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const loadingProps: PropsTableItem[] = [
    { name: "size", desc: "尺寸(px)", type: "number", default: "30" },
    { name: "src", desc: "自定义图片地址，为空时使用默认图", type: "string", default: "''" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const basicSource = `<script lang="ts">
  import { Loading, Row } from "goose-ui";
<\/script>

<Row>
  <Loading
    size={20}
    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50'%3E%3Cpath fill='%236366f1' d='M25 5a20 20 0 1 0 20 20h-5a15 15 0 1 1-15-15z'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 25 25' to='360 25 25' dur='1s' repeatCount='indefinite'/%3E%3C/path%3E%3C/svg%3E"
  />
  <span>加载中…</span>
</Row>`;
</script>

<Page title="加载 Loading" description="加载动画指示器" >
  <CodePreview title="加载动画 Loading" code={basicSource}>
    <div style="display:flex;flex-direction:column;gap:16px">
      <Row>
        <Loading size={20} src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50'%3E%3Cpath fill='%236366f1' d='M25 5a20 20 0 1 0 20 20h-5a15 15 0 1 1-15-15z'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 25 25' to='360 25 25' dur='1s' repeatCount='indefinite'/%3E%3C/path%3E%3C/svg%3E" />
        <span style="font-size:13px;color:var(--text-muted)">加载中…</span>
      </Row>
    </div>
  </CodePreview>
  <Card title="Props">
    <PropsTable items={loadingProps} />
  </Card>
</Page>

<style>
</style>

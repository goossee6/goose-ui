<script lang="ts">
  import {Card, Page, Separator, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "orientation", desc: "方向", type: "'horizontal' | 'vertical'", default: "'horizontal'" },
    { name: "dashed", desc: "虚线样式", type: "boolean", default: "false" },
    { name: "children", desc: "分隔文字（snippet）", type: "Snippet", default: "—" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];
</script>

<Page title="Separator 分割线" description="内容区域分割线，支持横/竖向、虚线与文字分隔">
  <Card title="基础用法">
    <div style="display:flex;flex-direction:column;gap:4px">
      <p class="demo-text">上一段内容</p>
      <Separator />
      <p class="demo-text">下一段内容</p>
    </div>
  </Card>

  <Card title="文字分隔">
    <div style="display:flex;flex-direction:column;gap:4px">
      <p class="demo-text">上一段内容</p>
      <Separator>或</Separator>
      <p class="demo-text">下一段内容</p>
    </div>
  </Card>

  <Card title="虚线与竖向">
    <div style="display:flex;flex-direction:column;gap:4px">
      <p class="demo-text">虚线分隔</p>
      <Separator dashed>分组</Separator>
      <p class="demo-text">下一段内容</p>
    </div>
    <Row style="margin-top:16px;align-items:stretch;height:48px">
      <span class="demo-text">左侧</span>
      <Separator orientation="vertical" />
      <span class="demo-text">右侧</span>
    </Row>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .demo-text { font-size: 13px; color: var(--text-muted); }
</style>

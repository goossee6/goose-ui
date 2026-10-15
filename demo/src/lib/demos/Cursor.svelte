<script lang="ts">
  import {Card, Page, Cursor, Row, Button} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "size", desc: "光标圆点尺寸（px）", type: "number", default: "24" },
    { name: "outline", desc: "描边圆点样式（false 时为实心点）", type: "boolean", default: "true" },
    { name: "trail", desc: "显示延迟跟随的外圈", type: "boolean", default: "false" },
    { name: "hideNative", desc: "区域内隐藏系统光标", type: "boolean", default: "true" },
    { name: "label", desc: "光标下方文字", type: "string", default: "''" },
    { name: "children", desc: "受控区域内容", type: "Snippet", default: "—" },
  ];

  let trail = $state(false);

  const trailToggleSource = `<script lang="ts">
  import { Cursor, Row } from "goose-ui";

  let trail = $state(false);
<\/script>

<Row>
  <label><input type="checkbox" bind:checked={trail} /> 显示拖尾外圈</label>
</Row>

<Cursor size={28} {trail} label="点我">
  <div style="min-height:200px">
    <p>Hover 区域</p>
    <p>此区域内移动鼠标查看效果；移出后系统光标恢复。</p>
  </div>
</Cursor>`;

  const basicCardSource = `<script lang="ts">
  import { Cursor, Button } from "goose-ui";
<\/script>

<Cursor size={28} label="点我">
  <div style="min-height:200px;display:flex;align-items:center;justify-content:center">
    <Button variant="primary">按钮仍可点击</Button>
  </div>
</Cursor>`;
</script>

<Page title="Cursor 自定义光标" description="区域内自定义光标点跟随，可选拖尾外圈与文字">
  <CodePreview title="用法说明" code={trailToggleSource}>
    <p class="note">鼠标移入下方演示区：系统光标隐藏，替换为跟随的圆点（window 监听在组件卸载时解绑）。</p>
    <Row>
      <label class="opt"><input type="checkbox" bind:checked={trail} /> 显示拖尾外圈</label>
    </Row>
  </CodePreview>

  <CodePreview title="演示区" code={basicCardSource}>
    <Cursor size={28} {trail} label="点我">
      <div class="zone">
        <p class="zone-title">Hover 区域</p>
        <p class="zone-sub">此区域内移动鼠标查看效果；移出后系统光标恢复。</p>
        <Button variant="primary">按钮仍可点击</Button>
      </div>
    </Cursor>
  </CodePreview>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .note { font-size: 13px; color: var(--text-muted); margin: 0 0 var(--sp-md); }
  .opt { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text); }
  .zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 200px;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-lg);
    background: var(--surface-2);
    text-align: center;
  }
  .zone-title { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-strong); }
  .zone-sub { margin: 0; font-size: 12px; color: var(--text-muted); }
</style>

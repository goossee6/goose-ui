<script lang="ts">
  import {Card, Cursor, Page, Row, Button} from "goose-ui";
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

  // 演示用开关。Cursor 的 trail / outline 都是普通 prop，改动会即时生效
  let trail = $state(true);
  let outline = $state(true);

  const basicSource = `<script lang="ts">
  import { Cursor, Button } from "goose-ui";
<\/script>

<Cursor size={28} label="点我">
  <div style="min-height:200px;display:flex;align-items:center;justify-content:center">
    <!-- 区域内元素照常可交互，光标只是视觉替换 -->
    <Button variant="primary">按钮仍可点击</Button>
  </div>
</Cursor>`;

  const trailSource = `<script lang="ts">
  import { Cursor } from "goose-ui";

  let trail = $state(true);
<\/script>

<label><input type="checkbox" bind:checked={trail} /> 显示拖尾外圈</label>

<Cursor size={28} {trail} label="点我">
  <div style="min-height:180px">Hover 区域</div>
</Cursor>`;

  const outlineSource = `<script lang="ts">
  import { Cursor } from "goose-ui";

  let outline = $state(true);
<\/script>

<label><input type="checkbox" bind:checked={outline} /> 描边样式</label>

<!-- outline={false} 时圆点变为实心 -->
<Cursor size={28} {outline} hideNative={false}>
  <div style="min-height:160px">Hover 区域（系统光标保留）</div>
</Cursor>`;

  const sizeSource = `<script lang="ts">
  import { Cursor } from "goose-ui";
<\/script>

<Cursor size={16}><div class="zone">16px</div></Cursor>
<Cursor size={24}><div class="zone">24px（默认）</div></Cursor>
<Cursor size={40}><div class="zone">40px</div></Cursor>`;

  const hideNativeSource = `<script lang="ts">
  import { Cursor } from "goose-ui";
<\/script>

<!-- hideNative={false}：自定义圆点跟着走，但系统箭头不隐藏，
     适合只做「强调光环」而不想改变点击手感的场景 -->
<Cursor size={40} trail hideNative={false}>
  <div style="min-height:160px">Hover 区域</div>
</Cursor>`;
</script>

<Page toc title="Cursor 自定义光标" description="区域内自定义光标跟随，可配拖尾外圈、尺寸与文字标签">
  <CodePreview anchor="basic" anchorLevel={2} title="基础光标" code={basicSource}>
    <Cursor size={28} label="点我">
      <div class="zone">
        <p class="zone-title">Hover 区域</p>
        <p class="zone-sub">移入后系统光标隐藏，换成跟随的圆点</p>
        <Button variant="primary">按钮仍可点击</Button>
      </div>
    </Cursor>
  </CodePreview>

  <CodePreview anchor="trail" anchorLevel={2} title="拖尾外圈" code={trailSource}>
    <div class="switches">
      <label class="opt"><input type="checkbox" bind:checked={trail} /> 显示拖尾外圈</label>
    </div>
    <Cursor size={28} {trail} label="点我">
      <div class="zone zone--short">
        <p class="zone-title">拖尾开启</p>
        <p class="zone-sub">外圈用 rAF 插值跟随，比圆点慢约 120ms</p>
      </div>
    </Cursor>
  </CodePreview>

  <CodePreview anchor="outline" anchorLevel={2} title="描边 / 实心" code={outlineSource}>
    <div class="switches">
      <label class="opt"><input type="checkbox" bind:checked={outline} /> 描边样式</label>
    </div>
    <Cursor size={28} trail={false} {outline} label="点我">
      <div class="zone zone--short">
        <p class="zone-title">outline 切换</p>
        <p class="zone-sub">关掉后是实心圆点（label 仍会显示在下方）</p>
      </div>
    </Cursor>
  </CodePreview>

  <CodePreview anchor="size" anchorLevel={2} title="尺寸" code={sizeSource}>
    <Row>
      <Cursor size={16}><div class="tile">16px</div></Cursor>
      <Cursor size={24}><div class="tile">24px 默认</div></Cursor>
      <Cursor size={40}><div class="tile">40px</div></Cursor>
    </Row>
  </CodePreview>

  <CodePreview anchor="hide-native" anchorLevel={2} title="保留系统光标" code={hideNativeSource}>
    <Cursor size={40} trail hideNative={false}>
      <div class="zone zone--short">
        <p class="zone-title">hideNative = false</p>
        <p class="zone-sub">自定义圆点照常跟随，系统箭头也还在</p>
      </div>
    </Cursor>
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={props} />
  </Card>
</Page>

<style>
  .switches { display: flex; align-items: center; gap: var(--sp-lg); margin-bottom: var(--sp-md); }
  .opt { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text); }
  .zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 200px;
    width: 100%;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-lg);
    background: var(--surface-2);
    text-align: center;
  }
  .zone--short { min-height: 140px; }
  .zone-title { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-strong); }
  .zone-sub { margin: 0; font-size: 12px; color: var(--text-muted); }
  .tile {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 150px;
    height: 90px;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-md);
    background: var(--surface-2);
    font-size: 12px;
    color: var(--text-muted);
  }
</style>

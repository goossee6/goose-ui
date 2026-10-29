<script lang="ts">
  import {Card, Page, Slider, Button, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "value", desc: "当前值（双向绑定）", type: "number", default: "0" },
    { name: "min", desc: "最小值", type: "number", default: "0" },
    { name: "max", desc: "最大值", type: "number", default: "100" },
    { name: "step", desc: "步长", type: "number", default: "1" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "label", desc: "左侧标签", type: "string", default: "''" },
    { name: "format", desc: "数值格式化", type: "(n: number) => string", default: "—" },
    { name: "onchange", desc: "松手/键盘变更回调", type: "(value: number) => void", default: "—" },
  ];

  let basic = $state(30);
  let temp = $state(22);
  let offset = $state(-20);
  let star = $state(3);
  let volume = $state(65);
  let size = $state(4096);
  let controlled = $state(50);
  let lastChange = $state("（尚未变更）");

  function logChange(v: number) {
    lastChange = `${v} @ ${new Date().toLocaleTimeString()}`;
  }

  const basicSource = `<script lang="ts">
  import { Slider } from "goose-ui";

  let basic = $state(30);
<\/script>

<Slider bind:value={basic} label="进度" />`;

  const rangeSource = `<script lang="ts">
  import { Slider } from "goose-ui";

  let temp = $state(22);
  let offset = $state(-20);
  let star = $state(3);
<\/script>

<!-- min / max / step + format -->
<Slider bind:value={temp} min={16} max={30} step={0.5} label="空调温度" format={(n) => \`\${n.toFixed(1)}℃\`} />

<!-- 负数区间 -->
<Slider bind:value={offset} min={-50} max={50} label="偏移量" format={(n) => (n > 0 ? \`+\${n}\` : String(n))} />

<!-- 非 0 起点 -->
<Slider bind:value={star} min={1} max={5} step={1} label="星级" format={(n) => \`\${'★'.repeat(n)}\${'☆'.repeat(5 - n)} \${n}\`} />`;

  const formatSource = `<script lang="ts">
  import { Slider } from "goose-ui";

  let volume = $state(65);
  let size = $state(4096);
<\/script>

<!-- 百分号后缀 -->
<Slider bind:value={volume} label="音量" step={5} format={(n) => \`\${n}%\`} />

<!-- 单位换算（step=1024 对齐 MB） -->
<Slider bind:value={size} min={0} max={16384} step={1024} label="缓冲大小" format={(n) => (n >= 1024 ? \`\${n / 1024} MB\` : \`\${n} KB\`)} />`;

  const controlledSource = `<script lang="ts">
  import { Slider, Button, Row } from "goose-ui";

  let controlled = $state(50);

  function logChange(v: number) {
    console.log("变更", v);
  }
<\/script>

<Slider bind:value={controlled} label="受控 value" onchange={logChange} />

<Row>
  <Button size="small" onclick={() => (controlled = 0)}>设为 0</Button>
  <Button size="small" onclick={() => (controlled = 50)}>设为 50</Button>
  <Button size="small" onclick={() => (controlled = 100)}>设为 100</Button>
</Row>`;

  const disabledSource = `<script lang="ts">
  import { Slider } from "goose-ui";
<\/script>

<Slider value={50} disabled label="禁用" />`;
</script>

<Page toc title="Slider 滑块" description="拖拽或键盘（方向键/Home/End/PageUp/PageDown）调节连续值；value 双向绑定，外部改值带 0.2s 补间（拖动中不补间），onchange 松手/键盘时触发">
  <CodePreview anchor="basic" anchorLevel={2} title="基础用法" code={basicSource}>
    <div style="display:flex;flex-direction:column;gap:20px;max-width:420px">
      <Slider bind:value={basic} label="进度" />
      <p class="note">label 显示名称，右侧数值随拖动实时更新；bind:value 双向绑定，当前 = {basic}</p>
    </div>
  </CodePreview>

  <CodePreview anchor="range-step" anchorLevel={2} title="范围与步长（min / max / step）" code={rangeSource}>
    <div style="display:flex;flex-direction:column;gap:20px;max-width:420px">
      <Slider bind:value={temp} min={16} max={30} step={0.5} label="空调温度" format={(n) => `${n.toFixed(1)}℃`} />
      <p class="note">min=16、max=30、step=0.5：按 0.5 递进，format 固定一位小数，当前 = {temp.toFixed(1)}℃</p>
      <Slider bind:value={offset} min={-50} max={50} label="偏移量" format={(n) => (n > 0 ? `+${n}` : String(n))} />
      <p class="note">负数区间 min=-50 ~ max=50，当前 = {offset}</p>
      <Slider bind:value={star} min={1} max={5} step={1} label="星级" format={(n) => `${'★'.repeat(n)}${'☆'.repeat(5 - n)} ${n}`} />
      <p class="note">min=1（非 0 起点）、step=1，format 输出星形图案，当前 = {star}</p>
    </div>
  </CodePreview>

  <CodePreview anchor="format" anchorLevel={3} title="格式化（format）" code={formatSource}>
    <div style="display:flex;flex-direction:column;gap:20px;max-width:420px">
      <Slider bind:value={volume} label="音量" step={5} format={(n) => `${n}%`} />
      <p class="note">format 返回百分号后缀，步进 5，当前显示 {volume}%</p>
      <Slider bind:value={size} min={0} max={16384} step={1024} label="缓冲大小" format={(n) => (n >= 1024 ? `${n / 1024} MB` : `${n} KB`)} />
      <p class="note">format 做单位换算（step=1024 对齐 MB），当前 = {size / 1024} MB</p>
    </div>
  </CodePreview>

  <CodePreview anchor="value-onchange" anchorLevel={3} title="受控与回调（value / onchange）" code={controlledSource}>
    <div style="display:flex;flex-direction:column;gap:16px;max-width:420px">
      <Slider bind:value={controlled} label="受控 value" onchange={logChange} />
      <Row>
        <Button size="small" onclick={() => (controlled = 0)}>设为 0</Button>
        <Button size="small" onclick={() => (controlled = 50)}>设为 50</Button>
        <Button size="small" onclick={() => (controlled = 100)}>设为 100</Button>
      </Row>
      <p class="note">外部改 value 时滑块用 0.2s 补间滑过去（拖动中不补间，始终跟手），当前 = {controlled}；onchange 仅在松手/键盘操作时触发，最近一次：<span class="mono">{lastChange}</span></p>
    </div>
  </CodePreview>

  <CodePreview anchor="disabled" anchorLevel={3} title="禁用（disabled）" code={disabledSource}>
    <div style="display:flex;flex-direction:column;gap:20px;max-width:420px">
      <Slider value={50} disabled label="禁用" />
      <p class="note">禁用后不可拖拽、不可聚焦（tabindex=-1），value 保持外部传入</p>
    </div>
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={props} />
  </Card>
</Page>

<style>
  .note { font-size: 12px; color: var(--text-muted); margin: 0; }
  .mono { font-family: var(--font-mono); }
</style>

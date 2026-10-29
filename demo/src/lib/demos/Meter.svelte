<script lang="ts">
  import {Card, Page, Meter, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "value", desc: "当前值", type: "number", default: "0" },
    { name: "min", desc: "最小值", type: "number", default: "0" },
    { name: "max", desc: "最大值", type: "number", default: "100" },
    { name: "label", desc: "左侧标签", type: "string", default: "''" },
    { name: "threshold", desc: "达到该百分比转高亮（warning）", type: "number", default: "80" },
    { name: "critical", desc: "达到该百分比转危险色（critical）", type: "number", default: "100" },
    { name: "format", desc: "数值格式化", type: "(n: number) => string", default: "—" },
    { name: "labelRight", desc: "右侧自定义内容（snippet）", type: "Snippet", default: "—" },
  ];

  let usage = $state(62);
  let mem = $state(81);
  let disk = $state(100);

  const basicSource = `<script lang="ts">
  import { Meter } from "goose-ui";

  let usage = $state(62);
  let mem = $state(81);
  let disk = $state(100);
<\/script>

<Meter value={usage} label="网络流量" format={(n) => \`\${n}%\`} />
<Meter value={mem} label="内存占用" format={(n) => \`\${n}%\`} />
<Meter value={disk} label="磁盘使用" format={(n) => \`\${n}%\`} />
<Meter value={45} min={0} max={200} label="自定义范围" threshold={60} />
<Meter value={3.7} min={0} max={5} label="CPU 温度" format={(n) => \`\${n}℃\`} threshold={70} />`;

  const stateSource = `<script lang="ts">
  import { Meter, Row } from "goose-ui";
<\/script>

<Row><span style="width:120px">normal (&lt; 80%)</span><Meter value={50} /></Row>
<Row><span style="width:120px">high (≥ 80%)</span><Meter value={85} /></Row>
<Row><span style="width:120px">critical (= 100%)</span><Meter value={100} /></Row>`;
</script>

<Page toc title="Meter 度量条" description="带阈值状态的水平度量条（区别于 ProgressBar 的进度语义）">
  <CodePreview wide anchor="basic" anchorLevel={2} title="基础用法" code={basicSource}>
    <div style="display:flex;flex-direction:column;gap:16px">
      <Meter value={usage} label="网络流量" format={(n) => `${n}%`} />
      <Meter value={mem} label="内存占用" format={(n) => `${n}%`} />
      <Meter value={disk} label="磁盘使用" format={(n) => `${n}%`} />
      <Meter value={45} min={0} max={200} label="自定义范围" threshold={60} />
      <Meter value={3.7} min={0} max={5} label="CPU 温度" format={(n) => `${n}℃`} threshold={70} />
    </div>
  </CodePreview>

  <CodePreview wide anchor="state" anchorLevel={2} title="状态演示" code={stateSource}>
    <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;color:var(--text-muted)">
      <Row><span style="width:120px">normal (&lt; 80%)</span><Meter value={50} /></Row>
      <Row><span style="width:120px">high (≥ 80%)</span><Meter value={85} /></Row>
      <Row><span style="width:120px">critical (= 100%)</span><Meter value={100} /></Row>
    </div>
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={props} />
  </Card>
</Page>

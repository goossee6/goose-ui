<script lang="ts">
  import {Card, Page, Slider, Button} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

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
  let volume = $state(65);
  let temp = $state(22);
</script>

<Page title="Slider 滑块" description="拖拽或键盘（方向键/Home/End/PageUp/PageDown）调节连续值">
  <Card title="基础用法">
    <div style="display:flex;flex-direction:column;gap:20px;max-width:420px">
      <Slider bind:value={basic} label="进度" />
      <Slider bind:value={volume} label="音量" format={(n) => `${n}%`} />
      <Slider bind:value={temp} min={16} max={30} step={0.5} label="空调温度" format={(n) => `${n}℃`} />
      <Slider value={50} disabled label="禁用" />
    </div>
  </Card>

  <Card title="受控重置">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:420px">
      <Slider bind:value={basic} label="value" />
      <Button size="small" onclick={() => (basic = 0)}>重置为 0</Button>
    </div>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

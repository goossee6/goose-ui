<script lang="ts">
  import {Card, Page, TimePicker, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "value", desc: "时间 'HH:mm' / 'HH:mm:ss'（双向绑定）", type: "string", default: "''" },
    { name: "seconds", desc: "包含秒列", type: "boolean", default: "false" },
    { name: "interval", desc: "分钟列步长", type: "number", default: "30" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "clearable", desc: "显示清除按钮", type: "boolean", default: "true" },
    { name: "placeholder", desc: "空占位", type: "string", default: "'选择时间…'" },
    { name: "onchange", desc: "值完整时回调", type: "(value: string) => void", default: "—" },
  ];

  let t1 = $state("09:30");
  let t2 = $state("");
  let t3 = $state("");
</script>

<Page title="TimePicker 时间选择" description="触发器 + 时/分(/秒) 列选择，自动翻转，支持「现在」快捷键">
  <Card title="基础用法">
    <Row>
      <TimePicker bind:value={t1} />
      <TimePicker bind:value={t2} placeholder="空状态" />
      <TimePicker value="09:30" disabled />
    </Row>
    <p class="note">t1 = {t1 || "（空）"}；t2 = {t2 || "（空）"}</p>
  </Card>

  <Card title="含秒 + 细粒度分钟">
    <Row>
      <TimePicker bind:value={t3} seconds interval={15} />
    </Row>
    <p class="note">seconds 开启第三列；interval=15 时分钟列为 00/15/30/45。当前：{t3 || "（空）"}</p>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .note { font-size: 12px; color: var(--text-muted); margin: var(--sp-sm) 0 0; font-family: var(--font-mono); }
</style>

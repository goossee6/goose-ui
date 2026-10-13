<script lang="ts">
  import {Card, Page, TimePicker, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "value", desc: "时间 'HH:mm' / 'HH:mm:ss'（双向绑定）", type: "string", default: "''" },
    { name: "showSeconds", desc: "显示秒列（false 隐藏第三列）", type: "boolean", default: "true" },
    { name: "hourStep", desc: "小时列步长（hourStep=2 → 00-22 偶数共 12 档）", type: "number", default: "1" },
    { name: "minuteStep", desc: "分钟列步长", type: "number", default: "1" },
    { name: "secondStep", desc: "秒列步长", type: "number", default: "1" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "clearable", desc: "显示清除按钮", type: "boolean", default: "true" },
    { name: "placeholder", desc: "空占位", type: "string", default: "'选择时间…'" },
    { name: "onchange", desc: "值完整时回调", type: "(value: string) => void", default: "—" },
  ];

  let t1 = $state("09:30:00");
  let t2 = $state("");
  let t3 = $state("");
  let t4 = $state("");
</script>

<Page title="TimePicker 时间选择" description="触发器 + 惯性滚轮（拖拽/滚轮/点击均可），停稳自动提交完整值；showSeconds=false 隐藏秒列，xxStep 控制步长；自动翻转，支持「现在」快捷键">
  <Card title="基础用法（默认 24/60/60）">
    <Row>
      <TimePicker bind:value={t1} />
      <TimePicker bind:value={t2} placeholder="空状态" />
      <TimePicker value="09:30:00" disabled />
    </Row>
    <p class="note">默认时列 00-23 共 24 档、分列 00-59 共 60 档、秒列 00-59 共 60 档。t1 = {t1 || "（空）"}；t2 = {t2 || "（空）"}</p>
  </Card>

  <Card title="隐藏秒 + 分钟步长">
    <Row>
      <TimePicker bind:value={t3} showSeconds={false} minuteStep={15} />
    </Row>
    <p class="note">showSeconds=false 隐藏秒列（2 列）；minuteStep=15 时分钟列为 00/15/30/45。当前：{t3 || "（空）"}</p>
  </Card>

  <Card title="xxStep 自定义步长">
    <Row>
      <TimePicker bind:value={t4} hourStep={2} minuteStep={5} secondStep={10} />
    </Row>
    <p class="note">hourStep=2 → 时列 00/02/…/22 共 12 档（奇数整点不可选）；minuteStep=5 → 12 档；secondStep=10 → 秒列 00/10/…/50 共 6 档。当前：{t4 || "（空）"}</p>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .note { font-size: 12px; color: var(--text-muted); margin: var(--sp-md) 0 0; font-family: var(--font-mono); }
</style>

<script lang="ts">
  import {Card, Page, Time, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "mode", desc: "显示模式", type: "'time' | 'date' | 'datetime'", default: "'time'" },
    { name: "showSeconds", desc: "显示秒（仅 time/datetime）", type: "boolean", default: "true" },
    { name: "showDate", desc: "datetime 模式下显示日期", type: "boolean", default: "true" },
    { name: "hour12", desc: "12 小时制（AM/PM）", type: "boolean", default: "false" },
    { name: "interval", desc: "刷新间隔（ms）", type: "number", default: "1000" },
    { name: "prefix", desc: "前置文案", type: "string", default: "''" },
  ];
</script>

<Page title="Time 时钟" description="实时时钟，自动刷新，卸载清理定时器">
  <Card title="模式">
    <div style="display:flex;flex-direction:column;gap:12px;font-size:14px">
      <Row><span class="lbl">time（含秒）</span><Time /></Row>
      <Row><span class="lbl">time（不含秒）</span><Time showSeconds={false} /></Row>
      <Row><span class="lbl">12 小时制</span><Time hour12 /></Row>
      <Row><span class="lbl">date</span><Time mode="date" /></Row>
      <Row><span class="lbl">datetime</span><Time mode="datetime" /></Row>
      <Row><span class="lbl">带前缀</span><Time prefix="现在是" /></Row>
    </div>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .lbl { width: 140px; font-size: 13px; color: var(--text-muted); }
</style>

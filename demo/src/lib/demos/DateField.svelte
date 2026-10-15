<script lang="ts">
  import {Card, Page, DateField, TimeField, DateRangeField, TimeRangeField} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const dateProps: PropsTableItem[] = [
    { name: "value", desc: "日期字符串 'YYYY-MM-DD'（双向绑定）", type: "string", default: "''" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "ariaLabel", desc: "无障碍名", type: "string", default: "'日期'" },
    { name: "onchange", desc: "变更回调", type: "(value: string) => void", default: "—" },
  ];

  const timeProps: PropsTableItem[] = [
    { name: "value", desc: "时间字符串 'HH:mm[:ss]'（双向绑定）", type: "string", default: "''" },
    { name: "seconds", desc: "显示秒段", type: "boolean", default: "false" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "onchange", desc: "变更回调", type: "(value: string) => void", default: "—" },
  ];

  const rangeProps: PropsTableItem[] = [
    { name: "start", desc: "起点（双向绑定）", type: "string", default: "''" },
    { name: "end", desc: "终点（双向绑定）", type: "string", default: "''" },
    { name: "separator", desc: "中间分隔符", type: "string", default: "'→'" },
    { name: "onchange", desc: "变更回调", type: "(range: { start, end }) => void", default: "—" },
  ];

  let date = $state('2026-10-06');
  let time = $state('09:30');
  let timeSec = $state('09:30:45');
  let ds = $state('2026-10-01');
  let de = $state('2026-10-07');
  let ts = $state('08:00');
  let te = $state('18:30');

  const dateFieldSource = `<script lang="ts">
  import { DateField } from "goose-ui";

  let date = $state('2026-10-06');
<\/script>

<DateField bind:value={date} />
<p>value = {date || '（空）'}</p>

<!-- 禁用 -->
<DateField value="" disabled />`;

  const timeFieldSource = `<script lang="ts">
  import { TimeField } from "goose-ui";

  let time = $state('09:30');
  let timeSec = $state('09:30:45');
<\/script>

<!-- HH:mm -->
<TimeField bind:value={time} />

<!-- HH:mm:ss -->
<TimeField bind:value={timeSec} seconds />`;

  const dateRangeFieldSource = `<script lang="ts">
  import { DateRangeField } from "goose-ui";

  let start = $state('2026-10-01');
  let end = $state('2026-10-07');
<\/script>

<DateRangeField bind:start bind:end />
<p>{start || '（空）'} → {end || '（空）'}</p>`;

  const timeRangeFieldSource = `<script lang="ts">
  import { TimeRangeField } from "goose-ui";

  let start = $state('08:00');
  let end = $state('18:30');
<\/script>

<TimeRangeField bind:start bind:end />
<p>{start || '（空）'} → {end || '（空）'}</p>

<!-- 精确到秒 + 禁用 -->
<TimeRangeField start="08:00:00" end="18:30:00" seconds disabled />`;
</script>

<Page title="Date/Time Field 日期时间字段" description="分段键盘输入的日期/时间字段（自动跳格、整串粘贴、退格回跳）">
  <CodePreview title="DateField 日期字段" code={dateFieldSource}>
    <div style="display:flex;flex-direction:column;gap:12px">
      <DateField bind:value={date} />
      <p class="note">value = {date || '（空）'}</p>
      <DateField value="" disabled />
    </div>
  </CodePreview>

  <CodePreview title="TimeField 时间字段" code={timeFieldSource}>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
        <TimeField bind:value={time} />
        <span class="note">HH:mm</span>
        <TimeField bind:value={timeSec} seconds />
        <span class="note">HH:mm:ss</span>
      </div>
      <p class="note">value = {time || '（空）'} / {timeSec || '（空）'}</p>
    </div>
  </CodePreview>

  <CodePreview title="DateRangeField 日期范围" code={dateRangeFieldSource}>
    <div style="display:flex;flex-direction:column;gap:12px">
      <DateRangeField bind:start={ds} bind:end={de} />
      <p class="note">{ds || '（空）'} → {de || '（空）'}</p>
    </div>
  </CodePreview>

  <CodePreview title="TimeRangeField 时间范围" code={timeRangeFieldSource}>
    <div style="display:flex;flex-direction:column;gap:12px">
      <TimeRangeField bind:start={ts} bind:end={te} />
      <p class="note">{ts || '（空）'} → {te || '（空）'}</p>
      <TimeRangeField start="08:00:00" end="18:30:00" seconds disabled />
    </div>
  </CodePreview>

  <Card title="Props — DateField / TimeField">
    <PropsTable items={dateProps} />
    <div style="height:12px"></div>
    <PropsTable items={timeProps} />
  </Card>
  <Card title="Props — Range 字段">
    <PropsTable items={rangeProps} />
  </Card>
</Page>

<style>
  .note { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin: 0; }
</style>

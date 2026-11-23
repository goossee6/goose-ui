<script lang="ts">
  import {Card, Page, DateTimeRangePicker} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "start / end", desc: "起止时间 'YYYY-MM-DD HH:mm:ss'（双向绑定，空串为未选）", type: "string", default: "''" },
    { name: "min / max", desc: "可选日期边界 'YYYY-MM-DD'", type: "string", default: "''" },
    { name: "disabledDate", desc: "禁用某一天：返回 true 即不可选", type: "(iso: string) => boolean", default: "—" },
    { name: "weekStart", desc: "一周起始：1 周一 / 0 周日", type: "0 | 1", default: "1" },
    { name: "placeholder", desc: "空占位文案", type: "string", default: "'选择时间范围…'" },
    { name: "validate", desc: "区间校验：返回错误文案即不接受，两端回到改动前的值", type: "(range) => string | boolean | null", default: "—" },
    { name: "oninvalid", desc: "校验未通过时回调错误文案", type: "(msg: string) => void", default: "—" },
    { name: "onchange", desc: "点「确认」写回后回调完整区间", type: "(range) => void", default: "—" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
  ];

  let start = $state("2026-11-20 00:00:00");
  let end = $state("2026-11-22 23:59:59");
  let s2 = $state("");
  let e2 = $state("");
  let err = $state("");

  const basicSource = `<script lang="ts">
  import { DateTimeRangePicker } from "goose-ui";

  let start = $state("2026-11-20 00:00:00");
  let end = $state("2026-11-22 23:59:59");
<\/script>

<DateTimeRangePicker bind:start bind:end />`;

  const validateSource = `<script lang="ts">
  import { DateTimeRangePicker } from "goose-ui";

  let s = $state("");
  let e = $state("");

  function withinMonth(r: { start: string; end: string }) {
    if (!r.start || !r.end) return null;
    const days = (Date.parse(r.end.slice(0, 10)) - Date.parse(r.start.slice(0, 10))) / 86400000;
    return days > 31 ? "区间不能超过 31 天" : null;
  }
<\/script>

<DateTimeRangePicker bind:start={s} bind:end={e} validate={withinMonth} />`;

  /** 演示用：起止日期相差超过 31 天时拒绝 */
  function withinMonth(r: { start: string; end: string }): string | null {
    if (!r.start || !r.end) return null;
    const days = (Date.parse(r.end.slice(0, 10)) - Date.parse(r.start.slice(0, 10))) / 86400000;
    return days > 31 ? "区间不能超过 31 天" : null;
  }
</script>

<Page toc title="DateTimeRangePicker 时间范围" description="左侧 7 个快捷区间，右侧两行「日期 + 时间」等宽占满、图标与内容整体居中（日期带日历图标，时间带秒表图标）；日期和时间都是分段输入——点哪一段就能直接键入，同时弹出滚轮并高亮对应那一列，两种方式并行；时间浮层自带「取消 / 确认」，滚轮和键入只改浮层草稿，确认才落到区间；面板内改动同样先存草稿，点「确认」才写回，校验不通过则整体不动">
  <CodePreview anchor="basic" anchorLevel={2} title="基础用法" code={basicSource}>
    <DateTimeRangePicker bind:start bind:end />
    <p class="note">start = {start || "（空）"}；end = {end || "（空）"}</p>
  </CodePreview>

  <CodePreview anchor="presets" anchorLevel={2} title="快捷区间与区间校验" code={validateSource}>
    <DateTimeRangePicker
      bind:start={s2}
      bind:end={e2}
      validate={withinMonth}
      oninvalid={(m) => (err = m)}
      onchange={() => (err = "")}
    />
    <p class="note">
      预设填整天（00:00:00 → 23:59:59）；超过 31 天会被拒绝并保持原值。start = {s2 || "（空）"}；end = {e2 || "（空）"}
      {#if err}<span class="bad"> · {err}</span>{/if}
    </p>
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={props} />
  </Card>
</Page>

<style>
  .note { font-size: 12px; color: var(--text-muted); margin: var(--sp-md) 0 0; font-family: var(--font-mono); }
  .bad { color: var(--danger-text); font-family: inherit; }
</style>

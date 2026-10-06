<script lang="ts">
  import {Card, Page, Calendar, RangeCalendar, DatePicker, DateRangePicker} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const calendarProps: PropsTableItem[] = [
    { name: "value", desc: "选中日期 'YYYY-MM-DD'（双向绑定）", type: "string", default: "''" },
    { name: "min", desc: "最小可选日期", type: "string", default: "''" },
    { name: "max", desc: "最大可选日期", type: "string", default: "''" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "disabledDate", desc: "自定义禁用日期", type: "(iso: string) => boolean", default: "—" },
    { name: "weekStart", desc: "周起始（0=日 1=一）", type: "0 | 1", default: "1" },
    { name: "showToday", desc: "显示「今天」按钮", type: "boolean", default: "true" },
    { name: "onchange", desc: "选中回调", type: "(value: string) => void", default: "—" },
  ];

  const rangeProps: PropsTableItem[] = [
    { name: "start", desc: "起点 'YYYY-MM-DD'（双向绑定）", type: "string", default: "''" },
    { name: "end", desc: "终点（双向绑定）", type: "string", default: "''" },
    { name: "min", desc: "最小可选日期", type: "string", default: "''" },
    { name: "max", desc: "最大可选日期", type: "string", default: "''" },
    { name: "onchange", desc: "变更回调", type: "(range: { start, end }) => void", default: "—" },
  ];

  const pickerProps: PropsTableItem[] = [
    { name: "value / start+end", desc: "选中值（双向绑定）", type: "string / string", default: "''" },
    { name: "placeholder", desc: "空占位文案", type: "string", default: "'选择日期…'" },
    { name: "clearable", desc: "显示清除按钮", type: "boolean", default: "true" },
    { name: "min / max", desc: "可选边界", type: "string", default: "''" },
    { name: "disabledDate", desc: "自定义禁用日期", type: "(iso: string) => boolean", default: "—" },
  ];

  let calValue = $state('2026-10-06');
  let rangeStart = $state('2026-10-01');
  let rangeEnd = $state('2026-10-07');
  let picked = $state('2026-10-06');
  let pickedRangeStart = $state('');
  let pickedRangeEnd = $state('');
</script>

<Page title="Calendar / Date Picker 日历与日期选择" description="日历网格、范围日历与浮层选择器（方向键/PgUp/PgDn 键盘导航）">
  <Card title="Calendar 日历">
    <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start">
      <div style="display:flex;flex-direction:column;gap:8px">
        <Calendar bind:value={calValue} />
        <p class="note">value = {calValue || '（空）'}</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <Calendar value="" min="2026-10-05" max="2026-10-20" disabledDate={(iso) => iso.endsWith('06') || iso.endsWith('07')} />
        <p class="note">限制 10-05 ~ 10-20，且禁用 06/07 日</p>
      </div>
    </div>
  </Card>

  <Card title="RangeCalendar 范围日历">
    <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-start">
      <RangeCalendar bind:start={rangeStart} bind:end={rangeEnd} />
      <p class="note">{rangeStart || '（空）'} → {rangeEnd || '（空）'}（先点起点，再点终点；悬停预览）</p>
    </div>
  </Card>

  <Card title="DatePicker 日期选择器">
    <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
      <DatePicker bind:value={picked} />
      <DatePicker value="" placeholder="空状态" />
      <DatePicker value="2026-10-06" disabled />
    </div>
    <p class="note" style="margin-top:12px">value = {picked || '（空）'}</p>
  </Card>

  <Card title="DateRangePicker 范围选择器">
    <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
      <DateRangePicker bind:start={pickedRangeStart} bind:end={pickedRangeEnd} />
      <DateRangePicker start="" end="" placeholder="空状态" />
    </div>
    <p class="note" style="margin-top:12px">{pickedRangeStart || '（空）'} → {pickedRangeEnd || '（空）'}</p>
  </Card>

  <Card title="Props — Calendar / RangeCalendar">
    <PropsTable items={calendarProps} />
    <div style="height:12px"></div>
    <PropsTable items={rangeProps} />
  </Card>
  <Card title="Props — DatePicker / DateRangePicker">
    <PropsTable items={pickerProps} />
  </Card>
</Page>

<style>
  .note { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin: 0; }
</style>

<script lang="ts">
  import {Card, Page, Radio, RadioGroup, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const radioProps: PropsTableItem[] = [
    { name: "value", desc: "选项值（组内由 RadioGroup 管理）", type: "string", default: "''" },
    { name: "checked", desc: "独立使用时的选中态（双向绑定）", type: "boolean", default: "false" },
    { name: "name", desc: "独立使用时的原生 name", type: "string", default: "''" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "size", desc: "尺寸档", type: "'small' | 'middle' | 'large'", default: "'middle'" },
    { name: "children", desc: "文字标签（snippet）", type: "Snippet", default: "—" },
  ];

  const groupProps: PropsTableItem[] = [
    { name: "options", desc: "选项列表（value/label/disabled）", type: "RadioGroupOption[]", default: "[]" },
    { name: "value", desc: "选中值（双向绑定）", type: "string", default: "''" },
    { name: "orientation", desc: "排列方向", type: "'horizontal' | 'vertical'", default: "'horizontal'" },
    { name: "disabled", desc: "整组禁用", type: "boolean", default: "false" },
    { name: "onchange", desc: "变更回调", type: "(value: string) => void", default: "—" },
  ];

  let group = $state('option-a');
  let vertical = $state('v2');
  let standalone = $state(true);
</script>

<Page title="Radio 单选框 / RadioGroup 单选组" description="context 通信的单选两件套，也可独立使用">
  <Card title="RadioGroup 单选组">
    <div style="display:flex;flex-direction:column;gap:16px">
      <RadioGroup
        options={[
          { value: 'option-a', label: '选项 A' },
          { value: 'option-b', label: '选项 B' },
          { value: 'option-c', label: '选项 C（禁用）', disabled: true },
        ]}
        bind:value={group}
      />
      <p class="note">value = {group}</p>
      <RadioGroup
        orientation="vertical"
        options={[
          { value: 'v1', label: '纵向选项 1' },
          { value: 'v2', label: '纵向选项 2' },
          { value: 'v3', label: '纵向选项 3' },
        ]}
        bind:value={vertical}
      />
      <p class="note">value = {vertical}</p>
    </div>
  </Card>

  <Card title="独立 Radio（无组）">
    <Row>
      <Radio bind:checked={standalone}>记住我</Radio>
      <span class="note">checked = {standalone}</span>
    </Row>
    <Row style="margin-top:12px">
      <Radio size="small">small</Radio>
      <Radio size="middle">middle</Radio>
      <Radio size="large">large</Radio>
      <Radio disabled>禁用</Radio>
    </Row>
  </Card>

  <Card title="Props — Radio">
    <PropsTable items={radioProps} />
  </Card>
  <Card title="Props — RadioGroup">
    <PropsTable items={groupProps} />
  </Card>
</Page>

<style>
  .note { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin: 0; }
</style>

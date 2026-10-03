<script lang="ts">
  import {Card, Checkbox, Page} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  let basic = $state(false);
  let agreed = $state(true);
  let small = $state(true);
  let middle = $state(true);
  let large = $state(true);

  const checkboxProps: PropsTableItem[] = [
    { name: "checked", desc: "是否选中（可双向绑定）", type: "boolean", default: "false" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "size", desc: "尺寸档", type: "'small' | 'middle' | 'large'", default: "'middle'" },
    { name: "onchange", desc: "变更回调", type: "(e: Event) => void" },
    { name: "ariaLabel", desc: "无障碍标签", type: "string", default: "''" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];
</script>

<Page title="Checkbox 多选框" description="三种尺寸档、禁用态、可双向绑定的复选框" >
  <Card title="基础用法">
    <div class="cb-grid">
      <span class="cb-item"><Checkbox bind:checked={basic} /> 自动更新</span>
      <span class="cb-item"><Checkbox bind:checked={agreed} /> 已阅读并同意协议</span>
      <span class="cb-item"><Checkbox checked disabled /> 禁用（已选中）</span>
      <span class="cb-item"><Checkbox disabled /> 禁用（未选中）</span>
    </div>
  </Card>

  <Card title="尺寸 Sizes">
    <div class="cb-grid">
      <span class="cb-item"><Checkbox size="small" bind:checked={small} /> small</span>
      <span class="cb-item"><Checkbox size="middle" bind:checked={middle} /> middle（默认）</span>
      <span class="cb-item"><Checkbox size="large" bind:checked={large} /> large</span>
    </div>
  </Card>

  <Card title="Props">
    <PropsTable items={checkboxProps} />
  </Card>
</Page>

<style>
  .cb-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  .cb-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text);
  }
</style>

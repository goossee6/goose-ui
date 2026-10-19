<script lang="ts">
  import {Card, Page, RadioGroup, Checkbox, ToggleGroup} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const groupProps: PropsTableItem[] = [
    { name: "options", desc: "选项列表（value/label/disabled）", type: "RadioGroupOption[]", default: "[]" },
    { name: "value", desc: "选中值（双向绑定）", type: "string", default: "''" },
    { name: "orientation", desc: "排列方向", type: "'horizontal' | 'vertical'", default: "'horizontal'" },
    { name: "disabled", desc: "整组禁用", type: "boolean", default: "false" },
    { name: "onchange", desc: "变更回调", type: "(value: string) => void", default: "—" },
  ];

  // Checkbox
  const checkboxProps: PropsTableItem[] = [
    { name: "checked", desc: "是否选中（可双向绑定）", type: "boolean", default: "false" },
    { name: "indeterminate", desc: "「未变动」半选态（横线图标，点击后转选中，可双向绑定）", type: "boolean", default: "false" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "size", desc: "尺寸档", type: "'small' | 'middle' | 'large'", default: "'middle'" },
    { name: "onchange", desc: "变更回调", type: "(e: Event) => void" },
    { name: "ariaLabel", desc: "无障碍标签", type: "string", default: "''" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  // ToggleGroup
  const toggleGroupProps: PropsTableItem[] = [
    { name: "items", desc: "选项列表（value/label/disabled）", type: "ToggleGroupItem[]", default: "[]" },
    { name: "value", desc: "选中值数组（双向绑定）", type: "string[]", default: "[]" },
    { name: "multiple", desc: "多选模式", type: "boolean", default: "false" },
    { name: "disabled", desc: "整组禁用", type: "boolean", default: "false" },
    { name: "variant", desc: "外观", type: "'default' | 'outline'", default: "'default'" },
    { name: "size", desc: "尺寸档", type: "'small' | 'middle' | 'large'", default: "'middle'" },
    { name: "onchange", desc: "变更回调", type: "(value: string[]) => void", default: "—" },
  ];

  // 单选 state
  let group = $state('option-a');
  let vertical = $state('v2');
  let single = $state<string[]>(['center']);
  let outline = $state<string[]>([]);

  // 多选 state
  let basic = $state(false);
  let agreed = $state(true);
  let small = $state(true);
  let middle = $state(true);
  let large = $state(true);
  let cbOff = $state(false);
  let cbOn = $state(true);
  let multi = $state<string[]>(['bold']);
</script>

<Page toc title="选择控件 单选 / 多选" description="按选择模式分组：单选（pill 分段轨道）与多选（方形复选 / pill 分段）">
  <!-- ═══════════════════ 单选 ═══════════════════ -->
  <Card title="单选">
    <div class="section">
      <p class="section-title">pill 样式 — 分段轨道</p>
      <div style="display:flex;flex-direction:column;gap:16px">
        <RadioGroup
          options={[
            { value: 'option-a', label: '选项 A' },
            { value: 'option-b', label: '选项 B' },
            { value: 'option-c', label: '选项 C（禁用）', disabled: true },
          ]}
          bind:value={group}
        />
        <p class="note">RadioGroup value = {group}</p>
        <RadioGroup
          orientation="vertical"
          options={[
            { value: 'v1', label: '纵向选项 1' },
            { value: 'v2', label: '纵向选项 2' },
            { value: 'v3', label: '纵向选项 3' },
          ]}
          bind:value={vertical}
        />
        <p class="note">RadioGroup value = {vertical}</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;margin-top:4px">
        <ToggleGroup
          items={[
            { value: 'left', label: '左对齐' },
            { value: 'center', label: '居中' },
            { value: 'right', label: '右对齐' },
          ]}
          bind:value={single}
        />
        <p class="note">ToggleGroup 单选 value = [{single.join(', ')}]（滑动 pill）</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px">
        <ToggleGroup
          variant="outline"
          size="small"
          items={[
            { value: 'day', label: '日' },
            { value: 'week', label: '周' },
            { value: 'month', label: '月' },
          ]}
          bind:value={outline}
        />
        <ToggleGroup
          size="large"
          items={[
            { value: 'a', label: '大号 A' },
            { value: 'b', label: '大号 B' },
          ]}
          value={['a']}
        />
        <ToggleGroup
          disabled
          items={[
            { value: 'x', label: '禁用组' },
            { value: 'y', label: '选项' },
          ]}
          value={['x']}
        />
        <p class="note">变体（outline）/ 尺寸 / 禁用组</p>
      </div>
    </div>
  </Card>

  <!-- ═══════════════════ 多选 ═══════════════════ -->
  <Card title="多选">
    <div class="section">
      <p class="section-title">方形样式 — Checkbox 复选</p>
      <div class="cb-grid">
        <span class="cb-item"><Checkbox bind:checked={basic} /> 自动更新</span>
        <span class="cb-item"><Checkbox bind:checked={agreed} /> 已阅读并同意协议</span>
        <span class="cb-item"><Checkbox checked disabled /> 禁用（已选中）</span>
        <span class="cb-item"><Checkbox disabled /> 禁用（未选中）</span>
      </div>
      <div class="cb-grid">
        <span class="cb-item"><Checkbox size="small" bind:checked={small} /> small</span>
        <span class="cb-item"><Checkbox size="middle" bind:checked={middle} /> middle（默认）</span>
        <span class="cb-item"><Checkbox size="large" bind:checked={large} /> large</span>
      </div>
      <div class="cb-grid">
        <span class="cb-item"><Checkbox indeterminate /> 未变动（半选）</span>
        <span class="cb-item"><Checkbox bind:checked={cbOn} /> 选中</span>
        <span class="cb-item"><Checkbox bind:checked={cbOff} /> 不选中</span>
      </div>
      <p class="note">未变动为半选横线态（点击转选中）；cbOn = {cbOn}, cbOff = {cbOff}</p>
    </div>

    <div class="section section--divided">
      <p class="section-title">pill 样式 — 分段按钮</p>
      <div style="display:flex;flex-direction:column;gap:12px">
        <ToggleGroup
          multiple
          items={[
            { value: 'bold', label: 'B' },
            { value: 'italic', label: 'I' },
            { value: 'underline', label: 'U' },
            { value: 'strike', label: 'S', disabled: true },
          ]}
          bind:value={multi}
        />
        <p class="note">ToggleGroup multiple value = [{multi.join(', ')}]（选中项逐项高亮）</p>
      </div>
    </div>
  </Card>

  <!-- ═══════════════════ Props ═══════════════════ -->
  <Card title="Props — RadioGroup">
    <PropsTable anchor="props" items={groupProps} />
  </Card>
  <Card title="Props — Checkbox">
    <PropsTable items={checkboxProps} />
  </Card>
  <Card title="Props — ToggleGroup">
    <PropsTable items={toggleGroupProps} />
  </Card>
</Page>

<style>
  .section {
    display: flex;
    flex-direction: column;
    gap: var(--sp-md);
  }
  .section--divided {
    border-top: 1px solid var(--border);
    padding-top: 16px;
  }
  .section-title {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-strong);
  }
  .note { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin: 0; }
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

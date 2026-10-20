<script lang="ts">
  import {Card, Page, RadioGroup, Checkbox, ToggleGroup} from "goose-ui";
  import CodePreview from "../CodePreview.svelte";
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

  // ── 单选 state ──
  let group = $state('option-a');
  let vertical = $state('v2');
  let single = $state<string[]>(['center']);
  let outline = $state<string[]>([]);

  // ── 多选 state ──
  let basic = $state(false);
  let agreed = $state(true);
  let small = $state(true);
  let middle = $state(true);
  let large = $state(true);
  let cbOff = $state(false);
  let cbOn = $state(true);
  let multi = $state<string[]>(['bold']);

  // ── 代码示例 ──
  const radioSource = `<script lang="ts">
  import { RadioGroup } from "goose-ui";

  let group = $state("option-a");
  let vertical = $state("v2");
<\/script>

<!-- 横向（默认） -->
<RadioGroup
  options={[
    { value: "option-a", label: "选项 A" },
    { value: "option-b", label: "选项 B" },
    { value: "option-c", label: "选项 C（禁用）", disabled: true },
  ]}
  bind:value={group}
/>

<!-- 纵向 -->
<RadioGroup
  orientation="vertical"
  options={[
    { value: "v1", label: "纵向选项 1" },
    { value: "v2", label: "纵向选项 2" },
    { value: "v3", label: "纵向选项 3" },
  ]}
  bind:value={vertical}
/>`;

  const toggleSingleSource = `<script lang="ts">
  import { ToggleGroup } from "goose-ui";

  // 单选模式下 value 仍是数组：只会有一个元素
  let single = $state<string[]>(["center"]);
<\/script>

<ToggleGroup
  items={[
    { value: "left", label: "左对齐" },
    { value: "center", label: "居中" },
    { value: "right", label: "右对齐" },
  ]}
  bind:value={single}
/>`;

  const toggleVariantSource = `<script lang="ts">
  import { ToggleGroup } from "goose-ui";

  let outline = $state<string[]>([]);
<\/script>

<!-- 描边外观 + 小号 -->
<ToggleGroup
  variant="outline"
  size="small"
  items={[
    { value: "day", label: "日" },
    { value: "week", label: "周" },
    { value: "month", label: "月" },
  ]}
  bind:value={outline}
/>

<!-- 大号 -->
<ToggleGroup
  size="large"
  items={[
    { value: "a", label: "大号 A" },
    { value: "b", label: "大号 B" },
  ]}
  value={["a"]}
/>

<!-- 整组禁用 -->
<ToggleGroup
  disabled
  items={[
    { value: "x", label: "禁用组" },
    { value: "y", label: "选项" },
  ]}
  value={["x"]}
/>`;

  const checkboxSource = `<script lang="ts">
  import { Checkbox } from "goose-ui";

  let basic = $state(false);
  let agreed = $state(true);
<\/script>

<Checkbox bind:checked={basic} /> 自动更新
<Checkbox bind:checked={agreed} /> 已阅读并同意协议
<Checkbox checked disabled /> 禁用（已选中）
<Checkbox disabled /> 禁用（未选中）`;

  const checkboxSizeSource = `<script lang="ts">
  import { Checkbox } from "goose-ui";

  let small = $state(true);
  let middle = $state(true);
  let large = $state(true);
<\/script>

<Checkbox size="small" bind:checked={small} /> small
<Checkbox size="middle" bind:checked={middle} /> middle（默认）
<Checkbox size="large" bind:checked={large} /> large`;

  const checkboxStateSource = `<script lang="ts">
  import { Checkbox } from "goose-ui";

  let cbOn = $state(true);
  let cbOff = $state(false);
<\/script>

<!-- 未变动（半选横线态，点击后转选中） -->
<Checkbox indeterminate /> 未变动

<Checkbox bind:checked={cbOn} /> 选中
<Checkbox bind:checked={cbOff} /> 不选中`;

  const toggleMultiSource = `<script lang="ts">
  import { ToggleGroup } from "goose-ui";

  let multi = $state<string[]>(["bold"]);
<\/script>

<ToggleGroup
  multiple
  items={[
    { value: "bold", label: "B" },
    { value: "italic", label: "I" },
    { value: "underline", label: "U" },
    { value: "strike", label: "S", disabled: true },
  ]}
  bind:value={multi}
/>`;
</script>

<Page toc title="选择控件 单选 / 多选" description="按选择模式分组：单选（pill 分段轨道）与多选（方形复选 / pill 分段）">
  <!-- ═══════════════════ 单选 ═══════════════════ -->
  <CodePreview anchor="radio-group" anchorLevel={2} title="单选 RadioGroup" code={radioSource}>
    <div class="demo-stack">
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
  </CodePreview>

  <CodePreview anchor="toggle-single" anchorLevel={3} title="单选 ToggleGroup（滑动 pill）" code={toggleSingleSource}>
    <div class="demo-stack">
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
  </CodePreview>

  <CodePreview anchor="toggle-variant" anchorLevel={3} title="ToggleGroup 变体 / 尺寸 / 禁用" code={toggleVariantSource}>
    <div class="demo-stack">
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
  </CodePreview>

  <!-- ═══════════════════ 多选 ═══════════════════ -->
  <CodePreview anchor="checkbox" anchorLevel={2} title="多选 Checkbox" code={checkboxSource}>
    <div class="demo-stack">
      <div class="cb-grid">
        <span class="cb-item"><Checkbox bind:checked={basic} /> 自动更新</span>
        <span class="cb-item"><Checkbox bind:checked={agreed} /> 已阅读并同意协议</span>
        <span class="cb-item"><Checkbox checked disabled /> 禁用（已选中）</span>
        <span class="cb-item"><Checkbox disabled /> 禁用（未选中）</span>
      </div>
    </div>
  </CodePreview>

  <CodePreview anchor="checkbox-size" anchorLevel={3} title="Checkbox 尺寸" code={checkboxSizeSource}>
    <div class="demo-stack">
      <div class="cb-grid">
        <span class="cb-item"><Checkbox size="small" bind:checked={small} /> small</span>
        <span class="cb-item"><Checkbox size="middle" bind:checked={middle} /> middle（默认）</span>
        <span class="cb-item"><Checkbox size="large" bind:checked={large} /> large</span>
      </div>
    </div>
  </CodePreview>

  <CodePreview anchor="checkbox-state" anchorLevel={3} title="Checkbox 半选与状态" code={checkboxStateSource}>
    <div class="demo-stack">
      <div class="cb-grid">
        <span class="cb-item"><Checkbox indeterminate /> 未变动（半选）</span>
        <span class="cb-item"><Checkbox bind:checked={cbOn} /> 选中</span>
        <span class="cb-item"><Checkbox bind:checked={cbOff} /> 不选中</span>
      </div>
      <p class="note">未变动为半选横线态（点击转选中）；cbOn = {cbOn}, cbOff = {cbOff}</p>
    </div>
  </CodePreview>

  <CodePreview anchor="toggle-multiple" anchorLevel={2} title="多选 ToggleGroup（分段按钮）" code={toggleMultiSource}>
    <div class="demo-stack">
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
  </CodePreview>

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
  .demo-stack {
    display: flex;
    flex-direction: column;
    gap: var(--sp-md);
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

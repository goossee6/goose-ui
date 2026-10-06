<script lang="ts">
  import {Card, Page, ToggleGroup} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "items", desc: "选项列表（value/label/disabled）", type: "ToggleGroupItem[]", default: "[]" },
    { name: "value", desc: "选中值数组（双向绑定）", type: "string[]", default: "[]" },
    { name: "multiple", desc: "多选模式", type: "boolean", default: "false" },
    { name: "disabled", desc: "整组禁用", type: "boolean", default: "false" },
    { name: "variant", desc: "外观", type: "'default' | 'outline'", default: "'default'" },
    { name: "size", desc: "尺寸档", type: "'small' | 'middle' | 'large'", default: "'middle'" },
    { name: "onchange", desc: "变更回调", type: "(value: string[]) => void", default: "—" },
  ];

  let single = $state<string[]>(['center']);
  let multi = $state<string[]>(['bold']);
  let outline = $state<string[]>([]);
</script>

<Page title="Toggle Group 切换组" description="单选/多选的按钮组（区别于 Toggle 开关）">
  <Card title="单选（multiple=false）">
    <div style="display:flex;flex-direction:column;gap:12px">
      <ToggleGroup
        items={[
          { value: 'left', label: '左对齐' },
          { value: 'center', label: '居中' },
          { value: 'right', label: '右对齐' },
        ]}
        bind:value={single}
      />
      <p class="note">value = [{single.join(', ')}]</p>
    </div>
  </Card>

  <Card title="多选（multiple）">
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
      <p class="note">value = [{multi.join(', ')}]</p>
    </div>
  </Card>

  <Card title="变体与尺寸">
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
    </div>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .note { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin: 0; }
</style>

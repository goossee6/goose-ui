<script lang="ts">
  import {Card, SegmentedTabs, Page, Notification} from "goose-ui";
  import { LayoutGrid, List, Settings, User, Bell, Shield } from '@lucide/svelte';
  import type { Component } from 'svelte';

  let seg = $state('one');
  let underline = $state('one');
  let vertical = $state('x');
  let withIcons = $state('grid');

  const basicItems = [
    { value: 'one', label: '选项一' },
    { value: 'two', label: '选项二' },
    { value: 'three', label: '选项三' },
  ];



  const iconItems = [
    { value: 'grid', label: '网格', icon: LayoutGrid as Component<{size?:number}> },
    { value: 'list', label: '列表', icon: List as Component<{size?:number}> },
    { value: 'settings', label: '设置', icon: Settings as Component<{size?:number}> },
  ];

  const verticalItems = [
    { value: 'x', label: '个人资料', icon: User as Component<{size?:number}> },
    { value: 'y', label: '通知设置', icon: Bell as Component<{size?:number}> },
    { value: 'z', label: '安全中心', icon: Shield as Component<{size?:number}> },
  ];
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const tabsProps: PropsTableItem[] = [
    { name: "items", desc: "标签项数组，元素 { value, label, icon?, iconHtml? }", type: "readonly TabItem[]", default: "[]" },
    { name: "value", desc: "当前选中值（可双向绑定）", type: "string", default: "''" },
    { name: "disabled", desc: "禁用切换", type: "boolean", default: "false" },
    { name: "mode", desc: "展示模式", type: "'segmented' | 'underline' | 'vertical'", default: "'segmented'" },
    { name: "size", desc: "尺寸，预设字符串或自定义数值(px)", type: "'small' | 'middle' | 'large' | number", default: "'middle'" },
    { name: "onchange", desc: "切换回调", type: "(value: string) => void" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
  ];
</script>

<Page title="标签页 SegmentedTabs" description="分段式、下划线式、垂直式三种模式的切换标签" >
  <Card title="尺寸 Sizes">
    <div style="display:flex;flex-direction:column;gap:16px">
      <div>
        <p class="demo-label">small</p>
        <SegmentedTabs items={basicItems} size="small" value="one" />
      </div>
      <div>
        <p class="demo-label">middle (默认)</p>
        <SegmentedTabs items={basicItems} size="middle" value="one" />
      </div>
      <div>
        <p class="demo-label">large</p>
        <SegmentedTabs items={basicItems} size="large" value="one" />
      </div>
    </div>
  </Card>

  <Card title="分段模式 segmented（默认）">
    <div style="display:flex;flex-direction:column;gap:16px">
      <SegmentedTabs items={basicItems} bind:value={seg}   />
      <p class="demo-val">当前选中: {seg}</p>
      <div class="panel">内容区域 — 选项 {seg}</div>
    </div>
  </Card>

  <Card title="带图标">
    <div style="display:flex;flex-direction:column;gap:16px">
      <SegmentedTabs items={iconItems} bind:value={withIcons}   />
      <div class="panel">当前视图: {withIcons}</div>
    </div>
  </Card>

  <Card title="下划线模式 underline">
    <div style="display:flex;flex-direction:column;gap:16px">
      <SegmentedTabs items={basicItems} bind:value={underline} mode="underline"   />
      <div class="panel">内容区域 — 选项 {underline}</div>
    </div>
  </Card>

  <Card title="垂直模式 vertical">
    <div style="display:flex;gap:24px">
      <div style="width:200px">
        <SegmentedTabs items={verticalItems} bind:value={vertical} mode="vertical"   />
      </div>
      <div class="panel" style="flex:1">内容区域 — {vertical}</div>
    </div>
  </Card>

  <Card title="禁用状态">
    <div>
      <SegmentedTabs items={basicItems} value="one" disabled />
    </div>
  </Card>

  <Card title="通过 onchange 回调">
    <div style="display:flex;flex-direction:column;gap:16px">
      <SegmentedTabs
        items={basicItems}
        value={seg}
        onchange={(v) => { seg = v; Notification.success(`切换到: ${basicItems.find(i => i.value === v)?.label ?? v}`); }}
      />
      <p class="demo-val">使用 onchange 而非 bind:value 也能正常切换</p>
    </div>
  </Card>
  <Card title="Props">
    <PropsTable items={tabsProps} />
  </Card>
</Page>

<style>
  .demo-label { font-size: 12px; color: var(--text-muted); margin: 0 0 6px; }
  .demo-val { font-size: 13px; color: var(--text-muted); margin: 0; }
  .panel {
    padding: 20px;
    background: var(--surface-2);
    border-radius: var(--radius-lg);
    font-size: 13px;
    color: var(--text-muted);
    text-align: center;
  }
</style>

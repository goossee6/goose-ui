<script lang="ts">
  import {Card, Tabs, TabsPanel, Page, Notification} from "goose-ui";
  import LayoutGrid from '@lucide/svelte/icons/layout-grid';
  import List from '@lucide/svelte/icons/list';
  import Settings from '@lucide/svelte/icons/settings';
  import User from '@lucide/svelte/icons/user';
  import Bell from '@lucide/svelte/icons/bell';
  import Shield from '@lucide/svelte/icons/shield';
  import type { Component } from 'svelte';
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  let seg = $state('one');
  let underline = $state('one');
  let vertical = $state('x');
  let withIcons = $state('grid');
  let panel = $state('apple');

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

  const panelItems = [
    { value: 'apple', label: '苹果' },
    { value: 'banana', label: '香蕉' },
    { value: 'cherry', label: '樱桃' },
  ];

  const previewItems = [
    { value: 'apple', label: '苹果' },
    { value: 'banana', label: '香蕉' },
  ];

  const previewSource = `<script lang="ts">
  import { Tabs, TabsPanel } from "goose-ui";

  let active = $state("apple");
  const items = [
    { value: "apple", label: "苹果" },
    { value: "banana", label: "香蕉" },
  ];
<\/script>

<Tabs items={items} bind:value={active} style="gap: var(--sp-md)">
  <TabsPanel value="apple">
    <div class="panel">苹果内容区域 — 面板随选中项自动切换渲染</div>
  </TabsPanel>
  <TabsPanel value="banana">
    <div class="panel">香蕉内容区域 — 这里可以放任意复杂的页面内容</div>
  </TabsPanel>
</Tabs>

<style>
  .panel {
    padding: 20px;
    background: var(--surface-2);
    border-radius: var(--radius-lg);
    font-size: 13px;
    color: var(--text-muted);
    text-align: center;
  }
</style>`;

  const segmentedSource = `<script lang="ts">
  import { Tabs } from "goose-ui";

  let active = $state("one");
  const items = [
    { value: "one", label: "选项一" },
    { value: "two", label: "选项二" },
    { value: "three", label: "选项三" },
  ];
<\/script>

<Tabs {items} bind:value={active} />`;

  const underlineSource = `<script lang="ts">
  import { Tabs } from "goose-ui";

  let active = $state("one");
  const items = [
    { value: "one", label: "选项一" },
    { value: "two", label: "选项二" },
    { value: "three", label: "选项三" },
  ];
<\/script>

<Tabs {items} bind:value={active} mode="underline" />`;

  const verticalSource = `<script lang="ts">
  import { Tabs } from "goose-ui";
  import User from "@lucide/svelte/icons/user";
  import Bell from "@lucide/svelte/icons/bell";
  import Shield from "@lucide/svelte/icons/shield";

  let active = $state("x");
  const items = [
    { value: "x", label: "个人资料", icon: User },
    { value: "y", label: "通知设置", icon: Bell },
    { value: "z", label: "安全中心", icon: Shield },
  ];
<\/script>

<div style="display:flex;gap:24px">
  <div style="width:200px">
    <Tabs {items} bind:value={active} mode="vertical" />
  </div>
  <div style="flex:1">内容区域 — {active}</div>
</div>`;

  const iconSource = `<script lang="ts">
  import { Tabs } from "goose-ui";
  import LayoutGrid from "@lucide/svelte/icons/layout-grid";
  import List from "@lucide/svelte/icons/list";
  import Settings from "@lucide/svelte/icons/settings";

  let active = $state("grid");
  const items = [
    { value: "grid", label: "网格", icon: LayoutGrid },
    { value: "list", label: "列表", icon: List },
    { value: "settings", label: "设置", icon: Settings },
  ];
<\/script>

<Tabs {items} bind:value={active} />`;

  const sizeSource = `<script lang="ts">
  import { Tabs } from "goose-ui";

  const items = [
    { value: "one", label: "选项一" },
    { value: "two", label: "选项二" },
    { value: "three", label: "选项三" },
  ];
<\/script>

<Tabs {items} size="small" value="one" />
<Tabs {items} size="middle" value="one" />
<Tabs {items} size="large" value="one" />`;

  const disabledSource = `<script lang="ts">
  import { Tabs } from "goose-ui";

  const items = [
    { value: "one", label: "选项一" },
    { value: "two", label: "选项二" },
    { value: "three", label: "选项三" },
  ];
<\/script>

<Tabs {items} value="one" disabled />`;

  const onchangeSource = `<script lang="ts">
  import { Tabs } from "goose-ui";

  let active = $state("one");
  const items = [
    { value: "one", label: "选项一" },
    { value: "two", label: "选项二" },
    { value: "three", label: "选项三" },
  ];
<\/script>

<Tabs
  {items}
  value={active}
  onchange={(v) => { active = v; }}
/>`;

  const panelSource = `<script lang="ts">
  import { Tabs, TabsPanel } from "goose-ui";

  let active = $state("apple");
  const items = [
    { value: "apple", label: "苹果" },
    { value: "banana", label: "香蕉" },
    { value: "cherry", label: "樱桃" },
  ];
<\/script>

<Tabs {items} bind:value={active} style="width:100%">
  <TabsPanel value="apple">苹果内容区域</TabsPanel>
  <TabsPanel value="banana">香蕉内容区域</TabsPanel>
  <TabsPanel value="cherry">樱桃内容区域</TabsPanel>
</Tabs>`;

  const tabsProps: PropsTableItem[] = [
    { name: "items", desc: "标签项数组，元素 { value, label, icon?, iconHtml? }", type: "readonly TabItem[]", default: "[]" },
    { name: "value", desc: "当前选中值（可双向绑定）", type: "string", default: "''" },
    { name: "disabled", desc: "禁用切换", type: "boolean", default: "false" },
    { name: "mode", desc: "展示模式", type: "'segmented' | 'underline' | 'vertical'", default: "'segmented'" },
    { name: "size", desc: "尺寸档", type: "'small' | 'middle' | 'large'", default: "'middle'" },
    { name: "onchange", desc: "切换回调", type: "(value: string) => void" },
    { name: "lead", desc: "提供后标签条并入卡片式标题栏；lead 内容在左、标签条在右，空 snippet 时标题栏只留标签条（居左）", type: "Snippet", default: "—" },
    { name: "children", desc: "面板内容（放 TabsPanel，须在 Tabs 内部）", type: "Snippet", default: "—" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const panelProps: PropsTableItem[] = [
    { name: "value", desc: "对应的 tab value，匹配当前选中值才渲染", type: "string" },
    { name: "children", desc: "面板内容（snippet）", type: "Snippet", default: "—" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];
</script>

<Page toc title="标签页 Tabs" description="分段式、下划线式、垂直式三种模式的切换标签，配合 TabsPanel 展示内容面板">
  <CodePreview anchor="basic" anchorLevel={2} title="基础用法 segmented（默认）" code={segmentedSource}>
    <div style="display:flex;flex-direction:column;gap:16px">
      <Tabs items={basicItems} bind:value={seg} />
      <p class="demo-val">当前选中: {seg}（方向键 ←→ 可在 tab 间移动）</p>
    </div>
  </CodePreview>

  <CodePreview anchor="underline" anchorLevel={3} title="下划线模式 underline" code={underlineSource}>
    <div style="display:flex;flex-direction:column;gap:16px">
      <Tabs items={basicItems} bind:value={underline} mode="underline" />
      <p class="demo-val">当前选中: {underline}</p>
    </div>
  </CodePreview>

  <CodePreview anchor="vertical" anchorLevel={3} title="垂直模式 vertical" code={verticalSource}>
    <div style="display:flex;gap:24px">
      <div style="width:200px">
        <Tabs items={verticalItems} bind:value={vertical} mode="vertical" />
      </div>
      <div class="panel" style="flex:1">内容区域 — {vertical}</div>
    </div>
  </CodePreview>

  <CodePreview anchor="with-icon" anchorLevel={3} title="带图标" code={iconSource}>
    <div style="display:flex;flex-direction:column;gap:16px">
      <Tabs items={iconItems} bind:value={withIcons} />
      <p class="demo-val">当前视图: {withIcons}</p>
    </div>
  </CodePreview>

  <CodePreview anchor="sizes" anchorLevel={3} title="尺寸 Sizes" code={sizeSource}>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div>
        <p class="demo-label">small</p>
        <Tabs items={basicItems} size="small" value="one" />
      </div>
      <div>
        <p class="demo-label">middle (默认)</p>
        <Tabs items={basicItems} size="middle" value="one" />
      </div>
      <div>
        <p class="demo-label">large</p>
        <Tabs items={basicItems} size="large" value="one" />
      </div>
    </div>
  </CodePreview>

  <CodePreview anchor="advanced" anchorLevel={2} title="禁用状态" code={disabledSource}>
    <div>
      <Tabs items={basicItems} value="one" disabled />
    </div>
  </CodePreview>

  <CodePreview anchor="onchange" anchorLevel={3} title="通过 onchange 回调" code={onchangeSource}>
    <div style="display:flex;flex-direction:column;gap:16px">
      <Tabs
        items={basicItems}
        value={seg}
        onchange={(v) => { seg = v; Notification.success(`切换到: ${basicItems.find(i => i.value === v)?.label ?? v}`); }}
      />
      <p class="demo-val">使用 onchange 而非 bind:value 也能正常切换</p>
    </div>
  </CodePreview>

  <CodePreview anchor="tabpanel" anchorLevel={3} title="TabPanel 内容面板" code={panelSource}>
    <div class="inner-card">
      <Tabs items={panelItems} bind:value={panel} style="width:100%">
        {#snippet lead()}{/snippet}
        <div class="inner-body">
          <TabsPanel value="apple">
            <div class="panel">苹果内容区域 — 面板随选中项自动切换渲染</div>
          </TabsPanel>
          <TabsPanel value="banana">
            <div class="panel">香蕉内容区域 — 这里可以放任意复杂的页面内容</div>
          </TabsPanel>
          <TabsPanel value="cherry">
            <div class="panel">樱桃内容区域 — TabsPanel value 与 Tabs value 匹配时显示</div>
          </TabsPanel>
        </div>
      </Tabs>
    </div>
    <p class="demo-val">提供 <code>lead</code>（此处为空 snippet）后标签条并入卡片式标题栏并靠左，切换 tab 修改内层内容区；当前选中: {panel}</p>
  </CodePreview>

  <CodePreview anchor="tabpanel-2" anchorLevel={3} title="TabPanel 代码预览" code={previewSource} language="svelte">
    <Tabs items={previewItems} bind:value={panel} style="width:100%; gap: var(--sp-md)">
      <TabsPanel value="apple">
        <div class="panel">苹果内容区域 — 面板随选中项自动切换渲染</div>
      </TabsPanel>
      <TabsPanel value="banana">
        <div class="panel">香蕉内容区域 — 这里可以放任意复杂的页面内容</div>
      </TabsPanel>
    </Tabs>
  </CodePreview>

  <Card title="Props — Tabs">
    <PropsTable anchor="props" items={tabsProps} />
  </Card>
  <Card title="Props — TabsPanel">
    <PropsTable items={panelProps} />
  </Card>
</Page>

<style>
  .demo-label { font-size: 12px; color: var(--text-muted); margin: 0 0 6px; }
  .demo-val { font-size: 13px; color: var(--text-muted); margin: 0; }
  .inner-card {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .inner-body {
    display: flex;
    flex-direction: column;
    gap: var(--sp-md);
    padding: var(--sp-lg);
  }
  .panel {
    padding: 20px;
    background: var(--surface-2);
    border-radius: var(--radius-lg);
    font-size: 13px;
    color: var(--text-muted);
    text-align: center;
  }
</style>

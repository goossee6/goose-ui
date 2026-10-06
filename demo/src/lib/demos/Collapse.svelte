<script lang="ts">
  import {Card, Page, Collapsible, Accordion} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const collapsibleProps: PropsTableItem[] = [
    { name: "open", desc: "展开状态", type: "boolean", default: "false" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "onchange", desc: "开关回调", type: "(open: boolean) => void", default: "—" },
    { name: "trigger", desc: "触发区（snippet）", type: "Snippet", default: "—" },
    { name: "children", desc: "内容（snippet）", type: "Snippet", default: "—" },
  ];

  const accordionProps: PropsTableItem[] = [
    { name: "items", desc: "面板项（value/label/disabled/content）", type: "AccordionItem[]", default: "[]" },
    { name: "value", desc: "展开项 value 数组（双向绑定）", type: "string[]", default: "[]" },
    { name: "multiple", desc: "允许多开", type: "boolean", default: "false" },
    { name: "collapsible", desc: "单开模式下允许收起", type: "boolean", default: "true" },
    { name: "onchange", desc: "变更回调", type: "(value: string[]) => void", default: "—" },
  ];

  let open1 = $state(false);
  let accValue = $state<string[]>(['a']);
  let accMulti = $state<string[]>(['x']);
</script>

{#snippet accA()}
  <p style="margin:0">Collapsible 是受控的展开/收起容器，Accordion 在其之上组装出手风琴交互（互斥、多开、禁用）。</p>
{/snippet}
{#snippet accB()}
  <p style="margin:0">Accordion 通过 <code>value</code> 数组驱动，<code>bind:value</code> 可直接读写展开状态。</p>
{/snippet}
{#snippet accC()}
  <p style="margin:0">禁用项的内容不会渲染（disabled 面板不可展开）。</p>
{/snippet}
{#snippet multiX()}
  <p style="margin:0">multiple 模式下点击其他项不会收起当前项。</p>
{/snippet}
{#snippet multiY()}
  <p style="margin:0">第二项内容。</p>
{/snippet}
{#snippet multiZ()}
  <p style="margin:0">第三项内容。</p>
{/snippet}

<Page title="Collapse 折叠面板" description="Collapsible 折叠容器与 Accordion 手风琴（共用底层）">
  <Card title="Collapsible 折叠容器">
    <div style="display:flex;flex-direction:column;gap:12px">
      <Collapsible open={open1} onchange={(o) => (open1 = o)}>
        {#snippet trigger()}
          <span>点我展开 / 收起（当前：{open1 ? '展开' : '收起'}）</span>
        {/snippet}
        <div>折叠内容区域。使用 grid-template-rows 0fr→1fr 实现无高度硬编码的平滑过渡。</div>
      </Collapsible>
      <Collapsible open={true} disabled>
        {#snippet trigger()}
          <span>禁用（保持展开）</span>
        {/snippet}
        <div>disabled 的触发区不可点击。</div>
      </Collapsible>
    </div>
  </Card>

  <Card title="Accordion 手风琴（单开）">
    <Accordion
      items={[
        { value: 'a', label: '什么是 Collapsible？', content: accA },
        { value: 'b', label: '什么是 Accordion？', content: accB },
        { value: 'c', label: '禁用项', disabled: true, content: accC },
      ]}
      bind:value={accValue}
    />
    <p class="note">value = [{accValue.join(', ')}]</p>
  </Card>

  <Card title="Accordion（多开 multiple）">
    <Accordion
      items={[
        { value: 'x', label: '支持多开（multiple）', content: multiX },
        { value: 'y', label: '第二项', content: multiY },
        { value: 'z', label: '第三项', content: multiZ },
      ]}
      multiple
      bind:value={accMulti}
    />
    <p class="note">value = [{accMulti.join(', ')}]</p>
  </Card>

  <Card title="Props — Collapsible">
    <PropsTable items={collapsibleProps} />
  </Card>
  <Card title="Props — Accordion">
    <PropsTable items={accordionProps} />
  </Card>
</Page>

<style>
  .note { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin: 8px 0 0; }
</style>

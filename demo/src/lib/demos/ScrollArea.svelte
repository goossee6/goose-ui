<script lang="ts">
  import {Card, Page, ScrollArea, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "maxHeight", desc: "最大高度（如 '240px'）", type: "string", default: "''" },
    { name: "orientation", desc: "滚动方向", type: "'vertical' | 'horizontal' | 'both'", default: "'vertical'" },
    { name: "children", desc: "内容（snippet）", type: "Snippet", default: "—" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const lines = Array.from({ length: 24 }, (_, i) => `日志行 ${i + 1}: component ScrollArea 初始化完成`);

  const verticalSource = `<script lang="ts">
  import { ScrollArea } from "goose-ui";

  const lines = Array.from({ length: 24 }, (_, i) => \`日志行 \${i + 1}: component ScrollArea 初始化完成\`);
<\/script>

<ScrollArea maxHeight="220px">
  {#each lines as line (line)}
    <div>{line}</div>
  {/each}
</ScrollArea>`;

  const horizontalSource = `<script lang="ts">
  import { ScrollArea, Row } from "goose-ui";
<\/script>

<ScrollArea orientation="horizontal" style="width:100%">
  <Row style="width:max-content;gap:12px">
    {#each Array(20) as _, i (i)}
      <span>卡片 {i + 1}</span>
    {/each}
  </Row>
</ScrollArea>`;
</script>

<Page toc title="ScrollArea 滚动区" description="样式化滚动条容器，支持纵向/横向/双向滚动">
  <CodePreview anchor="vertical" anchorLevel={2} title="纵向滚动" code={verticalSource}>
    <ScrollArea maxHeight="220px">
      <div class="log-list">
        {#each lines as line (line)}
          <div class="log-line">{line}</div>
        {/each}
      </div>
    </ScrollArea>
  </CodePreview>

  <CodePreview anchor="horizontal" anchorLevel={2} title="横向滚动" code={horizontalSource}>
    <ScrollArea orientation="horizontal" style="width:100%">
      <Row style="width:max-content;gap:12px">
        {#each Array(20) as _, i (i)}
          <span class="chip">卡片 {i + 1}</span>
        {/each}
      </Row>
    </ScrollArea>
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={props} />
  </Card>
</Page>

<style>
  .log-list { display: flex; flex-direction: column; gap: 4px; padding-right: 8px; }
  .log-line {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-muted);
    padding: 6px 8px;
    background: var(--surface-2);
    border-radius: var(--radius-sm);
    white-space: nowrap;
  }
  .chip {
    flex-shrink: 0;
    padding: 8px 14px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 13px;
    color: var(--text);
  }
</style>

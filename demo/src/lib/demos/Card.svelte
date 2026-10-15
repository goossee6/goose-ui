<script lang="ts">
  import {Card, Button, Page, Notification} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const cardProps: PropsTableItem[] = [
    { name: "title", desc: "卡片标题，为空时不渲染标题栏", type: "string" },
    { name: "right", desc: "标题右侧操作区插槽", type: "Snippet" },
    { name: "children", desc: "卡片内容", type: "Snippet" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const basicSource = `<script lang="ts">
  import { Card } from "goose-ui";
<\/script>

<Card title="基础卡片 Basic">
  <p>这是一个基础卡片，包含标题和一段正文内容。卡片自带边框、圆角和表面背景色。</p>
</Card>`;

  const rightSource = `<script lang="ts">
  import { Card, Button, Notification } from "goose-ui";
<\/script>

<Card title="带右侧操作">
  {#snippet right()}
    <Button variant="primary" size="small" onclick={() => Notification.success('执行操作')}>操作按钮</Button>
  {/snippet}
  <p>这个卡片在标题栏右侧放置了一个操作按钮，通过 <code>right</code> snippet 传入。</p>
</Card>`;

  const contentSource = `<script lang="ts">
  import { Card, Button, Notification } from "goose-ui";
<\/script>

<Card title="丰富内容">
  <p>卡片 body 区域可以放置任意内容：</p>
  <ul>
    <li>列表项一</li>
    <li>列表项二</li>
    <li>列表项三</li>
  </ul>
  <div style="display:flex;gap:8px;margin-top:8px">
    <Button size="small" variant="primary" onclick={() => Notification.success('已确认')}>确认</Button>
    <Button size="small" variant="ghost" onclick={() => Notification.success('已取消')}>取消</Button>
  </div>
</Card>`;

  const plainSource = `<script lang="ts">
  import { Card } from "goose-ui";
<\/script>

<Card>
  <p>这个卡片没有 title 属性，只渲染 body 内容区，标题栏整体不显示。</p>
</Card>`;

  const gridSource = `<script lang="ts">
  import { Card } from "goose-ui";
<\/script>

<div style="display:flex;flex-wrap:wrap;gap:12px">
  <Card title="卡片 A"><p>内容 A</p></Card>
  <Card title="卡片 B"><p>内容 B</p></Card>
  <Card title="卡片 C"><p>内容 C</p></Card>
</div>`;
</script>

<Page title="卡片 Card" description="带标题、右侧操作区、内容主体的容器组件" >
  <CodePreview title="基础卡片 Basic" code={basicSource}>
    <p>这是一个基础卡片，包含标题和一段正文内容。卡片自带边框、圆角和表面背景色。</p>
  </CodePreview>

  <CodePreview title="带右侧操作" code={rightSource}>
    {#snippet right()}
      <Button variant="primary" size="small" onclick={() => Notification.success('执行操作')}>操作按钮</Button>
    {/snippet}
    <p>这个卡片在标题栏右侧放置了一个操作按钮，通过 <code>right</code> snippet 传入。</p>
  </CodePreview>

  <CodePreview title="丰富内容" code={contentSource}>
    <div class="rich">
      <p>卡片 body 区域可以放置任意内容：</p>
      <ul>
        <li>列表项一</li>
        <li>列表项二</li>
        <li>列表项三</li>
      </ul>
      <div class="rich-actions">
        <Button size="small" variant="primary" onclick={() => Notification.success('已确认')}>确认</Button>
        <Button size="small" variant="ghost" onclick={() => Notification.success('已取消')}>取消</Button>
      </div>
    </div>
  </CodePreview>

  <CodePreview title="无标题卡片" code={plainSource}>
    <p>这个卡片没有 title 属性，只渲染 body 内容区，标题栏整体不显示。</p>
  </CodePreview>

  <CodePreview title="多个卡片并排" code={gridSource}>
    <div class="cards-row">
      <Card title="卡片 A"><p>内容 A</p></Card>
      <Card title="卡片 B"><p>内容 B</p></Card>
      <Card title="卡片 C"><p>内容 C</p></Card>
    </div>
  </CodePreview>
  <Card title="Props">
    <PropsTable items={cardProps} />
  </Card>
</Page>

<style>
  p { margin: 0; line-height: 1.6; color: var(--text); }
  code {
    background: var(--surface-2);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--primary);
  }
  .rich { display: flex; flex-direction: column; gap: 8px; }
  .rich ul { padding-left: 20px; line-height: 1.8; margin: 0; }
  .rich-actions { display: flex; gap: 8px; margin-top: 8px; }
  .cards-row { display: flex; flex-wrap: wrap; gap: 12px; }
  .cards-row :global(.card) { flex: 1; }
</style>

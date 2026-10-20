<script lang="ts">
  import {Card, Button, Icon, Notification, Page} from "goose-ui";
  import Settings from "@lucide/svelte/icons/settings";
  import MoreHorizontal from "@lucide/svelte/icons/more-horizontal";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const cardProps: PropsTableItem[] = [
    { name: "title", desc: "卡片标题，为空时不渲染标题栏", type: "string" },
    { name: "right", desc: "标题右侧操作区插槽", type: "Snippet" },
    { name: "children", desc: "卡片内容", type: "Snippet" },
    { name: "anchor", desc: "注册为页内目录锚点（与 Page 的 toc 配合），不传则与目录无关", type: "string", default: "''" },
    { name: "anchorLevel", desc: "锚点层级：2 = 顶层条目，3 = 挂在上一级下面的子条目", type: "'2' | '3'", default: "2" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const basicSource = `<script lang="ts">
  import { Card } from "goose-ui";
<\/script>

<Card title="基础卡片">
  <p>卡片自带边框、圆角和表面背景色，标题栏底色比正文更深一档。</p>
</Card>`;

  const plainSource = `<script lang="ts">
  import { Card } from "goose-ui";
<\/script>

<!-- 不传 title：整个标题栏都不渲染 -->
<Card>
  <p>没有标题的卡片只有内容区，适合纯粹的信息容器。</p>
</Card>`;

  const rightSource = `<script lang="ts">
  import { Card, Button, Notification } from "goose-ui";
<\/script>

<Card title="带右侧操作">
  {#snippet right()}
    <Button size="small" onclick={() => Notification.success('已保存')}>保存</Button>
  {/snippet}
  <p>标题栏右侧通过 <code>right</code> snippet 放操作按钮。</p>
</Card>`;

  const actionsSource = `<script lang="ts">
  import { Card, Button, Icon } from "goose-ui";
  import Settings from "@lucide/svelte/icons/settings";
  import MoreHorizontal from "@lucide/svelte/icons/more-horizontal";
<\/script>

<Card title="多个操作">
  {#snippet right()}
    <Button size="small" variant="ghost" icon={Settings} onclick={() => {}}>设置</Button>
    <Button size="small" variant="ghost" icon={MoreHorizontal} onclick={() => {}}>更多</Button>
  {/snippet}
  <p>right 里可以放任意数量的元素，超过两个建议用图标按钮。</p>
</Card>`;

  const richSource = `<script lang="ts">
  import { Card, Button, Notification } from "goose-ui";
<\/script>

<Card title="丰富内容">
  <p>内容区可以放任意结构：</p>
  <ul>
    <li>列表项一</li>
    <li>列表项二</li>
  </ul>
  <div style="display:flex;gap:8px;margin-top:8px">
    <Button size="small" onclick={() => Notification.success('已确认')}>确认</Button>
    <Button size="small" variant="ghost" onclick={() => Notification.success('已取消')}>取消</Button>
  </div>
</Card>`;

  const styleSource = `<script lang="ts">
  import { Card } from "goose-ui";
<\/script>

<!-- style 与 class 透传到卡片根节点 -->
<Card title="自定义外观" style="border-color:var(--primary);background-color:var(--surface-2)">
  <p>没有专门的 variant 属性，需要换主题色时直接用 style 覆盖即可。</p>
</Card>`;

  const gridSource = `<script lang="ts">
  import { Card } from "goose-ui";
<\/script>

<!-- 卡片本身不负责布局，并排由外层容器决定 -->
<div style="display:flex;flex-wrap:wrap;gap:12px">
  <Card title="卡片 A" style="flex:1;min-width:200px"><p>内容 A</p></Card>
  <Card title="卡片 B" style="flex:1;min-width:200px"><p>内容 B</p></Card>
  <Card title="卡片 C" style="flex:1;min-width:200px"><p>内容 C</p></Card>
</div>`;
</script>

<Page title="卡片 Card" description="带标题栏、右侧操作区与内容主体的容器；title 为空时只剩内容区" toc>
  <CodePreview anchor="basic" anchorLevel={2} title="基础卡片" code={basicSource}>
    <div class="card-box">
      <Card title="基础卡片">
        <p>卡片自带边框、圆角和表面背景色，标题栏底色比正文更深一档。</p>
      </Card>
    </div>
  </CodePreview>

  <CodePreview anchor="plain" anchorLevel={2} title="无标题卡片" code={plainSource}>
    <div class="card-box">
      <Card>
        <p>没有标题的卡片只有内容区，适合纯粹的信息容器。</p>
      </Card>
    </div>
  </CodePreview>

  <CodePreview anchor="right-action" anchorLevel={2} title="标题栏右侧操作" code={rightSource}>
    <div class="card-box">
      <Card title="带右侧操作">
        {#snippet right()}
          <Button size="small" onclick={() => Notification.success('已保存')}>保存</Button>
        {/snippet}
        <p>标题栏右侧通过 <code>right</code> snippet 放操作按钮。</p>
      </Card>
    </div>
  </CodePreview>

  <CodePreview anchor="actions" anchorLevel={3} title="多个操作" code={actionsSource}>
    <div class="card-box">
      <Card title="多个操作">
        {#snippet right()}
          <Button size="small" variant="ghost" icon={Settings} onclick={() => {}}>设置</Button>
          <Button size="small" variant="ghost" icon={MoreHorizontal} onclick={() => {}}>更多</Button>
        {/snippet}
        <p>right 里可以放任意数量的元素，超过两个建议用图标按钮。</p>
      </Card>
    </div>
  </CodePreview>

  <CodePreview anchor="rich" anchorLevel={2} title="丰富内容" code={richSource}>
    <div class="card-box">
      <Card title="丰富内容">
        <p>内容区可以放任意结构：</p>
        <ul class="rich-list">
          <li>列表项一</li>
          <li>列表项二</li>
        </ul>
        <div class="rich-actions">
          <Button size="small" onclick={() => Notification.success('已确认')}>确认</Button>
          <Button size="small" variant="ghost" onclick={() => Notification.success('已取消')}>取消</Button>
        </div>
      </Card>
    </div>
  </CodePreview>

  <CodePreview anchor="style" anchorLevel={2} title="自定义外观" code={styleSource}>
    <div class="card-box">
      <Card title="自定义外观" style="border-color:var(--primary);background-color:var(--surface-2)">
        <p>没有专门的 variant 属性，需要换主题色时直接用 style 覆盖即可。</p>
      </Card>
    </div>
  </CodePreview>

  <CodePreview anchor="grid" anchorLevel={2} title="多个卡片并排" code={gridSource}>
    <div class="card-grid">
      <Card title="卡片 A" style="flex:1;min-width:200px"><p>内容 A</p></Card>
      <Card title="卡片 B" style="flex:1;min-width:200px"><p>内容 B</p></Card>
      <Card title="卡片 C" style="flex:1;min-width:200px"><p>内容 C</p></Card>
    </div>
  </CodePreview>

  <Card title="Props 属性">
    <PropsTable anchor="props" items={cardProps} />
  </Card>
</Page>

<style>
  /* 演示用的卡片不要撑满整个预览区：卡片在宽容器里会被拉成一条横幅，
     看不出它本来的比例。限制宽度后 .cp-body 的居中会把整块放到中间。 */
  .card-box {
    width: 100%;
    max-width: 520px;
    margin-inline: auto;
  }
  .card-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  }
  p { margin: 0; line-height: 1.6; color: var(--text); }
  code {
    background: var(--surface-2);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--primary);
  }
  .rich-list { padding-left: 20px; line-height: 1.8; margin: 0; }
  .rich-actions { display: flex; gap: 8px; }
</style>

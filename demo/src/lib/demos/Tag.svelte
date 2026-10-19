<script lang="ts">
  import {Card, Page, Tag, Row, Button} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "variant", desc: "变体", type: "'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", default: "'default'" },
    { name: "size", desc: "尺寸", type: "'small' | 'middle' | 'large'", default: "'middle'" },
    { name: "dot", desc: "前置圆点", type: "boolean", default: "false" },
    { name: "closable", desc: "显示关闭按钮", type: "boolean", default: "false" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "onclose", desc: "关闭回调", type: "() => void", default: "—" },
    { name: "children", desc: "标签内容", type: "Snippet", default: "—" },
  ];

  const variants = ["default", "primary", "success", "warning", "danger", "info"] as const;

  let tags = $state([
    { id: 1, label: "可关闭标签" },
    { id: 2, label: "另一个" },
    { id: 3, label: "点我关闭" },
  ]);
  let nextId = $state(4);

  const variantSource = `<script lang="ts">
  import { Tag, Row } from "goose-ui";

  const variants = ["default", "primary", "success", "warning", "danger", "info"] as const;
<\/script>

<Row>
  {#each variants as v (v)}
    <Tag variant={v}>{v}</Tag>
  {/each}
</Row>`;

  const sizeSource = `<script lang="ts">
  import { Tag, Row } from "goose-ui";
<\/script>

<Row>
  <Tag size="small">small</Tag>
  <Tag size="middle">middle</Tag>
  <Tag size="large">large</Tag>
  <Tag variant="primary" dot>运行中</Tag>
  <Tag variant="success" dot>已完成</Tag>
  <Tag variant="danger" dot>异常</Tag>
  <Tag variant="default" disabled>禁用</Tag>
</Row>`;

  const closableSource = `<script lang="ts">
  import { Tag, Row, Button } from "goose-ui";

  let tags = $state([
    { id: 1, label: "可关闭标签" },
    { id: 2, label: "另一个" },
    { id: 3, label: "点我关闭" },
  ]);
  let nextId = $state(4);
<\/script>

<Row>
  {#each tags as t (t.id)}
    <Tag variant="primary" closable onclose={() => (tags = tags.filter((x) => x.id !== t.id))}>{t.label}</Tag>
  {/each}
  <Button
    variant="ghost"
    size="small"
    onclick={() => {
      const id = nextId++;
      tags = [...tags, { id, label: \`标签 \${id}\` }];
    }}
  >
    + 添加
  </Button>
</Row>`;
</script>

<Page toc title="Tag 标签" description="用于标记状态与分类的小型标签">
  <CodePreview anchor="variant" anchorLevel={2} title="变体" code={variantSource}>
    <Row>
      {#each variants as v (v)}
        <Tag variant={v}>{v}</Tag>
      {/each}
    </Row>
  </CodePreview>

  <CodePreview anchor="dot" anchorLevel={2} title="尺寸与圆点" code={sizeSource}>
    <Row>
      <Tag size="small">small</Tag>
      <Tag size="middle">middle</Tag>
      <Tag size="large">large</Tag>
      <Tag variant="primary" dot>运行中</Tag>
      <Tag variant="success" dot>已完成</Tag>
      <Tag variant="danger" dot>异常</Tag>
      <Tag variant="default" disabled>禁用</Tag>
    </Row>
  </CodePreview>

  <CodePreview anchor="closable" anchorLevel={2} title="可关闭" code={closableSource}>
    <Row>
      {#each tags as t (t.id)}
        <Tag variant="primary" closable onclose={() => (tags = tags.filter((x) => x.id !== t.id))}>{t.label}</Tag>
      {/each}
      <Button
        variant="ghost"
        size="small"
        onclick={() => {
          const id = nextId++;
          tags = [...tags, { id, label: `标签 ${id}` }];
        }}
      >
        + 添加
      </Button>
    </Row>
    <p class="note">已关闭 {nextId - 1 - tags.length} 个</p>
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={props} />
  </Card>
</Page>

<style>
  .note { font-size: 12px; color: var(--text-muted); margin: var(--sp-md) 0 0; }
</style>

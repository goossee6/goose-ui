<script lang="ts">
  import {Card, Page, Skeleton, Row, Button} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "shape", desc: "形状", type: "'text' | 'circle' | 'rect'", default: "'text'" },
    { name: "width", desc: "宽度（CSS 长度）", type: "string", default: "'100%'" },
    { name: "height", desc: "高度（CSS 长度）", type: "string", default: "按 shape 默认" },
    { name: "rows", desc: "行数（text 末行自动 60% 宽）", type: "number", default: "1" },
    { name: "animated", desc: "微光动画（尊重 prefers-reduced-motion）", type: "boolean", default: "true" },
  ];

  let loading = $state(true);

  $effect(() => {
    if (!loading) return;
    const t = setTimeout(() => (loading = false), 2500);
    return () => clearTimeout(t);
  });

  const shapeSource = `<script lang="ts">
  import { Skeleton } from "goose-ui";
<\/script>

<div style="display:flex;align-items:center;gap:24px">
  <Skeleton shape="circle" width="48px" height="48px" />
  <Skeleton shape="rect" width="160px" height="96px" />
  <div style="flex:1"><Skeleton shape="text" rows={3} /></div>
</div>`;

  const cardSource = `<script lang="ts">
  import { Skeleton } from "goose-ui";
<\/script>

<div style="display:flex;gap:24px;flex-wrap:wrap">
  <div style="width:240px;border:1px solid var(--border);border-radius:var(--radius-lg);padding:12px">
    <Skeleton shape="rect" height="120px" />
    <div style="margin-top:12px"><Skeleton shape="text" rows={2} /></div>
  </div>
  <div style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:12px">
    {#each [1, 2, 3] as i (i)}
      <div style="display:flex;align-items:center;gap:12px">
        <Skeleton shape="circle" width="32px" height="32px" />
        <div style="flex:1"><Skeleton shape="text" rows={2} /></div>
      </div>
    {/each}
  </div>
</div>`;

  const loadingSource = `<script lang="ts">
  import { Skeleton, Button } from "goose-ui";

  let loading = $state(true);

  $effect(() => {
    if (!loading) return;
    const t = setTimeout(() => (loading = false), 2500);
    return () => clearTimeout(t);
  });
<\/script>

<Button onclick={() => { loading = true; }}>
  重新加载（2.5s 后显示内容）
</Button>
<div style="margin-top:16px;min-height:96px">
  {#if loading}
    <Skeleton shape="text" rows={3} />
  {:else}
    <p style="margin:0;font-size:13px">加载完成：这是真实内容，骨架屏已隐藏。</p>
  {/if}
</div>`;
</script>

<Page title="Skeleton 骨架屏" description="内容加载占位，shimmer 微光动画">
  <CodePreview title="形状" code={shapeSource}>
    <div style="display:flex;align-items:center;gap:24px">
      <Skeleton shape="circle" width="48px" height="48px" />
      <Skeleton shape="rect" width="160px" height="96px" />
      <div style="flex:1"><Skeleton shape="text" rows={3} /></div>
    </div>
  </CodePreview>

  <CodePreview title="卡片骨架 / 列表骨架" code={cardSource}>
    <div style="display:flex;gap:24px;flex-wrap:wrap">
      <div style="width:240px;border:1px solid var(--border);border-radius:var(--radius-lg);padding:12px">
        <Skeleton shape="rect" height="120px" />
        <div style="margin-top:12px"><Skeleton shape="text" rows={2} /></div>
      </div>
      <div style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:12px">
        {#each [1, 2, 3] as i (i)}
          <div style="display:flex;align-items:center;gap:12px">
            <Skeleton shape="circle" width="32px" height="32px" />
            <div style="flex:1"><Skeleton shape="text" rows={2} /></div>
          </div>
        {/each}
      </div>
    </div>
  </CodePreview>

  <CodePreview title="加载 → 内容切换" code={loadingSource}>
    <Row>
      <Button onclick={() => { loading = true; }}>
        重新加载（2.5s 后显示内容）
      </Button>
    </Row>
    <div style="margin-top:16px;min-height:96px">
      {#if loading}
        <Skeleton shape="text" rows={3} />
      {:else}
        <p style="margin:0;font-size:13px">加载完成：这是真实内容，骨架屏已隐藏。</p>
      {/if}
    </div>
  </CodePreview>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
</style>

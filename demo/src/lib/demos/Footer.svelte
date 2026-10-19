<script lang="ts">
  import {Card, Page, Footer} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "border", desc: "顶部描边", type: "boolean", default: "true" },
    { name: "sticky", desc: "吸底（position: sticky）", type: "boolean", default: "false" },
    { name: "copyright", desc: "版权行（居中显示于下方）", type: "string", default: "''" },
    { name: "links", desc: "链接列表", type: "{ label, href?, onclick? }[]", default: "[]" },
    { name: "left", desc: "左侧插槽", type: "Snippet", default: "—" },
    { name: "right", desc: "右侧插槽", type: "Snippet", default: "—" },
    { name: "children", desc: "左侧插槽缺省时的兜底内容", type: "Snippet", default: "—" },
  ];

  const linksSource = `<script lang="ts">
  import { Footer } from "goose-ui";
<\/script>

<Footer
  copyright="© 2026 goose-ui. All rights reserved."
  links={[
    { label: "文档", href: "/docs" },
    { label: "GitHub", href: "https://github.com" },
    { label: "更新日志", onclick: () => console.log("changelog") },
  ]}
>
  {#snippet left()}
    <strong style="font-size:13px">goose-ui</strong>
  {/snippet}
  {#snippet right()}
    <span style="font-size:12px">v0.1.0</span>
  {/snippet}
</Footer>`;

  const stickySource = `<script lang="ts">
  import { Footer } from "goose-ui";
<\/script>

<!-- 父容器需可滚动（如 overflow:auto + 固定高度），sticky 才有意义 -->
<div style="overflow:auto;height:200px">
  <p>滚动内容行 1</p>
  <p>滚动内容行 2</p>

  <Footer sticky border={false} copyright="sticky footer · 滚动时固定在容器底部">
    {#snippet left()}
      <span style="font-size:12px">左侧插槽</span>
    {/snippet}
  </Footer>
</div>`;
</script>

<Page toc title="Footer 页脚" description="页脚容器：左右插槽 + 链接列表 + 版权行">
  <CodePreview anchor="links" anchorLevel={2} title="链接 + 版权" code={linksSource}>
    <div style="border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">
      <div style="padding:24px;background:var(--surface-2);font-size:13px;color:var(--text-muted);min-height:80px">（页面内容区）</div>
      <Footer
        copyright="© 2026 goose-ui. All rights reserved."
        links={[
          { label: "文档", href: "#" },
          { label: "GitHub", href: "#" },
          { label: "更新日志", onclick: () => alert("changelog") },
        ]}
      >
        {#snippet left()}
          <strong style="font-size:13px">goose-ui</strong>
        {/snippet}
        {#snippet right()}
          <span style="font-size:12px">v0.1.0</span>
        {/snippet}
      </Footer>
    </div>
  </CodePreview>

  <CodePreview anchor="sticky-footer" anchorLevel={2} title="吸底页脚（滚动查看）" code={stickySource}>
    <div style="border:1px solid var(--border);border-radius:var(--radius-lg);overflow:auto;height:200px">
      <div style="padding:16px;font-size:13px;color:var(--text-muted)">
        {#each Array.from({ length: 12 }) as _, i (i)}
          <p style="margin:8px 0">滚动内容行 {i + 1}</p>
        {/each}
      </div>
      <Footer sticky border={false} copyright="sticky footer · 滚动时固定在容器底部">
        {#snippet left()}
          <span style="font-size:12px">左侧插槽</span>
        {/snippet}
      </Footer>
    </div>
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={props} />
  </Card>
</Page>

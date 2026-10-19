<script lang="ts">
  import {Card, Page, LinkPreview} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "href", desc: "链接地址", type: "string", default: "''" },
    { name: "title", desc: "预览标题", type: "string", default: "''" },
    { name: "description", desc: "预览描述（最多 3 行）", type: "string", default: "''" },
    { name: "image", desc: "预览图 URL", type: "string", default: "''" },
    { name: "siteName", desc: "站点名（显示在标题上方）", type: "string", default: "''" },
    { name: "disabled", desc: "禁用（不可跳转/不弹预览）", type: "boolean", default: "false" },
    { name: "delay", desc: "悬停延迟 (ms)", type: "number", default: "400" },
    { name: "placement", desc: "预览卡方位", type: "'top' | 'bottom'", default: "'top'" },
    { name: "children", desc: "链接显示内容（snippet）", type: "Snippet", default: "—" },
  ];

  const basicSource = `<script lang="ts">
  import { LinkPreview } from "goose-ui";
<\/script>

<p>
  参考
  <LinkPreview
    href="https://svelte.dev"
    siteName="SVELTE.DEV"
    title="Svelte — Cybernetically enhanced web apps"
    description="Svelte is a UI framework that shifts work into a compile step, producing highly optimized vanilla JavaScript. "
    image="https://svelte.dev/favicon.png"
  >
    Svelte 官方文档
  </LinkPreview>
  了解更多信息。
</p>`;

  const disabledSource = `<script lang="ts">
  import { LinkPreview } from "goose-ui";
<\/script>

<LinkPreview href="https://example.com" title="不会显示" description="disabled 后不触发预览" disabled>
  禁用的链接
</LinkPreview>`;
</script>

<Page toc title="Link Preview 链接预览" description="悬停链接浮出预览卡片（延迟触发、自动翻转、Esc 关闭）">
  <CodePreview anchor="basic" anchorLevel={2} title="基础用法" code={basicSource}>
    <p class="line">
      参考
      <LinkPreview
        href="https://svelte.dev"
        siteName="SVELTE.DEV"
        title="Svelte — Cybernetically enhanced web apps"
        description="Svelte is a UI framework that shifts work into a compile step, producing highly optimized vanilla JavaScript. "
        image="https://svelte.dev/favicon.png"
      >
        Svelte 官方文档
      </LinkPreview>
      了解更多信息，或查看
      <LinkPreview
        href="https://svelte.dev/docs/svelte/overview"
        siteName="DOCS"
        title="Svelte 5 迁移指南"
        description="Runes、$state、$derived、$effect —— Svelte 5 响应式模型全面重写。"
      >
        Svelte 5 文档
      </LinkPreview>。
    </p>
  </CodePreview>

  <CodePreview anchor="disabled" anchorLevel={2} title="禁用" code={disabledSource}>
    <p class="line">
      <LinkPreview href="https://example.com" title="不会显示" description="disabled 后不触发预览" disabled>
        禁用的链接
      </LinkPreview>
    </p>
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={props} />
  </Card>
</Page>

<style>
  .line { font-size: 14px; line-height: 2; color: var(--text); margin: 0; }
</style>

<script lang="ts">
  import {Card, Page, CodeBlock, Notification} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "code", desc: "代码文本", type: "string", default: "''" },
    { name: "language", desc: "语言标签（仅展示，不参与解析）", type: "string", default: "'text'" },
    { name: "showHeader", desc: "显示头部（语言 + 复制）", type: "boolean", default: "true" },
    { name: "copyable", desc: "显示复制按钮", type: "boolean", default: "true" },
    { name: "maxHeight", desc: "内容最大高度（超出滚动）", type: "string", default: "''" },
    { name: "oncopy", desc: "复制结果回调", type: "(ok: boolean) => void", default: "—" },
  ];

  const svelte = `<script lang="ts">
  let count = $state(0);

  function inc() {
    count += 1; // 自增
  }
<\/script>

<button onclick={inc}>点了 {count} 次</button>`;

  const ts = `// 轻量高亮：注释 / 字符串 / 关键字
export function greet(name: string): string {
  const msg = \`hello, \${name}\`; // template string
  if (!name) return "anonymous";
  return msg;
}`;

  const svelteSource = `<script lang="ts">
  import { CodeBlock, Notification } from "goose-ui";

  const code = "let count = 0;";
<\/script>

<CodeBlock code={code} language="svelte" oncopy={(ok) => ok && Notification.success("已复制到剪贴板")} />`;

  const tsSource = `<script lang="ts">
  import { CodeBlock } from "goose-ui";

  const code = "export function greet(name: string): string { return name; }";
<\/script>

<!-- maxHeight 超出后内容区滚动 -->
<CodeBlock code={code} language="ts" maxHeight="200px" />`;

  const plainSource = `<script lang="ts">
  import { CodeBlock } from "goose-ui";
<\/script>

<!-- language="" + showHeader={false}：只渲染代码块本体 -->
<CodeBlock code={'just plain text\\n第二行'} language="" showHeader={false} />`;
</script>

<Page toc title="CodeBlock 代码高亮" description="语言标签 + 一键复制 + 三类轻量高亮（注释/字符串/关键字）">
  <CodePreview anchor="svelte" anchorLevel={2} title="Svelte 示例" code={svelteSource}>
    <CodeBlock code={svelte} language="svelte" oncopy={(ok) => ok && Notification.success("已复制到剪贴板")} />
  </CodePreview>

  <CodePreview anchor="typescript" anchorLevel={2} title="TypeScript 示例 + 限高滚动" code={tsSource}>
    <CodeBlock code={ts} language="ts" maxHeight="200px" />
  </CodePreview>

  <CodePreview anchor="plain" anchorLevel={2} title="无头部 / 不可复制" code={plainSource}>
    <CodeBlock code={'just plain text\n第二行'} language="" showHeader={false} />
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={props} />
  </Card>
</Page>

<script lang="ts">
  import {Card, Page, CodeBlock, Notification} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

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
</script>

<Page title="CodeBlock 代码高亮" description="语言标签 + 一键复制 + 三类轻量高亮（注释/字符串/关键字）">
  <Card title="Svelte 示例">
    <CodeBlock code={svelte} language="svelte" oncopy={(ok) => ok && Notification.success("已复制到剪贴板")} />
  </Card>

  <Card title="TypeScript 示例 + 限高滚动">
    <CodeBlock code={ts} language="ts" maxHeight="200px" />
  </Card>

  <Card title="无头部 / 不可复制">
    <CodeBlock code={'just plain text\n第二行'} language="" showHeader={false} />
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

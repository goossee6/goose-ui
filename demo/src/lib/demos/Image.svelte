<script lang="ts">
  import {Card, Page, Image, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "src", desc: "图片地址", type: "string", default: "''" },
    { name: "alt", desc: "替代文本（加载失败时也作为兜底文案）", type: "string", default: "''" },
    { name: "width", desc: "宽度（CSS 长度）", type: "string", default: "''" },
    { name: "height", desc: "高度（CSS 长度）", type: "string", default: "''" },
    { name: "fit", desc: "object-fit", type: "'cover' | 'contain' | 'fill' | 'none'", default: "'cover'" },
    { name: "rounded", desc: "圆角容器", type: "boolean", default: "false" },
    { name: "preview", desc: "点击放大预览", type: "boolean", default: "true" },
    { name: "lazy", desc: "懒加载", type: "boolean", default: "true" },
    { name: "fallback", desc: "自定义失败占位（snippet）", type: "Snippet", default: "默认图标+alt" },
    { name: "onerror", desc: "加载失败回调", type: "() => void", default: "—" },
  ];

  const ok = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#93c5fd'/><stop offset='1' stop-color='#c4b5fd'/></linearGradient></defs><rect width='320' height='200' fill='url(#g)'/><text x='160' y='105' font-size='16' fill='#1e293b' text-anchor='middle' font-family='sans-serif'>goose-ui demo</text></svg>`
  );
</script>

<Page title="Image 图片" description="图片展示：懒加载、失败兜底、点击放大预览">
  <Card title="基础用法">
    <Row>
      <Image src={ok} alt="渐变示例图" width="240px" height="150px" rounded />
      <Image src={ok} alt="contain" width="240px" height="150px" fit="contain" rounded />
    </Row>
    <p class="note">点击图片放大预览，Esc 或点击遮罩关闭。</p>
  </Card>

  <Card title="加载失败兜底">
    <Row>
      <Image src="/definitely-missing.png" alt="缺失图片" width="200px" height="120px" onerror={() => {}} />
      <Image src="/definitely-missing.png" alt="自定义兜底" width="200px" height="120px">
        {#snippet fallback()}
          <span style="font-size:12px;color:var(--text-muted)">自定义占位内容</span>
        {/snippet}
      </Image>
    </Row>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .note { font-size: 12px; color: var(--text-muted); margin: var(--sp-md) 0 0; }
</style>

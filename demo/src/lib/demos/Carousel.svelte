<script lang="ts">
  import {Card, Page, Carousel, Row, Button, Notification} from "goose-ui";
  import type { CarouselItem } from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "items", desc: "幻灯片数据（src 或 title/desc/color 纯色卡）", type: "CarouselItem[]", default: "[]" },
    { name: "autoplay", desc: "自动播放", type: "boolean", default: "false" },
    { name: "interval", desc: "自动播放间隔（ms）", type: "number", default: "3000" },
    { name: "loop", desc: "首尾循环", type: "boolean", default: "true" },
    { name: "pauseOnHover", desc: "悬停暂停自动播放", type: "boolean", default: "true" },
    { name: "showArrows", desc: "显示左右箭头（hover 浮出）", type: "boolean", default: "true" },
    { name: "showDots", desc: "显示指示点", type: "boolean", default: "true" },
    { name: "onchange", desc: "切换回调", type: "(index: number) => void", default: "—" },
  ];

  const cards: CarouselItem[] = [
    { title: "零第三方依赖", desc: "纯 Svelte 5 + CSS 变量", color: "#dbeafe" },
    { title: "Wails3 友好", desc: "桌面应用场景开箱即用", color: "#dcfce7" },
    { title: "Runes 原生", desc: "$props / $state / $derived", color: "#fef9c3" },
    { title: "主题可换", desc: "theme.css 单文件定制", color: "#fae8ff" },
  ];

  let autoplay = $state(true);
</script>

<Page title="Carousel 轮播图" description="手动/自动切换，悬停暂停，首尾循环">
  <Card title="纯色卡片 + 自动播放">
    <Row>
      <Button size="small" variant={autoplay ? "primary" : "default"} onclick={() => (autoplay = !autoplay)}>
        {autoplay ? "停止自动播放" : "开始自动播放"}
      </Button>
      <span class="note">{autoplay ? "悬停轮播区可暂停" : "手动点击箭头/指示点切换"}</span>
    </Row>
    <div style="margin-top:12px;max-width:520px">
      <Carousel items={cards} autoplay={autoplay} interval={2500} onchange={(i) => {}} />
    </div>
  </Card>

  <Card title="图片模式（不可用时浏览器回退提示）">
    <div style="max-width:520px">
      <Carousel
        items={[
          { src: "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='520' height='200'><rect width='520' height='200' fill='#93c5fd'/><text x='260' y='105' font-size='18' fill='#1e293b' text-anchor='middle' font-family='sans-serif'>Slide 1</text></svg>") },
          { src: "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='520' height='200'><rect width='520' height='200' fill='#c4b5fd'/><text x='260' y='105' font-size='18' fill='#1e293b' text-anchor='middle' font-family='sans-serif'>Slide 2</text></svg>") },
        ]}
        onchange={(i) => Notification.info(`切换到第 ${i + 1} 张`)}
      />
    </div>
  </Card>

  <Card title="Props — CarouselItem">
    <PropsTable
      items={[
        { name: "src", desc: "图片地址（缺省时渲染纯色卡）", type: "string", default: "—" },
        { name: "title", desc: "卡片标题", type: "string", default: "—" },
        { name: "desc", desc: "卡片描述", type: "string", default: "—" },
        { name: "color", desc: "纯色背景（缺省按索引取色）", type: "string", default: "按索引 HSL" },
      ]}
    />
  </Card>
  <Card title="Props — Carousel">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .note { font-size: 12px; color: var(--text-muted); }
</style>

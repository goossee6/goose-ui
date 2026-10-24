<script lang="ts">
  import {Card, Page, Background, Row, Button, Toggle} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "variant", desc: "背景图案", type: "'gradient' | 'grid' | 'dots' | 'noise'", default: "'gradient'" },
    { name: "fixed", desc: "视口固定铺满（position: fixed），用于整页背景", type: "boolean", default: "false" },
    {
      name: "layer",
      desc: "fixed 模式的绘制层：两者都是 z-index:-1、都画在所有内容之下。overlay 额外把网格/点阵底色调半透明，整页背景用这个",
      type: "'behind' | 'overlay'",
      default: "'behind'",
    },
    {
      name: "animated",
      desc: "运动动画：gradient 流光横扫、grid / dots 平移一格、noise 斜纹水平流动（尊重 prefers-reduced-motion）",
      type: "boolean",
      default: "true",
    },
    { name: "opacity", desc: "整体不透明度", type: "number", default: "1" },
    { name: "children", desc: "叠加在背景之上的内容；不传则只渲染背景层", type: "Snippet", default: "—" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式（局部模式下常用 height）", type: "string", default: "''" },
  ];

  const variants = ["gradient", "grid", "dots", "noise"] as const;
  let variant = $state<(typeof variants)[number]>("gradient");
  let animated = $state(true);
  let opacity = $state(0.5);

  // 页面级背景：常驻实例（opacity 归零即不可见），避免开关时重建元素。
  // 默认就打开 —— 这页的演示对象是「整页背景」，一进来就该看得见。
  let pageBg = $state(true);
  // 「悬浮卡片」开关：开着时代码预览卡片加投影，压住下面的图案；关掉即平铺对比。
  let floating = $state(true);

  // .page-bg 上挂类名去控制卡片：不用 :has()，避免「选择器没命中就整页失效、还看不出原因」。
  const pageBgClass = $derived(`page-bg${floating && pageBg ? " page-bg--float" : ""}`);
  const effectiveOpacity = $derived(pageBg ? opacity : 0);

  // 局部容器的用法（不传 fixed、height 自定）已经写在 Props 表里

  const pageSource = `<!-- 整页背景放在 Page 外面，用 absolute 铺满内容区（.layout-content 是 position: relative） -->
<div class="page-bg">
  <Background {variant} {animated} {opacity} layer="overlay" />
</div>

<!-- transparent 让 Page 自己的底色让位；不传则背景被它整块盖住 -->
<Page title="我的页面" transparent>
  …
</Page>`;

  const backdropSource = `.page-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.page-bg > :global(.bg) { position: absolute; inset: 0; }`;

  const switchSource = `<Toggle bind:checked={pageBg} ariaLabel="启用整页背景" />`;
</script>

<!-- 整页背景必须放在 Page 外面、作为 Layout 内容区里的绝对定位层。
     放进 Page 里就会坏：Page 进场动画用 transform 位移，带 transform 的元素
     会成为 position:fixed 的包含块，动画期间背景还算"铺满"，动画一结束
     transform 被移除、包含块变回视口，背景就被 .page-body 的层叠排到下面去了
     —— 表现就是"刷新时闪一下然后消失"。absolute 相对 .layout-content
     定位，它 20px/24px 的内边距就是页面的可视区。 -->
<div class={pageBgClass}>
  <!-- 常驻，不放进 {#if}：opacity 归零即可见性归零，避免每次开关重建元素 -->
  <Background {variant} {animated} opacity={effectiveOpacity} layer="overlay" />
</div>

<Page
  toc
  transparent={pageBg}
  title="Background 背景"
  description="装饰性背景层：渐变光晕 / 网格 / 点阵 / 斜纹，可作为局部容器或整页背景"
>
  <CodePreview anchor="demo" anchorLevel={2} title="整页背景" code={pageSource}>
    <Row>
      <div class="controls">
        {#each variants as v (v)}
          <Button variant={variant === v ? "primary" : "default"} onclick={() => (variant = v)}>{v}</Button>
        {/each}
        <Toggle bind:checked={animated} ariaLabel="动画" />
        <span class="switch-label">动画</span>
      </div>
    </Row>
    <div class="slider-row">
      <span class="slider-label">opacity</span>
      <input class="slider" type="range" min="0" max="1" step="0.01" bind:value={opacity} />
      <span class="slider-val">{opacity.toFixed(2)}</span>
    </div>
    <div class="divider"></div>

    <p class="note">
      上面的按钮直接切换<strong>本页</strong>的背景图案（gradient / grid / dots / noise），
      滑块实时改透明度 —— 整片演示区、目录、卡片都在它之上，照常可读可点。
      「动画」开关控制图案自身的运动：渐变是流光横扫，网格与点阵整块平移，
      斜纹水平流动。
    </p>
    <Row>
      <div class="switch-row">
        <Toggle bind:checked={pageBg} ariaLabel="启用整页背景" />
        <span class="switch-label">启用整页背景（absolute + layer="overlay"）</span>
      </div>
      <div class="switch-row">
        <Toggle bind:checked={floating} ariaLabel="悬浮卡片" disabled={!pageBg} />
        <span class="switch-label">卡片悬浮（压住背景）</span>
      </div>
    </Row>
  </CodePreview>

  <CodePreview anchor="backdrop" anchorLevel={2} title="配套：让底层让位" code={backdropSource}>
    <p class="note">
      整页背景是一个铺满内容区的 <code>absolute</code> 层，本身不占位、不拦鼠标。
      <code>&lt;Page transparent&gt;</code> 让 Page 自己的底色让位，背景才能露出来；
      不给 <code>transparent</code> 的话背景会被 <code>.page-body</code> 整块盖住。
    </p>
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={props} />
  </Card>
</Page>

<style>
  .note { margin: 0; font-size: 13px; line-height: 1.6; color: var(--text-muted); }
  .controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-md); }
  code {
    background: var(--surface-2);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 12px;
    color: var(--primary);
  }
  .opt { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text); }
  .switch-row { display: inline-flex; align-items: center; gap: var(--sp-md); }
  .switch-label { font-size: 13px; color: var(--text); }
  /* 局部容器与整页两段之间的分隔线 */
  .divider {
    height: 1px;
    margin: var(--sp-lg) 0;
    background: var(--border);
  }
  .slider-row {
    display: flex;
    align-items: center;
    gap: var(--sp-md);
    margin-top: var(--sp-lg);
  }
  .slider-label { font-size: 12px; color: var(--text-muted); font-family: var(--font-mono); }
  .slider { flex: 1; max-width: 260px; accent-color: var(--primary); }
  .slider-val {
    min-width: 34px;
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--text-muted);
    text-align: right;
  }
  /* 整页背景层：铺满 Layout 内容区（.layout-content 是 position: relative）。 */
  .page-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .page-bg > :global(.bg) {
    position: absolute;
    inset: 0;
  }
  /* 关键：把 .page 抬成层叠上下文。
     .page-bg 是「定位元素 + z-index:auto」，按 CSS 绘制顺序（Appendix E 第 8 步）
     排在同层所有「非定位」内容之后 —— 也就是说它会盖在 .page 里所有静态内容
     （卡片底、正文、说明文字）之上，只有自带 position 的按钮开关能浮出来。
     给 .page 一个 z-index: 0 让它成为层叠上下文，整棵子树（含静态内容）一起
     画在 .page-bg 之后，背景才真正落在内容下面。 */
  .page-bg ~ :global(.page) {
    position: relative;
    z-index: 0;
  }
  /* 卡片压在背景之上后，再给一层投影把它从图案里「托起来」，层次更清楚。
     只在开着背景时加，关掉开关就回到不投影的平铺观感。 */
  .page-bg--float ~ :global(.page .cp-card) {
    box-shadow: 0 8px 24px -8px rgb(0 0 0 / 0.18);
  }
</style>

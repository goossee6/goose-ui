<script lang="ts">
  import {Card, Page, Background, Row, Button} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "variant", desc: "背景图案", type: "'gradient' | 'grid' | 'dots' | 'noise'", default: "'gradient'" },
    { name: "fixed", desc: "视口固定铺满（z-index: -1）", type: "boolean", default: "false" },
    { name: "animated", desc: "光晕漂移动画（尊重 prefers-reduced-motion）", type: "boolean", default: "true" },
    { name: "opacity", desc: "整体不透明度", type: "number", default: "1" },
    { name: "children", desc: "叠加在背景之上的内容", type: "Snippet", default: "—" },
  ];

  const variants = ["gradient", "grid", "dots", "noise"] as const;
  let variant = $state<(typeof variants)[number]>("gradient");
  let animated = $state(true);
</script>

<Page title="Background 背景" description="装饰性背景层：渐变光晕 / 网格 / 点阵 / 斜纹">
  <Card title="切换变体">
    <Row>
      {#each variants as v (v)}
        <Button variant={variant === v ? "primary" : "default"} onclick={() => (variant = v)}>{v}</Button>
      {/each}
      <label class="opt"><input type="checkbox" bind:checked={animated} /> 动画（仅 gradient）</label>
    </Row>
    <div style="margin-top:16px;border-radius:var(--radius-lg);overflow:hidden;border:1px solid var(--border)">
      <Background {variant} {animated} style="height:240px">
        <div class="inner">
          <p class="title">children 叠加在背景之上</p>
          <p class="sub">variant = {variant} · animated = {animated}</p>
        </div>
      </Background>
    </div>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .opt { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text); }
  .inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 6px;
  }
  .title { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-strong); }
  .sub { margin: 0; font-size: 12px; color: var(--text-muted); font-family: var(--font-mono); }
</style>

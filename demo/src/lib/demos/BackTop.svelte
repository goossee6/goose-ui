<script lang="ts">
  import {Card, Page, BackTop, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "visibilityHeight", desc: "超过该滚动距离才显示", type: "number", default: "200" },
    { name: "duration", desc: "回顶动画时长（ms，easeOutCubic）", type: "number", default: "300" },
    { name: "label", desc: "无障碍标签/提示文案", type: "string", default: "'返回顶部'" },
  ];
</script>

<Page title="BackTop 返回顶部" description="滚动超过阈值后出现，点击平滑回到顶部">
  <Card title="用法说明">
    <p class="note">本页较长，向下滚动后右下角会出现返回顶部按钮。</p>
    <ul class="list">
      <li>监听 window 滚动（passive），超过 <code>visibilityHeight</code> 显示</li>
      <li>点击执行自实现 easeOutCubic 补间（不依赖 CSS scroll-behavior）</li>
      <li>组件卸载自动解绑监听</li>
    </ul>
  </Card>

  <Card title="示例区域">
    {#each Array.from({ length: 24 }) as _, i (i)}
      <p class="row">滚动内容行 {i + 1}</p>
    {/each}
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>

  <BackTop visibilityHeight={240} />
</Page>

<style>
  .note { font-size: 13px; color: var(--text-muted); margin: 0; }
  .list { margin: 8px 0 0; padding-left: 18px; font-size: 13px; color: var(--text-muted); }
  .list li { margin: 4px 0; }
  .row { margin: 8px 0; font-size: 13px; color: var(--text-muted); }
  code { font-family: var(--font-mono); background: var(--surface-2); padding: 1px 5px; border-radius: var(--radius-sm); }
</style>

<script lang="ts">
  import {Card, Page, BackTop} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "visibilityHeight", desc: "超过该滚动距离才显示", type: "number", default: "200" },
    { name: "duration", desc: "回顶动画时长（ms，easeOutCubic）", type: "number", default: "300" },
    { name: "label", desc: "无障碍标签/提示文案", type: "string", default: "'返回顶部'" },
    { name: "target", desc: "滚动容器选择器；缺省自动查找最近可滚动祖先，都没有则回退 window", type: "string", default: "''" },
  ];

  const basicSource = `<script lang="ts">
  import { BackTop } from "goose-ui";
<\/script>

<!-- 滚动容器内直接放一个 BackTop：组件会自动找到最近的可滚动祖先，
     超过 visibilityHeight 后容器右下角出现按钮，点击平滑滚回容器顶部 -->
<div class="scroll-box">
  <p>滚动内容行 1</p>
  <p>滚动内容行 2</p>
  <!-- ... -->
  <p>滚动内容行 24</p>

  <BackTop visibilityHeight={80} />
</div>`;

  const offsetSource = `<script lang="ts">
  import { BackTop } from "goose-ui";
<\/script>

<!-- 更高的触发阈值 + 自定义提示文案 + 更慢的回顶动画 -->
<div class="scroll-box">
  <!-- ... -->
  <BackTop visibilityHeight={200} duration={600} label="回到页首" />
</div>`;

  const pageSource = `<script lang="ts">
  import { BackTop } from "goose-ui";
<\/script>

<!-- 页面级使用：不加 target，组件自动找到页面滚动容器（或回退 window）。
     放在页面任意位置即可，滚动本页超过 240px 后视口右下角出现 -->
<BackTop visibilityHeight={240} />`;
</script>

<Page toc title="BackTop 返回顶部" description="滚动超过阈值后出现，点击平滑回到顶部">
  <CodePreview wide anchor="usage" anchorLevel={2} title="用法说明" code={basicSource}>
    <p class="note">
      按钮始终贴在滚动容器**可见区域**的右下角：滚动容器是元素时贴容器内缘（跟随页面滚动挪动），
      找不到容器回退 window 时贴视口。下面两个示例都把 BackTop 放进了各自的滚动容器里，
      滚动容器内容即可看到按钮出现与回顶动画。
    </p>
    <ul class="list">
      <li>滚动容器监听（passive），超过 <code>visibilityHeight</code> 显示</li>
      <li>点击执行自实现 easeOutCubic 补间（不依赖 CSS scroll-behavior）</li>
      <li>也可用 <code>target</code> 指定滚动容器选择器；都没有则回退 window</li>
      <li>组件卸载自动解绑监听</li>
    </ul>
  </CodePreview>

  <CodePreview wide anchor="demo-area" anchorLevel={2} title="示例区域" code={basicSource}>
    <div class="scroll-box" data-demo-box="basic">
      {#each Array.from({ length: 24 }) as _, i (i)}
        <p class="row">滚动内容行 {i + 1}</p>
      {/each}
      <BackTop visibilityHeight={80} />
    </div>
    <p class="note">向下滚动上方容器超过 80px，容器右下角出现返回顶部按钮；点击后容器平滑滚回顶部。</p>
  </CodePreview>

  <CodePreview wide anchor="offset" anchorLevel={2} title="自定义触发高度与文案" code={offsetSource}>
    <div class="scroll-box" data-demo-box="offset">
      {#each Array.from({ length: 24 }) as _, i (i)}
        <p class="row">滚动内容行 {i + 1}</p>
      {/each}
      <BackTop visibilityHeight={200} duration={600} label="回到页首" />
    </div>
    <p class="note">阈值提高到 200px：多滚一段才出现；提示文案是「回到页首」，回顶动画放慢到 600ms。</p>
  </CodePreview>

  <CodePreview wide anchor="page-level" anchorLevel={2} title="页面级使用" code={pageSource}>
    <p class="note">
      BackTop 也支持页面级：不包在滚动容器里、直接放在页面任意位置，组件会自动找到页面滚动容器（找不到则回退
      window）。滚动页面超过 <code>visibilityHeight</code> 后右下角出现按钮，点击回到页面顶部。
    </p>
    <p class="note">
      按钮贴容器可见右下角而非视口（元素容器时跟随页面滚动挪动），本页没有页面级滚动空间，
      这里只给源码不放实例；
      在普通页面（内容长于视口）中照上面源码使用即可。
    </p>
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={props} />
  </Card>
</Page>

<style>
  .note { font-size: 13px; color: var(--text-muted); margin: 0; }
  .list { margin: 8px 0 0; padding-left: 18px; font-size: 13px; color: var(--text-muted); }
  .list li { margin: 4px 0; }
  .row { margin: 8px 0; font-size: 13px; color: var(--text-muted); }
  code { font-family: var(--font-mono); background: var(--surface-2); padding: 1px 5px; border-radius: var(--radius-sm); }
  /* 自包含滚动演示：BackTop 的 findScroller 从自身向上找第一个真正可滚的祖先，
     会命中这个盒子，按钮出现/回顶都作用在它身上，不依赖页面怎么滚 */
  .scroll-box {
    height: 320px;
    overflow-y: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 4px 16px;
    background: var(--surface);
  }
</style>

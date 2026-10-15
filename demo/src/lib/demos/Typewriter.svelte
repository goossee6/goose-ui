<script lang="ts">
  import {Card, Button, Page, Typewriter, Notification} from "goose-ui";
  import CodePreview from "../CodePreview.svelte";

  let replayTrigger = $state(0);
  let speedReplay = $state(0);
  let noCursorReplay = $state(0);
  let manualReplay = $state(0);
  let doneCount = $state(0);
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const typewriterProps: PropsTableItem[] = [
    { name: "text", desc: "打字文本内容", type: "string", default: "''" },
    { name: "children", desc: "默认插槽（与 text 二选一）", type: "Snippet" },
    { name: "duration", desc: "打字总时长(ms)", type: "number", default: "2000" },
    { name: "speed", desc: "单字符间隔(ms)，不传时按 duration 自动计算", type: "number" },
    { name: "trigger", desc: "触发重播的依赖值，变化时重新播放", type: "unknown" },
    { name: "autoPlay", desc: "挂载后自动播放", type: "boolean", default: "true" },
    { name: "cursor", desc: "显示光标", type: "boolean", default: "true" },
    { name: "onDone", desc: "播放完成回调", type: "() => void" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const defaultSource = `<script lang="ts">
  import { Typewriter, Button } from "goose-ui";

  let replay = $state(0);
<\/script>

<Typewriter text="goose-ui 是一个基于 Svelte 5 的现代 UI 组件库，专注于构建桌面应用界面。" trigger={replay} />
<Button size="small" variant="primary" onclick={() => replay++}>重新播放</Button>`;

  const durationSource = `<script lang="ts">
  import { Typewriter } from "goose-ui";

  let replay = $state(0);
<\/script>

<Typewriter text="这段文字用 4 秒播放完毕，速度会自动适配内容长度。" duration={4000} trigger={replay} />`;

  const speedSource = `<script lang="ts">
  import { Typewriter, Button } from "goose-ui";

  let replay = $state(0);
<\/script>

<Typewriter text="speed 优先于 duration，这里每字符 80ms。" speed={80} trigger={replay} />
<Button size="small" variant="primary" onclick={() => replay++}>重新播放</Button>`;

  const noCursorSource = `<script lang="ts">
  import { Typewriter, Button } from "goose-ui";

  let replay = $state(0);
<\/script>

<Typewriter text="不显示闪烁光标的打字机效果。" cursor={false} trigger={replay} />
<Button size="small" variant="primary" onclick={() => replay++}>重新播放</Button>`;

  const manualSource = `<script lang="ts">
  import { Typewriter, Button } from "goose-ui";

  let replay = $state(0);
<\/script>

<Typewriter text="点击按钮后才开始播放的打字机效果。" autoPlay={false} trigger={replay} />
<Button size="small" variant="primary" onclick={() => replay++}>开始播放</Button>`;

  const onDoneSource = `<script lang="ts">
  import { Typewriter } from "goose-ui";

  let replay = $state(0);
  let doneCount = $state(0);
<\/script>

<Typewriter
  text="播放完毕后会触发 onDone 回调，点击次数已记录。"
  duration={2000}
  trigger={replay}
  onDone={() => {
    doneCount++;
  }}
/>

<p>播放完成次数：{doneCount}</p>`;
</script>

<Page title="打字机 Typewriter" description="逐字显示的打字机效果，支持总时长/每字符速度、光标、手动播放、完成回调" >
  <CodePreview title="默认 duration=2000ms" code={defaultSource}>
    <div class="tw-box">
      <Typewriter text="goose-ui 是一个基于 Svelte 5 的现代 UI 组件库，专注于构建桌面应用界面。" trigger={replayTrigger} />
    </div>
    <div class="demo-row" style="margin-top:12px">
      <Button size="small" variant="primary" onclick={() => replayTrigger++}>重新播放</Button>
    </div>
  </CodePreview>

  <CodePreview title="自定义 duration" code={durationSource}>
    <div class="tw-box">
      <Typewriter text="这段文字用 4 秒播放完毕，速度会自动适配内容长度。" duration={4000} trigger={replayTrigger} />
    </div>
    <p class="hint">duration=4000，总时长 4 秒。</p>
  </CodePreview>

  <CodePreview title="speed 覆盖 duration" code={speedSource}>
    <div class="tw-box">
      <Typewriter text="speed 优先于 duration，这里每字符 80ms。" speed={80} trigger={speedReplay} />
    </div>
    <div class="demo-row" style="margin-top:12px">
      <Button size="small" variant="primary" onclick={() => speedReplay++}>重新播放</Button>
    </div>
    <p class="hint">speed={80}，忽略 duration。</p>
  </CodePreview>

  <CodePreview title="cursor=false 隐藏光标" code={noCursorSource}>
    <div class="tw-box">
      <Typewriter text="不显示闪烁光标的打字机效果。" cursor={false} trigger={noCursorReplay} />
    </div>
    <div class="demo-row" style="margin-top:12px">
      <Button size="small" variant="primary" onclick={() => noCursorReplay++}>重新播放</Button>
    </div>
  </CodePreview>

  <CodePreview title="autoPlay=false 手动触发" code={manualSource}>
    <div class="tw-box">
      <Typewriter text="点击按钮后才开始播放的打字机效果。" autoPlay={false} trigger={manualReplay} />
    </div>
    <div class="demo-row" style="margin-top:12px">
      <Button size="small" variant="primary" onclick={() => manualReplay++}>开始播放</Button>
    </div>
  </CodePreview>

  <CodePreview title="onDone 完成回调" code={onDoneSource}>
    <div class="tw-box">
      <Typewriter
        text="播放完毕后会触发 onDone 回调，点击次数已记录。"
        duration={2000}
        trigger={replayTrigger}
        onDone={() => {
          doneCount++;
          Notification.success(`播放完成 #${doneCount}`);
        }}
      />
    </div>
    <p class="hint">播放完成次数：{doneCount}</p>
  </CodePreview>
  <Card title="Props">
    <PropsTable items={typewriterProps} />
  </Card>
</Page>

<style>
  .tw-box {
    padding: 16px;
    background: var(--surface-2);
    border-radius: var(--radius-lg);
    font-size: 14px;
    line-height: 1.7;
    min-height: 60px;
  }
  .hint {
    font-size: 12px;
    color: var(--text-muted);
    margin: 8px 0 0;
  }
</style>

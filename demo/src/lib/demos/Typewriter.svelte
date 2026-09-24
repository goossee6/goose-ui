<script lang="ts">
  import { Card, Button, PageHeader, Typewriter, Notification } from "goose-ui";

  let replayTrigger = $state(0);
  let speedReplay = $state(0);
  let noCursorReplay = $state(0);
  let manualReplay = $state(0);
  let doneCount = $state(0);
</script>

<PageHeader title="打字机 Typewriter" description="逐字显示的打字机效果，支持总时长/每字符速度、光标、手动播放、完成回调" />

<div class="demo-grid">
  <Card title="默认 duration=2000ms">
    <div class="tw-box">
      <Typewriter text="goose-ui 是一个基于 Svelte 5 的现代 UI 组件库，专注于构建桌面应用界面。" trigger={replayTrigger} />
    </div>
    <div class="demo-row" style="margin-top:12px">
      <Button size="small" variant="primary" onclick={() => replayTrigger++}>重新播放</Button>
    </div>
  </Card>

  <Card title="自定义 duration">
    <div class="tw-box">
      <Typewriter text="这段文字用 4 秒播放完毕，速度会自动适配内容长度。" duration={4000} trigger={replayTrigger} />
    </div>
    <p class="hint">duration=4000，总时长 4 秒。</p>
  </Card>

  <Card title="speed 覆盖 duration">
    <div class="tw-box">
      <Typewriter text="speed 优先于 duration，这里每字符 80ms。" speed={80} trigger={speedReplay} />
    </div>
    <div class="demo-row" style="margin-top:12px">
      <Button size="small" variant="primary" onclick={() => speedReplay++}>重新播放</Button>
    </div>
    <p class="hint">speed={80}，忽略 duration。</p>
  </Card>

  <Card title="cursor=false 隐藏光标">
    <div class="tw-box">
      <Typewriter text="不显示闪烁光标的打字机效果。" cursor={false} trigger={noCursorReplay} />
    </div>
    <div class="demo-row" style="margin-top:12px">
      <Button size="small" variant="primary" onclick={() => noCursorReplay++}>重新播放</Button>
    </div>
  </Card>

  <Card title="autoPlay=false 手动触发">
    <div class="tw-box">
      <Typewriter text="点击按钮后才开始播放的打字机效果。" autoPlay={false} trigger={manualReplay} />
    </div>
    <div class="demo-row" style="margin-top:12px">
      <Button size="small" variant="primary" onclick={() => manualReplay++}>开始播放</Button>
    </div>
  </Card>

  <Card title="onDone 完成回调">
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
  </Card>
</div>

<style>
  .demo-grid {
    display: flex;
    flex-direction: column;
    gap: var(--gap-2xl);
  }
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

<script lang="ts">
  import { Card, ProgressBar, ProgressBytes, ProgressSlotBar, UsageBar, Button, PageHeader, Notification } from 'goose-ui';

  let percent = $state(35);
  let bytesProgress = $state(42);
  let slotLoaded = $state(300);

  const fileSize = 1024 * 1024 * 8; // 8 MB

  let timer: ReturnType<typeof setInterval> | null = null;

  function startBytesSim() {
    if (timer) clearInterval(timer);
    bytesProgress = 0;
    timer = setInterval(() => {
      bytesProgress += Math.random() * 5;
      if (bytesProgress >= 100) {
        bytesProgress = 100;
        if (timer) { clearInterval(timer); timer = null; }
        Notification.success('上传完成');
      }
    }, 300);
  }

  function startSlotSim() {
    slotLoaded = 0;
    const id = setInterval(() => {
      slotLoaded += 200 * 1024;
      if (slotLoaded >= 1024 * 1024 * 2) { slotLoaded = 1024 * 1024 * 2; clearInterval(id); Notification.success('分片上传完成'); }
    }, 200);
  }
</script>

<PageHeader title="进度条 Progress" description="通用进度条、字节级上传进度、分片进度、用量配额条" />

<div class="demo-grid">
  <Card title="基础进度条 ProgressBar">
    <div style="display:flex;flex-direction:column;gap:16px">
      <ProgressBar percent={percent} />
      <div style="display:flex;gap:8px;align-items:center">
        <Button size="small" onclick={() => { percent = Math.max(0, percent - 10); Notification.success('进度减少 10%'); }}>-10</Button>
        <Button size="small" onclick={() => { percent = Math.min(100, percent + 10); Notification.success('进度增加 10%'); }}>+10</Button>
        <span class="demo-val">{percent}%</span>
      </div>
      <ProgressBar percent={0} />
      <ProgressBar percent={50} />
      <ProgressBar percent={100} />
    </div>
  </Card>

  <Card title="字节进度 ProgressBytes">
    <div style="display:flex;flex-direction:column;gap:12px">
      <ProgressBytes
        fileName="goose-ui-v0.1.0.zip"
        progress={Math.round(bytesProgress)}
        speed="1.2 MB/s"
        eta="12s"
        loadedBytes={Math.round(fileSize * bytesProgress / 100)}
        totalBytes={fileSize}
        onCancel={() => Notification.error('上传已取消')}
      />
      <div>
        <Button size="small" variant="primary" onclick={startBytesSim}>模拟上传</Button>
      </div>
    </div>
  </Card>

  <Card title="分片进度 ProgressBytes (multipart)">
    <div>
      <ProgressBytes
        fileName="large-video.mp4"
        progress={67}
        speed="3.4 MB/s"
        eta="45s"
        loadedBytes={1024 * 1024 * 670}
        totalBytes={1024 * 1024 * 1000}
        totalParts={20}
        partIndex={13}
      />
    </div>
  </Card>

  <Card title="分片槽进度 ProgressSlotBar">
    <div style="display:flex;flex-direction:column;gap:12px">
      <ProgressSlotBar part={3} total={10} loaded={slotLoaded} totalSize={1024 * 1024 * 2} />
      <div>
        <Button size="small" variant="primary" onclick={startSlotSim}>模拟分片</Button>
      </div>
    </div>
  </Card>

  <Card title="用量条 UsageBar">
    <div style="display:flex;flex-direction:column;gap:20px">
      <UsageBar label="存储空间" value={2.4} limit={10} formatValue={(n) => `${n} GB`} />
      <UsageBar label="API 调用次数" value={8500} limit={10000} />
      <UsageBar label="已超额度" value={120} limit={100} />
      <UsageBar label="接近上限" value={88} limit={100} />
    </div>
  </Card>

  <Card title="自定义高度与右侧插槽">
    <div style="display:flex;flex-direction:column;gap:20px">
      <UsageBar label="自定义高度 (12px)" value={45} limit={100} barHeight="12px" />
      {#snippet customLabelRight({ value, limit, formatValue }: { value: number; limit: number; percent: number; overQuota: boolean; formatValue: (n: number) => string })}
        {limit - value} 次剩余
      {/snippet}
      <UsageBar label="自定义右侧" value={7} limit={10} labelRight={customLabelRight} />
    </div>
  </Card>
</div>

<style>
  .demo-grid { display: flex; flex-direction: column; gap: var(--gap-2xl); }
  .demo-val { font-size: 13px; color: var(--text-muted); }
</style>
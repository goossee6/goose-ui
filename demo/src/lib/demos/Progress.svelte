<script lang="ts">
  import {Card, ProgressBar, ProgressBytes, ProgressSlotBar, UsageBar, Button, Page, Notification} from "goose-ui";

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
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const progressBarProps: PropsTableItem[] = [
    { name: "percent", desc: "进度百分比 0-100", type: "number", default: "0" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const progressBytesProps: PropsTableItem[] = [
    { name: "fileName", desc: "文件名", type: "string", default: "''" },
    { name: "progress", desc: "进度百分比 0-100", type: "number", default: "0" },
    { name: "speed", desc: "速度文案", type: "string", default: "''" },
    { name: "eta", desc: "预计剩余时间文案", type: "string", default: "''" },
    { name: "loadedBytes", desc: "已传输字节数", type: "number", default: "0" },
    { name: "totalBytes", desc: "总字节数", type: "number", default: "0" },
    { name: "totalParts", desc: "分片总数", type: "number", default: "0" },
    { name: "partIndex", desc: "当前完成分片序号", type: "number", default: "0" },
    { name: "onCancel", desc: "取消回调（提供时显示取消按钮）", type: "() => void" },
    { name: "disabled", desc: "禁用取消按钮", type: "boolean", default: "false" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const progressSlotBarProps: PropsTableItem[] = [
    { name: "number", desc: "任务编号", type: "number", default: "0" },
    { name: "part", desc: "当前分片序号", type: "number" },
    { name: "total", desc: "总分片数", type: "number", default: "0" },
    { name: "loaded", desc: "已完成数量", type: "number", default: "0" },
    { name: "totalSize", desc: "总大小(bytes)", type: "number", default: "0" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const usageBarProps: PropsTableItem[] = [
    { name: "label", desc: "左侧标签", type: "string", default: "''" },
    { name: "value", desc: "当前用量", type: "number", default: "0" },
    { name: "limit", desc: "配额上限（0 时不计算百分比）", type: "number", default: "0" },
    { name: "used", desc: "别名：优先于 value", type: "number" },
    { name: "total", desc: "别名：优先于 limit", type: "number" },
    { name: "formatValue", desc: "数值格式化函数", type: "(n: number) => string", default: "formatNum" },
    { name: "barHeight", desc: "进度条高度", type: "string", default: "'6px'" },
    { name: "labelRight", desc: "右侧自定义内容插槽，参数 { value, limit, percent, overQuota, formatValue }", type: "Snippet<[...]>" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];
</script>

<Page title="进度条 Progress" description="通用进度条、字节级上传进度、分片进度、用量配额条" >
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
  <Card title="ProgressBar Props">
    <PropsTable items={progressBarProps} />
  </Card>

  <Card title="ProgressBytes Props">
    <PropsTable items={progressBytesProps} />
  </Card>

  <Card title="ProgressSlotBar Props">
    <PropsTable items={progressSlotBarProps} />
  </Card>

  <Card title="UsageBar Props">
    <PropsTable items={usageBarProps} />
  </Card>
</Page>

<style>
  .demo-val { font-size: 13px; color: var(--text-muted); }
</style>
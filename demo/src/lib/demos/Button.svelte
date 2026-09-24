<script lang="ts">
  import { Button, Card, PageHeader, Notification, ThemeToggle } from "goose-ui";
  import { Zap, Heart, ExternalLink } from "@lucide/svelte";

  let loading = $state(false);

  function simulateLoading() {
    loading = true;
    setTimeout(() => {
      loading = false;
      Notification.success("加载完成");
    }, 1500);
  }
</script>

<PageHeader title="按钮 Button" description="五种变体、多种尺寸、loading 状态、左右图标" />

<div class="demo-grid">
  <Card title="变体 Variants">
    <div class="demo-row">
      <Button variant="primary" onclick={() => Notification.success("Primary 被点击")}>Primary 主要</Button>
      <Button onclick={() => Notification.success("Default 被点击")}>Default 默认</Button>
      <Button variant="ghost" onclick={() => Notification.success("Ghost 被点击")}>Ghost 幽灵</Button>
      <Button variant="danger" onclick={() => Notification.error("Danger 被点击")}>Danger 危险</Button>
      <Button variant="link" onclick={() => Notification.success("Link 被点击")}>Link 链接</Button>
    </div>
  </Card>

  <Card title="尺寸 Sizes">
    <div class="demo-row">
      <Button size="small" onclick={() => Notification.success("small 按钮被点击")}>small</Button>
      <Button onclick={() => Notification.success("middle 按钮被点击")}>middle (默认)</Button>
      <Button size="large" onclick={() => Notification.success("large 按钮被点击")}>large</Button>
      <Button size={40} onclick={() => Notification.success("size=40 按钮被点击")}>size=40</Button>
    </div>
  </Card>

  <Card title="图标按钮 Icon Buttons">
    <div class="demo-row">
      <Button size="icon-sm" icon={Heart} ariaLabel="icon-sm" onclick={() => Notification.success("icon-sm 被点击")} />
      <Button size="icon" icon={Heart} ariaLabel="icon" onclick={() => Notification.success("icon 被点击")} />
      <Button size="icon-lg" icon={Heart} ariaLabel="icon-lg" onclick={() => Notification.success("icon-lg 被点击")} />
    </div>
  </Card>

  <Card title="带图标 With Icons">
    <div class="demo-row">
      <Button icon={Zap} onclick={() => Notification.success("左侧图标被点击")}>左侧图标</Button>
      <Button iconRight={ExternalLink} onclick={() => Notification.success("右侧图标被点击")}>右侧图标</Button>
      <Button icon={Heart} iconRight={ExternalLink} onclick={() => Notification.success("左右图标被点击")}>左右图标</Button>
    </div>
  </Card>

  <Card title="Loading 加载状态">
    <div class="demo-row">
      <Button {loading} onclick={simulateLoading}>
        {loading ? "处理中…" : "点击加载"}
      </Button>
      <Button loading={true}>持续加载中</Button>
      <Button loading={true} icon={Zap}>带图标加载中</Button>
    </div>
    <p class="hint">loading 状态最少显示 1000ms，避免快速闪烁。</p>
  </Card>

  <Card title="Disabled 禁用">
    <div class="demo-row">
      <Button disabled>Primary 禁用</Button>
      <Button disabled>Default 禁用</Button>
      <Button variant="danger" disabled>Danger 禁用</Button>
      <Button variant="ghost" disabled>Ghost 禁用</Button>
    </div>
  </Card>

  <Card title="主题切换">
    <div class="demo-row">
      <ThemeToggle />
    </div>
  </Card>
</div>

<style>
  .demo-grid {
    display: flex;
    flex-direction: column;
    gap: var(--gap-2xl);
  }
  .demo-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--gap-md);
  }
  .hint {
    font-size: 12px;
    color: var(--text-muted);
    margin: 10px 0 0;
  }
</style>

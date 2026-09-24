<script lang="ts">
  import { Card, Button, Drawer, PageHeader } from "goose-ui";

  let rightOpen = $state(false);
  let leftOpen = $state(false);
  let topOpen = $state(false);
  let bottomOpen = $state(false);
  let wideOpen = $state(false);
  let noMaskOpen = $state(false);
  let customFooterOpen = $state(false);
  let noPushOpen = $state(false);
</script>

<PageHeader title="抽屉 Drawer" description="侧边/上下抽屉组件，支持四种方向、遮罩关闭、背景下沉" />

<div class="demo-grid">
  <Card title="四个方向 placement">
    <div class="demo-row">
      <Button variant="primary" onclick={() => (rightOpen = true)}>右侧抽屉 (默认)</Button>
      <Button onclick={() => (leftOpen = true)}>左侧</Button>
      <Button onclick={() => (topOpen = true)}>顶部</Button>
      <Button onclick={() => (bottomOpen = true)}>底部</Button>

      <Drawer bind:open={rightOpen} title="右侧抽屉" maskClosable>
        <p>这是从右侧滑出的抽屉内容。</p>
        <p class="muted">默认宽度 378px，点击遮罩或按 Esc 可关闭。</p>
      </Drawer>
      <Drawer bind:open={leftOpen} title="左侧抽屉" placement="left" maskClosable>
        <p>从左侧滑出的抽屉，点击遮罩关闭。</p>
      </Drawer>
      <Drawer bind:open={topOpen} title="顶部抽屉" placement="top" height={200} maskClosable>
        <p>从顶部滑出的抽屉，高度 200px，点击遮罩关闭。</p>
      </Drawer>
      <Drawer bind:open={bottomOpen} title="底部抽屉" placement="bottom" height={200} maskClosable>
        <p>从底部滑出的抽屉，高度 200px，点击遮罩关闭。</p>
      </Drawer>
    </div>
  </Card>

  <Card title="自定义宽度 / 高度">
    <div class="demo-row">
      <Button onclick={() => (wideOpen = true)}>宽抽屉 (600px)</Button>
      <Drawer bind:open={wideOpen} title="宽抽屉" width={600} maskClosable>
        <p>通过 <code>width</code> 属性设置宽度为 600px。</p>
        <p>传数字按 px 处理，也可以传 CSS 字符串如 "80vw"。</p>
      </Drawer>
    </div>
  </Card>

  <Card title="点击遮罩不关闭">
    <div class="demo-row">
      <Button onclick={() => (noMaskOpen = true)}>遮罩不可关闭</Button>
      <Drawer bind:open={noMaskOpen} title="遮罩不可关闭" maskClosable={false}>
        <p>设置 <code>maskClosable=false</code>，点击遮罩不会关闭。</p>
        <p>只能通过右上角 X 按钮或按 Esc 关闭。</p>
      </Drawer>
    </div>
  </Card>

  <Card title="关闭景深">
    <div class="demo-row">
      <Button onclick={() => (noPushOpen = true)}>关闭景深</Button>
      <Drawer bind:open={noPushOpen} title="关闭景深" maskClosable pushBackground={false}>
        <p>设置 <code>pushBackground=false</code>，背景不会产生缩放和模糊景深效果。</p>
        <p>点击遮罩仍然可以关闭。</p>
      </Drawer>
    </div>
  </Card>

  <Card title="自定义 Footer">
    <div class="demo-row">
      <Button onclick={() => (customFooterOpen = true)}>自定义底部</Button>
      <Drawer bind:open={customFooterOpen} title="自定义 Footer" maskClosable footer={customFooter}>
        <p>通过 <code>footer</code> 插槽自定义底部区域。</p>
        <p>点击遮罩仍然可以关闭。</p>
      </Drawer>
    </div>
  </Card>
</div>

{#snippet customFooter()}
  <Button variant="ghost" onclick={() => (customFooterOpen = false)}>取消</Button>
  <Button variant="primary" onclick={() => (customFooterOpen = false)}>确定</Button>
{/snippet}

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
  p {
    margin: 0 0 10px;
    line-height: 1.6;
    color: var(--text);
  }
  p:last-child {
    margin-bottom: 0;
  }
  .muted {
    color: var(--text-muted);
    font-size: 13px;
  }
  code {
    background: var(--surface-2);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--primary);
  }
</style>

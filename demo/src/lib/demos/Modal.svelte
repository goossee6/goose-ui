<script lang="ts">
  import { Card, Button, Modal, PageHeader, Notification, pushError } from 'goose-ui';

  let modalOpen = $state(false);
  let maskModalOpen = $state(false);
  let noCloseModalOpen = $state(false);
  let customFooterModalOpen = $state(false);
  let wideModalOpen = $state(false);
  let snippetTitleModalOpen = $state(false);
  let noMaskModalOpen = $state(false);
</script>

<PageHeader title="模态框 Modal" description="遮罩层、多种关闭策略、自定义 footer、宽度可配" />

<div class="demo-grid">
  <Card title="基础模态框">
    <div class="demo-row">
      <Button variant="primary" onclick={() => { modalOpen = true; }}>打开模态框</Button>
      <Modal bind:open={modalOpen} title="基础模态框">
        <p>这是一个标准模态框。</p>
        <p class="muted">默认隐藏关闭按钮？不 —— 默认显示 X，且默认 footer 是「取消 / 确定」。</p>
      </Modal>
    </div>
  </Card>

  <Card title="点击遮罩关闭 maskClosable">
    <div class="demo-row">
      <Button variant="primary" onclick={() => { maskModalOpen = true; }}>点击遮罩可关闭</Button>
      <Modal bind:open={maskModalOpen} title="遮罩可关闭" maskClosable={true}>
        <p>点击背景遮罩即可关闭此模态框（默认 maskClosable=false，只能通过按钮或 Esc 关闭）。</p>
      </Modal>
    </div>
  </Card>

  <Card title="无关闭按钮 disableClose">
    <div class="demo-row">
      <Button variant="primary" onclick={() => { noCloseModalOpen = true; }}>无 X 按钮</Button>
      <Modal bind:open={noCloseModalOpen} title="无关闭按钮" disableClose={true}>
        <p>隐藏右上角 X 按钮，Esc 键也不会关闭，只能用 footer 的按钮关掉。</p>
      </Modal>
    </div>
  </Card>

  <Card title="自定义 Footer">
    <div class="demo-row">
      <Button variant="primary" onclick={() => { customFooterModalOpen = true; }}>自定义底部</Button>
      <Modal bind:open={customFooterModalOpen} title="自定义 Footer" footer={customFooter}>
        <p>这个模态框替换了默认的「取消 / 确定」，改为三个自定义按钮。</p>
      </Modal>
    </div>
  </Card>

  <Card title="自定义宽度">
    <div class="demo-row">
      <Button variant="primary" onclick={() => { wideModalOpen = true; }}>宽模态框 (800px)</Button>
      <Modal bind:open={wideModalOpen} title="宽模态框" width={800}>
        <p>通过 <code>width</code> 属性自定义宽度，默认为 520。</p>
        <p class="muted">传数字按 px 处理，也可以传 CSS 字符串，如 "80vw"。</p>
      </Modal>
    </div>
  </Card>

  <Card title="富文本标题 + 内容">
    <div class="demo-row">
      <Button variant="primary" onclick={() => { snippetTitleModalOpen = true; }}>富文本演示</Button>
      <Modal bind:open={snippetTitleModalOpen} title={richTitle}>
        <p>title 支持 <b>Snippet</b> 或字符串直接写 HTML 渲染富文本。</p>
        <p>内容区域同样支持 <strong>HTML 标签</strong>，如 <em>斜体</em>、<u>下划线</u>、<s>删除线</s>、<span style="color:var(--primary)">自定义颜色</span>、<mark>高亮</mark> 等。</p>
        <p>也可以嵌套，如 <b><i><span style="color:var(--danger)">粗斜体红色</span></i></b>。</p>
        <p class="muted">打字机模式下会保留 HTML 结构，逐字揭示时标签完整跳过。</p>
      </Modal>
    </div>
  </Card>

  <Card title="浅色遮罩 mask='light'">
    <div class="demo-row">
      <Button variant="primary" onclick={() => { noMaskModalOpen = true; }}>浅色遮罩</Button>
      <Modal bind:open={noMaskModalOpen} title="浅色遮罩" mask="light" typewriter={false}>
        <p>使用半透明白色遮罩，视觉更轻量。</p>
        <p class="muted">适合不需要强遮挡的场景。</p>
      </Modal>
    </div>
  </Card>

  <Card title="ErrorDialog 错误收集弹窗">
    <p class="muted" style="margin-bottom:12px">自动收集运行时错误，支持列表堆叠、单项复制、复制全部。</p>
    <div class="demo-row">
      <Button
        variant="danger"
        onclick={() => pushError('网络请求失败', new Error('Failed to fetch: net::ERR_CONNECTION_REFUSED'))}
      >
        模拟网络错误
      </Button>
      <Button
        variant="danger"
        onclick={() => pushError('解析错误', 'JSON 格式无效：第 12 行缺少逗号')}
      >
        模拟解析错误
      </Button>
      <Button
        variant="danger"
        onclick={() => {
          pushError('权限不足', new Error('403 Forbidden: /api/admin/users'));
          pushError('请求超时', new Error('TimeoutError: /api/data exceeded 30s'));
          pushError('服务不可用', new Error('503 Service Unavailable'));
        }}
      >
        模拟多个错误
      </Button>
    </div>
  </Card>
</div>

{#snippet customFooter()}
  <Button variant="ghost" onclick={() => { customFooterModalOpen = false; Notification.success('已返回'); }}>返回</Button>
  <Button variant="primary" onclick={() => { Notification.success('已保存'); customFooterModalOpen = false }}>保存</Button>
  <Button variant="danger" onclick={() => { Notification.error('已删除'); customFooterModalOpen = false }}>删除</Button>
{/snippet}

{#snippet richTitle()}
  <span style="display:flex;align-items:center;gap:8px">
    <b>富文本</b>标题
    <span style="font-size:11px;font-weight:500;padding:2px 6px;border-radius:4px;background:var(--primary-soft);color:var(--primary)">Snippet</span>
    <span style="font-size:11px;font-weight:500;padding:2px 6px;border-radius:4px;background:var(--success-bg);color:var(--success-text)">支持 HTML</span>
  </span>
{/snippet}

<style>
  .demo-grid { display: flex; flex-direction: column; gap: var(--gap-2xl); }
  .demo-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--gap-md);
  }
  p { margin: 0 0 10px; line-height: 1.6; color: var(--text); }
  p:last-child { margin-bottom: 0; }
  .muted { color: var(--text-muted); font-size: 13px; }
  code {
    background: var(--surface-2);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--primary);
  }
</style>

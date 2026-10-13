<script lang="ts">
  import {Card, Button, Modal, Page, Notification, pushError, Row, showConfirm, AlertDialog} from "goose-ui";

  let modalOpen = $state(false);
  let maskModalOpen = $state(false);
  let noCloseModalOpen = $state(false);
  let customFooterModalOpen = $state(false);
  let wideModalOpen = $state(false);
  let snippetTitleModalOpen = $state(false);
  let noMaskModalOpen = $state(false);
  let noBlurOpen = $state(false);
  let lightNoBlurOpen = $state(false);
  let confirmLikeOpen = $state(false);
  let preventCloseOpen = $state(false);
  let asyncOkOpen = $state(false);
  let noFooterOpen = $state(false);

  const confirmProps: PropsTableItem[] = [
    { name: "message", desc: "确认框正文（必填）", type: "string" },
    { name: "title", desc: "标题", type: "string", default: "'确认'" },
    { name: "confirmText", desc: "确认按钮文案", type: "string", default: "'确定'" },
    { name: "cancelText", desc: "取消按钮文案", type: "string", default: "'取消'" },
    { name: "danger", desc: "确认按钮使用危险色（danger）", type: "boolean", default: "false" },
    { name: "返回值", desc: "Promise<boolean>：确认为 true，取消/关闭为 false；支持 await", type: "Promise<boolean>" },
  ];

  async function basicConfirm() {
    const ok = await showConfirm("确定要执行此操作吗？");
    Notification[ok ? "success" : "info"](ok ? "已确认（返回 true）" : "已取消（返回 false）");
  }

  async function dangerConfirm() {
    const ok = await showConfirm("此操作不可撤销，确定要删除全部数据吗？", {
      confirmText: "删除",
      danger: true,
    });
    Notification[ok ? "success" : "info"](ok ? "已删除" : "已放弃删除");
  }

  async function customConfirm() {
    const ok = await showConfirm("要重启服务吗？重启期间服务将短暂不可用。", {
      title: "重启服务",
      confirmText: "重启",
      cancelText: "稍后再说",
    });
    Notification[ok ? "success" : "info"](ok ? "已触发重启" : "已推迟");
  }

  const alertdialogProps: PropsTableItem[] = [
    { name: "open", desc: "显示状态（双向绑定）", type: "boolean", default: "false" },
    { name: "title", desc: "标题", type: "string", default: "'确认操作'" },
    { name: "description", desc: "描述文案", type: "string", default: "''" },
    { name: "cancelText", desc: "取消按钮文案", type: "string", default: "'取消'" },
    { name: "confirmText", desc: "确认按钮文案", type: "string", default: "'确定'" },
    { name: "danger", desc: "确认按钮危险色", type: "boolean", default: "false" },
    { name: "loading", desc: "确认中（禁用按钮）", type: "boolean", default: "false" },
    { name: "onCancel", desc: "取消回调", type: "() => void", default: "—" },
    { name: "onConfirm", desc: "确认回调（需自行收起）", type: "() => void", default: "—" },
    { name: "content", desc: "自定义内容（snippet）", type: "Snippet", default: "—" },
  ];

  let adBasicOpen = $state(false);
  let adDangerOpen = $state(false);
  let adLoadingOpen = $state(false);
  let adLoading = $state(false);

  async function adConfirmLoading() {
    adLoading = true;
    await new Promise((r) => setTimeout(r, 1500));
    adLoading = false;
    adLoadingOpen = false;
    Notification.success('操作完成');
  }
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const modalProps: PropsTableItem[] = [
    { name: "open", desc: "是否打开（可双向绑定）", type: "boolean", default: "false" },
    { name: "title", desc: "标题，为空时不渲染标题栏", type: "string | Snippet" },
    { name: "subtitle", desc: "副标题", type: "string | Snippet" },
    { name: "width", desc: "宽度", type: "number | string", default: "520" },
    { name: "mask", desc: "遮罩风格", type: "'dark' | 'light'", default: "'dark'" },
    { name: "blur", desc: "遮罩背景模糊，与 mask 独立组合", type: "boolean", default: "true" },
    { name: "modeless", desc: "非模态：无遮罩变暗，点击穿透到页面", type: "boolean", default: "false" },
    { name: "maskClosable", desc: "点击遮罩是否关闭", type: "boolean", default: "false" },
    { name: "disableClose", desc: "禁用标题栏关闭按钮", type: "boolean", default: "false" },
    { name: "typewriter", desc: "正文打字机效果（默认关闭，显式设置才启用）", type: "boolean", default: "false" },
    { name: "typewriterDuration", desc: "打字总时长(ms)", type: "number", default: "1500" },
    { name: "okText", desc: "确认按钮文案", type: "string", default: "'确定'" },
    { name: "cancelText", desc: "取消按钮文案", type: "string", default: "'取消'" },
    { name: "showOk", desc: "显示确认按钮", type: "boolean", default: "true" },
    { name: "showCancel", desc: "显示取消按钮", type: "boolean", default: "true" },
    { name: "showFooter", desc: "显示默认底部栏（自定义 footer 插槽时忽略）", type: "boolean", default: "true" },
    { name: "okDisabled", desc: "禁用确认按钮", type: "boolean", default: "false" },
    { name: "onOk", desc: "确认回调，返回 false 或抛错保持打开；async 期间显示“处理中…”", type: "() => void | boolean | Promise<void | boolean>" },
    { name: "onCancel", desc: "取消回调（取消按钮/X/Esc/遮罩）", type: "() => void" },
    { name: "onClose", desc: "任何关闭方式都会触发", type: "() => void" },
    { name: "footer", desc: "自定义底部插槽（优先于默认按钮）", type: "Snippet" },
    { name: "children", desc: "正文内容", type: "Snippet" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];
</script>

<Page title="模态框 Modal" description="遮罩层、多种关闭策略、自定义 footer、回调接口、宽度可配；命令式 Confirm（await showConfirm）与声明式 AlertDialog 确认框" >
  <Card title="基础模态框">
    <Row>
      <Button variant="primary" onclick={() => { modalOpen = true; }}>打开模态框</Button>
      <Modal bind:open={modalOpen} title="基础模态框">
        <p>这是一个标准模态框。</p>
        <p class="muted">默认隐藏关闭按钮？不 —— 默认显示 X，且默认 footer 是「取消 / 确定」。</p>
      </Modal>
    </Row>
  </Card>

  <Card title="点击遮罩关闭 maskClosable">
    <Row>
      <Button variant="primary" onclick={() => { maskModalOpen = true; }}>点击遮罩可关闭</Button>
      <Modal bind:open={maskModalOpen} title="遮罩可关闭" maskClosable={true}>
        <p>点击背景遮罩即可关闭此模态框（默认 maskClosable=false，只能通过按钮或 Esc 关闭）。</p>
      </Modal>
    </Row>
  </Card>

  <Card title="无关闭按钮 disableClose">
    <Row>
      <Button variant="primary" onclick={() => { noCloseModalOpen = true; }}>无 X 按钮</Button>
      <Modal bind:open={noCloseModalOpen} title="无关闭按钮" disableClose={true}>
        <p>隐藏右上角 X 按钮，Esc 键也不会关闭，只能用 footer 的按钮关掉。</p>
      </Modal>
    </Row>
  </Card>

  <Card title="自定义 Footer">
    <Row>
      <Button variant="primary" onclick={() => { customFooterModalOpen = true; }}>自定义底部</Button>
      <Modal bind:open={customFooterModalOpen} title="自定义 Footer" footer={customFooter}>
        <p>这个模态框替换了默认的「取消 / 确定」，改为三个自定义按钮。</p>
      </Modal>
    </Row>
  </Card>

  <Card title="自定义宽度">
    <Row>
      <Button variant="primary" onclick={() => { wideModalOpen = true; }}>宽模态框 (800px)</Button>
      <Modal bind:open={wideModalOpen} title="宽模态框" width={800}>
        <p>通过 <code>width</code> 属性自定义宽度，默认为 520。</p>
        <p class="muted">传数字按 px 处理，也可以传 CSS 字符串，如 "80vw"。</p>
      </Modal>
    </Row>
  </Card>

  <Card title="富文本标题 + 内容">
    <Row>
      <Button variant="primary" onclick={() => { snippetTitleModalOpen = true; }}>富文本演示</Button>
      <Modal bind:open={snippetTitleModalOpen} title={richTitle} typewriter={true}>
        <p>title 支持 <b>Snippet</b> 或字符串直接写 HTML 渲染富文本。</p>
        <p>内容区域同样支持 <strong>HTML 标签</strong>，如 <em>斜体</em>、<u>下划线</u>、<s>删除线</s>、<span style="color:var(--primary)">自定义颜色</span>、<mark>高亮</mark> 等。</p>
        <p>也可以嵌套，如 <b><i><span style="color:var(--danger)">粗斜体红色</span></i></b>。</p>
        <p class="muted">打字机模式下会保留 HTML 结构，逐字揭示时标签完整跳过。</p>
      </Modal>
    </Row>
  </Card>

  <Card title="浅色遮罩 mask='light'">
    <Row>
      <Button variant="primary" onclick={() => { noMaskModalOpen = true; }}>浅色遮罩</Button>
      <Modal bind:open={noMaskModalOpen} title="浅色遮罩" mask="light">
        <p>使用半透明浅色遮罩，视觉更轻量。</p>
        <p class="muted">适合不需要强遮挡的场景。</p>
      </Modal>
    </Row>
  </Card>

  <Card title="无模糊 blur={false}（与 mask 独立）">
    <Row>
      <Button variant="primary" onclick={() => { noBlurOpen = true; }}>无模糊</Button>
      <Modal bind:open={noBlurOpen} title="无模糊遮罩" blur={false}>
        <p>遮罩不加 backdrop 模糊，仅保留半透明变暗。</p>
        <p class="muted">blur 与 mask 可独立组合。</p>
      </Modal>
      <Button onclick={() => { lightNoBlurOpen = true; }}>浅色 + 无模糊</Button>
      <Modal bind:open={lightNoBlurOpen} title="浅色 + 无模糊" mask="light" blur={false}>
        <p>mask='light' 与 blur={false} 同时生效。</p>
      </Modal>
    </Row>
  </Card>

  <Card title="文案定制 okText / cancelText">
    <Row>
      <Button variant="primary" onclick={() => { confirmLikeOpen = true; }}>打开</Button>
      <Modal
        bind:open={confirmLikeOpen}
        title="删除确认"
        width={420}
        okText="删除"
        cancelText="再想想"
        onOk={() => { Notification.success('已删除（模拟）'); }}
        onCancel={() => Notification.info('已取消删除')}
      >
        <p>确定要删除该资源吗？此操作不可撤销。</p>
        <p class="muted">onOk 关闭前触发，onCancel 在取消 / X / Esc / 遮罩关闭时触发。</p>
      </Modal>
    </Row>
  </Card>

  <Card title="onOk 返回 false 阻止关闭">
    <Row>
      <Button variant="primary" onclick={() => { preventCloseOpen = true; }}>打开</Button>
      <Modal
        bind:open={preventCloseOpen}
        title="表单校验"
        width={420}
        okText="提交"
        onOk={() => {
          if (Math.random() < 0.5) {
            Notification.error('校验失败：返回 false 保持打开');
            return false;
          }
          Notification.success('校验通过，已关闭');
        }}
      >
        <p>点「提交」有一半概率返回 <code>false</code>，弹窗保持打开。</p>
        <p class="muted">抛异常同样保持打开，适合校验与请求失败场景。</p>
      </Modal>
    </Row>
  </Card>

  <Card title="异步 onOk（处理中态）">
    <Row>
      <Button variant="primary" onclick={() => { asyncOkOpen = true; }}>打开</Button>
      <Modal
        bind:open={asyncOkOpen}
        title="异步提交"
        width={420}
        okText="保存"
        onOk={async () => {
          await new Promise((r) => setTimeout(r, 1500));
          Notification.success('保存成功');
        }}
      >
        <p>onOk 返回 Promise 时，确定按钮显示「处理中…」并禁用，await 完成后才关闭。</p>
      </Modal>
    </Row>
  </Card>

  <Card title="隐藏 footer showFooter={false}">
    <Row>
      <Button variant="primary" onclick={() => { noFooterOpen = true; }}>打开</Button>
      <Modal bind:open={noFooterOpen} title="纯展示弹窗" width={420} showFooter={false}>
        <p>通过 <code>showFooter={false}</code> 隐藏底部按钮区，仅保留右上角 X 关闭。</p>
        <p class="muted">也可用 showOk / showCancel 单独隐藏某一个按钮。</p>
      </Modal>
    </Row>
  </Card>

  <Card title="ErrorDialog 错误收集弹窗">
    <p class="muted" style="margin-bottom:12px">自动收集运行时错误，支持列表堆叠、单项复制、复制全部。非模态弹窗，弹出后仍可继续触发错误。</p>
    <Row>
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
    </Row>
  </Card>

  <Card title="Confirm 基础用法">
    <Row>
      <Button variant="primary" onclick={basicConfirm}>显示确认框</Button>
    </Row>
    <p class="muted">在根组件挂载一次 <code>&lt;ConfirmDialog /&gt;</code> 后，任意处 <code>await showConfirm(message)</code>；确认返回 <code>true</code>，取消或关闭返回 <code>false</code>。</p>
  </Card>

  <Card title="Confirm 危险操作 danger">
    <Row>
      <Button variant="danger" onclick={dangerConfirm}>删除全部数据</Button>
    </Row>
    <p class="muted">传 <code>danger: true</code> 后确认按钮变为危险色，配合自定义 <code>confirmText</code> 强调后果。</p>
  </Card>

  <Card title="Confirm 自定义标题 / 按钮文案">
    <Row>
      <Button onclick={customConfirm}>重启服务</Button>
    </Row>
    <p class="muted">支持 <code>title</code>、<code>confirmText</code>、<code>cancelText</code>；弹窗内按 <code>Enter</code> 等同点击确认。</p>
  </Card>

  <Card title="showConfirm(message, options?)">
    <PropsTable items={confirmProps} />
  </Card>

  <Card title="AlertDialog 基础用法（声明式）">
    <Row>
      <Button onclick={() => (adBasicOpen = true)}>打开对话框</Button>
    </Row>
    <p class="muted">声明式组件，与命令式 Confirm 互补：适合需要 <code>loading</code>、<code>danger</code>、自定义 <code>content</code> 的场景。</p>
    <AlertDialog
      bind:open={adBasicOpen}
      title="保存更改？"
      description="离开前需要保存对文档的修改，是否继续？"
      onConfirm={() => {
        adBasicOpen = false;
        Notification.success('已保存');
      }}
      onCancel={() => Notification.info('已取消')}
    />
  </Card>

  <Card title="AlertDialog 危险操作 danger">
    <Row>
      <Button variant="danger" onclick={() => (adDangerOpen = true)}>删除项目</Button>
    </Row>
    <p class="muted">传 <code>danger</code> 后确认按钮变为危险色，配合自定义 <code>confirmText</code> 强调后果。</p>
    <AlertDialog
      bind:open={adDangerOpen}
      title="确认删除？"
      description="此操作不可撤销，项目及其所有关联数据将被永久移除。"
      confirmText="删除"
      danger
      onConfirm={() => {
        adDangerOpen = false;
        Notification.success('已删除');
      }}
    />
  </Card>

  <Card title="AlertDialog 加载状态 loading">
    <Row>
      <Button onclick={() => (adLoadingOpen = true)}>提交（异步）</Button>
    </Row>
    <p class="muted">传 <code>loading</code> 后确认按钮禁用并显示等待态，提交期间 Esc 与取消同样被阻止。</p>
    <AlertDialog
      bind:open={adLoadingOpen}
      title="正在提交…"
      description="提交期间按钮禁用，Esc 与取消同样被阻止。"
      confirmText="提交"
      loading={adLoading}
      onConfirm={adConfirmLoading}
      onCancel={() => (adLoadingOpen = false)}
    />
  </Card>

  <Card title="AlertDialog Props">
    <PropsTable items={alertdialogProps} />
  </Card>

  <Card title="Props">
    <PropsTable items={modalProps} />
  </Card>
</Page>

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

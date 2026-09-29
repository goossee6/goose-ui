<script lang="ts">
  import {Card, Button, Page, showConfirm, Notification, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

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
</script>

<Page title="确认框 Confirm" description="命令式确认框：await showConfirm(...) 返回 Promise<boolean>，Enter 快捷确认" >
  <Card title="基础用法">
    <Row>
      <Button variant="primary" onclick={basicConfirm}>显示确认框</Button>
    </Row>
    <p class="muted">在根组件挂载一次 <code>&lt;ConfirmDialog /&gt;</code> 后，任意处 <code>await showConfirm(message)</code>；确认返回 <code>true</code>，取消或关闭返回 <code>false</code>。</p>
  </Card>

  <Card title="危险操作 danger">
    <Row>
      <Button variant="danger" onclick={dangerConfirm}>删除全部数据</Button>
    </Row>
    <p class="muted">传 <code>danger: true</code> 后确认按钮变为危险色，配合自定义 <code>confirmText</code> 强调后果。</p>
  </Card>

  <Card title="自定义标题 / 按钮文案">
    <Row>
      <Button onclick={customConfirm}>重启服务</Button>
    </Row>
    <p class="muted">支持 <code>title</code>、<code>confirmText</code>、<code>cancelText</code>；弹窗内按 <code>Enter</code> 等同点击确认。</p>
  </Card>

  <Card title="showConfirm(message, options?)">
    <PropsTable items={confirmProps} />
  </Card>
</Page>

<style>
  .muted {
    margin: 12px 0 0;
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.6;
  }
  code {
    background: var(--surface-2);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--primary);
  }
</style>

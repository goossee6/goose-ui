<script lang="ts">
  import {Card, Page, AlertDialog, Button, Notification} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
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

  let basicOpen = $state(false);
  let dangerOpen = $state(false);
  let loadingOpen = $state(false);
  let loading = $state(false);

  async function confirmLoading() {
    loading = true;
    await new Promise((r) => setTimeout(r, 1500));
    loading = false;
    loadingOpen = false;
    Notification.success('操作完成');
  }
</script>

<Page title="Alert Dialog 警惕对话框" description="role=alertdialog 的模态确认框（焦点陷阱 + Esc + 初始聚焦取消）">
  <Card title="基础用法">
    <Button onclick={() => (basicOpen = true)}>打开对话框</Button>
    <AlertDialog
      bind:open={basicOpen}
      title="保存更改？"
      description="离开前需要保存对文档的修改，是否继续？"
      onConfirm={() => {
        basicOpen = false;
        Notification.success('已保存');
      }}
      onCancel={() => Notification.info('已取消')}
    />
  </Card>

  <Card title="危险操作">
    <Button variant="danger" onclick={() => (dangerOpen = true)}>删除项目</Button>
    <AlertDialog
      bind:open={dangerOpen}
      title="确认删除？"
      description="此操作不可撤销，项目及其所有关联数据将被永久移除。"
      confirmText="删除"
      danger
      onConfirm={() => {
        dangerOpen = false;
        Notification.success('已删除');
      }}
    />
  </Card>

  <Card title="加载状态">
    <Button onclick={() => (loadingOpen = true)}>提交（异步）</Button>
    <AlertDialog
      bind:open={loadingOpen}
      title="正在提交…"
      description="提交期间按钮禁用，Esc 与取消同样被阻止。"
      confirmText="提交"
      {loading}
      onConfirm={confirmLoading}
      onCancel={() => (loadingOpen = false)}
    />
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

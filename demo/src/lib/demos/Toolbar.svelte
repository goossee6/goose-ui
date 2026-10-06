<script lang="ts">
  import {Card, Page, Toolbar, Button, Toggle, Separator, Notification} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "orientation", desc: "方向（同时决定方向键导航）", type: "'horizontal' | 'vertical'", default: "'horizontal'" },
    { name: "children", desc: "工具栏内容（snippet）", type: "Snippet", default: "—" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  let wrap = $state(true);
</script>

<Page title="Toolbar 工具栏" description="成组的操作按钮容器（方向键在控件间循环移动焦点）">
  <Card title="横向工具栏">
    <Toolbar>
      <Button size="small" onclick={() => Notification.info('粗体')}>B</Button>
      <Button size="small" onclick={() => Notification.info('斜体')}>I</Button>
      <Button size="small" onclick={() => Notification.info('下划线')}>U</Button>
      <Separator orientation="vertical" />
      <Button size="small" onclick={() => Notification.info('左对齐')}>左</Button>
      <Button size="small" onclick={() => Notification.info('居中')}>中</Button>
      <Button size="small" onclick={() => Notification.info('右对齐')}>右</Button>
      <Separator orientation="vertical" />
      <Toggle bind:checked={wrap} size="small" ariaLabel="自动换行" />
      <span class="toolbar-label">自动换行</span>
    </Toolbar>
  </Card>

  <Card title="纵向工具栏">
    <Toolbar orientation="vertical">
      <Button size="small" onclick={() => Notification.info('保存')}>保存</Button>
      <Button size="small" onclick={() => Notification.info('打印')}>打印</Button>
      <Button size="small" disabled>禁用</Button>
    </Toolbar>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .toolbar-label { font-size: 13px; color: var(--text-muted); }
</style>

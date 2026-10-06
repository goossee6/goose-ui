<script lang="ts">
  import {Card, Page, Popover, Button, Notification} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "open", desc: "展开状态（双向绑定）", type: "boolean", default: "false" },
    { name: "placement", desc: "弹出方位", type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'", default: "'bottom-start'" },
    { name: "title", desc: "标题", type: "string", default: "''" },
    { name: "onOpenChange", desc: "开关回调", type: "(open: boolean) => void", default: "—" },
    { name: "trigger", desc: "触发区（snippet）", type: "Snippet", default: "—" },
    { name: "children", desc: "面板内容（snippet）", type: "Snippet", default: "—" },
  ];

  let open = $state(false);
</script>

<Page title="Popover 气泡卡片" description="点击触发的浮层卡片，可放任意交互内容（Esc / 点击外部关闭）">
  <Card title="基础用法">
    <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
      <Popover title="什么是 Popover？">
        {#snippet trigger()}
          <span>打开气泡</span>
        {/snippet}
        <p style="margin:0">与 Tooltip 的区别：点击触发、可交互、有标题与关闭按钮。</p>
      </Popover>

      <Popover title="操作面板" placement="bottom-end">
        {#snippet trigger()}
          <span>右下弹出</span>
        {/snippet}
        <div style="display:flex;flex-direction:column;gap:8px">
          <Button size="small" onclick={() => Notification.info('执行了动作 A')}>动作 A</Button>
          <Button size="small" onclick={() => Notification.info('执行了动作 B')}>动作 B</Button>
        </div>
      </Popover>

      <Popover bind:open title="受控">
        {#snippet trigger()}
          <span>受控（{open ? '开' : '关'}）</span>
        {/snippet}
        <p style="margin:0">通过 <code>bind:open</code> 控制显隐。</p>
      </Popover>
    </div>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

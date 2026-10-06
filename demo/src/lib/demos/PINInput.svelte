<script lang="ts">
  import {Card, Page, PINInput, Row, Button, Notification} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "length", desc: "格子数", type: "number", default: "4" },
    { name: "value", desc: "验证码值（双向绑定）", type: "string", default: "''" },
    { name: "mask", desc: "密码式掩码显示", type: "boolean", default: "false" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "placeholder", desc: "每格占位符", type: "string", default: "''" },
    { name: "separator", desc: "分组分隔符（配合 group）", type: "string", default: "''" },
    { name: "group", desc: "每 N 格插入分隔符", type: "number", default: "0" },
    { name: "numeric", desc: "仅数字", type: "boolean", default: "true" },
    { name: "oncomplete", desc: "填满时回调", type: "(value: string) => void", default: "—" },
  ];

  let v1 = $state('');
  let v2 = $state('');
  let v3 = $state('');
  let v4 = $state('');
</script>

<Page title="PIN Input 验证码输入" description="分格验证码输入，支持自动跳格、粘贴与退格回跳">
  <Card title="基础用法">
    <div style="display:flex;flex-direction:column;gap:20px">
      <div>
        <div class="pin-label">4 位数字（填满提示）</div>
        <PINInput length={4} bind:value={v1} oncomplete={(v) => Notification.info(`验证码：${v}`)} />
        <div class="pin-value">value = {v1 || '（空）'}</div>
      </div>
      <div>
        <div class="pin-label">6 位掩码</div>
        <PINInput length={6} mask bind:value={v2} />
        <div class="pin-value">value = {v2 || '（空）'}</div>
      </div>
      <div>
        <div class="pin-label">分组分隔（4-4）</div>
        <PINInput length={8} group={4} separator="–" numeric={false} bind:value={v3} />
        <div class="pin-value">value = {v3 || '（空）'}</div>
      </div>
      <div>
        <div class="pin-label">禁用</div>
        <PINInput length={4} disabled bind:value={v4} placeholder="—" />
      </div>
      <Row>
        <Button size="small" onclick={() => (v1 = '')}>清空 4 位</Button>
        <Button size="small" onclick={() => (v1 = '1357')}>填入 1357</Button>
      </Row>
    </div>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .pin-label { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
  .pin-value { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin-top: 8px; }
</style>

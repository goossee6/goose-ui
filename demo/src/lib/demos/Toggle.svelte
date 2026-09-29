<script lang="ts">
  import {Card, Toggle, Checkbox, Label, Page, Notification, Row} from "goose-ui";

  let t1 = $state(false);
  let t2 = $state(true);
  let t3 = $state(false);
  let c1 = $state(false);
  let c2 = $state(true);
  let c3 = $state(false);
  let prevT1 = $state(t1);
  let prevT2 = $state(t2);
  let prevT3 = $state(t3);
  let prevC1 = $state(c1);
  let prevC2 = $state(c2);
  let prevC3 = $state(c3);

  $effect(() => { if (t1 !== prevT1) { prevT1 = t1; Notification.success(t1 ? '已开启' : '已关闭'); } });
  $effect(() => { if (t2 !== prevT2) { prevT2 = t2; Notification.success(t2 ? '已开启' : '已关闭'); } });
  $effect(() => { if (t3 !== prevT3) { prevT3 = t3; Notification.success(t3 ? '通知已开启' : '通知已关闭'); } });
  $effect(() => { if (c1 !== prevC1) { prevC1 = c1; Notification.success(c1 ? '已选中' : '已取消'); } });
  $effect(() => { if (c2 !== prevC2) { prevC2 = c2; Notification.success(c2 ? '已选中' : '已取消'); } });
  $effect(() => { if (c3 !== prevC3) { prevC3 = c3; Notification.success(c3 ? '已同意' : '已取消同意'); } });
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const toggleProps: PropsTableItem[] = [
    { name: "checked", desc: "是否选中（可双向绑定）", type: "boolean", default: "false" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "size", desc: "尺寸，预设字符串或自定义数值(px)", type: "'small' | 'middle' | 'large' | number", default: "'middle'" },
    { name: "onclick", desc: "点击回调", type: "(e: MouseEvent) => void" },
    { name: "ariaLabel", desc: "无障碍标签", type: "string", default: "''" },
    { name: "title", desc: "提示标题", type: "string", default: "''" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
  ];

  const checkboxProps: PropsTableItem[] = [
    { name: "checked", desc: "是否选中（可双向绑定）", type: "boolean", default: "false" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "size", desc: "尺寸，预设字符串或自定义数值(px)", type: "'small' | 'middle' | 'large' | number", default: "'middle'" },
    { name: "onchange", desc: "变更回调", type: "(e: Event) => void" },
    { name: "ariaLabel", desc: "无障碍标签", type: "string", default: "''" },
  ];

  const labelProps: PropsTableItem[] = [
    { name: "for", desc: "关联控件 id", type: "string", default: "''" },
    { name: "children", desc: "标签文本", type: "Snippet" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
  ];
</script>

<Page title="开关 Toggle & Checkbox" description="带弹性动画的切换开关，以及复选框" >
  <Card title="Toggle 尺寸 Sizes">
    <Row>
      <div class="demo-item">
        <Label>small</Label>
        <Toggle size="small" checked={true} ariaLabel="small" />
      </div>
      <div class="demo-item">
        <Label>middle (默认)</Label>
        <Toggle checked={true} ariaLabel="middle" />
      </div>
      <div class="demo-item">
        <Label>large</Label>
        <Toggle size="large" checked={true} ariaLabel="large" />
      </div>
    </Row>
  </Card>

  <Card title="Toggle 状态 States">
    <Row>
      <div class="demo-item">
        <Label>关闭</Label>
        <Toggle bind:checked={t1} ariaLabel="关闭" />
      </div>
      <div class="demo-item">
        <Label>开启</Label>
        <Toggle bind:checked={t2} ariaLabel="开启" />
      </div>
    </Row>
    <p class="demo-val">t1 = {t1}, t2 = {t2}</p>
  </Card>

  <Card title="Toggle 禁用 Disabled">
    <Row>
      <div class="demo-item">
        <Label>禁用关闭</Label>
        <Toggle checked={false} disabled ariaLabel="禁用关闭" />
      </div>
      <div class="demo-item">
        <Label>禁用开启</Label>
        <Toggle checked={true} disabled ariaLabel="禁用开启" />
      </div>
    </Row>
  </Card>

  <Card title="Checkbox 尺寸 Sizes">
    <Row>
      <div class="demo-item">
        <Checkbox size="small" checked={true} />
        <Label>small</Label>
      </div>
      <div class="demo-item">
        <Checkbox checked={true} />
        <Label>middle (默认)</Label>
      </div>
      <div class="demo-item">
        <Checkbox size="large" checked={true} />
        <Label>large</Label>
      </div>
    </Row>
  </Card>

  <Card title="Checkbox 状态 States">
    <Row>
      <div class="demo-item">
        <Checkbox bind:checked={c1} />
        <Label>未选中</Label>
      </div>
      <div class="demo-item">
        <Checkbox bind:checked={c2} />
        <Label>已选中</Label>
      </div>
    </Row>
    <p class="demo-val">c1 = {c1}, c2 = {c2}</p>
  </Card>

  <Card title="Checkbox 禁用 Disabled">
    <Row>
      <div class="demo-item">
        <Checkbox checked={false} disabled />
        <Label>禁用未选中</Label>
      </div>
      <div class="demo-item">
        <Checkbox checked={true} disabled />
        <Label>禁用已选中</Label>
      </div>
    </Row>
  </Card>

  <Card title="实际场景：设置项">
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="setting-row">
        <div>
          <div class="setting-title">启用通知</div>
          <div class="setting-desc">接收应用的重要更新提醒</div>
        </div>
        <Toggle bind:checked={t3} ariaLabel="通知" />
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-title">自动更新</div>
          <div class="setting-desc">在后台自动下载并安装更新</div>
        </div>
        <Toggle checked={true} ariaLabel="自动更新" />
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-title">匿名统计</div>
          <div class="setting-desc">帮助我们改进产品体验</div>
        </div>
        <Toggle checked={false} ariaLabel="统计" />
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-title">我已阅读并同意用户协议</div>
          <div class="setting-desc">继续使用前必须勾选此项</div>
        </div>
        <Checkbox bind:checked={c3} />
      </div>
    </div>
  </Card>
  <Card title="Toggle Props">
    <PropsTable items={toggleProps} />
  </Card>

  <Card title="Checkbox Props">
    <PropsTable items={checkboxProps} />
  </Card>

  <Card title="Label Props">
    <PropsTable items={labelProps} />
  </Card>
</Page>

<style>
  .demo-item { display: flex; align-items: center; gap: 8px; }
  .demo-val { font-size: 13px; color: var(--text-muted); margin: 8px 0 0; }
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .setting-title { font-size: 14px; font-weight: 500; color: var(--text-strong); }
  .setting-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
</style>

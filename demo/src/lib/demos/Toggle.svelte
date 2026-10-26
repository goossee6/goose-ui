<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import {Card, Toggle, Checkbox, Label, Page, Notification, Row} from "goose-ui";
  import CodePreview from "../CodePreview.svelte";

  let t1 = $state(false);
  let t2 = $state(true);
  let t3 = $state(false);
  let c3 = $state(false);

  // 加载并可完成的示例：受控模式（optimistic=false），点击后先给出预期值，
  // 等「请求」回来才结束 loading。真实场景把 setTimeout 换成 await。
  let asyncOn = $state(false);
  let asyncLoading = $state(false);
  let asyncTimer: ReturnType<typeof setTimeout> | null = null;
  // 0.5s 跨越动画 + 1.15s 呼吸一轮 = 1.65s：刚好在一次呼吸回到原宽时结束，
  // 不会撞在鼓起来的半途（撞上会看到宽度硬切回原状）。
  const ASYNC_MS = 1650;

  function toggleAsync() {
    if (asyncLoading) return;
    const next = !asyncOn;
    asyncOn = next;
    asyncLoading = true;
    asyncTimer = setTimeout(() => {
      asyncTimer = null;
      asyncLoading = false;
      Notification.success(`${next ? '已开启' : '已关闭'}（模拟请求 ${ASYNC_MS}ms）`);
    }, ASYNC_MS);
  }

  onDestroy(() => {
    if (asyncTimer) clearTimeout(asyncTimer);
  });

  // 仅用于变更对比：初值取各绑定值的首次值，之后由下方 $effect 改写
  let prevT1 = untrack(() => t1);
  let prevT2 = untrack(() => t2);
  let prevT3 = untrack(() => t3);
  let prevC3 = untrack(() => c3);

  $effect(() => { if (t1 !== prevT1) { prevT1 = t1; Notification.success(t1 ? '已开启' : '已关闭'); } });
  $effect(() => { if (t2 !== prevT2) { prevT2 = t2; Notification.success(t2 ? '已开启' : '已关闭'); } });
  $effect(() => { if (t3 !== prevT3) { prevT3 = t3; Notification.success(t3 ? '通知已开启' : '通知已关闭'); } });
  $effect(() => { if (c3 !== prevC3) { prevC3 = c3; Notification.success(c3 ? '已同意' : '已取消同意'); } });
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const toggleProps: PropsTableItem[] = [
    { name: "checked", desc: "是否选中（可双向绑定）", type: "boolean", default: "false" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "loading", desc: "加载中（第三态）：滑块换成 spinner 并阻止交互，动画与 2 态的跨越动画分开", type: "boolean", default: "false" },
    { name: "size", desc: "尺寸档", type: "'small' | 'middle' | 'large'", default: "'middle'" },
    { name: "onclick", desc: "点击回调", type: "(e: MouseEvent) => void" },
    { name: "ariaLabel", desc: "无障碍标签", type: "string", default: "''" },
    { name: "title", desc: "提示标题", type: "string", default: "''" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
    { name: "onStyle", desc: "开启态轨道的内联样式（覆盖背景/边框色等）", type: "string", default: "''" },
    { name: "offStyle", desc: "关闭态轨道的内联样式", type: "string", default: "''" },
    { name: "thumbStyle", desc: "滑块的内联样式（两态共用）", type: "string", default: "''" },
    { name: "optimistic", desc: "点击时是否自行翻转 checked；异步确认场景传 false（受控）", type: "boolean", default: "true" },
    { name: "minLoadingMs", desc: "loading 最短展示时长（ms），防闪一下", type: "number", default: "1000" },
  ];

  const labelProps: PropsTableItem[] = [
    { name: "for", desc: "关联控件 id", type: "string", default: "''" },
    { name: "children", desc: "标签文本", type: "Snippet" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const basicSource = `<script lang="ts">
  import { Toggle, Label, Row } from "goose-ui";
<\/script>

<Row>
  <Toggle size="small" checked={true} ariaLabel="small" />
  <Toggle checked={true} ariaLabel="middle" />
  <Toggle size="large" checked={true} ariaLabel="large" />
</Row>`;

  const statesSource = `<script lang="ts">
  import { Toggle, Label, Row } from "goose-ui";

  let off = $state(false);
  let on = $state(true);
<\/script>

<Row>
  <Toggle bind:checked={off} ariaLabel="关闭" />
  <Toggle bind:checked={on} ariaLabel="开启" />
</Row>

<p>off = {off}, on = {on}</p>`;

  const disabledSource = `<script lang="ts">
  import { Toggle, Row } from "goose-ui";
<\/script>

<Row>
  <Toggle checked={false} disabled ariaLabel="禁用关闭" />
  <Toggle checked={true} disabled ariaLabel="禁用开启" />
</Row>`;

  const customStyleSource = `<script lang="ts">
  import { Toggle, Row } from "goose-ui";
<\/script>

<Row>
  <Toggle
    checked={false}
    ariaLabel="关闭态自定义"
    offStyle="background-color: var(--accent); border-color: var(--accent)"
  />
  <Toggle
    checked={true}
    ariaLabel="开启态自定义"
    onStyle="background-color: var(--warning); border-color: var(--warning)"
    thumbStyle="background-color: #fff"
  />
</Row>`;

  const loadingSource = `<script lang="ts">
  import { onDestroy } from "svelte";
  import { Toggle, Row } from "goose-ui";

  // 前两个是静态的加载态（点了没反应，用来展示第三态长什么样）；
  // 第三个演示完整链路：点击 → 跨越动画 → spinner → 完成。
  let on = $state(false);
  let loading = $state(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function toggle() {
    if (loading) return;
    loading = true;
    on = !on; // 受控模式：父级给出预期值，滑块先落到目标侧
    timer = setTimeout(() => {
      loading = false; // 真实场景换成 await 请求；失败时把 on 改回去即可
      timer = null;
    }, 1650);
  }

  onDestroy(() => {
    if (timer) clearTimeout(timer);
  });
<\/script>

<Row>
  <Toggle checked={false} loading ariaLabel="加载中（关闭态）" />
  <Toggle checked={true} loading ariaLabel="加载中（开启态）" />
  <Toggle
    checked={on}
    {loading}
    optimistic={false}
    onclick={toggle}
    ariaLabel="点击体验加载并完成"
  />
</Row>`;

  const settingsSource = `<script lang="ts">
  import { Toggle, Checkbox } from "goose-ui";

  let notify = $state(false);
  let agreed = $state(false);
<\/script>

<div style="display:flex;flex-direction:column;gap:14px">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
    <span>启用通知</span>
    <Toggle bind:checked={notify} ariaLabel="通知" />
  </div>
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
    <span>我已阅读并同意用户协议</span>
    <Checkbox bind:checked={agreed} />
  </div>
</div>`;
</script>

<Page toc title="开关 Toggle" description="带弹性动画的切换开关">
  <CodePreview anchor="toggle-sizes" anchorLevel={2} title="Toggle 尺寸 Sizes" code={basicSource}>
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
  </CodePreview>

  <CodePreview anchor="toggle-states" anchorLevel={2} title="Toggle 状态 States" code={statesSource}>
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
  </CodePreview>

  <CodePreview anchor="toggle-custom-style" anchorLevel={2} title="Toggle 自定义状态样式 Custom state styles" code={customStyleSource}>
    <Row>
      <div class="demo-item">
        <Label>关闭态（蓝）</Label>
        <Toggle
          checked={false}
          ariaLabel="关闭态自定义"
          offStyle="background-color: var(--accent); border-color: var(--accent)"
        />
      </div>
      <div class="demo-item">
        <Label>开启态（橙）</Label>
        <Toggle
          checked={true}
          ariaLabel="开启态自定义"
          onStyle="background-color: var(--warning); border-color: var(--warning)"
          thumbStyle="background-color: #fff"
        />
      </div>
    </Row>
  </CodePreview>

  <CodePreview anchor="toggle-loading" anchorLevel={2} title="Toggle 加载中 Loading" code={loadingSource}>
    <Row>
      <div class="demo-item">
        <Label>关闭态加载中</Label>
        <Toggle checked={false} loading ariaLabel="加载中（关闭态）" />
      </div>
      <div class="demo-item">
        <Label>开启态加载中</Label>
        <Toggle checked={true} loading ariaLabel="加载中（开启态）" />
      </div>
      <div class="demo-item">
        <Label>点击体验（约 1.6s 完成）</Label>
        <Toggle
          checked={asyncOn}
          loading={asyncLoading}
          optimistic={false}
          onclick={toggleAsync}
          ariaLabel="点击体验加载并完成"
        />
      </div>
    </Row>
    <p class="demo-val">
      asyncOn = {asyncOn}, asyncLoading = {asyncLoading}
    </p>
  </CodePreview>

  <CodePreview anchor="toggle-disabled" anchorLevel={2} title="Toggle 禁用 Disabled" code={disabledSource}>
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
  </CodePreview>

  <CodePreview anchor="settings-item" anchorLevel={2} title="实际场景：设置项" code={settingsSource}>
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
  </CodePreview>
  <Card title="Toggle Props">
    <PropsTable anchor="props" items={toggleProps} />
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

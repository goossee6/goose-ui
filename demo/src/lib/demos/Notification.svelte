<script lang="ts">
  import {Card, Button, Page, Notification, NotificationProvider, createNotification, createNotificationStore, Row} from "goose-ui";
  import CodePreview from "../CodePreview.svelte";
  import Star from '@lucide/svelte/icons/star';
  import Heart from '@lucide/svelte/icons/heart';
  import Bookmark from '@lucide/svelte/icons/bookmark';
  import Zap from '@lucide/svelte/icons/zap';

  // 两个互不干扰的通知容器：各自一份 store + 各自绑定的快捷 API
  const storeA = createNotificationStore();
  const storeB = createNotificationStore();
  const notifyA = createNotification(storeA);
  const notifyB = createNotification(storeB);

  let keyDemoCount = $state(0);
  // 测试钩子：供 e2e 探针驱动同 key 内容更新
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__notify = Notification;
  }
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const notificationProps: PropsTableItem[] = [
    { name: "title", desc: "标题（必填；传字符串时为快捷用法）", type: "string" },
    { name: "description", desc: "描述文本", type: "string" },
    { name: "type", desc: "类型（由 success/info/warning/error 自动设置）", type: "'success' | 'info' | 'warning' | 'error'", default: "'info'" },
    { name: "position", desc: "弹出位置", type: "'top-left' | 'top' | 'top-right' | 'bottom-left' | 'bottom' | 'bottom-right'", default: "'top'" },
    { name: "duration", desc: "自动关闭时间(ms)，0 表示不自动关闭", type: "number", default: "4500" },
    { name: "closable", desc: "显示关闭按钮", type: "boolean", default: "true" },
    { name: "pauseOnHover", desc: "悬停时暂停倒计时", type: "boolean", default: "true" },
    { name: "showProgress", desc: "显示进度条", type: "boolean", default: "false" },
    { name: "key", desc: "唯一键：同 key 通知原地更新而非新增", type: "string" },
    { name: "icon", desc: "自定义图标组件", type: "Component" },
    { name: "closeIcon", desc: "自定义关闭图标组件", type: "Component" },
    { name: "btn", desc: "操作按钮插槽", type: "Snippet" },
    { name: "onClick", desc: "点击通知回调", type: "() => void" },
    { name: "onClose", desc: "关闭时回调", type: "() => void" },
  ];

  const titleDescSource = `<script lang="ts">
  import { Notification, Button } from "goose-ui";
<\/script>

<Button
  variant="primary"
  onclick={() => Notification.success({ title: "操作成功", description: "你的数据已保存到服务器，可以在列表中查看。" })}
>
  带描述 Success
</Button>

<Button
  onclick={() => Notification.info({ title: "系统通知", description: "系统将于今晚 22:00 进行维护，预计持续 30 分钟。" })}
>
  带描述 Info
</Button>`;

  const typesSource = `<script lang="ts">
  import { Notification, Button } from "goose-ui";
<\/script>

<Button variant="primary" onclick={() => Notification.success("操作成功！")}>Success</Button>
<Button onclick={() => Notification.info("这是一条消息")}>Info</Button>
<Button variant="danger" onclick={() => Notification.warning("请注意！")}>Warning</Button>
<Button variant="danger" onclick={() => Notification.error("操作失败！")}>Error</Button>`;

  const positionsSource = `<script lang="ts">
  import { Notification, Button } from "goose-ui";
<\/script>

<!-- 可选值：top-left | top | top-right | bottom-left | bottom | bottom-right -->
<Button onclick={() => Notification.success({ title: "左上通知", position: "top-left" })}>左上</Button>
<Button onclick={() => Notification.success({ title: "顶部居中", position: "top" })}>顶部居中</Button>
<Button onclick={() => Notification.success({ title: "右上通知", position: "top-right" })}>右上</Button>
<Button onclick={() => Notification.success({ title: "左下通知", position: "bottom-left" })}>左下</Button>
<Button onclick={() => Notification.success({ title: "底部居中", position: "bottom" })}>底部居中</Button>
<Button onclick={() => Notification.success({ title: "右下通知", position: "bottom-right" })}>右下</Button>`;

  const durationSource = `<script lang="ts">
  import { Notification, Button } from "goose-ui";
<\/script>

<Button onclick={() => Notification.info({ title: "3 秒后关闭", showProgress: true, duration: 3000 })}>3 秒</Button>
<Button onclick={() => Notification.info({ title: "10 秒后关闭", showProgress: true, duration: 10000 })}>10 秒</Button>

<!-- duration: 0 表示不自动关闭 -->
<Button onclick={() => Notification.warning({ title: "不会自动关闭", description: "点击 X 关闭", duration: 0 })}>
  不自动关闭
</Button>`;

  const iconSource = `<script lang="ts">
  import { Notification, Button } from "goose-ui";
  import Star from "@lucide/svelte/icons/star";
  import Bookmark from "@lucide/svelte/icons/bookmark";
<\/script>

<Button onclick={() => Notification.success({ title: "收藏成功", icon: Star })}>Star 图标</Button>
<Button onclick={() => Notification.info({ title: "已添加到书签", icon: Bookmark })}>Bookmark 图标</Button>`;

  const keySource = `<script lang="ts">
  import { Notification, Button } from "goose-ui";

  let count = $state(0);
<\/script>

<Button
  variant="primary"
  onclick={() => {
    count++;
    Notification.success({
      key: "key-demo",
      title: \`更新 #\${count}\`,
      description: \`这是第 \${count} 次调用，同 key 会更新而非新增\`,
    });
  }}
>
  同 key 更新通知
</Button>

<Button variant="ghost" onclick={() => Notification.destroy("key-demo")}>按 key 关闭</Button>`;

  const onClickSource = `<script lang="ts">
  import { Notification, Button } from "goose-ui";
<\/script>

<Button onclick={() => Notification.info({
  title: "点击这条通知",
  onClick: () => Notification.success("通知被点击了！"),
})}>
  点击通知触发回调
</Button>`;

  const onCloseSource = `<script lang="ts">
  import { Notification, Button } from "goose-ui";
<\/script>

<Button onclick={() => Notification.info({
  title: "关闭后触发回调",
  duration: 3000,
  onClose: () => Notification.success("通知已关闭！"),
})}>
  关闭时触发回调
</Button>`;

  const closeIconSource = `<script lang="ts">
  import { Notification, Button } from "goose-ui";
  import Bookmark from "@lucide/svelte/icons/bookmark";
  import Heart from "@lucide/svelte/icons/heart";
<\/script>

<Button onclick={() => Notification.info({ title: "Bookmark 关闭图标", closeIcon: Bookmark, duration: 0 })}>
  Bookmark 关闭
</Button>
<Button onclick={() => Notification.warning({ title: "Heart 关闭图标", closeIcon: Heart, duration: 0 })}>
  Heart 关闭
</Button>`;

  const pauseOnHoverSource = `<script lang="ts">
  import { Notification, Button } from "goose-ui";
<\/script>

<Button onclick={() => Notification.info({
  title: "悬停暂停计时",
  description: "鼠标悬停时暂停自动关闭，移开后继续倒计时",
  duration: 8000,
  showProgress: true,
  pauseOnHover: true,
})}>
  悬停暂停（默认开启）
</Button>

<Button onclick={() => Notification.warning({
  title: "悬停不暂停",
  description: "即使悬停也会自动关闭",
  duration: 8000,
  showProgress: true,
  pauseOnHover: false,
})}>
  悬停不暂停
</Button>`;

  const progressSource = `<script lang="ts">
  import { Notification, Button } from "goose-ui";
<\/script>

<Button onclick={() => Notification.success({ title: "带进度条", description: "底部显示自动关闭进度", duration: 6000, showProgress: true })}>
  Success + 进度条
</Button>
<Button onclick={() => Notification.info({ title: "带进度条", description: "底部显示自动关闭进度", duration: 6000, showProgress: true })}>
  Info + 进度条
</Button>
<Button onclick={() => Notification.warning({ title: "带进度条", description: "底部显示自动关闭进度", duration: 6000, showProgress: true })}>
  Warning + 进度条
</Button>
<Button onclick={() => Notification.error({ title: "带进度条", description: "底部显示自动关闭进度", duration: 6000, showProgress: true })}>
  Error + 进度条
</Button>`;

  const stackSource = `<script lang="ts">
  import { Notification, Button } from "goose-ui";
<\/script>

<Button
  variant="primary"
  onclick={() => {
    for (let i = 1; i <= 5; i++) {
      setTimeout(() => Notification.success(\`第 \${i} 条消息\`), i * 200);
    }
  }}
>
  连续弹出 5 条
</Button>

<Button variant="ghost" onclick={() => Notification.destroyAll()}>清除全部</Button>`;

  const multiProviderSource = `<script lang="ts">
  import { NotificationProvider, createNotification, createNotificationStore, Button } from "goose-ui";

  // 两个互不干扰的容器：各自一份 store + 各自绑定的快捷 API
  const storeA = createNotificationStore();
  const storeB = createNotificationStore();
  const notifyA = createNotification(storeA);
  const notifyB = createNotification(storeB);
<\/script>

<NotificationProvider store={storeA} offset="top:24px;left:24px;right:auto;transform:none;" />
<NotificationProvider store={storeB} offset="top:140px;left:24px;right:auto;transform:none;" />

<Button variant="primary" onclick={() => notifyA.success({ title: "来自 A 区域", duration: 0 })}>
  A 区域发通知
</Button>
<Button variant="ghost" onclick={() => notifyA.destroyAll()}>清空 A</Button>

<Button variant="default" onclick={() => notifyB.success({ title: "来自 B 区域", duration: 0 })}>
  B 区域发通知
</Button>`;
</script>

<Page toc title="通知 Notification" description="4 种类型、6 个位置、sonner 风格牌堆：超出自动收起、悬停/Alt+T 展开、拖拽滑除">
  <CodePreview anchor="basics-types" anchorLevel={2} title="标题 + 描述" code={titleDescSource}>
    <Row>
      <Button variant="primary" onclick={() => Notification.success({ title: '操作成功', description: '你的数据已保存到服务器，可以在列表中查看。' })}>带描述 Success</Button>
      <Button onclick={() => Notification.info({ title: '系统通知', description: '系统将于今晚 22:00 进行维护，预计持续 30 分钟。' })}>带描述 Info</Button>
      <Button variant="danger" onclick={() => Notification.warning({ title: '磁盘空间不足', description: '当前剩余空间不足 1GB，请及时清理。' })}>带描述 Warning</Button>
      <Button variant="danger" onclick={() => Notification.error({ title: '连接失败', description: '无法连接到服务器，请检查网络后重试。错误码: ERR_NETWORK_TIMEOUT' })}>带描述 Error</Button>
    </Row>
  </CodePreview>

  <CodePreview anchor="types" anchorLevel={3} title="类型 Types" code={typesSource}>
    <Row>
      <Button variant="primary" onclick={() => Notification.success('操作成功！')}>Success</Button>
      <Button onclick={() => Notification.info('这是一条消息')}>Info</Button>
      <Button variant="danger" onclick={() => Notification.warning('请注意！')}>Warning</Button>
      <Button variant="danger" onclick={() => Notification.error('操作失败！')}>Error</Button>
    </Row>
  </CodePreview>

  <CodePreview anchor="position-duration" anchorLevel={2} title="位置 Positions" code={positionsSource}>
    <Row>
      <Button onclick={() => Notification.success({ title: '左上通知', position: 'top-left' })}>左上</Button>
      <Button onclick={() => Notification.success({ title: '顶部居中', position: 'top' })}>顶部居中</Button>
      <Button onclick={() => Notification.success({ title: '右上通知', position: 'top-right' })}>右上</Button>
    </Row>
    <div class="demo-row" style="margin-top:8px">
      <Button onclick={() => Notification.success({ title: '左下通知', position: 'bottom-left' })}>左下</Button>
      <Button onclick={() => Notification.success({ title: '底部居中', position: 'bottom' })}>底部居中</Button>
      <Button onclick={() => Notification.success({ title: '右下通知', position: 'bottom-right' })}>右下</Button>
    </div>
  </CodePreview>

  <CodePreview anchor="custom-look" anchorLevel={2} title="自定义 Duration" code={durationSource}>
    <Row>
      <Button onclick={() => Notification.info({ title: '3 秒后关闭',showProgress: true, duration: 3000 })}>3 秒</Button>
      <Button onclick={() => Notification.info({ title: '10 秒后关闭',showProgress: true, duration: 10000 })}>10 秒</Button>
      <Button onclick={() => Notification.warning({ title: '不会自动关闭', description: '点击 X 关闭', duration: 0 })}>不自动关闭1</Button>
      <Button onclick={() => Notification.warning({ title: '不会自动关闭', description: '点击 X 关闭', duration: 0 })}>不自动关闭2</Button>
    </Row>
  </CodePreview>

  <CodePreview anchor="icon" anchorLevel={3} title="自定义图标 icon" code={iconSource}>
    <Row>
      <Button onclick={() => Notification.success({ title: '收藏成功', icon: Star })}>Star 图标</Button>
      <Button onclick={() => Notification.info({ title: '已添加到书签', icon: Bookmark })}>Bookmark 图标</Button>
      <Button onclick={() => Notification.warning({ title: '小心操作', icon: Zap })}>Zap 图标</Button>
      <Button onclick={() => Notification.error({ title: '取消成功', icon: Heart })}>Heart 图标</Button>
    </Row>
  </CodePreview>

  <CodePreview anchor="key" anchorLevel={3} title="按 key 更新/关闭" code={keySource}>
    <Row>
      <Button
        variant="primary"
        onclick={() => {
          keyDemoCount++;
          Notification.success({
            key: 'key-demo',
            title: `更新 #${keyDemoCount}`,
            description: `这是第 ${keyDemoCount} 次调用，同 key 会更新而非新增`,
          });
        }}
      >
        同 key 更新通知
      </Button>
      <Button variant="ghost" onclick={() => Notification.destroy('key-demo')}>按 key 关闭</Button>
    </Row>
  </CodePreview>

  <CodePreview anchor="callbacks" anchorLevel={2} title="点击回调 onClick" code={onClickSource}>
    <Row>
      <Button onclick={() => Notification.info({ title: '点击这条通知', onClick: () => Notification.success('通知被点击了！') })}>点击通知触发回调</Button>
    </Row>
  </CodePreview>

  <CodePreview anchor="onclose" anchorLevel={3} title="关闭回调 onClose" code={onCloseSource}>
    <Row>
      <Button onclick={() => Notification.info({ title: '关闭后触发回调', duration: 3000, onClose: () => Notification.success('通知已关闭！') })}>关闭时触发回调</Button>
    </Row>
  </CodePreview>

  <CodePreview anchor="closeicon" anchorLevel={3} title="自定义关闭图标 closeIcon" code={closeIconSource}>
    <Row>
      <Button onclick={() => Notification.info({ title: 'Bookmark 关闭图标', closeIcon: Bookmark, duration: 0 })}>Bookmark 关闭</Button>
      <Button onclick={() => Notification.warning({ title: 'Heart 关闭图标', closeIcon: Heart, duration: 0 })}>Heart 关闭</Button>
    </Row>
  </CodePreview>

  <CodePreview anchor="pauseonhover" anchorLevel={3} title="悬停暂停 pauseOnHover" code={pauseOnHoverSource}>
    <Row>
      <Button onclick={() => Notification.info({ title: '悬停暂停计时', description: '鼠标悬停时暂停自动关闭，移开后继续倒计时', duration: 8000, showProgress: true, pauseOnHover: true })}>悬停暂停（默认开启）</Button>
      <Button onclick={() => Notification.warning({ title: '悬停不暂停', description: '即使悬停也会自动关闭', duration: 8000, showProgress: true, pauseOnHover: false })}>悬停不暂停</Button>
    </Row>
  </CodePreview>

  <CodePreview anchor="advanced" anchorLevel={2} title="进度条 showProgress" code={progressSource}>
    <Row>
      <Button onclick={() => Notification.success({ title: '带进度条', description: '底部显示自动关闭进度', duration: 6000, showProgress: true })}>Success + 进度条</Button>
      <Button onclick={() => Notification.info({ title: '带进度条', description: '底部显示自动关闭进度', duration: 6000, showProgress: true })}>Info + 进度条</Button>
      <Button onclick={() => Notification.warning({ title: '带进度条', description: '底部显示自动关闭进度', duration: 6000, showProgress: true })}>Warning + 进度条</Button>
      <Button onclick={() => Notification.error({ title: '带进度条', description: '底部显示自动关闭进度', duration: 6000, showProgress: true })}>Error + 进度条</Button>
    </Row>
  </CodePreview>

  <CodePreview anchor="stack" anchorLevel={3} title="连续弹出" code={stackSource}>
    <Row>
      <Button
        variant="primary"
        onclick={() => {
          for (let i = 1; i <= 5; i++) {
            setTimeout(() => Notification.success(`第 ${i} 条消息`), i * 200);
          }
        }}
      >
        连续弹出 5 条
      </Button>
      <Button
        onclick={() => {
          for (let i = 1; i <= 8; i++) {
            setTimeout(
              () =>
                Notification.success({
                  title: `牌堆第 ${i} 条`,
                  description: '超出可见数自动收起为牌堆，悬停或 Alt+T 展开，按住可拖拽滑除',
                  duration: 0,
                }),
              i * 150
            );
          }
        }}
      >
        弹 8 条（不自动关闭）
      </Button>
      <Button variant="ghost" onclick={() => Notification.destroyAll()}>清除全部</Button>
    </Row>
    <p class="hint">
      默认可见 3 层：最新一张完整可见，其余收起为 14px 边缘条（逐层缩小 5%）；悬停牌堆或按 Alt+T 展开全部，Escape 收起；按住任意通知朝允许方向拖动超过 45px 即可滑除。
    </p>
  </CodePreview>

  <CodePreview anchor="provider" anchorLevel={3} title="多个 Provider 相互独立" code={multiProviderSource}>
    <p class="api-note">
      默认情况下所有 <code>&lt;NotificationProvider /&gt;</code> 渲染同一份全局 store（配合 <code>Notification.xxx()</code>）。
      需要独立容器时：用 <code>createNotificationStore()</code> 各建一份，分别传给 Provider 的 <code>store</code> prop
      与 <code>createNotification(store)</code> —— 两边的通知列表、id 序列、暂停位完全隔离，
      卸载其中一个也不影响另一个。
    </p>
    <div class="prov-row">
      <div class="prov-box">
        <NotificationProvider store={storeA} class="prov-a" offset="top:24px;left:24px;right:auto;transform:none;" />
        <Button variant="primary" onclick={() => notifyA.success({ title: '来自 A 区域', duration: 0 })}>
          A 区域发通知
        </Button>
        <Button class="probe-clear-a" variant="ghost" onclick={() => notifyA.destroyAll()}>清空 A</Button>
      </div>
      <div class="prov-box">
        <NotificationProvider store={storeB} class="prov-b" offset="top:140px;left:24px;right:auto;transform:none;" />
        <Button variant="default" onclick={() => notifyB.success({ title: '来自 B 区域', duration: 0 })}>
          B 区域发通知
        </Button>
      </div>
    </div>
    <p class="api-note" style="margin-top:12px">
      <code>offset</code> 是可选的位置微调片段（默认空 = 行为不变），用来把多个容器的浮层错开。
    </p>
  </CodePreview>

  <Card title="NotificationOptions 参数">
    <p class="api-note">
      快捷用法：<code>Notification.success('消息')</code> 或 <code>Notification.open(options)</code>；
      另有 <code>destroy(keyOrId)</code> / <code>destroyAll()</code>，第一个参数可传字符串或完整 options。
    </p>
    <p class="api-note">
      <code>&lt;NotificationProvider /&gt;</code> 容器可配 props：
      <code>gap</code>（牌堆间距，默认 14）、
      <code>visibleToasts</code>（收起时可见层数，默认 3）、
      <code>expand</code>（强制常展开，默认 false）、
      <code>hotkey</code>（展开热键，默认 Alt+T）、
      <code>offset</code>（位置微调样式片段，默认空；多 Provider 同挂载时用来错开浮层）。
      每个 Provider 各自持有独立 store，互不共享。
    </p>
    <PropsTable anchor="props" items={notificationProps} />
  </Card>
</Page>

<style>
  .hint { font-size: 12px; color: var(--text-muted); margin: 8px 0 0; }
  .api-note { font-size: 13px; color: var(--text-muted); margin: 0 0 12px; line-height: 1.8; }
  .api-note code { font-family: var(--font-mono); font-size: 12px; }
  .prov-row { display: flex; gap: 16px; flex-wrap: wrap; }
  /* 每个 Provider 的浮层是 fixed 定位，无法用 DOM 祖先区分归属；
     这里用 position:relative 建两个独立 stacking context（各自 z-index 独立），
     浮层在视觉上被限制在按钮附近，便于目检「谁发的通知出现在谁的区域」。 */
  .prov-box {
    position: relative;
    z-index: 0;
    isolation: isolate;
    display: flex;
    align-items: center;
    min-width: 200px;
    min-height: 96px;
    padding: var(--sp-lg);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-md);
  }
</style>

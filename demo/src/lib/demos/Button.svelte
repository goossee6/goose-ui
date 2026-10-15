<script lang="ts">
  import {Button, Card, Page, Notification, ThemeToggle, Row} from "goose-ui";
  import Zap from "@lucide/svelte/icons/zap";
  import Heart from "@lucide/svelte/icons/heart";
  import ExternalLink from "@lucide/svelte/icons/external-link";

  let loading = $state(false);

  function simulateLoading() {
    loading = true;
    setTimeout(() => {
      loading = false;
      Notification.success("加载完成");
    }, 1500);
  }
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const buttonProps: PropsTableItem[] = [
    { name: "variant", desc: "按钮风格变体", type: "'primary' | 'default' | 'ghost' | 'danger' | 'link'", default: "'default'" },
    { name: "size", desc: "尺寸，预设字符串或自定义数值(px)", type: "'small' | 'middle' | 'large' | 'icon' | 'icon-sm' | 'icon-xs' | 'icon-lg' | number", default: "'middle'" },
    { name: "disabled", desc: "禁用状态", type: "boolean", default: "false" },
    { name: "loading", desc: "加载中：显示 spinner 并阻止点击", type: "boolean", default: "false" },
    { name: "type", desc: "原生 button 类型", type: "'button' | 'submit'", default: "'button'" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "icon", desc: "左侧图标组件", type: "Component" },
    { name: "iconRight", desc: "右侧图标组件", type: "Component" },
    { name: "iconSize", desc: "图标尺寸(px)", type: "number", default: "16" },
    { name: "children", desc: "按钮内容", type: "Snippet" },
    { name: "onclick", desc: "点击回调", type: "(event: MouseEvent) => void" },
    { name: "...rest", desc: "透传原生属性（如 ariaLabel、style）", type: "[key: string]: unknown" },
  ];

  const variantSource = `<script lang="ts">
  import { Button, Notification, Row } from "goose-ui";
<\/script>

<Row>
  <Button variant="primary" onclick={() => Notification.success("Primary 被点击")}>Primary 主要</Button>
  <Button onclick={() => Notification.success("Default 被点击")}>Default 默认</Button>
  <Button variant="ghost" onclick={() => Notification.success("Ghost 被点击")}>Ghost 幽灵</Button>
  <Button variant="danger" onclick={() => Notification.error("Danger 被点击")}>Danger 危险</Button>
  <Button variant="link" onclick={() => Notification.success("Link 被点击")}>Link 链接</Button>
</Row>`;

  const sizeSource = `<script lang="ts">
  import { Button, Notification, Row } from "goose-ui";
<\/script>

<Row>
  <Button size="small" onclick={() => Notification.success("small 按钮被点击")}>small</Button>
  <Button onclick={() => Notification.success("middle 按钮被点击")}>middle (默认)</Button>
  <Button size="large" onclick={() => Notification.success("large 按钮被点击")}>large</Button>
  <Button size={40} onclick={() => Notification.success("size=40 按钮被点击")}>size=40</Button>
</Row>`;

  const iconOnlySource = `<script lang="ts">
  import { Button, Notification, Row } from "goose-ui";
  import Heart from "@lucide/svelte/icons/heart";
<\/script>

<Row>
  <Button size="icon-sm" icon={Heart} ariaLabel="icon-sm" onclick={() => Notification.success("icon-sm 被点击")} />
  <Button size="icon" icon={Heart} ariaLabel="icon" onclick={() => Notification.success("icon 被点击")} />
  <Button size="icon-lg" icon={Heart} ariaLabel="icon-lg" onclick={() => Notification.success("icon-lg 被点击")} />
</Row>`;

  const iconSource = `<script lang="ts">
  import { Button, Notification, Row } from "goose-ui";
  import Zap from "@lucide/svelte/icons/zap";
  import Heart from "@lucide/svelte/icons/heart";
  import ExternalLink from "@lucide/svelte/icons/external-link";
<\/script>

<Row>
  <Button icon={Zap} onclick={() => Notification.success("左侧图标被点击")}>左侧图标</Button>
  <Button iconRight={ExternalLink} onclick={() => Notification.success("右侧图标被点击")}>右侧图标</Button>
  <Button icon={Heart} iconRight={ExternalLink} onclick={() => Notification.success("左右图标被点击")}>左右图标</Button>
</Row>`;

  const loadingSource = `<script lang="ts">
  import { Button, Notification, Row } from "goose-ui";
  import Zap from "@lucide/svelte/icons/zap";

  let loading = $state(false);

  function simulateLoading() {
    loading = true;
    setTimeout(() => {
      loading = false;
      Notification.success("加载完成");
    }, 1500);
  }
<\/script>

<Row>
  <Button {loading} onclick={simulateLoading}>
    {loading ? "处理中…" : "点击加载"}
  </Button>
  <Button loading={true}>持续加载中</Button>
  <Button loading={true} icon={Zap}>带图标加载中</Button>
</Row>`;

  const disabledSource = `<script lang="ts">
  import { Button, Row } from "goose-ui";
<\/script>

<Row>
  <Button disabled>Primary 禁用</Button>
  <Button disabled>Default 禁用</Button>
  <Button variant="danger" disabled>Danger 禁用</Button>
  <Button variant="ghost" disabled>Ghost 禁用</Button>
</Row>`;

  const themeSource = `<script lang="ts">
  import { ThemeToggle, Row } from "goose-ui";
<\/script>

<Row>
  <ThemeToggle />
</Row>`;
</script>

<Page title="按钮 Button" description="五种变体、多种尺寸、loading 状态、左右图标" >
  <CodePreview title="变体 Variants" code={variantSource}>
    <Row>
      <Button variant="primary" onclick={() => Notification.success("Primary 被点击")}>Primary 主要</Button>
      <Button onclick={() => Notification.success("Default 被点击")}>Default 默认</Button>
      <Button variant="ghost" onclick={() => Notification.success("Ghost 被点击")}>Ghost 幽灵</Button>
      <Button variant="danger" onclick={() => Notification.error("Danger 被点击")}>Danger 危险</Button>
      <Button variant="link" onclick={() => Notification.success("Link 被点击")}>Link 链接</Button>
    </Row>
  </CodePreview>

  <CodePreview title="尺寸 Sizes" code={sizeSource}>
    <Row>
      <Button size="small" onclick={() => Notification.success("small 按钮被点击")}>small</Button>
      <Button onclick={() => Notification.success("middle 按钮被点击")}>middle (默认)</Button>
      <Button size="large" onclick={() => Notification.success("large 按钮被点击")}>large</Button>
      <Button size={40} onclick={() => Notification.success("size=40 按钮被点击")}>size=40</Button>
    </Row>
  </CodePreview>

  <CodePreview title="图标按钮 Icon Buttons" code={iconOnlySource}>
    <Row>
      <Button size="icon-sm" icon={Heart} ariaLabel="icon-sm" onclick={() => Notification.success("icon-sm 被点击")} />
      <Button size="icon" icon={Heart} ariaLabel="icon" onclick={() => Notification.success("icon 被点击")} />
      <Button size="icon-lg" icon={Heart} ariaLabel="icon-lg" onclick={() => Notification.success("icon-lg 被点击")} />
    </Row>
  </CodePreview>

  <CodePreview title="带图标 With Icons" code={iconSource}>
    <Row>
      <Button icon={Zap} onclick={() => Notification.success("左侧图标被点击")}>左侧图标</Button>
      <Button iconRight={ExternalLink} onclick={() => Notification.success("右侧图标被点击")}>右侧图标</Button>
      <Button icon={Heart} iconRight={ExternalLink} onclick={() => Notification.success("左右图标被点击")}>左右图标</Button>
    </Row>
  </CodePreview>

  <CodePreview title="Loading 加载状态" code={loadingSource}>
    <Row>
      <Button {loading} onclick={simulateLoading}>
        {loading ? "处理中…" : "点击加载"}
      </Button>
      <Button loading={true}>持续加载中</Button>
      <Button loading={true} icon={Zap}>带图标加载中</Button>
    </Row>
    <p class="hint">loading 状态最少显示 1000ms，避免快速闪烁。</p>
  </CodePreview>

  <CodePreview title="Disabled 禁用" code={disabledSource}>
    <Row>
      <Button disabled>Primary 禁用</Button>
      <Button disabled>Default 禁用</Button>
      <Button variant="danger" disabled>Danger 禁用</Button>
      <Button variant="ghost" disabled>Ghost 禁用</Button>
    </Row>
  </CodePreview>

  <CodePreview title="主题切换" code={themeSource}>
    <Row>
      <ThemeToggle />
    </Row>
  </CodePreview>
  <Card title="Props">
    <PropsTable items={buttonProps} />
  </Card>
</Page>

<style>
  .hint {
    font-size: 12px;
    color: var(--text-muted);
    margin: 10px 0 0;
  }
</style>

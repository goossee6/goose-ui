<script lang="ts">
  import {Card, Page, Icon, Row} from "goose-ui";
  import Zap from '@lucide/svelte/icons/zap';
  import Heart from '@lucide/svelte/icons/heart';
  import Settings from '@lucide/svelte/icons/settings';
  import FileText from '@lucide/svelte/icons/file-text';
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const iconProps: PropsTableItem[] = [
    { name: "icon", desc: "图标组件（lucide-svelte 图标）", type: "Component<{ size?: number; class?: string }>" },
    { name: "size", desc: "尺寸(px)", type: "number", default: "20" },
    { name: "spin", desc: "加载旋转动画", type: "boolean", default: "false" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const sizeSource = `<script lang="ts">
  import { Icon, Row } from "goose-ui";
  import Zap from "@lucide/svelte/icons/zap";
  import Heart from "@lucide/svelte/icons/heart";
  import Settings from "@lucide/svelte/icons/settings";
  import FileText from "@lucide/svelte/icons/file-text";
<\/script>

<Row>
  <Icon icon={Zap} size={16} />
  <Icon icon={Heart} size={20} />
  <Icon icon={Settings} size={24} />
  <Icon icon={FileText} size={28} />
</Row>`;
</script>

<Page title="图标 Icon" description="基于 lucide-svelte 的图标组件" >
  <CodePreview title="不同尺寸" code={sizeSource}>
    <Row>
      <Icon icon={Zap} size={16} />
      <Icon icon={Heart} size={20} />
      <Icon icon={Settings} size={24} />
      <Icon icon={FileText} size={28} />
    </Row>
  </CodePreview>
  <Card title="Props">
    <PropsTable items={iconProps} />
  </Card>
</Page>

<style>
</style>

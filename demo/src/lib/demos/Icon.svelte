<script lang="ts">
  import {Card, Page, Icon, Row} from "goose-ui";
  import { Zap, Heart, Settings, FileText } from '@lucide/svelte';
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const iconProps: PropsTableItem[] = [
    { name: "icon", desc: "图标组件（lucide-svelte 图标）", type: "Component<{ size?: number; class?: string }>" },
    { name: "size", desc: "尺寸(px)", type: "number", default: "20" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
  ];
</script>

<Page title="图标 Icon" description="基于 lucide-svelte 的图标组件" >
  <Card title="不同尺寸">
    <Row>
      <Icon icon={Zap} size={16} />
      <Icon icon={Heart} size={20} />
      <Icon icon={Settings} size={24} />
      <Icon icon={FileText} size={28} />
    </Row>
  </Card>
  <Card title="Props">
    <PropsTable items={iconProps} />
  </Card>
</Page>

<style>
</style>

<script lang="ts">
  import {Card, DropZone, Page, Notification} from "goose-ui";

  function handleDrop1(dropped: File[]) {
    Notification.success(`收到 ${dropped.length} 个文件: ${dropped.map(f => f.name).join(', ')}`);
  }

  function handleDrop2(dropped: File[]) {
    Notification.success(`收到 ${dropped.length} 个图片文件`);
  }
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const dropZoneProps: PropsTableItem[] = [
    { name: "accept", desc: "允许的文件类型（原生 accept 属性）", type: "string", default: "''" },
    { name: "multiple", desc: "是否允许多文件", type: "boolean", default: "false" },
    { name: "placeholder", desc: "拖拽区主文案", type: "string", default: "'拖拽文件到此处'" },
    { name: "hint", desc: "底部提示文案", type: "string", default: "''" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
    { name: "ondrop", desc: "选中/拖入文件回调", type: "(files: File[]) => void" },
  ];

  const basicSource = `<script lang="ts">
  import { DropZone } from "goose-ui";

  function handleDrop(dropped: File[]) {
    console.log(dropped.map((f) => f.name));
  }
<\/script>

<DropZone placeholder="拖拽文件到此处" hint="支持任意文件格式" ondrop={handleDrop} />`;

  const multipleSource = `<script lang="ts">
  import { DropZone } from "goose-ui";

  function handleDrop(dropped: File[]) {
    console.log(dropped.map((f) => f.name));
  }
<\/script>

<DropZone multiple placeholder="拖拽多个文件" hint="可同时选择多个文件" ondrop={handleDrop} />`;

  const acceptSource = `<script lang="ts">
  import { DropZone } from "goose-ui";

  function handleDrop(dropped: File[]) {
    console.log(dropped.map((f) => f.name));
  }
<\/script>

<DropZone
  accept=".png,.jpg,.gif,.webp"
  placeholder="拖拽图片文件"
  hint="仅支持 PNG, JPG, GIF, WebP"
  ondrop={handleDrop}
/>`;
</script>

<Page title="DropZone 拖拽上传" description="固定高度的文件拖拽上传区域，拖入后原位显示文件名与大小；类型不符或多拖时给出提示，支持类型过滤和多文件" >
  <CodePreview title="基础用法" code={basicSource}>
    <div class="demo-col">
      <DropZone placeholder="拖拽文件到此处" hint="支持任意文件格式" ondrop={handleDrop1} />
    </div>
  </CodePreview>

  <CodePreview title="多文件上传" code={multipleSource}>
    <div class="demo-col">
      <DropZone multiple placeholder="拖拽多个文件" hint="可同时选择多个文件" ondrop={handleDrop1} />
    </div>
  </CodePreview>

  <CodePreview title="限制文件类型" code={acceptSource}>
    <div class="demo-col">
      <DropZone accept=".png,.jpg,.gif,.webp" placeholder="拖拽图片文件" hint="仅支持 PNG, JPG, GIF, WebP" ondrop={handleDrop2} />
    </div>
  </CodePreview>
  <Card title="Props">
    <PropsTable items={dropZoneProps} />
  </Card>
</Page>

<style>
  .demo-col { display: flex; flex-direction: column; gap: 12px; max-width: 400px; }
</style>

<script lang="ts">
  import { Card, DropZone, PageHeader, Notification } from 'goose-ui';

  let files1 = $state<File[]>([]);
  let files2 = $state<File[]>([]);

  function handleDrop1(dropped: File[]) {
    files1 = dropped;
    Notification.success(`收到 ${dropped.length} 个文件: ${dropped.map(f => f.name).join(', ')}`);
  }

  function handleDrop2(dropped: File[]) {
    files2 = dropped;
    Notification.success(`收到 ${dropped.length} 个图片文件`);
  }
</script>

<PageHeader title="DropZone 拖拽上传" description="文件拖拽上传区域，支持文件类型过滤和多文件选择" />

<div class="demo-grid">
  <Card title="基础用法">
    <div class="demo-col">
      <DropZone placeholder="拖拽文件到此处" hint="支持任意文件格式" ondrop={handleDrop1} />
      {#if files1.length > 0}
        <p class="demo-files">已选择: {files1.map(f => f.name).join(', ')}</p>
      {/if}
    </div>
  </Card>

  <Card title="多文件上传">
    <div class="demo-col">
      <DropZone multiple placeholder="拖拽多个文件" hint="可同时选择多个文件" ondrop={handleDrop1} />
    </div>
  </Card>

  <Card title="限制文件类型">
    <div class="demo-col">
      <DropZone accept=".png,.jpg,.gif,.webp" placeholder="拖拽图片文件" hint="仅支持 PNG, JPG, GIF, WebP" ondrop={handleDrop2} />
      {#if files2.length > 0}
        <p class="demo-files">已选择: {files2.map(f => f.name).join(', ')}</p>
      {/if}
    </div>
  </Card>
</div>

<style>
  .demo-grid { display: flex; flex-direction: column; gap: var(--gap-2xl); }
  .demo-col { display: flex; flex-direction: column; gap: 12px; max-width: 400px; }
  .demo-files { font-size: 12px; color: var(--text-muted); margin: 0; }
</style>

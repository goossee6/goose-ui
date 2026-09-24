<script lang="ts">
  import { Card, PageHeader } from 'goose-ui';
</script>

<PageHeader title="Cursor 光标" description="自定义光标" />

<div class="demo-grid">
  <Card title="占位">
    <p class="placeholder">组件尚未实现，敬请期待。</p>
  </Card>
</div>

<style>
  .demo-grid { display: flex; flex-direction: column; gap: var(--gap-2xl); }
  .placeholder { color: var(--text-muted); font-size: 13px; margin: 0; }
</style>

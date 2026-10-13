<script lang="ts">
  import { errorStore } from "../errors";
  import Modal from "../ui/Modal.svelte";
  import Button from "../ui/Button.svelte";
  import { Notification } from "../notification";
  import { copyToClipboard } from "../../utils/clipboard";

  let open = $state(false);

  $effect(() => {
    open = $errorStore.length > 0;
  });

  async function copyItem(item: { kind: string; text: string }) {
    const ok = await copyToClipboard(`[${item.kind}]\n${item.text}`);
    Notification[ok ? "success" : "error"](ok ? "已复制到剪贴板" : "复制失败");
  }

  async function copyAll() {
    const ok = await copyToClipboard($errorStore.map((e) => `[${e.kind}]\n${e.text}`).join("\n\n---\n\n"));
    Notification[ok ? "success" : "error"](ok ? "已复制到剪贴板" : "复制失败");
  }
</script>

<Modal bind:open modeless title="程序错误" width={480} onClose={errorStore.clear} typewriter={false}>
  <div class="error-list">
    {#each $errorStore as item (item.id)}
      <div class="error-item">
        <div class="error-head">
          <span class="error-kind">{item.kind}</span>
          <button class="btn-copy" onclick={() => copyItem(item)}>复制</button>
        </div>
        <pre class="error-text">{item.text}</pre>
      </div>
    {/each}
  </div>
  {#snippet footer()}
    <Button variant="default"   onclick={errorStore.clear}>全部关闭</Button>
    <Button variant="danger"   onclick={copyAll}>复制全部</Button>
  {/snippet}
</Modal>

<style>
  .error-list { display: flex; flex-direction: column; gap: var(--sp-lg); }
  .error-item { border: 1px solid var(--danger-border); border-radius: var(--radius-lg); background-color: var(--danger-soft); overflow: hidden; }
  .error-head { display: flex; align-items: center; justify-content: space-between; padding: var(--sp-md) var(--sp-lg); background-color: rgba(220, 38, 38, 0.15); }
  .error-kind { font-size: 12px; font-weight: 600; color: var(--danger-text); font-family: var(--font-mono); }
  .btn-copy { background: none; border: none; color: var(--text-muted); font-size: 12px; cursor: pointer; padding: 2px var(--sp-sm); border-radius: var(--radius-sm); }
  .btn-copy:hover { background-color: var(--surface-3); color: var(--text-strong); }
  .error-text { margin: 0; padding: var(--sp-lg) var(--sp-lg); font-size: 12px; line-height: 1.5; font-family: var(--font-mono); color: var(--text); white-space: pre-wrap; word-break: break-all; user-select: text; }
</style>

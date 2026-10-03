<script lang="ts">
  import Button from '../ui/Button.svelte';
  import Modal from '../ui/Modal.svelte';
  import { confirmStore } from '../confirm';

  function handleKeydown(e: KeyboardEvent) {
    if (!$confirmStore.open) return;
    if (e.key === 'Enter') confirmStore.confirm();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<Modal
  open={$confirmStore.open}
  title={$confirmStore.title}
  width={400}
  typewriter={true}
  showFooter={false}
  onClose={confirmStore.cancel}
>
  {#snippet footer()}
    <Button variant="ghost" size="middle" onclick={confirmStore.cancel}>
      {$confirmStore.cancelText}
    </Button>
    <Button variant={$confirmStore.danger ? 'danger' : 'primary'} size="middle" onclick={confirmStore.confirm}>
      {$confirmStore.confirmText}
    </Button>
  {/snippet}
  <p class="confirm-message">{$confirmStore.message}</p>
</Modal>

<style>
  .confirm-message {
    margin: 0;
    color: var(--text);
    font-size: 14px;
    line-height: 1.5;
  }
</style>

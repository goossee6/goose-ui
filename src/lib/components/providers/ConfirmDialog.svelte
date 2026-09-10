<script lang="ts">
  import { confirmStore } from "../confirm.ts";
  import Modal from "../ui/Modal.svelte";
  import Button from "../ui/Button.svelte";

  function handleKeydown(e: KeyboardEvent) {
    if (!$confirmStore.open) return;
    if (e.key === "Enter") confirmStore.confirm();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $confirmStore.open}
  <Modal title={$confirmStore.title} size="sm" onClose={confirmStore.cancel}>
    {#snippet footer()}
      <Button variant="cancel" size="md" onclick={confirmStore.cancel}>
        {$confirmStore.cancelText}
      </Button>
      <Button variant={$confirmStore.danger ? "danger" : "primary"} size="md" onclick={confirmStore.confirm}>
        {$confirmStore.confirmText}
      </Button>
    {/snippet}
    <p class="confirm-message">{$confirmStore.message}</p>
  </Modal>
{/if}

<style>
  .confirm-message {
    margin: 0;
    color: var(--text);
    font-size: 14px;
    line-height: 1.5;
  }
</style>

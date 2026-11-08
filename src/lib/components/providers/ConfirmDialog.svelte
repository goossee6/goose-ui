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

<!-- 带明细时关掉打字机：Modal 的打字机是把内容截成字符串逐字 @html 出来的，
     几十项的清单要打两三秒（每字最低 5ms），而这份清单正是用户此刻要核对的东西，
     让他等一段没有信息量的动画没有意义。正文短、需要一点动画感时不传 detail 即可。 -->
<Modal
  open={$confirmStore.open}
  title={$confirmStore.title}
  width={400}
  typewriter={!$confirmStore.detail}
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
  {#if $confirmStore.detail}
    <div class="confirm-detail">
      {#if $confirmStore.detailLabel}
        <span class="confirm-detail-label">{$confirmStore.detailLabel}</span>
      {/if}
      <!-- 明细自己滚，不靠 modal-body 滚：清单可能有上百项，
           让整框滚会把「取消 / 强制结束」两个按钮推出视野。 -->
      <pre class="confirm-detail-text">{$confirmStore.detail}</pre>
    </div>
  {/if}
</Modal>

<style>
  .confirm-message {
    margin: 0;
    color: var(--text);
    font-size: var(--fs-14);
    line-height: 1.5;
  }

  .confirm-detail {
    margin-top: var(--space-3);
  }

  .confirm-detail-label {
    display: block;
    margin-bottom: var(--space-1-5);
    color: var(--text-muted);
    font-size: var(--font-sm);
    line-height: 1.4;
  }

  /* 用户可能要把 PID 抄去别处（命令行、任务管理器核对），
     所以是可选中的等宽正文，而不是拼进 message 的一长串。 */
  .confirm-detail-text {
    margin: 0;
    max-height: 168px;
    overflow: auto;
    padding: var(--space-2) var(--space-2-5);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface-2);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: var(--font-sm);
    line-height: 1.65;
    white-space: pre-wrap;
    word-break: break-word;
    user-select: text;
  }
</style>

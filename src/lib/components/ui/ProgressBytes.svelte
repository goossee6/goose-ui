<script lang="ts">
	import { formatBytes } from '../../utils/format';

	let {
		fileName = '',
		progress = 0,
		speed = '',
		eta = '',
		loadedBytes = 0,
		totalBytes = 0,
		totalParts = 0,
		partIndex = 0,
		onCancel,
		disabled = false,
	}: {
		fileName?: string;
		progress?: number;
		speed?: string;
		eta?: string;
		loadedBytes?: number;
		totalBytes?: number;
		totalParts?: number;
		partIndex?: number;
		onCancel?: () => void;
		disabled?: boolean;
	} = $props();

	const clamped = $derived(Math.min(100, Math.max(0, progress)));
	const isMultipart = $derived(totalParts > 0);
</script>

<div class="progress-bytes">
	<div class="progress-top">
		<span class="progress-filename">{fileName || '上传中...'}</span>
		{#if onCancel && !disabled}
			<button class="progress-cancel" onclick={onCancel}>取消</button>
		{/if}
	</div>
	<div class="progress-track">
		<div class="progress-bar" style="width: {clamped}%"></div>
	</div>
	<div class="progress-bottom">
		<span>
			{formatBytes(loadedBytes)} / {formatBytes(totalBytes)} ({clamped}%)
			{#if speed}&middot; {speed}{/if}
			{#if isMultipart}&middot; {partIndex}/{totalParts} 分片{/if}
		</span>
		{#if eta}
			<span>预计: {eta}</span>
		{/if}
	</div>
</div>

<style>
	.progress-bytes { margin-top: var(--sp-lg); display: flex; flex-direction: column; gap: var(--sp-xl); }
	.progress-top { display: flex; align-items: center; justify-content: space-between; }
	.progress-filename { font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%; }
	.progress-cancel { font-size: 12px; color: var(--text-muted); background: none; border: none; cursor: pointer; padding: 0; flex-shrink: 0; transition: color 0.15s; }
	.progress-cancel:hover { color: var(--text-strong); }
	.progress-track { width: 100%; background-color: var(--surface-2); border-radius: 9999px; height: 12px; overflow: hidden; }
	.progress-bar { height: 100%; border-radius: 9999px; background-color: var(--primary); transition: width 0.3s; }
	.progress-bottom { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-muted); }
</style>

<script lang="ts">
	import Button from './Button.svelte';
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
		class: cls = '',
		style = '',
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
		class?: string;
		style?: string;
	} = $props();

	const clamped = $derived(Math.min(100, Math.max(0, progress)));
	const isMultipart = $derived(totalParts > 0);
</script>

<div class="progress-bytes {cls}" style={style}>
	<div class="progress-row1">
		<span class="progress-filename">{fileName || '上传中...'}</span>
		<span class="progress-right">
			{#if eta}<span class="progress-eta">预计: {eta}</span>{/if}
			{#if onCancel && !disabled}
				<Button variant="text" size="xs" class="progress-cancel" onclick={onCancel}>取消</Button>
			{/if}
		</span>
	</div>
	<div class="progress-row2">
		<span class="progress-bytes-info">{formatBytes(loadedBytes)} / {formatBytes(totalBytes)}</span>
		<span class="progress-stats">
			{clamped}%
			{#if speed}&middot; {speed}{/if}
			{#if isMultipart}&middot; {partIndex}/{totalParts} 分片{/if}
		</span>
	</div>
	<div class="progress-track">
		<div class="progress-bar" style="width: {clamped}%"></div>
	</div>
</div>

<style>
	.progress-bytes { margin-top: var(--sp-lg); display: flex; flex-direction: column; gap: 6px; }
	.progress-row1 { display: flex; align-items: center; justify-content: space-between; }
	.progress-filename { font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; }
	.progress-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
	.progress-eta { font-size: 12px; color: var(--text-muted); }
	.progress-row2 { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-muted); }
	.progress-bytes-info { font-variant-numeric: tabular-nums; }
	.progress-stats { font-variant-numeric: tabular-nums; }
	.progress-track { width: 100%; background-color: var(--surface-2); border-radius: 9999px; height: 12px; overflow: hidden; }
	.progress-bar { height: 100%; border-radius: 9999px; background-color: var(--primary); transition: width 0.3s; }
</style>

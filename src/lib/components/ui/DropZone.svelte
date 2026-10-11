<script lang="ts">
	import { onDestroy } from 'svelte';
	import Button from './Button.svelte';
	import { formatBytes } from '../../utils/format';
	import type { Snippet } from 'svelte';

	let {
		accept = '',
		multiple = false,
		placeholder = '拖拽文件到此处',
		hint = '',
		class: cls = '',
		style = '',
		ondrop,
	}: {
		accept?: string;
		multiple?: boolean;
		placeholder?: string;
		hint?: string;
		class?: string;
		style?: string;
		ondrop?: (files: File[]) => void;
	} = $props();

	let fileInput: HTMLInputElement;
	let isDragging = $state(false);
	let zoneFiles = $state<File[]>([]);
	let flashMsg = $state('');
	let flashTimer: ReturnType<typeof setTimeout> | undefined;

	function flash(msg: string) {
		flashMsg = msg;
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => {
			flashMsg = '';
		}, 2500);
	}

	onDestroy(() => clearTimeout(flashTimer));

	function handleClick() {
		fileInput.click();
	}

	function fileMatchesAccept(file: File): boolean {
		if (!accept) return true;
		const name = file.name.toLowerCase();
		const type = file.type.toLowerCase();
		return accept.split(',').some((raw) => {
			const token = raw.trim().toLowerCase();
			if (!token) return false;
			if (token.startsWith('.')) return name.endsWith(token);
			if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
			return type === token;
		});
	}

	function handleFiles(files: FileList | null | undefined) {
		if (!files || files.length === 0) return;
		const list = Array.from(files);
		const accepted = list.filter(fileMatchesAccept);
		const typeDropped = list.length - accepted.length;
		let next = accepted;
		let countDropped = 0;
		if (!multiple) {
			countDropped = Math.max(0, accepted.length - 1);
			next = accepted.slice(0, 1);
		}
		const msgs: string[] = [];
		if (typeDropped > 0) msgs.push(`${typeDropped} 个文件类型不支持，已忽略`);
		if (countDropped > 0) msgs.push('一次仅可选择 1 个文件，已取第一个');
		if (msgs.length > 0) flash(msgs.join('；'));
		if (next.length === 0) return;
		zoneFiles = next;
		ondrop?.(next);
	}

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		handleFiles(target?.files);
		target.value = '';
	}
</script>

<div
	class="drop-zone {cls} {isDragging ? 'drop-zone--active' : ''}"
	style={style || undefined}
	role="presentation"
	ondragover={(e) => { e.preventDefault(); isDragging = true; }}
	ondragleave={() => { isDragging = false; }}
	ondrop={(e) => { e.preventDefault(); isDragging = false; handleFiles(e.dataTransfer?.files); }}
>
	{#if isDragging}
		<p class="drop-zone-text">松开以添加文件</p>
	{:else if zoneFiles.length > 0}
		<ul class="drop-zone-files">
			{#each zoneFiles as f (f.name + ':' + f.size)}
				<li class="drop-zone-file">
					<span class="drop-zone-file-name" title={f.name}>{f.name}</span>
					<span class="drop-zone-file-size">{formatBytes(f.size)}</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="drop-zone-text">{placeholder}</p>
		{#if hint}
			<p class="drop-zone-hint">{hint}</p>
		{/if}
	{/if}
	{#if flashMsg}
		<p class="drop-zone-flash">{flashMsg}</p>
	{/if}
	<input
		type="file"
		{accept}
		{multiple}
		class="drop-zone-input"
		bind:this={fileInput}
		onchange={handleFileChange}
	/>
	<Button variant="default" size="small" onclick={handleClick}>选择文件</Button>
</div>

<style>
	.drop-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 140px;
		gap: var(--sp-md);
		border: 2px dashed var(--border-strong);
		border-radius: var(--radius-lg);
		padding: var(--sp-lg);
		text-align: center;
		transition: border-color 0.15s, background-color 0.15s;
		box-sizing: border-box;
	}
	.drop-zone--active {
		border-color: var(--primary);
		background-color: var(--primary-soft);
	}
	.drop-zone-text {
		font-size: 14px;
		color: var(--text-muted);
		margin: 0;
	}
	.drop-zone--active .drop-zone-text {
		color: var(--primary);
		font-weight: 500;
	}
	.drop-zone-hint {
		font-size: 12px;
		color: var(--text-muted);
		margin: 0;
	}
	.drop-zone-flash {
		font-size: 12px;
		color: var(--danger-text);
		margin: 0;
	}
	.drop-zone-files {
		display: flex;
		flex-direction: column;
		gap: 4px;
		width: 100%;
		max-height: 64px;
		overflow-y: auto;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.drop-zone-file {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--sp-md);
		font-size: 12px;
		color: var(--text);
		line-height: 1.5;
	}
	.drop-zone-file-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: left;
		min-width: 0;
	}
	.drop-zone-file-size {
		color: var(--text-muted);
		flex-shrink: 0;
	}
	.drop-zone-input { display: none; }
</style>

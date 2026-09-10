<script lang="ts">
	import Button from './Button.svelte';
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
		ondrop?: (paths: string[]) => void;
	} = $props();

	let fileInput: HTMLInputElement;
	let isDragging = $state(false);

	function handleClick() {
		fileInput.click();
	}

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const files = target?.files;
		if (!files || files.length === 0) return;
		ondrop?.(Array.from(files).map((f) => f.name));
		target.value = '';
	}
</script>

<div
	class="drop-zone {cls} {isDragging ? 'drop-zone--active' : ''}"
	style={style || undefined}
	role="presentation"
	ondragover={(e) => { e.preventDefault(); isDragging = true; }}
	ondragleave={() => { isDragging = false; }}
	ondrop={(e) => { e.preventDefault(); isDragging = false; }}
>
	{#if isDragging}
		<p class="drop-zone-text">松开以添加文件</p>
	{:else}
		<p class="drop-zone-text">{placeholder}</p>
		{#if hint}
			<p class="drop-zone-hint">{hint}</p>
		{/if}
	{/if}
	<input
		type="file"
		{accept}
		{multiple}
		class="drop-zone-input"
		bind:this={fileInput}
		onchange={handleFileChange}
	/>
	<Button variant="cancel" size="sm" onclick={handleClick}>选择文件</Button>
</div>

<style>
	.drop-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--gap-md);
		border: 2px dashed var(--border-strong);
		border-radius: var(--radius-2xl);
		padding: var(--sp-4xl);
		text-align: center;
		transition: border-color 0.15s, background-color 0.15s;
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
	.drop-zone-input { display: none; }
</style>

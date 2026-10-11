<script lang="ts">
	let {
		src = '',
		alt = '',
		width = '',
		height = '',
		fit = 'cover',
		rounded = false,
		preview = true,
		lazy = true,
		fallback,
		onerror,
		class: cls = '',
		style = '',
	}: {
		src?: string;
		alt?: string;
		width?: string;
		height?: string;
		fit?: 'cover' | 'contain' | 'fill' | 'none';
		rounded?: boolean;
		preview?: boolean;
		lazy?: boolean;
		fallback?: import('svelte').Snippet;
		onerror?: () => void;
		class?: string;
		style?: string;
	} = $props();

	let failed = $state(false);
	let zoomed = $state(false);

	function handleLoadError() {
		failed = true;
		onerror?.();
	}

	function openZoom() {
		if (!preview || failed) return;
		zoomed = true;
	}

	$effect(() => {
		if (!zoomed) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') zoomed = false;
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<span class="image-wrap {cls}" class:rounded style={style}>
	{#if failed}
		<span class="image-fallback" style:width={width || '100%'} style:height={height || '100%'}>
			{#if fallback}
				{@render fallback()}
			:else
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
				</svg>
				<span class="image-fallback-text">{alt || '加载失败'}</span>
			{/if}
		</span>
	{:else}
		<img
			class="image"
			{src}
			{alt}
			loading={lazy ? 'lazy' : 'eager'}
			style:width={width || '100%'}
			style:height={height || 'auto'}
			style:object-fit={fit}
			onerror={handleLoadError}
		/>
		{#if preview}
			<button type="button" class="image-zoom-btn" aria-label="放大预览" onclick={openZoom}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
				</svg>
			</button>
		{/if}
	{/if}
</span>

{#if zoomed && !failed}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="image-zoom" role="dialog" aria-modal="true" aria-label={alt || '图片预览'} tabindex="-1" onclick={() => (zoomed = false)} onkeydown={(e) => e.key === 'Escape' && (zoomed = false)}>
		<img class="image-zoom-img" src={src} alt={alt} />
		<button type="button" class="image-zoom-close" aria-label="关闭" onclick={() => (zoomed = false)}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
		</button>
	</div>
{/if}

<style>
	.image-wrap {
		display: inline-block;
		position: relative;
		overflow: hidden;
		line-height: 0;
		background: var(--surface-2);
	}
	.image-wrap.rounded {
		border-radius: var(--radius-lg);
	}
	.image {
		display: block;
	}
	.image-zoom-btn {
		position: absolute;
		right: var(--sp-sm);
		bottom: var(--sp-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		border-radius: var(--radius-md);
		background: color-mix(in srgb, #000 55%, transparent);
		color: var(--primary-text);
		opacity: 0;
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.image-wrap:hover .image-zoom-btn,
	.image-zoom-btn:focus-visible {
		opacity: 1;
	}
	.image-fallback {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--sp-sm);
		background: var(--surface-2);
		border: 1px dashed var(--border-strong);
		color: var(--text-muted);
		min-width: 120px;
		min-height: 80px;
		box-sizing: border-box;
	}
	.image-fallback-text {
		font-size: 11px;
		line-height: 1.4;
	}
	.image-zoom {
		position: fixed;
		inset: 0;
		z-index: var(--z-dialog);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--sp-lg);
		background: color-mix(in srgb, #000 75%, transparent);
		cursor: zoom-out;
		animation: image-zoom-in 0.15s ease-out;
	}
	.image-zoom-img {
		max-width: 100%;
		max-height: 100%;
		border-radius: var(--radius-md);
		object-fit: contain;
	}
	.image-zoom-close {
		position: absolute;
		top: var(--sp-lg);
		right: var(--sp-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: 50%;
		background: color-mix(in srgb, #fff 15%, transparent);
		color: var(--primary-text);
		cursor: pointer;
	}
	.image-zoom-close:hover {
		background: color-mix(in srgb, #fff 30%, transparent);
	}
	@keyframes image-zoom-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>

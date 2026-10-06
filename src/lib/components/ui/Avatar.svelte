<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		src = '',
		alt = '',
		name = '',
		size = 'middle',
		shape = 'circle',
		status,
		class: cls = '',
		style = '',
		children,
	}: {
		src?: string;
		alt?: string;
		name?: string;
		size?: 'small' | 'middle' | 'large' | number;
		shape?: 'circle' | 'square';
		status?: 'online' | 'offline' | 'busy' | 'away';
		class?: string;
		style?: string;
		children?: Snippet;
	} = $props();

	const px = $derived(typeof size === 'number' ? size : size === 'small' ? 28 : size === 'large' ? 48 : 36);

	const initials = $derived.by(() => {
		const t = name.trim();
		if (!t) return '';
		const parts = t.split(/\s+/);
		if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
		return t.slice(0, 2).toUpperCase();
	});
</script>

<span
	class="avatar avatar--{shape} {cls}"
	style="width: {px}px; height: {px}px; font-size: {Math.max(10, Math.round(px * 0.38))}px; {style}"
	role="img"
	aria-label={alt || name || '头像'}
>
	{#if children}
		{@render children()}
	{:else if src}
		<img class="avatar-img" {src} alt={alt || name} />
	{:else if initials}
		<span class="avatar-fallback">{initials}</span>
	{:else}
		<svg class="avatar-fallback" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
			<circle cx="12" cy="8" r="4" />
			<path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
		</svg>
	{/if}
	{#if status}
		<span class="avatar-status avatar-status--{status}" aria-hidden="true"></span>
	{/if}
</span>

<style>
	.avatar {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow: visible;
		background-color: var(--surface-2);
		color: var(--text-muted);
		font-weight: 600;
		line-height: 1;
		user-select: none;
		vertical-align: middle;
	}
	.avatar--circle {
		border-radius: 50%;
	}
	.avatar--square {
		border-radius: var(--radius-lg);
	}
	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.avatar--circle .avatar-img,
	.avatar--circle .avatar-fallback {
		border-radius: 50%;
	}
	.avatar--square .avatar-img,
	.avatar--square .avatar-fallback {
		border-radius: var(--radius-lg);
	}
	.avatar-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
	.avatar-fallback svg {
		width: 60%;
		height: 60%;
	}
	.avatar-status {
		position: absolute;
		right: 0;
		bottom: 0;
		width: 26%;
		height: 26%;
		min-width: 8px;
		min-height: 8px;
		border-radius: 50%;
		border: 2px solid var(--surface);
		box-sizing: border-box;
	}
	.avatar-status--online {
		background-color: var(--success);
	}
	.avatar-status--offline {
		background-color: var(--text-muted);
	}
	.avatar-status--busy {
		background-color: var(--danger);
	}
	.avatar-status--away {
		background-color: var(--warning);
	}
</style>

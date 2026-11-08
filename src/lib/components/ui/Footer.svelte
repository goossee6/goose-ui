<script lang="ts">
	let {
		border = true,
		sticky = false,
		copyright = '',
		links = [],
		class: cls = '',
		style = '',
		left,
		right,
		children,
	}: {
		border?: boolean;
		sticky?: boolean;
		copyright?: string;
		links?: { label: string; href?: string; onclick?: () => void }[];
		class?: string;
		style?: string;
		left?: import('svelte').Snippet;
		right?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	} = $props();
</script>

<footer class="footer {cls}" class:border class:sticky style={style}>
	<div class="footer-main">
		{#if left}
			<div class="footer-left">{@render left()}</div>
		{:else if children}
			<div class="footer-left">{@render children()}</div>
		{/if}

		{#if links.length > 0}
			<nav class="footer-links" aria-label="页脚链接">
				{#each links as link (link.label)}
					{#if link.href}
						<a class="footer-link" href={link.href} rel="noopener noreferrer">{link.label}</a>
					{:else}
						<button type="button" class="footer-link" onclick={() => link.onclick?.()}>{link.label}</button>
					{/if}
				{/each}
			</nav>
		{/if}

		{#if right}
			<div class="footer-right">{@render right()}</div>
		{/if}
	</div>

	{#if copyright}
		<p class="footer-copyright">{copyright}</p>
	{/if}
</footer>

<style>
	.footer {
		padding: var(--sp-lg) var(--sp-lg);
		background: var(--surface);
		color: var(--text-muted);
		font-size: var(--fs-13);
		box-sizing: border-box;
	}
	.footer.border {
		border-top: 1px solid var(--border);
	}
	.footer.sticky {
		position: sticky;
		bottom: 0;
		z-index: 100;
	}
	.footer-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-lg);
		flex-wrap: wrap;
	}
	.footer-left {
		color: var(--text);
	}
	.footer-links {
		display: flex;
		align-items: center;
		gap: var(--sp-lg);
		flex-wrap: wrap;
	}
	.footer-link {
		padding: 0;
		border: none;
		background: none;
		color: var(--text-muted);
		font-size: var(--fs-13);
		text-decoration: none;
		cursor: pointer;
		transition: color 0.15s;
	}
	.footer-link:hover {
		color: var(--primary);
	}
	.footer-copyright {
		margin: var(--sp-md) 0 0;
		font-size: var(--fs-12);
		text-align: center;
		color: var(--text-muted);
	}
</style>

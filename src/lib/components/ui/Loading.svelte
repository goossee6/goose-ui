<script lang="ts">
	let {
		size = 30,
		src = '',
	}: {
		size?: number;
		src?: string;
	} = $props();
</script>

{#if src}
	<img {src} alt="加载中" width={size} height={size} class="loading" />
{:else}
	<svg
		class="loading loading-spinner"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		role="img"
		aria-label="加载中"
	>
		<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="2.5" />
		<path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
	</svg>
{/if}

<style>
	.loading {
		display: inline-block;
		vertical-align: middle;
		margin: 0 4px;
	}
	.loading-spinner {
		animation: loading-spin 0.8s linear infinite;
	}
	@keyframes loading-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>

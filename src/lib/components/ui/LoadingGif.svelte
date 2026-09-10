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
	<img {src} alt="加载中" width={size} height={size} class="loading-gif" />
{/if}

<style>
	.loading-gif {
		display: inline-block;
		vertical-align: middle;
		margin: 0 4px;
	}
</style>

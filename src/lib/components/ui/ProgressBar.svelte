<script lang="ts">
	let {
		percent = 0,
		class: cls = '',
	}: {
		percent?: number;
		class?: string;
	} = $props();
</script>

<div class="progress-track {cls}">
	<div class="progress-bar" style="width: {percent}%"></div>
</div>

<style>
	.progress-track {
		position: relative;
		height: 10px;
		width: 100%;
		border-radius: 9999px;
		background-color: var(--surface-2);
		overflow: hidden;
	}
	.progress-bar {
		height: 100%;
		border-radius: 9999px;
		background: linear-gradient(90deg, var(--primary), #06b6d4);
		transition: width 0.5s ease-out;
	}
</style>

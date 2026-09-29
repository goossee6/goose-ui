<script lang="ts">
	let {
		percent = 0,
		class: cls = '',
		style = '',
	}: {
		percent?: number;
		class?: string;
		style?: string;
	} = $props();

	const clamped = $derived(Math.min(100, Math.max(0, percent)));
</script>

<div class="progress-track {cls}" style={style} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
	<div class="progress-bar" style="width: {clamped}%"></div>
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

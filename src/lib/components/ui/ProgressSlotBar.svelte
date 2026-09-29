<script lang="ts">
	import { formatBytes } from '../../utils/format';

	let {
		number = 0,
		part,
		total = 0,
		loaded = 0,
		totalSize = 0,
		class: cls = '',
		style = '',
	}: {
		number?: number;
		part?: number;
		total?: number;
		loaded?: number;
		totalSize?: number;
		class?: string;
		style?: string;
	} = $props();

	const slotNum = $derived(part ?? number);
	const pct = $derived(totalSize > 0 ? Math.round((loaded * 100) / totalSize) : 0);
</script>

{#if slotNum > 0}
	<div class="slot-bar {cls}" style={style}>
		<div class="slot-label">
			<span>分片 {slotNum}/{total} {formatBytes(loaded)}/{formatBytes(totalSize)}</span>
			<span>{pct}%</span>
		</div>
		<div class="slot-track">
			<div class="slot-fill" style="width: {pct}%"></div>
		</div>
	</div>
{/if}

<style>
	.slot-bar { margin-bottom: 2px; }
	.slot-label { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-bottom: 2px; }
	.slot-track { width: 100%; background-color: var(--surface-2); border-radius: 9999px; height: 8px; overflow: hidden; }
	.slot-fill { height: 100%; border-radius: 9999px; background-color: #f97316; transition: width 0.3s; }
</style>

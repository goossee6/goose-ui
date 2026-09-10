<script lang="ts">
	let {
		checked = $bindable(false),
		disabled = false,
		onchange,
	}: {
		checked?: boolean;
		disabled?: boolean;
		onchange?: (e: Event) => void;
	} = $props();
</script>

<label class="checkbox-label" class:disabled>
	<input type="checkbox" bind:checked {disabled} class="checkbox-input" onchange={(e) => onchange?.(e)} />
	<span class="checkbox-box" class:checked>
		{#if checked}
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="20 6 9 17 4 12" />
			</svg>
		{/if}
	</span>
</label>

<style>
	.checkbox-label {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	.checkbox-label.disabled { opacity: 0.5; pointer-events: none; }
	.checkbox-input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
	.checkbox-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-strong);
		background-color: transparent;
		color: var(--primary-text);
		transition: background-color 0.15s, border-color 0.15s;
	}
	.checkbox-box.checked {
		background-color: var(--primary);
		border-color: var(--primary);
	}
	.checkbox-input:focus-visible + .checkbox-box {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
</style>

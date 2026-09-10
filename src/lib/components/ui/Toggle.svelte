<script lang="ts">
	let {
		checked = $bindable(false),
		disabled = false,
		ariaLabel = '',
		title = '',
		class: cls = '',
		onclick,
	}: {
		checked?: boolean;
		disabled?: boolean;
		ariaLabel?: string;
		title?: string;
		class?: string;
		onclick?: (e: MouseEvent) => void;
	} = $props();
</script>

<button
	type="button"
	class="toggle {cls}"
	class:toggle--disabled={disabled}
	{disabled}
	{title}
	aria-label={ariaLabel || undefined}
	aria-pressed={checked}
	onclick={(e) => {
		checked = !checked;
		onclick?.(e);
	}}
>
	<span class="toggle-track" class:toggle-track--on={checked}>
		<span class="toggle-thumb"></span>
	</span>
</button>

<style>
	.toggle {
		display: inline-flex;
		align-items: center;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		flex-shrink: 0;
		transition: opacity 0.2s;
	}
	.toggle--disabled { opacity: 0.5; cursor: not-allowed; }
	.toggle-track {
		display: block;
		width: 44px;
		height: 24px;
		border-radius: 12px;
		background-color: var(--surface-3);
		border: 1px solid var(--border-strong);
		position: relative;
		transition: background-color 0.2s, border-color 0.2s;
	}
	.toggle-track--on {
		background-color: var(--primary);
		border-color: var(--primary);
	}
	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		border-radius: 9px;
		background-color: #ffffff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}
	.toggle-track--on .toggle-thumb {
		animation: toggle-on 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}
	.toggle-track:not(.toggle-track--on) .toggle-thumb {
		animation: toggle-off 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}
	@keyframes toggle-on {
		0%   { left: 2px;  width: 18px; }
		45%  { left: 1px;  width: 40px; }
		55%  { left: 1px;  width: 40px; }
		70%  { left: 21px; width: 18px; }
		90%  { left: 21px; width: 20px; }
		100% { left: 22px; width: 18px; }
	}
	@keyframes toggle-off {
		0%   { left: 22px; width: 18px; }
		45%  { left: 1px;  width: 40px; }
		55%  { left: 1px;  width: 40px; }
		70%  { left: 2px;  width: 18px; }
		90%  { left: 2px;  width: 20px; }
		100% { left: 2px;  width: 18px; }
	}
</style>

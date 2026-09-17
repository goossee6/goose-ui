<script lang="ts">
	let {
		checked = $bindable(false),
		disabled = false,
		ariaLabel = '',
		title = '',
		class: cls = '',
		onclick,
		size = 'middle',
	}: {
		checked?: boolean;
		disabled?: boolean;
		ariaLabel?: string;
		title?: string;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		size?: 'small' | 'middle' | 'large' | number;
	} = $props();

	const sizeClass = $derived(typeof size === 'string' ? `toggle--${size}` : '');
</script>

<button
	type="button"
	class="toggle {sizeClass} {cls}"
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
	.toggle--small .toggle-track { width: 36px; height: 20px; border-radius: 10px; }
	.toggle--large .toggle-track { width: 52px; height: 28px; border-radius: 14px; }
	.toggle-track--on {
		background-color: var(--primary);
		border-color: var(--primary);
	}
	.toggle-thumb {
		position: absolute;
		top: 3px;
		left: 2px;
		width: 18px;
		height: 18px;
		border-radius: 9px;
		background-color: #ffffff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}
	.toggle--small .toggle-thumb { width: 14px; top: 3px; height: 14px; border-radius: 7px; }
	.toggle--large .toggle-thumb { width: 22px; top: 3px;height: 22px; border-radius: 11px; }
	.toggle-track--on .toggle-thumb {
		animation: toggle-on 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}
	.toggle-track:not(.toggle-track--on) .toggle-thumb {
		animation: toggle-off 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
	}
	/* small: track 36x20, thumb 14x14 */
	.toggle--small .toggle-track--on .toggle-thumb { animation-name: toggle-on-sm; }
	.toggle--small .toggle-track:not(.toggle-track--on) .toggle-thumb { animation-name: toggle-off-sm; }
	/* large: track 52x28, thumb 22x22 */
	.toggle--large .toggle-track--on .toggle-thumb { animation-name: toggle-on-lg; }
	.toggle--large .toggle-track:not(.toggle-track--on) .toggle-thumb { animation-name: toggle-off-lg; }
	@keyframes toggle-on {
		0%   { left: 2px;  width: 18px; }
		45%  { left: 1px;  width: 40px; }
		55%  { left: 1px;  width: 40px; }
		70%  { left: 23px; width: 18px; }
		90%  { left: 23px; width: 20px; }
		100% { left: 24px; width: 18px; }
	}
	@keyframes toggle-off {
		0%   { left: 22px; width: 18px; }
		45%  { left: 1px;  width: 40px; }
		55%  { left: 1px;  width: 40px; }
		70%  { left: 2px;  width: 18px; }
		90%  { left: 2px;  width: 20px; }
		100% { left: 2px;  width: 18px; }
	}
	@keyframes toggle-on-sm {
		0%   { left: 2px;  width: 14px; }
		45%  { left: 1px;  width: 32px; }
		55%  { left: 1px;  width: 32px; }
		70%  { left: 19px; width: 14px; }
		90%  { left: 19px; width: 16px; }
		100% { left: 20px; width: 14px; }
	}
	@keyframes toggle-off-sm {
		0%   { left: 18px; width: 14px; }
		45%  { left: 1px;  width: 32px; }
		55%  { left: 1px;  width: 32px; }
		70%  { left: 2px;  width: 14px; }
		90%  { left: 2px;  width: 16px; }
		100% { left: 2px;  width: 14px; }
	}
	@keyframes toggle-on-lg {
		0%   { left: 2px;  width: 22px; }
		45%  { left: 1px;  width: 48px; }
		55%  { left: 1px;  width: 48px; }
		70%  { left: 26px; width: 22px; }
		90%  { left: 26px; width: 24px; }
		100% { left: 28px; width: 22px; }
	}
	@keyframes toggle-off-lg {
		0%   { left: 26px; width: 22px; }
		45%  { left: 1px;  width: 48px; }
		55%  { left: 1px;  width: 48px; }
		70%  { left: 2px;  width: 22px; }
		90%  { left: 2px;  width: 24px; }
		100% { left: 2px;  width: 22px; }
	}
</style>

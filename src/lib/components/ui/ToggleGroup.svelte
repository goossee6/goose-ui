<script lang="ts" module>
	export interface ToggleGroupItem {
		value: string;
		label: string;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	let {
		items = [],
		value = $bindable<string[]>([]),
		multiple = false,
		disabled = false,
		variant = 'default',
		size = 'middle',
		onchange,
		class: cls = '',
		style = '',
	}: {
		items?: ToggleGroupItem[];
		value?: string[];
		multiple?: boolean;
		disabled?: boolean;
		variant?: 'default' | 'outline';
		size?: 'small' | 'middle' | 'large';
		onchange?: (value: string[]) => void;
		class?: string;
		style?: string;
	} = $props();

	function isActive(v: string): boolean {
		return value.includes(v);
	}

	function toggle(v: string, itemDisabled: boolean) {
		if (disabled || itemDisabled) return;
		const active = isActive(v);
		let next: string[];
		if (multiple) {
			next = active ? value.filter((x) => x !== v) : [...value, v];
		} else {
			next = active && value.length === 1 ? [] : [v];
		}
		value = next;
		onchange?.(next);
	}
</script>

<div
	class="toggle-group toggle-group--{variant} toggle-group--{size} {cls}"
	class:toggle-group--disabled={disabled}
	role="group"
	style={style}
>
	{#each items as item (item.value)}
		<button
			type="button"
			class="toggle-group-item"
			class:active={isActive(item.value)}
			disabled={disabled || item.disabled}
			aria-pressed={isActive(item.value)}
			onclick={() => toggle(item.value, item.disabled ?? false)}
		>
			{item.label}
		</button>
	{/each}
</div>

<style>
	.toggle-group {
		display: inline-flex;
		align-items: center;
		padding: 3px;
		gap: 2px;
		border-radius: var(--radius-lg);
		background: var(--surface-2);
		border: 1px solid transparent;
	}
	.toggle-group--outline {
		background: transparent;
		border-color: var(--border-strong);
	}
	.toggle-group--disabled {
		opacity: 0.5;
	}
	.toggle-group-item {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--sp-sm) var(--sp-lg);
		border: none;
		border-radius: calc(var(--radius-lg) - 4px);
		background: transparent;
		color: var(--text-muted);
		font-size: 13px;
		cursor: pointer;
		white-space: nowrap;
		transition: background-color 0.15s, color 0.15s, box-shadow 0.15s;
	}
	.toggle-group--small .toggle-group-item {
		padding: var(--sp-2xs) var(--sp-md);
		font-size: 12px;
	}
	.toggle-group--large .toggle-group-item {
		padding: var(--sp-md) var(--sp-xl);
		font-size: 14px;
	}
	.toggle-group-item:hover:not(:disabled) {
		color: var(--text-strong);
	}
	.toggle-group-item:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: -2px;
	}
	.toggle-group-item:disabled {
		cursor: not-allowed;
	}
	.toggle-group-item.active {
		background: var(--surface);
		color: var(--text-strong);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
		font-weight: 600;
	}
	.toggle-group--outline .toggle-group-item.active {
		background: var(--primary-soft);
		color: var(--primary);
		box-shadow: none;
	}
</style>

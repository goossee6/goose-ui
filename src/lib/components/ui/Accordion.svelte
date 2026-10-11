<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface AccordionItem {
		value: string;
		label: string;
		disabled?: boolean;
		content?: Snippet;
	}
</script>

<script lang="ts">
	import Collapsible from './Collapsible.svelte';

	let {
		items = [],
		value = $bindable<string[]>([]),
		multiple = false,
		collapsible = true,
		onchange,
		class: cls = '',
		style = '',
	}: {
		items?: AccordionItem[];
		value?: string[];
		multiple?: boolean;
		collapsible?: boolean;
		onchange?: (value: string[]) => void;
		class?: string;
		style?: string;
	} = $props();

	function isOpen(v: string): boolean {
		return value.includes(v);
	}

	function handleToggle(v: string, open: boolean) {
		if (open) {
			value = multiple ? [...value, v] : [v];
		} else {
			if (!multiple && !collapsible) return;
			value = value.filter((x) => x !== v);
		}
		onchange?.(value);
	}
</script>

<div class="accordion {cls}" style={style}>
	{#each items as item (item.value)}
		{@const open = isOpen(item.value)}
		<div class="accordion-item" class:accordion-item--open={open}>
			<Collapsible
				{open}
				disabled={item.disabled}
				onchange={(o) => handleToggle(item.value, o)}
			>
				{#snippet trigger()}
					<span class="accordion-label">{item.label}</span>
					<svg
						class="accordion-chevron"
						class:open
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<polyline points="6 9 12 15 18 9" />
					</svg>
				{/snippet}
				<div class="accordion-panel">
					{@render item.content?.()}
				</div>
			</Collapsible>
		</div>
	{/each}
</div>

<style>
	.accordion {
		display: flex;
		flex-direction: column;
		gap: var(--sp-md);
	}
	.accordion-item :global(.collapsible-trigger) {
		border-radius: var(--radius-lg);
		font-weight: 600;
	}
	.accordion-item--open :global(.collapsible-trigger) {
		border-color: var(--border-strong);
	}
	.accordion-label {
		flex: 1;
	}
	.accordion-chevron {
		flex-shrink: 0;
		color: var(--text-muted);
		transition: transform 0.25s ease;
	}
	.accordion-chevron.open {
		transform: rotate(180deg);
	}
	.accordion-panel {
		padding: var(--sp-lg) var(--sp-lg);
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.7;
	}
</style>

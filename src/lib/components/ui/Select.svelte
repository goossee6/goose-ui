<script lang="ts">
	import { onMount, tick } from 'svelte';

	interface Option {
		value: string;
		label: string;
		meta?: string;
		metaClass?: 'good' | 'medium' | 'bad' | 'default';
	}

	let {
		value = $bindable(''),
		onchange,
		options = [],
		placeholder = '请选择',
		class: cls = '',
		disabled = false,
		width = '100%',
	}: {
		value?: string;
		onchange?: (v: string) => void;
		options?: Option[];
		placeholder?: string;
		class?: string;
		disabled?: boolean;
		width?: string;
	} = $props();

	let open = $state(false);
	let mounted = $state(false);
	let activeIdx = $state(-1);
	let dropdownStyle = $state('');
	let wrapperEl: HTMLElement;

	const selected = $derived(options.find((o) => o.value === value));

	function toggle() {
		if (disabled) return;
		open = !open;
		if (open) activeIdx = options.findIndex((o) => o.value === value);
		else mounted = false;
	}

	function choose(opt: Option) {
		onchange?.(opt.value);
		open = false;
		mounted = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (disabled) return;
		if (!open) {
			if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
				e.preventDefault();
				toggle();
			}
			return;
		}
		if (e.key === 'Escape') { open = false; mounted = false; }
		else if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = (activeIdx + 1) % options.length; }
		else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = (activeIdx - 1 + options.length) % options.length; }
		else if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0) choose(options[activeIdx]); }
	}

	$effect(() => {
		if (!open) return;
		tick().then(() => {
			if (!wrapperEl) return;
			const rect = wrapperEl.getBoundingClientRect();
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			const ddh = Math.min(options.length * 36 + 8, 240);
			const parts = ['position: fixed', 'z-index: 9999'];
			if (rect.left + 240 > vw) parts.push(`right: ${vw - rect.right}px`, 'left: auto');
			else parts.push(`left: ${rect.left}px`, 'right: auto');
			const spaceBelow = vh - rect.bottom - 4;
			const spaceAbove = rect.top - 4;
			if (spaceBelow < ddh && spaceAbove > spaceBelow) {
				parts.push(`bottom: ${vh - rect.top + 4}px`, 'top: auto', `max-height: ${spaceAbove}px`);
			} else {
				parts.push(`top: ${rect.bottom + 4}px`, 'bottom: auto', `max-height: ${spaceBelow}px`);
			}
			parts.push(`width: ${Math.max(120, rect.width)}px`);
			dropdownStyle = parts.join('; ');
			mounted = true;
		});
	});

	function handleOutsideClick(e: MouseEvent) {
		if (wrapperEl && !wrapperEl.contains(e.target as Node)) { open = false; mounted = false; }
	}

	onMount(() => {
		document.addEventListener('mousedown', handleOutsideClick);
		return () => document.removeEventListener('mousedown', handleOutsideClick);
	});
</script>

<div bind:this={wrapperEl} class="select-wrapper {cls}" style={width !== '100%' ? `width: ${width};` : ''}>
	<button
		type="button"
		{disabled}
		onclick={toggle}
		onkeydown={onKeydown}
		aria-haspopup="listbox"
		aria-expanded={open}
		class="select-trigger"
		class:select-trigger--open={open}
		class:select-trigger--placeholder={!selected}
	>
		<span class="select-value">{selected?.label ?? placeholder}</span>
		<svg class="select-chevron" class:select-chevron--open={open} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
	</button>

	{#if open && mounted}
		<div class="select-dropdown" style={dropdownStyle} role="listbox">
			{#if options.length === 0}
				<div class="select-empty">暂无选项</div>
			{:else}
				{#each options as opt, i (opt.value)}
					<button
						type="button"
						class="select-option"
						class:select-option--active={i === activeIdx && opt.value !== value}
						class:select-option--selected={opt.value === value}
						onclick={() => choose(opt)}
						onmouseenter={() => activeIdx = i}
						role="option"
						aria-selected={opt.value === value}
					>
						<div class="select-option-left">
							{#if opt.value === value}
								<span class="select-option-dot"></span>
							{/if}
							<span class="select-option-label" class:select-option-label--indent={opt.value !== value}>{opt.label}</span>
						</div>
						{#if opt.meta}
							<span class="select-meta select-meta--{opt.metaClass ?? 'default'}">{opt.meta}</span>
						{/if}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.select-wrapper { position: relative; }
	.select-trigger {
		display: flex;
		height: var(--ui-md-height);
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: var(--gap-md);
		padding: var(--ui-md-padding);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		background-color: var(--bg);
		color: var(--text);
		font-size: var(--ui-md-font);
		cursor: pointer;
		transition: border-color 0.15s;
	}
	.select-trigger:hover:not(:disabled) { border-color: var(--text-muted); }
	.select-trigger:focus { border-color: var(--primary); outline: none; }
	.select-trigger:disabled { opacity: 0.5; cursor: not-allowed; }
	.select-trigger--open { border-color: var(--primary); }
	.select-trigger--placeholder { color: var(--text-muted); }
	.select-value { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
	.select-chevron { color: var(--text-muted); flex-shrink: 0; transition: transform 0.2s; }
	.select-chevron--open { transform: rotate(180deg); }
	.select-dropdown {
		position: fixed;
		overflow: auto;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		background-color: var(--surface);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
		color: var(--text);
	}
	.select-empty { padding: var(--sp-md) var(--sp-xl); font-size: 12px; color: var(--text-muted); }
	.select-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--gap-md);
		width: 100%;
		padding: var(--sp-md) var(--sp-xl);
		border: none;
		background: none;
		color: var(--text);
		font-size: 14px;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.1s;
	}
	.select-option:hover { color: var(--text-strong); }
	.select-option--active { background-color: var(--hover); color: var(--text-strong); }
	.select-option--selected { background-color: var(--primary-soft); color: var(--text-strong); font-weight: 500; }
	.select-option-left { display: flex; align-items: center; gap: var(--gap-md); min-width: 0; }
	.select-option-dot { width: 6px; height: 6px; border-radius: 50%; background-color: var(--primary); flex-shrink: 0; }
	.select-option-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.select-option-label--indent { padding-left: 20px; }
	.select-meta {
		font-size: 12px;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}
	.select-meta--default { background-color: var(--surface-2); color: var(--text-muted); }
	.select-meta--good { background-color: var(--success-soft); color: var(--success-text); }
	.select-meta--medium { background-color: #fef3c7; color: #d97706; }
	.select-meta--bad { background-color: var(--danger-soft); color: var(--danger-text); }
	:global(.dark) .select-dropdown { background-color: var(--surface); color: var(--text); }
	:global(.dark) .select-option { color: var(--text); }
	:global(.dark) .select-option:hover,
	:global(.dark) .select-option--active,
	:global(.dark) .select-option--selected { color: var(--text-strong); }
</style>

<script lang="ts" module>
	export interface ComboboxOption {
		value: string;
		label: string;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	let {
		options = [],
		value = $bindable(''),
		placeholder = '请选择…',
		disabled = false,
		clearable = true,
		filter = true,
		onchange,
		class: cls = '',
		style = '',
	}: {
		options?: ComboboxOption[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		clearable?: boolean;
		filter?: boolean;
		onchange?: (value: string) => void;
		class?: string;
		style?: string;
	} = $props();

	let rootEl = $state<HTMLElement | null>(null);
	let inputEl = $state<HTMLInputElement | null>(null);
	let open = $state(false);
	let query = $state('');
	let activeIndex = $state(0);

	const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? '');

	const filtered = $derived.by(() => {
		if (!filter || !query.trim()) return options;
		const q = query.trim().toLowerCase();
		return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
	});

	const listId = `combobox-${Math.random().toString(36).slice(2, 8)}`;

	function openMenu() {
		if (disabled) return;
		open = true;
		query = '';
		activeIndex = Math.max(0, filtered.findIndex((o) => o.value === value));
	}

	function closeMenu() {
		open = false;
		query = '';
	}

	function select(opt: ComboboxOption) {
		if (opt.disabled) return;
		value = opt.value;
		onchange?.(opt.value);
		closeMenu();
		inputEl?.focus();
	}

	function clear() {
		if (disabled) return;
		value = '';
		onchange?.('');
		query = '';
		inputEl?.focus();
	}

	function step(dir: 1 | -1) {
		if (!filtered.length) return;
		let i = Math.max(0, Math.min(activeIndex, filtered.length - 1));
		for (let n = 0; n < filtered.length; n++) {
			i = (i + dir + filtered.length) % filtered.length;
			if (!filtered[i].disabled) break;
		}
		activeIndex = i;
	}

	function onInputKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			open ? step(1) : openMenu();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (open) step(-1);
		} else if (e.key === 'Enter') {
			if (open && filtered[activeIndex]) {
				e.preventDefault();
				select(filtered[activeIndex]);
			}
		} else if (e.key === 'Escape') {
			if (open) {
				e.stopPropagation();
				closeMenu();
			}
		} else if (e.key === 'Tab') {
			closeMenu();
		}
	}

	$effect(() => {
		if (!open) return;
		const onDocDown = (e: MouseEvent) => {
			if (rootEl && !rootEl.contains(e.target as Node)) closeMenu();
		};
		document.addEventListener('mousedown', onDocDown);
		return () => document.removeEventListener('mousedown', onDocDown);
	});
</script>

<div class="combobox {cls}" bind:this={rootEl} style={style}>
	<div class="combobox-control" class:open class:disabled>
		<input
			bind:this={inputEl}
			class="combobox-input"
			type="text"
			role="combobox"
			{placeholder}
			{disabled}
			readonly={!filter}
			value={open && filter ? query : selectedLabel}
			aria-expanded={open}
			aria-controls={listId}
			aria-autocomplete={filter ? 'list' : 'none'}
			aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
			onfocus={openMenu}
			oninput={(e) => (query = e.currentTarget.value)}
			onkeydown={onInputKeydown}
		/>
		{#if clearable && value && !disabled}
			<button type="button" class="combobox-clear" aria-label="清除" onclick={clear}>
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
			</button>
		{/if}
		<svg class="combobox-arrow" class:open width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
	</div>

	{#if open}
		<ul class="combobox-list" role="listbox" id={listId}>
			{#if !filtered.length}
				<li class="combobox-empty" role="presentation">无匹配项</li>
			{/if}
			{#each filtered as opt, i (opt.value)}
				<li
					class="combobox-option"
					class:active={i === activeIndex}
					class:selected={opt.value === value}
					class:disabled={opt.disabled}
					id={`${listId}-${i}`}
					role="option"
					aria-selected={opt.value === value}
					aria-disabled={opt.disabled || undefined}
					onmousedown={(e) => {
						e.preventDefault();
						select(opt);
					}}
					onmouseenter={() => (activeIndex = i)}
				>
					{opt.label}
					{#if opt.value === value}
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.combobox {
		position: relative;
		display: inline-block;
		min-width: 180px;
	}
	.combobox-control {
		display: flex;
		align-items: center;
		gap: var(--sp-xs);
		padding: 0 var(--sp-sm);
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.combobox-control.open {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
	}
	.combobox-control.disabled {
		opacity: 0.5;
		background: var(--surface-2);
	}
	.combobox-input {
		flex: 1;
		min-width: 0;
		padding: var(--sp-sm) 0;
		border: none;
		background: none;
		outline: none;
		font-size: 13px;
		color: var(--text-strong);
		font-family: inherit;
	}
	.combobox-input::placeholder {
		color: var(--text-muted);
	}
	.combobox-clear {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: none;
		border-radius: 50%;
		background: var(--surface-2);
		color: var(--text-muted);
		cursor: pointer;
		flex-shrink: 0;
	}
	.combobox-clear:hover {
		background: var(--hover);
		color: var(--text-strong);
	}
	.combobox-arrow {
		color: var(--text-muted);
		flex-shrink: 0;
		transition: transform 0.2s;
	}
	.combobox-arrow.open {
		transform: rotate(180deg);
	}
	.combobox-list {
		position: absolute;
		z-index: var(--z-dropdown);
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		max-height: 240px;
		overflow-y: auto;
		margin: 0;
		padding: var(--sp-xs);
		list-style: none;
		background: var(--surface-2);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}
	.combobox-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--sp-sm);
		padding: var(--sp-sm) var(--sp-md);
		border-radius: var(--radius-md);
		font-size: 13px;
		color: var(--text);
		cursor: pointer;
	}
	.combobox-option.active {
		background: var(--hover);
		color: var(--text-strong);
	}
	.combobox-option.selected {
		color: var(--primary);
		font-weight: 600;
	}
	.combobox-option.disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.combobox-empty {
		padding: var(--sp-md);
		font-size: 13px;
		color: var(--text-muted);
		text-align: center;
	}
</style>

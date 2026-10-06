<script lang="ts">
	let {
		widths = [],
		value = $bindable<string[]>([]),
		separator = '-',
		numeric = true,
		placeholders = [],
		disabled = false,
		class: cls = '',
		style = '',
		onchange,
	}: {
		widths?: number[];
		value?: string[];
		separator?: string;
		numeric?: boolean;
		placeholders?: string[];
		disabled?: boolean;
		class?: string;
		style?: string;
		onchange?: (value: string[]) => void;
	} = $props();

	let inputs = $state<HTMLInputElement[]>([]);
	let focused = $state(-1);

	const cells = $derived.by(() => {
		const arr: string[] = [];
		for (let i = 0; i < widths.length; i++) arr.push(value[i] ?? '');
		return arr;
	});

	function setCell(i: number, ch: string) {
		const arr = cells.slice();
		arr[i] = ch;
		value = arr;
		onchange?.(arr);
	}

	function focusCell(i: number) {
		if (i < 0 || i >= widths.length) return;
		focused = i;
		requestAnimationFrame(() => inputs[i]?.focus());
	}

	function handleInput(i: number, e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		let text = el.value;
		if (numeric) text = text.replace(/\D/g, '');
		text = text.slice(0, widths[i]);
		el.value = text;
		setCell(i, text);
		if (text.length >= widths[i] && i < widths.length - 1) focusCell(i + 1);
	}

	function handleKeydown(i: number, e: KeyboardEvent) {
		if (e.key === 'Backspace') {
			e.preventDefault();
			if (cells[i]) setCell(i, '');
			else if (i > 0) {
				setCell(i - 1, '');
				focusCell(i - 1);
			}
		} else if (e.key === 'ArrowLeft' && i > 0) {
			e.preventDefault();
			focusCell(i - 1);
		} else if (e.key === 'ArrowRight' && i < widths.length - 1) {
			e.preventDefault();
			focusCell(i + 1);
		} else if (e.key === 'Delete') {
			e.preventDefault();
			setCell(i, '');
		}
	}

	function handlePaste(i: number, e: ClipboardEvent) {
		e.preventDefault();
		let text = e.clipboardData?.getData('text') ?? '';
		if (numeric) text = text.replace(/\D/g, '');
		if (!text) return;
		const arr = cells.slice();
		let pos = 0;
		for (let k = i; k < widths.length && pos < text.length; k++) {
			const take = text.slice(pos, pos + widths[k]);
			arr[k] = take;
			pos += widths[k];
		}
		if (pos < text.length && i === 0) arr[0] = text.slice(0, widths[0]);
		value = arr;
		onchange?.(arr);
		focusCell(Math.min(widths.length - 1, i + Math.ceil(pos / Math.max(...widths))));
	}
</script>

<div class="segment-field {cls}" style={style} role="group" aria-disabled={disabled || undefined}>
	{#each cells as ch, i (i)}
		{#if i > 0}
			<span class="segment-sep" aria-hidden="true">{separator}</span>
		{/if}
		<input
			class="segment-cell"
			style="width: {widths[i] + 0.6}ch"
			bind:this={inputs[i]}
			type="text"
			inputmode={numeric ? 'numeric' : 'text'}
			autocomplete="off"
			{disabled}
			maxlength={widths[i]}
			placeholder={placeholders[i] ?? ''}
			value={ch}
			aria-label="第 {i + 1} 段"
			oninput={(e) => handleInput(i, e)}
			onkeydown={(e) => handleKeydown(i, e)}
			onpaste={(e) => handlePaste(i, e)}
			onfocus={() => (focused = i)}
			onblur={() => (focused = -1)}
		/>
	{/each}
</div>

<style>
	.segment-field {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 0 var(--sp-sm);
		background: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		font-family: var(--font-mono);
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.segment-field:focus-within {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
	}
	.segment-field:has(:disabled) {
		opacity: 0.5;
		background: var(--surface-2);
	}
	.segment-cell {
		width: 4ch;
		padding: var(--sp-sm) 2px;
		border: none;
		background: none;
		outline: none;
		font-family: inherit;
		font-size: 13px;
		text-align: center;
		color: var(--text-strong);
	}
	.segment-cell::placeholder {
		color: var(--text-muted);
		font-family: inherit;
	}
	.segment-sep {
		color: var(--text-muted);
		font-size: 13px;
		user-select: none;
	}
</style>

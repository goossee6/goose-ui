<script lang="ts">
	let {
		length = 4,
		value = $bindable(''),
		mask = false,
		disabled = false,
		placeholder = '',
		separator = '',
		group = 0,
		numeric = true,
		oncomplete,
		class: cls = '',
		style = '',
	}: {
		length?: number;
		value?: string;
		mask?: boolean;
		disabled?: boolean;
		placeholder?: string;
		separator?: string;
		group?: number;
		numeric?: boolean;
		oncomplete?: (value: string) => void;
		class?: string;
		style?: string;
	} = $props();

	let inputs = $state<HTMLInputElement[]>([]);
	let focused = $state(-1);

	// 格位独立存储：value 是紧凑字符串，无法表达中间空洞（'12_4'.join 会整体左移）
	let cellVals = $state<string[]>([]);
	const joined = $derived(cellVals.join(''));

	// 外部改 value（父组件 set 或初始值）时同步回格位；本组件编辑时 value === joined 不触发
	// 初始 cellVals 为空数组，需按 length 展开；length 变化也走同一路径重建
	$effect(() => {
		if (value !== joined || cellVals.length !== length) {
			const next: string[] = [];
			for (let i = 0; i < length; i++) next.push(value[i] ?? '');
			cellVals = next;
		}
	});

	const cells = $derived(cellVals);
	const complete = $derived(cellVals.length === length && cellVals.every((c) => c !== ''));

	function commit(next: string[]) {
		cellVals = next;
		value = next.join('');
		if (complete) oncomplete?.(value);
	}

	function setCell(i: number, ch: string) {
		const arr = cellVals.slice();
		arr[i] = ch;
		commit(arr);
	}

	function focusCell(i: number) {
		focused = i;
		requestAnimationFrame(() => inputs[i]?.focus());
	}

	function handleInput(i: number, e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		let ch = el.value.slice(-1);
		if (numeric && ch && !/\d/.test(ch)) ch = '';
		el.value = ch;
		setCell(i, ch);
		if (ch && i < length - 1) focusCell(i + 1);
	}

	function handleKeydown(i: number, e: KeyboardEvent) {
		if (e.key === 'Backspace') {
			e.preventDefault();
			if (cells[i]) {
				setCell(i, '');
			} else if (i > 0) {
				setCell(i - 1, '');
				focusCell(i - 1);
			}
		} else if (e.key === 'ArrowLeft' && i > 0) {
			e.preventDefault();
			focusCell(i - 1);
		} else if (e.key === 'ArrowRight' && i < length - 1) {
			e.preventDefault();
			focusCell(i + 1);
		} else if (e.key === 'Delete') {
			e.preventDefault();
			setCell(i, '');
		}
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const text = (e.clipboardData?.getData('text') ?? '').replace(numeric ? /[^\d]/g : /[^0-9a-zA-Z]/g, '');
		if (!text) return;
		const start = focused >= 0 ? focused : 0;
		const arr = cellVals.slice();
		for (let k = 0; k < text.length && start + k < length; k++) arr[start + k] = text[k];
		commit(arr);
		const next = Math.min(length - 1, start + text.length);
		focusCell(next);
	}
</script>

<div class="pin-input {cls}" style={style} role="group" aria-label="验证码输入">
	{#each cells as ch, i (i)}
		{#if separator && group > 0 && i > 0 && i % group === 0}
			<span class="pin-separator" aria-hidden="true">{separator}</span>
		{/if}
		<input
			class="pin-cell"
			bind:this={inputs[i]}
			type={mask ? 'password' : 'text'}
			inputmode={numeric ? 'numeric' : 'text'}
			autocomplete="off"
			{disabled}
			{placeholder}
			maxlength={1}
			value={ch}
			aria-label="第 {i + 1} 位"
			oninput={(e) => handleInput(i, e)}
			onkeydown={(e) => handleKeydown(i, e)}
			onpaste={handlePaste}
			onfocus={() => (focused = i)}
		/>
	{/each}
</div>

<style>
	.pin-input {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-sm);
	}
	.pin-cell {
		width: 42px;
		height: 48px;
		text-align: center;
		font-size: 18px;
		font-weight: 600;
		font-family: var(--font-mono);
		color: var(--text-strong);
		background-color: var(--surface);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		outline: none;
		transition: border-color 0.15s, box-shadow 0.15s;
		padding: 0;
	}
	.pin-cell:focus {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
	}
	.pin-cell:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.pin-separator {
		color: var(--text-muted);
		font-size: 18px;
	}
</style>

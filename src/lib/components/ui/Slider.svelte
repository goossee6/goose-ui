<script lang="ts">
	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		disabled = false,
		label = '',
		format,
		onchange,
		class: cls = '',
		style = '',
	}: {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		label?: string;
		format?: (n: number) => string;
		onchange?: (value: number) => void;
		class?: string;
		style?: string;
	} = $props();

	let trackEl = $state<HTMLElement | null>(null);
	let dragging = $state(false);

	const percent = $derived(max > min ? ((value - min) / (max - min)) * 100 : 0);
	const display = $derived(format ? format(value) : String(value));

	function clampSnap(raw: number): number {
		const clamped = Math.min(max, Math.max(min, raw));
		const stepped = Math.round((clamped - min) / step) * step + min;
		return Math.min(max, Math.max(min, Number(stepped.toFixed(10))));
	}

	function fromPointer(e: PointerEvent): number {
		if (!trackEl) return value;
		const r = trackEl.getBoundingClientRect();
		const ratio = r.width > 0 ? (e.clientX - r.left) / r.width : 0;
		return clampSnap(min + ratio * (max - min));
	}

	function update(v: number) {
		if (v === value) return;
		value = v;
	}

	function onPointerDown(e: PointerEvent) {
		if (disabled) return;
		e.preventDefault();
		trackEl?.setPointerCapture(e.pointerId);
		dragging = true;
		update(fromPointer(e));
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging || disabled) return;
		update(fromPointer(e));
	}

	function onPointerUp(e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		trackEl?.releasePointerCapture(e.pointerId);
		onchange?.(value);
	}

	function onKeydown(e: KeyboardEvent) {
		if (disabled) return;
		const big = step * 10;
		let next: number | null = null;
		if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = clampSnap(value + step);
		else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = clampSnap(value - step);
		else if (e.key === 'Home') next = min;
		else if (e.key === 'End') next = max;
		else if (e.key === 'PageUp') next = clampSnap(value + big);
		else if (e.key === 'PageDown') next = clampSnap(value - big);
		if (next !== null) {
			e.preventDefault();
			update(next);
			onchange?.(next);
		}
	}
</script>

<div class="slider {cls}" class:slider--disabled={disabled} style={style}>
	<div class="slider-header">
		{#if label}<span class="slider-label">{label}</span>{/if}
		<span class="slider-value">{display}</span>
	</div>
	<div
		class="slider-track"
		class:dragging
		bind:this={trackEl}
		role="slider"
		tabindex={disabled ? -1 : 0}
		aria-valuemin={min}
		aria-valuemax={max}
		aria-valuenow={value}
		aria-valuetext={display}
		aria-label={label || '滑块'}
		aria-disabled={disabled || undefined}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onkeydown={onKeydown}
	>
		<div class="slider-rail"></div>
		<div class="slider-fill" style="width: {percent}%"></div>
		<div class="slider-thumb" style="left: {percent}%"></div>
	</div>
</div>

<style>
	.slider {
		display: flex;
		flex-direction: column;
		gap: var(--sp-md);
		width: 100%;
	}
	.slider--disabled {
		opacity: 0.5;
	}
	.slider-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: var(--fs-13);
	}
	.slider-label {
		color: var(--text);
	}
	.slider-value {
		font-family: var(--font-mono);
		color: var(--text-muted);
	}
	.slider-track {
		position: relative;
		height: 20px;
		display: flex;
		align-items: center;
		cursor: pointer;
		touch-action: none;
	}
	.slider--disabled .slider-track {
		cursor: not-allowed;
	}
	.slider-track:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 4px;
		border-radius: var(--radius-full);
	}
	.slider-rail {
		position: absolute;
		left: 0;
		right: 0;
		height: 6px;
		border-radius: var(--radius-full);
		background: var(--surface-2);
		border: 1px solid var(--border);
	}
	.slider-fill {
		position: absolute;
		left: 0;
		height: 6px;
		border-radius: var(--radius-full);
		/* 统一强调渐变：主色 -30° → +30°（见 theme.css） */
		background: var(--gradient-accent);
		pointer-events: none;
		/* width 只在「值被外部改」时补间（见 .dragging）：拖动中必须即时跟手 */
		transition: width 0.2s ease-out, background 0.18s ease;
	}
	/* 拖动中关掉位移补间，只留配色过渡：否则滑块和填充都比指针慢半拍，
	   连续拖拽时像在追指针 */
	.slider-track.dragging .slider-fill {
		transition: background 0.18s ease;
	}
	/* hover / 拖动时整条提亮一档（色相不变），和外面的 thumb 光环一起给反馈 */
	.slider-track:hover .slider-fill,
	.slider-track:focus-visible .slider-fill {
		background: var(--gradient-accent-hover);
	}
	.slider-thumb {
		position: absolute;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--surface);
		border: 2px solid var(--primary);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
		transform: translateX(-50%);
		pointer-events: none;
		/* 与 fill 同步：外部改值（按钮 / 预设 / 表单重置）时滑过去，而不是瞬移 */
		transition: left 0.2s ease-out, box-shadow 0.15s;
	}
	.slider-track.dragging .slider-thumb {
		transition: box-shadow 0.15s;
	}
	.slider-track:hover .slider-thumb,
	.slider-track:focus-visible .slider-thumb {
		box-shadow: 0 0 0 4px var(--accent-ring);
	}
	@media (prefers-reduced-motion: reduce) {
		.slider-fill,
		.slider-thumb {
			transition: none;
		}
	}
</style>

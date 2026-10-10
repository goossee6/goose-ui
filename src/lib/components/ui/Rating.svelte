<script lang="ts">
	let {
		value = $bindable(0),
		max = 5,
		size = 'middle',
		readonly = false,
		disabled = false,
		allowHalf = false,
		onchange,
		class: cls = '',
		style = '',
	}: {
		value?: number;
		max?: number;
		size?: 'small' | 'middle' | 'large';
		readonly?: boolean;
		disabled?: boolean;
		allowHalf?: boolean;
		onchange?: (value: number) => void;
		class?: string;
		style?: string;
	} = $props();

	let hover = $state(0);

	const px = $derived(size === 'small' ? 16 : size === 'large' ? 26 : 20);
	const readonlyOrDisabled = $derived(readonly || disabled);
	const shown = $derived(readonlyOrDisabled ? value : hover || value);

	function starValue(i: number, e: MouseEvent): number {
		if (!allowHalf) return i + 1;
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		return e.clientX - r.left < r.width / 2 ? i + 0.5 : i + 1;
	}

	function handleClick(i: number, e: MouseEvent) {
		if (readonlyOrDisabled) return;
		const v = starValue(i, e);
		const next = v === value ? 0 : v;
		value = next;
		onchange?.(next);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (readonlyOrDisabled) return;
		const step = allowHalf ? 0.5 : 1;
		let next: number | null = null;
		if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(max, value + step);
		else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(0, value - step);
		else if (e.key === 'Home') next = 0;
		else if (e.key === 'End') next = max;
		if (next !== null) {
			e.preventDefault();
			value = next;
			hover = next;
			onchange?.(next);
		}
	}
</script>

<div
	class="rating rating--{size} {cls}"
	class:rating--disabled={disabled}
	role="slider"
	tabindex={readonlyOrDisabled ? -1 : 0}
	aria-valuemin={0}
	aria-valuemax={max}
	aria-valuenow={value}
	aria-valuetext="{value} / {max}"
	aria-label="评分"
	aria-readonly={readonly || undefined}
	style={style}
	onmouseleave={() => (hover = 0)}
	onkeydown={handleKeydown}
>
	{#each Array(max) as _, i (i)}
		<button
			type="button"
			class="rating-star"
			class:rating-star--active={shown >= i + 1}
			class:rating-star--half={shown >= i + 0.5 && shown < i + 1}
			disabled={readonlyOrDisabled}
			aria-label="第 {i + 1} 星"
			onclick={(e) => handleClick(i, e)}
			onmousemove={(e) => !readonlyOrDisabled && (hover = starValue(i, e))}
			onfocus={() => !readonlyOrDisabled && (hover = i + 1)}
		>
			<svg
				class="rating-star-svg"
				viewBox="0 0 24 24"
				width={px}
				height={px}
				aria-hidden="true"
			>
				<path
					d="M12 2.5l2.95 5.98 6.6.96-4.77 4.65 1.12 6.57L12 17.57l-5.9 3.09 1.12-6.57L2.45 9.44l6.6-.96L12 2.5z"
				/>
			</svg>
			{#if shown >= i + 0.5 && shown < i + 1}
				<svg
					class="rating-star-overlay"
					viewBox="0 0 24 24"
					width={px}
					height={px}
					aria-hidden="true"
				>
					<path
						d="M12 2.5l2.95 5.98 6.6.96-4.77 4.65 1.12 6.57L12 17.57l-5.9 3.09 1.12-6.57L2.45 9.44l6.6-.96L12 2.5z"
					/>
				</svg>
			{/if}
		</button>
	{/each}
</div>

<style>
	.rating {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		line-height: 1;
	}
	.rating--disabled {
		opacity: 0.5;
	}
	.rating-star {
		display: inline-flex;
		padding: 2px;
		border: none;
		background: none;
		cursor: pointer;
		color: var(--border-strong);
		line-height: 0;
		border-radius: var(--radius-sm);
		position: relative;
	}
	.rating-star:disabled {
		cursor: default;
	}
	/* 悬停/聚焦上色只作用于整星；半星由 overlay 表达，底星保持灰色以免右半变黄 */
	.rating:not(.rating--disabled) .rating-star:hover:not(.rating-star--half),
	.rating:not(.rating--disabled) .rating-star:focus-visible:not(.rating-star--half) {
		color: var(--warning);
	}
	.rating-star:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 1px;
	}
	.rating-star-svg path {
		fill: currentColor;
	}
	.rating-star--active {
		color: var(--warning);
	}
	.rating-star-overlay {
		position: absolute;
		left: 2px;
		top: 2px;
		color: var(--warning);
		clip-path: inset(0 50% 0 0);
		pointer-events: none;
	}
	.rating-star-overlay path {
		fill: currentColor;
	}
</style>

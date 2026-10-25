<script lang="ts">
	let {
		checked = $bindable(false),
		indeterminate = $bindable(false),
		disabled = false,
		ariaLabel = '',
		onchange,
		size = 'middle',
		class: cls = '',
		style = '',
	}: {
		checked?: boolean;
		indeterminate?: boolean;
		disabled?: boolean;
		ariaLabel?: string;
		onchange?: (e: Event) => void;
		size?: 'small' | 'middle' | 'large';
		class?: string;
		style?: string;
	} = $props();

	const sizeClass = $derived(`checkbox-box--${size}`);
</script>

<label class="checkbox-label {cls}" style={style} class:disabled>
	<input
		type="checkbox"
		bind:checked
		bind:indeterminate
		{disabled}
		aria-label={ariaLabel}
		class="checkbox-input"
		onchange={(e) => onchange?.(e)}
	/>
	<span class="checkbox-box {sizeClass}" class:checked class:indeterminate>
		{#if indeterminate}
			<svg class="checkbox-check checkbox-check--{size}" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
		{:else if checked}
			<svg class="checkbox-check checkbox-check--{size}" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="20 6 9 17 4 12" />
			</svg>
		{/if}
	</span>
</label>

<style>
	.checkbox-label {
		/* 必须定位：隐藏的 input 是 absolute，没有定位祖先时会逃到更外层的定位元素处，
		   点 label 让 input 聚焦时浏览器会把那个（页面下方的）位置滚进视口 → 整页跳动 */
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	.checkbox-label.disabled { opacity: 0.5; pointer-events: none; }
	.checkbox-input { position: absolute; top: 0; left: 0; margin: 0; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
	.checkbox-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-strong);
		background-color: transparent;
		color: var(--primary-text);
		transition: background-color 0.15s, border-color 0.15s;
	}
	.checkbox-box--small { width: 14px; height: 14px; }
	.checkbox-box--large { width: 22px; height: 22px; }
	.checkbox-box.checked,
	.checkbox-box.indeterminate {
		background-color: var(--primary);
		border-color: var(--primary);
	}
	.checkbox-input:focus-visible + .checkbox-box {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.checkbox-check--small { width: 10px; height: 10px; }
	.checkbox-check--large { width: 14px; height: 14px; }
</style>

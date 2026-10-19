<script lang="ts">
	let {
		variant = 'default',
		size = 'middle',
		dot = false,
		closable = false,
		disabled = false,
		onclose,
		children,
		class: cls = '',
		style = '',
	}: {
		variant?:
			| 'default'
			| 'primary'
			| 'success'
			| 'warning'
			| 'danger'
			| 'info';
		size?: 'small' | 'middle' | 'large';
		dot?: boolean;
		closable?: boolean;
		disabled?: boolean;
		onclose?: () => void;
		children?: import('svelte').Snippet;
		class?: string;
		style?: string;
	} = $props();
</script>

<span
	class="tag tag--{variant} tag--{size} {cls}"
	class:disabled
	style={style}
	role="status"
>
	{#if dot}
		<span class="tag-dot" aria-hidden="true"></span>
	{/if}
	{#if children}
		{@render children()}
	{/if}
	{#if closable && !disabled}
		<button type="button" class="tag-close" aria-label="关闭" onclick={() => onclose?.()}>
			<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
		</button>
	{/if}
</span>

<style>
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--text);
		font-weight: 500;
		/* 行高不能写 1。行盒高度 = font-size 时没有半行距可分配，字形位置完全
		   由字体自身的 ascent/descent 决定，而拉丁字母的下伸部（g/y/p）会把
		   视觉重心往下拉 —— 纯英文标签看起来就「整体靠下」，中文方块字则正常。
		   1.4 让上下各有 ~0.2em 的半行距，超出字形的部分被吸收，视觉居中；
		   与 StatusBadge 的 line-height 保持一致，两个同类组件高度也对得上。 */
		line-height: 1.4;
		white-space: nowrap;
		box-sizing: border-box;
		vertical-align: middle;
	}
	.tag--small {
		padding: 3px 6px;
		font-size: 11px;
	}
	.tag--middle {
		padding: 4px 9px;
		font-size: 12px;
	}
	.tag--large {
		padding: 6px 12px;
		font-size: 13px;
	}
	.tag.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.tag--primary {
		background: var(--primary-soft);
		border-color: var(--accent-strong);
		color: var(--primary);
	}
	.tag--success {
		background: color-mix(in srgb, var(--success-text) 12%, transparent);
		border-color: color-mix(in srgb, var(--success-text) 40%, transparent);
		color: var(--success-text);
	}
	.tag--warning {
		background: color-mix(in srgb, var(--warning-text) 12%, transparent);
		border-color: color-mix(in srgb, var(--warning-text) 40%, transparent);
		color: var(--warning-text);
	}
	.tag--danger {
		background: color-mix(in srgb, var(--danger-text) 12%, transparent);
		border-color: color-mix(in srgb, var(--danger-text) 40%, transparent);
		color: var(--danger-text);
	}
	.tag--info {
		background: color-mix(in srgb, var(--info-text) 12%, transparent);
		border-color: color-mix(in srgb, var(--info-text) 40%, transparent);
		color: var(--info-text);
	}
	.tag-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
		flex-shrink: 0;
	}
	.tag-close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-left: 2px;
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		cursor: pointer;
		opacity: 0.6;
		border-radius: var(--radius-sm);
	}
	.tag-close:hover {
		opacity: 1;
		background: color-mix(in srgb, currentColor 15%, transparent);
	}
</style>

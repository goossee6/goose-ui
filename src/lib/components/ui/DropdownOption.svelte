<script lang="ts">
	import Check from '@lucide/svelte/icons/check';

	let {
		label,
		selected = false,
		active = false,
		disabled = false,
		meta = '',
		metaClass = 'default',
		variant = 'single',
		id,
		onpick,
		onhover,
	}: {
		label: string;
		/** 已选中（单选）／已勾选（多选） */
		selected?: boolean;
		/** 键盘落点或指针所在行 */
		active?: boolean;
		disabled?: boolean;
		/** 行尾的次要标签（"进行中"、"3 项"之类） */
		meta?: string;
		metaClass?: 'good' | 'medium' | 'bad' | 'default';
		/**
		 * single：选中 = 常驻主题色实心 pill（Select / Combobox / CreatableSelect）
		 * multi：选中 = 淡染底 + 勾，指针落点才是主题色实心（MultiSelect）
		 */
		variant?: 'single' | 'multi';
		id?: string;
		onpick?: () => void;
		onhover?: () => void;
	} = $props();
</script>

<!-- tabindex="-1"：listbox 的项不参与 Tab 序列，焦点始终留在触发器 / 搜索框上，
     落点由 aria-activedescendant 表达（Select 与 Combobox 一直如此，这里补齐另两个）。 -->
<button
	type="button"
	class="dd-option"
	class:dd-option--single={variant === 'single'}
	class:dd-option--multi={variant === 'multi'}
	class:dd-option--selected={selected}
	class:dd-option--active={active}
	class:dd-option--disabled={disabled}
	role="option"
	tabindex="-1"
	{id}
	aria-selected={selected}
	aria-disabled={disabled || undefined}
	onmousedown={(e) => {
		/* preventDefault 是必须的：不阻止的话焦点会从输入框（Combobox）或触发器
		   挪到这一行上，输入框失焦会立刻收面板 —— 看起来就是「点了选项没反应」，
		   或者更糟：选中的同时把面板关了一半。 */
		e.preventDefault();
		if (!disabled) onpick?.();
	}}
	onmouseenter={() => onhover?.()}
>
	<!-- 勾槽常驻 16px：选中渲染勾，未选中留空 → 文字列恒定不跳动 -->
	<span class="dd-check" aria-hidden="true">{#if selected}<Check size={14} />{/if}</span>
	<span class="dd-label">{label}</span>
	{#if meta}<span class="dd-meta dd-meta--{metaClass}">{meta}</span>{/if}
</button>

<style>
	.dd-option {
		position: relative;
		/* z-index: 1 —— 压在 PillTrack 的 pill 之上（pill 是 z-index:0 的行底色） */
		z-index: 1;
		display: flex;
		align-items: center;
		gap: var(--sp-md);
		width: 100%;
		height: var(--height-md);
		padding: 0 var(--sp-lg);
		border: none;
		border-radius: var(--radius-md);
		background: none;
		color: var(--text);
		font-size: var(--fs-13);
		text-align: left;
		cursor: pointer;
		transition: color 0.1s, background-color 0.1s;
	}
	.dd-label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.dd-check {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		flex-shrink: 0;
		color: var(--primary);
	}
	.dd-option--disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* ── 单选：选中 = 主题色实心 pill，指针落点 = 中性灰 ──────────────────
	   这条分工是刻意的：主题色只表示「已选中」，不跟着指针跑 ——
	   否则每一行被划过时都像被选中了一次，真正的选中项反而要靠勾和淡染底去猜。
	   指针压在选中项上时换成 --primary-hover（同一色相深一档），
	   既有悬停反馈，又不会把激活标识抹掉。 */
	.dd-option--single:hover:not(.dd-option--selected) {
		color: var(--text-strong);
	}
	/* :not(:hover) 是必须的 —— 鼠标划过时也会写 active，
	   不加这个限定就会「CSS 灰底先亮、灰 pill 后到」，同一行闪两次。 */
	.dd-option--single.dd-option--active:not(.dd-option--selected):not(:hover) {
		background-color: var(--hover);
		color: var(--text-strong);
	}
	.dd-option--single.dd-option--selected {
		color: var(--accent-text);
		font-weight: 500;
	}
	/* 勾压在主题色 pill 上，必须跟着行文字一起翻白，否则深蓝勾配深蓝底等于消失 */
	.dd-option--single.dd-option--selected .dd-check {
		color: inherit;
	}

	/* ── 多选：选中 = 淡染底 + 勾，指针落点 = 主题色实心 ──────────────────
	   反过来的分工，因为多选没有「一个」选中项：如果每个勾选行都是实心主题色，
	   列表会变成一整片色块，看不出哪一行是指针所在。 */
	.dd-option--multi.dd-option--selected {
		background-color: var(--primary-soft);
		color: var(--text-strong);
		font-weight: 500;
	}
	.dd-option--multi.dd-option--active:not(.dd-option--selected):not(:hover) {
		background-color: var(--primary);
		color: var(--accent-text);
	}
	/* 白字必须由「pill 真的压在这一行上」决定，不能由 :hover / .active 决定 ——
	   两个反例都会让整行文字凭空消失（白底白字）：
	   · 菜单恰好在静止的指针下展开 —— :hover 立刻为真，pill 却要等 pointerover
	     才会落位，这中间是白字压白底；
	   · 指针划过某行后移出菜单，或方向键移动落点 —— active 还留在那一行，
	     而 pill 只跟指针（pointerleave 后 opacity:0），同样是有字无色。
	   所以上色认 PillTrack 打在行上的 data-pill-on 标记（与 DropdownMenu 同一套）。
	   属性是运行时写的，Svelte 编译期看不到 → 规则包进 :global()；
	   类名只由本组件产出，不会外溢。 */
	:global(.dd-option--multi[data-pill-on='hover']:not(.dd-option--selected)) {
		color: var(--accent-text);
	}

	/* ── 行尾次要标签 ─────────────────────────────────────────────── */
	.dd-meta {
		font-size: var(--fs-12);
		padding: var(--space-0-5) var(--space-1-5);
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}
	.dd-meta--default {
		background-color: var(--surface-2);
		color: var(--text-muted);
	}
	.dd-meta--good {
		background-color: var(--success-soft);
		color: var(--success-text);
	}
	.dd-meta--medium {
		background-color: #fef3c7;
		color: #d97706;
	}
	.dd-meta--bad {
		background-color: var(--danger-soft);
		color: var(--danger-text);
	}
	/* 标签自带的浅灰 / 浅彩色底压在主题色实心上会显得脏，
	   统一换成一层白纱 + 行文字色；语义色在选中态让位给「可读」 */
	.dd-option--selected .dd-meta {
		background-color: rgba(255, 255, 255, 0.18);
		color: var(--accent-text);
	}
</style>

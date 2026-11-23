<script lang="ts">
	import { createDropdownPanel, revealOption, OPTION_SEL } from './dropdown.svelte';
	import { rowsHeight } from './rowHeight';
	import PillTrack from './PillTrack.svelte';
	import ScrollZones from './ScrollZones.svelte';
	import DropdownPanel from './DropdownPanel.svelte';
	import DropdownGroup from './DropdownGroup.svelte';
	import DropdownOption from './DropdownOption.svelte';

	interface Option {
		value: string;
		label: string;
		/** 分组名：连续同名的选项归入同组，组头吸顶 */
		group?: string;
	}

	let {
		items = [],
		values = $bindable([]),
		placeholder = '请选择',
		disabled = false,
		class: cls = '',
		style = '',
		ariaLabel = '',
	}: {
		items?: Option[];
		values?: string[];
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		style?: string;
		ariaLabel?: string;
	} = $props();

	let rootEl: HTMLElement | undefined = $state();
	let scrollEl = $state<HTMLElement | null>(null);
	// 键盘活动项：与 Select 一套交互（方向键移动、Enter 切换、Escape 关闭）
	let activeIdx = $state(-1);
	/**
	 * 键盘移除时给读屏播报。
	 *
	 * 徽标上的 × 对 AT 是隐藏的（原因见模板里那条注释），不给一句播报的话，
	 * 用键盘的人按下 Backspace 只会看到「徽标少了一个」，没有任何确认。
	 */
	let liveMsg = $state('');

	// combobox / listbox 的 ARIA 关联 id（每实例唯一，供 aria-controls / aria-activedescendant 使用）
	const listId = `multiselect-${Math.random().toString(36).slice(2, 8)}`;
	const optionId = (i: number) => `${listId}-${i}`;

	const isGroupHead = (i: number) => {
		const g = items[i]?.group;
		return !!g && (i === 0 || items[i - 1].group !== g);
	};

	const panel = createDropdownPanel({
		anchor: () => rootEl ?? null,
		// 面板高度 = 前 10 行（组头算一行）的实际高度，不足则自适应；8 为菜单内边距，2 为边框
		size: (rect) => ({ w: Math.max(120, rect.width), h: rowsHeight(items, 8).height + 2 }),
		scroller: () => scrollEl,
		onOpen: () => {
			activeIdx = items.length ? 0 : -1;
		},
		onClose: () => {
			activeIdx = -1;
		},
	});

	function toggleItem(val: string) {
		values = values.includes(val) ? values.filter((v) => v !== val) : [...values, val];
	}

	function removeItem(val: string) {
		const name = labelOf(val);
		values = values.filter((v) => v !== val);
		liveMsg = `已移除 ${name}，还剩 ${values.length} 项`;
	}

	function labelOf(val: string): string {
		return items.find((i) => i.value === val)?.label ?? val;
	}

	function onTriggerKeydown(e: KeyboardEvent) {
		if (disabled) return;
		// 退格/Delete 摘掉最后一个：× 按钮不进 Tab 序列（见模板注释），
		// 这是键盘移除徽标的唯一路径，所以无论面板开关都得先判。
		if ((e.key === 'Backspace' || e.key === 'Delete') && values.length) {
			e.preventDefault();
			removeItem(values[values.length - 1]);
			return;
		}
		if (!panel.open) {
			if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
				e.preventDefault();
				panel.show();
			}
			return;
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			panel.hide();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (items.length) activeIdx = activeIdx < 0 ? 0 : (activeIdx + 1) % items.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (items.length) activeIdx = activeIdx < 0 ? items.length - 1 : (activeIdx - 1 + items.length) % items.length;
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			if (activeIdx >= 0 && items[activeIdx]) toggleItem(items[activeIdx].value);
		}
	}

	// 键盘导航须把活动项滚进可视区
	$effect(() => {
		if (panel.open) revealOption(scrollEl, activeIdx);
	});
</script>

<div class="multi-select {cls}" style={style} bind:this={rootEl}>
	<!-- role="combobox" 而不是 role="button"：button 的子树是「呈现性」的，
	     读屏会把里面的每个徽标删除按钮整个吞掉；而 combobox 才是「有弹层的
	     取值控件」的正确语义，也才能用 aria-activedescendant 把键盘落点报出去。 -->
	<div
		class="trigger"
		class:open={panel.open}
		class:disabled
		class:empty={values.length === 0}
		onclick={() => panel.toggle()}
		onkeydown={onTriggerKeydown}
		role="combobox"
		tabindex={disabled ? -1 : 0}
		aria-haspopup="listbox"
		aria-expanded={panel.open}
		aria-controls={panel.open ? listId : undefined}
		aria-activedescendant={panel.open && activeIdx >= 0 ? optionId(activeIdx) : undefined}
		aria-disabled={disabled}
		aria-label={ariaLabel || undefined}
	>
		<span class="trigger-content">
			{#if values.length === 0}
				<span class="placeholder">{placeholder}</span>
			{:else}
				{#each values as val (val)}
					<span class="badge">
						{labelOf(val)}
						<!-- × 不进 Tab 序列、也不给 AT：combobox 的「值」是由子树文本拼出来的，
						     留着这些按钮，读屏会把每个 × 念进值里；键盘移除改走
						     Backspace / Delete（见 onTriggerKeydown），结果由下方 live 区播报。 -->
						<button
							type="button"
							class="badge-x"
							tabindex="-1"
							aria-hidden="true"
							onclick={(e) => {
								e.stopPropagation();
								removeItem(val);
							}}>&times;</button
						>
					</span>
				{/each}
			{/if}
		</span>
		<svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
	</div>
	{#if panel.open && panel.mounted}
		<DropdownPanel style={panel.panelStyle} flipUp={panel.flipUp}>
			<div class="menu-scroll" bind:this={scrollEl} role="listbox" id={listId} aria-multiselectable="true">
				<!-- 单 pill（只有 hover 这一块）→ 主题色实心；选中项不是 pill，
				     而是常驻的勾 + 淡染底，两者不冲突。 -->
				<PillTrack
					container={scrollEl}
					itemSelector={`${OPTION_SEL}:not(.dd-option--selected)`}
					showSelected={false}
					hoverBackground="var(--primary)"
				/>
				{#each items as item, i (item.value)}
					{#if isGroupHead(i)}
						<DropdownGroup label={item.group} />
					{/if}
					<DropdownOption
						label={item.label}
						id={optionId(i)}
						variant="multi"
						selected={values.includes(item.value)}
						active={i === activeIdx}
						onpick={() => toggleItem(item.value)}
						onhover={() => (activeIdx = i)}
					/>
				{/each}
			</div>
			<ScrollZones target={scrollEl} />
		</DropdownPanel>
	{/if}
	<!-- 键盘移除的播报口。放触发器外面：它不属于 combobox 的值 -->
	<span class="sr-only" aria-live="polite">{liveMsg}</span>
</div>

<style>
	.multi-select { position: relative; display: inline-block; min-width: 200px; }
	.trigger { display: flex; align-items: center; gap: var(--space-2); padding: var(--padding-md); height: var(--height-md); min-width: 140px; max-width: 280px; align-self: stretch; background-color: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--radius-lg); color: var(--text-strong); font-size: var(--font-md); cursor: pointer; transition: border-color 0.2s, background-color 0.2s; }
	.trigger:hover:not(.disabled) { background-color: var(--surface-3); }
	.trigger:focus-visible { border-color: var(--primary); outline: none; }
	.trigger.open { border-color: var(--primary); }
	.trigger.disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
	.trigger-content { flex: 1; display: flex; flex-wrap: wrap; gap: var(--space-1); min-width: 0; }
	.placeholder { color: var(--text-muted); white-space: nowrap; }
	.badge { display: inline-flex; align-items: center; gap: var(--space-0-5); padding: 1px var(--space-1-5); border-radius: var(--radius-sm); background: var(--primary-soft); color: var(--primary); font-size: var(--fs-11); font-weight: 500; white-space: nowrap; line-height: 18px; }
	.badge-x { display: inline-flex; align-items: center; justify-content: center; padding: 0; margin: 0; border: none; background: none; color: inherit; cursor: pointer; font-size: var(--fs-13); line-height: 1; width: 14px; height: 14px; border-radius: 50%; transition: background-color 0.15s; }
	.badge-x:hover { background-color: rgba(0, 0, 0, 0.15); }
	.chevron { color: var(--text-muted); transition: transform 0.2s; flex-shrink: 0; }
	.trigger.open .chevron { transform: rotate(180deg); }

	/* 唯一滚动体：隐藏滚动条 → 左右内边距一致 */
	.menu-scroll { position: relative; flex: 1 1 auto; min-height: 0; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; }
	.menu-scroll::-webkit-scrollbar { display: none; }

	/* 只给读屏的一行播报（没有全局 .sr-only，就地定义；用 clip-path 收成不可见，不占位） */
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>

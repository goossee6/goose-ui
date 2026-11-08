<script lang="ts">
	let {
		page = $bindable(1),
		total = 0,
		pageSize = 10,
		siblingCount = 1,
		showTotal = true,
		showQuickJumper = false,
		onchange,
		class: cls = '',
		style = '',
	}: {
		page?: number;
		total?: number;
		pageSize?: number;
		siblingCount?: number;
		showTotal?: boolean;
		showQuickJumper?: boolean;
		onchange?: (page: number) => void;
		class?: string;
		style?: string;
	} = $props();

	// pageSize<=0 会让 pageCount 变 Infinity，range 循环会挂死
	const safePageSize = $derived(Number.isFinite(pageSize) && pageSize >= 1 ? Math.floor(pageSize) : 1);
	const pageCount = $derived(Math.max(1, Math.ceil(total / safePageSize)));
	const curPage = $derived(Math.min(Math.max(1, page), pageCount));

	const range = $derived.by(() => {
		const n = pageCount;
		const cur = curPage;
		const s = siblingCount;
		const pages: (number | '…')[] = [];
		const from = Math.max(2, cur - s);
		const to = Math.min(n - 1, cur + s);
		pages.push(1);
		if (from > 2) pages.push('…');
		for (let i = from; i <= to; i++) pages.push(i);
		if (to < n - 1) pages.push('…');
		if (n > 1) pages.push(n);
		return pages;
	});

	function go(p: number | '…') {
		if (typeof p !== 'number' || !Number.isFinite(p)) return;
		const next = Math.min(Math.max(1, p), pageCount);
		if (next === page) return;
		page = next;
		onchange?.(next);
	}

	// ── 跳页输入 ──────────────────────────────────────────────────────
	// 只保留数字，位数不超过 pageCount 的位数：既能挡住字母/粘贴进来的
	// "第 3 页"，又不会把「1」写成「01」这种用户没打算的东西。
	let jumpText = $state('');

	function onJumpInput(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const digits = el.value.replace(/\D/g, '').slice(0, String(pageCount).length);
		jumpText = digits;
		// 受控回写：Svelte 比较到 jumpText 未变时不会重置 DOM，多余的字符得自己抹掉
		if (el.value !== digits) el.value = digits;
	}

	/** Enter / 失焦提交，越界夹到端点（同 go 的规则），提交后清空以便重新输入 */
	function commitJump() {
		const raw = jumpText;
		jumpText = '';
		if (!raw) return;
		const n = Number(raw);
		if (Number.isFinite(n)) go(Math.trunc(n));
	}

	function onJumpKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commitJump();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			jumpText = '';
		}
	}
</script>

<nav class="pagination {cls}" aria-label="分页" style={style}>
	{#if showTotal && total > 0}
		<span class="pagination-total">共 {total} 条</span>
	{/if}
	<button
		type="button"
		class="pagination-btn"
		disabled={curPage <= 1}
		aria-label="上一页"
		onclick={() => go(curPage - 1)}
	>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
	</button>
	<ul class="pagination-list">
		{#each range as p, i (i)}
			{#if p === '…'}
				<li class="pagination-gap" aria-hidden="true">…</li>
			{:else}
				<li>
					<button
						type="button"
						class="pagination-btn"
						class:active={p === curPage}
						aria-current={p === curPage ? 'page' : undefined}
						aria-label="第 {p} 页"
						onclick={() => go(p)}
					>
						{p}
					</button>
				</li>
			{/if}
		{/each}
	</ul>
	<button
		type="button"
		class="pagination-btn"
		disabled={curPage >= pageCount}
		aria-label="下一页"
		onclick={() => go(curPage + 1)}
	>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
	</button>
	{#if showQuickJumper && pageCount > 1}
		<label class="pagination-jumper">
			跳至
			<input
				class="pagination-jump-input"
				type="text"
				inputmode="numeric"
				autocomplete="off"
				spellcheck="false"
				aria-label="跳至页码，输入后按回车"
				value={jumpText}
				oninput={onJumpInput}
				onkeydown={onJumpKeydown}
				onblur={commitJump}
			/>
			页
		</label>
	{/if}
</nav>

<style>
	.pagination {
		display: flex;
		align-items: center;
		gap: var(--sp-sm);
		flex-wrap: wrap;
	}
	.pagination-total {
		font-size: var(--fs-13);
		color: var(--text-muted);
		margin-right: var(--sp-md);
	}
	.pagination-list {
		display: flex;
		align-items: center;
		gap: var(--sp-sm);
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.pagination-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 32px;
		height: 32px;
		padding: 0 var(--sp-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--text);
		font-size: var(--fs-13);
		font-family: var(--font-mono);
		cursor: pointer;
		transition: background-color 0.15s, border-color 0.15s, color 0.15s;
	}
	.pagination-btn:hover:not(:disabled):not(.active) {
		background-color: var(--hover);
		border-color: var(--border-strong);
	}
	.pagination-btn.active {
		background-color: var(--primary);
		border-color: var(--primary);
		color: var(--primary-text);
	}
	.pagination-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.pagination-btn:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	.pagination-gap {
		padding: 0 var(--sp-sm);
		color: var(--text-muted);
		font-family: var(--font-mono);
	}
	.pagination-jumper {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-sm);
		margin-left: var(--sp-sm);
		font-size: var(--fs-13);
		color: var(--text-muted);
		white-space: nowrap;
	}
	/* 与 .pagination-btn 同高同字体，跳页框看起来才像分页条的一部分 */
	.pagination-jump-input {
		width: 46px;
		height: 32px;
		padding: 0 var(--sp-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--text);
		font-family: var(--font-mono);
		font-size: var(--fs-13);
		text-align: center;
		box-sizing: border-box;
		transition: border-color 0.15s;
	}
	.pagination-jump-input:hover {
		border-color: var(--border-strong);
	}
	.pagination-jump-input:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
		border-color: var(--primary);
	}
</style>

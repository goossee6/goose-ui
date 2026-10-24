<script lang="ts" module>
	const KEYWORDS = new Set(
		'const let var function return if else for while class new import export from default async await try catch finally throw typeof instanceof this null undefined true false interface type extends implements public private readonly as in of do switch case break continue void enum declare'.split(
			' '
		)
	);

	type Piece = { text: string; kind: 'plain' | 'comment' | 'string' | 'keyword' | 'number' };

	// 单趟扫描：只认 // 与块注释（# 会误伤十六进制色值与 #private 字段），字符串优先于标识符
	function tokenize(code: string): Piece[] {
		const pieces: Piece[] = [];
		const re =
			/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;
		let last = 0;
		let m: RegExpExecArray | null;
		while ((m = re.exec(code)) !== null) {
			if (m.index > last) pieces.push({ text: code.slice(last, m.index), kind: 'plain' });
			if (m[1]) pieces.push({ text: m[1], kind: 'comment' });
			else if (m[2]) pieces.push({ text: m[2], kind: 'string' });
			else if (m[3]) pieces.push({ text: m[3], kind: 'number' });
			else if (m[4]) {
				pieces.push({
					text: m[4],
					kind: KEYWORDS.has(m[4]) ? 'keyword' : 'plain',
				});
			}
			last = re.lastIndex;
		}
		if (last < code.length) pieces.push({ text: code.slice(last), kind: 'plain' });
		return pieces;
	}
</script>

<script lang="ts">
	import { copyToClipboard } from '../../utils/clipboard';

	let {
		code = '',
		language = '',
		showHeader = true,
		copyable = true,
		maxHeight = '',
		oncopy,
		class: cls = '',
		style = '',
	}: {
		code?: string;
		language?: string;
		showHeader?: boolean;
		copyable?: boolean;
		maxHeight?: string;
		oncopy?: (ok: boolean) => void;
		class?: string;
		style?: string;
	} = $props();

	const pieces = $derived(tokenize(code));
	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | null = null;

	async function copy() {
		const ok = await copyToClipboard(code);
		oncopy?.(ok);
		if (!ok) return;
		copied = true;
		if (copyTimer) clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copied = false), 1600);
	}
</script>

<div class="code-block {cls}" style={style}>
	{#if showHeader}
		<div class="cb-header">
			<span class="cb-lang">{language || 'text'}</span>
			{#if copyable}
				<button type="button" class="cb-copy" class:copied onclick={copy}>
					{#if copied}
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
						已复制
					{:else}
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
						复制
					{/if}
				</button>
			{/if}
		</div>
	{/if}
	<pre class="cb-pre" style:max-height={maxHeight || undefined}><code>{#each pieces as p, i (i)}<span class="cb-{p.kind}">{p.text}</span>{/each}</code></pre>
</div>

<style>
	.code-block {
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--surface-2);
	}
	.cb-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--sp-sm) var(--sp-md);
		border-bottom: 1px solid var(--border);
		background: color-mix(in srgb, var(--surface) 60%, var(--surface-2));
	}
	.cb-lang {
		font-family: var(--font-mono);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}
	.cb-copy {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 3px 8px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--text-muted);
		font-size: 11px;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
	}
	.cb-copy:hover {
		color: var(--text-strong);
		border-color: var(--primary);
	}
	.cb-copy.copied {
		color: #16a34a;
		border-color: #16a34a;
	}
	.cb-pre {
		margin: 0;
		padding: var(--sp-lg);
		overflow: auto;
		scrollbar-gutter: stable;
		font-family: var(--font-mono);
		font-size: 12.5px;
		line-height: 1.6;
		color: var(--text);
		tab-size: 2;
	}
	.cb-comment {
		color: var(--text-muted);
		font-style: italic;
	}
	.cb-string {
		color: #16a34a;
	}
	.cb-keyword {
		color: #7c3aed;
	}
	.cb-number {
		color: #c2410c;
	}
</style>

/**
 * 从组件源码生成 docs/api-reference.md。
 *
 * 为什么生成而不是手写：86 个组件、几百个 props，手写的文档在第一次改组件时就过期。
 * 这里直接读 `$props()` 的解构 + 类型块，说明取自源码里的 JSDoc，
 * 组件的一句话定位取自 docs/components.md（那份是人写的，不覆盖）。
 *
 * 用法：
 *   node scripts/gen-api-docs.mjs          # 生成
 *   node scripts/gen-api-docs.mjs --dry    # 只打印统计，不写文件
 *   node scripts/gen-api-docs.mjs --check  # 只校验是否过期（有过期内容时 exit 1）
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const UI_DIR = path.join(ROOT, 'src/lib/components/ui');
const COMPONENTS_DOC = path.join(ROOT, 'docs/components.md');
const OUT = path.join(ROOT, 'docs/api-reference.md');
const DRY = process.argv.includes('--dry');
const CHECK = process.argv.includes('--check');

// ---------- 源码扫描：跳过字符串与注释，避免把 { 数错 ----------
function findMatch(src, open) {
	let depth = 0;
	for (let i = open; i < src.length; i++) {
		const ch = src[i];
		const next = src[i + 1];
		if (ch === '/' && next === '*') {
			const end = src.indexOf('*/', i + 2);
			if (end < 0) return -1;
			i = end + 1;
			continue;
		}
		if (ch === '/' && next === '/') {
			const end = src.indexOf('\n', i);
			if (end < 0) return -1;
			i = end;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === '`') {
			const quote = ch;
			for (i++; i < src.length; i++) {
				if (src[i] === '\\') i++;
				else if (src[i] === quote) break;
			}
			continue;
		}
		if (ch === '{' || ch === '(' || ch === '[') depth++;
		else if (ch === '}' || ch === ')' || ch === ']') {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

/** 按顶层分隔符切分（不切嵌套结构里的）。 */
function splitTopLevel(src, sep = ',') {
	const out = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < src.length; i++) {
		const ch = src[i];
		const next = src[i + 1];
		if (ch === '/' && next === '*') {
			const end = src.indexOf('*/', i + 2);
			i = end < 0 ? src.length : end + 1;
			continue;
		}
		if (ch === '/' && next === '/') {
			const end = src.indexOf('\n', i);
			i = end < 0 ? src.length : end;
			continue;
		}
		if (ch === '"' || ch === "'" || ch === '`') {
			const quote = ch;
			for (i++; i < src.length; i++) {
				if (src[i] === '\\') i++;
				else if (src[i] === quote) break;
			}
			continue;
		}
		if ('{(['.includes(ch)) depth++;
		else if ('})]'.includes(ch)) depth--;
		else if (ch === sep && depth === 0) {
			out.push(src.slice(start, i));
			start = i + 1;
		}
	}
	out.push(src.slice(start));
	return out.map((s) => s.trim()).filter(Boolean);
}

/** 从一段文本里取出前置 JSDoc 与正文。 */
function takeDoc(text) {
	const m = text.match(/^\s*\/\*\*([\s\S]*?)\*\/\s*([\s\S]*)$/);
	if (!m) return { doc: '', rest: text.trim() };
	const doc = m[1]
		.split('\n')
		.map((l) => l.replace(/^\s*\*\s?/, '').trim())
		.filter(Boolean)
		.join(' ')
		.replace(/\s+/g, ' ');
	return { doc, rest: m[2].trim() };
}

function parseSvelte(file) {
	// 仓库是 CRLF：正则里的 `.` 不匹配 \r，不统一换行会让 `(.+)$` 这类写法全部失效
	const src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
	const declStart = src.search(/let\s*\{/);
	if (declStart < 0) return null;
	const destrOpen = src.indexOf('{', declStart);
	const destrClose = findMatch(src, destrOpen);
	if (destrClose < 0) return null;
	const destrBody = src.slice(destrOpen + 1, destrClose);

	// 类型块：解构之后的 `: { ... }`
	const after = src.slice(destrClose + 1);
	const propsCall = after.indexOf('$props()');
	if (propsCall < 0) return null;
	const head = after.slice(0, propsCall);
	const typeOpen = head.indexOf('{');
	const typeBody = typeOpen >= 0 ? head.slice(typeOpen + 1, findMatch(head, typeOpen)) : '';

	// ---- 解构：名字 / 别名 / 默认值 / JSDoc ----
	const destruct = [];
	for (const raw of splitTopLevel(destrBody)) {
		if (raw.startsWith('...')) continue; // rest
		const { doc, rest } = takeDoc(raw);
		const eq = rest.indexOf('=');
		const headPart = (eq >= 0 ? rest.slice(0, eq) : rest).trim();
		let dflt = eq >= 0 ? rest.slice(eq + 1).trim() : '';
		const nameParts = headPart.split(':').map((s) => s.trim());
		const name = nameParts[0];
		if (!name || !/^[\w$]+$/.test(name)) continue;
		const alias = nameParts[1];
		destruct.push({ name, alias, dflt, doc });
	}

	// ---- 类型块：类型 / JSDoc ----
	const types = new Map();
	for (const raw of splitTopLevel(typeBody, ';')) {
		const { doc, rest } = takeDoc(raw);
		if (/^\[.*\]$/.test(rest)) continue; // index signature
		const m = rest.match(/^([\w$]+)\s*\??\s*:\s*([\s\S]+)$/);
		if (!m) continue;
		types.set(m[1], { type: m[2].trim().replace(/\s+/g, ' '), doc });
	}

	return destruct.map((d) => {
		const t = types.get(d.name) ?? {};
		// `class: cls` 是重命名，不是双向绑定；只有 $bindable 才是
		const bindable = /\$bindable/.test(d.dflt);
		let dflt = d.dflt;
		if (bindable) {
			// $bindable<T>(null) → null；$bindable(false) → false
			const inner = dflt.match(/\$bindable(?:<[\s\S]*>)?\s*\(([\s\S]*)\)\s*$/);
			dflt = inner ? inner[1].trim() : '';
		}
		return {
			name: d.name,
			alias: d.alias,
			bindable,
			type: t.type ?? '',
			dflt,
			doc: t.doc || d.doc || '',
		};
	});
}

// ---------- 组件定位说明来自 components.md ----------
function readCatalog() {
	const md = fs.readFileSync(COMPONENTS_DOC, 'utf8').replace(/\r\n/g, '\n');
	const out = []; // [{ group, items: [{ name, desc }] }]
	let group = null;
	for (const line of md.split('\n')) {
		const h = line.match(/^##\s+(.+)$/);
		if (h) {
			group = { group: h[1].trim(), items: [] };
			out.push(group);
			continue;
		}
		const row = line.match(/^\|\s*([A-Za-z][\w\s/]*?)\s*\|\s*([^|]+?)\s*\|/);
		if (!row || !group) continue;
		if (/^(组件|上游常见叫法)$/.test(row[1])) continue;
		// `Form / FormItem` 这类一行多组件，拆开都指向同一条说明
		for (const name of row[1].split('/').map((s) => s.trim())) {
			if (/^[A-Z]/.test(name)) group.items.push({ name, desc: row[2].replace(/\s+/g, ' ').trim() });
		}
	}
	return out;
}

// ---------- 输出 ----------
const catalog = readCatalog();
const files = fs.readdirSync(UI_DIR).filter((f) => f.endsWith('.svelte'));
const byName = new Map();
for (const f of files) byName.set(f.replace(/\.svelte$/, ''), path.join(UI_DIR, f));

const esc = (s) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const code = (s) => (s ? '`' + s.replace(/`/g, "'") + '`' : '');

let missing = 0;
let totalProps = 0;
const sections = [];
const toc = []; // [{ group, names: [] }] —— 89 个组件一个索引，长文里没有索引只能靠搜索

for (const { group, items } of catalog) {
	const blocks = [];
	const names = [];
	for (const { name, desc } of items) {
		const file = byName.get(name);
		if (!file) continue;
		const props = parseSvelte(file);
		if (!props) {
			missing++;
			continue;
		}
		names.push(name);
		totalProps += props.length;
		const rows = props.map((p) => {
			const def = p.dflt === '' ? '—' : code(p.dflt);
			const nameCell = p.bindable ? `${code(p.name)} *(bind)*` : code(p.name);
			return `| ${nameCell} | ${esc(code(p.type) || '—')} | ${esc(def)} | ${esc(p.doc || '')} |`;
		});
		blocks.push(
			[
				`### ${name}`,
				'',
				desc,
				'',
				'| 属性 | 类型 | 默认 | 说明 |',
				'| --- | --- | --- | --- |',
				...rows,
				'',
				`\`\`\`ts`,
				`import { ${name} } from 'goose-ui';`,
				`\`\`\``,
				'',
			].join('\n')
		);
	}
	if (blocks.length) {
		sections.push(`## ${group}\n\n${blocks.join('\n')}`);
		toc.push({ group, names });
	}
}

const totalComponents = toc.reduce((n, g) => n + g.names.length, 0);
const catalogTotal = new Set(catalog.flatMap((g) => g.items.map((i) => i.name))).size;

const header = `# 组件 Props 参考

对外 ${catalogTotal} 个组件里，${totalComponents} 个有 props 的列在这里，共 ${totalProps} 条。
本文件由 \`scripts/gen-api-docs.mjs\` 从 \`src/lib/components/ui/*.svelte\` 生成，**不要手改**：
改完组件执行 \`pnpm docs:api\` 重新生成，\`pnpm docs:api:check\`（CI 用）校验本文件有没有落后于源码。

- 每节的一句话说明取自[组件清单](components.md)，其余全部来自组件源码：类型取自
  \`let { … }: { … } = $props()\` 的类型块，说明取自类型块与解构处的 JSDoc
- 标 *(bind)* 的属性可双向绑定：\`bind:value\`、\`bind:checked\`、\`bind:open\`
- 「类型」是 TypeScript 类型；Svelte 5 里事件也是属性写法（\`onclick={…}\`），不写 \`on:click\`
- 表里没有列出的属性会随 \`...rest\` 透传到根元素——\`class\` / \`style\` / \`id\` / \`aria-*\` 因此在
  任何组件上都能用，不必等它变成一个 prop
- 剩下 3 个组件没有 props，所以不在本表：\`ContextMenu\`（右键菜单）、\`ConfirmDialog\`、
  \`ErrorDialog\`，用法见[工具函数与 API](api.md)
- 想看「怎么用」而不只是「有哪些属性」：[在线 demo](https://goossee6.github.io/goose-ui/) 每页都能在
  「效果 / 源码」之间切换，对应源码在 \`demo/src/lib/demos/*.svelte\`

## 索引

${toc.map((g) => `**${g.group}** ${g.names.map((n) => `[${n}](#${n.toLowerCase()})`).join(' · ')}`).join('\n\n')}

`;

const md = header + sections.join('\n');

if (DRY) {
	console.log(`${totalComponents} 个组件、${totalProps} 条 props`);
	console.log(`catalog 条目 ${catalog.reduce((n, g) => n + g.items.length, 0)} 个，输出 ${md.length} 字符`);
	process.exit(0);
}

if (CHECK) {
	const prev = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : '';
	if (prev !== md) {
		console.error('✗ docs/api-reference.md 已落后于组件源码，执行 `pnpm docs:api` 重新生成');
		process.exit(1);
	}
	console.log('✓ docs/api-reference.md 与组件源码一致');
	process.exit(0);
}

fs.writeFileSync(OUT, md);
console.log(
	`✓ 已写入 docs/api-reference.md（${totalComponents}/${files.length} 个组件，${totalProps} 条 props，${(md.length / 1024).toFixed(0)}KB）`
);

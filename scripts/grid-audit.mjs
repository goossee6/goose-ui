#!/usr/bin/env node
/**
 * grid-audit — 刻度体系体检。
 *
 * 1) 校验组件引用的刻度 token 是否都在 theme.css 里有定义（防拼写错、防写了不存在的档）；
 * 2) 统计仍以字面量出现的间距/字号/圆角，按类别给出覆盖率。
 *
 * 退出码：存在未定义 token 时为 1（可挂进 CI）。
 * 用法：node scripts/grid-audit.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const THEME = path.join(ROOT, 'src', 'lib', 'styles', 'theme.css');
const SRC = path.join(ROOT, 'src', 'lib', 'components');

const theme = fs.readFileSync(THEME, 'utf8');
const defined = new Set();
const values = new Map();
for (const m of theme.matchAll(/^\s*(--(?:space|fs|radius)-[a-z0-9-]+)\s*:\s*([^;]+);/gm)) {
	const name = m[1].trim();
	defined.add(name);
	values.set(name, m[2].trim());
}

/* 间距型档位 token（名字里带 pad）的值必须落在空间刻度内。
   档位本身写具体值（不套 var，便于一处改一处），所以这里做「值一致性」校验而非引用校验：
   刻度改了、档位没跟，会在这里报出来。尺寸型档位（--height-* / --checkbox-*）不参与，
   它们的取值逻辑是枚举而非刻度。 */
const SPACE_VALUES = new Set([2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96]);
const stepDrift = [];
for (const [name, raw] of values) {
	if (!/pad/.test(name)) continue;
	for (const m of raw.matchAll(/(\d+(?:\.\d+)?)px/g)) {
		const px = Number(m[1]);
		if (px === 0 || SPACE_VALUES.has(px)) continue;
		stepDrift.push(`${name}: ${raw}（${px}px 不在空间刻度内）`);
	}
}

/* 命名自洽性：--space-3 必须是 12px（3×4），--space-1-5 必须是 6px，--fs-13 必须是 13px。
   这条校验能抓住手录刻度表时的笔误 —— 一旦名字和值对不上，后续所有归位判断都是错的。 */
const RADIUS_EXPECT = { '--radius-xs': 2, '--radius-sm': 4, '--radius-md': 6, '--radius-lg': 8, '--radius-xl': 12, '--radius-full': 9999 };
const drift = [];
for (const [name, raw] of values) {
	const px = Number((raw.match(/^(\d+(?:\.\d+)?)px$/) || [])[1]);
	if (Number.isNaN(px)) continue;
	let expect = null;
	let m;
	if ((m = /^--space-(\d+)(?:-(\d))?$/.exec(name))) {
		expect = Number(m[1]) * 4 + (m[2] === '5' ? 2 : 0);
	} else if ((m = /^--fs-(\d+)$/.exec(name))) {
		expect = Number(m[1]);
	} else if (RADIUS_EXPECT[name] !== undefined) {
		expect = RADIUS_EXPECT[name];
	}
	if (expect !== null && expect !== px) drift.push(`${name} = ${px}px，按命名应为 ${expect}px`);
}

function walk(d, out = []) {
	if (!fs.existsSync(d)) return out;
	for (const e of fs.readdirSync(d, { withFileTypes: true })) {
		const p = path.join(d, e.name);
		if (e.isDirectory()) walk(p, out);
		else if (e.name.endsWith('.svelte')) out.push(p);
	}
	return out;
}

const SPACE_PROPS = new Set([
	'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
	'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
	'gap', 'row-gap', 'column-gap',
	'inset', 'inset-block', 'inset-inline', 'top', 'right', 'bottom', 'left',
]);

const unknown = new Map();
const used = new Map();
const literal = { space: {}, font: 0, radius: 0 };

for (const file of walk(SRC)) {
	const src = fs.readFileSync(file, 'utf8');
	for (const block of src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
		const css = block[1];
		for (const m of css.matchAll(/var\(\s*(--(?:space|fs|radius)-[a-z0-9-]+)/g)) {
			const t = m[1];
			used.set(t, (used.get(t) || 0) + 1);
			if (!defined.has(t)) {
				const list = unknown.get(t) || [];
				list.push(path.relative(ROOT, file));
				unknown.set(t, list);
			}
		}
		for (const d of css.matchAll(/([a-zA-Z][a-zA-Z0-9-]*)\s*:\s*([^;{}]+);/g)) {
			const prop = d[1].toLowerCase();
			const val = d[2];
			const nums = [...val.matchAll(/(\d+(?:\.\d+)?)px/g)].map((x) => Number(x[1]));
			if (!nums.length) continue;
			if (SPACE_PROPS.has(prop)) {
				for (const n of nums) literal.space[n] = (literal.space[n] || 0) + 1;
			} else if (prop === 'font-size') {
				literal.font += nums.length;
			} else if (prop.startsWith('border') && prop.includes('radius')) {
				literal.radius += nums.length;
			}
		}
	}
}

console.log(`刻度 token 定义 ${defined.size} 个，被引用 ${used.size} 个`);

if (drift.length) {
	console.log('\n✗ 刻度表命名与数值不自洽:');
	for (const d of drift) console.log('  ' + d);
} else {
	console.log('✓ 刻度命名与数值自洽（--space-N = N×4，--fs-N = N）');
}

if (stepDrift.length) {
	console.log('\n✗ 间距型档位 token 的值不在空间刻度内:');
	for (const d of stepDrift) console.log('  ' + d);
} else {
	console.log('✓ 间距型档位 token 均在空间刻度内');
}

if (unknown.size) {
	console.log('\n✗ 未定义的 token:');
	for (const [t, files] of unknown) {
		console.log(`  ${t}  ← ${files.length} 处，如 ${files[0]}`);
	}
} else {
	console.log('✓ 所有引用的刻度 token 均有定义');
}

const fmt = (o, unit = '处') =>
	Object.entries(o)
		.sort((a, b) => b[1] - a[1])
		.map(([k, v]) => `${k}${unit}×${v}`)
		.join('  ');

console.log('\n仍为字面量（间距类）:');
console.log('  ' + (fmt(literal.space) || '无'));
console.log(`字面量字号 ${literal.font} 处，字面量圆角 ${literal.radius} 处`);

const zero = ['0', '0px'];
const residual = Object.entries(literal.space).filter(([k]) => !zero.includes(k));
const sum = residual.reduce((a, [, v]) => a + v, 0);
console.log(`\n间距字面量合计 ${sum} 处（不含 0）；已 token 化 ${[...used].filter(([t]) => t.startsWith('--space')).reduce((a, [, v]) => a + v, 0)} 处`);

process.exit(unknown.size || drift.length || stepDrift.length ? 1 : 0);

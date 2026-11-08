#!/usr/bin/env node
/**
 * grid-codemod — 把 <style> 块里的 px 字面量替换为刻度 token。
 *
 * 设计原则：**只换写法，不换值**。`gap: 8px` → `gap: var(--space-2)`，
 * 计算样式完全一致，所以可以整批验证「零视觉变化」。
 * 刻度表外的值一律保留并进报告，等人工判断归位（归位会改视觉，不能自动做）。
 *
 * 用法：
 *   node scripts/grid-codemod.mjs            # dry-run，只打印
 *   node scripts/grid-codemod.mjs --write    # 实际写入
 *   node scripts/grid-codemod.mjs --only=space|font|radius
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src', 'lib');
const WRITE = process.argv.includes('--write');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice('--only='.length).split(',') : ['space', 'font', 'radius'];

/* 空间刻度：属性白名单。width/height 不在其中 —— 它们是组件尺寸，
   走 --height-* 档位，不属于间距刻度（见 docs/grid.md）。 */
const SPACE_PROPS = new Set([
	'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
	'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
	'gap', 'row-gap', 'column-gap',
	'inset', 'inset-block', 'inset-inline', 'top', 'right', 'bottom', 'left',
]);

const SPACE_SCALE = {
	2: '--space-0-5', 4: '--space-1', 6: '--space-1-5', 8: '--space-2',
	10: '--space-2-5', 12: '--space-3', 14: '--space-3-5', 16: '--space-4',
	20: '--space-5', 24: '--space-6', 28: '--space-7', 32: '--space-8',
	40: '--space-10', 48: '--space-12', 56: '--space-14', 64: '--space-16',
	80: '--space-20', 96: '--space-24',
};

const FS_SCALE = {
	10: '--fs-10', 11: '--fs-11', 12: '--fs-12', 13: '--fs-13',
	14: '--fs-14', 16: '--fs-16', 18: '--fs-18', 20: '--fs-20',
};

const RADIUS_SCALE = {
	4: '--radius-sm', 6: '--radius-md', 8: '--radius-lg', 12: '--radius-xl',
	999: '--radius-full', 9999: '--radius-full',
};

const pxRe = /(^|[\s/()])(-?\d+(?:\.\d+)?)px(?=$|[\s/);,])/g;

function pickScale(prop) {
	const p = prop.toLowerCase();
	if (ONLY.includes('space') && SPACE_PROPS.has(p)) return SPACE_SCALE;
	if (ONLY.includes('font') && p === 'font-size') return FS_SCALE;
	if (ONLY.includes('radius') && p.startsWith('border') && p.includes('radius')) return RADIUS_SCALE;
	return null;
}

function rewriteValue(value, scale) {
	let hits = 0;
	const out = value.replace(pxRe, (m, pre, num) => {
		const n = Number(num);
		const token = scale[Math.abs(n)];
		if (n === 0 || !token) return m;
		hits++;
		const ref = `var(${token})`;
		return pre + (n < 0 ? `calc(-1 * ${ref})` : ref);
	});
	return { value: out, hits };
}

function walk(dirs, out = []) {
	for (const d of dirs) {
		if (!fs.existsSync(d)) continue;
		for (const e of fs.readdirSync(d, { withFileTypes: true })) {
			const p = path.join(d, e.name);
			if (e.isDirectory()) walk([p], out);
			else if (e.name.endsWith('.svelte')) out.push(p);
		}
	}
	return out;
}

const files = walk([path.join(SRC, 'components')]);
const report = { files: 0, hits: 0, byToken: {}, leftover: {}, samples: [], touched: [] };

for (const file of files) {
	const src = fs.readFileSync(file, 'utf8');
	let fileHits = 0;

	const next = src.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (whole, attrs, css) => {
		const cssNext = css.replace(/([a-zA-Z][a-zA-Z0-9-]*)\s*:\s*([^;{}]+?)(\s*;|\s*$)/g, (m, prop, val, tail) => {
			const scale = pickScale(prop);
			if (!scale) return m;
			const { value, hits } = rewriteValue(val, scale);
			if (!hits) {
				for (const x of val.matchAll(/(\d+(?:\.\d+)?)px/g)) {
					const k = x[1] + 'px';
					report.leftover[k] = (report.leftover[k] || 0) + 1;
				}
				return m;
			}
			fileHits += hits;
			for (const x of val.matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
				const n = Math.abs(Number(x[1]));
				if (scale[n]) report.byToken[scale[n]] = (report.byToken[scale[n]] || 0) + 1;
			}
			if (report.samples.length < 12) {
				report.samples.push(`${path.relative(ROOT, file)}  ${prop}: ${val.trim()}  →  ${value.trim()}`);
			}
			return `${prop}: ${value}${tail}`;
		});
		return `<style${attrs}>${cssNext}</style>`;
	});

	if (fileHits > 0) {
		report.files++;
		report.hits += fileHits;
		report.touched.push({ file: path.relative(ROOT, file), hits: fileHits });
		if (WRITE && next !== src) fs.writeFileSync(file, next, 'utf8');
	}
}

console.log(`模式: ${WRITE ? '写入' : 'dry-run'}   范围: ${ONLY.join('+')}`);
console.log(`命中 ${report.files} 个文件，共 ${report.hits} 处\n`);
console.log('按 token 计:');
for (const [k, v] of Object.entries(report.byToken).sort((a, b) => b[1] - a[1])) {
	console.log(`  ${k.padEnd(16)} ${v}`);
}
console.log('\n样例:');
for (const s of report.samples) console.log('  ' + s);
console.log('\n未替换（刻度表外，保留）:');
for (const [k, v] of Object.entries(report.leftover).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
	console.log(`  ${k.padEnd(10)} ${v}`);
}
console.log('\n改动最多的文件:');
for (const t of report.touched.sort((a, b) => b.hits - a.hits).slice(0, 12)) {
	console.log(`  ${String(t.hits).padStart(4)}  ${t.file}`);
}

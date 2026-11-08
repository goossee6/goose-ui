/**
 * 产物体积守卫。
 *
 * demo 的硬约束是「单文件 ≤ 500KB」（总量不限，页面访问是随机的）。
 * 目前最大的块是 demos（全部示例页），离上限只剩几十 KB，
 * 再加十来个示例页就会突破 —— 与其等部署到 GitHub Pages 才发现，
 * 不如在 build 后就失败，并直接指出该往哪一组再拆。
 */
import fs from 'node:fs';
import path from 'node:path';

const LIMIT = 500 * 1024;
const DIR = path.resolve(import.meta.dirname, '../demo/dist/assets');

if (!fs.existsSync(DIR)) {
	console.error(`产物目录不存在：${DIR}（先跑 pnpm build）`);
	process.exit(1);
}

const files = fs
	.readdirSync(DIR)
	.map((name) => ({ name, size: fs.statSync(path.join(DIR, name)).size }))
	.sort((a, b) => b.size - a.size);

const over = files.filter((f) => f.size > LIMIT);
const total = files.reduce((n, f) => n + f.size, 0);
const kb = (n) => `${(n / 1024).toFixed(0)}KB`;

console.log(`${files.length} 个产物，合计 ${kb(total)}，最大 ${kb(files[0]?.size ?? 0)}`);
for (const f of files.slice(0, 6)) console.log(`  ${kb(f.size).padStart(7)}  ${f.name}`);

if (over.length) {
	console.error(`\n✗ 有 ${over.length} 个文件超过 500KB：`);
	for (const f of over) console.error(`  ${kb(f.size)}  ${f.name}`);
	console.error('  在 demo/vite.config.ts 的 codeSplitting.groups 里，把对应的组再拆一组。');
	process.exit(1);
}

console.log('✓ 所有产物均 ≤ 500KB');

// 一次跑完全部校验：文档一致性、颜色精度、CodePreview 结构、可复制片段可编译。
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = [
  ['README 与代码一致性', 'verify-readme.mjs'],
  ['README 代码块可编译', 'verify-readme-snippets.mjs'],
  ['主题色精度与零回归', 'verify-theme-colors.mjs'],
  ['CodePreview 结构约定', 'verify-codepreview.mjs'],
  ['可复制片段独立编译', 'verify-snippets-compile.mjs'],
];

let failed = 0;
for (const [label, file] of SCRIPTS) {
  const r = spawnSync(process.execPath, [join(HERE, file)], { encoding: 'utf8' });
  const tail = (r.stdout || '').trim().split('\n').filter(Boolean).slice(-1)[0] || '';
  const ok = r.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(24)} ${tail}`);
  if (!ok && r.stderr) console.log('      ' + r.stderr.trim().split('\n')[0]);
}
console.log(`\n${failed ? failed + ' 项失败' : '全部 ' + SCRIPTS.length + ' 项通过'}`);
process.exit(failed ? 1 : 0);

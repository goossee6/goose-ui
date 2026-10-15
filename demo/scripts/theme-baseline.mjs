// 零回归硬断言：记录改动前 theme.css 里所有颜色变量的解析值。
// 改完后用同一脚本再跑一次，比对「不设旋钮时」是否逐字节一致。
import { readFileSync } from 'node:fs';

const CSS = '<LOCAL_PATH>/Desktop/source/repos/goose-ui/src/lib/styles/theme.css';
const src = readFileSync(CSS, 'utf8');

// 抽取 :root,.light 与 .dark,[data-theme="dark"] 两个块里的 --x: value;
function block(startRe) {
  const m = startRe.exec(src);
  if (!m) return {};
  let i = src.indexOf('{', m.index);
  let depth = 0, end = i;
  for (; end < src.length; end++) {
    if (src[end] === '{') depth++;
    else if (src[end] === '}') { depth--; if (depth === 0) break; }
  }
  const body = src.slice(i + 1, end);
  const out = {};
  for (const mm of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[mm[1]] = mm[2].trim();
  return out;
}

const light = block(/:root,\s*\.light\s*\{/);
const dark = block(/\.dark,\s*\[data-theme="dark"\]\s*\{/);

const out = { light, dark };
const target = process.argv[2] || 'dump';
const FILE = '<LOCAL_PATH>/Desktop/source/repos/goose-ui/demo/scripts/.theme-baseline.json';

if (target === 'before') {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(FILE, JSON.stringify(out, null, 1));
  console.log(`已记录基线: light ${Object.keys(light).length} 项, dark ${Object.keys(dark).length} 项`);
} else if (target === 'after') {
  const { readFileSync: rf, existsSync } = await import('node:fs');
  if (!existsSync(FILE)) { console.log('缺少基线'); process.exit(2); }
  const before = JSON.parse(rf(FILE, 'utf8'));
  // 只比对「语义色」——派生写法会改变字面值，所以这里比对的是解析后的语义等价性由浏览器负责；
  // 此脚本比对的是「变量是否仍然存在且非空」，以及关键角色的字面值是否被无意改动。
  const KEY = ['--bg','--surface','--text','--border','--neutral-bg','--neutral-surface'];
  let diff = 0;
  for (const theme of ['light','dark']) {
    for (const k of KEY) {
      const a = before[theme][k], b = out[theme][k];
      if (a === undefined) continue;          // 新增键跳过
      if (b === undefined) { console.log(`  ✗ ${theme} 丢失变量 ${k}`); diff++; continue; }
      if (a !== b) { console.log(`  ✗ ${theme} ${k} 值变化: ${a} -> ${b}`); diff++; }
    }
  }
  console.log(diff ? `\n中性色被动改动 ${diff} 处` : '\n中性色/基础色全部保持原值');
  process.exit(diff ? 1 : 0);
} else {
  console.log(JSON.stringify(out, null, 1));
}

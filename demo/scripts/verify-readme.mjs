// README 与代码一致性核对：抽取 README 里出现的 API 名与 CSS 变量，逐个到源码里验证存在。
import { readFileSync } from 'node:fs';

const ROOT = '<LOCAL_PATH>/Desktop/source/repos/goose-ui/';
const readme = readFileSync(ROOT + 'README.md', 'utf8');
const barrel = readFileSync(ROOT + 'src/lib/index.ts', 'utf8');
const theme = readFileSync(ROOT + 'src/lib/styles/theme.css', 'utf8');
const store = readFileSync(ROOT + 'src/lib/components/themeStore.svelte.ts', 'utf8');

let bad = 0;
const check = (label, ok, extra = '') => {
  if (!ok) bad++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`);
};

// 1) README 提到的主题色 API 是否真的导出
console.log('=== 主题色 API 导出 ===');
for (const n of ['setHue', 'setHues', 'resetHues', 'getHues', 'hueStore', 'DEFAULT_HUES', 'HUE_ROLES', 'initHues']) {
  const inBarrel = new RegExp(`\\b${n}\\b`).test(barrel);
  const inStore = new RegExp(`export (function|const)\\s+${n}\\b`).test(store);
  check(`${n} 已导出`, inBarrel && inStore, inBarrel ? '' : '(barrel 缺)');
}

// 2) README 里代码块提到的 CSS 变量是否真的定义在 theme.css
console.log('\n=== README 提及的 CSS 变量 ===');
const mentioned = new Set([
  ...[...readme.matchAll(/--(hue-[\w-]+|accent[\w-]*|complement[\w-]*|neutral-[\w-]+|danger|success|warning|info|primary[\w-]*|bg|surface[\w-]*|text|border)\b/g)].map((m) => '--' + m[1]),
]);
for (const v of [...mentioned].sort()) {
  const defined = new RegExp(`${v}\\s*:`).test(theme);
  if (v.startsWith('--tv-')) continue; // 转场用的临时变量
  check(`${v} 已定义`, defined);
}

// 3) hue 角色是否与代码一致
console.log('\n=== 色相角色 ===');
for (const r of ['accent', 'complement', 'danger', 'success', 'warning', 'info']) {
  check(`--hue-${r} 存在`, new RegExp(`--hue-${r}\\s*:`).test(theme));
}

// 4) README 是否已不再宣传旧的错误值
console.log('\n=== 过时内容检查 ===');
check('不再出现 --primary: #6366f1（旧文档错误值）', !/--primary:\s*#6366f1/.test(readme));

console.log(`\n共 ${bad} 处不一致`);
process.exit(bad ? 1 : 0);

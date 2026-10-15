// CodePreview 迁移校验器（静态）：
// 1) 每个 code={xxx} 引用的常量是否在 <script> 里定义
// 2) 常量是否以 Source 结尾、同文件是否重名
// 3) 模板字符串内 </script> 是否误写成真正的结束标签（未转义）
// 4) Card / CodePreview 的 import 是否存在且被用到
// 5) Props 卡是否被误改成 CodePreview
// 用法：在 demo/ 下执行  node scripts/verify-codepreview.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DIR = join(SCRIPT_DIR, '..', 'src/lib/demos');
let problems = 0;
const files = readdirSync(DIR).filter((f) => f.endsWith('.svelte')).sort();

for (const f of files) {
  const t = readFileSync(join(DIR, f), 'utf8');
  const errs = [];

  // 1) 只看 <CodePreview ... code={xxx}> 的引用（CodeBlock 有自己的旧常量，不在校验范围）
  const cpTags = [...t.matchAll(/<CodePreview[\s\S]*?>/g)].map((m) => m[0]);
  const refs = cpTags.flatMap((tag) => [...tag.matchAll(/code=\{(\w+)\}/g)].map((m) => m[1]));
  const defined = new Set([...t.matchAll(/const\s+(\w+)\s*=/g)].map((m) => m[1]));
  for (const r of new Set(refs)) {
    if (!defined.has(r)) errs.push(`code={${r}} 未定义`);
    else if (!/Source$/.test(r)) errs.push(`常量 ${r} 未以 Source 结尾（被 CodePreview 引用）`);
  }
  // 重复定义（同名 let/const 在模块作用域重复才是真问题；函数内局部变量另计，这里只报模块级）
  const topLevel = [...t.matchAll(/^(?:const|let|var)\s+(\w+)\s*=/gm)].map((m) => m[1]);
  const dupTop = topLevel.filter((n, i) => topLevel.indexOf(n) !== i);
  if (dupTop.length) errs.push(`模块级重复定义: ${[...new Set(dupTop)].join(',')}`);

  // 2) 未转义的 </script>（模板字符串里必须写成 <\/script>）
  const ticks = [...t.matchAll(/`/g)];
  if (ticks.length % 2 !== 0) errs.push('反引号数量为奇数（模板字符串未闭合）');
  const realScriptEnd = (t.match(/<\/script>/g) || []).length;
  // 一个 .svelte 文件正常只有 1 个真实的 </script>；多出来的必然出现在模板字符串里
  if (realScriptEnd > 1) {
    errs.push(`出现 ${realScriptEnd} 个真实 </script>（模板字符串内未转义，应写 <\\/script>）`);
  }

  // 3) import 一致性
  const hasCP = /<CodePreview/.test(t);
  const impCP = /import\s+CodePreview\s+from/.test(t);
  if (hasCP && !impCP) errs.push('用了 <CodePreview> 但没 import');
  if (impCP && !hasCP) errs.push('import 了 CodePreview 但没用');
  const hasCard = /<Card[\s>]/.test(t);
  const impCard = /\bCard\b/.test((t.match(/import\s*\{([^}]+)\}\s*from\s*["']goose-ui["']/) || [, ''])[1]);
  if (hasCard && !impCard) errs.push('用了 <Card> 但 goose-ui import 里没有 Card');
  if (impCard && !hasCard) errs.push('import 了 Card 但没用');

  // 4) Props 卡误改（用标题判定，且排除「用法卡名字里恰好含参数字样」的情况）
  const bad = [...t.matchAll(/<CodePreview\s+title="([^"]*)"/g)].map((m) => m[1])
    .filter((ti) => /\bProps\b|参数$|^参数|API$/i.test(ti));
  if (bad.length) errs.push(`疑似 Props 卡被改成 CodePreview: ${bad.join(' | ')}`);

  // 5) 硬规则：Props 列表不需要预览，凡 CodePreview 内部出现 PropsTable 即为错误
  //    （约定：Props/参数/API 表一律用普通 <Card>，不做 效果/源码 切换）
  const cpBlocks = [...t.matchAll(/<CodePreview([^>]*)>([\s\S]*?)<\/CodePreview>/g)];
  for (const b of cpBlocks) {
    if (/<PropsTable/.test(b[2])) {
      const ti = (/title="([^"]*)"/.exec(b[1]) || [, ''])[1];
      errs.push(`CodePreview 内含 PropsTable（应改用 <Card>）: title="${ti}"`);
    }
  }

  if (errs.length) {
    console.log(`  ✗ ${f}`);
    errs.forEach((e) => console.log(`      ${e}`));
    problems += errs.length;
  }
}
console.log(`\n扫描 ${files.length} 个文件，问题 ${problems} 处`);
process.exit(problems ? 1 : 0);

// 把每个 <CodePreview code={xxx}> 引用的源码字符串抽出来，当作独立 .svelte 编译。
// 这直接验证「复制即用」：粘到别人项目里语法必须成立。
// 用法：在 demo/ 下执行  node scripts/verify-snippets-compile.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// 脚本位于 demo/scripts/，据此定位 demos 目录
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEMO = join(SCRIPT_DIR, '..');
const DIR = join(DEMO, 'src/lib/demos');
// 直接用 demo 自己依赖的 svelte 编译器，避免写死版本号
const { compile } = await import('svelte/compiler');

// 从宿主文件里取出「常量名 -> 模板字符串内容」
function extractConstants(text) {
  const out = new Map();
  // const name = `...`;   （非贪婪到下一个行首反引号+分号或换行后 const）
  const re = /const\s+(\w+)\s*=\s*`([\s\S]*?)`\s*;/g;
  let m;
  while ((m = re.exec(text))) out.set(m[1], m[2]);
  return out;
}

let total = 0, ok = 0, skipped = 0;
const fails = [];
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.svelte')).sort()) {
  const text = readFileSync(join(DIR, f), 'utf8');
  const consts = extractConstants(text);
  const cpTags = [...text.matchAll(/<CodePreview[\s\S]*?>/g)].map((m) => m[0]);
  const refs = [...new Set(cpTags.flatMap((t) => [...t.matchAll(/code=\{(\w+)\}/g)].map((m) => m[1])))];

  for (const r of refs) {
    const src = consts.get(r);
    if (src === undefined) { fails.push(`${f} :: ${r} 取不到字符串`); continue; }
    // 反引号内 \` 与 \${ 需要还原成真实字符再编译
    const code = src.replace(/\\`/g, '`').replace(/\\\$\{/g, '${').replace(/<\\\/script>/g, '</script>');
    // 只校验 Svelte 片段：CSS / TS 等非组件片段（如主题色配置）按语言自行校验，跳过
    const isSvelte = /<script|<[A-Za-z][\w-]*[\s>/]/.test(code);
    if (!isSvelte) { skipped++; continue; }
    total++;
    try {
      const res = compile(code, { filename: `${r}.svelte`, generate: false });
      const errs = res.warnings.filter((w) => w.code && /a11y_|node_invalid/.test(w.code));
      if (errs.length) {
        fails.push(`${f} :: ${r} 编译有警告: ${errs.map((e) => e.code).join(',')}`);
      } else ok++;
    } catch (e) {
      fails.push(`${f} :: ${r} 编译失败: ${String(e.message).split('\n')[0].slice(0, 120)}`);
    }
  }
}
console.log(`Svelte 片段: ${total} 个，独立编译通过 ${ok} 个${skipped ? `（另跳过 ${skipped} 个非 Svelte 片段）` : ''}`);
if (fails.length) {
  console.log('\n失败明细:');
  fails.slice(0, 30).forEach((x) => console.log('  ✗ ' + x));
  if (fails.length > 30) console.log(`  ...另有 ${fails.length - 30} 条`);
}
process.exit(fails.length ? 1 : 0);

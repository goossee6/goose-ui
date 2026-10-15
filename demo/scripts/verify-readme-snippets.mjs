// 抽取 README 里所有 svelte 代码块，逐个当独立组件编译。
// 目的：文档里的示例必须真能跑，而不是「看起来对」。
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const ROOT = '<LOCAL_PATH>/Desktop/source/repos/goose-ui/';
const { compile } = await import('svelte/compiler');
const md = readFileSync(ROOT + 'README.md', 'utf8');

// 抓 ```svelte ... ``` 代码块
const blocks = [...md.matchAll(/```svelte\n([\s\S]*?)```/g)].map((m) => m[1]);
console.log(`README 中的 svelte 代码块: ${blocks.length} 个\n`);

let bad = 0;
blocks.forEach((code, i) => {
  const line = md.slice(0, md.indexOf(code)).split('\n').length;
  const preview = code.trim().split('\n')[0].slice(0, 60);
  try {
    const res = compile(code, { filename: `readme-block-${i}.svelte`, generate: false });
    const errs = res.warnings.filter((w) => w.code && /a11y_|node_invalid/.test(w.code));
    if (errs.length) {
      bad++;
      console.log(`  ✗ 块#${i} (行 ${line}) 有警告: ${errs.map((e) => e.code).join(',')}\n     ${preview}`);
    } else {
      console.log(`  PASS 块#${i} (行 ${line})  ${preview}`);
    }
  } catch (e) {
    bad++;
    console.log(`  ✗ 块#${i} (行 ${line}) 编译失败: ${String(e.message).split('\n')[0].slice(0, 140)}`);
    console.log(`     ${preview}`);
  }
});
console.log(`\n${bad ? bad + ' 个代码块有问题' : '全部 svelte 代码块编译通过'}`);
process.exit(bad ? 1 : 0);

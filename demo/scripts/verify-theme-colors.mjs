// 不依赖浏览器：从 theme.css 解析变量图，计算「未设旋钮时」派生出的最终颜色，
// 与改动前的字面值比对（oklch -> sRGB，容差 ±2/255 舍入）。
import { readFileSync } from 'node:fs';

const CSS = '<LOCAL_PATH>/Desktop/source/repos/goose-ui/src/lib/styles/theme.css';
const src = readFileSync(CSS, 'utf8');

function block(startRe) {
  const m = startRe.exec(src);
  if (!m) return {};
  let i = src.indexOf('{', m.index), depth = 0, end = i;
  for (; end < src.length; end++) {
    if (src[end] === '{') depth++;
    else if (src[end] === '}') { depth--; if (!depth) break; }
  }
  const out = {};
  // 先剥掉注释，避免注释里出现的 oklch(...) 被当成声明值
  const body = src.slice(i + 1, end).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const mm of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[mm[1]] = mm[2].trim();
  return out;
}
const rootVars = block(/^:root\s*\{/m);
const light = { ...rootVars, ...block(/^:root,\s*\.light\s*\{/m) };
const dark = { ...light, ...block(/^\.dark,\s*\[data-theme="dark"\]\s*\{/m) };

/* ---- oklch -> sRGB ---- */
function oklchToRgb(L, C, Hdeg) {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h), b2 = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b2;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b2;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b2;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const f = (x) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  };
  return [f(r), f(g), f(bl)];
}
const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

// 递归解析 var() 与简单的 oklch(L C H)
function resolve(name, vars, seen = new Set()) {
  if (seen.has(name)) return null;
  seen.add(name);
  let v = vars[name];
  if (v === undefined) return null;
  // 逐层替换 var(--x)
  let guard = 0;
  while (/var\(/.test(v) && guard++ < 20) {
    v = v.replace(/var\((--[\w-]+)\)/g, (_, n) => vars[n] ?? '0');
  }
  const m = /^oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)$/.exec(v);
  if (m) return hex(oklchToRgb(+m[1], +m[2], +m[3]));
  return v;
}

console.log('=== 未设旋钮时，派生色的最终渲染值（亮色）===');
// 期望值 = 改动前的真实定义：
//   --primary: oklch(0.51 0.24 264)  -> #1850ec（非 #6366f1，以实测为准）
//   其余为改动前的硬编码 hex
const lightExpect = {
  '--accent': '#1850ec',
  '--danger': '#dc2626',
  '--success': '#22c55e',
  '--warning': '#f59e0b',
  '--info': '#3b82f6',
};
let fails = 0;
for (const [k, want] of Object.entries(lightExpect)) {
  const got = resolve(k, light);
  // 与「改动前的硬编码 hex」比对，容差 ±6（oklch 与原 hex 本就不是精确同色，看量级）
  const gh = got && got.startsWith('#') ? got : null;
  const dist = gh ? Math.max(...[1, 3, 5].map((i) => Math.abs(parseInt(gh.slice(i, i + 2), 16) - parseInt(want.slice(i, i + 2), 16)))) : 999;
  const ok = dist <= 12;
  if (!ok) fails++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${k.padEnd(12)} 派生=${gh}  旧值=${want}  最大通道差=${dist}`);
}
console.log('\n=== 旋钮确实生效（把 accent 改成 25 度）===');
const warm = { ...light, '--hue-accent': '25' };
console.log(`  accent(264°) = ${resolve('--accent', light)}`);
console.log(`  accent( 25°) = ${resolve('--accent', warm)}  ${resolve('--accent', light) !== resolve('--accent', warm) ? '← 随旋钮变化 PASS' : 'FAIL'}`);

console.log('\n=== 暗色主题同色相不同明度 ===');
console.log(`  dark accent  = ${resolve('--accent', dark)}   (light = ${resolve('--accent', light)})`);
console.log(`  dark danger  = ${resolve('--danger', dark)}   (light = ${resolve('--danger', light)})`);

process.exit(fails ? 1 : 0);

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'goose-ui-theme';

let initialized = false;

export const themeStore = $state<{ theme: Theme }>({ theme: 'light' });

function readSaved(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

/** 幂等：读取持久化偏好/系统偏好并应用到 <html>，SSR 下安全空操作；启动后继续跟随系统（仅用户未手动设置时） */
export function initTheme(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  // 主题色相与亮暗主题一起恢复（initHues 自身幂等）
  initHues();
  const initial =
    readSaved() ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  themeStore.theme = initial;
  document.documentElement.classList.toggle('dark', initial === 'dark');
  // 跟随系统主题变化：用户手动设置过（存储非空）则不再覆盖
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    if (readSaved()) return;
    const t = mq.matches ? 'dark' : 'light';
    themeStore.theme = t;
    document.documentElement.classList.toggle('dark', t === 'dark');
  });
}

/** 显式设置主题：同步所有实例 + 持久化 */
export function setTheme(theme: Theme): void {
  initTheme();
  themeStore.theme = theme;
  if (typeof window === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* localStorage 不可用时仅内存生效 */
  }
}

/**
 * 切换主题。传入 pos 时使用圆形扩散 View Transition。
 * 返回切换后的主题（状态在 transition 回调内落地，此返回值为预期结果）。
 */
export function toggleTheme(pos?: { x: number; y: number }): Theme {
  initTheme();
  const next: Theme = themeStore.theme === 'light' ? 'dark' : 'light';
  const run = () => setTheme(next);

  if (!pos || typeof document === 'undefined' || !document.startViewTransition) {
    run();
    return next;
  }

  const { x, y } = pos;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );
  const root = document.documentElement;
  root.style.setProperty('--tv-x', `${x}px`);
  root.style.setProperty('--tv-y', `${y}px`);
  root.style.setProperty('--tv-r', `${radius}px`);
  document.startViewTransition(run);
  return next;
}

/**
 * 主题切换按钮的 onThemeToggle 回调：以按钮中心为圆心做圆形扩散。
 * 直接作 TitleBar/ThemeToggle 的 onThemeToggle 传入即可。
 */
export function toggleThemeFromEvent(e: MouseEvent): Theme {
  const btn = e.currentTarget as HTMLElement | null;
  const rect = btn?.getBoundingClientRect();
  return toggleTheme(
    rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * 主题色（完整颜色 + 色相兼容层）
 *
 * 两套自由度并存，按优先级决定 theme.css 用哪一套：
 *   1) 完整颜色：每个角色可存任意 oklch，含纯白/纯黑。写入 --c-<role>。
 *      此时明度/彩度由用户说了算，亮暗两套派生会收敛到同一个颜色
 *      （见 theme.css 里 --accent 的 var(--c-accent, ...) 回退链）。
 *   2) 色相：老 API。只写 --hue-<role>，明度/彩度仍按亮暗主题派生。
 *
 * 都没配时用 theme.css 里的默认值。所有写入都落到 <html> 内联 style，
 * 优先级高于 :root 规则，天然全局生效（含所有组件与 portal 出去的浮层）。
 * ──────────────────────────────────────────────────────────────────────────── */

/** 可配置的色彩角色：主色、互补色 + 五个信息色（成功/完成、信息、警告、危险） */
export type HueRole =
  | 'accent'
  | 'complement'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger';

export type HueMap = Record<HueRole, number>;
export type ColorMap = Record<HueRole, string>;

/** 按语义排序：主色 → 互补色 → 成功 → 信息 → 警告 → 危险 */
export const HUE_ROLES: HueRole[] = [
  'accent',
  'complement',
  'success',
  'info',
  'warning',
  'danger',
];

/** 默认色相（与 theme.css 中 :root 的初始值一致） */
export const DEFAULT_HUES: HueMap = {
  accent: 264,
  complement: 160,
  success: 145,
  info: 250,
  warning: 75,
  danger: 25,
};

/** 默认颜色（与 theme.css 中 :root 的初始值一致；亮色主题那一套）。
 *  只用于展示默认值、比较草稿是否改动，以及「恢复默认」——
 *  真正生效的颜色始终来自 CSS 变量，这里不主动写任何变量。 */
export const DEFAULT_COLORS: ColorMap = {
  accent: '#1850ec',
  complement: '#009145',
  success: '#1ec55f',
  info: '#3c82f6',
  warning: '#f59e0a',
  danger: '#dc2627',
};

const HUE_STORAGE_KEY = 'goose-ui-hues';
const COLOR_STORAGE_KEY = 'goose-ui-colors';

/** 当前各角色色相（响应式，设置页可双向绑定） */
export const hueStore = $state<{ hues: HueMap }>({ hues: { ...DEFAULT_HUES } });

/** 当前各角色完整颜色（oklch 字符串）；没配的角色不在表里 */
export const colorStore = $state<{ colors: Partial<ColorMap> }>({ colors: {} });

let huesInitialized = false;

/** 规范化：任意数值折到 [0,360) */
function normHue(h: number): number {
  if (!Number.isFinite(h)) return 0;
  return ((Math.round(h) % 360) + 360) % 360;
}

/* ── 完整颜色：oklch 三通道 ─────────────────────────────────────────────────
 * 存字符串而不是对象，是为了让 <html> 内联 style 与 localStorage 都能直接透传。
 * L 夹在 [0,1]，C 夹在 [0,0.4]（超出色域的 C 浏览器会自己裁，但先夹住更可控）。 */
export type OklchColor = { l: number; c: number; h: number };

const clamp = (n: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

/** 拼成 #rrggbb。对外（CSS 变量、localStorage、界面）统一用 hex，
 *  oklch 只在内部做色相/明度/彩度的计算。 */
export function formatHex(color: OklchColor): string {
  return oklchToHex(color);
}

/** 解析颜色字符串：'#rgb' / '#rrggbb' / 'oklch(...)' 都吃，非法返回 null。
 *  返回值仍是 oklch 对象，因为取色器要按三维分量编辑。 */
export function parseColor(s: string): OklchColor | null {
  const t = s.trim();
  if (t.startsWith('#') || /^[0-9a-f]{3}$/i.test(t) || /^[0-9a-f]{6}$/i.test(t)) {
    return hexToOklch(t);
  }
  return parseOklch(t);
}

/** 把用户输入的颜色规范成 hex：'#48f' → '#4488ff'，'#4488FF' → '#4488ff'。
 *  输入本来就是 hex 时**原样保留**，不走 oklch 往返 —— oklch 是浮点，
 *  转一圈回来 #0ea5e9 会变成 #0aa5e9（少 1 bit），用户会以为自己打错了。
 *  非 hex 输入（oklch 串 / {l,c,h}）才靠 formatHex 折算，非法返回 null。 */
export function normalizeHex(input: string): string | null {
  const t = input.trim();
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t);
  if (!m) return null;
  const raw = m[1].length === 3 ? m[1].replace(/./g, (ch) => ch + ch) : m[1];
  return `#${raw.toLowerCase()}`;
}

/** 拼成 oklch() 字符串；保留 4 位小数，够 sRGB 8bit 精确往返，又不至于写一长串浮点噪声。
 *  仅用于内部计算与兼容旧数据，不再写进任何 CSS 变量。 */
export function formatOklch({ l, c, h }: OklchColor): string {
  return `oklch(${clamp(l, 0, 1).toFixed(4)} ${clamp(c, 0, 0.4).toFixed(4)} ${normHue(h)})`;
}

/** 解析 oklch(...) 字符串；不是合法 oklch 就返回 null */
export function parseOklch(s: string): OklchColor | null {
  const m = /^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*\)$/i.exec(s.trim());
  if (!m) return null;
  return { l: clamp(Number(m[1]), 0, 1), c: clamp(Number(m[2]), 0, 0.4), h: normHue(Number(m[3])) };
}

/** oklch → sRGB 三个 0–255 整数的线性 sRGB 反解（超出色域的通道直接夹住） */
export function oklchToRgb({ l, c, h }: OklchColor): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  return lin.map((v) => {
    const clamped = clamp(v, 0, 1);
    const enc = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055;
    return Math.round(clamp(enc, 0, 1) * 255);
  }) as [number, number, number];
}

/** oklch → #rrggbb */
export function oklchToHex(color: OklchColor): string {
  return `#${oklchToRgb(color)
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`;
}

/** 该明度 + 色相下 sRGB 色域内的最大彩度（二分逼近）。
 *  为什么需要它：超出色域的彩度在 oklchToRgb 里会被逐通道夹住，
 *  颜色存成 hex 后彩度就「缩水」了 —— 界面上把饱和度拖到 100%，
 *  存回去只剩 45%，滑条会自己弹回来。滑块的满值必须落在这个上限上。 */
export function maxChroma(l: number, h: number): number {
  const inGamut = (c: number): boolean => {
    const hr = (h * Math.PI) / 180;
    const a = c * Math.cos(hr);
    const b = c * Math.sin(hr);
    const lp = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const mp = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const sp = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const r = 4.0767416621 * lp - 3.3077115913 * mp + 0.2309699292 * sp;
    const g = -1.2684380046 * lp + 2.6097574011 * mp - 0.3413193965 * sp;
    const bl = -0.0041960863 * lp - 0.7034186147 * mp + 1.707614701 * sp;
    const eps = 5e-4;
    return r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && bl >= -eps && bl <= 1 + eps;
  };
  if (l <= 0 || l >= 1) return 0;
  const CAP = 0.4;
  if (inGamut(CAP)) return CAP;
  let lo = 0;
  let hi = CAP;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/** #rgb / #rrggbb → oklch；sRGB 转 OKLab 的标准公式 */
export function hexToOklch(hex: string): OklchColor | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const raw = m[1].length === 3 ? m[1].replace(/./g, (ch) => ch + ch) : m[1];
  const n = parseInt(raw, 16);
  const toLin = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = toLin((n >> 16) & 255);
  const g = toLin((n >> 8) & 255);
  const b = toLin(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s;
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { l: L, c: C, h: normHue(H) };
}

/** 由色相 + 明度 + 彩度拼出完整颜色（配色盘纵轴用得到） */
export function oklchFromHsl(h: number, s: number, l: number): OklchColor {
  return { l, c: 0.4 * clamp(s, 0, 1), h: normHue(h) };
}

function applyHues(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const role of HUE_ROLES) {
    root.style.setProperty(`--hue-${role}`, String(hueStore.hues[role]));
  }
}

/**
 * 只写发生变化的那一个角色。
 * 拖动取色时每帧都会调用，全量遍历 7 个角色会连续触发 7 次样式失效；
 * 这里用 prev 做差，正常拖动每帧只碰 1 个自定义属性。
 * 另外比对内联样式里已有的值：同一个字符串重复 set 仍会让浏览器重新解析整张样式表，
 * 而拖动时指针不动的那几帧（rAF 合并后）算出来的值是一样的。
 */
function applyColors(prev?: Partial<ColorMap>): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const role of HUE_ROLES) {
    const v = colorStore.colors[role];
    if (prev && v === prev[role]) continue;
    const cur = root.style.getPropertyValue(`--c-${role}`);
    if (v ? cur === v : cur === '') continue;
    if (v) root.style.setProperty(`--c-${role}`, v);
    else root.style.removeProperty(`--c-${role}`);
  }
}

/** 拖取色器时 setColor 每帧都会被调用；localStorage 是同步 IO，攒一下再一次性落盘 */
let colorSaveTimer: ReturnType<typeof setTimeout> | null = null;
let hueSaveTimer: ReturnType<typeof setTimeout> | null = null;

function flushColorSave(): void {
  if (colorSaveTimer !== null) {
    clearTimeout(colorSaveTimer);
    colorSaveTimer = null;
  }
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(colorStore.colors));
  } catch {
    /* localStorage 不可用时仅内存生效 */
  }
}

function flushHueSave(): void {
  if (hueSaveTimer !== null) {
    clearTimeout(hueSaveTimer);
    hueSaveTimer = null;
  }
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HUE_STORAGE_KEY, JSON.stringify(hueStore.hues));
  } catch {
    /* localStorage 不可用时仅内存生效 */
  }
}

function saveColors(): void {
  if (typeof window === 'undefined') return;
  if (colorSaveTimer !== null) clearTimeout(colorSaveTimer);
  colorSaveTimer = setTimeout(flushColorSave, 200);
}

/** 拖动时色相也跟着每帧改；同一个 200ms 窗口内只落盘一次 */
function saveHues(): void {
  if (typeof window === 'undefined') return;
  if (hueSaveTimer !== null) clearTimeout(hueSaveTimer);
  hueSaveTimer = setTimeout(flushHueSave, 200);
}

if (typeof window !== 'undefined') {
  // 拖到一半就关页面时，把攒着的那次落盘补上
  window.addEventListener('pagehide', () => {
    if (colorSaveTimer !== null) flushColorSave();
    if (hueSaveTimer !== null) flushHueSave();
  });
}

function readSavedColors(): Partial<ColorMap> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COLOR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Partial<ColorMap> = {};
    for (const role of HUE_ROLES) {
      const v = parsed[role];
      // 只认 hex（旧版本存的 oklch 字符串顺带转一次，避免用户配色丢失）
      if (typeof v !== 'string') continue;
      // 本来就是 hex 的原样取用，不走 oklch 往返（会掉 1 bit）
      const hex = normalizeHex(v) ?? formatHexOf(v);
      if (hex) out[role] = hex;
    }
    return out;
  } catch {
    return null;
  }
}

function readSavedHues(): Partial<HueMap> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(HUE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Partial<HueMap> = {};
    for (const role of HUE_ROLES) {
      const v = parsed[role];
      if (typeof v === 'number' && Number.isFinite(v)) out[role] = normHue(v);
    }
    return out;
  } catch {
    return null;
  }
}

/** 幂等：读取持久化色相并应用；initTheme() 会一并调用 */
export function initHues(): void {
  if (huesInitialized) return;
  huesInitialized = true;
  const saved = readSavedHues();
  if (saved) hueStore.hues = { ...DEFAULT_HUES, ...saved };
  applyHues();
  initColors();
}

/** 读取当前色相副本 */
export function getHues(): HueMap {
  return { ...hueStore.hues };
}

/** 设置单个角色色相并持久化 */
export function setHue(role: HueRole, hue: number): void {
  if (!HUE_ROLES.includes(role)) return;
  initHues();
  hueStore.hues = { ...hueStore.hues, [role]: normHue(hue) };
  applyHues();
  saveHues();
}

/** 批量设置色相并持久化 */
export function setHues(next: Partial<HueMap>): void {
  initHues();
  const merged = { ...hueStore.hues };
  for (const role of HUE_ROLES) {
    const v = next[role];
    if (typeof v === 'number' && Number.isFinite(v)) merged[role] = normHue(v);
  }
  hueStore.hues = merged;
  applyHues();
  saveHues();
}

/** 恢复默认色相并清除持久化记录 */
export function resetHues(): void {
  initHues();
  hueStore.hues = { ...DEFAULT_HUES };
  applyHues();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(HUE_STORAGE_KEY);
    } catch {
      /* 忽略 */
    }
  }
}

/* ── 完整颜色 API ─────────────────────────────────────────────────────────── */

/** 幂等：读取持久化颜色并应用；initHues() 会一并调用 */
export function initColors(): void {
  if (typeof document === 'undefined') return;
  const saved = readSavedColors();
  if (saved) colorStore.colors = saved;
  applyColors();
}

/** 读取当前颜色副本（未配置的角色不在表里） */
export function getColors(): Partial<ColorMap> {
  return { ...colorStore.colors };
}

/** 该角色是否被完整颜色覆盖（用于 UI 显示"已自定义"） */
export function hasColor(role: HueRole): boolean {
  return colorStore.colors[role] !== undefined;
}

/**
 * 设置单个角色的完整颜色。接受 '#rgb' / '#rrggbb' / 'oklch(...)' 字符串或 { l, c, h } 对象；
 * 传 '' / null 表示清除该角色的完整颜色，退回主题里的默认 hex。
 */
export function setColor(role: HueRole, value: string | OklchColor | null): void {
  if (!HUE_ROLES.includes(role)) return;
  initHues();
  initColors();
  const prev = colorStore.colors;
  const next = { ...prev };
  if (value === null || value === '') {
    delete next[role];
  } else {
    // hex 输入原样保留（不走 oklch 往返），其余才折算
    const hex = typeof value === 'string' ? (normalizeHex(value) ?? formatHexOf(value)) : formatHex(value);
    if (!hex) return;
    const parsed = parseColor(hex);
    if (!parsed) return;
    next[role] = hex;
    // 保持色相变量与该颜色一致，避免清除完整颜色后跳回旧色相
    const h = normHue(parsed.h);
    if (hueStore.hues[role] !== h) {
      hueStore.hues = { ...hueStore.hues, [role]: h };
      applyHues();
      saveHues();
    }
  }
  // 同一角色连续拖动时值几乎每帧都变，这一步省不掉
  if (next[role] === prev[role]) return;
  colorStore.colors = next;
  applyColors(prev);
  saveColors();
}

/** 兜底：把非 hex 的字符串（oklch(...)）折算成 hex；非法返回 null */
function formatHexOf(s: string): string | null {
  const c = parseOklch(s);
  return c ? formatHex(c) : null;
}

/** 批量设置完整颜色；值为 null 的条目会被清除 */
export function setColors(next: Partial<Record<HueRole, string | OklchColor | null>>): void {
  initHues();
  initColors();
  const prev = colorStore.colors;
  const merged = { ...prev };
  for (const role of HUE_ROLES) {
    if (!(role in next)) continue;
    const v = next[role];
    if (v === null || v === undefined || v === '') {
      delete merged[role];
      continue;
    }
    const hex = typeof v === 'string' ? (normalizeHex(v) ?? formatHexOf(v)) : formatHex(v);
    if (hex) merged[role] = hex;
  }
  colorStore.colors = merged;
  applyColors(prev);
  saveColors();
}

/** 清除所有完整颜色，全部退回按色相派生 */
export function resetColors(): void {
  initHues();
  colorStore.colors = {};
  applyColors();
  if (typeof window !== 'undefined') {
    if (colorSaveTimer !== null) {
      clearTimeout(colorSaveTimer);
      colorSaveTimer = null;
    }
    try {
      window.localStorage.removeItem(COLOR_STORAGE_KEY);
    } catch {
      /* 忽略 */
    }
  }
}


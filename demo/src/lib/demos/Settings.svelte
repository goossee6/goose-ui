<script lang="ts">
  import { Card, Page, Separator, Button, Notification, Row, CodeBlock, Tooltip, copyToClipboard, themeStore } from "goose-ui";
  import { HUE_ROLES, colorStore, setColor, parseColor, formatHex, normalizeHex, maxChroma, setColors, DEFAULT_COLORS, type HueRole, type OklchColor } from "goose-ui";
  import { tick } from "svelte";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  /** 角色元信息：中文名 + 用途 + 推荐色相区间。
      顺序即界面顺序：主色、互补色，然后是五个信息色（完成、信息、警告、危险）。 */
  const ROLE_META: Record<HueRole, { label: string; desc: string; safe: [number, number] }> = {
    accent: { label: "主色", desc: "激活项、主按钮、焦点环", safe: [200, 300] },
    complement: { label: "互补色", desc: "强调位/对比位、进度渐变终点", safe: [120, 200] },
    success: { label: "完成", desc: "成功、通过、已保存", safe: [120, 170] },
    info: { label: "信息", desc: "提示、中性通知、说明", safe: [220, 270] },
    warning: { label: "警告", desc: "注意、风险、待处理", safe: [60, 95] },
    danger: { label: "危险", desc: "删除、错误、失败", safe: [10, 40] },
  };

  /** 一键预设：整套颜色一起换。
      每套都是「主色 + 互补色 + 五个信息色」全给，只换主色会让红绿黄停在老配色上。
      五个信息色保持常见语义（绿 = 成功、蓝 = 信息、黄 = 警告、红 = 错误、青绿 = 互补/强调），
      只在明度饱和度上跟着主色风格微调，不改色系本身。 */
  const PRESETS: { name: string; colors: Record<HueRole, string> }[] = [
    { name: "靛蓝（默认）", colors: { ...DEFAULT_COLORS } },
    { name: "海蓝", colors: { accent: "#0284c7", complement: "#009145", success: "#1ec55f", info: "#0ea5e9", warning: "#e08a00", danger: "#dc2627" } },
    { name: "青碧", colors: { accent: "#0891b2", complement: "#ec4899", success: "#14b8a6", info: "#06b6d4", warning: "#f59e0a", danger: "#f43f5e" } },
    { name: "翠绿", colors: { accent: "#16a34a", complement: "#f97316", success: "#1ec55f", info: "#0ea5e9", warning: "#facc15", danger: "#dc2627" } },
    { name: "藤紫", colors: { accent: "#7c3aed", complement: "#ec4899", success: "#1ec55f", info: "#6366f1", warning: "#f59e0a", danger: "#dc2627" } },
    { name: "玫红", colors: { accent: "#e11d48", complement: "#009145", success: "#1ec55f", info: "#3c82f6", warning: "#f59e0a", danger: "#b91c1e" } },
    { name: "暖橙", colors: { accent: "#ea580c", complement: "#0891b2", success: "#1ec55f", info: "#3c82f6", warning: "#f59e0a", danger: "#b91c1e" } },
  ];

  /** 调色盘那张卡右侧的源码样例：把「挑完整颜色 → 写回」这条主线说清楚 */
  const paletteSource = `<!-- 色板：横向色相，纵向明度，点哪算哪 -->
<div
  class="plane"
  style="background: linear-gradient(#0000, #000),
         linear-gradient(90deg, #fff, hsl(0 100% 50%))"
  onpointerdown={pick}
/>

<!-- 色条：一个渐变按钮，指针位置换色相 -->
<button class="strip" onpointerdown={pickHue} onpointermove={pickHue}>
  <span class="thumb" style="left: {\${hue / 3.6}}%"></span>
</button>

<!-- 明度 / 饱和度：纯白纯黑把明度拉到底即可 -->
<input type="range" min="0" max="1" step="0.01"
       value={\${color.l}} oninput={(e) => setColor("accent", { ...color, l: +e.currentTarget.value })} />

<!-- 输入框：#rgb / #rrggbb / oklch(...) 都吃 -->
<input value={\${hex}} onchange={(e) => commit(e.currentTarget.value)} />

<script lang="ts">
  import { setColor, parseColor, normalizeHex, maxChroma } from "goose-ui";

  // 横轴给色相、纵轴给明度；彩度沿用当前值，只在色域边界被夹
  const pick = (e: PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setColor("accent", { l: 1 - y, c: color.c, h: (x * 360) % 360 });
  };
  const pickHue = (e: PointerEvent) =>
    setColor("accent", { ...color, h: hueAt(e) });
  const commit = (raw: string) => {
    // hex 原样落盘：走 oklch 往返会掉 1 bit（#0ea5e9 → #0aa5e9）
    setColor("accent", normalizeHex(raw) ?? parseColor(raw) ?? "#1850ec");
  };
  // 饱和度滑条以「该明度+色相下的色域上限」为满值，
  // 否则拉到 100% 会被截断，滑条自己弹回来
  const satMax = () => maxChroma(color.l, color.h);
<\/script>`;
  const colorProps: PropsTableItem[] = [
    { name: "role", desc: "色彩角色", type: "'accent' | 'complement' | 'success' | 'info' | 'warning' | 'danger'" },
    { name: "color", desc: "颜色：'#rgb' / '#rrggbb' / oklch(...) / {l,c,h}；null 清除", type: "string | OklchColor | null" },
  ];

  const apiProps: PropsTableItem[] = [
    { name: "setColor(role, color)", desc: "指定颜色：'#rgb' / '#rrggbb' / oklch 串 / {l,c,h}；传 null 恢复默认", type: "void" },
    { name: "setColors(partial)", desc: "批量设置颜色；值为 null 的条目会被清除", type: "void" },
    { name: "resetColors()", desc: "清除所有自定义颜色，恢复主题默认 hex", type: "void" },
    { name: "getColors()", desc: "读取当前颜色副本（hex，未配置的角色不在表里）", type: "Partial<ColorMap>" },
    { name: "hasColor(role)", desc: "该角色是否被自定义颜色覆盖", type: "boolean" },
    { name: "formatHex(color)", desc: "{l,c,h} → #rrggbb", type: "string" },
    { name: "normalizeHex(str)", desc: "hex 规范化（'#48f' → '#4488ff'），非 hex 返回 null", type: "string | null" },
    { name: "maxChroma(l, h)", desc: "该明度/色相在 sRGB 内的彩度上限（饱和度滑条满值）", type: "number" },
    { name: "parseColor(str)", desc: "#rgb / #rrggbb / oklch(...) → {l,c,h}", type: "OklchColor | null" },
    { name: "hexToOklch(hex)", desc: "#rgb / #rrggbb 转 oklch 分量", type: "OklchColor | null" },
    { name: "colorStore.colors", desc: "响应式颜色状态（存 hex）", type: "Partial<ColorMap>" },
    { name: "DEFAULT_COLORS", desc: "默认颜色常量（hex）", type: "ColorMap" },
    { name: "setHue(role, hue)", desc: "只调色相，供需要按色相取邻近色的动画/渐变使用", type: "void" },
    { name: "setHues(partial)", desc: "批量设置色相并持久化", type: "void" },
    { name: "resetHues()", desc: "恢复默认色相并清除持久化（不影响上面的 hex）", type: "void" },
    { name: "getHues()", desc: "读取当前色相副本", type: "HueMap" },
  ];

  const cssSource = `/* 方式一：纯 CSS，零 JS —— 直接覆盖角色颜色（hex） */
:root {
  --accent: #1850ec;
  --complement: #009145;
  --success: #1ec55f;
  --info: #3c82f6;
  --warning: #f59e0a;
  --danger: #dc2627;
}`;

  const jsSource = `<script lang="ts">
  import { setColor, setColors } from "goose-ui";

  setColor("accent", "#1850ec");                    // 单改
  setColors({ accent: "#1850ec", info: "#3c82f6" }); // 批量
  setColor("accent", null);                         // 恢复默认
<\/script>`;

  /** 预设只写草稿里的颜色（一整套 hex，六个角色全给） */
  const applyPreset = (colors: Partial<Record<HueRole, string>>): void => {
    draft = { colors: { ...colors } };
  };
  /* ── 完整调色盘 ──────────────────────────────────────────────────────────────
     调色盘在 OKLCH 空间里挑（横轴色相、纵轴明度、色条微调色相），挑完落成 hex。
     存 hex 而不是 oklch 字符串：可读、可手改、和 theme.css 里的默认值同一套写法。
     颜色本身是完整的 —— 亮暗两套主题各有一份默认 hex，用户改了就直接覆盖。
     这里没有「色相」这一层：色相只是调色盘内部用来生成渐变的临时坐标。 */

  /** 调色盘正在编辑的角色 */
  let paletteRole = $state<HueRole>("accent");

  /* ---------- 草稿：所有编辑先写这里，点「保存」才提交给 store ---------- */

  /** 落盘的基线；用它判断有没有未保存的改动 */
  type Draft = { colors: Partial<Record<HueRole, string>> };

  const snapshot = (): Draft => ({
    colors: { ...colorStore.colors },
  });

  let draft = $state<Draft>(snapshot());

  /** 把当前已生效的值读回草稿（保存后或放弃时用） */
  function resyncDraft(): void {
    draft = snapshot();
  }

  /** 角色当前该显示的 hex：草稿里没改过就取主题默认值 */
  const draftHex = (role: HueRole): string => draft.colors[role] ?? DEFAULT_COLORS[role];

  /** 编辑单个角色的颜色；传 hex 字符串时原样保留，传 {l,c,h} 时折算成 hex，
   *  null 表示清除自定义色，回到主题默认 */
  function draftSetColor(role: HueRole, value: OklchColor | string | null): void {
    const next = { ...draft.colors };
    if (value === null) delete next[role];
    else next[role] = typeof value === "string" ? (normalizeHex(value) ?? value) : formatHex(value);
    draft = { colors: next };
  }

  function discardDraft(): void {
    draft = snapshot();
    hexInput = "";
    Notification.info("已放弃改动");
  }

  function saveDraft(): void {
    setColors(draft.colors);
    resyncDraft();
    Notification.success("配色已保存");
  }

  /** 预览区：把草稿里的颜色折算成一组 CSS 变量，只挂在预览容器上，不碰 :root */
  const previewVars = $derived.by(() => {
    const vars: string[] = [];
    for (const r of HUE_ROLES) {
      vars.push(`--${r}: ${draftHex(r)}`);
      const c = draft.colors[r];
      if (c) vars.push(`--c-${r}: ${c}`);
    }
    return vars.join("; ");
  });

  const normHue = (h: number): number => ((Math.round(h) % 360) + 360) % 360;
  const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

  /* ── 配色盘的状态 ────────────────────────────────────────────────────────────
     权威状态是 OKLCH 三元组 + 一个精确的 hex 字符串，**不是**从 hex 反解出来的 oklch。
     原因有两个，都会让界面「自己跳」：
      1. 黑色 #000000 里没有色相信息，纯灰里没有彩度。滑条拖到端点再拖回来，
         若从 hex 反解就只剩 h=0 / c=0，颜色回不到原样。
      2. hex → oklch → hex 是浮点往返，会掉 1 bit（#0ea5e9 → #0aa5e9）。
     所以：hex 只用来「显示」和「存盘」，l/c/h 由这里持有；
     只有外部改色（输入框、色票、预设）才重新反解一次。 */
  let planeHex = $state("");
  /** c 存的是「用户想要的彩度」，可能超出 sRGB 色域；写 hex 时才按色域上限夹住 */
  let planeOklch = $state<OklchColor>({ l: 0.6, c: 0.2, h: 264 });

  /** 草稿被别人改了（切角色、点色票、套预设、手输 hex）就重新对齐 */
  $effect(() => {
    const hex = draft.colors[paletteRole] ?? DEFAULT_COLORS[paletteRole];
    if (hex !== planeHex) {
      planeHex = hex;
      planeOklch = parseColor(hex) ?? { l: 0.6, c: 0.2, h: 264 };
    }
  });

  /** 实际写进 hex 的彩度：先按「明度两端收敛」衰减，再按 sRGB 色域上限夹住。
   *  这个值只用于算 hex，绝不回写进 planeOklch —— 否则拖到黑色（衰减成 0）
   *  再拖回来就只剩灰色，色板会把用户选的彩度弄丢。 */
  function effectiveChroma(l: number, h: number, want: number): number {
    const falloff = Math.min(1, Math.min(l, 1 - l) * 4);
    return Math.min(want * falloff, maxChroma(l, h));
  }

  /** 写入配色盘：planeOklch 永远保留「用户想要的彩度」，planeHex 落实际算出的颜色。
   *  不夹彩度直接落 hex 的话，超域值会被逐通道截断，存回去的 c 变小，
   *  滑条会自己弹回来（拖到 100% 只剩 45%）。 */
  function writePlane(next: OklchColor): void {
    const l = clamp01(next.l);
    const h = normHue(next.h);
    const want = Math.max(0, next.c);
    planeOklch = { l, c: want, h };
    planeHex = formatHex({ l, c: effectiveChroma(l, h, want), h });
    draftSetColor(paletteRole, planeHex);
  }

  const paletteHue = $derived(planeOklch.h);
  const paletteL = $derived(planeOklch.l);
  const paletteHex = $derived(planeHex);
  /** 当前明度 + 色相下 sRGB 的彩度上限；饱和度滑条以它为满值 */
  const chromaLimit = $derived(Math.max(0.0001, maxChroma(planeOklch.l, planeOklch.h)));
  const satRatio = $derived(Math.min(1, planeOklch.c / chromaLimit));
  /** 该角色在草稿里是否已有完整颜色 */
  const paletteCustom = $derived(draft.colors[paletteRole] !== undefined);

  /** 草稿与已生效值是否有差异 */
  const dirty = $derived.by(() => {
    for (const r of HUE_ROLES) {
      if ((draft.colors[r] ?? DEFAULT_COLORS[r]) !== (colorStore.colors[r] ?? DEFAULT_COLORS[r])) return true;
    }
    return false;
  });

  /** 当前草稿对应哪套预设 */
  const draftPreset = $derived(PRESETS.find((p) => HUE_ROLES.every((r) => (draft.colors[r] ?? DEFAULT_COLORS[r]) === p.colors[r]))?.name ?? "");

  /** 手写输入的十六进制，失焦或回车才落地，避免半截输入被当成颜色 */
  let hexInput = $state("");
  $effect(() => {
    hexInput = paletteHex;
  });

  /* ---------- 取色：拖动时按 rAF 合并，一帧最多落地一次 ---------- */

  /** 拖动中的元素。**不缓存矩形**：按下时按钮刚拿到焦点，浏览器会把它滚进视口，
   *  缓存的矩形立刻过时 —— 实测差 18px，等于明度差 10%，指针下面那块颜色会跳。
   *  改成每帧在 rAF 里量一次：一帧最多一次强制布局，坐标永远是对的。 */
  let dragEl: HTMLElement | null = null;
  let pending: { cx: number; cy: number } | null = null;
  /** 待执行的下标换算（色板和色条各用一个入口） */
  let pendingApply: ((r: { x: number; y: number }) => void) | null = null;
  let rafId = 0;

  const ratio = (cx: number, cy: number, rect: DOMRect): { x: number; y: number } => ({
    x: Math.min(1, Math.max(0, (cx - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (cy - rect.top) / rect.height)),
  });

  /** 色板：横轴 = 色相，纵轴 = 明度（上亮下暗），点哪算哪。
   *  彩度沿用已记住的值，由 effectiveChroma 在两端收敛。 */
  function applySv({ x, y }: { x: number; y: number }): void {
    writePlane({ l: 1 - y, c: planeOklch.c, h: normHue(x * 360) });
  }

  /** 色条：只改色相，明度与彩度原样保留 */
  function applyHue({ x }: { x: number }): void {
    writePlane({ ...planeOklch, h: normHue(x * 360) });
  }

  /** 立刻量一次并落地（按下那一刻与抬起收尾用） */
  function pickNow(el: HTMLElement, cx: number, cy: number, apply: (r: { x: number; y: number }) => void): void {
    apply(ratio(cx, cy, el.getBoundingClientRect()));
  }

  /** 队列化：同一帧内的多次 pointermove 只保留最后一次，
   *  等到 rAF 才量矩形 + 落地（合批，且量的是最新布局） */
  function queuePick(cx: number, cy: number, apply: (r: { x: number; y: number }) => void): void {
    pending = { cx, cy };
    pendingApply = apply;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      const p = pending;
      const fn = pendingApply;
      pending = null;
      if (!p || !fn || !dragEl) return;
      fn(ratio(p.cx, p.cy, dragEl.getBoundingClientRect()));
    });
  }

  function endDrag(): void {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    // 收尾：把最后一帧还没落地的位置补上，再清状态
    const p = pending;
    const fn = pendingApply;
    pending = null;
    pendingApply = null;
    if (p && fn && dragEl) fn(ratio(p.cx, p.cy, dragEl.getBoundingClientRect()));
    dragEl = null;
  }

  function onSvPointerDown(e: PointerEvent): void {
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture?.(e.pointerId);
    dragEl = el;
    pickNow(el, e.clientX, e.clientY, applySv);
  }

  function onSvPointerMove(e: PointerEvent): void {
    if (!dragEl) return;
    queuePick(e.clientX, e.clientY, applySv);
  }

  function onHuePointerDown(e: PointerEvent): void {
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture?.(e.pointerId);
    dragEl = el;
    pickNow(el, e.clientX, e.clientY, applyHue);
  }

  function onHuePointerMove(e: PointerEvent): void {
    if (!dragEl) return;
    queuePick(e.clientX, e.clientY, applyHue);
  }

  /** 饱和度：0 → 灰，1 → 该明度/色相下 sRGB 能表示的最大彩度 */
  function setSaturation(v: number): void {
    const t = Math.min(1, Math.max(0, v));
    writePlane({ l: planeOklch.l, c: t * chromaLimit, h: planeOklch.h });
  }

  /** 明度：0 → 纯黑，1 → 纯白。彩度保持用户选的值（可能暂时超出色域），
   *  拖回中间时颜色原样回来，不会变成灰 */
  function setLightness(v: number): void {
    writePlane({ ...planeOklch, l: Math.min(1, Math.max(0, v)) });
  }

  /** 输入框落地：#rgb / #rrggbb / oklch(...) 都能进，失败回滚。
      写回直接改 input.value —— 只动 $state 的话，值没变时 Svelte 不会重设 DOM，
      框里就会留着一串刚输入的非法字符。 */
  function commitColor(raw: string, input: HTMLInputElement): void {
    const next = resolveHex(raw);
    if (!next) {
      input.value = paletteHex;
      hexInput = input.value;
      return;
    }
    draftSetColor(paletteRole, next);
    hexInput = next;
    input.value = next;
  }

  /** 行内输入框：失焦时落地，成功后回写成规范化文本，失败则贴回原色 */
  function commitRow(role: HueRole, raw: string, input: HTMLInputElement): void {
    const next = resolveHex(raw);
    if (!next) {
      input.value = draftHex(role);
      return;
    }
    draftSetColor(role, next);
    input.value = next;
  }

  /** 输入框 → 规范 hex。hex 原样保留（不走 oklch 往返，否则 #0ea5e9 会掉成 #0aa5e9），
   *  oklch 串折算成 hex，非法返回 null */
  function resolveHex(raw: string): string | null {
    const direct = normalizeHex(raw);
    if (direct) return direct;
    const parsed = parseColor(raw);
    return parsed ? formatHex(parsed) : null;
  }

  /** 点开调色盘时自动定位到当前角色的色块 */
  function openPicker(role: HueRole): void {
    paletteRole = role;
    document.querySelector(".palette")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /** 常用色板：点一下直接落在该颜色上 */
  const SWATCHES: { name: string; hex: string }[] = [
    { name: "红", hex: "#ef4444" },
    { name: "橙", hex: "#f97316" },
    { name: "琥珀", hex: "#f59e0b" },
    { name: "黄", hex: "#eab308" },
    { name: "黄绿", hex: "#84cc16" },
    { name: "绿", hex: "#22c55e" },
    { name: "翡翠", hex: "#10b981" },
    { name: "青", hex: "#06b6d4" },
    { name: "天蓝", hex: "#0ea5e9" },
    { name: "蓝", hex: "#3b82f6" },
    { name: "靛蓝", hex: "#6366f1" },
    { name: "紫", hex: "#8b5cf6" },
    { name: "品红", hex: "#d946ef" },
    { name: "玫红", hex: "#ec4899" },
    { name: "石板灰", hex: "#64748b" },
    { name: "灰", hex: "#6b7280" },
  ];

  /* ── 全部颜色变量 ────────────────────────────────────────────────────────────
     上面两块管的是「能改的颜色」，这一段管「一共定义了哪些颜色」：
     清单直接对着 theme.css 抄 —— 基础面、描边遮罩、文字、六个语义色系、
     中性面、滚动条，再加两组合法别名。改主题文件时这张表要一起改。

     色块只负责显示，值让浏览器算：color-mix()、var() 别名、以及暗色块里
     没有重定义而落回 :root 的项，都只有「算出来」的才是真的。
     所以渲染后统一量一次 computed background-color，存进 resolved。 */
  type TokenDef = { name: string; note?: string };
  /** gradient: 该组的 token 值是「整条渐变」而不是一个颜色 —— 不能量
   *  backgroundColor（永远是 transparent），要改量 background-image 里的色相。 */
  type TokenGroup = { title: string; note?: string; gradient?: boolean; tokens: TokenDef[] };

  const TOKEN_GROUPS: TokenGroup[] = [
    {
      title: "基础面",
      note: "大面积底色，全部为中性灰（R=G≈B），不带暖色偏移",
      tokens: [
        { name: "--bg", note: "页面底色" },
        { name: "--surface", note: "卡片 / 输入框面" },
        { name: "--surface-2", note: "次级面（表头、内嵌块）" },
        { name: "--surface-3", note: "三级面（悬停行、块分隔）" },
        { name: "--hover", note: "hover 底色（不透明；有持久选中项的列表用，主题色只留给选中）" },
        { name: "--hover-line", note: "下划线 tab 的 hover 条（比 --hover 深/浅一档）" },
        { name: "--popup-surface", note: "浮层底色（菜单 / 气泡；亮=纯白、暗=纯黑）" },
      ],
    },
    {
      title: "描边与遮罩",
      note: "分割线、控件描边、弹层遮罩",
      tokens: [
        { name: "--border", note: "常规分割线" },
        { name: "--border-strong", note: "控件描边 / 强分割" },
        { name: "--overlay", note: "弹窗遮罩" },
        { name: "--overlay-light", note: "轻遮罩（抽屉、浮层背后）" },
      ],
    },
    {
      title: "文字",
      note: "三档灰度；语义色另有各自的 *-text",
      tokens: [
        { name: "--text", note: "正文" },
        { name: "--text-strong", note: "标题 / 强调" },
        { name: "--text-muted", note: "说明、占位符" },
      ],
    },
    {
      title: "主色 accent",
      note: "激活项、主按钮、焦点环；可用 --c-accent 覆盖",
      tokens: [
        { name: "--accent", note: "主色" },
        { name: "--accent-hover", note: "hover 加深" },
        { name: "--accent-text", note: "主色底上的文字" },
        { name: "--accent-sub", note: "15% 淡染（多选/单选组的选中底，不用于 pill / hover）" },
        { name: "--accent-ring", note: "20%（焦点环）" },
        { name: "--accent-strong", note: "30%（选中强调）" },
      ],
    },
    {
      title: "渐变（全项目统一）",
      note: "只用这一套：主色色相 -30° → +30°，跨度 60°，中点落在主色上",
      gradient: true,
      tokens: [
        { name: "--gradient-accent", note: "TitleBar logo、进度条 / 仪表 / 滑杆填充" },
        { name: "--gradient-accent-hover", note: "hover：色相不动，整条提亮一档" },
        { name: "--titlebar-logo-gradient", note: "旧名 → --gradient-accent" },
        { name: "--titlebar-logo-gradient-hover", note: "旧名 → --gradient-accent-hover" },
      ],
    },
    {
      title: "互补色 complement",
      note: "强调位 / 对比位、进度渐变终点",
      tokens: [
        { name: "--complement", note: "互补色" },
        { name: "--complement-hover", note: "hover 加深" },
        { name: "--complement-sub", note: "淡染" },
        { name: "--complement-text", note: "浅底上的文字" },
      ],
    },
    {
      title: "完成 success",
      note: "成功、通过、已保存",
      tokens: [
        { name: "--success", note: "完成色" },
        { name: "--success-hover", note: "hover 加深" },
        { name: "--success-soft", note: "淡底" },
        { name: "--success-text", note: "浅底上的文字" },
        { name: "--success-border", note: "淡底描边" },
      ],
    },
    {
      title: "信息 info",
      note: "提示、中性通知、说明",
      tokens: [
        { name: "--info", note: "信息色" },
        { name: "--info-hover", note: "hover 加深" },
        { name: "--info-soft", note: "淡底" },
        { name: "--info-text", note: "浅底上的文字" },
        { name: "--info-border", note: "淡底描边" },
      ],
    },
    {
      title: "警告 warning",
      note: "注意、风险、待处理",
      tokens: [
        { name: "--warning", note: "警告色" },
        { name: "--warning-hover", note: "hover 加深" },
        { name: "--warning-soft", note: "淡底" },
        { name: "--warning-text", note: "浅底上的文字" },
        { name: "--warning-border", note: "淡底描边" },
      ],
    },
    {
      title: "危险 danger",
      note: "删除、错误、失败",
      tokens: [
        { name: "--danger", note: "危险色" },
        { name: "--danger-hover", note: "hover 加深" },
        { name: "--danger-soft", note: "淡底" },
        { name: "--danger-text", note: "浅底上的文字" },
        { name: "--danger-border", note: "淡底描边" },
      ],
    },
    {
      title: "中性面与次要色",
      note: "无彩色面；Button variant=default 用的一套",
      tokens: [
        { name: "--neutral-bg", note: "→ --bg" },
        { name: "--neutral-surface", note: "→ --surface" },
        { name: "--neutral-surface-2", note: "→ --surface-2" },
        { name: "--neutral-border", note: "→ --border" },
        { name: "--secondary", note: "次要面" },
        { name: "--secondary-hover", note: "次要面 hover" },
        { name: "--secondary-soft", note: "更浅的次要面" },
        { name: "--secondary-text", note: "次要面文字" },
      ],
    },
    {
      title: "滚动条",
      note: "全站细滚动条（6px）",
      tokens: [
        { name: "--scrollbar", note: "滑块" },
        { name: "--scrollbar-hover", note: "滑块 hover" },
      ],
    },
    {
      title: "兼容别名 · shadcn",
      note: "全部指向上面某一档，值随目标一起变",
      tokens: [
        { name: "--background", note: "→ --bg" },
        { name: "--foreground", note: "→ --text" },
        { name: "--card", note: "→ --surface" },
        { name: "--card-foreground", note: "→ --text" },
        { name: "--popover", note: "→ --surface" },
        { name: "--popover-foreground", note: "→ --text" },
        { name: "--primary-foreground", note: "→ --accent-text" },
        { name: "--secondary-foreground", note: "→ --secondary-text" },
        { name: "--muted", note: "→ --surface-2" },
        { name: "--muted-foreground", note: "→ --text-muted" },
        { name: "--accent-surface", note: "中性高亮面（shadcn 语义）" },
        { name: "--accent-foreground", note: "→ --secondary-text" },
        { name: "--destructive", note: "→ --danger" },
        { name: "--input", note: "→ --border" },
        { name: "--ring", note: "→ --accent" },
      ],
    },
    {
      title: "兼容别名 · 旧名与通知底",
      note: "--primary* 是 accent 体系的旧名；*-bg 供通知图标底板",
      tokens: [
        { name: "--primary", note: "→ --accent" },
        { name: "--primary-hover", note: "→ --accent-hover" },
        { name: "--primary-soft", note: "→ --accent-sub" },
        { name: "--primary-text", note: "→ --accent-text" },
        { name: "--success-bg", note: "→ --success-soft" },
        { name: "--info-bg", note: "→ --info-soft" },
        { name: "--warning-bg", note: "→ --warning-soft" },
        { name: "--danger-bg", note: "→ --danger-soft" },
      ],
    },
  ];

  const COLOR_TOTAL = TOKEN_GROUPS.filter((g) => !g.gradient).reduce((n, g) => n + g.tokens.length, 0);
  const GRADIENT_TOTAL = TOKEN_GROUPS.filter((g) => g.gradient).reduce((n, g) => n + g.tokens.length, 0);

  /** 色板预览用的亮暗作用域：默认跟随全局主题，手动点过就不再跟 */
  let themeView = $state<"light" | "dark">(themeStore.theme);
  let themePinned = $state(false);

  $effect(() => {
    const t = themeStore.theme;
    if (!themePinned) themeView = t;
  });

  function pickView(t: "light" | "dark"): void {
    themePinned = true;
    themeView = t;
  }

  /** 量值用的作用域根节点 + 量出来的结果（token → 实际颜色） */
  let scopeEl = $state<HTMLElement>();
  let resolved = $state<Record<string, string>>({});

  /** rgb() / rgba() / color(srgb …) → #rrggbb；带透明度时补一个百分比。
   *  color-mix() 有时被序列化成 color(srgb …)（分量是 0~1 的浮点），
   *  不转就会在格子漏出一长串原始字符串。其它形式原样显示，不猜。 */
  function describeColor(css: string): string {
    let p: number[] = [];
    const legacy = css.match(/^rgba?\(([^)]+)\)$/i);
    const modern = css.match(/^color\(srgb\s+([^)]+)\)$/i);
    if (legacy) {
      p = legacy[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    } else if (modern) {
      p = modern[1].split(/[\s/]+/).filter(Boolean).map(Number);
      p = [...p.slice(0, 3).map((n) => n * 255), ...(p.length > 3 ? [p[3]] : [])];
    } else {
      return css;
    }
    if (p.length < 3 || p.slice(0, 3).some((n) => Number.isNaN(n))) return css;
    const hex = "#" + p.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");
    const a = p.length > 3 ? p[3] : 1;
    return a >= 0.999 ? hex : `${hex} · ${Math.round(a * 100)}%`;
  }

  /** 渐变 token 的「值」：把两端色相量出来写成 234° → 294°（跨 60°）。
   *  渐变没有 backgroundColor 可量，但 computed background-image 里的 oklch
   *  已经把 calc() 算完了，摘出两个 hue 就是这条渐变真实的起止色相。 */
  function describeGradient(bgImage: string): string {
    const hues = [...bgImage.matchAll(/oklch\(([^)]+)\)/gi)]
      .map((m) => Number.parseFloat(m[1].split(/[\s/]+/).filter(Boolean)[2] ?? ""))
      .filter((n) => Number.isFinite(n));
    if (hues.length < 2) return "渐变";
    const a = hues[0];
    const b = hues[hues.length - 1];
    const span = Math.round((((b - a) % 360) + 360) % 360);
    return `${Math.round(a)}° → ${Math.round(b)}° · 跨 ${span}°`;
  }

  /** 亮暗切换、全局主题变化、用户改色之后都要重量 —— color-mix 与别名
   *  的值全在浏览器里，只有量 computed style 才拿得到。 */
  $effect(() => {
    void themeView;
    void themeStore.theme;
    const custom = colorStore.colors;
    for (const key of Object.keys(custom)) void custom[key as HueRole];
    if (!scopeEl) return;
    tick().then(() => {
      const root = scopeEl;
      if (!root) return;
      const next: Record<string, string> = {};
      for (const el of root.querySelectorAll<HTMLElement>(".ct-fill[data-token]")) {
        const cs = getComputedStyle(el);
        const token = el.dataset.token ?? "";
        next[token] = el.classList.contains("ct-fill--grad")
          ? describeGradient(cs.backgroundImage)
          : describeColor(cs.backgroundColor);
      }
      resolved = next;
    });
  });

  /** 刚复制的那一项：行内把值换成「已复制」——比每条弹一个通知安静得多，
   *  连着抄十个 token 时不至于糊一屏 */
  let copiedToken = $state("");
  let copyTimer: ReturnType<typeof setTimeout> | null = null;

  async function copyToken(name: string): Promise<void> {
    const ok = await copyToClipboard(`var(${name})`);
    if (!ok) {
      Notification.error("复制失败，请手动选择");
      return;
    }
    copiedToken = name;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copiedToken = ""), 1400);
  }

  $effect(() => () => {
    if (copyTimer) clearTimeout(copyTimer);
  });
</script>

<Page toc class="settings-page" title="设置 Settings" description="主题色配置：六个角色各一个 hex，可选预设或直接手写；页内附全部颜色变量一览">
  <CodePreview anchor="theme-color" anchorLevel={2} title="主题色配置（全局生效）" code={cssSource}>
    <div class="hue-list">
      {#each HUE_ROLES as role (role)}
        {@const meta = ROLE_META[role]}
        {@const hue = parseColor(draftHex(role))?.h ?? 0}
        {@const inSafe = hue >= meta.safe[0] && hue <= meta.safe[1]}
        <div class="hue-row">
          <div class="hue-head">
            <!-- 色块兼作跳转按钮：点一下把下面的完整调色盘切到这个角色 -->
            <Tooltip title={`在调色盘里编辑${meta.label}`} placement="bottom">
              <button class="hue-swatch" style:background={draftHex(role)} aria-label={`在调色盘里编辑${meta.label}`} onclick={() => openPicker(role)}></button>
            </Tooltip>
            <span class="hue-name">{meta.label}</span>
            <code class="hue-token">{draft.colors[role] ? `--c-${role}` : `--${role}`}</code>
            {#if !inSafe}
              <Tooltip title="该色相在此角色上对比度可能偏低">
                <span class="hue-warn">对比度提示</span>
              </Tooltip>
            {/if}
          </div>
          <div class="hue-controls">
            <!-- 色票按钮就是入口：点它弹出下面的完整调色盘，不再在行内塞滑块 -->
            <Tooltip title="点击打开调色盘" class="hue-pick-tip" placement="bottom">
              <button class="hue-pick" style:background={draftHex(role)} aria-label={`为${meta.label}打开调色盘`} onclick={() => openPicker(role)}>
                <span class="hue-pick-label">{draftHex(role)}</span>
              </button>
            </Tooltip>
            <input
              class="hue-num"
              type="text"
              value={draftHex(role)}
              spellcheck="false"
              aria-label={`${meta.label}颜色（#rgb 或 #rrggbb）`}
              onkeydown={(e) => {
                if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
              }}
              onchange={(e) => commitRow(role, e.currentTarget.value, e.currentTarget)} />
          </div>
          <span class="hue-desc">{meta.desc}</span>
        </div>
      {/each}
    </div>

    <Separator />

    <Row style="align-items:center;gap:8px;flex-wrap:wrap">
      <span class="hue-desc">预设：</span>
      {#each PRESETS as p (p.name)}
        <Button size="small" variant={draftPreset === p.name ? "primary" : "default"} onclick={() => applyPreset(p.colors)}>
          {p.name}
        </Button>
      {/each}
      <Button
        size="small"
        variant="ghost"
        icon={RotateCcw}
        iconSize={14}
        onclick={() => {
          // 只把草稿清成默认值，点保存才会真正生效
          draft = { colors: {} };
        }}>
        恢复默认
      </Button>
      <span class="hue-preset-state">
        {draftPreset ? `当前：${draftPreset}` : "当前：自定义"}
      </span>
    </Row>

    <!-- 草稿区：编辑只写草稿，点保存才落到全局；预览见下方配色盘 -->
    <div class="draft-bar" class:is-dirty={dirty}>
      <span class="draft-state">
        {dirty ? "有未保存的改动" : "与当前配色一致"}
      </span>
      <span class="draft-preview" style={previewVars} aria-hidden="true">
        <span class="draft-dot draft-dot--accent"></span>
        <span class="draft-dot draft-dot--complement"></span>
        <span class="draft-dot draft-dot--success"></span>
        <span class="draft-dot draft-dot--warning"></span>
        <span class="draft-dot draft-dot--danger"></span>
        <span class="draft-dot draft-dot--info"></span>
      </span>
      <Button size="small" variant="default" disabled={!dirty} onclick={discardDraft}>放弃</Button>
      <Button size="small" variant="primary" disabled={!dirty} onclick={saveDraft}>保存</Button>
    </div>

    <p class="hue-note">
      改动先落进草稿，点「保存」才全局生效（按钮、激活项、焦点环、进度条、通知等一并跟随）， 并持久化到 <code>localStorage</code>。颜色一律以 hex 保存，直接覆盖主题里的默认值。
      标「对比度提示」的角色表示当前颜色在该用途下文字对比度可能偏低。
    </p>

    <Separator />

    <!-- 草稿预览：这一块自己带一套 --<角色> / --c-<角色>，所以能看出「保存后会变成什么样」，
         而页面其余部分仍然用已保存的全局配色 -->
    <div class="draft-preview-panel" style={previewVars}>
      <span class="draft-preview-title">预览（保存后应用到全站）</span>
      <div class="draft-preview-row">
        <Button variant="primary" size="small">主按钮</Button>
        <Button variant="default" size="small">次要</Button>
        <Button variant="danger" size="small">危险</Button>
        <span class="draft-chip draft-chip--accent">强调</span>
        <span class="draft-chip draft-chip--success">成功</span>
        <span class="draft-chip draft-chip--warning">警告</span>
        <span class="draft-chip draft-chip--danger">错误</span>
        <span class="draft-chip draft-chip--info">信息</span>
      </div>
    </div>

    <div class="hue-jsapi">
      <span class="hue-desc">若要在代码里设置（可持久化）：</span>
      <CodeBlock code={jsSource} language="svelte" maxHeight="200px" />
    </div>
  </CodePreview>

  <CodePreview anchor="theme-wheel" anchorLevel={2} title="配色盘（完整调色）" code={paletteSource} flush>
    <div class="palette" style={previewVars}>
      <div class="palette-main">
        <div
          class="palette-plane"
          role="slider"
          tabindex="0"
          aria-label="色板：横向色相，纵向明度"
          aria-valuemin="0"
          aria-valuemax="359"
          aria-valuenow={paletteHue}
          aria-valuetext={`色相 ${paletteHue}°，明度 ${Math.round(paletteL * 100)}%`}
          style:--plane-hue={paletteHex}
          onpointerdown={onSvPointerDown}
          onpointermove={onSvPointerMove}
          onpointerup={endDrag}
          onpointercancel={endDrag}
          onkeydown={(e) => {
            const step = e.shiftKey ? 10 : 1;
            if (e.key === "ArrowRight") writePlane({ ...planeOklch, h: normHue(paletteHue + step) });
            else if (e.key === "ArrowLeft") writePlane({ ...planeOklch, h: normHue(paletteHue - step) });
            else if (e.key === "ArrowUp") writePlane({ ...planeOklch, l: clamp01(paletteL + step / 100) });
            else if (e.key === "ArrowDown") writePlane({ ...planeOklch, l: clamp01(paletteL - step / 100) });
            else return;
            e.preventDefault();
          }}>
          <span class="palette-cursor" style:left={`${(paletteHue / 360) * 100}%`} style:top={`${(1 - paletteL) * 100}%`} style:background={paletteHex}></span>
        </div>

        <div class="palette-strip">
          <!-- 色条不用原生 range：range 的轨道样式在各个浏览器里不好统一，
               这里用一条渐变按钮 + 指针坐标换算，点击与拖动行为一致 -->
          <button class="palette-slider" type="button" aria-label="色相" onpointerdown={onHuePointerDown} onpointermove={onHuePointerMove} onpointerup={endDrag} onpointercancel={endDrag}>
            <span class="palette-slider-thumb" style:left={`${(paletteHue / 360) * 100}%`}></span>
          </button>
        </div>

        <!-- 明度与饱和度：色板纵轴能选明度，这两条滑块用来精确微调 -->
        <div class="palette-axes">
          <label class="palette-axis">
            <span class="palette-axis-label">明度</span>
            <input class="palette-axis-range" type="range" min="0" max="1" step="0.01" value={paletteL} oninput={(e) => setLightness(Number(e.currentTarget.value))} aria-label="明度" />
            <span class="palette-axis-val">{Math.round(paletteL * 100)}%</span>
          </label>
          <label class="palette-axis">
            <span class="palette-axis-label">饱和度</span>
            <input class="palette-axis-range" type="range" min="0" max="1" step="0.01" value={satRatio} oninput={(e) => setSaturation(Number(e.currentTarget.value))} aria-label="饱和度" />
            <span class="palette-axis-val">{Math.round(satRatio * 100)}%</span>
          </label>
        </div>

        <div class="palette-meta">
          <span class="palette-current" style:background={paletteHex}></span>
          <input
            class="palette-hex"
            value={hexInput}
            spellcheck="false"
            maxlength="9"
            aria-label="十六进制颜色"
            placeholder="#4e8cff"
            oninput={(e) => (hexInput = (e.currentTarget as HTMLInputElement).value)}
            onchange={(e) => commitColor((e.currentTarget as HTMLInputElement).value, e.currentTarget)}
            onkeydown={(e) => {
              if (e.key === "Enter") commitColor((e.currentTarget as HTMLInputElement).value, e.currentTarget);
            }} />
          <span class="palette-hueval">H {paletteHue}°</span>
        </div>

        <div class="palette-swatches">
          {#each SWATCHES as sw (sw.name)}
            <Tooltip title={`${sw.name}（${sw.hex}）`}>
              <button
                class="palette-swatch"
                style:background={sw.hex}
                aria-label="使用{sw.name}"
                onclick={() => {
                  // 直接落原 hex：走 parseColor→formatHex 会掉 1 bit（#ef4444 → #ef4445）
                  draftSetColor(paletteRole, sw.hex);
                }}></button>
            </Tooltip>
          {/each}
        </div>
      </div>

      <div class="palette-side">
        <span class="palette-side-title">调整的角色</span>
        <div class="palette-roles">
          {#each HUE_ROLES as r (r)}
            <button class="palette-role" class:is-active={paletteRole === r} class:is-custom={draft.colors[r] !== undefined} onclick={() => (paletteRole = r)}>
              <span class="palette-role-dot" style:background={draftHex(r)}></span>
              {ROLE_META[r].label}
              <code>{draftHex(r)}</code>
            </button>
          {/each}
        </div>
        <p class="palette-note">
          {ROLE_META[paletteRole].desc}。色板横轴是色相、纵轴是明度，两条滑块精确微调； 纯白、纯黑直接把明度拉到底即可。选中的颜色会写成 hex 存进 <code>{`--c-${paletteRole}`}</code>， 保存后覆盖主题里的默认色。
        </p>
        <!-- 按钮始终占位，只用 visibility 隐藏：第一次改色时它若凭空出现，
             会让整个 .palette 高 36px，而 .cp-body 是 place-content:center，
             内容重新居中 → 取色板在拖动过程中上移 18px，指针下面的颜色就跳了。
             外面套一层 div 是因为 <Button> 是库组件，本文件的作用域样式到不了它。 -->
        <div class="palette-reset" style:visibility={paletteCustom ? "visible" : "hidden"}>
          <Button
            variant="ghost"
            onclick={() => {
              draftSetColor(paletteRole, null);
              Notification.success("已恢复为默认色");
            }}>
            <RotateCcw size={14} />
            恢复为默认色
          </Button>
        </div>
      </div>
    </div>
  </CodePreview>

  <Card anchor="color-tokens" title="全部颜色变量（theme.css）">
    <div class="ct-bar">
      <span class="ct-bar-label">预览主题</span>
      <div class="ct-seg">
        <Button size="small" variant={themeView === "light" ? "primary" : "default"} onclick={() => pickView("light")}>亮色</Button>
        <Button size="small" variant={themeView === "dark" ? "primary" : "default"} onclick={() => pickView("dark")}>暗色</Button>
      </div>
      <span class="ct-count">{COLOR_TOTAL} 个颜色变量 · {GRADIENT_TOTAL} 条渐变</span>
      <span class="ct-hint">点色块复制 <code>var(--token)</code></span>
    </div>

    <!-- 这一块自带 light / dark 变量作用域：页面是亮色时也能看到暗色那套值，
         反之亦然。class 加在容器上，主题变量只在这棵子树里换。 -->
    <div class="ct-scope {themeView}" bind:this={scopeEl}>
      {#each TOKEN_GROUPS as g (g.title)}
        <section class="ct-group">
          <div class="ct-group-head">
            <span class="ct-group-title">{g.title}</span>
            {#if g.note}<span class="ct-group-note">{g.note}</span>{/if}
            <span class="ct-group-count">{g.tokens.length}</span>
          </div>
          {#if g.gradient}
            <!-- 渐变组：色块换成一条色带，值量的是 background-image 两端的色相 -->
            <div class="ct-grad-list">
              {#each g.tokens as t (t.name)}
                <Tooltip title={`${t.name}${t.note ? ` · ${t.note}` : ""} ｜ ${resolved[t.name] ?? "渐变"}`} delay={320} class="ct-tip">
                  <button class="ct-item ct-item--grad" type="button" aria-label={`复制 var(${t.name})`} onclick={() => copyToken(t.name)}>
                    <span class="ct-chip ct-chip--grad"><span class="ct-fill ct-fill--grad" data-token={t.name} style:background={`var(${t.name})`}></span></span>
                    <span class="ct-text">
                      <code class="ct-name">{t.name}</code>
                      <span class="ct-val" class:is-copied={copiedToken === t.name}>{copiedToken === t.name ? "已复制" : (resolved[t.name] ?? "渐变")}</span>
                    </span>
                  </button>
                </Tooltip>
              {/each}
            </div>
          {:else}
            <div class="ct-grid">
              {#each g.tokens as t (t.name)}
                <Tooltip title={`${t.name}${t.note ? ` · ${t.note}` : ""} ｜ ${resolved[t.name] ?? "—"}`} delay={320} class="ct-tip">
                  <button class="ct-item" type="button" aria-label={`复制 var(${t.name})`} onclick={() => copyToken(t.name)}>
                    <span class="ct-chip"><span class="ct-fill" data-token={t.name} style:background={`var(${t.name})`}></span></span>
                    <span class="ct-text">
                      <code class="ct-name">{t.name}</code>
                      <span class="ct-val" class:is-copied={copiedToken === t.name}>{copiedToken === t.name ? "已复制" : (resolved[t.name] ?? "—")}</span>
                    </span>
                  </button>
                </Tooltip>
              {/each}
            </div>
          {/if}
        </section>
      {/each}
    </div>

    <p class="ct-note">
      清单取自 <code>src/lib/styles/theme.css</code>，数值是本页实时算出的实际颜色 —— <code>color-mix()</code> 的淡染、
      <code>var()</code> 别名都已展开，暗色块里没有重定义而落回 <code>:root</code> 的项（如 <code>--secondary-soft</code>）也如实显示。
      带透明度的颜色铺在棋盘格上，能看出透出多少。仅 <code>--accent / --complement / --success / --info / --warning / --danger</code>
      这六个角色可以用 <code>--c-&lt;角色&gt;</code> 覆盖，其余都是按它们或中性面派生的。
      全项目只有一套渐变：<code>--gradient-accent</code> 取主色色相 <code>-30° → +30°</code>（跨度 60°），
      <code>--gradient-accent-hover</code> 只提亮不改色相；<code>--titlebar-logo-gradient*</code> 是它的旧名。
    </p>
  </Card>

  <Card title="JS API（可持久化 / 供设置界面调用）">
    <PropsTable items={apiProps} />
  </Card>

  <Card title="ColorRole 参数">
    <PropsTable anchor="props" items={colorProps} />
    <p class="hue-note">
      默认值（亮色主题）：{HUE_ROLES.map((r) => `${r}=${DEFAULT_COLORS[r]}`).join("、")}
    </p>
  </Card>
</Page>

<style>
  /* ── 草稿栏与预览 ────────────────────────────────────────────── */
  .draft-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 12px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--surface-2);
  }
  .draft-bar.is-dirty {
    border-color: var(--accent-strong);
    background: var(--accent-sub);
  }
  .draft-state {
    flex: 1;
    min-width: 120px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .draft-bar.is-dirty .draft-state {
    color: var(--accent);
    font-weight: 600;
  }
  /* 一行七个小圆点：直接用草稿算出的变量上色，不用点保存就能看出差多少 */
  .draft-preview {
    display: flex;
    gap: 4px;
  }
  .draft-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid var(--border-strong);
  }
  .draft-dot--accent {
    background: var(--accent);
  }
  .draft-dot--complement {
    background: var(--complement);
  }
  .draft-dot--success {
    background: var(--success);
  }
  .draft-dot--warning {
    background: var(--warning);
  }
  .draft-dot--danger {
    background: var(--danger);
  }
  .draft-dot--info {
    background: var(--info);
  }

  .draft-preview-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    margin-top: 12px;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-lg);
  }
  .draft-preview-title {
    font-size: 12px;
    color: var(--text-muted);
  }
  .draft-preview-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .draft-chip {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }
  .draft-chip--accent {
    background: var(--accent-sub);
    color: var(--accent);
  }
  .draft-chip--success {
    background: var(--success-soft);
    color: var(--success-text);
  }
  .draft-chip--warning {
    background: var(--warning-soft);
    color: var(--warning-text);
  }
  .draft-chip--danger {
    background: var(--danger-soft);
    color: var(--danger-text);
  }
  .draft-chip--info {
    background: var(--info-soft);
    color: var(--info-text);
  }

  .hue-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .hue-row {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) 2fr auto;
    grid-template-areas:
      "head range num"
      "desc range num";
    align-items: center;
    gap: 4px 12px;
  }
  .hue-head {
    grid-area: head;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .hue-controls {
    grid-area: range;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  /* 色块兼作展开按钮：reset 掉 button 的默认外观，只留一块颜色 */
  .hue-swatch {
    width: 16px;
    height: 16px;
    padding: 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-strong);
    flex-shrink: 0;
    cursor: pointer;
  }
  .hue-swatch:hover {
    border-color: var(--primary);
  }
  .hue-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-strong);
  }
  .hue-token {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
  }
  .hue-warn {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: var(--radius-sm);
    background: var(--warning-soft);
    color: var(--warning-text);
    white-space: nowrap;
  }
  /* 色票按钮：一整块色相，悬停才显出「可点」 */
  .hue-pick {
    position: relative;
    flex: 1;
    min-width: 0;
    height: 28px;
    padding: 0 10px;
    display: flex;
    align-items: center;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-strong);
    cursor: pointer;
    overflow: hidden;
    transition:
      border-color 0.15s,
      transform 0.1s;
  }
  /* 色票外面套了 Tooltip 触发器：它继承了原来按钮的 flex:1，按钮再靠
     flex:1 撑满触发器，视觉宽度才和改造前一致。 */
  .hue-controls :global(.hue-pick-tip) {
    flex: 1;
    min-width: 0;
    display: flex;
  }
  .hue-pick:hover {
    border-color: var(--primary);
  }
  .hue-pick:active {
    transform: scale(0.985);
  }
  .hue-pick:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  /* 半透明压一层深色，白/浅色票上也能读清 RGB 数字 */
  .hue-pick-label {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.2px;
    color: #fff;
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.55);
    pointer-events: none;
  }
  .hue-num {
    width: 86px;
    flex-shrink: 0;
    height: 28px;
    padding: 0 6px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
    text-transform: lowercase;
  }
  .hue-desc {
    grid-area: desc;
    font-size: 12px;
    color: var(--text-muted);
  }
  /* ── 完整调色盘 ─────────────────────────────────────────────────────────
     左边是色板 + 色条 + 常用色，右边是角色列表。色板横向铺满 360 个色相，
     纵向叠一层黑→透明白，纯 CSS，不需要 canvas，也不吃 JS 性能。 */
  .palette {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 220px;
    gap: 24px;
    align-items: start;
  }
  .palette-main {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .palette-plane {
    position: relative;
    height: 180px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    cursor: crosshair;
    touch-action: none;
    background: linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff 0%, var(--plane-hue) 100%);
  }
  .palette-plane:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 3px;
  }
  /* 游标：内圈就是当前颜色，白色圆环 + 深色外描边，深浅底色上都看得见 */
  .palette-cursor {
    position: absolute;
    width: 16px;
    height: 16px;
    margin-left: -8px;
    margin-top: -8px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow:
      0 0 0 1px rgb(0 0 0 / 0.45),
      inset 0 0 0 1px rgb(0 0 0 / 0.45);
    pointer-events: none;
  }
  .palette-axes {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .palette-axis {
    display: grid;
    grid-template-columns: 48px 1fr 40px;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .palette-axis-val {
    font-family: var(--font-mono);
    font-size: 11px;
    text-align: right;
    color: var(--text);
  }
  .palette-axis-range {
    width: 100%;
    height: 14px;
    margin: 0;
    accent-color: var(--primary);
    cursor: pointer;
  }
  /* 色条是按钮而不是 range：轨道由渐变画，滑块是内部一个圆点 */
  .palette-slider {
    position: relative;
    width: 100%;
    height: 16px;
    padding: 0;
    appearance: none;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: linear-gradient(to right, rgb(255, 79, 79), rgb(255, 208, 79), rgb(176, 255, 79), rgb(79, 255, 172), rgb(79, 208, 255), rgb(79, 79, 255), rgb(176, 79, 255), rgb(255, 79, 172), rgb(255, 79, 79));
    cursor: pointer;
    touch-action: none;
  }
  .palette-slider:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 3px;
  }
  .palette-slider-thumb {
    position: absolute;
    top: 50%;
    width: 18px;
    height: 18px;
    margin-left: -9px;
    margin-top: -9px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--border-strong);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.3);
    pointer-events: none;
  }
  .palette-meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .palette-current {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-strong);
  }
  .palette-hex {
    width: 96px;
    height: var(--height-sm);
    padding: 0 8px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    text-transform: lowercase;
  }
  .palette-hex::placeholder {
    color: var(--text-muted);
    text-transform: none;
  }
  .palette-hex:focus-visible {
    outline: none;
    border-color: var(--primary);
  }
  .palette-hueval {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-muted);
  }
  .palette-swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .palette-swatch {
    width: 22px;
    height: 22px;
    padding: 0;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-strong);
    cursor: pointer;
  }
  .palette-swatch:hover {
    transform: scale(1.12);
  }
  .palette-side {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  /* 始终占位（visibility 隐藏），避免首次改色时高度突变把取色板顶上移 */
  .palette-reset {
    align-self: flex-start;
  }
  .palette-side-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
  }
  .palette-roles {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .palette-role {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    font-size: 13px;
    text-align: left;
    color: var(--text);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
  }
  .palette-role:hover {
    background: var(--surface-3);
  }
  .palette-role.is-active {
    background: var(--accent-sub);
    color: var(--primary);
  }
  .palette-role code {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
  }
  .palette-role-dot {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 1px solid var(--border-strong);
  }
  .palette-note {
    margin: 0;
    padding: 8px 0 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-muted);
    border-top: 1px solid var(--border);
  }

  /* ── 全部颜色变量 ─────────────────────────────────────────────────────────
     色块本身只声明 `background: var(--token)`，值由下面的 $effect 量出来。
     预览区自带一套 light / dark 变量作用域，所以两个主题能直接对照。 */
  .ct-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .ct-bar-label {
    font-size: 12px;
    color: var(--text-muted);
  }
  .ct-seg {
    display: flex;
    gap: 6px;
  }
  .ct-count {
    margin-left: auto;
    font-size: 12px;
    color: var(--text-muted);
  }
  .ct-hint {
    font-size: 12px;
    color: var(--text-muted);
  }
  .ct-hint code {
    padding: 1px 4px;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 11px;
  }
  /* 预览画布：淡入用 --bg，和卡片自己的 --surface 拉开一层，看起来像「另一套主题的纸」。
     color 也要在这里重设：容器本身继承的是页面那一套 --text，
     不显式声明的话，没写 color 的后代文字会停在页面的颜色上。 */
  .ct-scope {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--bg);
    color: var(--text);

    /* 别名必须在本作用域里重新声明一次。
       自定义属性的 var() 是在「声明所在的元素」上就替换掉的，所以 :root 上的
       --primary: var(--accent) 一旦在 html 上算成亮色，就会以那个结果继承下来，
       嵌套的 .dark 容器怎么改 --accent 都追不回来。
       重声明 = 让这些 var() 在这个子树里重新求值，暗色那张表才和真实暗色一致。
       （--secondary-soft 这类具体色值不重声明：它在暗色下本来就没有覆盖，
       落回 :root 属于真实行为，照原样显示。） */
    --neutral-bg: var(--bg);
    --neutral-surface: var(--surface);
    --neutral-surface-2: var(--surface-2);
    --neutral-border: var(--border);
    --background: var(--bg);
    --foreground: var(--text);
    --card: var(--surface);
    --card-foreground: var(--text);
    --popover: var(--surface);
    --popover-foreground: var(--text);
    --primary-foreground: var(--accent-text);
    --secondary-foreground: var(--secondary-text);
    --muted: var(--surface-2);
    --muted-foreground: var(--text-muted);
    --accent-surface: var(--surface-2);
    --accent-foreground: var(--secondary-text);
    --destructive: var(--danger);
    --input: var(--border);
    --ring: var(--accent);
    --primary: var(--accent);
    --primary-hover: var(--accent-hover);
    --primary-soft: var(--accent-sub);
    --primary-text: var(--accent-text);
    --success-bg: var(--success-soft);
    --info-bg: var(--info-soft);
    --warning-bg: var(--warning-soft);
    --danger-bg: var(--danger-soft);
  }
  .ct-group-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }
  .ct-group-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-strong);
  }
  .ct-group-note {
    font-size: 11px;
    color: var(--text-muted);
  }
  .ct-group-count {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
  }
  .ct-grid,
  .ct-grad-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 2px;
  }
  /* 色带比色块宽，一行放不下就自动换行（4 条渐变最多 2 列） */
  .ct-grad-list {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  /* Tooltip 的触发器是组件内部的 span（inline-flex），要撑满格子只有 :global 够得到 */
  .ct-grid :global(.ct-tip),
  .ct-grad-list :global(.ct-tip) {
    display: block;
    min-width: 0;
  }
  .ct-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-width: 0;
    padding: 5px 6px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.12s;
  }
  .ct-item:hover {
    background: var(--surface-2);
  }
  .ct-item:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: -2px;
  }
  /* 棋盘格垫底：overlay / *-soft / border 都是半透明的，白底上看不出「透」。
     格子 6px：8px 时一块 36px 的色块只剩 4×4 大格，半透明色看着像马赛克，
     反而是格子本身抢了颜色。 */
  .ct-chip {
    position: relative;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-strong);
    overflow: hidden;
    background-image: repeating-conic-gradient(var(--surface-3) 0% 25%, var(--surface) 0% 50%);
    background-size: 6px 6px;
  }
  /* 渐变是实色，不垫棋盘格；拉成一条才看得出 -30° → +30° 的走向 */
  .ct-chip--grad {
    width: 88px;
    border-radius: 999px;
    background-image: none;
    background-color: var(--surface-2);
  }
  .ct-fill {
    position: absolute;
    inset: 0;
  }
  .ct-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .ct-name {
    overflow: hidden;
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 11.5px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .ct-val {
    overflow: hidden;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 11px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .ct-val.is-copied {
    color: var(--accent);
  }
  .ct-note {
    margin: 12px 0 0;
    font-size: 12px;
    line-height: 1.7;
    color: var(--text-muted);
  }
  .ct-note code {
    padding: 1px 4px;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 11px;
  }
</style>

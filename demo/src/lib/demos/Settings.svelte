<script lang="ts">
  import { Card, Page, Separator, Button, Notification, Row, CodeBlock } from "goose-ui";
  import {
    HUE_ROLES,
    colorStore,
    setColor,
    parseColor,
    formatHex,
    normalizeHex,
    setColors,
    DEFAULT_COLORS,
    type HueRole,
    type OklchColor,
  } from "goose-ui";
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
  onpointerdown={(e) => pick(e)}
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
  import { setColor, parseColor } from "goose-ui";

  // 横轴给色相、纵轴给明度；彩度保持不变，纯白纯黑时自然收敛到 0
  const pick = (e: PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setColor("accent", { l: 1 - y, c: color.c, h: (x * 360) % 360 });
  };
  const pickHue = (e: PointerEvent) =>
    setColor("accent", { ...color, h: hueAt(e) });
  const commit = (raw: string) => {
    const c = parseColor(raw); // "#48f" / "#4488ff" / "oklch(0.6 0.2 264)"
    if (c) setColor("accent", c);
  };
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

  /** 当前角色在配色盘上的颜色：草稿里改过就用它，否则从主题默认 hex 反解 */
  const paletteColor = $derived.by(() => {
    const hex = draft.colors[paletteRole] ?? DEFAULT_COLORS[paletteRole];
    return parseColor(hex) ?? { l: 0.6, c: 0.2, h: 264 };
  });

  const paletteHue = $derived(paletteColor.h);
  const paletteHex = $derived(formatHex(paletteColor));
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
  const draftPreset = $derived(
    PRESETS.find((p) => HUE_ROLES.every((r) => (draft.colors[r] ?? DEFAULT_COLORS[r]) === p.colors[r]))?.name ?? "",
  );

  /** 手写输入的十六进制，失焦或回车才落地，避免半截输入被当成颜色 */
  let hexInput = $state("");
  $effect(() => {
    hexInput = paletteHex;
  });

  /* ---------- 取色：拖动时按 rAF 合并，一帧最多落地一次 ---------- */

  // 拖动期间缓存指针所在的矩形，避免每次 pointermove 都触发一次强制布局
  let dragRect: DOMRect | null = null;
  let pending: { x: number; y: number } | null = null;
  let rafId = 0;

  const ratio = (e: PointerEvent, rect: DOMRect): { x: number; y: number } => ({
    x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
  });

  /** 色板：横轴 = 色相，纵轴 = 明度（上亮下暗），点哪算哪 */
  function pickSv(e: PointerEvent): void {
    const el = e.currentTarget as HTMLElement;
    // 只在落下时量一次，拖动过程复用
    if (!dragRect) dragRect = el.getBoundingClientRect();
    applySv(ratio(e, dragRect));
  }

  function applySv({ x, y }: { x: number; y: number }): void {
    // 纵向：顶端 L=1（纯白），底端 L=0（纯黑）
    const l = 1 - y;
    // 彩度随明度两端收敛到 0，这样拉到底就是真正无彩色的白/黑
    const c = paletteColor.c * Math.min(1, Math.min(l, 1 - l) * 4);
    draftSetColor(paletteRole, { l, c: l <= 0.001 || l >= 0.999 ? 0 : c, h: normHue(x * 360) });
  }

  /** 色条：直接改色相 */
  function pickHue(e: PointerEvent): void {
    const el = e.currentTarget as HTMLElement;
    if (!dragRect) dragRect = el.getBoundingClientRect();
    const { x } = ratio(e, dragRect);
    draftSetColor(paletteRole, { ...paletteColor, h: normHue(x * 360) });
  }

  /** 队列化：同一帧内的多次 pointermove 只保留最后一次，落地也合并到 rAF 之后 */
  function queueSv(x: number, y: number): void {
    pending = { x, y };
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      if (!pending) return;
      const p = pending;
      pending = null;
      applySv(p);
    });
  }

  function endDrag(): void {
    dragRect = null;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (pending) {
      const p = pending;
      pending = null;
      applySv(p);
    }
  }

  /** 色板指针事件入口：落下立即生效（点击要即时反馈），拖动走队列 */
  function onSvPointerDown(e: PointerEvent): void {
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture?.(e.pointerId);
    dragRect = el.getBoundingClientRect();
    applySv(ratio(e, dragRect));
  }

  function onSvPointerMove(e: PointerEvent): void {
    if (!dragRect) return;
    const { x, y } = ratio(e, dragRect);
    queueSv(x, y);
  }

  function onHuePointerDown(e: PointerEvent): void {
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture?.(e.pointerId);
    dragRect = el.getBoundingClientRect();
    pickHue(e);
  }

  function onHuePointerMove(e: PointerEvent): void {
    if (!dragRect) return;
    pickHue(e);
  }

  /** 饱和度：0 → 灰，1 → 当前色相的最大彩度；拉到 0（以及明度到两端）就是纯中性色 */
  function setSaturation(v: number): void {
    draftSetColor(paletteRole, { ...paletteColor, c: 0.4 * Math.min(1, Math.max(0, v)) });
  }

  /** 明度：0 → 纯黑，1 → 纯白。到端点时彩度归零，避免"0.0004 彩度的假白" */
  function setLightness(v: number): void {
    const l = Math.min(1, Math.max(0, v));
    const c = l <= 0.001 || l >= 0.999 ? 0 : paletteColor.c;
    draftSetColor(paletteRole, { ...paletteColor, l, c });
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
</script>

<Page
  toc
  class="settings-page"
  title="设置 Settings"
  description="主题色配置：六个角色各一个 hex，可选预设或直接手写"
>
  <CodePreview anchor="theme-color" anchorLevel={2} title="主题色配置（全局生效）" code={cssSource}>
    <div class="hue-list">
      {#each HUE_ROLES as role (role)}
        {@const meta = ROLE_META[role]}
        {@const hue = parseColor(draftHex(role))?.h ?? 0}
        {@const inSafe = hue >= meta.safe[0] && hue <= meta.safe[1]}
        <div class="hue-row">
          <div class="hue-head">
            <!-- 色块兼作跳转按钮：点一下把下面的完整调色盘切到这个角色 -->
            <button
              class="hue-swatch"
              style:background={draftHex(role)}
              title={`在调色盘里编辑${meta.label}`}
              aria-label={`在调色盘里编辑${meta.label}`}
              onclick={() => openPicker(role)}
            ></button>
            <span class="hue-name">{meta.label}</span>
            <code class="hue-token">{draft.colors[role] ? `--c-${role}` : `--${role}`}</code>
            {#if !inSafe}
              <span class="hue-warn" title="该色相在此角色上对比度可能偏低">对比度提示</span>
            {/if}
          </div>
          <div class="hue-controls">
            <!-- 色票按钮就是入口：点它弹出下面的完整调色盘，不再在行内塞滑块 -->
            <button
              class="hue-pick"
              style:background={draftHex(role)}
              title="点击打开调色盘"
              aria-label={`为${meta.label}打开调色盘`}
              onclick={() => openPicker(role)}
            >
              <span class="hue-pick-label">{draftHex(role)}</span>
            </button>
            <input
              class="hue-num"
              type="text"
              value={draftHex(role)}
              spellcheck="false"
              aria-label={`${meta.label}颜色（#rgb 或 #rrggbb）`}
              onkeydown={(e) => {
                if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
              }}
              onchange={(e) => commitRow(role, e.currentTarget.value, e.currentTarget)}
            />
          </div>
          <span class="hue-desc">{meta.desc}</span>
        </div>
      {/each}
    </div>

    <Separator />

    <Row style="align-items:center;gap:8px;flex-wrap:wrap">
      <span class="hue-desc">预设：</span>
      {#each PRESETS as p (p.name)}
        <Button
          size="small"
          variant={draftPreset === p.name ? "primary" : "default"}
          onclick={() => applyPreset(p.colors)}
        >
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
        }}
      >
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
      改动先落进草稿，点「保存」才全局生效（按钮、激活项、焦点环、进度条、通知等一并跟随），
      并持久化到 <code>localStorage</code>。颜色一律以 hex 保存，直接覆盖主题里的默认值。
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

  <CodePreview
    anchor="theme-wheel"
    anchorLevel={2}
    title="配色盘（完整调色）"
    code={paletteSource}
    flush
  >
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
          aria-valuetext={`色相 ${paletteHue}°，明度 ${Math.round(paletteColor.l * 100)}%`}
          style:--plane-hue={paletteHex}
          onpointerdown={onSvPointerDown}
          onpointermove={onSvPointerMove}
          onpointerup={endDrag}
          onpointercancel={endDrag}
          onkeydown={(e) => {
            const step = e.shiftKey ? 10 : 1;
            if (e.key === "ArrowRight") draftSetColor(paletteRole, { ...paletteColor, h: normHue(paletteHue + step) });
            else if (e.key === "ArrowLeft") draftSetColor(paletteRole, { ...paletteColor, h: normHue(paletteHue - step) });
            else if (e.key === "ArrowUp")
              draftSetColor(paletteRole, { ...paletteColor, l: Math.min(1, paletteColor.l + step / 100) });
            else if (e.key === "ArrowDown")
              draftSetColor(paletteRole, { ...paletteColor, l: Math.max(0, paletteColor.l - step / 100) });
            else return;
            e.preventDefault();
          }}
        >
          <span
            class="palette-cursor"
            style:left={`${(paletteHue / 360) * 100}%`}
            style:top={`${(1 - paletteColor.l) * 100}%`}
            style:background={paletteHex}
          ></span>
        </div>

        <div class="palette-strip">
          <!-- 色条不用原生 range：range 的轨道样式在各个浏览器里不好统一，
               这里用一条渐变按钮 + 指针坐标换算，点击与拖动行为一致 -->
          <button
            class="palette-slider"
            type="button"
            aria-label="色相"
            onpointerdown={onHuePointerDown}
            onpointermove={onHuePointerMove}
            onpointerup={endDrag}
            onpointercancel={endDrag}
          >
            <span class="palette-slider-thumb" style:left={`${(paletteHue / 360) * 100}%`}></span>
          </button>
        </div>

        <!-- 明度与饱和度：色板纵轴能选明度，这两条滑块用来精确微调 -->
        <div class="palette-axes">
          <label class="palette-axis">
            <span class="palette-axis-label">明度</span>
            <input
              class="palette-axis-range"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={paletteColor.l}
              oninput={(e) => setLightness(Number(e.currentTarget.value))}
              aria-label="明度"
            />
            <span class="palette-axis-val">{Math.round(paletteColor.l * 100)}%</span>
          </label>
          <label class="palette-axis">
            <span class="palette-axis-label">饱和度</span>
            <input
              class="palette-axis-range"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={paletteColor.c / 0.4}
              oninput={(e) => setSaturation(Number(e.currentTarget.value))}
              aria-label="饱和度"
            />
            <span class="palette-axis-val">{Math.round((paletteColor.c / 0.4) * 100)}%</span>
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
            }}
          />
          <span class="palette-hueval">H {paletteHue}°</span>
        </div>

        <div class="palette-swatches">
          {#each SWATCHES as sw (sw.name)}
            <button
              class="palette-swatch"
              style:background={sw.hex}
              title="{sw.name}（{sw.hex}）"
              aria-label="使用{sw.name}"
              onclick={() => {
                const c = parseColor(sw.hex);
                if (c) draftSetColor(paletteRole, c);
              }}
            ></button>
          {/each}
        </div>
      </div>

      <div class="palette-side">
        <span class="palette-side-title">调整的角色</span>
        <div class="palette-roles">
          {#each HUE_ROLES as r (r)}
            <button
              class="palette-role"
              class:is-active={paletteRole === r}
              class:is-custom={draft.colors[r] !== undefined}
              onclick={() => (paletteRole = r)}
            >
              <span class="palette-role-dot" style:background={draftHex(r)}></span>
              {ROLE_META[r].label}
              <code>{draftHex(r)}</code>
            </button>
          {/each}
        </div>
        <p class="palette-note">
          {ROLE_META[paletteRole].desc}。色板横轴是色相、纵轴是明度，两条滑块精确微调；
          纯白、纯黑直接把明度拉到底即可。选中的颜色会写成 hex 存进 <code>{`--c-${paletteRole}`}</code>，
          保存后覆盖主题里的默认色。
        </p>
        {#if paletteCustom}
          <Button
            variant="ghost"
            onclick={() => {
              draftSetColor(paletteRole, null);
              Notification.success("已恢复为默认色");
            }}
          >
            <RotateCcw size={14} />
            恢复为默认色
          </Button>
        {/if}
      </div>
    </div>
  </CodePreview>

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
    background:
      linear-gradient(to bottom, transparent, #000),
      linear-gradient(to right, #fff 0%, var(--plane-hue) 100%);
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
    background: linear-gradient(
      to right,
      rgb(255, 79, 79),
      rgb(255, 208, 79),
      rgb(176, 255, 79),
      rgb(79, 255, 172),
      rgb(79, 208, 255),
      rgb(79, 79, 255),
      rgb(176, 79, 255),
      rgb(255, 79, 172),
      rgb(255, 79, 79)
    );
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
</style>

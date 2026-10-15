<script lang="ts">
  import { Card, Page, Separator, Button, Notification, Row, CodeBlock } from "goose-ui";
  import {
    hueStore,
    setHue,
    setHues,
    resetHues,
    DEFAULT_HUES,
    HUE_ROLES,
    type HueRole,
  } from "goose-ui";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  /** 角色元信息：中文名 + 用途 + 推荐色相区间 */
  const ROLE_META: Record<HueRole, { label: string; desc: string; safe: [number, number] }> = {
    accent: { label: "强调色", desc: "激活项、主按钮、焦点环", safe: [200, 300] },
    complement: { label: "互补色", desc: "强调位/对比位、进度渐变终点", safe: [120, 200] },
    danger: { label: "危险", desc: "删除、错误、失败", safe: [10, 40] },
    success: { label: "完成", desc: "成功、通过、已保存", safe: [120, 170] },
    warning: { label: "警告", desc: "注意、风险、待处理", safe: [60, 95] },
    info: { label: "信息", desc: "提示、中性通知、说明", safe: [220, 270] },
  };

  /** 一键预设：整套色相一起换 */
  const PRESETS: { name: string; hues: Partial<Record<HueRole, number>> }[] = [
    { name: "靛蓝（默认）", hues: { accent: 264, complement: 160, info: 250 } },
    { name: "海蓝", hues: { accent: 235, complement: 170, info: 210 } },
    { name: "青碧", hues: { accent: 190, complement: 300, info: 205 } },
    { name: "翠绿", hues: { accent: 155, complement: 300, info: 190 } },
    { name: "藤紫", hues: { accent: 300, complement: 150, info: 275 } },
    { name: "玫红", hues: { accent: 350, complement: 190, info: 330 } },
    { name: "暖橙", hues: { accent: 45, complement: 230, info: 30 } },
  ];

  const hueProps: PropsTableItem[] = [
    { name: "role", desc: "色彩角色", type: "'accent' | 'complement' | 'danger' | 'success' | 'warning' | 'info'" },
    { name: "hue", desc: "色相角度（自动折到 0–360）", type: "number" },
  ];

  const apiProps: PropsTableItem[] = [
    { name: "setHue(role, hue)", desc: "设置单个角色色相并持久化", type: "void" },
    { name: "setHues(partial)", desc: "批量设置色相并持久化", type: "void" },
    { name: "resetHues()", desc: "恢复默认色相并清除持久化", type: "void" },
    { name: "getHues()", desc: "读取当前色相副本", type: "HueMap" },
    { name: "hueStore.hues", desc: "响应式色相状态（可双向绑定）", type: "HueMap" },
    { name: "DEFAULT_HUES", desc: "默认色相常量", type: "HueMap" },
  ];

  const cssSource = `/* 方式一：纯 CSS，零 JS —— 覆盖 :root 的色相旋钮即可 */
:root {
  --hue-accent: 25;      /* 强调色 */
  --hue-complement: 230; /* 互补色 */
  --hue-info: 30;        /* 信息 */
  --hue-danger: 25;      /* 危险 */
  --hue-success: 145;    /* 完成 */
  --hue-warning: 75;     /* 警告 */
}`;

  const jsSource = `<script lang="ts">
  import { setHue, setHues, resetHues } from "goose-ui";

  setHue("accent", 25);                      // 单改
  setHues({ accent: 25, info: 30 });         // 批量
  resetHues();                               // 恢复默认
<\/script>`;

  const applyPreset = (h: Partial<Record<HueRole, number>>) => {
    setHues(h);
    Notification.success("已应用预设配色");
  };
</script>

<Page title="设置 Settings" description="主题色配置：只调色相，明度与彩度按亮暗主题自动派生">
  <CodePreview title="主题色配置（全局生效）" code={cssSource}>
    <div class="hue-list">
      {#each HUE_ROLES as role (role)}
        {@const meta = ROLE_META[role]}
        {@const hue = hueStore.hues[role]}
        {@const inSafe = hue >= meta.safe[0] && hue <= meta.safe[1]}
        <div class="hue-row">
          <div class="hue-head">
            <span class="hue-swatch" style="background: oklch(0.58 0.2 {hue})"></span>
            <span class="hue-name">{meta.label}</span>
            <code class="hue-token">--hue-{role}</code>
            {#if !inSafe}
              <span class="hue-warn" title="该色相在此角色上对比度可能偏低">对比度提示</span>
            {/if}
          </div>
          <input
            class="hue-range"
            type="range"
            min="0"
            max="359"
            value={hue}
            oninput={(e) => setHue(role, Number((e.currentTarget as HTMLInputElement).value))}
            aria-label="{meta.label}色相"
          />
          <input
            class="hue-num"
            type="number"
            min="0"
            max="359"
            value={hue}
            oninput={(e) => setHue(role, Number((e.currentTarget as HTMLInputElement).value))}
            aria-label="{meta.label}色相数值"
          />
          <span class="hue-desc">{meta.desc}</span>
        </div>
      {/each}
    </div>

    <Separator />

    <Row style="align-items:center;gap:8px;flex-wrap:wrap">
      <span class="hue-desc">预设：</span>
      {#each PRESETS as p (p.name)}
        <Button size="small" variant="default" onclick={() => applyPreset(p.hues)}>{p.name}</Button>
      {/each}
      <Button
        size="small"
        variant="ghost"
        icon={RotateCcw}
        iconSize={14}
        onclick={() => {
          resetHues();
          Notification.info("已恢复默认配色");
        }}
      >
        恢复默认
      </Button>
    </Row>

    <p class="hue-note">
      改动即时全局生效（按钮、激活项、焦点环、进度条、通知等一并跟随），并持久化到
      <code>localStorage</code>。只调色相是有意为之：明度与彩度由系统按亮暗主题派生，
      因此不会配出对比度崩掉的主题。标「对比度提示」的角色表示当前色相在该用途下文字对比度可能偏低。
    </p>

    <Separator />

    <div class="hue-jsapi">
      <span class="hue-desc">若要在代码里设置（可持久化）：</span>
      <CodeBlock code={jsSource} language="svelte" showHeader={false} maxHeight="200px" />
    </div>
  </CodePreview>

  <Card title="JS API（可持久化 / 供设置界面调用）">
    <PropsTable items={apiProps} />
  </Card>

  <Card title="HueRole 参数">
    <PropsTable items={hueProps} />
    <p class="hue-note">
      默认值：{HUE_ROLES.map((r) => `${r}=${DEFAULT_HUES[r]}`).join("、")}
    </p>
  </Card>
</Page>

<style>
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
  .hue-swatch {
    width: 16px;
    height: 16px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-strong);
    flex-shrink: 0;
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
  .hue-range {
    grid-area: range;
    width: 100%;
    accent-color: var(--accent);
  }
  .hue-num {
    grid-area: num;
    width: 64px;
    height: 28px;
    padding: 0 6px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    background: var(--surface);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
  }
  .hue-desc {
    grid-area: desc;
    font-size: 12px;
    color: var(--text-muted);
  }
  .hue-note {
    margin: 12px 0 0;
    font-size: 12px;
    line-height: 1.8;
    color: var(--text-muted);
  }
  .hue-note code {
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--accent-sub);
    color: var(--accent);
  }
  .hue-jsapi {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>

# 主题定制

主题 API、主题色 API、CSS 变量与全局工具类。

## 主题 API

```ts
import { themeStore, setTheme, toggleTheme, toggleThemeFromEvent, initTheme } from "goose-ui";

themeStore.theme; // 'light' | 'dark'，响应式，多实例共享
setTheme("dark"); // 显式设置并持久化
toggleTheme(); // 切换（传 { x, y } 时启用圆形扩散转场）
toggleThemeFromEvent; // 主题按钮回调：以按钮中心为圆心圆形扩散，直接作 onThemeToggle 传入
initTheme(); // 幂等：应用持久化/系统偏好 + 主题色（ThemeToggle 挂载时自动调用）
```

单独使用 `<ThemeToggle />` 无需任何配置：自动读取偏好、持久化、同步所有实例。

## 主题色 API

```ts
import { setColor, setColors, resetColors, getColors, colorStore, formatHex, normalizeHex, maxChroma, parseColor, DEFAULT_COLORS } from "goose-ui";

setColor("accent", "#1850ec"); // 单改，接受 #rgb / #rrggbb / oklch(...) / {l,c,h}
setColors({ accent: "#1850ec", info: "#3c82f6" }); // 批量
setColor("accent", null); // 清除自定义，回到主题默认
getColors(); // { accent: "#1850ec", ... }（只含被自定义的角色）
normalizeHex("#48f"); // "#4488ff"（非 hex 返回 null）
formatHex({ l: 0.6, c: 0.2, h: 264 }); // "#6a5fd8"
parseColor("#48f"); // { l, c, h }
maxChroma(0.6, 264); // 该明度/色相在 sRGB 内的彩度上限
DEFAULT_COLORS; // { accent: "#1850ec", ... } 六个角色的默认 hex
```

- 颜色写入 `<html>` 内联样式（`--c-<角色>`），全局生效（含浮层、portal 元素），并持久化到 `localStorage`
- 同时自动派生并写入 `--c-<角色>-hover` 与 `--c-<角色>-text`；切换亮暗主题时按新主题重算
- 六个角色：`accent`（主色）/ `complement`（互补色），以及 `success`（完成）/ `info`（信息）/ `warning`（警告）/ `danger`（危险）
- **纯 CSS 也能配**，无需任何 JS——直接覆盖角色变量，见下文[改颜色](#改颜色直接覆盖-hex)
- 需要按色相联动时（让依赖色相偏移的渐变跟着走）用 `setHue(role, hue)` / `--hue-<角色>`，见下文

## 色彩角色对照

| 角色                      | 变量                                                                                         | 用途                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 主色                      | `--accent` / `--accent-hover` / `--accent-text`                                              | 激活项、主按钮、选中态；无持久选中项的动作菜单落点 pill |
| 副强调色                  | `--accent-sub`                                                                               | 低透明度主色：选中项的淡染底（**不用于 pill / hover**） |
| 焦点环 / 选中强调         | `--accent-ring` / `--accent-strong`                                                          | 焦点外圈 / 更重的选中底色                               |
| 互补色                    | `--complement` / `--complement-hover` / `--complement-sub`                                   | 与主色形成对比的位置                                    |
| 中性黑/灰                 | `--neutral-bg` / `--neutral-surface` / `--neutral-surface-2` / `--neutral-border`            | 大面积背景填充（无彩色，不参与色相配置）                |
| 完成 / 信息 / 警告 / 危险 | `--success` / `--info` / `--warning` / `--danger`（各带 `-hover` `-soft` `-text` `-border`） | 状态语义                                                |
| 渐变                      | `--gradient-accent` / `--gradient-accent-hover`                                              | 全项目唯一一套，见下节                                  |

## 渐变只有一套

所有「主色渐变」都引用同一组 token：`var(--gradient-accent)`（TitleBar logo、ProgressBar / Meter / Slider 填充）。

- 色相规则固定：**主色色相 `-30°` → `+30°`，跨度 60°**，中点落在主色上；换主题色时整条跟着转
- `--gradient-accent-hover` 只提亮一档、色相不动，用在真有 hover 的地方（TitleBar logo 悬停、Slider 悬停/拖动）
- `--titlebar-logo-gradient` / `--titlebar-logo-gradient-hover` 是旧名，值等于上面两个 token，已有覆盖写法继续有效

> demo 侧栏「设置」页提供可视化调节：6 个角色 + 7 套预设 + 实时预览 + 恢复默认；页面末尾「全部颜色变量」列出 `theme.css` 全部 token，点色块直接复制 `var(--token)`。

## 改颜色：直接覆盖 hex

每个角色在亮色、暗色主题里各有一份 hex 默认值，改哪个覆盖哪个即可：

```css
:root {
  --accent: #1850ec; /* 主色 */
  --complement: #009145; /* 互补色 */
}

.dark {
  --accent: #3b76ff; /* 暗色主题单独给一份 */
}
```

`-hover` / `-soft` / `-text` / `-border` 由 `--accent` 用 `color-mix()` 派生，改主色即可连带生效；需要单独调时再覆盖同名变量。**这是推荐方式**。

### 需要按色相联动时

`--hue-*` 只服务于「需要取邻近色相」的渐变（当前只有 `--gradient-accent` 使用），改它不会动 hex 默认值：

```css
:root {
  --hue-accent: 25; /* 只影响依赖色相的计算 */
}
```

### 需要完全自定义时

所有组件都消费 CSS 自定义属性，覆盖 `:root` 即可（完整清单见 `src/lib/styles/theme.css`）：

```css
:root {
  /* 主色 */
  --accent: #1850ec;
  --accent-sub: color-mix(in srgb, var(--accent) 15%, transparent);

  /* 状态色 */
  --danger: #dc2627;
  --success: #1ec55f;
  --warning: #f59e0a;
  --info: #3c82f6;

  /* 中性面与文字 */
  --bg: #f5f5f5;
  --surface: #fafaf7;
  --text: #2c2c2e;
  --border: #e0dfda;
}
```

- 旧名 `--primary` / `--primary-hover` / `--primary-soft` / `--primary-text` 仍然可用，是 `--accent` 体系的别名
- 中性色（`--bg` / `--surface*` / `--border`）不参与色相配置——大面积背景不应被染色
- 浮层（菜单 / 气泡 / 下拉列表）底色单独由 `--popup-surface` 控制（亮色 `#ffffff`、暗色 `#000000`），改浮层底色只覆盖这一个 token
- 暗色主题通过 `.dark` 或 `[data-theme="dark"]` 类名切换；子树内用 `.light` 类可局部恢复浅色 token

## 工具类（theme.css 全局提供）

| 类                    | 作用                      | 动画                                                              |
| --------------------- | ------------------------- | ----------------------------------------------------------------- |
| `.animate-fade-slide` | 淡入上滑一次（入场强调）  | `fadeSlideUp` 0.3s ease-in-out（opacity 0→1 + translateY 10px→0） |
| `.animate-nav-slide`  | 下滑入场一次              | `navSlideDown` 0.5s ease-out（translateY -100%→0）                |
| `.animate-float-doro` | 悬浮轻浮动循环            | `float-doro` 2.5s infinite（±4px，自带 `will-change: transform`） |
| `.skeleton-shine`     | 骨架屏横向光扫            | 渐变光带 `background-position` 200%→-200%，2s 线性循环            |
| `.status-dot-online`  | 在线状态圆点（绿 + 光晕） | `pulse` 2s 呼吸（opacity 1↔0.5）                                  |
| `.status-dot-offline` | 离线状态圆点（红）        | 无动画                                                            |

- 直接挂在任意元素上即可，无前置条件
- `.animate-*` 为一次性动画：元素重新显示时会从头重播；页面级入场请交给 `Page` 过渡统一处理

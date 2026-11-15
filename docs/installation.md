# 安装与接入

## 预览 Demo

克隆仓库后启动本地预览：

```bash
git clone https://github.com/goossee6/goose-ui.git
cd goose-ui/demo
pnpm install
pnpm dev
```

在线版：<https://goossee6.github.io/goose-ui/>

## 安装

```bash
# 推荐：跟 0.3.x 里最新的 tag，之后升级只用 pnpm update goose-ui
pnpm add "github:goossee6/goose-ui#semver:^0.3.0" @lucide/svelte
```

锁死单个版本（tag 见 <https://github.com/goossee6/goose-ui/tags>）：

```bash
pnpm add github:goossee6/goose-ui#v0.3.2
```

跟随 `main` 最新提交（构建不可复现，见[升级](installation.md#升级)）：

```bash
pnpm add github:goossee6/goose-ui @lucide/svelte
```

本地开发接入：

```bash
git clone https://github.com/goossee6/goose-ui.git ../goose-ui
pnpm add link:../goose-ui      # 软链，改组件源码即时生效
# 或
pnpm add file:../goose-ui      # 复制（hardlink）一份快照，改完要重装
```

> pnpm 的 `file:` 不是软链：它把目录复制进 `node_modules/.pnpm`，之后库里的改动**不会**自动进去，
> 表现是"库已升到 0.3.2，项目里还是 0.3.0"。要边改边看用 `link:`；npm 的 `file:` 才是软链。

> `@lucide/svelte` 是 **peer 依赖且必装**，缺了构建会直接报
> `Cannot find package '@lucide/svelte'`（原因见下文 Peer Dependencies）。

### 接入注意（Vite）

包以源码形态分发，Vite 需关闭对它的依赖预打包：

```ts
// vite.config.ts
export default defineConfig({
  plugins: [svelte()],
  optimizeDeps: { exclude: ["goose-ui"] },
});
```

### 接入注意（深色首屏）

`theme.css` 默认亮色，深色用户会先看到一帧白再切黑。在 `index.html` 的 `<head>` 里、
业务 JS 之前补一段（键名与 `themeStore` 的存储键一致）：

```html
<script>
  try {
    var t = localStorage.getItem("goose-ui-theme");
    if (t !== "dark" && t !== "light") {
      t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (t === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
</script>
```

## 升级

先确认当前装的是哪一版（本包以源码分发，`node_modules/goose-ui` 就是仓库内容，没有编译产物可查）：

```bash
grep '"version"' node_modules/goose-ui/package.json
```

### 先看自己是哪种依赖写法

| 写法 | 含义 | 怎么升 |
| --- | --- | --- |
| `github:…#semver:^0.3.0` | 自动跟 0.3.x 里最高的 tag（**推荐**） | `pnpm update goose-ui` |
| `github:…/goose-ui#v0.3.2` | 锁死在某个 tag | 改 tag 再 `pnpm install` |
| `github:goossee6/goose-ui` | 跟随 `main` 最新提交 | `pnpm update goose-ui` |
| `link:../goose-ui` | 软链到本地克隆 | 不用升级，`git pull` 后即时生效 |
| `file:../goose-ui` | 指到本地克隆，但 pnpm 会**复制**一份快照 | `pnpm install` 重新复制（想实时联动换成 `link:`） |

> `file:` 这一行最容易踩：复制发生在安装那一刻，之后库升到 0.3.2，项目里仍是老版本——
> 判断方法就是 `grep '"version"' node_modules/goose-ui/package.json`，对不上就重装一次。

本包**以源码分发、没有构建产物**，跟随 `main` 意味着任意一次提交都会进你的构建，出问题也难复现当时的代码。
所以建议用 semver 范围而不是裸 `main`：

### 不想手改 tag：用 semver 范围

```bash
pnpm add "github:goossee6/goose-ui#semver:^0.3.0" @lucide/svelte
pnpm update goose-ui          # 之后升级就这一条
```

`#semver:` 让 pnpm **按 tag 名解析**，自动选范围内最高的那个，你不用在 `package.json` 里写具体版本号。
范围怎么选（0.x 阶段尤其要看）：

| 范围 | 允许 | 适合 |
| --- | --- | --- |
| `^0.3.0` | `>=0.3.0 <0.4.0`，即只跟 `0.3.x` | 推荐：补丁与同 minor 的小改动自动跟上 |
| `~0.3.2` | `>=0.3.2 <0.4.0`，与 `^0.3.x` 等价 | 同上，但要求从 0.3.2 起 |
| `>=0.3.0` | 连 `0.4.0` 也跟 | 0.x 阶段 minor 可能带破坏性改动，慎用 |
| `*` / 省略 | 默认分支最新提交 | 不适合生产，构建不可复现 |

两个前提：

- **tag 名必须是 semver**（`v0.3.2` 可以，`release-3` 不行），否则范围解析不到任何版本。这也是发版规则的一部分
- 范围只决定"允许升到哪"，**不会自己动**：`pnpm install` 永远只按 lock 装，升版本得跑 `pnpm update goose-ui`
  （或把它放进 CI 定时任务 + 开 PR，见下）

### 为什么改了 tag 还要留意 lock

pnpm 把 git 依赖解析成**某个具体 commit 的 tarball** 写进 `pnpm-lock.yaml`：

```yaml
goose-ui@https://codeload.github.com/goossee6/goose-ui/tar.gz/f9bb744…:
  version: 0.3.2
```

也就是说锁的是 commit，不是 tag。所以在 pnpm 12 里这三条命令分工很明确（都实测过）：

| 命令 | 会升级吗 | 做什么 |
| --- | --- | --- |
| `pnpm install` | ❌ | 严格按 lock 装。specifier 变了才会重解析，否则什么都不动 |
| `pnpm install --force` | ❌ | 只把现有解析结果重装一遍，**不会**重新解析 git ref |
| `pnpm update goose-ui` | ✅ | 重新解析：取范围内最高的 tag；同名 tag 改指向了也会跟过去 |

所以"升了没效果"基本就是漏跑 `pnpm update goose-ui`。反过来说，CI 里用 `--frozen-lockfile` 时，
必须把 `pnpm update` 之后的 `pnpm-lock.yaml` 一起提交，否则装回去的还是老版本。

### 让它真的自动：放一条定时 CI

在自己项目里加个定时任务，每周跑一次 `pnpm update goose-ui`，绿灯就开 PR——升级这件事就不用记了：

```yaml
# .github/workflows/bump-goose-ui.yml
on:
  schedule: [{ cron: "0 3 * * 1" }] # 每周一 03:00
  workflow_dispatch:
jobs:
  bump:
    runs-on: ubuntu-latest
    permissions: { contents: write, pull-requests: write }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install
      - run: pnpm update goose-ui        # 只动 goose-ui，顺带改写 lock
      - run: pnpm test && pnpm build     # 红了这步就失败，不会发 PR
      - uses: peter-evans/create-pull-request@v6
        with:
          branch: chore/bump-goose-ui
          title: "chore: bump goose-ui"
          commit-message: "chore: bump goose-ui"
```

### 升级后跟着检查三件事

1. **`@lucide/svelte`**：必装 peer（`>=1.43.0`）。新组件若用到新图标，缺了会在构建期报
   `Cannot find package '@lucide/svelte'` 或图标导出不存在
2. **主题样式**：从应用入口 `import "goose-ui/styles/theme.css"` 的会自动带上新变量；但如果你在项目里
   覆盖过 `--sp-*` / `--font-*` / `--padding-*`，注意 0.3 起这些值改为指向刻度层
   （`--space-*` / `--fs-*`），覆盖点要跟着换，否则改了不生效
3. **行为变化**：小版本也可能改默认值，升之前看一眼对应 tag 的说明：

   ```bash
   git ls-remote --tags https://github.com/goossee6/goose-ui.git | tail -6
   git tag -n9 -l v0.3.2        # 在 goose-ui 仓库里看某个 tag 的说明
   ```

### 0.3.2 相比 0.3.1 的行为变化

- `Typewriter` 的 `autoPlay` 默认改为 `false`：不传就是静态展示全文，要逐字得显式 `autoPlay`
- `showConfirm()` 的短正文不再自动打字：需要时传 `{ typewriter: true }`

## 快速开始

### 1. 引入主题样式（应用入口，只需一次）

```ts
import "goose-ui/styles/theme.css";
```

### 2. 用组件

```svelte
<script lang="ts">
  import { Button, Card, Notification, NotificationProvider } from "goose-ui";
</script>

<!-- 全局挂载通知容器（App.svelte 顶层，只需一次） -->
<NotificationProvider />

<Card title="用户信息">
  <p>内容</p>
</Card>

<Button variant="primary" onclick={() => Notification.success("保存成功")}>保存</Button>
```

### 3. 需要完整应用外壳时（Wails3 / 后台应用）

`Layout` 只提供「顶栏 / 可选侧栏 / 内容卡片」三个区域，不内置 TitleBar、Sidebar 等组件——用 `titlebar` / `aside` 插槽按需组合：

```svelte
<script lang="ts">
  import {
    Layout, TitleBar, Sidebar, Page, NotificationProvider,
    themeStore, toggleThemeFromEvent,
    type SidebarEntry,
  } from "goose-ui";
  import House from "@lucide/svelte/icons/house";

  const groups: SidebarEntry[] = [
    { value: "home", label: "首页", icon: House },
    { title: "组件", items: [{ value: "button", label: "按钮" }] },
  ];
  let active = $state("home");
</script>

<NotificationProvider />

<Layout>
  {#snippet titlebar()}
    <TitleBar
      title="我的应用"
      theme={themeStore.theme}
      onThemeToggle={toggleThemeFromEvent}
    />
  {/snippet}
  {#snippet aside()}
    <Sidebar {groups} bind:activeTab={active} embedded shadow={false} />
  {/snippet}

  {#if active === "home"}
    <Page title="首页" description="内容区">…</Page>
  {:else if active === "button"}
    <Page title="按钮">…</Page>
  {/if}
</Layout>
```

- `themeStore` + `toggleThemeFromEvent` 让标题栏的主题按钮带圆形扩散转场
- 完整外壳用法见[应用外壳](shell.md)

## 导入方式

### Barrel import（推荐）

```ts
import { Button, Card, Modal, Select, Notification } from "goose-ui";
```

Vite/Rollup 会自动 tree-shake 未使用的组件。

### 直接路径 import

```ts
import Button from "goose-ui/button";
import Modal from "goose-ui/modal";
```

### 样式

```ts
import "goose-ui/styles/theme.css";
```

必须在应用入口引入一次，提供所有 CSS 变量定义。

## Peer Dependencies

| 包                        | 必需 | 说明                                                  |
| ------------------------- | ---- | ----------------------------------------------------- |
| `svelte` ^5.0.0           | ✅   | 框架                                                  |
| `@lucide/svelte` >=1.43.0 | ✅   | 图标库；十几个组件在模块顶层直接 import，缺了无法构建 |

> `dependencies` 为空：没有 clsx 之类的 class 拼接库，也没有样式运行时。
>
> **Wails3 桌面应用**：goose-ui 不依赖 `@wailsio/runtime`。窗口控制通过 `TitleBar` 的 `windowApi` prop 注入（实现 `WindowController` 接口，包一层 `@wailsio/runtime` 的 `Window` 即可）；窗口拖拽与四角缩放是纯 CSS。完整示例见 demo 的 TitleBar 页「Wails3 接入说明」。

## 开发

```bash
pnpm dev            # 起 demo（Vite）
pnpm check          # svelte-check 类型检查（带 --fail-on-warnings）
pnpm test           # 单元测试（node --test，tests/*.test.ts）
pnpm build          # 生产构建
```

CI（`.github/workflows/deploy.yml`）在构建 demo 前会先跑 `pnpm check` 与 `pnpm test`，任何类型错误、a11y 警告或单测失败都会挡住部署。

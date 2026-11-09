# goose-ui

零 CSS 框架依赖的 Svelte 5 纯 CSS 组件库，支持 Wails3 桌面应用开发。

## 特性

- **零 CSS 框架** — `dependencies` 为空，运行时只有图标库 `@lucide/svelte` 一个 peer 依赖（必装）
- **纯 CSS** — scoped `<style>` + CSS 自定义属性，主题集中在 `theme.css` 一个文件
- **Svelte 5 Runes** — 全面使用 `$props()`、`$state`、`$derived`、`$effect`
- **规模** — 86 个单文件组件，另有主题 / 通知 / 错误 / 右键菜单等模块
- **Tree-shakeable** — 按需导入，未使用的组件不会打包
- **主题** — light/dark 切换 + 6 个色相旋钮，明暗与彩度由主题派生
- **刻度化样式** — 间距 / 字号 / 圆角 / 尺寸全部走 token（4pt 主网格 + 2pt 子刻度），有脚本审计
- **可访问性** — 弹层焦点陷阱与 `aria-modal`，表单控件保留原生 `input`，键盘可完成全部操作

## 在线 Demo

**<https://goossee6.github.io/goose-ui/>**

每个用法都带「效果 / 源码」切换与一键复制；仓库内 demo 页与线上一致，本地跑法见[安装文档](docs/installation.md#预览-demo)。

## 安装

```bash
pnpm add github:goossee6/goose-ui @lucide/svelte
```

接入步骤与注意事项见[安装与接入](docs/installation.md)。

## 文档

完整地图与阅读顺序见[文档索引](docs/README.md)。

| 文档 | 内容 |
| --- | --- |
| [安装与接入](docs/installation.md) | 安装、Vite 接入、深色首屏、快速开始、导入方式、开发命令 |
| [组件清单](docs/components.md) | 全部组件一览（86 个，按分组，一句话说明） |
| [组件 Props 参考](docs/api-reference.md) | 每个组件的 props 全表：类型 / 默认值 / 说明 / 双向绑定标记（由源码生成） |
| [应用外壳](docs/shell.md) | Layout / Page / Sidebar / TitleBar、页内目录、页面切换过渡 |
| [工具函数与 API](docs/api.md) | 通知、确认框、错误弹窗、右键菜单、Tooltip、动效原语 |
| [主题定制](docs/theming.md) | 主题 API、主题色 API、CSS 变量、工具类 |
| [栅格与刻度](docs/grid.md) | 间距 / 字号 / 圆角 / 尺寸的刻度体系与例外清单 |

## 本地开发

```bash
pnpm install
pnpm dev                              # 起 demo（库本身没有 dev server）
pnpm check && pnpm test && pnpm build # 类型 + 单测 + 构建（含产物体积校验）
```

动手改代码前读 [`docs/AGENTS.md`](docs/AGENTS.md)：仓库地图、硬规则、加/改组件的完整流程、验证清单。

## 给 AI / Agent 用

| 文件 | 内容 |
| --- | --- |
| [`docs/AGENTS.md`](docs/AGENTS.md) | 仓库结构、硬规则、常见任务 checklist、已知的坑 |
| [`skills/goose-ui/SKILL.md`](skills/goose-ui/SKILL.md) | 组件选型表 + 关键约定 + 反模式，可直接作为 agent skill 加载 |
| [`docs/api-reference.md`](docs/api-reference.md) | props 全表（生成物），比翻源码快 |

约定：`docs/api-reference.md` 由 `pnpm docs:api` 生成，`pnpm docs:api:check` 校验是否落后；
组件 props 变了而文档没重新生成，CI 会失败。

## License

MIT

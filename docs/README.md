# 文档索引

goose-ui 的文档按**用途**分四类：上手（怎么装）、查（有哪些组件 / 属性）、
用（外壳与 API 怎么串）、改（维护这个库本身）。三类读者各有各的最短路径。

## 我只要用这个库

1. [安装与接入](installation.md) —— 装包、Vite 配置、深色首屏、最小可运行示例
2. [组件清单](components.md) —— 86 个组件按分组的一句话说明，先在这里选型
3. [组件 Props 参考](api-reference.md) —— 选完直接查 props：类型、默认值、能不能 `bind:`
4. [在线 demo](https://goossee6.github.io/goose-ui/) —— 每页都有「效果 / 源码」切换，复制即用

## 我要做一个完整应用（含桌面外壳）

1. [应用外壳](shell.md) —— `Layout` / `Page` / `Sidebar` / `TitleBar` 的组合方式、页内目录、
   页面切换过渡、组件控制面
2. [工具函数与 API](api.md) —— 通知、确认框、错误弹窗、右键菜单、Tooltip、动效原语、`PillTrack`
3. [主题定制](theming.md) —— 换主题色、深浅两套、工具类

## 我要改这个库（或让 agent 改）

1. [AGENTS.md](AGENTS.md) —— 仓库地图、硬规则、加/改组件 checklist、验证清单、已知的坑
2. [`skills/goose-ui/SKILL.md`](../skills/goose-ui/SKILL.md) —— 面向 agent 的组件选型表、关键约定、
   反模式；写代码前读一遍能省掉大部分返工
3. [栅格与刻度](grid.md) —— 间距 / 字号 / 圆角 / 尺寸写什么值，哪些值刻意不归位

## 文档地图

| 文档 | 什么时候读 | 维护方式 |
| --- | --- | --- |
| [installation.md](installation.md) | 第一次接入、配置 Vite、深色首屏闪白 | 手写 |
| [components.md](components.md) | 选组件；确认命名（与 Ark UI 的差异表在开头） | 手写，**分组的唯一来源** |
| [api-reference.md](api-reference.md) | 查某个组件的 props / 默认值 / 双向绑定 | **生成**：`pnpm docs:api`，不要手改 |
| [shell.md](shell.md) | 搭 Wails3 / 后台应用外壳、页内目录、切换动画 | 手写 |
| [api.md](api.md) | 命令式 API（通知 / 确认 / 错误 / 右键菜单）与动效原语 | 手写 |
| [theming.md](theming.md) | 换色、暗色、CSS 变量与工具类 | 手写 |
| [grid.md](grid.md) | 写样式取什么刻度值、为什么有例外 | 手写 |
| [AGENTS.md](AGENTS.md) | 改这个库本身、给 agent 派活之前 | 手写 |

仓库首页（安装、在线 demo）在 [README](../README.md)，根目录只放它一份。

## 三条维护规则

- **`api-reference.md` 是生成物**：内容全部来自组件源码（类型块 + JSDoc），改组件后跑
  `pnpm docs:api`；`pnpm docs:api:check` 会挡住"改了组件没更新文档"的提交。
- **`components.md` 是生成物的输入**：每个组件那一行的一句话说明会被 `api-reference.md` 复用，
  新增组件必须在这里补一行，否则 API 文档里会缺节。
- **能跑的代码只有 demo**：文档里不贴大段示例，避免和 demo 分叉；文档负责"是什么 / 为什么"，
  demo 负责"长什么样 / 怎么用"。

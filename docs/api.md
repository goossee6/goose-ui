# 工具函数与 API

组件总览见[组件清单](components.md)；应用外壳用法见[应用外壳](shell.md)。

## 工具函数

```ts
import { cn, formatNum, formatBytes, copyToClipboard } from "goose-ui";

cn("a", cond && "b"); // clsx 类名拼接
formatNum(1234567); // "1.2M"
formatBytes(1536); // "1.5 KB"
await copyToClipboard("text"); // 返回 Promise<boolean>
```

## 浮层动效（menuIn / menuOut）

所有自带浮层的组件（DropdownMenu / ContextMenu / Select / MultiSelect / CreatableSelect /
Combobox / Popover / NavigationMenu / TimePicker / DatePicker / DateRangePicker / LinkPreview、
折叠侧栏的悬浮面板）共用同一套进入/离开过渡。自己写浮层时直接复用：

```svelte
<script lang="ts">
  import { menuIn, menuOut } from "goose-ui";
</script>

{#if open}
  <div class="my-panel" in:menuIn={{ up: flipped }} out:menuOut={{ up: flipped }}>
    面板内容
  </div>
{/if}
```

- `up` 表示面板翻到了触发器上方（位移方向与缩放锚边随之反向）；`align: 'end'` 让右对齐的浮层从右边展开
- `prefers-reduced-motion: reduce` 下时长归零
- Svelte 5 里嵌套 `{#if}` 的内层元素不播放 `in:` 过渡（`out:` 正常）——把条件合并成一层，或把内层拆成独立组件

## 嵌套浮层的外部点击（overlayLayer）

`Popover` / `Select` / `DropdownMenu` 的面板都 portal 到 `body`，父子浮层的「外部点击」判断用库内统一的 layer 机制（子面板算内部，不会被父面板误关）。新写浮层组件时照此接入，不要自己写 `contains()`：

```ts
const layerId = createLayerId("xxx");

function portal(node: HTMLElement) {
  const owner = layerOwnerOf(node); // 必须在 appendChild 之前
  node.dataset.overlayLayer = layerId;
  registerLayer(layerId, owner);
  document.body.appendChild(node);
  return {
    destroy() {
      unregisterLayer(layerId);
      node.remove();
    },
  };
}

if (!isInsideLayer(e.target, layerId, [rootEl, panelEl])) close();
```

## 滑动高亮动效（PillTrack）

列表行、菜单项、分段控件、侧栏导航的「背景块跟着指针/选中项滑动」都由 `PillTrack` 绘制。给新组件加成组 hover 高亮时，优先挂 `PillTrack` 而不是自己写 `:hover { background }`。

行为要点：

- hover pill 与选中 pill 共用同一条回弹曲线和固定时长，可用 `--pill-hover-dur` / `--pill-dur` 覆盖
- `prefers-reduced-motion: reduce` 下全部退回 `ease-out`
- **配色约定**：色相只表示「已选中」（`--primary` 实心），灰阶只表示「指针在这里」（`var(--hover)`）；指针压在已选中项上时用 `var(--primary-hover)`（传 `activeHoverBackground` 定制）
- **项间间隙自动归属最近项**（`gapBridge`，默认 12px，传 `0` 关闭），指针扫过缝隙 pill 不消失
- `PillTrack` 会往 pill 正压着的那一项打 `data-pill-on`（`hover` / `active` / `custom`），前景色按它决定，不要用 `:hover`：

| 值       | 什么情况                                            | 前景色                         |
| -------- | --------------------------------------------------- | ------------------------------ |
| `hover`  | 用的是 `hoverBackground`（通常是主题色实心）        | 转 `var(--accent-text)`        |
| `active` | 指针压在已选中项上，用的是 `activeHoverBackground`  | 跟随选中项（一般本身就是白字） |
| `custom` | 行自己的 `data-pill-bg`（禁用行的中性灰、危险行等） | 保持原色                       |

作用域写法：`data-pill-on` 是运行时写入 DOM 的属性，Svelte 静态分析看不见，需把带属性的那一段包进 `:global()`：

```css
.dropdown-menu :global(.dropdown-item[data-pill-on="hover"]:not(:disabled)) {
  color: var(--accent-text);
}
```

## 悬停提示（Tooltip）

界面上的悬停文案一律走 `Tooltip`，不要写原生 `title` —— 原生 tooltip 的配色由系统决定，暗色主题下会弹出跟主题无关的浅色方块。

```svelte
<Tooltip title="设置" placement="bottom">
  <Button size="icon" variant="ghost" icon={SettingsIcon} ariaLabel="打开设置" />
</Tooltip>
```

- **触发器是 `span`（inline-flex）**，可以放进 `<button>` 里
- **气泡 portal 到 `body`**，不受祖先 `backdrop-filter` / `transform` / `overflow` 影响
- **包裹改变了 flex 父子关系**：原来挂在元素上的 `flex: 1`、`margin-left: auto`、`text-overflow: ellipsis` 可能失效，给触发器 `class` 补 `:global(.xxx-tip) { flex: 1 1 auto; min-width: 0 }`，内层再做省略
- **默认延迟 200ms**，用 `delay` 覆盖
- 内容里的 `\n` 会保留（`white-space: pre-wrap`），长文本用 `maxWidth` 限宽
- 例外：`DataTable` 的纯文本单元格仍用原生 `title`（一格一个组件不划算）；需要气泡就在 `custom` 列的 `cell` snippet 里自己包一层

## Notification API

```ts
import { Notification } from "goose-ui";

Notification.success("操作成功");
Notification.info({ title: "系统通知", description: "今晚维护", position: "top-right" });
Notification.warning("磁盘空间不足");
Notification.error("连接失败");
```

- 类型：`success` / `info` / `warning` / `error`
- `position`：`top-left` / `top` / `top-right` / `bottom-left` / `bottom` / `bottom-right`，默认 `bottom-right`
- 需先在应用顶层挂载 `<NotificationProvider />`
- 通知宽度固定 360px，可 `--notif-width` 覆盖
- 错误消息提取用 `errorToString(e)`：

```ts
import { Notification, errorToString } from "goose-ui";

Notification.error(`加载失败: ${errorToString(err)}`);
```

### 多个互不干扰的通知容器

`Notification` 绑定在全局单例 store 上；需要独立容器时用工厂显式建实例：

```svelte
<script lang="ts">
  import { NotificationProvider, createNotificationStore, createNotification } from "goose-ui";

  const storeA = createNotificationStore();
  const notifyA = createNotification(storeA);   // 快捷方法与 storeA 绑定
</script>

<NotificationProvider store={storeA} />
<button onclick={() => notifyA.success({ title: "只出现在 storeA" })}>发送</button>
```

- 两份 store 的通知列表、id 序列、暂停位完全独立；卸载其中一个不影响另一个
- `Notification.xxx()` 不使用 Svelte context，独立容器必须显式传 store

## 确认框 API

```ts
import { showConfirm, ConfirmDialog } from "goose-ui";

const ok = await showConfirm("确定要删除吗？", {
  confirmText: "删除",
  danger: true,
}); // Promise<boolean>：确认 true，取消/关闭 false
```

- 选项：`title`（默认 `'确认'`）、`confirmText`（`'确定'`）、`cancelText`（`'取消'`）、`danger`（确认按钮危险色）、`detail` / `detailLabel`（明细块）
- 需在应用顶层挂载一次 `<ConfirmDialog />`；弹窗内按 `Enter` 等同点击确认

**明细块 `detail`**：要用户逐项核对的清单（一批 PID、一批文件名）放进 `detail`，而不是拼进 `message`。它是等宽、可选中、限高 168px 内部滚动的块，`detailLabel` 是它上面的小标题：

```ts
await showConfirm(`将强制结束「chrome.exe」（PID 4000）及其 23 个后代进程，共 24 个进程。`, {
  title: "关闭所有进程",
  confirmText: "强制结束",
  danger: true,
  detailLabel: "以下 24 个 PID 都会被结束",
  detail: "4000、4001、4002…",
});
```

**标题行操作 `headerActions`**：传一个 snippet，渲染在关闭按钮左侧，适合「全部清空」这类针对整份数据的动作：

```svelte
<Modal bind:open title="chrome.exe 的进程树" headerActions={killAll}>
  {#snippet killAll()}
    <Button variant="danger" size="small" onclick={onKillAll}>关闭所有（{rows.length}）</Button>
  {/snippet}
  <DataList rows={rows} … />
</Modal>
```

**多层叠加按打开顺序排层**：每个 Modal 打开时从全局栈取一个 id，`z-index = --z-overlay + id`——「弹窗里再弹确认框」时确认框一定在上面。`ConfirmDialog` / `ErrorDialog` 建议挂在布局**前面**。

## 错误弹窗 API

```ts
import { pushError, errorStore } from "goose-ui";

pushError("网络请求失败", new Error("Failed to fetch"));
```

需配合顶层挂载 `<ErrorDialog />`，通过 `errorStore` 读取错误列表（`pushError(kind, err)`）。

## 右键菜单 API

```ts
import { registerMenu, openMenuAt, onMenuAction, cellMenuAttrs, menuStore } from "goose-ui";

registerMenu("row", [
  { id: "copy", label: "复制" },
  { id: "del", label: "删除" },
]);
onMenuAction("row", "del", (data) => console.log(data));
```

- 配合顶层挂载 `<ContextMenu />` 使用
- `cellMenuAttrs("row", data)` 生成 `data-menu-*` 属性，绑定到表格单元格
- `onMenuAction(menu, action, handler)` 返回取消订阅函数。注意同一 `(menu, action)` **只保留最后注册的 handler**——多个组件注册同名菜单/同 action 时请改用不同的 action 名（或由上层统一注册一次）

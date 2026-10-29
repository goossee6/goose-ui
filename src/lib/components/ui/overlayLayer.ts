/**
 * 浮层层级登记 —— 解决「点自己弹出的子面板被当成外部点击」。
 *
 * 背景：Popover / Select / DropdownMenu 都把面板 portal 到 `document.body`。
 * 面板一旦离开原 DOM 子树，`rootEl.contains(target)` 就判不出「这是我自己弹出来的」：
 *
 *   筛选气泡（Popover）里放一个下拉（Select）→ 点下拉选项时，
 *   Popover 的 mousedown 监听把这次点击当成「点了面板外面」→ 立刻收起面板
 *   → Select 连同下拉一起卸载 → click 根本没机会派发 → 用户看到的是
 *   **选项点了没反应**。动画开着时，退场过渡让面板多活约 150ms，click 侥幸落地，
 *   于是变成「有时候有效、有时候没反应」；关掉系统动效（prefers-reduced-motion）
 *   就 100% 失效。
 *
 * 做法：每个浮层面板挂 `data-overlay-layer=<id>`，挂载时登记「我是谁弹出来的」。
 * 判断外部点击时，从事件目标往上找最近的浮层，再沿「父子链」回溯 ——
 * 只要链条能追回自己这一层，就算内部点击。
 */

let seq = 0;

/** 浮层 id → 弹出它的那一层 id（顶层为 null）。 */
const parentOf = new Map<string, string | null>();

/** 生成一个实例唯一的浮层 id。 */
export function createLayerId(prefix = 'layer'): string {
  return `${prefix}-${++seq}`;
}

/**
 * 解析 `node` 即将被 portal 出去之前所处的浮层。
 * **必须在 appendChild 之前调用** —— 挂到 body 之后祖先链就没了。
 */
export function layerOwnerOf(node: Element): string | null {
  const host = node.parentElement?.closest<HTMLElement>('[data-overlay-layer]');
  return host?.dataset.overlayLayer ?? null;
}

export function registerLayer(id: string, parent: string | null): void {
  parentOf.set(id, parent);
}

export function unregisterLayer(id: string): void {
  parentOf.delete(id);
}

/**
 * 事件目标是否落在 `id` 这一层内部（含它弹出的各级子浮层）。
 *
 * @param target 事件目标
 * @param id 本层的浮层 id
 * @param roots 本层自己的 DOM 根（触发器容器、面板等），命中也算内部
 */
export function isInsideLayer(
  target: EventTarget | null,
  id: string | null,
  roots: (Element | null | undefined)[]
): boolean {
  if (!(target instanceof Node)) return false;
  for (const r of roots) if (r?.contains(target)) return true;
  if (!id) return false;

  const el = (target instanceof Element ? target : target.parentElement) as Element | null;
  let layer = el?.closest<HTMLElement>('[data-overlay-layer]')?.dataset.overlayLayer ?? null;

  // 防御性上限：正常只有 2~3 层，出现环说明哪里登记错了，别把主线程转死
  for (let guard = 0; layer && guard < 32; guard++) {
    if (layer === id) return true;
    layer = parentOf.get(layer) ?? null;
  }
  return false;
}

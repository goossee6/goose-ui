<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Component } from "svelte";
  import Loader2 from "@lucide/svelte/icons/loader-2";
  import { onDestroy } from "svelte";

  const MIN_LOADING_MS = 1000;

  let {
    variant = "default",
    size = "middle",
    disabled = false,
    loading = false,
    type = "button",
    class: cls = "",
    /** 追加的内联样式；与 size 算出的高度/字号/内边距合并（不要在这里重复写 height） */
    style = "",
    icon,
    iconRight,
    iconSize = 16,
    ariaLabel = '',
    /**
     * 真实 DOM 按钮节点，供调用方 `bind:element` 拿到。
     *
     * 组件的 `bind:this` 给的是组件实例，拿不到 DOM；而对话框这类地方需要在
     * 打开时把焦点放到某个按钮上（`AlertDialog` 就是），只能有这一条通道。
     * 不要用它去改样式/挂事件——那是 props 的职责。
     */
    element = $bindable<HTMLButtonElement | null>(null),
    children,
    onclick,
    ...rest
  }: {
    variant?: "primary" | "default" | "ghost" | "danger" | "danger-solid" | "text" | "text-primary" | "link";
    /** 枚举档位；number 时为任意高度（紧凑按钮） */
    size?: "xs" | "small" | "middle" | "large" | "icon" | "icon-sm" | "icon-md" | "icon-lg" | number;
    disabled?: boolean;
    loading?: boolean;
    type?: "button" | "submit";
    class?: string;
    style?: string;
    icon?: Component;
    iconRight?: Component;
    iconSize?: number;
    ariaLabel?: string;
    element?: HTMLButtonElement | null;
    children?: Snippet;
    onclick?: (event: MouseEvent) => void;
    [key: string]: unknown;
  } = $props();

  const sizeClass = $derived(typeof size === "string" ? `btn-${size}` : "");
  const sizeStyle = $derived(typeof size === "number" ? `height:${size}px;font-size:${Math.round(size * 0.375)}px;padding:0 ${Math.round(size * 0.35)}px;` : "");

  let displayLoading = $state(false);
  let loadingStart = 0;
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

  function clearPending() {
    if (pendingTimeout) { clearTimeout(pendingTimeout); pendingTimeout = null; }
  }

  $effect(() => {
    if (loading) {
      loadingStart = Date.now();
      displayLoading = true;
      clearPending();
    } else if (displayLoading) {
      const remaining = MIN_LOADING_MS - (Date.now() - loadingStart);
      if (remaining > 0) {
        pendingTimeout = setTimeout(() => { displayLoading = false; pendingTimeout = null; }, remaining);
      } else {
        displayLoading = false;
      }
    }
  });

  onDestroy(clearPending);

  /* ── 按压动效 ─────────────────────────────────────────────────────────
     两条规则叠在一起：

     · **打断**：新的一次按下会从当前实际缩放值重新出发，而不是等上一次的
       松手回弹跑完 —— 否则连点时观感就是「点了没反应」。用 Web Animations API
       而不是 CSS transition，因为 animate() 会直接接管并取消同属性上正在跑的
       过渡；transition 只能从计算值往下插值，压不掉已经开始的那一段。

     · **连点累积**：距上一次按下越近，这一下就按得越深（0.95 → 0.88）。
       纯线性递减在几十毫秒的间隔里几乎看不出差别，所以用三次方把「最近的
       几下」放大：间隔 10ms 吃到 96% 的深度，250ms 后归零。
       记的是 **pointerdown 的时刻**（不是松开）：「按得快」指的是两次按下的
       间隔，按下后按住多久不该影响深度。

     触发点用 pointerdown（不是 click）：按下就该有反馈，click 要等抬起。
     禁用 / loading 不触发。 */

  const PRESS_SCALE = 0.95;
  const PRESS_SCALE_MILD = 0.98; // 减少动效偏好下的幅度：仍给出反馈，但不至于"弹"
  /** 连点到底时额外再缩多少（0.95 - 0.07 = 0.88） */
  const PRESS_DEEPEN = 0.07;
  /** 两次按下间隔超过这个值就视为独立操作，不累积 */
  const PRESS_STREAK_MS = 250;
  const PRESS_MS = 90;
  /** 当前按压动画句柄。声明在 $props() 之后 —— 文档顺序上先于用它的函数 */
  let pressAnim: Animation | null = null;
  /** 上一次 pointerdown 的时刻，用于算连点间隔 */
  let lastPressAt = 0;

  /**
   * 用户是否偏好减少动效。
   *
   * 注意这是「响应式偏好」而不是「一键关死」：prefers-reduced-motion 的本意是
   * 避免视差、大面积位移这类会引起不适的动画，一个 ≤5% 的按钮缩放属于
   * 可接受的操作反馈。所以 reduce 开启时仍然缩短 —— 只是幅度减半（0.98）、
   * 并去掉过冲回弹（回弹只会放大「在动」的感觉），而不是整段不启程。
   *
   * 早先这里写成 `!window.matchMedia?.(...).matches`，少了 .matches ——
   * matchMedia 返回的是对象、永远真值，取反后恒为 false，于是这段动画
   * 在任何环境都不触发。这类「永远不成立的条件」静态检查抓不到，别再犯。
   */
  const reducedMotion = $derived(
    typeof window !== 'undefined' &&
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  );

  function onPointerDown(e: PointerEvent & { currentTarget: HTMLButtonElement }) {
    if (e.button !== 0 || disabled || loading) return;
    const el = e.currentTarget;

    // 连点强度：间隔 0 → 1，间隔 ≥ STREAK_MS → 0。三次方让最近的几下更明显
    const now = e.timeStamp || performance.now();
    const gap = lastPressAt ? now - lastPressAt : Infinity;
    lastPressAt = now;
    const rush = gap >= PRESS_STREAK_MS ? 0 : (1 - gap / PRESS_STREAK_MS) ** 3;

    const base = reducedMotion ? PRESS_SCALE_MILD : PRESS_SCALE;
    // 减少动效下只留 1/4 的深度：仍有「按得重」的手感，但不至于大幅跳动
    const depth = PRESS_DEEPEN * rush * (reducedMotion ? 0.25 : 1);
    const target = base - depth;

    // composite:'replace' 让这段动画独占 transform，自然顶掉正在跑的回弹
    const anim = el.animate(
      [{ transform: getComputedStyle(el).transform || 'none' }, { transform: `scale(${target})` }],
      {
        // 按得越深走稍久一点，否则深度变化反而显得更"跳"
        duration: PRESS_MS + depth * 400,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
        composite: 'replace'
      }
    );
    // 打上记号，releasePress 才知道该收哪一个
    (anim as Animation & { __press?: boolean }).__press = true;
    pressAnim = anim;
  }

  /** 抬起 / 滑出 / 取消：把按下动画收掉，交还给 CSS 的过冲回弹（.btn 的 transition） */
  function releasePress() {
    if (!pressAnim) return;
    try {
      pressAnim.cancel();
    } catch {
      /* 已经被浏览器替换掉的动画，cancel 会抛 InvalidStateError，忽略即可 */
    }
    pressAnim = null;
  }
</script>

<button
  {type}
  disabled={disabled || loading}
  class="btn btn-{variant} {sizeClass} {cls}"
  style={sizeStyle + style}
  {onclick}
  aria-label={ariaLabel}
  bind:this={element}
  onpointerdown={onPointerDown}
  onpointerup={releasePress}
  onpointerleave={releasePress}
  onpointercancel={releasePress}
  {...rest}
>
  {#if displayLoading}
    <span class="btn-spinner" style="width:{iconSize}px;height:{iconSize}px">
      <Loader2 size={iconSize} />
    </span>
  {:else if icon}
    {@const Icon = icon}
    <span class="btn-icon-wrap" style="width:{iconSize}px;height:{iconSize}px">
      <Icon size={iconSize} />
    </span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
  {#if !displayLoading && iconRight}
    {@const IconRight = iconRight}
    <span class="btn-icon-wrap" style="width:{iconSize}px;height:{iconSize}px">
      <IconRight size={iconSize} />
    </span>
  {/if}
</button>

<style>
  .btn {
    border: 1px solid transparent;
    border-radius: var(--radius-lg);
    font-weight: 500;
    cursor: pointer;
    /* transform 的过渡定义在下面的「按压弹性」块里，别在这条里重复写，
       否则两处 transition 会互相覆盖（后声明的整条生效）。 */
    transition: background-color 0.2s, border-color 0.2s, opacity 0.2s, color 0.2s;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-md);
    outline: none;
    user-select: none;
    height: var(--height-md);
    padding: var(--padding-md);
    font-size: var(--font-md);
  }
  .btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
  /* 按压弹性 ------------------------------------------------------------
     缩放被拆成两段，分工明确：

     · **按下**（缩到 0.95）交给 JS 的 WAAPI 动画（见 script 里的 onPointerDown），
       因为按下必须能「打断」：连点时上一次的松手回弹还在跑，如果缩小仍由
       transition 负责，它只能从回弹的当前位置一路插值过去，指令被吃掉一半，
       观感是「点了没反应」。WAAPI 会直接取消同属性上正在跑的过渡，立刻接管。

     · **松开**（回到 1）交给这里的 CSS transition，曲线 cubic-bezier(0.34,1.56,…)
       中段超过 1 —— 放大时先冲过 100% 再落回，这就是「回弹」的观感来源。
       transform 的过渡只写在这条 .btn 上：它是「松手后」的默认行为。

     按下为什么不用 :active：`:active` 的收起时机由浏览器决定，
     在鼠标移出元素后仍有残留，和 WAAPI 动画叠加会互相拉扯。留着它会
     出现「动画已经取消、CSS 又把按钮按回去」的闪烁，所以这里不写 :active。

     `prefers-reduced-motion` 的规则**只能写在这条基础规则里**（把 transform
     的过渡换成 none），绝不能写 `transform: none` —— 那会把整个缩放压平，
     连 WAAPI 动画的第 0 帧都读不到位置。svelte 编译时会把媒体查询里的
     规则压平到同一条选择器上，写进去就是无条件生效，之前在 reduce 环境下
     「完全不缩」就是这个原因。 */
  .btn {
    transition:
      background-color 0.2s,
      border-color 0.2s,
      opacity 0.2s,
      color 0.2s,
      transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform: scale(1);
    transform-origin: center;
  }
  /* 减少动效：松手不再过冲回弹（改线性），按下那一下仍保留 */
  @media (prefers-reduced-motion: reduce) {
    .btn {
      transition: background-color 0.2s, border-color 0.2s, opacity 0.2s, color 0.2s,
        transform 0.12s ease-out;
    }
  }
  .btn-icon-wrap { display: inline-flex; flex-shrink: 0; }
  .btn-icon-wrap :global(svg) { width: 100%; height: 100%; }
  .btn-spinner { display: inline-flex; flex-shrink: 0; animation: btn-spin 0.8s linear infinite; }
  @keyframes btn-spin { to { transform: rotate(360deg); } }
  /* sizes */
  /* xs：与正文同高的行内按钮（12px 字、20px 高）。只给 text / text-primary 用，
     带背景的档位最小仍应是 small —— 28px 是「看得见、点得到」的下限。 */
  .btn-xs { height: 20px; padding: 0 var(--sp-sm); font-size: var(--font-sm); border-radius: var(--radius-sm); gap: var(--sp-sm); }
  .btn-small { height: var(--height-sm); padding: var(--padding-sm); font-size: var(--font-sm); }
  .btn-middle { height: var(--height-md); padding: var(--padding-md); font-size: var(--font-md); }
  .btn-large { height: var(--height-lg); padding: var(--padding-lg); font-size: var(--font-lg); }
  .btn-icon { width: var(--height-md); height: var(--height-md); padding: 0; }
  .btn-icon-sm { width: var(--height-sm); height: var(--height-sm); padding: 0; border-radius: min(var(--radius-md), 12px); }
  .btn-icon-md { width: 24px; height: 24px; padding: 0; border-radius: min(var(--radius-md), 10px); }
  .btn-icon-lg { width: var(--height-lg); height: var(--height-lg); padding: 0; }
  /* variants */
  .btn-primary { background-color: var(--primary); color: var(--primary-text); }
  .btn-primary:hover:not(:disabled) { background-color: var(--primary-hover); }
  .btn-default { background-color: var(--secondary); color: var(--secondary-text); border: 1px solid var(--border-strong); }
  .btn-default:hover:not(:disabled) { background-color: var(--hover); border-color: var(--primary); }
  .btn-ghost { background-color: transparent; color: var(--text-muted); }
  .btn-ghost:hover:not(:disabled) { background-color: var(--surface-2); color: var(--text-strong); }
  /* ghost 作为浮层触发器时（DropdownMenu / Menubar 等），展开期间保持「按下」观感：
     aria-expanded 是这类按钮的标准信号，比让每个调用方各写一条覆盖规则可靠 */
  .btn-ghost[aria-expanded='true']:not(:disabled) { background-color: var(--hover); color: var(--text-strong); }
  .btn-danger { background-color: var(--danger-soft); color: var(--danger-text); border: 1px solid var(--danger-border); }
  .btn-danger:hover:not(:disabled) { background-color: var(--danger-border); border-color: var(--danger-text); }
  /* 实心危险：整屏只该有一个的危险动作（删除确认、抹掉不可恢复的数据）。
     与 danger（浅红底、可反复点的常驻动作）是两档，不要互相替代。 */
  .btn-danger-solid { background-color: var(--danger); color: var(--primary-text); border-color: var(--danger); }
  .btn-danger-solid:hover:not(:disabled) { background-color: var(--danger-hover); border-color: var(--danger-hover); }
  /* 文字按钮（表头旁的「今天」「现在」「清除」、错误条目里的「复制」）：
     无边框无背景，配合 size="xs" 才与 12px 正文同高。
     hover 底色用 currentColor 调淡：主色文字得到主色浅底、灰色文字得到中性浅底，
     不用为两种颜色各写一条规则。 */
  .btn-text, .btn-text-primary { background-color: transparent; border-color: transparent; }
  .btn-text { color: var(--text-muted); }
  .btn-text-primary { color: var(--primary); }
  .btn-text:hover:not(:disabled), .btn-text-primary:hover:not(:disabled) {
    background-color: color-mix(in srgb, currentColor 12%, transparent);
  }
  .btn-text:hover:not(:disabled) { color: var(--text-strong); }
  .btn-link { background-color: transparent; color: var(--primary); text-decoration: underline; text-underline-offset: 4px; }
  .btn-link:hover:not(:disabled) { text-decoration: none; }
</style>

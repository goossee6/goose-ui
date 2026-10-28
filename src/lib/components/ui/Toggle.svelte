<script lang="ts">
  import { onDestroy } from "svelte";

  /** 与 Button 一致：loading 过短会闪一下，至少展示这么久 */
  const DEFAULT_MIN_LOADING_MS = 1000;

  let {
    checked = $bindable(false),
    disabled = false,
    loading = false,
    ariaLabel = "",
    title = "",
    class: cls = "",
    onclick,
    size = "middle",
    style = "",
    onStyle = "",
    offStyle = "",
    thumbStyle = "",
    optimistic = true,
    minLoadingMs = DEFAULT_MIN_LOADING_MS,
  }: {
    checked?: boolean;
    disabled?: boolean;
    /** 加载中：滑块换成 spinner，并阻止交互 */
    loading?: boolean;
    ariaLabel?: string;
    title?: string;
    class?: string;
    onclick?: (e: MouseEvent) => void;
    size?: "small" | "middle" | "large";
    style?: string;
    /** 开启态轨道的内联样式（常用来覆盖背景/边框色） */
    onStyle?: string;
    /** 关闭态轨道的内联样式 */
    offStyle?: string;
    /** 滑块的内联样式（两态共用，自定义轨道色后用来保证对比度） */
    thumbStyle?: string;
    /**
     * 点击时是否自行翻转 checked，默认 true。
     *
     * 传 false 表示「受控」：开关只反映父级给的值，点击仅回调 onclick，
     * 由父级决定何时改 checked。异步操作（挂起 / 恢复这种要等后端确认的）
     * 必须用受控模式 —— 否则开关先自己翻过去、父级随后用还没更新的
     * 数据改回来，用户看到的就是状态来回跳。
     */
    optimistic?: boolean;
    /** loading 最短展示时长（ms），默认 1000。异步确认本身就慢的场景建议调小 */
    minLoadingMs?: number;
  } = $props();

  const sizeClass = $derived(`toggle--${size}`);

  let displayLoading = $state(false);
  let loadingStart = 0;
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

  function clearPending() {
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      pendingTimeout = null;
    }
  }

  $effect(() => {
    if (loading) {
      loadingStart = Date.now();
      displayLoading = true;
      clearPending();
    } else if (displayLoading) {
      // minLoadingMs 每次现读：父级把它调小（异步本身就慢的场景）要立即生效
      const remaining = minLoadingMs - (Date.now() - loadingStart);
      if (remaining > 0) {
        pendingTimeout = setTimeout(() => {
          displayLoading = false;
          pendingTimeout = null;
        }, remaining);
      } else {
        displayLoading = false;
      }
    }
  });

  onDestroy(clearPending);
</script>

<!-- title 为空时不写这个属性：`title=""` 同样会让浏览器把它当成「有原生提示」
     的元素参与命中判定，而且会和外面套的 Tooltip 重复。提示统一交给 Tooltip
     组件（需要原生兜底时由调用方传非空 title）。 -->
<button
  type="button"
  class="toggle {sizeClass} {cls}"
  class:toggle--loading={displayLoading}
  {style}
  class:toggle--disabled={disabled}
  disabled={disabled || loading}
  title={title || undefined}
  aria-label={ariaLabel || undefined}
  aria-pressed={checked}
  aria-busy={displayLoading}
  onclick={(e) => {
    if (disabled || loading) return;
    if (optimistic) checked = !checked;
    onclick?.(e);
  }}>
  <span class="toggle-track" class:toggle-track--on={checked} style={checked ? onStyle : offStyle}>
    <!-- loading 的 spinner 放在滑块内部：滑块自带的动画照常播放，
		     不会因为被替换成 spinner 而中断或被隐藏。 -->
    <span class="toggle-thumb" style={thumbStyle}>
      {#if displayLoading}
        <span class="toggle-spinner"></span>
      {/if}
    </span>
  </span>
</button>

<style>
  /* 尺寸、节奏全部收敛成自定义属性：两套 keyframes 只写 var() / calc()，
     一套覆盖 small / middle / large，不再按尺寸复制六份动画。 */
  .toggle {
    --trk-w: var(--toggle-w-md);
    --trk-h: var(--toggle-h-md);
    --tw: var(--toggle-thumb-md);
    --spin: var(--toggle-spin-md);
    /* 2 态跨越动画的时长 */
    --flip-ms: 0.5s;
    /* 3 态（loading）的呼吸 / 扫光节奏，两者共用同一个值才像一个动作 */
    --wait-ms: 1.15s;
    display: inline-flex;
    align-items: center;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }
  .toggle--small {
    --trk-w: var(--toggle-w-sm);
    --trk-h: var(--toggle-h-sm);
    --tw: var(--toggle-thumb-sm);
    --spin: var(--toggle-spin-sm);
  }
  .toggle--large {
    --trk-w: var(--toggle-w-lg);
    --trk-h: var(--toggle-h-lg);
    --tw: var(--toggle-thumb-lg);
    --spin: var(--toggle-spin-lg);
  }
  .toggle--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .toggle-track {
    display: block;
    box-sizing: border-box;
    width: var(--trk-w);
    height: var(--trk-h);
    border-radius: 999px;
    background-color: var(--surface-3);
    border: 1px solid var(--border-strong);
    position: relative;
    transition:
      background-color 0.2s,
      border-color 0.2s;
  }
  .toggle-track--on {
    background-color: var(--primary);
    border-color: var(--primary);
  }
  /* 3 态的扫光：一条高光横穿轨道。
     用 background-position 移动渐变而不是 transform 平移元素，
     渐变本身就被圆角框裁掉，不必给轨道加 overflow:hidden —— 那会顺带
     剪掉滑块的投影，开启态滑块贴边时尤其明显。
     ::before 是轨道最先绘制的子节点，所以扫光在滑块之下，不会糊住 spinner。 */
  .toggle-track::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(100deg, transparent 25%, rgb(255 255 255 / 0.55) 50%, transparent 75%) no-repeat;
    background-size: 220% 100%;
    background-position: 220% 0;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
  }
  .toggle-thumb {
    /* 滑块左锚点：关闭态贴左 2px，开启态在下面改成贴右 2px。
       两态都写死在这里（而不是只写在 keyframes 里），是因为 loading 会摘掉
       2 态动画 —— 没有静态兜底的话，开启态会在进入 loading 的瞬间弹回左边。 */
    --thumb-left: 2px;
    /* loading 呼吸时往哪边长：关闭态往右（0），开启态往左（-6px）。
       两者都是「贴着休息那一侧不动、朝轨道内侧鼓起来」，所以不会顶出边框。 */
    --breathe-shift: 0px;
    position: absolute;
    top: 2px;
    left: var(--thumb-left);
    width: var(--tw);
    height: var(--tw);
    border-radius: 999px;
    background-color: var(--primary-text);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    /* 动画被摘掉时靠 transition 滑过去，不硬跳 */
    transition:
      left 0.2s ease,
      width 0.2s ease;
  }
  .toggle-track--on .toggle-thumb {
    --thumb-left: calc(100% - var(--tw) - 2px);
    --breathe-shift: -6px;
  }

  /* ── 2 态：off ↔ on ───────────────────────────────────────────
     滑块先拉伸成一条贯穿轨道的胶囊，再收拢到对岸 —— 像开关被「推」过去。
     状态一变就播一次，与是否 loading 无关：loading 表示「还不知道结果」，
     但这一次点击要去哪一侧是确定的，滑块该先到位。 */
  .toggle-track--on .toggle-thumb {
    animation: toggle-flip-on var(--flip-ms) cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  .toggle-track:not(.toggle-track--on) .toggle-thumb {
    animation: toggle-flip-off var(--flip-ms) cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  /* ── 3 态：loading（off / on / 进行中）───────────────────────
     它只在 2 态之上加一层，两层分工明确：
       · 2 态的跨越动画 —— 说「去哪」，点击后滑块先落到目标侧
       · loading 自己的一层 —— 说「还没回」：滑块原地呼吸（贴着休息那一侧
         的边不动，朝内侧鼓 6px，18px 的滑块涨 1/3）、轨道上一条高光反复
         掠过、滑块里的圈持续旋转
     呼吸与扫光同节奏（--wait-ms），看起来是一个动作。
     用「叠加 + 让呼吸延后一个跨越动画时长」而不是二选一：加载可能在跨越
     动画播到一半就结束（minLoadingMs 可调），二选一会在半途摘掉动画、
     滑块瞬移到对岸；叠加时跨越动画始终在，短加载只是少了呼吸，长加载在
     落地后接着呼吸，看不出接缝。 */
  .toggle--loading {
    cursor: progress;
  }
  .toggle--loading .toggle-track--on .toggle-thumb {
    animation:
      toggle-flip-on var(--flip-ms) cubic-bezier(0.4, 0, 0.2, 1) forwards,
      toggle-breathe var(--wait-ms) ease-in-out var(--flip-ms) infinite;
  }
  .toggle--loading .toggle-track:not(.toggle-track--on) .toggle-thumb {
    animation:
      toggle-flip-off var(--flip-ms) cubic-bezier(0.4, 0, 0.2, 1) forwards,
      toggle-breathe var(--wait-ms) ease-in-out var(--flip-ms) infinite;
  }
  .toggle--loading .toggle-track::before {
    opacity: 1;
    animation: toggle-sweep var(--wait-ms) ease-in-out var(--flip-ms) infinite;
  }

  .toggle-spinner {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    width: var(--spin);
    height: var(--spin);
    margin: auto;
    /* 滑块始终是 --primary-text（白色），用主题强调色画弧保证对比度 */
    border: 2px solid var(--accent);
    border-top-color: transparent;
    border-radius: 50%;
    /* 旋转 + 淡入：spinner 是条件渲染出来的，直接出现会「啪」地跳出 */
    animation:
      toggle-spin 0.7s linear infinite,
      toggle-fade-in 0.18s ease-out;
  }

  /* 降低动效偏好：2 态的跨越、3 态的呼吸与扫光都关掉，
     spinner 保留 —— 它是状态指示，不是装饰。 */
  @media (prefers-reduced-motion: reduce) {
    /* !important 在这里是必需的：上面的 2 态选择器带 :not() 与状态类，
       特异性高于这里的两段，靠顺序压不住。 */
    .toggle .toggle-thumb,
    .toggle .toggle-track::before {
      animation: none !important;
    }
  }

  @keyframes toggle-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @keyframes toggle-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* 2 态：左 → 右 */
  @keyframes toggle-flip-on {
    0% {
      left: 2px;
      width: var(--tw);
    }
    45% {
      left: 1px;
      width: calc(100% - 2px);
    }
    55% {
      left: 1px;
      width: calc(100% - 2px);
    }
    70% {
      left: calc(100% - var(--tw) - 2px);
      width: var(--tw);
    }
    90% {
      left: calc(100% - var(--tw) - 2px);
      width: calc(var(--tw) + 2px);
    }
    100% {
      left: calc(100% - var(--tw) - 2px);
      width: var(--tw);
    }
  }
  /* 2 态：右 → 左 */
  @keyframes toggle-flip-off {
    0% {
      left: calc(100% - var(--tw) - 2px);
      width: var(--tw);
    }
    45% {
      left: 1px;
      width: calc(100% - 2px);
    }
    55% {
      left: 1px;
      width: calc(100% - 2px);
    }
    70% {
      left: 2px;
      width: var(--tw);
    }
    90% {
      left: 2px;
      width: calc(var(--tw) + 2px);
    }
    100% {
      left: 2px;
      width: var(--tw);
    }
  }
  /* 3 态：原地呼吸。贴着休息那一侧的边不动，朝轨道内侧鼓 6px 再收回
     （18px 的滑块涨 1/3，肉眼能看出在动），所以无论开启还是关闭都不会
     越过边框。 */
  @keyframes toggle-breathe {
    0%,
    100% {
      left: var(--thumb-left);
      width: var(--tw);
    }
    50% {
      left: calc(var(--thumb-left) + var(--breathe-shift));
      width: calc(var(--tw) + 6px);
    }
  }
  /* 3 态：扫光。百分比位移是相对「容器宽 − 图片宽（220%）」算的，
     所以数值由大到小才是从左往右掠过。 */
  @keyframes toggle-sweep {
    0% {
      background-position: 220% 0;
    }
    100% {
      background-position: -120% 0;
    }
  }
</style>

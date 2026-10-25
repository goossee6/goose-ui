<script lang="ts">
  import { onDestroy } from "svelte";

  /** 与 Button 一致：loading 过短会闪一下，至少展示这么久 */
  const MIN_LOADING_MS = 1000;

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
      const remaining = MIN_LOADING_MS - (Date.now() - loadingStart);
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

<button
  type="button"
  class="toggle {sizeClass} {cls}"
  class:toggle--loading={displayLoading}
  {style}
  class:toggle--disabled={disabled}
  disabled={disabled || loading}
  {title}
  aria-label={ariaLabel || undefined}
  aria-pressed={checked}
  aria-busy={displayLoading}
  onclick={(e) => {
    if (disabled || loading) return;
    checked = !checked;
    onclick?.(e);
  }}>
  <span class="toggle-track" class:toggle-track--on={checked} style={checked ? onStyle : offStyle}>
    <!-- loading 的 spinner 放在滑块内部：滑块自带的位移/伸缩动画照常播放，
		     不会因为被替换成 spinner 而中断或被隐藏。 -->
    <span class="toggle-thumb" style={thumbStyle}>
      {#if displayLoading}
        <span class="toggle-spinner"></span>
      {/if}
    </span>
  </span>
</button>

<style>
  .toggle {
    display: inline-flex;
    align-items: center;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }
  .toggle--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .toggle-track {
    display: block;
    box-sizing: border-box;
    width: var(--toggle-w-md);
    height: var(--toggle-h-md);
    border-radius: 999px;
    background-color: var(--surface-3);
    border: 1px solid var(--border-strong);
    position: relative;
    transition:
      background-color 0.2s,
      border-color 0.2s;
  }
  .toggle--small .toggle-track {
    width: var(--toggle-w-sm);
    height: var(--toggle-h-sm);
  }
  .toggle--large .toggle-track {
    width: var(--toggle-w-lg);
    height: var(--toggle-h-lg);
  }
  .toggle-track--on {
    background-color: var(--primary);
    border-color: var(--primary);
  }
  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: var(--toggle-thumb-md);
    height: var(--toggle-thumb-md);
    border-radius: 999px;
    background-color: var(--primary-text);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  .toggle--small .toggle-thumb {
    width: var(--toggle-thumb-sm);
    height: var(--toggle-thumb-sm);
  }
  .toggle--large .toggle-thumb {
    width: var(--toggle-thumb-lg);
    height: var(--toggle-thumb-lg);
  }
  /* loading：spinner 画在滑块内部，滑块的位移/伸缩动画照常播放，
	   加载结束只移除 spinner，滑块不重挂载也不跳位置。 */
  .toggle--loading {
    cursor: progress;
  }
  .toggle-spinner {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    width: var(--toggle-spin-md);
    height: var(--toggle-spin-md);
    margin: auto;
    /* 滑块始终是 --primary-text（白色），用主题强调色画弧保证对比度 */
    border: 2px solid var(--accent);
    border-top-color: transparent;
    border-radius: 50%;
    animation: toggle-spin 0.7s linear infinite;
  }
  .toggle--small .toggle-spinner {
    width: var(--toggle-spin-sm);
    height: var(--toggle-spin-sm);
  }
  .toggle--large .toggle-spinner {
    width: var(--toggle-spin-lg);
    height: var(--toggle-spin-lg);
  }
  @keyframes toggle-spin {
    to {
      transform: rotate(360deg);
    }
  }
  .toggle-track--on .toggle-thumb {
    animation: toggle-on 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  .toggle-track:not(.toggle-track--on) .toggle-thumb {
    animation: toggle-off 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  /* small: track 36x20, thumb 14x14 */
  .toggle--small .toggle-track--on .toggle-thumb {
    animation-name: toggle-on-sm;
  }
  .toggle--small .toggle-track:not(.toggle-track--on) .toggle-thumb {
    animation-name: toggle-off-sm;
  }
  /* large: track 52x28, thumb 22x22 */
  .toggle--large .toggle-track--on .toggle-thumb {
    animation-name: toggle-on-lg;
  }
  .toggle--large .toggle-track:not(.toggle-track--on) .toggle-thumb {
    animation-name: toggle-off-lg;
  }
  @keyframes toggle-on {
    0% {
      left: 2px;
      width: 18px;
    }
    45% {
      left: 1px;
      width: 40px;
    }
    55% {
      left: 1px;
      width: 40px;
    }
    70% {
      left: 21px;
      width: 18px;
    }
    90% {
      left: 21px;
      width: 20px;
    }
    100% {
      left: 22px;
      width: 18px;
    }
  }
  @keyframes toggle-off {
    0% {
      left: 22px;
      width: 18px;
    }
    45% {
      left: 1px;
      width: 40px;
    }
    55% {
      left: 1px;
      width: 40px;
    }
    70% {
      left: 2px;
      width: 18px;
    }
    90% {
      left: 2px;
      width: 20px;
    }
    100% {
      left: 2px;
      width: 18px;
    }
  }
  @keyframes toggle-on-sm {
    0% {
      left: 2px;
      width: 14px;
    }
    45% {
      left: 1px;
      width: 32px;
    }
    55% {
      left: 1px;
      width: 32px;
    }
    70% {
      left: 17px;
      width: 14px;
    }
    90% {
      left: 17px;
      width: 16px;
    }
    100% {
      left: 18px;
      width: 14px;
    }
  }
  @keyframes toggle-off-sm {
    0% {
      left: 18px;
      width: 14px;
    }
    45% {
      left: 1px;
      width: 32px;
    }
    55% {
      left: 1px;
      width: 32px;
    }
    70% {
      left: 2px;
      width: 14px;
    }
    90% {
      left: 2px;
      width: 16px;
    }
    100% {
      left: 2px;
      width: 14px;
    }
  }
  @keyframes toggle-on-lg {
    0% {
      left: 2px;
      width: 22px;
    }
    45% {
      left: 1px;
      width: 48px;
    }
    55% {
      left: 1px;
      width: 48px;
    }
    70% {
      left: 25px;
      width: 22px;
    }
    90% {
      left: 25px;
      width: 24px;
    }
    100% {
      left: 26px;
      width: 22px;
    }
  }
  @keyframes toggle-off-lg {
    0% {
      left: 26px;
      width: 22px;
    }
    45% {
      left: 1px;
      width: 48px;
    }
    55% {
      left: 1px;
      width: 48px;
    }
    70% {
      left: 2px;
      width: 22px;
    }
    90% {
      left: 2px;
      width: 24px;
    }
    100% {
      left: 2px;
      width: 22px;
    }
  }
</style>

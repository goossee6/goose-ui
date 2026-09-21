<script lang="ts">
  import type { Component } from 'svelte';
  import Button from './Button.svelte';

  let {
    lightIcon,
    darkIcon,
    onclick,
    class: cls = '',
  }: {
    lightIcon?: Component<{ size?: number }>;
    darkIcon?: Component<{ size?: number }>;
    onclick?: (theme: 'light' | 'dark') => void;
    class?: string;
  } = $props();

  let theme = $state<'light' | 'dark'>(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  function applyTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    onclick?.(theme);
  }

  function toggle(e: MouseEvent) {
    const btn = e.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const root = document.documentElement;
    root.style.setProperty('--tv-x', `${x}px`);
    root.style.setProperty('--tv-y', `${y}px`);
    root.style.setProperty('--tv-r', `${radius}px`);

    if (!document.startViewTransition) {
      applyTheme();
      return;
    }

    document.startViewTransition(() => applyTheme());
  }
</script>

<Button
  variant="ghost"
  icon={theme === 'light' ? (lightIcon ?? darkIcon) : (darkIcon ?? lightIcon)}
  class={cls}
  ariaLabel="切换主题"
  onclick={toggle}
/>

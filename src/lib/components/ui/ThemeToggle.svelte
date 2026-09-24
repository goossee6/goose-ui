<script lang="ts">
  import type { Component } from 'svelte';
  import { onMount } from 'svelte';
  import Sun from '@lucide/svelte/icons/sun';
  import Moon from '@lucide/svelte/icons/moon';
  import Button from './Button.svelte';
  import { themeStore, initTheme, toggleTheme } from '../themeStore.svelte.js';

  let {
    lightIcon = Sun,
    darkIcon = Moon,
    onclick,
    class: cls = '',
  }: {
    lightIcon?: Component<{ size?: number }>;
    darkIcon?: Component<{ size?: number }>;
    onclick?: (theme: 'light' | 'dark') => void;
    class?: string;
  } = $props();

  onMount(initTheme);

  function toggle(e: MouseEvent) {
    const btn = e.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const next = toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    onclick?.(next);
  }
</script>

<Button
  variant="ghost"
  icon={themeStore.theme === 'light' ? lightIcon : darkIcon}
  class={cls}
  ariaLabel="切换主题"
  onclick={toggle}
/>

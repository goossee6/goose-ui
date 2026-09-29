<script lang="ts">
  import type { Component } from 'svelte';
  import { onMount } from 'svelte';
  import Sun from '@lucide/svelte/icons/sun';
  import Moon from '@lucide/svelte/icons/moon';
  import Button from './Button.svelte';
  import { themeStore, initTheme, toggleThemeFromEvent } from '../themeStore.svelte.js';

  let {
    lightIcon = Sun,
    darkIcon = Moon,
    onclick,
    class: cls = '',
    style = '',
  }: {
    lightIcon?: Component<{ size?: number }>;
    darkIcon?: Component<{ size?: number }>;
    onclick?: (theme: 'light' | 'dark') => void;
    class?: string;
    style?: string;
  } = $props();

  onMount(initTheme);

  function toggle(e: MouseEvent) {
    const next = toggleThemeFromEvent(e);
    onclick?.(next);
  }
</script>

<Button
  variant="ghost"
  icon={themeStore.theme === 'light' ? lightIcon : darkIcon}
  class={cls}
  style={style}
  ariaLabel="切换主题"
  onclick={toggle}
/>

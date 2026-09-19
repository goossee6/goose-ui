<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import { Sun, Moon } from '@lucide/svelte';

  interface TabItem { value: string; label: string }
  interface TabGroup { title: string; items: TabItem[] }

  let {
    groups = [],
    activeTab = $bindable(''),
    theme = $bindable<'light' | 'dark'>('light'),
    onToggleTheme,
    footer,
    header,
    class: cls = '',
  }: {
    groups?: TabGroup[];
    activeTab?: string;
    theme?: 'light' | 'dark';
    onToggleTheme?: (e: MouseEvent) => void;
    footer?: string;
    header?: Snippet;
    class?: string;
  } = $props();
</script>

<aside class="sidebar {cls}">
  <div class="sidebar-header">
    {#if header}
      {@render header()}
    {:else}
      <span class="logo">goose-ui</span>
    {/if}
    <button type="button" class="theme-btn" onclick={(e) => onToggleTheme?.(e)} aria-label="切换主题">
      <Icon icon={theme === 'dark' ? Sun : Moon} size={18} />
    </button>
  </div>
  <nav class="sidebar-nav">
    {#each groups as group}
      <div class="nav-group">
        <div class="nav-group-title">{group.title}</div>
        {#each group.items as item}
          <button
            type="button"
            class="nav-item"
            class:nav-item--active={activeTab === item.value}
            onclick={() => activeTab = item.value}
          >
            {item.label}
          </button>
        {/each}
      </div>
    {/each}
  </nav>
  <div class="sidebar-footer">
    {#if footer}
      <span>{footer}</span>
    {/if}
  </div>
</aside>

<style>
  .sidebar {
    position: fixed;
    top: 16px;
    left: 16px;
    bottom: 16px;
    width: 220px;
    background: var(--surface);
    border-radius: var(--radius-xl);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 14px 0;
    gap: 0;
    z-index: 100;
  }
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px 12px;
    border-bottom: 1px solid var(--border);
  }
  .logo {
    font-size: 17px;
    font-weight: 700;
    color: var(--text-strong);
    letter-spacing: -0.02em;
  }
  .theme-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .theme-btn:hover {
    background: var(--hover);
    color: var(--text-strong);
  }
  .sidebar-nav {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 8px 0;
  }
  .nav-group {
    padding: 4px 0;
  }
  .nav-group-title {
    padding: 6px 14px 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 5px 14px;
    border: none;
    background: none;
    color: var(--text);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
  }
  .nav-item:hover {
    background: var(--hover);
    color: var(--text-strong);
  }
  .nav-item--active {
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 500;
  }
  .sidebar-footer {
    padding: 10px 14px 0;
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--text-muted);
  }
</style>

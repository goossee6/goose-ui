<script lang="ts">
    import { tick } from 'svelte';
    import { floatingPosition } from './floatingPosition';
    import X from '@lucide/svelte/icons/x';
    import ChevronDown from '@lucide/svelte/icons/chevron-down';
    import Icon from './Icon.svelte';
    import PillTrack from './PillTrack.svelte';

    interface PresetOption {
        value: string;
        label: string;
    }

    let {
        value = $bindable(''),
        presets = [],
        placeholder = '',
        disabled = false,
        ariaLabel = '',
        class: className = '',
        style = '',
        clearable = true,
        error = false,
        name = '',
        id = '',
        inputmode = 'text',
        autocomplete = '',
        spellcheck = 'false',
        ariaDescribedby = '',
        onenter = null,
        digitsOnly = false,
        rows = 1,
    }: {
        value?: string;
        presets?: Array<string | PresetOption>;
        placeholder?: string;
        disabled?: boolean;
        ariaLabel?: string;
        class?: string;
        style?: string;
        clearable?: boolean;
        error?: boolean;
        name?: string;
        id?: string;
        inputmode?: 'text' | 'numeric' | 'decimal' | 'email' | 'search' | 'tel' | 'url' | 'none';
        autocomplete?: string;
        spellcheck?: 'true' | 'false';
        ariaDescribedby?: string;
        onenter?: (() => void) | null;
        digitsOnly?: boolean;
        rows?: number;
    } = $props();

    let open: boolean = $state(false);
    let rootEl = $state<HTMLElement | null>(null);
    let inputEl = $state<HTMLInputElement | null>(null);
    let textareaEl = $state<HTMLTextAreaElement | null>(null);
    let dropdownStyle = $state('');
    let menuEl = $state<HTMLElement | null>(null);

    const multiline = $derived(rows >= 2);
    const hasPresets = $derived(presets.length > 0 && !multiline);
    const showClear = $derived(clearable && !disabled && !multiline && value.length > 0);

    const options = $derived(presets.map((p) =>
        typeof p === 'string' ? { value: p, label: p } : p
    ));

    function clear() {
        value = '';
        if (multiline) textareaEl?.focus();
        else inputEl?.focus();
    }

    function toggle(e: MouseEvent) {
        e.stopPropagation();
        if (!disabled) {
            open = !open;
            if (open) tick().then(positionDropdown);
        }
    }

    function positionDropdown() {
        if (!rootEl) return;
        const rect = rootEl.getBoundingClientRect();
        const ddh = Math.min(options.length * 36 + 8, 240);
        const r = floatingPosition(rect, { panelW: Math.max(120, rect.width), panelH: ddh, gap: 4 });
        dropdownStyle = `position: fixed; z-index: var(--z-max); ${r.style}`;
    }

    function pick(opt: PresetOption) {
        value = opt.value;
        open = false;
    }

    $effect(() => {
        if (!open) return;
        function onDoc(e: MouseEvent) {
            if (!rootEl?.contains(e.target as Node)) open = false;
        }
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    });
</script>

<div class="preset-input {className}" class:error class:multiline style={style || undefined} bind:this={rootEl}>
    {#if multiline}
        <textarea
            bind:this={textareaEl}
            bind:value
            {placeholder}
            {disabled}
            {name}
            {id}
            {rows}
            aria-label={ariaLabel}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={ariaDescribedby || undefined}
            onkeydown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.stopPropagation();
                    onenter?.();
                }
            }}
        ></textarea>
    {:else}
        <input
            type="text"
            bind:this={inputEl}
            bind:value
            {placeholder}
            {disabled}
            {name}
            {id}
            {inputmode}
            autocomplete={autocomplete as any}
            spellcheck={spellcheck}
            aria-label={ariaLabel}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={ariaDescribedby || undefined}
            onkeydown={(e) => {
                if (e.key === 'Enter') {
                    e.stopPropagation();
                    onenter?.();
                }
            }}
            oninput={(e) => {
                if (!digitsOnly) return;
                const val = (e.target as HTMLInputElement).value;
                const cleaned = val.replace(/\D/g, '');
                if (val !== cleaned) {
                    (e.target as HTMLInputElement).value = cleaned;
                    value = cleaned;
                }
            }}
        />
    {/if}
    {#if showClear}
        <button class="preset-clear" onclick={clear} tabindex="-1" type="button" aria-label="清除输入">
            <Icon icon={X} size={14} />
        </button>
    {/if}
    {#if hasPresets}
        <button class="preset-toggle" onclick={toggle} {disabled} tabindex="-1" aria-label="预设选项" aria-haspopup="listbox" aria-expanded={open}>
            <Icon icon={ChevronDown} size={16} />
        </button>
    {/if}
    {#if open}
        <div class="preset-menu" style={dropdownStyle} role="listbox" bind:this={menuEl}>
            <PillTrack
                container={menuEl}
                itemSelector=".preset-item"
                showSelected={false}
                hoverBackground="color-mix(in srgb, var(--primary) 15%, transparent)"
                radius="var(--radius-md)"
            />
            {#each options as opt}
                <button class="preset-item" role="option" aria-selected="false" onclick={() => pick(opt)}>{opt.label}</button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .preset-input { display: flex; align-items: center; height: var(--ui-md-height); background-color: var(--surface-2); border: 1px solid var(--border-strong); border-radius: var(--radius-lg); transition: border-color 0.2s; position: relative; min-width: 0; }
    .preset-input:focus-within { border-color: var(--primary); }
    .preset-input.error { border-color: var(--danger-text); }
    .preset-input.multiline { height: auto; flex-direction: column; align-items: stretch; overflow: visible; }
    .preset-input input { flex: 1; min-width: 0; height: 100%; padding: 0 4px 0 14px; background: none; border: none; outline: none; color: var(--text-strong); font-size: var(--ui-md-font); font-family: var(--font-mono); word-break: break-all; }
    .preset-input textarea { min-width: 0; min-height: 80px; padding: var(--sp-md) 14px; background: none; border: none; outline: none; color: var(--text-strong); font-size: var(--ui-md-font); font-family: var(--font-mono); word-break: break-all; resize: vertical; }
    .preset-input input:disabled, .preset-input textarea:disabled { opacity: 0.5; }
    .preset-clear { display: flex; align-items: center; justify-content: center; padding: 0 6px; background: none; border: none; color: var(--text-muted); cursor: pointer; transition: color 0.15s; align-self: stretch; }
    .preset-clear:hover { color: var(--text-strong); }
    .preset-toggle { display: flex; align-items: center; justify-content: center; padding: 0 8px; align-self: stretch; background: none; border: none; border-left: 1px solid var(--border); color: var(--text-muted); cursor: pointer; transition: color 0.15s; }
    .preset-toggle:hover:not(:disabled) { color: var(--text-strong); }
    .preset-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
    .preset-menu { position: fixed; overflow: auto; border-radius: var(--radius-lg); border: 1px solid var(--border); background-color: var(--surface); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25); z-index: var(--z-max); }
    .preset-item { position: relative; display: block; width: 100%; padding: var(--sp-md) var(--sp-xl); text-align: left; background: none; border: none; color: var(--text-strong); font-size: 13px; font-family: var(--font-mono); cursor: pointer; white-space: nowrap; }
</style>

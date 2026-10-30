---
name: goose-ui
description: Usage skill for the goose-ui Svelte 5 CSS-only component library. Use when the user asks to build Svelte/Wails3 UIs with goose-ui, asks about component usage, or needs theme colors.
---

# goose-ui Component Library Usage Skill

Svelte 5 component library (Runes), built for Wails3 desktop apps: 86 single-file components
under `src/lib/components/ui`. The only runtime peer dependency is `@lucide/svelte`
(**required** — a dozen components import its icons at module top level).
All components consume CSS custom properties; the theme is a single file.

Detailed docs live in the repo `docs/` (installation / component list / app shell / API /
theming); copy-paste examples for every component are in the online demo:
<https://goossee6.github.io/goose-ui/>

## Prerequisites

- Svelte 5 (runes mode) + `@lucide/svelte` (icons, required; `dependencies` is empty — no clsx etc.)
- Install: `pnpm add github:goossee6/goose-ui @lucide/svelte` (not published to npm; Vite needs
  `optimizeDeps: { exclude: ["goose-ui"] }`)
- Import the theme once in the app entry: `import "goose-ui/styles/theme.css";`
- Notification / confirm / error dialogs need their containers mounted at the App root:
  `<NotificationProvider />`, `<ConfirmDialog />`, `<ErrorDialog />`
  - When `showConfirm(message, opts)` needs to show a long list (a batch of PIDs / filenames),
    use `opts.detail` + `opts.detailLabel` — don't concatenate into `message`

## Component Selection Quick Reference

| Need | Component |
| --- | --- |
| Buttons / icon buttons | `Button` (variant: primary/default/ghost/danger/danger-solid/text/text-primary/link; `size` or `size={40}`; `xs` only pairs with text; `bind:element` for the real DOM node) |
| Card container | `Card` (title + right snippet) |
| Demo card (effect/source toggle) | demo-internal `CodePreview`, **not exported** — never use in app code |
| Input / multiline | `Input` / `Textarea` (clearable, status, prefix/suffix snippet) |
| Select single / multi / creatable / filterable | `Select` / `MultiSelect` / `CreatableSelect` / `Combobox` |
| Toggle / radio group / toggle group | `Toggle` (`loading` shows a spinner; `onStyle`/`offStyle`/`thumbStyle` for custom track colors) / `RadioGroup` / `ToggleGroup` |
| Checkbox / radio | `Checkbox` (small/middle/large + `indeterminate`) / `Radio` / `RadioGroup` |
| Collapse | `Collapsible` (single block expand/collapse, `variant`: card/plain) / `Accordion` (multiple panels, `value` array + `multiple`) |
| Date / time | `DatePicker` / `DateRangePicker` / `TimePicker` (inertia wheels) / `Calendar` / `RangeCalendar` |
| Segmented fields | `DateField` / `TimeField` / `DateRangeField` / `TimeRangeField` (focus selects the whole segment, type digits to overwrite; out-of-range input turns red, blur clamps to the valid range and zero-pads) |
| Overlays | `Modal` / `Drawer` (4 directions) / `Popover` / `Tooltip` / `AlertDialog` / `Command` (Ctrl+K); `Drawer` also supports `resizable`+`snapPoints` drag snapping, `container` to mount into a specific element, `backgroundSelector` for the depth-of-field host, `pushScale`/`pushBlur` for depth intensity |
| Notifications | `Notification.success/info/warning/error(...)` (requires Provider) |
| Table / list | `DataTable` (sort + highlight + context menu) / `DataList` |
| Feedback | `Progress` family / `UsageBar` / `Meter` / `Skeleton` / `Loading` / `Empty` |
| Shell (Wails3) | `Layout` + `Sidebar` + `TitleBar` + `Page` + `PageHeader` |
| Navigation menus | `NavigationMenu` / `Menubar` / `DropdownMenu` / `ContextMenu` |

## Key Conventions

1. **Changing theme colors = overriding role hex values**: `:root { --accent: #1850ec; --complement: #009145; ... }`,
   or in JS: `setColor('accent', '#1850ec')` / `setColors({...})` / `setColor('accent', null)` to restore defaults.
   `-hover` / `-soft` / `-text` / `-border` are derived automatically via `color-mix()` — never write them by hand;
   a separate dark-theme set goes inside `.dark { }`.
2. **`--hue-*` only affects gradient hue offsets** (currently only `--gradient-accent` uses it), **changing it does not change any color**.
   Same for `setHue(role, hue)` — it only serves the "pick a neighboring hue" gradient scenario.
3. **Old names remain aliases**: `--primary*` points into the `--accent` system; new code uses `--accent` /
   `--accent-sub` (tinted background, **not** a hover background) / `--accent-ring` (focus ring) /
   `--complement` (contrast slot).
4. **Neutral backgrounds never get tinted**: `--bg` / `--surface*` / `--border` are achromatic; don't bind them to
   hues or theme colors. Overlay backgrounds go through `--popup-surface` separately.
5. **The notification API uses no context**: `Notification.xxx()` goes through a global singleton; for an isolated
   container use `createNotificationStore()` + `createNotification(store)` + `<NotificationProvider store={...} />`.
6. **Snippets must be self-contained**: the first line of any example given to the user must be
   `import { ... } from "goose-ui";`; never reference demo-private classes; write `</script>` as `<\/script>`
   inside template strings.
7. **Props/parameter tables use plain `Card`**; the "effect/source" toggle is only for component usage demos.
8. **Two-way binding**: controlled values use `$bindable` (`bind:value`); Tabs semantics are "write `value` first, then the callback".
9. **Overlay positioning is built in** (viewport clamping + flipping); never hand-roll getBoundingClientRect styles in app code.
10. **z-index**: use the `--z-overlay/--z-dropdown/--z-popover/--z-dialog/--z-notification` ladder; no magic numbers.
    Stacked `Modal`s manage themselves: components take a `layerId` in open order and stack as `calc(var(--z-overlay) + id)`.
    Calling `showConfirm` inside a business modal still stacks correctly on top — don't rely on DOM order
    (`ConfirmDialog` is usually mounted before the layout).
11. **Wails3 shell**: `Layout` provides only `titlebar` / `aside` / `children` slots, no built-in components;
    put `TitleBar` in `titlebar`, `Sidebar` in `aside` (or omit it and use a `Drawer` instead).
    `theme={themeStore.theme}` + `onThemeToggle={toggleThemeFromEvent}` gives the circular-reveal theme switch.
12. **Title bar search**: pass `searchable` + `searchItems` to `TitleBar` for inline search (`↑↓`/`Enter`/`Esc`).
    Width is adaptive and **has no configurable prop**: capped at 40% of the title bar's free space, hidden
    entirely below 450px. `group` groups entries; `keywords` makes Chinese labels searchable by English text.
13. **One scroll container, one owner**: when the content area hosts a `Page`, scrolling belongs to `Page`'s
    `.page-body` and the `Layout` card yields automatically (`:has(> .page)`); with a custom non-`Page` page
    inside the content area, the card scrolls itself. Mixing both models makes body width differ by a scrollbar
    width — stick to `Page` for consistency.
14. **Hover hints always use `Tooltip`, never native `title`** (native tooltips render as light system squares in dark mode).
    - The trigger is a `span` (inline-flex), safe to place inside a `<button>`
    - The bubble portals to `body`; wrapping can break the original `flex: 1` / `margin-left: auto` /
      `text-overflow: ellipsis`, compensate on the trigger with
      `:global(.xxx-tip){ flex:1 1 auto; min-width:0 }`
    - Default delay is 200ms; override with `delay`
    - Exception: `DataTable` plain-text cells still use native `title` (too many cells to be worth it)
15. **Never render empty-string `title` / `aria-label` into the DOM**: write `title={title || undefined}`,
    otherwise it both participates in native-tooltip hit testing and duplicates the outer `Tooltip`.
16. **For hand-written overlay animations use `menuIn` / `menuOut`** (two directives because in/out durations differ),
    and the condition must be on a single `{#if}` — Svelte 5 does not play intros for elements inside nested
    `{#if}` blocks (`out:` is unaffected; testing only the close path will make the animation look fine).
    Durations collapse to zero under `prefers-reduced-motion: reduce`.
17. **Don't hand-write `:hover { background }` for grouped hover highlights — use `PillTrack`**
    (the sliding highlights in Sidebar / Tabs / DataTable / DataList are all drawn by it). Usage notes:
    - Colors: hue means "selected" (`--primary` solid + `--accent-text`), grayscale means "the pointer is here"
      (`var(--hover)`); when the pointer rests on the selected item, pass
      `activeHoverBackground="var(--primary-hover)"` — don't cover the theme color with gray.
      Action menus with no persistent selection (Command / DropdownMenu / ContextMenu) use the solid theme color
      as the landing color. Always opaque — translucent values like `--accent-sub` read as three different colors
      over different backgrounds.
    - Gaps between items are attributed to the nearest item (`gapBridge`, default 12px, `0` disables), so the pill
      doesn't flicker crossing gaps.
    - **Foreground color follows `data-pill-on`, not `:hover`** (when the pill rests on the nearest item the pointer
      may be over a gap, where `:hover` is already false). Components set `data-pill-on="hover"|"active"|"custom"`;
      wrap the attribute-bearing part of the selector in `:global()` (Svelte's static analysis can't see runtime
      attributes): `.dropdown-menu :global(.dropdown-item[data-pill-on='hover']:not(:disabled)) { … }`
    - Keyboard focus has no pill driving it; add a CSS fallback with `:not(:hover)`:
      `.item--active:not(.item--selected):not(:hover) { background: var(--hover) }`
18. **When doing a light/dark preview inside a subtree, alias tokens must be redeclared in that subtree**:
    `var()` resolves at the layer where it's declared, so when a nested container changes `--accent`, aliases like
    `--primary: var(--accent)` won't follow — rewrite them verbatim on the container and add `color: var(--text)`.
19. **Gradients have exactly one source: `--gradient-accent` / `--gradient-accent-hover`**. Never hand-write
    `linear-gradient(90deg, var(--accent), var(--complement))` (wide hue spans get muddy). The hover variant only
    lightens, never shifts hue. Old name `--titlebar-logo-gradient*` remains as an alias.
20. **For overlays nested inside overlays, outside-click detection goes through `isInsideLayer` — never hand-roll
    `contains`** (panels portal to `body`, so `contains()` can't attribute sub-panels; the missed-hit symptom is
    "select options inside a popover don't respond to clicks"). Panels carry `data-overlay-layer`, call
    `registerLayer` before portaling, and check `isInsideLayer(e.target, layerId, [rootEl, panelEl])`.

## Writing Custom Controls

- **Visually hidden native inputs must land inside their label**: a `position: absolute` input requires the
  carrying label to have `position: relative` and `margin: 0` (Chrome's UA margin for checkboxes is
  `3px 3px 3px 4px`); otherwise clicking the label makes the browser scroll the input's position into view and
  the whole page jumps.
- **Fixed control heights don't come from padding**: use `height: var(--height-md)` + an explicit `line-height`;
  for long text use `min-width: 0` + `overflow: hidden` + `text-overflow: ellipsis` truncation — never let it
  wrap and grow the height.

## Common Combinations

- Form validation: `Form`/`FormItem` (context carries layout/labelWidth) + `Input` status + `Notification` feedback
- Context menus: `registerMenu(name, items)` + `cellMenuAttrs(name, data)` bound to cells +
  `onMenuAction(name, action, handler)` (for the same (menu, action) pair only the last handler is kept)
- Page skeleton: `Page` (header + content + sticky footer) hosting `Card` / `CodePreview`;
  nested `Page` passes `transition={false}`
- Long-list scrolling: `ScrollArea` (`ScrollZones` is an internal, non-exported part; the dropdown scroll areas
  of the Select family are already built in)

## Anti-patterns (do not do)

- Don't call `getContext()` inside event handlers (Svelte 5 throws lifecycle_outside_component)
- Don't nest `<button>` inside `<button>` (SSR hydration mismatch); make the clear button an absolutely positioned
  sibling of the trigger
- Don't use `document.querySelector` to grab DOM outside your own component for positioning; prefer `bind:this`
- Don't put "effect/source" toggles on intro or doc pages (that's for component demos only)
- Don't write percentages inside `min-width` (e.g. `min-width: min(var(--x), 100%)`): percentages resolve against
  the **containing block width**, not the remaining flex line space, so they break on narrow windows and overflow
  onto adjacent components. For elastic shrinking use `flex: 1 1 <basis>` + `min-width: 0`
- Don't expect `flex` shrinking to compress padded/bordered elements to zero — they are not compressible; use
  `@container` / explicit hiding to degrade gracefully at narrow widths

## Self-check & Verification

After changes, run (from the repo root):

```bash
pnpm check                             # svelte-check type check (with --fail-on-warnings)
pnpm test                              # unit tests (node --test, tests/*.test.ts)
pnpm build                             # confirm it builds
```

Layout changes (width, overflow, overlap) escape type checking — verify in a real browser by dragging the window
narrow: the search box must not overlap the logo or the three window buttons at any width step, must not overflow
the title bar, and the three buttons must not get compressed. Note that `set value + dispatch('input')` does not
work with Svelte 5's `bind:value`; scripted verification requires real input events (CDP's `Input.insertText`).

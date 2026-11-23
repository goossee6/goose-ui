---
name: goose-ui
description: Usage skill for the goose-ui Svelte 5 CSS-only component library. Use when the user asks to build Svelte/Wails3 UIs with goose-ui, asks about component usage, or needs theme colors.
---

# goose-ui Component Library Usage Skill

Svelte 5 component library (Runes), built for Wails3 desktop apps: 86 single-file components
under `src/lib/components/ui`. The only runtime peer dependency is `@lucide/svelte`
(**required** — a dozen components import its icons at module top level).
All components consume CSS custom properties; the theme is a single file.

Detailed docs live in the repo `docs/` (index: `docs/README.md`). Read the one you need instead of guessing:

| Need | Read |
| --- | --- |
| props of one component (type / default / `$bindable`) | `docs/api-reference.md` — generated from source, 83 components / 772 props |
| what a component is, and its group | `docs/components.md` — one line each, **grouping is authoritative** |
| app shell: `Layout` / `Page` / `Sidebar` / `TitleBar`, page TOC, page transitions | `docs/shell.md` |
| imperative APIs: notification / confirm / error / context menu / `menuIn` / `PillTrack` | `docs/api.md` |
| colors, CSS variables, utilities | `docs/theming.md` |
| which spacing / font / radius value to write | `docs/grid.md` |
| editing this library itself (repo map, hard rules, checklists) | `docs/AGENTS.md` |

Copy-paste examples for every component are in the online demo:
<https://goossee6.github.io/goose-ui/> (each page toggles "effect / source"; sources live in
`demo/src/lib/demos/`).

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
| Date / time | `DatePicker` / `DateRangePicker` / `DateTimeRangePicker` (presets + date+time to the second) / `TimePicker` (inertia wheels, loops forever) / `Calendar` / `RangeCalendar` |
| Segmented fields | `DateField` / `TimeField` / `DateRangeField` / `TimeRangeField` (focus selects the whole segment, type digits to overwrite; an out-of-range segment is **rejected on input** and reverts to its value before the edit; blur only zero-pads) |
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
    - **Manual mode**: pass `anchor={el}` + `open={bool}` to drive the bubble yourself — the built-in
      trigger is not rendered. Use it when one bubble must serve many hosts (thousands of table cells,
      chart nodes) instead of mounting one `Tooltip` per host. `DataTable` does exactly this: cells carry
      `data-tip`, and a single delegated bubble shows only when the content is actually clipped.
      `cellTip={false}` turns it off. `overflow: 'scroll'` columns skip the bubble and instead run a
      hover-triggered marquee (content duplicated once, `translateX(-50%)` loops seamlessly).
    - `Combobox` uses it too for truncated option labels, but drives the anchor from `activeIndex`
      (hover and arrow keys already share that one source) instead of a second `pointerover` delegate.
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
    - **The bounce has a fixed overshoot distance** (`bounce`, px, default 10) — not a percentage of the travel.
      A `cubic-bezier` with y > 1 overshoots by a fraction of the distance, so a 2-row hop bounces 2px and a
      20-row hop bounces 20px. Movement is therefore driven by `element.animate` keyframes (start → peak at 60% →
      landing), and `transform` is deliberately absent from the CSS `transition` list. `bounce={0}` = no overshoot.
    - **Never animate from a position the user can't see.** Empty geometry (first mount), the parked
      `translate(0,0)`, or a previous landing that has been scrolled out of the container all mean "no start
      point": place the pill instantly instead (and skip the fade). This is what stops the phantom pill that
      flies in from the top of the page after clicking a nav item in a scrolled sidebar.
    - Gaps between items are attributed to the nearest item (`gapBridge`, default 12px, `0` disables), so the pill
      doesn't flicker crossing gaps. Attribution only considers items that are **actually visible**: a collapsed
      `grid-template-rows: 0fr` panel still lays its rows out at full height (36px rects, `elementFromPoint` never
      hits them), so they must be filtered out or gap hovers land the pill on an invisible row.
    - **When the pointer is already on the newly-activated item, the hover pill plays the slide.** Clicking means
      the pointer is there, so the hover pill is already parked on the target; letting the selected pill travel
      from the old item makes two layers land on one row and the activation animation stops looking like a normal
      hover. Same node, same keyframes, same start-point rules — only the landing color differs
      (`--primary-hover` pressed state).
    - **The selected pill becomes the backdrop for that slide.** The newly-activated item switches to
      `--accent-text` (white) on the same frame; with no block underneath it is white-on-white until the slide
      arrives. So the selected pill is **visible the whole time it is selected** — do not fade it out when the
      pointer rests on it, or the backdrop disappears for exactly as long as the pointer stays there. When the
      pointer is *not* on the item (keyboard navigation, external `value` change), the selected pill still
      slides on its own.
    - **The pressed darkening lives on the stationary selected pill**, as a `background` transition to
      `activeHoverBackground` — never on the moving hover pill. A layer that both travels and carries "this row
      is active" crossfades its color *while passing over the active row*: measured brightness 79 → 111 → 58
      entering (lights up, then dims) and 58 → 194 → 79 leaving (a white flash), which is the flicker. With the
      selected pill always painted and the hover pill below it (same `z-index`, later in DOM), the moving layer's
      intermediate colors are covered up entirely, and the only color change left is a monotonic in-place fade.
    - **Never re-run a slide to the same landing.** Layout re-checks (`resync`) call `slidePill` again with the same
      target while the pill is still at its overshoot point — the distance check passes and it restarts from
      mid-flight, bouncing a second time (measured: an extra 303.5 → 298 animation 300ms after settling).
    - **Don't cache per-item pill positions.** Collapsing a group is a pure `grid-template-rows` transition: no DOM
      mutation, no container resize, no scroll — every invalidation signal stays silent, and a cached box then puts
      the pill where the item used to be (measured 264px off). Offsets are re-read per hover; that is cheap.
    - **The selected pill also has to re-measure on container resize** (`ResizeObserver`), not just on DOM mutations.
      Collapsing the sidebar (`width: 56px ⇄ 220px`, 0.3s) mutates nothing while it animates, and its
      `activeSelector` flips to `''` (no `.nav-item` exists in the icon rail), so the measuring effect is torn down
      and rebuilt on expand — the rebuilt `MutationObserver` never sees the insert that already happened. Without
      the resize observer plus one immediate re-measure inside the effect body, the pill keeps the width measured on
      the first frame of the expand animation (30px against a 178px row) and never corrects itself.
    - **During a layout transition the pill tracks the layout frame by frame** (`trackLayout`), with slide animations
      skipped and any leftover `pill-slide` cancelled (`fill: none` animations outrank the inline `transform`, so a
      running one drags the whole follow ~3px behind). Waiting for `transitionend` instead snaps the pill at the end
      of a 0.25s group expand (item travels 288 → 362 while the pill sits at 288); using `slidePill` instead can't
      keep up with 3–5px per frame. Only layout-affecting `transitionrun`s start tracking — every row carries
      `transition: color .15s`, and while tracking the selected pill skips its slide, so keyboard switching would
      teleport.
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
    The current set of layer hosts is **Popover, DropdownMenu, the four dropdowns (via `createDropdownPanel`), the four
    date/time pickers (via `createPickerPanel`), NavigationMenu and ContextMenu**. The two that are easy to forget are
    the ones that don't portal: `ContextMenu` renders at the app root, so its parent layer can only be captured **at
    contextmenu time** (`layerOwnerOf(the right-clicked element)`) — the ancestor chain is gone once the menu opens;
    `NavigationMenu` keeps its panel inline but a `Select` inside it still portals away. Same trap on `scroll`: the
    capture listener sees the sub-panel's own scrolling, so guard it with `isInsideLayer(e.target, ...)` too.
21. **Write style values from the scale, not as literals**: spacing `--space-{n}` (n = px / 4, sub-steps through
    `--space-0-5` = 2px / `--space-1-5` = 6px), font size `--fs-{px}` (10–20 in 1px steps), radii
    `--radius-xs|sm|md|lg|xl|full`, control heights `--height-sm|md|lg` (28 / 36 / 44 — sizes are an enum, not
    a scale). Borders (1px/2px), shadows, offsets and letter-spacing stay literal on purpose. `pnpm grid:audit`
    fails on tokens that don't exist or whose name doesn't match their value.

22. **Free-text inputs validate and reject, never sanitize**: `Input` / `Textarea` / `DateField` / `TimeField` accept
    `validate?: (value: string) => string | boolean | null` + `oninvalid(msg)`. A non-empty string (or `false`) means
    invalid — the control restores the value from before the edit, paints the error border and sets `aria-invalid`;
    the message goes to `oninvalid` (and `title`), it is not rendered inline. Omit `validate` and nothing changes.
    Segmented fields reject an out-of-range segment **as it is typed** (not on blur), so a bad value never reaches
    the bound model; blur only zero-pads.

23. **Date/time overlays commit on「确认」, not on pick**: `DatePicker` / `DateRangePicker` / `TimePicker` /
    `DateTimeRangePicker` keep a local draft while the panel is open — clicking a day or settling a wheel only
    mutates the draft, `value` / `start` / `end` and `onchange` fire once on confirm; `取消` (or Esc / outside click)
    drops the draft and leaves the bound value untouched. The footer is the shared `PickerFooter` component:
    `取消` + `确认` on the right, one optional secondary shortcut (`今天` / `现在` / `清除`) on the left — never
    hand-write those two buttons, and never put a hint string (`选择开始日期` etc.) in that row.
    `Calendar` / `RangeCalendar` render the footer only when `oncancel` / `onconfirm` are passed, so they stay
    usable as plain static cards.

24. **`Wheel` is transform-driven, not scroll-driven**: three identical copies of `items` sit in one strip, and a
    single `translate3d(0, -(pos + 0.5) * var(--wheel-item-h), 0)` moves it. The cell height lives in **one** place:
    `ITEM_H` in the script is pushed down as `--wheel-item-h`, and the band / item / container heights all read that
    variable. Never write `36px` into the stylesheet again — a second copy silently desyncs the transform from the
    rows. `pos` is a float in *grid* units, and every write goes
    through `norm()`, which folds it back into the middle copy (`[N, 2N)`) — one period of content, so the fold is
    pixel-identical and invisible. There is therefore **no wall to hit and nothing to "refill"**: fast flings just
    keep going. Do not reintroduce native scrolling / `scroll-snap` / a `reseat-on-settle`; those are what produced
    the end-of-strip stop and the settle jitter. Two invariants: `onSettle` / `index` speak **real** indices
    (`pos % N`), and only the middle copy's buttons carry `aria-selected` (the other two copies are `aria-hidden`,
    purely visual). Never key the `{#each}` by item value — repeated items collide; key by index.
    Pointer capture is deliberately **not** used: the drag listens on `window` and ends the moment the pointer
    leaves the wheel (24px slack), so moving onto another wheel never keeps dragging the first one.

25. **Wheel *wheel-input* is speed-adaptive, and applied by exponential approach**: one discrete tick
    (`deltaY ≈ 100`) moves exactly **one** cell while the user scrolls slowly; ticks arriving faster than ~150ms
    scale the step up (cap 3 cells/tick), so 0-59 doesn't take forever. Do not go back to `deltaY / 36` — that made
    a single tick jump ~3 cells (13 → 15) and was the "not smooth" complaint. The input goes through `glide()`,
    which writes `pos += d * (1 - exp(-dt / tau))` every frame instead of starting a fixed-duration tween: discrete
    ticks would otherwise restart the easing each time and visibly hitch, whereas the exponential velocity is
    continuous and `wGoal` can advance mid-flight so consecutive ticks merge into one motion. `tau` shrinks when the
    remaining distance is large, so fast scrolling still keeps up. Touchpads (small `deltaY`, ticks < 24ms apart)
    take a pixel-proportional branch and stay fully continuous. `wGoal` is a float — the nearest cell is reached by
    a short `animateTo` snap at rest, never a hard jump; and the wheel handler must `stopAnim()` first so a residual
    fling doesn't fight `glide()` for `pos`.

26. **Typing and the wheel are one control, not two**: `SegmentField` exposes `onsegmentfocus(index)`, and
    `DateField` / `TimeField` pass it straight through. That single callback is how a picker wires "click the 分
    segment" to "open the wheel and highlight that column" — the segment is already focused and editable by the time
    the popup appears, and `onSettle` writes back into the same draft, so both inputs stay in sync. `TimePicker` puts
    a `TimeField` above its wheels for exactly this; `DateTimeRangePicker` does it per row and marks the live column
    with `.active`. Four invariants, each learned the hard way:
    - `TimeField`'s join must keep empty segments **in place** (`['', '07', '00']` → `:07:00`). Dropping the leading
      empty shunts minute into hour the moment someone clears the hour box.
    - Mid-typing values (`12:3`) must be written **raw**: `padStart` fights the caret and `orderRange` will swap the
      two ends mid-keystroke. Pad + `orderRange` once, on confirm.
    - Wheel indices must match by **number** (`Number(x) === Number(v)`), never `indexOf` — `3` never equals `03`,
      and a miss silently throws the column to `00`.
    - A controlled field must show the draft, not the committed value; otherwise a wheel click and the digits above it
      disagree. `DateTimeRangePicker` derives the field text from the draft for this reason.
    - **A rejected keystroke must be pulled back out of the input by hand.** When `setCell` refuses a value (月 `13`),
      the state keeps the old text — so if it was already `09`, `value` does not change and Svelte skips the DOM write
      entirely. The box then displays `13` (red) while the model still says `09`, and blur "normalizes" the clean state,
      so nothing ever repairs it. `handleInput` / `handlePaste` therefore write the accepted text straight back into
      `el.value` (`syncDom()`) instead of trusting the re-render.

    Layering, so a new field is config only: `SegmentField` owns one cell's typing/jump/validation, `SegmentedTextField`
    owns "whole string ⇄ fixed segments" (`splitFixed` in, `joinTrimmed` out, then `onchange` upward), and `DateField` /
    `TimeField` supply nothing but `widths` / `ranges` / `separator` / `placeholders`. Segment **count** comes from the
    config, never from how many separators happen to appear — `2026-11` must still produce three slots, or the day cell
    loses its value and the calendar jumps to the wrong month.

27. **An externally changed `index` must glide, not teleport — and always by the shortest way round.** "Now",
    presets and typed values all land as a new `index`; assigning `pos` directly makes three columns snap at once and
    reads as a glitch. The sync effect calls `glideTo()`, which resolves the target through `wrapDelta()`, so `23 → 00`
    turns one cell (not 23) and `59 → 02` turns four (not −57). External jumps use `easeInOutCubic` and a
    distance-scaled duration (150ms + 16ms/cell, capped 480ms) because an `easeOut` start has non-zero velocity and
    visibly "pops" out of rest; click-to-select and settle keep the snappier `easeOutCubic`. Two traps: the effect must
    wrap the glide in `untrack()`, otherwise it reads `pos` while animating and re-runs every frame; and the
    first-mount branch (`seenIndex < 0`) must still jump instantly — a panel opening should not roll from `00` to the
    current value.

28. **A nested popup keeps its own draft.** `DateTimeRangePicker`'s time popup edits `tmpT`, never `dStart`/`dEnd`:
    wheels and typing both write that one string, and only its own footer commits (through `setSide` → `orderRange`)
    or drops it. Switching to the other side, `Esc`, and an outside click are all "cancel" — none of them may leak a
    half-edited time into the range. The two `TimeField`s must render `tmpT` while that side is open
    (`startShown` / `endShown`), otherwise the digits above the wheel and the wheel itself disagree. The popup is a
    fixed 240px so the footer buttons don't drift with font metrics, and its flip direction is decided by the popup's
    **measured** `offsetHeight` (in an `$effect` keyed off `timeSide`), not by an estimated constant — the estimate
    went stale the first time a footer was added.

29. **Shared logic lives in `ui/*.ts`, never inside a `.svelte` file.** `RangeCalendar` used to do
    `import { WEEKDAYS, toISO } from './Calendar.svelte'` — pulling a whole component (and its styles, its
    `PillTrack`) into the dependency graph to get four pure functions. The current module map:
    - `dateParts.ts` — `pad2` / `padTo`, `indexFloor` / `indexNearest` (match by **number**, never `indexOf`),
      `joinTrimmed` (mid-typing: keeps empty segment slots) vs `normalizeParts` / `normalizeTime` (commit: pads and
      fills `00`), `splitFixed` (the inverse of `joinTrimmed`: fixed segment **count** from config, missing slots become
      `''`, extras dropped), and `timeColumns(steps, seconds)` for the wheel lists. If you find yourself writing
      `padStart(2)` or a "join/split the time segments" helper in a component, it belongs here.
    - `calendarGrid.ts` — `buildCells` / `shiftByArrow` / `shiftMonth` / `blocked` for Calendar and RangeCalendar.
    - `datetimeRange.ts` — presets and `YYYY-MM-DD HH:mm:ss` ordering/validation.
    - `pickerPanel.svelte.ts` — `createPickerPanel()` owns open/close, `floatingPosition`, outside-click and `Esc`
      for all four date/time pickers. It is a **behavior** helper, not a markup wrapper: each picker keeps its own
      trigger/clear styles. `onEscape` lets an inner popup consume `Esc` first (the range picker's time popup).
    - `dropdown.svelte.ts` — `createDropdownPanel()` (the same four concerns for the four dropdowns),
      `revealOption()` (keep the keyboard row in view), `createEllipsisTip()` (one tooltip + one anchor instead of a
      `Tooltip` per row — see item 30).
    - `motion.ts` — `prefersReducedMotion()`. Never `matchMedia('(prefers-reduced-motion: reduce)')` again; Button
      once shipped a version that dropped `.matches` and silently never animated.
    - `wheelMath.ts` — `foldPos` / `shortestDelta` / `activeIndexAt` / `selectedAt` / `stripOffsetY`, plus
      `deltaToPx` / `wheelStep` / `keyTarget` for input handling. This is where "one wheel tick = one cell", "59 → 00
      turns one cell", "trackpad is not a discrete wheel" and "Home/End land mid-strip" are pinned down; every function
      takes `n` explicitly so all three columns share it. Bugs here never throw — they only feel wrong — so `tests/`
      is the only place they get caught.
    - `segmentCells.ts` — `cellValues` / `rangeOf` / `isLegal` / `isOutOfRange` / `normalizeCells` / `pasteCells`:
      which value counts as a legal segment, what happens on blur, how a pasted `20261123` is split. `SegmentField`
      keeps only DOM events and focus jumps.
    Cross-imports between these `.ts` files must carry the **`.ts` extension** (`from './dateParts.ts'`): `tests/`
    runs them through plain `node --test`, whose ESM resolver rejects extensionless specifiers. `demo/tsconfig.json`
    therefore sets `allowImportingTsExtensions`; `.svelte` files may keep extensionless imports.

30. **The four dropdowns are one control with four triggers.** `Select`, `Combobox`, `MultiSelect` and
    `CreatableSelect` share `createDropdownPanel()` plus three internal components (`DropdownPanel` — shell, `menuIn`/
    `menuOut`, optional portal; `DropdownOption` — row, `variant: 'single' | 'multi'`; `DropdownGroup` — sticky header).
    Four copies had already drifted: only `Select` portaled its panel, only three kept the keyboard row in view, only
    two had a `mounted` gate (the rest pinned `position: fixed` in CSS to survive the first frame). When adding a fifth
    dropdown, reuse these — do not copy a trigger and re-derive the plumbing.
    - **`anchor` ≠ `root`**: the anchor is what the panel is positioned against (Combobox: the input's control box, so
      width and flip are right), the root is what counts as "inside" for the outside-click test (Combobox: the whole
      `.combobox`, because the panel is its **sibling**). Reusing the anchor for both closes the panel on `mousedown` of
      an option — the option then never receives `click`, which reads as "clicking an item does nothing".
    - **Row height has one source**: `ROW_H` / `MAX_ROWS` from `rowHeight.ts` feed both `rowsHeight()` (panel height)
      and, as `--dd-row-h` / `--dd-max-rows`, the list's `max-height`. `CreatableSelect` used to hardcode `360`/`36`/`44`,
      so changing the row token silently desynced the panel height from the visible rows.
    - **Option clicks are handled on `mousedown` with `preventDefault()`** for all four: without it focus leaves the
      input (Combobox) or the trigger, and closing on blur fights the selection.
    - Options carry `tabindex="-1"`; the keyboard row is tracked by `aria-activedescendant` (Select, Combobox,
      MultiSelect) and by `.active` styling (CreatableSelect — its focus is in the search box). `Tab` never enters
      the list.
    - **MultiSelect's trigger is a `combobox`, never a `button`.** `role="button"` makes its whole subtree
      *presentational*, so every badge's remove button disappeared from the accessibility tree while staying
      focusable — the worst of both. As a `combobox` the tag labels become the control's value, and `aria-controls` /
      `aria-activedescendant` become legal. Two consequences: the `×` buttons are `aria-hidden` + `tabindex="-1"`
      (otherwise screen readers read "×" as part of the value), so keyboard removal goes through `Backspace` /
      `Delete`, announced by a one-line `.sr-only` `aria-live="polite"` region; and a disabled trigger gets
      `tabindex="-1"`, since a div has no native `disabled`.

## Writing Custom Controls

- **The demo may not style a component's internals.** Every visual fix belongs in the component. Concretely, in
  `demo/` you may not (a) reach inside a component with `:global(.component-internal-class)`, (b) wrap it in a
  container whose CSS changes how the component itself looks (height, padding, border, background), or (c) lean on
  a demo-scoped class that readers copying the shown source won't have. Layout scaffolding (flex row, gap,
  constrained width, a fixed-height scroll box) is fine — the component's own box must be untouched.
  When the demo seems to need more, the API is missing something: add the prop (e.g. `Layout framed={false}` for a
  chrome-less content area, `Drawer offsetTop` for drawers under a title bar) and use that instead.
  `demo/cleanroom.html` renders the same components with defaults and no wrapper — open it next to the demo page to
  see the difference. It is a dev-only entry (not in the production build).

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
pnpm build                             # demo build + per-file budget (any file >500KB fails)
pnpm grid:audit                        # style tokens exist and their names match their values
pnpm docs:api                          # after touching props: regenerate docs/api-reference.md
```

Layout changes (width, overflow, overlap) escape type checking — verify in a real browser by dragging the window
narrow: the search box must not overlap the logo or the three window buttons at any width step, must not overflow
the title bar, and the three buttons must not get compressed. Note that `set value + dispatch('input')` does not
work with Svelte 5's `bind:value`; scripted verification requires real input events (CDP's `Input.insertText`).

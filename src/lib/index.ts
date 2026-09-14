// goose-ui — barrel export
// Utils
export { cn } from './utils/cn';
export { formatNum, formatBytes } from './utils/format';

// Types
export type { MenuItemDef, MenuActionData } from './components/contextMenu';
export type { Column } from './components/tableTypes';
export type { SortState, SortDir } from './components/sorting';
export type { ErrorEntry } from './components/errors';

// Icons
export { Icon } from './components/ui/Icon.svelte';

// Stores
export { toastStore, showToast, showErrorToast, errorToString } from './components/toast';
export { confirmStore, showConfirm } from './components/confirm';
export { errorStore, pushError } from './components/errors';
export { menuStore, registerMenu, unregisterMenu, openMenuAt, closeMenu, onMenuAction, dispatchMenuAction, cellMenuAttrs } from './components/contextMenu';

// UI Components
export { default as Button } from './components/ui/Button.svelte';
export { default as Card } from './components/ui/Card.svelte';
export { default as Checkbox } from './components/ui/Checkbox.svelte';
export { default as CreatableSelect } from './components/ui/CreatableSelect.svelte';
export { default as DataList } from './components/ui/DataList.svelte';
export { default as DataTable } from './components/ui/DataTable.svelte';
export { default as DropZone } from './components/ui/DropZone.svelte';
export { default as MultiSelect } from './components/ui/MultiSelect.svelte';
export { default as PresetInput } from './components/ui/PresetInput.svelte';
export { default as Input } from './components/ui/Input.svelte';
export { default as Label } from './components/ui/Label.svelte';
export { default as LoadingGif } from './components/ui/LoadingGif.svelte';
export { default as Modal } from './components/ui/Modal.svelte';
export { default as PageHeader } from './components/ui/PageHeader.svelte';
export { default as ProgressBar } from './components/ui/ProgressBar.svelte';
export { default as ProgressBytes } from './components/ui/ProgressBytes.svelte';
export { default as ProgressSlotBar } from './components/ui/ProgressSlotBar.svelte';
export { default as SegmentedTabs } from './components/ui/SegmentedTabs.svelte';
export { default as Select } from './components/ui/Select.svelte';
export { default as StatusBadge } from './components/ui/StatusBadge.svelte';
export { default as Toast } from './components/ui/Toast.svelte';
export { default as ToastItem } from './components/ui/ToastItem.svelte';
export { default as TitleBar } from './components/ui/TitleBar.svelte';
export { default as Layout } from './components/ui/Layout.svelte';
export { default as Toggle } from './components/ui/Toggle.svelte';
export { default as Typewriter } from './components/ui/Typewriter.svelte';
export { default as UsageBar } from './components/ui/UsageBar.svelte';

// Providers
export { default as ConfirmDialog } from './components/providers/ConfirmDialog.svelte';
export { default as ErrorDialog } from './components/providers/ErrorDialog.svelte';

// Menus
export { default as ContextMenu } from './components/menus/ContextMenu.svelte';

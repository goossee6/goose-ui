// goose-ui — barrel export
// Utils
export { cn } from './utils/cn';
export { formatNum, formatBytes } from './utils/format';
export { copyToClipboard } from './utils/clipboard';

// Icons
import Icon from './components/ui/Icon.svelte';
export { Icon };

// Stores
export { notificationStore, Notification, errorToString } from './components/notification';
export { errorStore, pushError } from './components/errors';
export { menuStore } from './components/contextMenuStore.svelte';
export { registerMenu, unregisterMenu, openMenuAt, closeMenu, onMenuAction, dispatchMenuAction, cellMenuAttrs } from './components/contextMenu';

// Types
export type { NotificationType, NotificationPosition, NotificationOptions } from './components/notification';
export type { MenuItemDef, MenuActionData } from './components/contextMenu';
export type { Column } from './components/tableTypes';
export type { SortState, SortDir } from './components/sorting';
export type { ErrorEntry } from './components/errors';

// UI Components
import Button from './components/ui/Button.svelte';
import Card from './components/ui/Card.svelte';
import Checkbox from './components/ui/Checkbox.svelte';
import CreatableSelect from './components/ui/CreatableSelect.svelte';
import DataList from './components/ui/DataList.svelte';
import DataTable from './components/ui/DataTable.svelte';
import DropZone from './components/ui/DropZone.svelte';
import MultiSelect from './components/ui/MultiSelect.svelte';
import PresetInput from './components/ui/PresetInput.svelte';
import Input from './components/ui/Input.svelte';
import Label from './components/ui/Label.svelte';
import LoadingGif from './components/ui/LoadingGif.svelte';
import Modal from './components/ui/Modal.svelte';
import PageHeader from './components/ui/PageHeader.svelte';
import ProgressBar from './components/ui/ProgressBar.svelte';
import ProgressBytes from './components/ui/ProgressBytes.svelte';
import ProgressSlotBar from './components/ui/ProgressSlotBar.svelte';
import SegmentedTabs from './components/ui/SegmentedTabs.svelte';
import Select from './components/ui/Select.svelte';
import StatusBadge from './components/ui/StatusBadge.svelte';
import NotificationProvider from './components/ui/NotificationProvider.svelte';
import NotificationItem from './components/ui/NotificationItem.svelte';
import TitleBar from './components/ui/TitleBar.svelte';
import Layout from './components/ui/Layout.svelte';
import Toggle from './components/ui/Toggle.svelte';
import Typewriter from './components/ui/Typewriter.svelte';
import UsageBar from './components/ui/UsageBar.svelte';
export {
  Button, Card, Checkbox, CreatableSelect, DataList, DataTable, DropZone,
  MultiSelect, PresetInput, Input, Label, LoadingGif, Modal, PageHeader,
  ProgressBar, ProgressBytes, ProgressSlotBar, SegmentedTabs, Select,
  StatusBadge, NotificationProvider, NotificationItem, TitleBar, Layout, Toggle, Typewriter, UsageBar,
};

// Providers
import ErrorDialog from './components/providers/ErrorDialog.svelte';
export { ErrorDialog };

// Menus
import ContextMenu from './components/menus/ContextMenu.svelte';
export { ContextMenu };

// goose-ui — barrel export
// Utils
export { formatNum, formatBytes } from './utils/format';
export { copyToClipboard } from './utils/clipboard';

// Icons
import Icon from './components/ui/Icon.svelte';
export { Icon };

// Stores
export {
  notificationStore,
  Notification,
  createNotification,
  createNotificationStore,
  errorToString,
} from './components/notification';
export { errorStore, pushError } from './components/errors';
export { menuStore } from './components/contextMenuStore.svelte.js';
export {
  themeStore,
  initTheme,
  setTheme,
  toggleTheme,
  toggleThemeFromEvent,
  // 主题色（色相旋钮）：只配色相，明度/彩度按亮暗主题派生
  hueStore,
  setHue,
  setHues,
  resetHues,
  getHues,
  initHues,
  HUE_ROLES,
  DEFAULT_HUES,
} from './components/themeStore.svelte.js';
export { pageDirStore } from './components/pageDirStore.svelte.js';
export { registerMenu, unregisterMenu, openMenuAt, closeMenu, onMenuAction, dispatchMenuAction, cellMenuAttrs } from './components/contextMenu';
export { confirmStore, showConfirm } from './components/confirm';

// Types
export type { NotificationType, NotificationPosition, NotificationOptions, NotificationStore } from './components/notification';
export type { MenuItemDef, MenuActionData } from './components/contextMenu';
export type { Column, ColumnOverflow } from './components/tableTypes';
export { loadWidths, saveWidths, clearWidths, toPercents, resizeWeights, MIN_COL_PX } from './components/colWidths.svelte.js';
export {
	loadWidthsVersioned,
	saveWidthsVersioned,
	weightsFingerprint
} from './components/colWidths.svelte.js';
export type { SortState, SortDir } from './components/sorting';
export type { ErrorEntry } from './components/errors';
export type { Theme, HueRole, HueMap } from './components/themeStore.svelte.js';
export type { PageDir } from './components/pageDirStore.svelte.js';
export type { SidebarTabGroup, SidebarTabItem, SidebarEntry } from './components/ui/Sidebar.svelte';
export type { WindowController, TitleBarSearchItem } from './components/ui/TitleBar.svelte';

// UI Components
import Accordion from './components/ui/Accordion.svelte';
import AlertDialog from './components/ui/AlertDialog.svelte';
import AspectRatio from './components/ui/AspectRatio.svelte';
import Avatar from './components/ui/Avatar.svelte';
import BackTop from './components/ui/BackTop.svelte';
import Background from './components/ui/Background.svelte';
import Button from './components/ui/Button.svelte';
import Calendar from './components/ui/Calendar.svelte';
import Card from './components/ui/Card.svelte';
import Carousel from './components/ui/Carousel.svelte';
import Checkbox from './components/ui/Checkbox.svelte';
import Collapsible from './components/ui/Collapsible.svelte';
import CodeBlock from './components/ui/CodeBlock.svelte';
import Combobox from './components/ui/Combobox.svelte';
import Countdown from './components/ui/Countdown.svelte';
import Command from './components/ui/Command.svelte';
import Cursor from './components/ui/Cursor.svelte';
import CreatableSelect from './components/ui/CreatableSelect.svelte';
import DataList from './components/ui/DataList.svelte';
import DataTable from './components/ui/DataTable.svelte';
import DateField from './components/ui/DateField.svelte';
import DateRangeField from './components/ui/DateRangeField.svelte';
import DatePicker from './components/ui/DatePicker.svelte';
import DateRangePicker from './components/ui/DateRangePicker.svelte';
import DropZone from './components/ui/DropZone.svelte';
import Footer from './components/ui/Footer.svelte';
import Image from './components/ui/Image.svelte';
import DropdownMenu from './components/ui/DropdownMenu.svelte';
import MultiSelect from './components/ui/MultiSelect.svelte';
import Input from './components/ui/Input.svelte';
import Textarea from './components/ui/Textarea.svelte';
import Label from './components/ui/Label.svelte';
import Loading from './components/ui/Loading.svelte';
import Meter from './components/ui/Meter.svelte';
import Modal from './components/ui/Modal.svelte';
import PageHeader from './components/ui/PageHeader.svelte';
import Page from './components/ui/Page.svelte';
import Empty from './components/ui/Empty.svelte';
import Form from './components/ui/Form.svelte';
import FormItem from './components/ui/FormItem.svelte';
import PINInput from './components/ui/PINInput.svelte';
import RadioGroup from './components/ui/RadioGroup.svelte';
import Rating from './components/ui/Rating.svelte';
import Row from './components/ui/Row.svelte';
import ScrollArea from './components/ui/ScrollArea.svelte';
import Separator from './components/ui/Separator.svelte';
import Slider from './components/ui/Slider.svelte';
import Menubar from './components/ui/Menubar.svelte';
import NavigationMenu from './components/ui/NavigationMenu.svelte';
import Pagination from './components/ui/Pagination.svelte';
import Popover from './components/ui/Popover.svelte';
import LinkPreview from './components/ui/LinkPreview.svelte';
import RangeCalendar from './components/ui/RangeCalendar.svelte';
import ToggleGroup from './components/ui/ToggleGroup.svelte';
import TimeField from './components/ui/TimeField.svelte';
import TimeRangeField from './components/ui/TimeRangeField.svelte';
import Toolbar from './components/ui/Toolbar.svelte';
import ProgressBar from './components/ui/ProgressBar.svelte';
import ProgressBytes from './components/ui/ProgressBytes.svelte';
import ProgressSlotBar from './components/ui/ProgressSlotBar.svelte';
import Tabs from './components/ui/Tabs.svelte';
import TabsPanel from './components/ui/TabsPanel.svelte';
import PillTrack from './components/ui/PillTrack.svelte';
import Select from './components/ui/Select.svelte';
import StatusBadge from './components/ui/StatusBadge.svelte';
import NotificationProvider from './components/ui/NotificationProvider.svelte';
import NotificationItem from './components/ui/NotificationItem.svelte';
import TitleBar from './components/ui/TitleBar.svelte';
import Layout from './components/ui/Layout.svelte';
import Toggle from './components/ui/Toggle.svelte';
import Tooltip from './components/ui/Tooltip.svelte';
import Typewriter from './components/ui/Typewriter.svelte';
import UsageBar from './components/ui/UsageBar.svelte';
import Sidebar from './components/ui/Sidebar.svelte';
import Skeleton from './components/ui/Skeleton.svelte';
import Tag from './components/ui/Tag.svelte';
import Time from './components/ui/Time.svelte';
import TimePicker from './components/ui/TimePicker.svelte';
import Drawer from './components/ui/Drawer.svelte';
import Header from './components/ui/Header.svelte';
import ThemeToggle from './components/ui/ThemeToggle.svelte';
export {
  Accordion, AlertDialog, AspectRatio, Avatar, Button, Calendar, Card, Checkbox, Collapsible, Combobox, Command, CreatableSelect, DataList, DataTable, DateField, DateRangeField, DatePicker, DateRangePicker, DropZone, DropdownMenu,
  MultiSelect, Input, Textarea, Label, LinkPreview, Loading, Meter, Modal, PageHeader, Page, Empty, PINInput, RadioGroup, RangeCalendar, Rating, Row, ScrollArea, Separator, Slider, Menubar, NavigationMenu, Pagination, Popover, ToggleGroup, TimeField, TimeRangeField, Toolbar, Tag, Skeleton, Image, Footer, BackTop, Time, Countdown, Carousel, Form, FormItem, TimePicker, CodeBlock, Cursor, Background,
  ProgressBar, ProgressBytes, ProgressSlotBar, Tabs, TabsPanel, PillTrack, Select,
  StatusBadge, NotificationProvider, NotificationItem, TitleBar, Layout, Toggle, Tooltip, Typewriter, UsageBar, Sidebar, Drawer, Header, ThemeToggle,
};
export type { AccordionItem } from './components/ui/Accordion.svelte';
export type { DropdownMenuItem } from './components/ui/DropdownMenu.svelte';
export type { MenubarMenu } from './components/ui/Menubar.svelte';
export type { NavMenuItem } from './components/ui/NavigationMenu.svelte';
export type { RadioGroupOption } from './components/ui/RadioGroup.svelte';
export type { ToggleGroupItem } from './components/ui/ToggleGroup.svelte';
export type { ComboboxOption } from './components/ui/Combobox.svelte';
export type { CommandItem } from './components/ui/Command.svelte';
export type { CalendarCell } from './components/ui/Calendar.svelte';
export type { CarouselItem } from './components/ui/Carousel.svelte';
export type { FormContext, FormItemContext } from './components/ui/form.context';

// Providers
import ErrorDialog from './components/providers/ErrorDialog.svelte';
import ConfirmDialog from './components/providers/ConfirmDialog.svelte';
export { ErrorDialog, ConfirmDialog };

// Menus
import ContextMenu from './components/menus/ContextMenu.svelte';
export { ContextMenu };

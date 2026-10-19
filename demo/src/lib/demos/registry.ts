/**
 * demo 页签 → 组件的按需加载表。
 *
 * 为什么需要它：App.svelte 里原本是 55 条静态 import，Vite 会把它们全部打进
 * 首次加载的 chunk 里。也就是说，打开首页就要先下载、解析、执行「表格页、
 * 日期选择页、模态框页……所有页」的代码 —— 首屏 LCP 被这些根本还没用上的
 * 组件拖住。
 *
 * 改成动态 import 后每个页签各自成为一个 chunk：首屏只加载首页那一块，
 * 其余等到真的切过去时才拉。Vite 会自动完成这个拆分，不需要额外配置。
 *
 * tab → 文件名的映射刻意写成显式的字符串，而不是 `import(\`./${name}.svelte\`)`：
 * 后者 Vite 无法静态分析，要么打包失败，要么把所有 demo 全打进一个 chunk，
 * 拆分就失效了。
 */

type Loader = () => Promise<{ default: import('svelte').Component<any> }>;

export const demoLoaders: Record<string, Loader> = {
  home: () => import('./Home.svelte'),
  getstarted: () => import('./GettingStarted.svelte'),
  skill: () => import('./Skill.svelte'),
  title: () => import('./Title.svelte'),
  button: () => import('./Button.svelte'),
  page: () => import('./PageDemo.svelte'),
  separator: () => import('./Separator.svelte'),
  avatar: () => import('./Avatar.svelte'),
  scrollarea: () => import('./ScrollArea.svelte'),
  rating: () => import('./Rating.svelte'),
  pininput: () => import('./PINInput.svelte'),
  meter: () => import('./Meter.svelte'),
  navmenu: () => import('./NavigationMenu.svelte'),
  toolbar: () => import('./Toolbar.svelte'),
  slider: () => import('./Slider.svelte'),
  popover: () => import('./Popover.svelte'),
  command: () => import('./Command.svelte'),
  linkpreview: () => import('./LinkPreview.svelte'),
  datefield: () => import('./DateField.svelte'),
  icon: () => import('./Icon.svelte'),
  tag: () => import('./Tag.svelte'),
  cursor: () => import('./Cursor.svelte'),
  codeblock: () => import('./CodeBlock.svelte'),
  background: () => import('./Background.svelte'),
  footer: () => import('./Footer.svelte'),
  input: () => import('./Input.svelte'),
  switch: () => import('./Toggle.svelte'),
  select: () => import('./Select.svelte'),
  datepicker: () => import('./DatePicker.svelte'),
  timepicker: () => import('./TimePicker.svelte'),
  choice: () => import('./Choice.svelte'),
  form: () => import('./Form.svelte'),
  notification: () => import('./Notification.svelte'),
  modal: () => import('./Modal.svelte'),
  drawer: () => import('./Drawer.svelte'),
  loading: () => import('./Loading.svelte'),
  tooltip: () => import('./Tooltip.svelte'),
  progress: () => import('./Progress.svelte'),
  skeleton: () => import('./Skeleton.svelte'),
  backtop: () => import('./BackTop.svelte'),
  card: () => import('./Card.svelte'),
  collapse: () => import('./Collapse.svelte'),
  tabs: () => import('./Tabs.svelte'),
  tabledata: () => import('./TableData.svelte'),
  tablelist: () => import('./TableList.svelte'),
  pagination: () => import('./Pagination.svelte'),
  typewriter: () => import('./Typewriter.svelte'),
  image: () => import('./Image.svelte'),
  carousel: () => import('./Carousel.svelte'),
  time: () => import('./Time.svelte'),
  countdown: () => import('./Countdown.svelte'),
  header: () => import('./Header.svelte'),
  dropzone: () => import('./DropZone.svelte'),
  titlebar: () => import('./TitleBar.svelte'),
  layout: () => import('./Layout.svelte'),
  settings: () => import('./Settings.svelte'),
};

# 组件清单

> 与 Ark UI 等上游命名不一致时，以本表名为准：

| 上游常见叫法 | goose-ui 名 | 说明                                        |
| ------------ | ----------- | ------------------------------------------- |
| Dialog       | Modal       | 模态弹窗                                    |
| Switch       | Toggle      | iOS 风格开关                                |
| Tabs         | Tabs        | 标签页（分段/下划线/垂直 + TabsPanel 面板） |
| Toggle Group | ToggleGroup | 单选/多选切换组                             |

## 基础组件

| 组件        | 说明                                                                                   |
| ----------- | -------------------------------------------------------------------------------------- |
| Button      | 按钮，variant 八档（primary/default/ghost/danger/danger-solid/text/text-primary/link） |
| Card        | 卡片容器，支持 title + right header                                                    |
| Icon        | 图标包装器（传入 `@lucide/svelte` 图标组件，支持 size/class/spin 旋转动画）            |
| Separator   | 分割线，横/竖/虚线/文字分隔                                                            |
| AspectRatio | 等比容器，按比例裁剪内容                                                               |
| Avatar      | 头像（首字母回退 + 状态点 + size/shape）                                               |
| ScrollArea  | 滚动区（自定义滚动条、role=region）                                                    |
| Row         | 水平排列行（`gap` sm/md/lg + `align` + 自动换行）                                      |
| Image       | 图片（懒加载 + 失败兜底 + 点击放大预览）                                               |
| CodeBlock   | 代码块（语言标签 + 一键复制 + 注释/字符串/关键字轻量高亮）                             |

## 表单输入

| 组件            | 说明                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Form / FormItem | 表单容器与表单项（context 传递 layout/labelWidth，必填星号 + 错误态）                                                                             |
| Label           | 表单标签                                                                                                                                          |
| Input           | 输入框，clearable/Enter 回调/digitsOnly/status，prefix/suffix 为 snippet                                                                          |
| Textarea        | 多行文本域，rows/status/maxlength + resize: vertical                                                                                              |
| Select          | 下拉选择，支持键盘导航、meta 标签、分组吸顶（组头），无滚动条+两侧箭头滚动区；combobox/listbox ARIA 关联（aria-controls / aria-activedescendant） |
| MultiSelect     | 多选下拉，支持 badge 标签与分组吸顶（组头）、Escape/方向键/Enter 键盘操作                                                                         |
| CreatableSelect | 可新建搜索选择器，支持静态/异步数据源；搜索框 role=combobox，选项列表 role=listbox                                                                |
| Combobox        | 组合框（输入过滤 + 分组吸顶 + role=combobox/listbox/option 键盘导航）                                                                             |
| Checkbox        | 复选框，尺寸档 small/middle/large + 双向绑定 + 半选态（indeterminate）                                                                            |
| Radio           | 单个单选项（一般直接用下面的 RadioGroup，单独用时需自管选中态）                                                                                   |
| RadioGroup      | 单选组（pill 分段轨道，context 注入）                                                                                                             |
| Toggle          | iOS 风格开关，带弹性动画                                                                                                                          |
| ToggleGroup     | 单选/多选切换组，default/outline 变体                                                                                                             |
| Slider          | 滑块（pointer 捕获拖拽 + 键盘；外部改值 0.2s 补间，拖动中不补间）                                                                                 |
| Rating          | 评分（半星/只读/键盘 slider 语义）                                                                                                                |
| PINInput        | 验证码输入（跳格/粘贴/退格回跳，`group`+`separator` 分组）                                                                                        |
| DropZone        | 拖拽上传区                                                                                                                                        |

## 日期与时间

| 组件            | 说明                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------- |
| DateField       | 日期分段字段（`YYYY-MM-DD`，分段自动跳格/粘贴跨段/聚焦全选/失焦校验：月份 ≤12、日 ≤当月天数、闰年） |
| TimeField       | 时间分段字段（`HH:mm[:ss]`，`seconds` 可选段；时分秒上限 23/59/59，失焦纠正并补零）                 |
| DateRangeField  | 日期范围分段字段（start/end 双向绑定）                                                              |
| TimeRangeField  | 时间范围分段字段                                                                                    |
| Calendar        | 日历网格（月导航、min/max、disabledDate、方向键/PgUp/PgDn）                                         |
| RangeCalendar   | 范围日历（先起点后终点，悬停预览，清除；方向键移动光标、Enter 提交、PgUp/PgDn 翻月）                |
| DatePicker      | 日期选择器（触发器 + 浮层 Calendar，自动翻转、清除）                                                |
| DateRangePicker | 范围选择器（触发器 + 浮层 RangeCalendar）                                                           |
| TimePicker      | 时间选择器（时/分(/秒) 惯性滚轮 Wheel，拖拽+吸附+停稳提交，「现在」快捷）                           |

> 日期/时间选择器的清除按钮为独立 `<button>`（可 Tab 聚焦 + Enter/Space 触发），由绝对定位叠在触发器图标位。

## 数据展示

| 组件            | 说明                                                                                                                                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DataTable       | 数据表格，支持排序、高亮、右键菜单、按占比 + 最小/最大约束分配列宽；表头圆角 + 吸顶，行 hover 为滑动 pill                                                                                                                                    |
| DataList        | 数据列表，带空状态与可选的内置 header（`title`/`header`/`headerCenter`/`headerRight` 等原样透传）；行 hover 同样走滑动 pill                                                                                                                  |
| Tag             | 标签（6 变体 × 3 尺寸 + 圆点 + 可关闭）                                                                                                                                                                                                      |
| StatusBadge     | 状态徽章                                                                                                                                                                                                                                     |
| Pagination      | 分页（siblingCount 省略号折叠、showQuickJumper 跳页输入）                                                                                                                                                                                    |
| Collapsible     | 折叠面板（展开/收起高度过渡）                                                                                                                                                                                                                |
| Accordion       | 手风琴（单开/多开/collapsible，复用 Collapsible）                                                                                                                                                                                            |
| ProgressBar     | 渐变进度条                                                                                                                                                                                                                                   |
| ProgressBytes   | 上传进度（字节/速度/ETA）                                                                                                                                                                                                                    |
| ProgressSlotBar | 分片上传进度                                                                                                                                                                                                                                 |
| UsageBar        | 用量/限额进度条                                                                                                                                                                                                                              |
| Meter           | 度量条（threshold 转高亮 / critical 转危险色，role=progressbar）                                                                                                                                                                             |
| Typewriter      | 打字机效果，支持逐字文本或淡入 Snippet                                                                                                                                                                                                       |
| Carousel        | 轮播图（手动/自动播放、悬停暂停、首尾循环）                                                                                                                                                                                                  |
| Time            | 实时时钟（time/date/datetime + 12h 制）                                                                                                                                                                                                      |
| Countdown       | 倒计时（duration/target 双模式 + 暂停 + 归零回调）                                                                                                                                                                                           |

## 导航与布局

| 组件           | 说明                                                                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout         | 应用外壳纯布局（顶栏 / 可选侧栏 / 内容区插槽，不内置组件，自行组合 TitleBar、Sidebar 或 Drawer）                                                                                   |
| Page           | 页面容器（根布局 + 页头 + 内容区间距一次到位）                                                                                                                                     |
| PageHeader     | 页面标题栏（标题 + 描述 + children 附加行 + 右侧操作区，窄屏自动换行）                                                                                                             |
| Sidebar        | 悬浮岛式侧边栏（导航分组 + 顶层项穿插 + 折叠 + popover + endItems/footer）。尺寸全部由组件内的一组 `--sb-*` 变量派生，改一个值整列跟着走                                            |
| Header         | 固定顶部导航栏（标题 + 操作区 + 自定义插槽）                                                                                                                                       |
| Footer         | 页脚（左右插槽 + 链接列表 + 版权行 + 吸底）                                                                                                                                        |
| TitleBar       | 自绘标题栏（窗口控制经 `windowApi` 注入，库不依赖桌面 runtime；`searchable` 开内联搜索，见[应用外壳](shell.md#titlebar-标题栏)；Wails3 见 demo TitleBar 页）                        |
| Tabs           | 标签页（分段/下划线/垂直模式 + 键盘导航）                                                                                                                                          |
| TabsPanel      | 标签页内容面板（value 匹配选中项时渲染）                                                                                                                                           |
| NavigationMenu | 导航菜单（面板定位/翻转，链接 + 描述）                                                                                                                                             |
| Menubar        | 菜单栏（横向方向键 + 已展开时自动切换菜单；复用 DropdownMenu）                                                                                                                     |
| DropdownMenu   | 下拉菜单（flip 测量、键盘导航；`disabled` prop 可禁用触发器）                                                                                                                      |
| ContextMenu    | 右键菜单（全局注册机制）                                                                                                                                                           |
| Toolbar        | 工具栏（role=toolbar + roving 方向键）                                                                                                                                             |
| BackTop        | 返回顶部（阈值淡入 + easeOutCubic 回顶；元素容器贴容器右下角，回退贴视口）                                                                                                         |

## 反馈

| 组件                 | 说明                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------- |
| Modal                | 模态弹窗（fade+scale 转场、backdrop blur、`headerActions` 标题行操作、多层按打开顺序叠放）  |
| Drawer               | 抽屉弹窗（4 方向 + 可调景深 `pushScale`/`pushBlur` + 遮罩深浅 `--drawer-mask` + 可拖动吸附尺寸 / 拖到底关闭 + portal） |
| AlertDialog          | 警惕对话框（焦点陷阱、初始聚焦、loading/danger）                                            |
| ConfirmDialog        | 确认框容器（App 顶层挂载一次，配合 showConfirm 使用）                                       |
| ErrorDialog          | 错误弹窗（配合 pushError 使用）                                                             |
| Popover              | 气泡卡片（受控 open、翻转、Esc/外点关闭；placement 支持 bottom/top × start/end 对齐）       |
| Tooltip              | 气泡提示（12 方向 + 自动翻转 + hover/focus/click 触发）                                     |
| LinkPreview          | 链接预览（延迟悬停、翻转、卡片水平居中于锚点）                                              |
| Command              | 命令面板（Ctrl/Cmd+K、分组、键盘导航）                                                      |
| NotificationProvider | 通知容器；`store` prop 决定渲染哪份 store（默认全局单例，可传独立实例）                     |
| NotificationItem     | 单条通知（由 NotificationProvider 内部渲染）                                                |
| Loading              | 加载指示器（spinner 或自定义图片，size 可调）                                               |
| Skeleton             | 骨架屏（text/circle/rect + 多行 + shimmer 动画）                                            |
| Empty                | 空状态（图标 + 主文案 + 副提示 + 可选操作区，居中排布）                                     |

## 其他

| 组件        | 说明                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| PillTrack   | 滑动高亮原语（选中 pill + hover pill，自动跟随选中项）。Sidebar / Tabs / DataTable / DataList 的 hover 高亮带都由它绘制（见[滑动高亮动效](api.md#滑动高亮动效pilltrack)） |
| Cursor      | 自定义光标（区域内圆点跟随 + 可选拖尾外圈，隐藏系统光标）                                                                        |
| Background  | 装饰背景（gradient/grid/dots/noise 四变体 + 光晕漂移动画，children 叠加）                                                        |
| ThemeToggle | 主题切换按钮（Sun/Moon 图标、圆形扩散动画、localStorage 持久化）                                                                 |

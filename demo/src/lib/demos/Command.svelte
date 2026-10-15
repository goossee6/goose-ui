<script lang="ts">
  import {Card, Page, Command, Notification, toggleTheme, type CommandItem} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const props: PropsTableItem[] = [
    { name: "open", desc: "面板状态（双向绑定）", type: "boolean", default: "false" },
    { name: "items", desc: "命令列表（value/label/group/keywords/disabled）", type: "CommandItem[]", default: "[]" },
    { name: "placeholder", desc: "输入框占位 + 触发按钮文案", type: "string", default: "'输入命令或搜索…'" },
    { name: "emptyText", desc: "空结果文案", type: "string", default: "'无匹配结果'" },
    { name: "onSelect", desc: "选中回调（选中后自动关闭）", type: "(item: CommandItem) => void", default: "—" },
  ];

  const items: CommandItem[] = [
    { value: 'new-file', label: '新建文件', group: '文件', keywords: 'new create' },
    { value: 'open-file', label: '打开文件…', group: '文件', keywords: 'open' },
    { value: 'save-file', label: '保存', group: '文件', keywords: 'save ctrl+s' },
    { value: 'toggle-theme', label: '切换主题', group: '视图', keywords: 'theme dark light' },
    { value: 'zoom-in', label: '放大', group: '视图', keywords: 'zoom in' },
    { value: 'zoom-out', label: '缩小', group: '视图', keywords: 'zoom out' },
    { value: 'help', label: '快捷键帮助', group: '帮助', keywords: 'shortcut keys' },
    { value: 'disabled-cmd', label: '不可用命令', group: '帮助', disabled: true },
  ];

  function handleSelect(item: CommandItem) {
    if (item.value === 'toggle-theme') toggleTheme();
    Notification.info(`执行：${item.label}`);
  }

  const basicSource = `<script lang="ts">
  import { Command, Notification, toggleTheme, type CommandItem } from "goose-ui";

  const items: CommandItem[] = [
    { value: 'new-file', label: '新建文件', group: '文件', keywords: 'new create' },
    { value: 'open-file', label: '打开文件…', group: '文件', keywords: 'open' },
    { value: 'save-file', label: '保存', group: '文件', keywords: 'save ctrl+s' },
    { value: 'toggle-theme', label: '切换主题', group: '视图', keywords: 'theme dark light' },
    { value: 'zoom-in', label: '放大', group: '视图', keywords: 'zoom in' },
    { value: 'zoom-out', label: '缩小', group: '视图', keywords: 'zoom out' },
    { value: 'help', label: '快捷键帮助', group: '帮助', keywords: 'shortcut keys' },
    { value: 'disabled-cmd', label: '不可用命令', group: '帮助', disabled: true },
  ];

  function handleSelect(item: CommandItem) {
    if (item.value === 'toggle-theme') toggleTheme();
    Notification.info(\`执行：\${item.label}\`);
  }
<\/script>

<Command {items} onSelect={handleSelect} placeholder="输入命令或搜索…" />`;
</script>

<Page title="Command 命令面板" description="Ctrl/Cmd+K 唤起的全局命令搜索（↑↓ 移动、Enter 执行、Esc 关闭）">
  <CodePreview title="基础用法" code={basicSource}>
    <Command {items} onSelect={handleSelect} placeholder="输入命令或搜索…" />
  </CodePreview>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

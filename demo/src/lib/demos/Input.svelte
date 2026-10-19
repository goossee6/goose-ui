<script lang="ts">
  import {Card, Input, Textarea, Icon, Page, Notification, Row} from "goose-ui";
  import Search from '@lucide/svelte/icons/search';
  import User from '@lucide/svelte/icons/user';
  import Mail from '@lucide/svelte/icons/mail';
  import Lock from '@lucide/svelte/icons/lock';

  let text = $state('');
  let amount = $state('');
  let search = $state('');
  let multiText = $state('');
  let limited = $state('');

  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const inputProps: PropsTableItem[] = [
    { name: "value", desc: "输入值（可双向绑定）", type: "string", default: "''" },
    { name: "placeholder", desc: "占位文案", type: "string", default: "''" },
    { name: "type", desc: "原生输入类型", type: "string", default: "'text'" },
    { name: "clearable", desc: "显示清空按钮", type: "boolean", default: "true" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "readonly", desc: "只读", type: "boolean", default: "false" },
    { name: "digitsOnly", desc: "仅允许数字输入", type: "boolean", default: "false" },
    { name: "status", desc: "状态样式", type: "'error' | 'warning'" },
    { name: "prefix", desc: "前缀区 snippet（可放图标/文本/按钮）", type: "Snippet" },
    { name: "suffix", desc: "后缀区 snippet（可放图标/文本/可点击按钮）", type: "Snippet" },
    { name: "id", desc: "原生 id", type: "string", default: "''" },
    { name: "name", desc: "原生 name", type: "string", default: "''" },
    { name: "onkeydown", desc: "按键回调", type: "(e: KeyboardEvent) => void" },
    { name: "onenter", desc: "回车键回调", type: "() => void" },
    { name: "onClear", desc: "清空回调", type: "() => void" },
    { name: "onclick", desc: "点击回调", type: "(e: MouseEvent) => void" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const textareaProps: PropsTableItem[] = [
    { name: "value", desc: "输入值（可双向绑定）", type: "string", default: "''" },
    { name: "placeholder", desc: "占位文案", type: "string", default: "''" },
    { name: "rows", desc: "可见行数", type: "number", default: "3" },
    { name: "maxlength", desc: "最大字符数", type: "number", default: "—" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "readonly", desc: "只读", type: "boolean", default: "false" },
    { name: "status", desc: "状态样式", type: "'error' | 'warning'" },
    { name: "ariaLabel", desc: "无障碍标签", type: "string", default: "''" },
    { name: "oninput", desc: "输入回调", type: "(e: Event) => void" },
    { name: "onkeydown", desc: "按键回调", type: "(e: KeyboardEvent) => void" },
    { name: "id", desc: "原生 id", type: "string", default: "''" },
    { name: "name", desc: "原生 name", type: "string", default: "''" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const statusSource = `<script lang="ts">
  import { Input, Row } from "goose-ui";
<\/script>

<Row>
  <Input name="error" placeholder="错误状态" status="error" />
  <Input name="warning" placeholder="警告状态" status="warning" />
</Row>`;

  const iconsSource = `<script lang="ts">
  import { Input, Icon, Row } from "goose-ui";
  import Search from "@lucide/svelte/icons/search";
  import User from "@lucide/svelte/icons/user";
  import Mail from "@lucide/svelte/icons/mail";
  import Lock from "@lucide/svelte/icons/lock";
<\/script>

<Row>
  <Input name="prefix-icon" placeholder="前缀图标">
    {#snippet prefix()}<Icon icon={Search} size={16} />{/snippet}
  </Input>

  <Input name="suffix-icon" placeholder="后缀图标">
    {#snippet suffix()}<Icon icon={Mail} size={16} />{/snippet}
  </Input>

  <Input name="both-icon" placeholder="前缀 + 后缀">
    {#snippet prefix()}<Icon icon={User} size={16} />{/snippet}
    {#snippet suffix()}<Icon icon={Lock} size={16} />{/snippet}
  </Input>
</Row>`;

  const clearableSource = `<script lang="ts">
  import { Input, Row } from "goose-ui";
<\/script>

<Row>
  <Input name="search" placeholder="可清空（默认）" />
  <Input name="no-clear" placeholder="禁用清空" clearable={false} />
</Row>`;

  const disabledSource = `<script lang="ts">
  import { Input } from "goose-ui";
<\/script>

<Input name="disabled" placeholder="禁用状态" disabled value="不能编辑" />`;

  const readonlySource = `<script lang="ts">
  import { Input } from "goose-ui";
<\/script>

<Input name="readonly" placeholder="只读状态" readonly value="只读值" />`;

  const digitsOnlySource = `<script lang="ts">
  import { Input } from "goose-ui";

  let amount = $state("");
<\/script>

<Input name="digits" placeholder="只能输入数字" digitsOnly bind:value={amount} />
<p>值: "{amount}"</p>`;

  const enterSource = `<script lang="ts">
  import { Input, Notification } from "goose-ui";

  let text = $state("");
<\/script>

<Input
  name="enter-submit"
  placeholder="输入后按回车"
  onenter={() => Notification.success("回车提交: " + text)}
  bind:value={text}
/>`;

  const textareaSource = `<script lang="ts">
  import { Textarea, Row } from "goose-ui";

  let multiText = $state("");
  let limited = $state("");
<\/script>

<Row>
  <Textarea placeholder="请输入多行文本" rows={4} bind:value={multiText} />

  <!-- 字符限制 -->
  <Textarea placeholder="最多 100 字" maxlength={100} bind:value={limited} />
  <span>{limited.length}/100</span>

  <!-- 错误 / 警告状态 -->
  <Textarea status="error" placeholder="错误状态" value="字数超出限制" />
  <Textarea status="warning" placeholder="警告状态" value="内容可能过长" />

  <!-- 禁用 -->
  <Textarea disabled placeholder="禁用状态" value="不能编辑" />
</Row>`;
</script>

<Page toc title="输入框 Input" description="普通输入、前后缀图标、清空按钮、错误/警告状态、多行文本域">
  <CodePreview anchor="sizes-states" anchorLevel={2} title="状态 Status" code={statusSource}>
    <Row>
      <div class="demo-col">
        <Input name="error" placeholder="错误状态" status="error" />
      </div>
      <div class="demo-col">
        <Input name="warning" placeholder="警告状态" status="warning" />
      </div>
    </Row>
  </CodePreview>

  <CodePreview anchor="icons" anchorLevel={3} title="图标 Icons" code={iconsSource}>
    <Row>
      <div class="demo-col">
        <Input name="prefix-icon" placeholder="前缀图标">
          {#snippet prefix()}<Icon icon={Search} size={16} />{/snippet}
        </Input>
      </div>
      <div class="demo-col">
        <Input name="suffix-icon" placeholder="后缀图标">
          {#snippet suffix()}<Icon icon={Mail} size={16} />{/snippet}
        </Input>
      </div>
      <div class="demo-col">
        <Input name="both-icon" placeholder="前缀 + 后缀">
          {#snippet prefix()}<Icon icon={User} size={16} />{/snippet}
          {#snippet suffix()}<Icon icon={Lock} size={16} />{/snippet}
        </Input>
      </div>
    </Row>
    <Row>
      <div class="demo-col">
        <Input name="icon-clear" placeholder="图标 + 清空">
          {#snippet prefix()}<Icon icon={Search} size={16} />{/snippet}
        </Input>
      </div>
    </Row>
  </CodePreview>

  <CodePreview anchor="clearable" anchorLevel={3} title="清空 Clearable" code={clearableSource}>
    <Row>
      <div class="demo-col">
        <Input name="search" placeholder="可清空（默认）" bind:value={search} />
      </div>
      <div class="demo-col">
        <Input name="no-clear" placeholder="禁用清空" clearable={false} />
      </div>
    </Row>
  </CodePreview>

  <CodePreview anchor="disabled" anchorLevel={3} title="禁用 Disabled" code={disabledSource}>
    <Row>
      <div class="demo-col">
        <Input name="disabled" placeholder="禁用状态" disabled value="不能编辑" />
      </div>
    </Row>
  </CodePreview>

  <CodePreview anchor="readonly" anchorLevel={3} title="只读 Readonly" code={readonlySource}>
    <Row>
      <div class="demo-col">
        <Input name="readonly" placeholder="只读状态" readonly value="只读值" />
      </div>
    </Row>
  </CodePreview>

  <CodePreview anchor="digitsonly" anchorLevel={3} title="纯数字 digitsOnly" code={digitsOnlySource}>
    <Row>
      <div class="demo-col">
        <Input name="digits" placeholder="只能输入数字" digitsOnly bind:value={amount} />
      </div>
      <span class="demo-val">值: "{amount}"</span>
    </Row>
  </CodePreview>

  <CodePreview anchor="onenter" anchorLevel={3} title="回车事件 onenter" code={enterSource}>
    <Row>
      <div class="demo-col">
        <Input name="enter-submit" placeholder="输入后按回车" onenter={() => Notification.success(`回车提交: ${text}`)} bind:value={text} />
      </div>
    </Row>
  </CodePreview>

  <CodePreview anchor="textarea" anchorLevel={3} title="多行 Textarea" code={textareaSource}>
    <Row>
      <div class="demo-col" style="max-width:360px">
        <Textarea placeholder="请输入多行文本" rows={4} bind:value={multiText} />
        <span class="demo-val">值: "{multiText}"</span>
      </div>
      <div class="demo-col" style="max-width:360px">
        <Textarea placeholder="最多 100 字" maxlength={100} bind:value={limited} />
        <span class="demo-val">{limited.length}/100</span>
      </div>
      <div class="demo-col" style="max-width:360px">
        <Textarea status="error" placeholder="错误状态" value="字数超出限制" />
      </div>
      <div class="demo-col" style="max-width:360px">
        <Textarea status="warning" placeholder="警告状态" value="内容可能过长" />
      </div>
      <div class="demo-col" style="max-width:360px">
        <Textarea disabled placeholder="禁用状态" value="不能编辑" />
      </div>
    </Row>
  </CodePreview>
  <Card title="Input Props">
    <PropsTable anchor="props" items={inputProps} />
  </Card>

  <Card title="Textarea Props">
    <PropsTable items={textareaProps} />
  </Card>
</Page>

<style>
  /* 定宽列放不下时由 <Row> 自动折行 */
  .demo-col { width: 260px; display: flex; flex-direction: column; gap: 8px; }
  .demo-val { font-size: 13px; color: var(--text-muted); padding-top: 10px; }
</style>

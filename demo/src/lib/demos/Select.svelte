<script lang="ts">
  import { untrack } from "svelte";
  import {Card, Select, MultiSelect, CreatableSelect, Combobox, Page, Notification, Row, type ComboboxOption} from "goose-ui";

  let basic = $state('');
  let meta = $state('');
  let multi = $state<string[]>([]);
  let created = $state('');
  let placementBottom = $state('');
  let placementTop = $state('');
  let placementLeft = $state('');
  let placementRight = $state('');

  const options = [
    { value: 'apple', label: '苹果' },
    { value: 'banana', label: '香蕉' },
    { value: 'cherry', label: '樱桃' },
    { value: 'durian', label: '榴莲' },
  ];

  const metaOptions = [
    { value: 'a', label: '优秀', meta: 'A', metaClass: 'good' as const },
    { value: 'b', label: '良好', meta: 'B', metaClass: 'medium' as const },
    { value: 'c', label: '较差', meta: 'C', metaClass: 'bad' as const },
    { value: 'd', label: '未评级', meta: '-', metaClass: 'default' as const },
  ];

  let grouped = $state('');

  const groupedOptions = [
    { value: 'svelte', label: 'Svelte', group: '前端框架' },
    { value: 'react', label: 'React', group: '前端框架' },
    { value: 'vue', label: 'Vue', group: '前端框架' },
    { value: 'solid', label: 'Solid', group: '前端框架' },
    { value: 'angular', label: 'Angular', group: '前端框架' },
    { value: 'vite', label: 'Vite', group: '构建工具' },
    { value: 'webpack', label: 'Webpack', group: '构建工具' },
    { value: 'rollup', label: 'Rollup', group: '构建工具' },
    { value: 'esbuild', label: 'esbuild', group: '构建工具' },
    { value: 'postgres', label: 'PostgreSQL', group: '数据库' },
    { value: 'mysql', label: 'MySQL', group: '数据库' },
    { value: 'sqlite', label: 'SQLite', group: '数据库' },
    { value: 'clickhouse', label: 'ClickHouse', group: '数据库' },
  ];

  let items = $state(['Svelte', 'React', 'Vue', 'Solid', 'Angular']);

  // 仅用于变更对比：初值取绑定值的首次值，之后由下方 $effect 改写
  let prevMulti: string[] = untrack(() => multi);
  let prevCreated = untrack(() => created);

  $effect(() => { if (multi !== prevMulti) { prevMulti = multi; if (multi.length > 0) Notification.success(`已选择 ${multi.length} 项`); } });
  $effect(() => { if (created !== prevCreated) { prevCreated = created; if (created) Notification.success(`已选择「${created}」`); } });

  async function createItem(name: string) {
    await new Promise((r) => setTimeout(r, 300));
    items = [name, ...items];
    Notification.success(`已新建「${name}」`);
  }
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  let cbFw = $state('');
  let cbCity = $state('sh');
  let cbPerson = $state('');

  const frameworks: ComboboxOption[] = [
    { value: 'svelte', label: 'Svelte' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'solid', label: 'SolidJS' },
    { value: 'qwik', label: 'Qwik' },
    { value: 'astro', label: 'Astro', disabled: true },
  ];

  const cities: ComboboxOption[] = [
    { value: 'bj', label: '北京' },
    { value: 'sh', label: '上海' },
    { value: 'gz', label: '广州' },
    { value: 'sz', label: '深圳' },
    { value: 'cd', label: '成都' },
  ];

  const groupedPeople: ComboboxOption[] = [
    { value: 'wangfeng', label: '王峰', group: '研发部' },
    { value: 'lina', label: '李娜', group: '研发部' },
    { value: 'zhangwei', label: '张伟', group: '研发部' },
    { value: 'liuyang', label: '刘洋', group: '研发部' },
    { value: 'chenjing', label: '陈静', group: '设计部' },
    { value: 'yangfan', label: '杨帆', group: '设计部' },
    { value: 'xujin', label: '徐静', group: '设计部' },
    { value: 'sunlei', label: '孙磊', group: '市场部' },
    { value: 'zhouxin', label: '周鑫', group: '市场部' },
    { value: 'wumin', label: '吴敏', group: '市场部' },
  ];

  const selectProps: PropsTableItem[] = [
    { name: "value", desc: "选中值（可双向绑定；组件为泛型，本页示例 string）", type: "T", default: "undefined" },
    { name: "options", desc: "选项数组，元素 { value, label, meta?, metaClass?, group? }（group 连续同名归组，组头吸顶）", type: "Option[]", default: "[]" },
    { name: "onchange", desc: "变更回调", type: "(v: T) => void" },
    { name: "placeholder", desc: "占位文案", type: "string", default: "'请选择'" },
    { name: "width", desc: "宽度", type: "string", default: "'100%'" },
    { name: "placement", desc: "菜单弹出方向", type: "'top' | 'bottom' | 'left' | 'right'", default: "'bottom'" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "id", desc: "原生 id", type: "string", default: "''" },
    { name: "ariaLabel", desc: "无障碍标签", type: "string", default: "''" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const multiSelectProps: PropsTableItem[] = [
    { name: "values", desc: "选中值数组（可双向绑定）", type: "string[]", default: "[]" },
    { name: "items", desc: "选项数组，元素 { value, label, group? }（group 连续同名归组，组头吸顶）", type: "Option[]", default: "[]" },
    { name: "placeholder", desc: "占位文案", type: "string", default: "'请选择'" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const creatableSelectProps: PropsTableItem[] = [
    { name: "value", desc: "选中值（可双向绑定）", type: "string", default: "''" },
    { name: "items", desc: "初始选项列表", type: "string[]", default: "[]" },
    { name: "loadItems", desc: "懒加载选项（挂载时调用）", type: "() => Promise<string[]>" },
    { name: "placeholder", desc: "占位文案", type: "string", default: "'请选择'" },
    { name: "title", desc: "下拉面板标题", type: "string", default: "'请选择'" },
    { name: "createText", desc: "新建项前缀文案", type: "string", default: "'新建'" },
    { name: "onCreateItem", desc: "创建新选项回调", type: "(name: string) => Promise<void>" },
    { name: "loadingIndicator", desc: "加载中插槽", type: "Snippet" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const comboboxProps: PropsTableItem[] = [
    { name: "options", desc: "选项列表（value/label/disabled/group；group 连续同名归组，组头吸顶）", type: "ComboboxOption[]", default: "[]" },
    { name: "value", desc: "选中值（双向绑定）", type: "string", default: "''" },
    { name: "placeholder", desc: "占位文本", type: "string", default: "'请选择…'" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "clearable", desc: "显示清除按钮", type: "boolean", default: "true" },
    { name: "filter", desc: "输入过滤", type: "boolean", default: "true" },
    { name: "onchange", desc: "变更回调", type: "(value: string) => void", default: "—" },
  ];

  const selectBasicSource = `<script lang="ts">
  import { Select } from "goose-ui";

  const options = [
    { value: "apple", label: "苹果" },
    { value: "banana", label: "香蕉" },
    { value: "cherry", label: "樱桃" },
    { value: "durian", label: "榴莲" },
  ];

  let value = $state("");
<\/script>

<Select options={options} bind:value placeholder="请选择水果" />`;

  const metaSource = `<script lang="ts">
  import { Select } from "goose-ui";

  const options = [
    { value: "a", label: "优秀", meta: "A", metaClass: "good" as const },
    { value: "b", label: "良好", meta: "B", metaClass: "medium" as const },
    { value: "c", label: "较差", meta: "C", metaClass: "bad" as const },
    { value: "d", label: "未评级", meta: "-", metaClass: "default" as const },
  ];

  let value = $state("");
<\/script>

<Select {options} bind:value placeholder="请选择评级" />`;

  const disabledSource = `<script lang="ts">
  import { Select } from "goose-ui";

  const options = [
    { value: "apple", label: "苹果" },
    { value: "banana", label: "香蕉" },
  ];
<\/script>

<Select {options} value="apple" disabled />`;

  const groupedSource = `<script lang="ts">
  import { Select } from "goose-ui";

  // 连续同名的 group 会归为一组，组头吸顶
  const options = [
    { value: "svelte", label: "Svelte", group: "前端框架" },
    { value: "react", label: "React", group: "前端框架" },
    { value: "vue", label: "Vue", group: "前端框架" },
    { value: "vite", label: "Vite", group: "构建工具" },
    { value: "webpack", label: "Webpack", group: "构建工具" },
    { value: "postgres", label: "PostgreSQL", group: "数据库" },
    { value: "mysql", label: "MySQL", group: "数据库" },
  ];

  let value = $state("");
<\/script>

<Select {options} bind:value placeholder="选择技术栈" />`;

  const placementSource = `<script lang="ts">
  import { Select } from "goose-ui";

  const options = [
    { value: "apple", label: "苹果" },
    { value: "banana", label: "香蕉" },
  ];

  let bottom = $state("");
  let top = $state("");
  let left = $state("");
  let right = $state("");
<\/script>

<Select {options} bind:value={bottom} placement="bottom" placeholder="bottom (默认)" />
<Select {options} bind:value={top} placement="top" placeholder="top" />
<Select {options} bind:value={left} placement="left" placeholder="left" />
<Select {options} bind:value={right} placement="right" placeholder="right" />`;

  const multiSource = `<script lang="ts">
  import { MultiSelect } from "goose-ui";

  const items = [
    { value: "apple", label: "苹果" },
    { value: "banana", label: "香蕉" },
    { value: "cherry", label: "樱桃" },
  ];

  let values = $state<string[]>([]);
<\/script>

<MultiSelect {items} bind:values placeholder="选择多种水果" />`;

  const creatableSource = `<script lang="ts">
  import { CreatableSelect } from "goose-ui";

  let items = $state(["Svelte", "React", "Vue", "Solid", "Angular"]);
  let value = $state("");

  async function createItem(name: string) {
    await new Promise((r) => setTimeout(r, 300));
    items = [name, ...items];
  }
<\/script>

<CreatableSelect
  {items}
  bind:value
  placeholder="搜索或新建框架"
  title="选择框架"
  createText="新建"
  onCreateItem={createItem}
/>`;

  const asyncSource = `<script lang="ts">
  import { CreatableSelect } from "goose-ui";
<\/script>

<CreatableSelect
  loadItems={async () => {
    await new Promise((r) => setTimeout(r, 600));
    return ["异步项目 A", "异步项目 B", "异步项目 C"];
  }}
  placeholder="点击后异步加载"
  title="异步数据源"
/>`;

  const comboboxBasicSource = `<script lang="ts">
  import { Combobox, type ComboboxOption } from "goose-ui";

  const frameworks: ComboboxOption[] = [
    { value: "svelte", label: "Svelte" },
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
    { value: "solid", label: "SolidJS" },
    { value: "qwik", label: "Qwik" },
    { value: "astro", label: "Astro", disabled: true },
  ];

  const cities: ComboboxOption[] = [
    { value: "bj", label: "北京" },
    { value: "sh", label: "上海" },
    { value: "gz", label: "广州" },
  ];

  let fw = $state("");
  let city = $state("sh");
<\/script>

<Combobox options={frameworks} bind:value={fw} placeholder="搜索框架…" />
<Combobox options={cities} bind:value={city} placeholder="选择城市…" />`;

  const comboboxGroupSource = `<script lang="ts">
  import { Combobox, type ComboboxOption } from "goose-ui";

  const people: ComboboxOption[] = [
    { value: "wangfeng", label: "王峰", group: "研发部" },
    { value: "lina", label: "李娜", group: "研发部" },
    { value: "chenjing", label: "陈静", group: "设计部" },
    { value: "yangfan", label: "杨帆", group: "设计部" },
    { value: "sunlei", label: "孙磊", group: "市场部" },
    { value: "zhouxin", label: "周鑫", group: "市场部" },
  ];

  let person = $state("");
<\/script>

<Combobox options={people} bind:value={person} placeholder="输入过滤，↑↓ 键跨组移动…" />`;

  const comboboxDisabledSource = `<script lang="ts">
  import { Combobox, type ComboboxOption } from "goose-ui";

  const cities: ComboboxOption[] = [
    { value: "bj", label: "北京" },
    { value: "sh", label: "上海" },
    { value: "gz", label: "广州" },
  ];
<\/script>

<Combobox options={cities} value="" disabled placeholder="禁用" />
<Combobox options={cities} value="" filter={false} placeholder="点击展开（不输入过滤）" />`;
</script>

<Page toc title="选择器 Select / Combobox" description="单选、多选标签、可搜索可新建的选择器；Combobox 为可输入过滤版（Arrow↓ 打开、↑↓ 移动、Enter 选中、Esc 关闭）">
  <CodePreview anchor="basic" anchorLevel={2} title="基础单选 Select" code={selectBasicSource}>
    <Row>
      <div class="demo-col">
        <Select
          options={options}
          bind:value={basic}
          onchange={(v) => { basic = v; Notification.success(`已选择「${options.find(o => o.value === v)?.label ?? v}」`); }}
          placeholder="请选择水果"
        />
      </div>
      <span class="demo-val">选中: "{basic}"</span>
    </Row>
  </CodePreview>

  <CodePreview anchor="meta" anchorLevel={3} title="带 Meta 标签" code={metaSource}>
    <Row>
      <div class="demo-col">
        <Select options={metaOptions} bind:value={meta} onchange={(v) => { meta = v; Notification.success(`评级: ${metaOptions.find(o => o.value === v)?.label ?? v}`); }} placeholder="请选择评级" />
      </div>
      <span class="demo-val">选中: "{meta}"</span>
    </Row>
  </CodePreview>

  <CodePreview anchor="advanced" anchorLevel={2} title="禁用状态" code={disabledSource}>
    <Row>
      <div class="demo-col">
        <Select options={options} value="apple" disabled />
      </div>
    </Row>
  </CodePreview>

  <CodePreview anchor="select" anchorLevel={3} title="分组选择器 Select" code={groupedSource}>
    <Row>
      <div class="demo-col">
        <Select options={groupedOptions} bind:value={grouped} placeholder="13 个选项，3 组（组头吸顶）" />
      </div>
      <span class="demo-val">选中: "{grouped}"</span>
    </Row>
  </CodePreview>

  <CodePreview anchor="placement" anchorLevel={3} title="弹出位置 placement" code={placementSource}>
    <Row>
      <div class="demo-col">
        <Select options={options} bind:value={placementBottom} onchange={(v) => Notification.success(`已选择「${options.find(o => o.value === v)?.label ?? v}」`)} placement="bottom" placeholder="bottom (默认)" />
      </div>
      <div class="demo-col">
        <Select options={options} bind:value={placementTop} onchange={(v) => Notification.success(`已选择「${options.find(o => o.value === v)?.label ?? v}」`)} placement="top" placeholder="top" />
      </div>
      <div class="demo-col">
        <Select options={options} bind:value={placementLeft} onchange={(v) => Notification.success(`已选择「${options.find(o => o.value === v)?.label ?? v}」`)} placement="left" placeholder="left" />
      </div>
      <div class="demo-col">
        <Select options={options} bind:value={placementRight} onchange={(v) => Notification.success(`已选择「${options.find(o => o.value === v)?.label ?? v}」`)} placement="right" placeholder="right" />
      </div>
    </Row>
  </CodePreview>

  <CodePreview anchor="multi-search" anchorLevel={2} title="多选 MultiSelect" code={multiSource}>
    <Row>
      <div class="demo-col">
        <MultiSelect items={options} bind:values={multi} placeholder="选择多种水果" />
      </div>
      <span class="demo-val">已选 {multi.length} 项: {multi.join(', ') || '无'}</span>
    </Row>
  </CodePreview>

  <CodePreview anchor="creatableselect" anchorLevel={3} title="创建型选择器 CreatableSelect" code={creatableSource}>
    <Row>
      <div class="demo-col">
        <CreatableSelect
          items={items}
          bind:value={created}
          placeholder="搜索或新建框架"
          title="选择框架"
          createText="新建"
          onCreateItem={createItem}
        />
      </div>
      <span class="demo-val">选中: "{created}"</span>
    </Row>
  </CodePreview>

  <CodePreview anchor="creatableselect-2" anchorLevel={3} title="异步加载 CreatableSelect" code={asyncSource}>
    <Row>
      <div class="demo-col">
        <CreatableSelect
          loadItems={async () => {
            await new Promise((r) => setTimeout(r, 600));
            Notification.success('数据加载完成');
            return ['异步项目 A', '异步项目 B', '异步项目 C'];
          }}
          placeholder="点击后异步加载"
          title="异步数据源"
        />
      </div>
    </Row>
  </CodePreview>

  <CodePreview anchor="combobox" anchorLevel={3} title="Combobox 基础过滤" code={comboboxBasicSource}>
    <div style="display:flex;flex-direction:column;gap:16px">
      <Combobox options={frameworks} bind:value={cbFw} placeholder="搜索框架…" onchange={(v) => Notification.info(`value = ${v || '（空）'}`)} />
      <p class="note">value = {cbFw || '（空）'}　可输入过滤、clearable 清除；Astro 为 disabled 项</p>
      <Combobox options={cities} bind:value={cbCity} placeholder="选择城市…" />
      <p class="note">value = {cbCity}</p>
    </div>
  </CodePreview>

  <CodePreview anchor="combobox-2" anchorLevel={3} title="Combobox 分组 + 隐藏滚动条" code={comboboxGroupSource}>
    <div style="display:flex;flex-direction:column;gap:16px">
      <Combobox options={groupedPeople} bind:value={cbPerson} placeholder="输入过滤，↑↓ 键跨组移动…" />
      <p class="note">value = {cbPerson || '（空）'}　10 个选项、3 组：上下滚动靠滚轮或两侧的箭头触发区</p>
    </div>
  </CodePreview>

  <CodePreview anchor="combobox-3" anchorLevel={3} title="Combobox 禁用 / 不过滤" code={comboboxDisabledSource}>
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <Combobox options={cities} value="" disabled placeholder="禁用" />
      <Combobox options={cities} value="" filter={false} placeholder="点击展开（不输入过滤）" />
    </div>
  </CodePreview>

  <Card title="Select Props">
    <PropsTable anchor="props" items={selectProps} />
  </Card>

  <Card title="MultiSelect Props">
    <PropsTable items={multiSelectProps} />
  </Card>

  <Card title="CreatableSelect Props">
    <PropsTable items={creatableSelectProps} />
  </Card>

  <Card title="Combobox Props">
    <PropsTable items={comboboxProps} />
  </Card>
</Page>

<style>
  .demo-col { width: 260px; }
  .demo-val { font-size: 13px; color: var(--text-muted); }
  .note { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin: 0; }
</style>

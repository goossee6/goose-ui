<script lang="ts">
  import {Card, Select, MultiSelect, CreatableSelect, Page, Notification, Row} from "goose-ui";

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

  let items = $state(['Svelte', 'React', 'Vue', 'Solid', 'Angular']);

  let prevMulti = $state<string[]>([]);
  let prevCreated = $state(created);

  $effect(() => { if (multi !== prevMulti) { prevMulti = multi; if (multi.length > 0) Notification.success(`已选择 ${multi.length} 项`); } });
  $effect(() => { if (created !== prevCreated) { prevCreated = created; if (created) Notification.success(`已选择「${created}」`); } });

  async function createItem(name: string) {
    await new Promise((r) => setTimeout(r, 300));
    items = [name, ...items];
    Notification.success(`已新建「${name}」`);
  }
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const selectProps: PropsTableItem[] = [
    { name: "value", desc: "选中值（可双向绑定）", type: "string", default: "''" },
    { name: "options", desc: "选项数组，元素 { value, label, meta?, metaClass? }", type: "Option[]", default: "[]" },
    { name: "onchange", desc: "变更回调", type: "(v: string) => void" },
    { name: "placeholder", desc: "占位文案", type: "string", default: "'请选择'" },
    { name: "width", desc: "宽度", type: "string", default: "'100%'" },
    { name: "placement", desc: "菜单弹出方向", type: "'top' | 'bottom' | 'left' | 'right'", default: "'bottom'" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
  ];

  const multiSelectProps: PropsTableItem[] = [
    { name: "values", desc: "选中值数组（可双向绑定）", type: "string[]", default: "[]" },
    { name: "items", desc: "选项数组，元素 { value, label, meta?, metaClass? }", type: "Option[]", default: "[]" },
    { name: "placeholder", desc: "占位文案", type: "string", default: "'请选择'" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
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
  ];
</script>

<Page title="选择器 Select" description="单选、多选标签、可搜索可新建的创建型选择器" >
  <Card title="基础单选 Select">
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
  </Card>

  <Card title="带 Meta 标签">
    <Row>
      <div class="demo-col">
        <Select options={metaOptions} bind:value={meta} onchange={(v) => { meta = v; Notification.success(`评级: ${metaOptions.find(o => o.value === v)?.label ?? v}`); }} placeholder="请选择评级" />
      </div>
      <span class="demo-val">选中: "{meta}"</span>
    </Row>
  </Card>

  <Card title="禁用状态">
    <Row>
      <div class="demo-col">
        <Select options={options} value="apple" disabled />
      </div>
    </Row>
  </Card>

  <Card title="弹出位置 placement">
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
  </Card>

  <Card title="多选 MultiSelect">
    <Row>
      <div class="demo-col">
        <MultiSelect items={options} bind:values={multi} placeholder="选择多种水果" />
      </div>
      <span class="demo-val">已选 {multi.length} 项: {multi.join(', ') || '无'}</span>
    </Row>
  </Card>

  <Card title="创建型选择器 CreatableSelect">
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
  </Card>

  <Card title="异步加载 CreatableSelect">
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
  </Card>
  <Card title="Select Props">
    <PropsTable items={selectProps} />
  </Card>

  <Card title="MultiSelect Props">
    <PropsTable items={multiSelectProps} />
  </Card>

  <Card title="CreatableSelect Props">
    <PropsTable items={creatableSelectProps} />
  </Card>
</Page>

<style>
  .demo-col { width: 260px; }
  .demo-val { font-size: 13px; color: var(--text-muted); }
</style>

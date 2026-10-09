<script lang="ts">
  import {Card, Page, Combobox, Notification, type ComboboxOption} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "options", desc: "选项列表（value/label/disabled/group；group 连续同名归组，组头吸顶）", type: "ComboboxOption[]", default: "[]" },
    { name: "value", desc: "选中值（双向绑定）", type: "string", default: "''" },
    { name: "placeholder", desc: "占位文本", type: "string", default: "'请选择…'" },
    { name: "disabled", desc: "禁用", type: "boolean", default: "false" },
    { name: "clearable", desc: "显示清除按钮", type: "boolean", default: "true" },
    { name: "filter", desc: "输入过滤", type: "boolean", default: "true" },
    { name: "onchange", desc: "变更回调", type: "(value: string) => void", default: "—" },
  ];

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

  const grouped: ComboboxOption[] = [
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

  let fw = $state('');
  let city = $state('sh');
  let person = $state('');
</script>

<Page title="Combobox 组合框" description="可输入过滤的下拉选择（Arrow↓ 打开、↑↓ 移动、Enter 选中、Esc 关闭）">
  <Card title="基础用法">
    <div style="display:flex;flex-direction:column;gap:16px">
      <Combobox options={frameworks} bind:value={fw} placeholder="搜索框架…" onchange={(v) => Notification.info(`value = ${v || '（空）'}`)} />
      <p class="note">value = {fw || '（空）'}</p>
      <Combobox options={cities} bind:value={city} placeholder="选择城市…" />
      <p class="note">value = {city}</p>
    </div>
  </Card>

  <Card title="分组 + 隐藏滚动条">
    <div style="display:flex;flex-direction:column;gap:16px">
      <Combobox options={grouped} bind:value={person} placeholder="输入过滤，↑↓ 键跨组移动…" />
      <p class="note">value = {person || '（空）'}　10 个选项、3 组：上下滚动靠滚轮或两侧的箭头触发区</p>
    </div>
  </Card>

  <Card title="禁用 / 不过滤">
    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <Combobox options={cities} value="" disabled placeholder="禁用" />
      <Combobox options={cities} value="" filter={false} placeholder="点击展开（不输入过滤）" />
    </div>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .note { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin: 0; }
</style>

<!--
  Clean room：模拟「别人拿到库、只 import theme.css、组件全用默认值」的用法。

  刻意不导入 demo 的任何东西（CodePreview / PropsTable / .page-body / .cp-card），
  也不给组件加任何包装类。唯一的两条样式是页面留白和本页小标题，不碰库的类名。
  用途：和 demo 页面里同一组件的效果做对照，看 demo 是否靠额外修改才「好看」。
-->
<script lang="ts">
  import {
    Button, Input, Textarea, Select, Toggle, Checkbox, RadioGroup, Separator, Tag, Avatar,
    Card, Tabs, TabsPanel, ProgressBar, Meter, Skeleton, Pagination, Rating, Empty,
    DataList, Loading, Label, StatusBadge, Row,
  } from 'goose-ui';

  let text = $state('');
  let picked = $state('');
  let on = $state(true);
  let agree = $state(true);
  let choice = $state('a');
  let tab = $state('one');
  let page = $state(1);
  let rating = $state(3);

  const options = [
    { value: 'a', label: '选项 A' },
    { value: 'b', label: '选项 B' },
    { value: 'c', label: '选项 C' },
  ];

  const tabItems = [
    { value: 'one', label: '标签一' },
    { value: 'two', label: '标签二' },
    { value: 'three', label: '标签三' },
  ];

  const rows = [
    { id: 1, name: '张三', email: 'zhangsan@example.com', status: '在线' },
    { id: 2, name: '李四', email: 'lisi@example.com', status: '离线' },
  ];
</script>

<div class="cr">
  <section>
    <h3>Button · 默认</h3>
    <Button>默认按钮</Button>
    <Button variant="primary">主要按钮</Button>
  </section>

  <section>
    <h3>Input / Textarea / Select · 默认</h3>
    <Input bind:value={text} placeholder="请输入内容" />
    <Textarea bind:value={text} placeholder="多行文本" />
    <Select bind:value={picked} {options} />
  </section>

  <section>
    <h3>表单控件 · 默认</h3>
    <Toggle bind:checked={on} />
    <Checkbox bind:checked={agree} /> 我已阅读并同意
    <RadioGroup bind:value={choice} options={options.slice(0, 2)} />
  </section>

  <section>
    <h3>Tag / Avatar / StatusBadge / Separator</h3>
    <Row>
      <Tag>标签</Tag>
      <Tag variant="primary">主色</Tag>
      <Avatar name="张三" />
      <StatusBadge />
      <StatusBadge variant="warning" />
    </Row>
    <Separator />
  </section>

  <section>
    <h3>Card · 默认</h3>
    <Card title="卡片标题">卡片内容，未加任何外层包装。</Card>
  </section>

  <section>
    <h3>Tabs · 默认（segmented）</h3>
    <Tabs items={tabItems} bind:value={tab}>
      <TabsPanel value="one">一</TabsPanel>
      <TabsPanel value="two">二</TabsPanel>
      <TabsPanel value="three">三</TabsPanel>
    </Tabs>
  </section>

  <section>
    <h3>ProgressBar / Meter / Skeleton / Loading</h3>
    <ProgressBar percent={40} />
    <div class="cr-metric" id="cr-metric">
      <span class="cr-metric-label">磁盘</span>
      <ProgressBar percent={40} />
      <span class="cr-metric-val">40%</span>
    </div>
    <Meter value={40} label="磁盘" />
    <Skeleton rows={2} />
    <Loading />
  </section>

  <section>
    <h3>Pagination / Rating / Empty</h3>
    <Pagination bind:page total={100} />
    <Rating bind:value={rating} />
    <Empty />
  </section>

  <section>
    <h3>DataList · 默认</h3>
    <DataList {rows}>
      {#snippet children(row)}
        <div class="cr-row">
          <span>{row.name}</span>
          <span>{row.email}</span>
        </div>
      {/snippet}
    </DataList>
  </section>

  <section>
    <h3>Label</h3>
    <Label for="cr-x">字段标签</Label>
  </section>
</div>

<style>
  /* 只有页面级留白与本页小标题，不参与任何库组件的样式。
     分区刻意用**块级**排版（不是 flex 列）：flex 列会把子项 stretch 成整行宽，
     按钮、开关这类本该按内容收缩的控件会被拉长，看上去像是库的默认值有问题 ——
     那是容器的锅。真实页面里没人在外面套 flex 列，这里也不能套。 */
  .cr {
    padding: 24px;
    max-width: 900px;
  }
  section {
    display: block;
    margin-bottom: 32px;
  }
  section > :global(* + *) {
    margin-top: 12px;
  }
  h3 {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
    margin-bottom: 12px;
  }
  .cr-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .cr-metric {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .cr-metric-label {
    width: 36px;
    flex-shrink: 0;
    font-size: 12px;
  }
  .cr-metric-val {
    width: 42px;
    flex-shrink: 0;
    text-align: right;
    font-size: 12px;
  }
</style>

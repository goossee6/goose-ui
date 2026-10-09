<script lang="ts">
  import { Page, Empty, Row, Button, Card, Tabs } from 'goose-ui';
  import Inbox from '@lucide/svelte/icons/inbox';
  import PropsTable, { type PropsTableItem } from '../PropsTable.svelte';

  const pageProps: PropsTableItem[] = [
    { name: 'title', desc: '页头标题', type: 'string', default: "''" },
    { name: 'description', desc: '页头描述', type: 'string', default: "''" },
    { name: 'maxWidth', desc: '内容限宽', type: 'string', default: '—' },
    { name: 'right', desc: '页头右侧操作区 snippet', type: 'Snippet', default: '—' },
    { name: 'children', desc: '页面内容', type: 'Snippet', default: '—' },
    { name: 'footer', desc: '页脚 snippet：内容区末尾、随内容滚，不足一屏时吸内容区底', type: 'Snippet', default: '—' },
    { name: 'active', desc: 'keep-alive 模式：控制显隐与进入/离开过渡（不传则配合外层 {#if} 自动过渡）', type: 'boolean', default: 'undefined' },
    { name: 'transition', desc: '关闭过渡（嵌套 Page 场景）', type: 'boolean', default: 'true' },
    { name: 'class', desc: '附加类名', type: 'string', default: "''" },
    { name: 'style', desc: '内联样式', type: 'string', default: "''" },
  ];

  const emptyProps: PropsTableItem[] = [
    { name: 'icon', desc: 'lucide 图标组件', type: 'Component', default: '—' },
    { name: 'title', desc: '主文案', type: 'string', default: "'暂无数据'" },
    { name: 'hint', desc: '副提示', type: 'string', default: "''" },
    { name: 'children', desc: '操作区（如按钮）', type: 'Snippet', default: '—' },
    { name: 'class', desc: '附加类名', type: 'string', default: "''" },
    { name: 'style', desc: '内联样式', type: 'string', default: "''" },
  ];

  const rowProps: PropsTableItem[] = [
    { name: 'gap', desc: '子项间距', type: "'sm' | 'md' | 'lg'", default: "'md'" },
    { name: 'align', desc: '交叉轴对齐', type: "'start' | 'center' | 'stretch'", default: "'center'" },
    { name: 'wrap', desc: '允许换行', type: 'boolean', default: 'true' },
    { name: 'children', desc: '子内容', type: 'Snippet', default: '—' },
    { name: 'class', desc: '附加类名', type: 'string', default: "''" },
    { name: 'style', desc: '内联样式', type: 'string', default: "''" },
  ];

  const vars = [
    { name: '--page-pad', desc: '页面内边距（Layout 内容区为 20px 24px）', type: 'length', default: '16px' },
    { name: '--page-pad-r', desc: '内容区右留白 / 滚动条贴边补偿；改动 --page-pad 右值时需同步', type: 'length', default: '跟随 --layout-pad-x，否则 16px' },
    { name: '--page-gap', desc: '页头/内容/卡片垂直节奏', type: 'length', default: '16px' },
    { name: '--ph-gap', desc: '独立使用 PageHeader 时的下间距', type: 'length', default: '32px' },
  ];
</script>

<Page
  title="Page 页面容器"
  description="新项目页面标准结构：根布局 + 页头 + 内容区间距一次到位，零样式模板"
>
  <p class="intro">
    <code>Page</code> 通过 CSS 变量与外壳沟通：裸壳项目自动获得 16px 内边距；
    在 <code>Layout</code> 内使用时自动归零（不双重）。垂直间距由
    <code>--page-gap</code> 统一接管，含页头与内容之间。
  </p>

  <div class="preview-frame">
    <Page title="预览 页面" description="header 固定 · 内容区超高自动滚动" transition={false}>
      {#snippet right()}
        <Button variant="primary" size="middle">操作</Button>
      {/snippet}
      {#each Array(6) as _, i}
        <Card title="卡片 {i + 1}">内容占位，滚动查看页头与内容的统一间距。</Card>
      {/each}
      {#snippet footer()}
        <p class="footer-note">页脚示例：位于内容区末尾，随内容滚动。</p>
      {/snippet}
    </Page>
  </div>

  <h3 class="section">Page</h3>
  <PropsTable items={pageProps} />
  <h3 class="section">Empty</h3>
  <div class="preview-box">
    <Empty icon={Inbox} title="暂无消息" hint="新消息会出现在这里" />
  </div>
  <PropsTable items={emptyProps} />
  <h3 class="section">Row</h3>
  <div class="preview-box">
    <Row gap="md">
      <Tabs items={[{ value: 'a', label: '选项 A' }, { value: 'b', label: '选项 B' }]} value="a" onchange={() => {}} />
      <Button variant="default">按钮一</Button>
      <Button variant="default">按钮二</Button>
    </Row>
  </div>
  <PropsTable items={rowProps} />
  <h3 class="section">主题变量</h3>
  <PropsTable items={vars} />
</Page>

<style>
  .intro {
    margin: 0;
    font-size: 13px;
    line-height: 1.8;
    color: var(--text-muted);
  }
  .intro code {
    padding: 1px 5px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--primary) 12%, transparent);
    color: var(--primary);
    font-size: 12px;
  }
  .preview-frame {
    --page-pad: 16px;
    height: 280px;
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .preview-box {
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .footer-note {
    margin: 0;
    font-size: 13px;
    color: var(--text-muted);
  }
  .section {
    margin: 8px 0 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-strong);
  }
</style>

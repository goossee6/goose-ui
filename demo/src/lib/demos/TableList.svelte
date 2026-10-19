<script lang="ts">
  import { Card, DataList, DataTable, Header, StatusBadge, Button, Page, Input } from "goose-ui";
  import CodePreview from "../CodePreview.svelte";
  import PropsTable from "../PropsTable.svelte";
  import { users, simpleColumns } from "./_shared";
  import { dataListProps, listHeaderProps, pillProps } from "./_tableShared";
  import { dataListSource, pillSource, listHeaderSource } from "./_tableSources";

  let listKeyword = $state("");
</script>

<Page toc title="DataList 列表" description="每行自由布局的集合容器，以及内置 header：复用通用 Header，三段槽位、吸顶、样式全透传">
  <p class="note">
    <code>DataList</code> 只负责「一堆行 + 空态 + 滚动 + 内置 header + 行 hover 高亮」，
    每一行长什么样完全由 <code>children(row)</code> 决定 —— 想做卡片式、时间线式、聊天记录式都可以。
  </p>
  <CodePreview anchor="composite-rows" anchorLevel={2} title="DataList · 复合行布局" code={dataListSource} flush>
    <div class="list-demo">
      <DataList rows={users}>
        {#snippet children(row)}
          <div class="list-row-inner">
            <div>
              <div class="list-name">{row.name}</div>
              <div class="list-sub">{row.email}</div>
            </div>
            <div class="list-right">
              <span class="list-role">{row.role}</span>
              <StatusBadge variant={row.status === "超额" ? "warning" : "normal"} />
            </div>
          </div>
        {/snippet}
      </DataList>
    </div>
  </CodePreview>

  <p class="note">
    DataTable 与 DataList 的 hover 高亮不是简单的 <code>:hover</code> 换色，而是由内置的
    <code>PillTrack</code> 绘制的一块圆角带：鼠标在行间移动时它带 0.22s 缓动从上一行滑到下一行，
    行高不同也能贴准。禁止行（DataTable 的 <code>disabled</code>）不参与，鼠标划过时 pill 停在上一个可用行。
    要给自己写的列表接同一套效果，把容器元素和项选择器交给 <code>PillTrack</code> 即可，
    容器需要 <code>position: relative</code>。
  </p>
  <CodePreview anchor="datalist" anchorLevel={3} title="DataList — 行高不一时同样贴准" code={pillSource} flush>
    <div class="list-demo">
      <DataList rows={users}>
        {#snippet children(row)}
          <div class="list-row-inner">
            <div>
              <div class="list-name">{row.name}</div>
              <div class="list-sub">{row.email}</div>
            </div>
            <StatusBadge variant={row.status === "超额" ? "warning" : "normal"} />
          </div>
        {/snippet}
      </DataList>
    </div>
  </CodePreview>

  <Card anchor="list-header" title="列表 Header">
    <p class="note">
      列表常常需要「标题 + 计数 + 操作」这一条，以前要在外面手拼一个 div，还得自己处理吸顶与底色。
      现在交给 <code>DataList</code> 的内置 header —— 它不是另写的一套壳，而是<strong>直接复用通用的 <code>Header</code> 组件</strong>：
      三段槽位、<code>--header-h</code> 高度、吸顶、<code>class</code>/<code>style</code> 全部原样可用。
      不传任何 header 相关 prop 就完全不渲染，也不会多出任何节点。
    </p>
    <ul class="points">
      <li><b>槽位映射</b>：<code>title</code> → Header 的 title，<code>header</code> → left，<code>headerCenter</code> → center，<code>headerRight</code> → right。</li>
      <li><b>样式透传</b>：<code>headerClass</code> / <code>headerStyle</code> 原样交给 Header，改高度就用 <code>--header-h</code>。</li>
      <li><b>对齐</b>：容器把 Header 的左右缩进设成与行内容相同的 <code>--list-pad</code>，表头文字和第一列文字天然对齐。</li>
      <li><b>两种放法</b>：塞进已有内边距的卡片时保持默认；独立成块时加 <code>dataTableHeader</code>，容器自己补内边距、底色铺到边缘。</li>
      <li><b>表格混排</b>：让 <code>DataTable</code> 和 <code>Header</code> 共用外层滚动容器时，给表格传 <code>headerBleed</code>，表头底色才不会在左右边缘留下窄缝。</li>
    </ul>

    <CodePreview anchor="header-search" anchorLevel={3} title="① 标题 + 右侧搜索（默认，无额外内边距）" code={listHeaderSource} flush>
      <div class="lh-demo">
        <DataList rows={users} title="成员">
          {#snippet headerRight()}
            <div class="lh-search">
              <Input placeholder="搜索成员" bind:value={listKeyword} />
            </div>
          {/snippet}
          {#snippet children(row)}
            <div class="list-row-inner">
              <div class="list-name">{row.name}</div>
              <div class="list-right">
                <span class="list-role">{row.role}</span>
                <StatusBadge variant={row.status === "超额" ? "warning" : "normal"} />
              </div>
            </div>
          {/snippet}
        </DataList>
      </div>
    </CodePreview>

    <CodePreview anchor="header-left-center-right" anchorLevel={3} title="② Header 三段槽位：left / center / right 都能用" code={listHeaderSource} flush>
      <div class="lh-demo">
        <DataList rows={users}>
          {#snippet header()}
            <span class="lh-title">成员</span>
            <span class="lh-meta">共 {users.length} 人</span>
          {/snippet}
          {#snippet headerCenter()}
            <div class="lh-search lh-search--wide">
              <Input placeholder="搜索成员" bind:value={listKeyword} />
            </div>
          {/snippet}
          {#snippet headerRight()}
            <Button size="small">新建</Button>
          {/snippet}
          {#snippet children(row)}
            <div class="list-row-inner">
              <div class="list-name">{row.name}</div>
              <div class="list-right">
                <span class="list-role">{row.role}</span>
                <StatusBadge variant={row.status === "超额" ? "warning" : "normal"} />
              </div>
            </div>
          {/snippet}
        </DataList>
      </div>
    </CodePreview>

    <CodePreview anchor="datatableheader" anchorLevel={3} title="③ 独立成块 dataTableHeader：底色铺到边缘、内边距自带" code={listHeaderSource} flush>
      <div class="panel-demo">
        <DataList rows={users} title="成员" dataTableHeader>
          {#snippet headerRight()}
            <div class="lh-search">
              <Input placeholder="搜索成员" bind:value={listKeyword} />
            </div>
          {/snippet}
          {#snippet children(row)}
            <div class="list-row-inner">
              <div class="list-name">{row.name}</div>
              <div class="list-right">
                <span class="list-role">{row.role}</span>
                <StatusBadge variant={row.status === "超额" ? "warning" : "normal"} />
              </div>
            </div>
          {/snippet}
        </DataList>
      </div>
    </CodePreview>

    <CodePreview anchor="header-headerbleed" anchorLevel={3} title="④ 与表格共用一个滚动容器（Header + headerBleed）" code={listHeaderSource} flush>
      <div class="panel-demo shared-scroll">
        <Header title="成员" style="--header-h:auto;margin:0;padding:0 16px" />
        <DataTable rows={users} columns={simpleColumns} headerBleed={16} />
      </div>
    </CodePreview>
  </Card>

  <Card title="DataList Props">
    <PropsTable anchor="props" items={dataListProps} />
  </Card>

  <Card title="Header Props">
    <PropsTable items={listHeaderProps} />
  </Card>

  <Card title="PillTrack Props">
    <p class="note">
      表格与列表的 hover 高亮就是它画的，一般不用直接使用；要给自己写的列表接同一套滑动效果时再传参。
      容器需 <code>position: relative</code>，pill 默认挂在容器内容区、随容器一起滚动。
    </p>
    <PropsTable items={pillProps} />
  </Card>
</Page>

<style>
  .note {
    margin: 0 0 var(--sp-md);
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
  }
  code {
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--surface-3);
    color: var(--text-strong);
  }
  .points {
    margin: 0 0 var(--sp-lg);
    padding-left: 1.2em;
    font-size: 13px;
    line-height: 1.7;
    color: var(--text-muted);
  }
  .points b {
    color: var(--text-strong);
    font-weight: 500;
  }
  /* ② 示例里 left 槽自带标题 + 计数，模拟 Header.left 放入任意内容 */
  .lh-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-strong);
    white-space: nowrap;
  }
  .lh-meta {
    font-size: 12px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  /* ① 模拟「已经在内边距的卡片里」：列表本身不再补内边距 */
  .lh-demo {
    height: 260px;
    padding: var(--sp-lg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  /* ② 独立成块：容器没有内边距，交给 dataTableHeader 自己补 */
  .panel-demo {
    height: 260px;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  /* ④ 表格 + Header 共用同一个滚动容器 */
  .panel-demo.shared-scroll {
    overflow: auto;
    padding-inline: 16px;
  }
  .lh-search {
    width: 180px;
  }
  .lh-search :global(.input-wrapper) {
    height: 32px;
  }
  .lh-search--wide {
    width: 240px;
  }
  .list-demo {
    max-height: 300px;
    padding: var(--sp-lg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
  }
  .list-row-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .list-name {
    font-weight: 500;
    color: var(--text-strong);
  }
  .list-sub {
    font-size: 12px;
    color: var(--text-muted);
  }
  .list-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .list-role {
    font-size: 12px;
    color: var(--text-muted);
  }
</style>

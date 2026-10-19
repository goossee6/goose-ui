<script lang="ts">
  import { Card, DataTable, DataList, StatusBadge, Button, Page, Input, Icon, Notification, registerMenu, unregisterMenu, onMenuAction, copyToClipboard, type Column } from "goose-ui";
  import Search from "@lucide/svelte/icons/search";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Eye from "@lucide/svelte/icons/eye";
  import Copy from "@lucide/svelte/icons/copy";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { onMount, onDestroy } from "svelte";
  import CodePreview from "../CodePreview.svelte";
  import PropsTable from "../PropsTable.svelte";
  import { users, manyUsers, columns, simpleColumns, type User } from "./_shared";
  import { compareRows, dataTableProps, columnProps, dataListProps } from "./_tableShared";
  import { compareSource, dataTableSource, cellSource, actionsSource, resizableSource, stateSource, stickySource, noStickySource } from "./_tableSources";

  let highlight = $state("");

  let menuOffs: (() => void)[] = [];
  onMount(() => {
    registerMenu("user-row", [
      { id: "copy", label: "复制", icon: Copy },
      { id: "detail", label: "查看详情", icon: Eye },
    ]);
    menuOffs = [
      onMenuAction("user-row", "copy", async (d) => {
        const ok = await copyToClipboard(d.copy ?? "");
        Notification[ok ? "success" : "error"](ok ? "已复制" : "复制失败");
      }),
      onMenuAction("user-row", "detail", (d) => Notification.success(`查看：${d.copy}`)),
    ];
  });
  onDestroy(() => {
    menuOffs.forEach((off) => off());
    menuOffs = [];
    unregisterMenu("user-row");
  });
</script>

<Page toc title="DataTable 数据表格" description="配置驱动、按列对齐的表格：排序、高亮、右键菜单、按比例分配列宽、表头吸顶、loading / 空态">
  <Card anchor="choosing" title="怎么选">
    <div class="pick">
      <div class="pick-item">
        <div class="pick-head">用 <code>DataTable</code></div>
        <div class="pick-body">
          数据是<strong>记录</strong>，每行字段固定且同名，需要横向比较。
          要排序、要按列扫视、要对单元格挂右键菜单、要关键字高亮命中字段时选它。
        </div>
      </div>
      <div class="pick-item">
        <div class="pick-head">用 <code>DataList</code></div>
        <div class="pick-body">
          数据是<strong>实体</strong>，每行是复合布局。一行里是「头像 + 标题 + 副标题 + 右侧操作」
          这种不平衡结构、行高不等、需要自定义交互时选它。
        </div>
      </div>
    </div>
    <div class="pick-rule">
      判断标准：<strong>字段在每一行是否处于相同的水平位置</strong>。是 → DataTable；不是 → DataList。
    </div>

    <div class="compare">
      <table>
        <thead>
          <tr><th>维度</th><th>DataTable</th><th>DataList</th></tr>
        </thead>
        <tbody>
          {#each compareRows as r (r.k)}
            <tr><td class="k">{r.k}</td><td>{r.table}</td><td>{r.list}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  </Card>

  <CodePreview anchor="basic-table" anchorLevel={2} title="同一份数据，两种容器" code={compareSource} flush>
    <p class="side-hint">
      两侧都是同一份 <code>users</code>（10 条），各自独立滚动 —— 滚左边时右边不动，方便停在任意一行逐列对照两边是否对齐。
    </p>
    <div class="side">
      <div class="side-col">
        <div class="side-label">DataTable — 列对齐由 &lt;td&gt; 保证</div>
        <div class="side-box">
          <DataTable rows={users} columns={simpleColumns} />
        </div>
      </div>
      <div class="side-col">
        <div class="side-label">DataList — 行高不一时同样贴准</div>
        <div class="side-box">
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
      </div>
    </div>
  </CodePreview>

  <CodePreview anchor="datatable" anchorLevel={3} title="DataTable · 可排序 + 关键字高亮 + 列右键菜单" code={dataTableSource} flush>
      {#snippet right()}
        <div style="width:220px">
          <Input name="highlight" placeholder="高亮关键字…" bind:value={highlight} onClear={() => Notification.success("已清除搜索")}>
            {#snippet prefix()}<Icon icon={Search} size={16} />{/snippet}
          </Input>
        </div>
      {/snippet}
      <div style="max-height:360px;overflow:auto">
        <DataTable rows={users} {columns} {highlight} menu="user-row" />
      </div>
    </CodePreview>

  <CodePreview anchor="cells-actions" anchorLevel={2} title="DataTable · 自定义单元格（custom + cell snippet）" code={cellSource} flush>
      <div style="max-height:320px;overflow:auto">
        <DataTable rows={users} {columns} cell={statusCell} />
      </div>
    </CodePreview>

  <CodePreview anchor="datatable-actions-snippet" anchorLevel={3} title="DataTable · 操作列（actions snippet）" code={actionsSource} flush>
      <DataTable rows={users} columns={simpleColumns} actions={rowActions} />
    </CodePreview>

  <CodePreview anchor="widths-states" anchorLevel={2} title="DataTable · 按比例分配列宽 + hover 滚动" code={resizableSource} flush>
      <div style="max-height:320px">
        <DataTable rows={users} {columns} />
      </div>
    </CodePreview>

  <CodePreview anchor="datatable-2" anchorLevel={3} title="DataTable · 加载中 / 空状态" code={stateSource} flush>
      <DataTable rows={[]} columns={simpleColumns} loading={true} />
      <DataTable rows={[]} columns={simpleColumns} emptyText="暂无用户数据" />
    </CodePreview>

  <Card anchor="sticky-header" title="表头吸顶">
    <p class="note">
      <code>DataTable</code> 的表头是 <code>position: sticky</code>，滚动时只走数据行，表头固定在顶部不动。
      表头底色不透明、下边框加粗、底缘还有一道极淡的投影，滚过去的行会被干净地压到下面。
    </p>
    <ul class="points">
      <li><b>滚动的归属</b>：滚动必须发生在 <code>DataTable</code> 自己的 <code>.table-container</code> 里。容器是 <code>height:100%; max-height:100%</code> —— 父容器有确定高度时正好填满，父容器只是 <code>auto</code> 时退化为内容高度，这两种情况滚动都由表格自己承担，表头都不会跟着页面滚走。</li>
      <li><b>自己给高度</b>：想让表格在卡片里占固定高度、内部滚动，外面套一个 <code>height</code> 或 <code>max-height</code> 即可（下例的两个预览框分别是 220px / 320px）。</li>
      <li><b>与 Header 混排</b>：把 <code>DataTable</code> 和 <code>Header</code> 放进同一个外层滚动容器、由外层负责滚动时，给表格传 <code>headerBleed</code>（= 外层左右内边距），表头的底色才会铺到容器边缘、不露出窄缝。</li>
    </ul>
    <CodePreview anchor="sticky-inner" anchorLevel={3} title="① 表格在卡片内独立滚动：表头吸顶" code={stickySource} flush>
      <div class="sticky-demo">
        <DataTable rows={manyUsers} columns={simpleColumns} />
      </div>
    </CodePreview>
    <CodePreview anchor="hover-pill" anchorLevel={3} title="② 表头 + 行 hover pill 同时工作" code={stickySource} flush>
      <div class="sticky-demo sticky-demo--tall">
        <DataTable rows={manyUsers} {columns} disabled={(r) => r.status === "超额"} />
      </div>
    </CodePreview>
    <p class="note">
      示例用 30 行数据（<code>manyUsers</code>），列表高度超过容器才会出现滚动条，向下滚一下就能看到表头停在顶部、数据行从表头下面穿过去。
    </p>
    <CodePreview anchor="stickyheader-false" anchorLevel={3} title="③ 关掉吸顶换帧率：stickyHeader={false}" code={noStickySource} flush>
      <div class="sticky-demo">
        <DataTable rows={manyUsers} columns={simpleColumns} stickyHeader={false} />
      </div>
    </CodePreview>
    <p class="note">
      一页里放十几张表、或表格嵌在多层滚动容器里时，sticky 表头每帧都要重算吸顶位置，会明显拖慢帧率。
      这种场景传 <code>stickyHeader</code> 为 <code>false</code>：表头跟着行滚走，但底色、下边框都在，列名与数据依然分得开。
    </p>
  </Card>

  <p class="note">
    数据行的 hover 不是简单的 <code>:hover</code> 换色，而是由内置的 <code>PillTrack</code> 绘制的一块圆角带：
    鼠标在行间移动时它带 0.22s 缓动从上一行滑到下一行，跨表移动也一样。
    被 <code>disabled</code> 判为禁用的行不参与，鼠标划过时 pill 停在上一个可用行。
  </p>
  <CodePreview anchor="row-highlight" anchorLevel={2} title="DataTable — 行间滑动高亮" code={stickySource} flush>
    <div class="sticky-demo">
      <DataTable rows={users} columns={simpleColumns} disabled={(r) => r.status === "超额"} />
    </div>
  </CodePreview>

  <Card title="DataTable Props">
    <PropsTable anchor="props" items={dataTableProps} />
  </Card>

  <Card title="Column&lt;T&gt; 字段">
    <PropsTable items={columnProps} />
  </Card>

  <Card title="DataList Props">
    <PropsTable items={dataListProps} />
  </Card>
</Page>

{#snippet statusCell(colId: string, row: User)}
  {#if colId === "status"}
    <StatusBadge variant={row.status === "超额" ? "warning" : "normal"} />
  {:else}
    {row[colId as keyof User]}
  {/if}
{/snippet}

{#snippet rowActions(row: User)}
  <Button size="icon-sm" variant="ghost" icon={Eye} ariaLabel="查看" onclick={() => Notification.success(`查看 ${row.name}`)} />
  <Button size="icon-sm" variant="ghost" icon={Pencil} ariaLabel="编辑" onclick={() => Notification.success(`编辑 ${row.name}`)} />
  <Button size="icon-sm" variant="danger" icon={Trash2} ariaLabel="删除" onclick={() => Notification.error(`删除 ${row.name}`)} />
{/snippet}

<style>
  /* ── 选型说明 ─────────────────────────────────────────────── */
  .pick {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-lg);
    margin-bottom: var(--sp-lg);
  }
  .pick-item {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--sp-md) var(--sp-lg);
    background: var(--surface-2);
  }
  .pick-head {
    font-weight: 600;
    color: var(--text-strong);
    margin-bottom: var(--sp-sm);
  }
  .pick-body {
    font-size: 13px;
    line-height: 1.6;
    color: var(--text);
  }
  .pick-rule {
    padding: var(--sp-md) var(--sp-lg);
    border-left: 3px solid var(--primary);
    background: var(--accent-sub);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    font-size: 13px;
    color: var(--text);
    margin-bottom: var(--sp-lg);
  }
  code {
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--surface-3);
    color: var(--text-strong);
  }
  .compare {
    overflow-x: auto;
    /* 作为 Card 的直接子项时 min-width 默认 auto，会被 nowrap 表头撑开，
       导致 overflow-x 失效、横向滚动条跑到整页上。 */
    min-width: 0;
  }
  .compare table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .compare th {
    text-align: left;
    padding: var(--sp-md) var(--sp-lg);
    background: var(--surface-2);
    color: var(--text-muted);
    font-weight: 500;
    border-bottom: 1px solid var(--border-strong);
    /* 只在宽屏下 nowrap：窄屏允许换行，避免表格被撑到必须横向滚动 */
    white-space: nowrap;
  }
  @media (max-width: 720px) {
    .compare th { white-space: normal; }
  }
  .compare td {
    padding: var(--sp-md) var(--sp-lg);
    border-bottom: 1px solid var(--border);
    color: var(--text);
    vertical-align: top;
    line-height: 1.55;
  }
  .compare td.k {
    color: var(--text-muted);
    white-space: nowrap;
  }
  .compare tbody tr:last-child td {
    border-bottom: none;
  }

  /* ── 同数据双渲染对照 ─────────────────────────────────────── */
  .side-hint {
    margin: 0 0 var(--sp-lg);
    font-size: 13px;
    color: var(--text-muted);
  }
  .side {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-lg);
  }
  .side-col {
    min-width: 0;
  }
  .side-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: var(--sp-sm);
  }
  .side-box {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    /* 两侧各自独立滚动、高度同步：行数一多也不会把卡片撑高，
       左右两列的行始终一一对应，方便逐行对照。 */
    height: 300px;
    /* CodePreview 以 flush 渲染（预览区自身无内边距），表格/列表会直接贴在
       卡片边框上；这里补回一圈内边距，并把圆角交给外层裁切，表头圆角才不会
       压在自己方角的外框上。 */
    padding: var(--sp-lg);
  }

  .note {
    margin: 0 0 var(--sp-md);
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
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

  /* 表头吸顶：外层给固定高度，滚动交给 DataTable 自己的容器，
     这样滚动的只是数据行，表头始终贴在顶部。 */
  .sticky-demo {
    height: 220px;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .sticky-demo--tall { height: 320px; }

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

  @media (max-width: 720px) {
    .pick,
    .side {
      grid-template-columns: 1fr;
    }
  }
</style>

<script lang="ts">
  import {Card, Page, Button, Drawer, Collapsible, Input, Layout, TitleBar, themeStore, toggleThemeFromEvent} from 'goose-ui';
  import Menu from '@lucide/svelte/icons/menu';
  import PropsTable, { type PropsTableItem } from '../PropsTable.svelte';
  import CodePreview from "../CodePreview.svelte";

  const layoutProps: PropsTableItem[] = [
    { name: "titlebar", desc: "顶部区域插槽，通常放 TitleBar", type: "Snippet" },
    { name: "aside", desc: "左侧区域插槽，通常放 Sidebar；省略则不渲染，内容区占满整宽", type: "Snippet" },
    { name: "children", desc: "内容区", type: "Snippet" },
    { name: "scroll", desc: "内容卡片整页滚动；false = 框架不滚、页内滚动区自理", type: "boolean", default: "true" },
    { name: "resize", desc: "Wails 窗口支持：全域拖拽调整 + 四角手柄", type: "boolean", default: "false" },
    { name: "framed", desc: "内容区是否画成卡片（边框 / 圆角 / 底色）；false = 裸容器，用于整窗铺背景的首页", type: "boolean", default: "true" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const structureSource = `<script lang="ts">
  import { Layout, TitleBar, Sidebar, themeStore, toggleThemeFromEvent } from "goose-ui";

  const groups = [{ title: "导航", items: [{ value: "home", label: "首页" }] }];
  let activeTab = $state("home");
<\/script>

<Layout>
  {#snippet titlebar()}
    <TitleBar
      title="我的应用"
      theme={themeStore.theme}
      onThemeToggle={toggleThemeFromEvent}
    />
  {/snippet}
  {#snippet aside()}
    <Sidebar {groups} bind:activeTab embedded />
  {/snippet}
  <p>主内容区</p>
</Layout>`;

  /* 抽屉版：不传 tabs，导航收进 Drawer，内容区占满整宽。 */
  const navGroups = [
    {
      title: "操作",
      items: [{ value: "windows", label: "进程列表" }],
    },
    {
      title: "配置",
      items: [{ value: "settings", label: "设置" }],
    },
  ];
  let navExpanded = $state(navGroups.map(() => true));
  let navActive = $state("windows");
  let navOpen = $state(false);
  let drawerHost = $state<HTMLElement>();
  const navLabel = $derived(
    navGroups.flatMap((g) => g.items).find((i) => i.value === navActive)?.label ?? ""
  );

  const drawerSource = `<script lang="ts">
  import { Button, Collapsible, Drawer, Input, Layout, Page, TitleBar, themeStore, toggleThemeFromEvent } from "goose-ui";
  import Menu from "@lucide/svelte/icons/menu";

  const groups = [
    { title: "操作", items: [{ value: "windows", label: "进程列表" }] },
    { title: "配置", items: [{ value: "settings", label: "设置" }] },
  ];

  let open = $state(false);
  let active = $state("windows");
  let expanded = $state(groups.map(() => true));
<\/script>

<Layout>
  {#snippet titlebar()}
    <TitleBar
      title="我的应用"
      theme={themeStore.theme}
      onThemeToggle={toggleThemeFromEvent}
    />
  {/snippet}

  <Page>
    <div style="display:flex;align-items:center;gap:8px">
      <Button
        size="icon-sm"
        variant="ghost"
        icon={Menu}
        ariaLabel="打开导航"
        onclick={() => (open = true)}
      />
      <div style="width:200px"><Input placeholder="搜索…" /></div>
    </div>
  </Page>
</Layout>

<Drawer bind:open title="导航" placement="left" width={260}>
  <div style="display:flex;flex-direction:column;gap:8px">
    {#each groups as group, gi (group.title)}
      <Collapsible open={expanded[gi]} onchange={(v) => (expanded[gi] = v)}>
        {#snippet trigger()}
          <span>{group.title}</span>
        {/snippet}
        <div style="display:flex;flex-direction:column;gap:2px">
          {#each group.items as item (item.value)}
            <Button
              variant={active === item.value ? "default" : "ghost"}
              style="justify-content:flex-start"
              onclick={() => { active = item.value; open = false; }}
            >{item.label}</Button>
          {/each}
        </div>
      </Collapsible>
    {/each}
  </div>
</Drawer>`;
</script>

<Page toc title="Layout 布局" description="纯布局外壳：titlebar / aside / children 三个插槽，组件由使用方自行组合">
  <CodePreview anchor="structure" anchorLevel={2} title="布局结构" code={structureSource}>
    <!-- Layout 是 position:absolute 的全视口外壳；套一层定位容器即可在本页内预览 -->
    <div class="layout-preview">
      <Layout>
        {#snippet titlebar()}
          <TitleBar
            title="布局结构"
            subtitle="titlebar 插槽"
            theme={themeStore.theme}
            onThemeToggle={toggleThemeFromEvent}
            windowControls={false}
          />
        {/snippet}
        {#snippet aside()}
          <div class="preview-aside">
            <span class="preview-aside-title">aside 插槽</span>
            <Button size="small" variant="ghost" style="justify-content:flex-start">导航项</Button>
          </div>
        {/snippet}
        <Page>
          <p class="preview-placeholder">children 内容区（通常放 Page）</p>
        </Page>
      </Layout>
    </div>
  </CodePreview>

  <CodePreview anchor="drawer-navigation" anchorLevel={2} title="抽屉导航 Drawer navigation" code={drawerSource}>
    <div class="layout-preview" bind:this={drawerHost}>
      <Layout>
        {#snippet titlebar()}
          <TitleBar
            title="抽屉版外壳"
            subtitle="无侧栏 · 导航收进抽屉"
            theme={themeStore.theme}
            onThemeToggle={toggleThemeFromEvent}
            windowControls={false}
          />
        {/snippet}
        <Page>
          <div class="preview-toolbar">
            <Button
              size="icon-sm"
              variant="ghost"
              icon={Menu}
              iconSize={16}
              ariaLabel="打开导航"
              title="导航"
              onclick={() => (navOpen = true)}
            />
            <div class="preview-search"><Input placeholder="搜索窗口…" /></div>
            <span class="preview-page">当前页：{navLabel}</span>
          </div>
          <p class="preview-placeholder">不传 aside，主内容区占满整宽；导航由 Drawer 承载。</p>
        </Page>
      </Layout>
    </div>

    <!-- container 把抽屉限制在预览框内；真实应用放在 Layout 外层即可，不用传。
         offsetTop 让抽屉层从标题栏下面开始 —— 这本来就是公开属性，
         不该用 :global(.drawer-root--contained) 去改内部类。 -->
    <Drawer
      bind:open={navOpen}
      title="导航"
      placement="left"
      width={260}
      container={drawerHost}
      offsetTop="var(--titlebar-h)"
      pushBackground={false}
    >
      <div class="preview-nav">
        {#each navGroups as group, gi (group.title)}
          <Collapsible open={navExpanded[gi]} onchange={(v) => (navExpanded[gi] = v)}>
            {#snippet trigger()}
              <span>{group.title}</span>
            {/snippet}
            <div class="preview-nav-list">
              {#each group.items as item (item.value)}
                <Button
                  variant={navActive === item.value ? 'default' : 'ghost'}
                  style="justify-content:flex-start"
                  onclick={() => {
                    navActive = item.value;
                    navOpen = false;
                  }}
                >{item.label}</Button>
              {/each}
            </div>
          </Collapsible>
        {/each}
      </div>
    </Drawer>
  </CodePreview>

  <Card title="Props">
    <PropsTable anchor="props" items={layoutProps} />
  </Card>

  <Card title="说明">
    <div class="demo-note">
      <p>Layout 只提供区域，不内置 TitleBar、Sidebar 等组件：用 titlebar / aside 插槽自行组合。</p>
      <p>不传 aside 时没有常驻侧栏，导航可改由 Drawer 承载（见上方「抽屉导航」）。</p>
      <p>演示里给 Drawer 传了 container，把抽屉限制在预览框内；真实应用直接放在 Layout 外层即可。</p>
      <p>在浏览器中可预览结构，但窗口控制功能需在 Wails3 环境中使用。</p>
    </div>
  </Card>
</Page>

<style>
  .demo-note { font-size: 13px; color: var(--text-muted); line-height: 1.8; }
  .demo-note p { margin: 0; }
  /* 抽屉版预览：Layout 是 absolute 全视口外壳，外面给一个定位容器把它框住。
     Layout 自身不占流，必须显式给宽，否则容器会被挤成一条线。 */
  .layout-preview {
    position: relative;
    width: min(72vw, 720px);
    height: 360px;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  /* 抽屉的「从标题栏下面开始」由 <Drawer offsetTop> 负责（公开属性），
     这里不再需要覆盖 .drawer-root--contained 的 top。 */
  .preview-aside {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 160px;
    padding: 8px;
  }
  .preview-aside-title {
    padding: 0 8px 4px;
    font-size: 12px;
    color: var(--text-muted);
  }
  .preview-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .preview-search { width: 200px; }
  .preview-page { font-size: 12px; color: var(--text-muted); }
  .preview-placeholder {
    margin: 16px 0 0;
    font-size: 13px;
    color: var(--text-muted);
  }
  .preview-nav { display: flex; flex-direction: column; gap: 8px; }
  .preview-nav-list { display: flex; flex-direction: column; gap: 2px; }
</style>

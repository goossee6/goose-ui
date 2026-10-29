<script lang="ts">
  import {Card, Button, Collapsible, Drawer, Page, Row} from "goose-ui";

  let rightOpen = $state(false);
  let leftOpen = $state(false);
  let topOpen = $state(false);
  let bottomOpen = $state(false);
  let wideOpen = $state(false);
  let noMaskOpen = $state(false);
  let customFooterOpen = $state(false);
  let noPushOpen = $state(false);
  let depthOpen = $state(false);
  let navOpen = $state(false);
  let navTab = $state("windows");
  let scopeOpen = $state(false);
  let fullOpen = $state(false);
  let scopeHost = $state<HTMLElement>();
  let resizeOpen = $state(false);

  /* 抽屉里只放列表，不用 Sidebar 组件；分组折叠直接复用 Collapsible。
     不在抽屉里嵌 Sidebar：侧栏的定位/边框/整体收起是给页面壳用的。 */
  const navGroups = [
    {
      title: "操作",
      items: [
        { value: "windows", label: "进程列表" },
        { value: "favorites", label: "收藏" },
      ],
    },
    {
      title: "配置",
      items: [
        { value: "settings", label: "设置" },
        { value: "about", label: "关于" },
      ],
    },
  ];
  let navExpanded = $state<Record<string, boolean>>({ "操作": true, "配置": true });
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";
  import CodePreview from "../CodePreview.svelte";

  const drawerProps: PropsTableItem[] = [
    { name: "open", desc: "是否打开（可双向绑定）", type: "boolean", default: "false" },
    { name: "title", desc: "标题", type: "string | Snippet" },
    { name: "placement", desc: "弹出方向", type: "'left' | 'right' | 'top' | 'bottom'", default: "'right'" },
    { name: "width", desc: "宽度（左右方向生效）", type: "number | string", default: "378" },
    { name: "height", desc: "高度（上下方向生效）", type: "number | string", default: "300" },
    { name: "resizable", desc: "可拖动边缘调整尺寸：top/bottom 调高度，left/right 调宽度", type: "boolean", default: "false" },
    { name: "snapPoints", desc: "松手后吸附的尺寸百分比（按抽屉轴向）；拖过最小档位一半松手即关闭", type: "number[]", default: "[30, 60, 80]" },
    { name: "offsetTop", desc: "顶部留白（数字按 px），让抽屉从标题栏下沿开始", type: "number | string" },
    { name: "maskClosable", desc: "点击遮罩是否关闭", type: "boolean", default: "true" },
    { name: "pushBackground", desc: "景深下沉（缩放 + 模糊 + 圆角），默认启用，传 false 关闭", type: "boolean", default: "true" },
    { name: "pushScale", desc: "景深下沉时的背景缩放比例（1 = 不缩，夹在 0.5~1）", type: "number", default: "0.94" },
    { name: "pushBlur", desc: "景深模糊半径（px，0 = 只缩不糊，夹在 0~40）", type: "number", default: "1" },
    { name: "backgroundSelector", desc: "景深作用的宿主容器；传 null 关闭。默认取第一个匹配的 .layout / .layout-content / main", type: "string | null", default: "'.layout, .layout-content, main'" },
    { name: "container", desc: "挂载容器，默认 body；传入元素时抽屉改为在容器内绝对定位（容器需为定位元素）", type: "HTMLElement | null", default: "null" },
    { name: "footer", desc: "底部区域插槽", type: "Snippet | null" },
    { name: "onClose", desc: "关闭回调", type: "() => void" },
    { name: "children", desc: "抽屉内容", type: "Snippet" },
    { name: "class", desc: "附加类名", type: "string", default: "''" },
    { name: "style", desc: "内联样式", type: "string", default: "''" },
  ];

  const placementSource = `<script lang="ts">
  import { Button, Drawer, Row } from "goose-ui";

  let rightOpen = $state(false);
  let leftOpen = $state(false);
  let topOpen = $state(false);
  let bottomOpen = $state(false);
<\/script>

<Row>
  <Button variant="primary" onclick={() => (rightOpen = true)}>右侧抽屉 (默认)</Button>
  <Button onclick={() => (leftOpen = true)}>左侧</Button>
  <Button onclick={() => (topOpen = true)}>顶部</Button>
  <Button onclick={() => (bottomOpen = true)}>底部</Button>

  <Drawer bind:open={rightOpen} title="右侧抽屉" maskClosable>
    <p>这是从右侧滑出的抽屉内容。</p>
  </Drawer>
  <Drawer bind:open={leftOpen} title="左侧抽屉" placement="left" maskClosable>
    <p>从左侧滑出的抽屉，点击遮罩关闭。</p>
  </Drawer>
  <Drawer bind:open={topOpen} title="顶部抽屉" placement="top" height={200} maskClosable>
    <p>从顶部滑出的抽屉，高度 200px，点击遮罩关闭。</p>
  </Drawer>
  <Drawer bind:open={bottomOpen} title="底部抽屉" placement="bottom" height={200} maskClosable>
    <p>从底部滑出的抽屉，高度 200px，点击遮罩关闭。</p>
  </Drawer>
</Row>`;

  const sizeSource = `<script lang="ts">
  import { Button, Drawer, Row } from "goose-ui";

  let open = $state(false);
<\/script>

<Row>
  <Button onclick={() => (open = true)}>宽抽屉 (600px)</Button>
  <Drawer bind:open title="宽抽屉" width={600} maskClosable>
    <p>通过 width 属性设置宽度为 600px。</p>
    <p>传数字按 px 处理，也可以传 CSS 字符串如 "80vw"。</p>
  </Drawer>
</Row>`;

  const maskSource = `<script lang="ts">
  import { Button, Drawer, Row } from "goose-ui";

  let open = $state(false);
<\/script>

<Row>
  <Button onclick={() => (open = true)}>遮罩不可关闭</Button>
  <Drawer bind:open title="遮罩不可关闭" maskClosable={false}>
    <p>设置 maskClosable=false，点击遮罩不会关闭。</p>
    <p>只能通过右上角 X 按钮或按 Esc 关闭。</p>
  </Drawer>
</Row>`;

  const pushBackgroundSource = `<script lang="ts">
  import { Button, Drawer, Row } from "goose-ui";

  let open = $state(false);
<\/script>

<Row>
  <Button onclick={() => (open = true)}>关闭景深</Button>
  <Drawer bind:open title="关闭景深" maskClosable pushBackground={false}>
    <p>景深默认启用；显式传 pushBackground=false 后，背景不会产生缩放和模糊景深效果。</p>
    <p>点击遮罩仍然可以关闭。</p>
  </Drawer>
</Row>`;

  const depthSource = `<script lang="ts">
  import { Button, Drawer } from "goose-ui";

  let open = $state(false);
<\/script>

<Button onclick={() => (open = true)}>强景深</Button>

<Drawer bind:open title="景深档位" pushScale={0.97} pushBlur={6} maskClosable>
  <p>pushScale: 背景缩放比例，1 = 不缩；pushBlur: 模糊半径，0 = 只缩不糊。</p>
</Drawer>`;

  const coverageSource = `<script lang="ts">
  import { Button, Drawer } from "goose-ui";

  let open = $state(false);
  let host = $state<HTMLElement>();
<\/script>

<!-- 只覆盖 host：标题栏、侧栏都在 host 之外，不受遮罩影响。
     container 必须是定位元素（position: relative / absolute / fixed） -->
<div class="content" style="position: relative; min-height: 240px" bind:this={host}>
  <Button onclick={() => (open = true)}>打开抽屉</Button>

  <Drawer bind:open container={host} title="只覆盖内容区" placement="left" width={240}>
    <p>遮罩和抽屉都被限制在 container 内。</p>
  </Drawer>
</div>

<!-- 不传 container：portal 到 body + position: fixed，覆盖整个视口 -->`;

  const resizeSource = `<script lang="ts">
  import { Button, Drawer } from "goose-ui";

  let open = $state(false);
<\/script>

<Button onclick={() => (open = true)}>打开可调高度抽屉</Button>

<Drawer
  bind:open
  title="拖动调整高度"
  placement="bottom"
  height="30%"
  resizable
  snapPoints={[30, 60, 80, 100]}
>
  <p>拖动顶部把手改变高度，松手吸附到 30% / 60% / 80% / 100%；拖到底部松手会关闭。</p>
</Drawer>`;

  const navListSource = `<script lang="ts">
  import { Button, Collapsible, Drawer } from "goose-ui";

  const groups = [
    {
      title: "操作",
      items: [
        { value: "windows", label: "进程列表" },
        { value: "favorites", label: "收藏" },
      ],
    },
    {
      title: "配置",
      items: [
        { value: "settings", label: "设置" },
        { value: "about", label: "关于" },
      ],
    },
  ];

  let open = $state(false);
  let active = $state("windows");
  let expanded = $state<Record<string, boolean>>({ "操作": true, "配置": true });
<\/script>

<Button onclick={() => (open = true)}>打开导航抽屉</Button>

<Drawer bind:open title="导航" placement="left" width={260}>
  <div style="display:flex;flex-direction:column;gap:6px">
    {#each groups as group (group.title)}
      <Collapsible
        open={expanded[group.title]}
        onchange={(v) => (expanded[group.title] = v)}
      >
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

  const footerSource = `<script lang="ts">
  import { Button, Drawer, Row } from "goose-ui";

  let open = $state(false);
<\/script>

<Row>
  <Button onclick={() => (open = true)}>自定义底部</Button>
  <Drawer bind:open title="自定义 Footer" maskClosable footer={customFooter}>
    <p>通过 footer 插槽自定义底部区域。</p>
  </Drawer>
</Row>

{#snippet customFooter()}
  <Button variant="ghost" onclick={() => (open = false)}>取消</Button>
  <Button variant="primary" onclick={() => (open = false)}>确定</Button>
{/snippet}`;
</script>

<Page toc title="抽屉 Drawer" description="侧边/上下抽屉组件，支持四种方向、遮罩关闭、背景下沉">
  <CodePreview anchor="方向" anchorLevel={2} title="四个方向 placement" code={placementSource}>
    <Row>
      <Button variant="primary" onclick={() => (rightOpen = true)}>右侧抽屉 (默认)</Button>
      <Button onclick={() => (leftOpen = true)}>左侧</Button>
      <Button onclick={() => (topOpen = true)}>顶部</Button>
      <Button onclick={() => (bottomOpen = true)}>底部</Button>

      <Drawer bind:open={rightOpen} title="右侧抽屉" maskClosable>
        <p>这是从右侧滑出的抽屉内容。</p>
        <p class="muted">默认宽度 378px，点击遮罩或按 Esc 可关闭。</p>
      </Drawer>
      <Drawer bind:open={leftOpen} title="左侧抽屉" placement="left" maskClosable>
        <p>从左侧滑出的抽屉，点击遮罩关闭。</p>
      </Drawer>
      <Drawer bind:open={topOpen} title="顶部抽屉" placement="top" height={200} maskClosable>
        <p>从顶部滑出的抽屉，高度 200px，点击遮罩关闭。</p>
      </Drawer>
      <Drawer bind:open={bottomOpen} title="底部抽屉" placement="bottom" height={200} maskClosable>
        <p>从底部滑出的抽屉，高度 200px，点击遮罩关闭。</p>
      </Drawer>
    </Row>
  </CodePreview>

  <CodePreview anchor="coverage" anchorLevel={2} title="覆盖范围 container" code={coverageSource}>
    <div class="scope-frame">
      <div class="scope-titlebar">
        <span>TitleBar 标题栏</span>
        <span class="scope-badge">不覆盖</span>
      </div>
      <div class="scope-body">
        <div class="scope-side">
          <span>Sidebar</span>
          <span class="scope-badge">不覆盖</span>
        </div>
        <div class="scope-content" bind:this={scopeHost}>
          <p class="scope-label">内容区 = container（这里才会被覆盖）</p>
          <Button variant="primary" size="small" onclick={() => (scopeOpen = true)}>
            打开抽屉
          </Button>
          <Drawer
            bind:open={scopeOpen}
            container={scopeHost}
            title="只覆盖内容区"
            placement="left"
            width={240}
          >
            <p>遮罩和抽屉都被限制在 <code>container</code> 内。</p>
            <p>标题栏、侧栏不在容器里，所以不会被覆盖。</p>
          </Drawer>
        </div>
      </div>
    </div>
    <Row>
      <Button onclick={() => (fullOpen = true)}>对比：不传 container（覆盖整个窗口）</Button>
      <Drawer bind:open={fullOpen} title="覆盖整个窗口" placement="right" width={300}>
        <p>默认 portal 到 body + position: fixed，整个视口都会被遮罩。</p>
      </Drawer>
    </Row>
    <p class="muted">
      container 传哪个元素，遮罩和抽屉就只覆盖哪个元素；容器需要
      <code>position: relative / absolute / fixed</code>。想让标题栏不被覆盖，就把
      container 设成标题栏下方的内容区。
    </p>
  </CodePreview>

  <CodePreview anchor="nav-list-in-drawer" anchorLevel={2} title="抽屉里的分组列表 Grouped nav list in Drawer" code={navListSource}>
    <Row>
      <Button variant="primary" onclick={() => (navOpen = true)}>打开导航抽屉</Button>
      <Drawer bind:open={navOpen} title="导航" placement="left" width={260}>
        <div style="display:flex;flex-direction:column;gap:6px">
          {#each navGroups as group (group.title)}
            <Collapsible
              open={navExpanded[group.title]}
              onchange={(v) => (navExpanded[group.title] = v)}
            >
              {#snippet trigger()}
                <span>{group.title}</span>
              {/snippet}
              <div style="display:flex;flex-direction:column;gap:2px">
                {#each group.items as item (item.value)}
                  <Button
                    variant={navTab === item.value ? "default" : "ghost"}
                    style="justify-content:flex-start"
                    onclick={() => {
                      navTab = item.value;
                      navOpen = false;
                    }}
                  >{item.label}</Button>
                {/each}
              </div>
            </Collapsible>
          {/each}
        </div>
      </Drawer>
    </Row>
    <p class="muted">抽屉里不放 Sidebar，只用 Collapsible 做分组折叠；点任意项后抽屉自动关闭，当前项：{navTab}</p>
  </CodePreview>

  <CodePreview anchor="内容与尺寸" anchorLevel={2} title="自定义宽度 / 高度" code={sizeSource}>
    <Row>
      <Button onclick={() => (wideOpen = true)}>宽抽屉 (600px)</Button>
      <Drawer bind:open={wideOpen} title="宽抽屉" width={600} maskClosable>
        <p>通过 <code>width</code> 属性设置宽度为 600px。</p>
        <p>传数字按 px 处理，也可以传 CSS 字符串如 "80vw"。</p>
      </Drawer>
    </Row>
  </CodePreview>

  <CodePreview anchor="resizable" anchorLevel={2} title="拖动调整高度 resizable" code={resizeSource}>
    <Row>
      <Button variant="primary" onclick={() => (resizeOpen = true)}>打开可调高度抽屉</Button>
      <Drawer
        bind:open={resizeOpen}
        title="拖动调整高度"
        placement="bottom"
        height="30%"
        resizable
        snapPoints={[30, 60, 80, 100]}
      >
        <p>拖动顶部把手改变高度，松手吸附到 30% / 60% / 80% / 100%；拖到底部松手会关闭。</p>
        <p class="muted">
          <code>resizable</code> 开启拖动；<code>snapPoints</code> 是松手后吸附的百分比档位
          （按抽屉轴向）。拖过最小档位的一半（这里是 15%）松手即关闭；把手获得焦点后也可用方向键换档。
        </p>
      </Drawer>
    </Row>
  </CodePreview>

  <CodePreview anchor="no-mask-close" anchorLevel={3} title="点击遮罩不关闭" code={maskSource}>
    <Row>
      <Button onclick={() => (noMaskOpen = true)}>遮罩不可关闭</Button>
      <Drawer bind:open={noMaskOpen} title="遮罩不可关闭" maskClosable={false}>
        <p>设置 <code>maskClosable=false</code>，点击遮罩不会关闭。</p>
        <p>只能通过右上角 X 按钮或按 Esc 关闭。</p>
      </Drawer>
    </Row>
  </CodePreview>

  <CodePreview anchor="push-background" anchorLevel={3} title="关闭景深" code={pushBackgroundSource}>
    <Row>
      <Button onclick={() => (noPushOpen = true)}>关闭景深</Button>
      <Drawer bind:open={noPushOpen} title="关闭景深" maskClosable pushBackground={false}>
        <p>景深默认启用；显式传 <code>pushBackground=false</code> 后，背景不会产生缩放和模糊景深效果。</p>
        <p>点击遮罩仍然可以关闭。</p>
      </Drawer>
    </Row>
  </CodePreview>

  <CodePreview anchor="depth" anchorLevel={3} title="调整景深强度" code={depthSource}>
    <Row>
      <Button onclick={() => (depthOpen = true)}>强景深</Button>
      <Drawer bind:open={depthOpen} title="景深档位" maskClosable pushScale={0.97} pushBlur={6}>
        <p>
          景深由 <code>pushScale</code>（缩放比例，1 = 不缩）和 <code>pushBlur</code>（模糊半径）
          两档组成，与 <code>pushBackground</code> 一起决定「后退」的力度。
        </p>
        <p>
          默认 <code>0.94 / 1</code> 是给窄侧栏抽屉调的：缩得多、糊得轻。铺满大半屏的面板反过来用
          <code>0.97 / 6</code>——缩得少、糊得重，才不会在四周露出一圈页面底色。
        </p>
      </Drawer>
    </Row>
  </CodePreview>

  <CodePreview anchor="footer" anchorLevel={3} title="自定义 Footer" code={footerSource}>
    <Row>
      <Button onclick={() => (customFooterOpen = true)}>自定义底部</Button>
      <Drawer bind:open={customFooterOpen} title="自定义 Footer" maskClosable footer={customFooter}>
        <p>通过 <code>footer</code> 插槽自定义底部区域。</p>
        <p>点击遮罩仍然可以关闭。</p>
      </Drawer>
    </Row>
  </CodePreview>
  <Card title="Props">
    <PropsTable anchor="props" items={drawerProps} />
  </Card>
</Page>

{#snippet customFooter()}
  <Button variant="ghost" onclick={() => (customFooterOpen = false)}>取消</Button>
  <Button variant="primary" onclick={() => (customFooterOpen = false)}>确定</Button>
{/snippet}

<style>
  p {
    margin: 0 0 10px;
    line-height: 1.6;
    color: var(--text);
  }
  p:last-child {
    margin-bottom: 0;
  }
  .muted {
    color: var(--text-muted);
    font-size: 13px;
  }
  .scope-frame {
    width: min(72vw, 720px);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .scope-titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
    font-size: 12px;
  }
  .scope-body {
    display: flex;
    min-height: 240px;
  }
  .scope-side {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 120px;
    padding: 12px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    font-size: 12px;
    color: var(--text-muted);
  }
  .scope-content {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: var(--bg);
  }
  .scope-label {
    margin: 0;
    font-size: 12px;
    color: var(--text-muted);
  }
  .scope-badge {
    padding: 1px 6px;
    border-radius: 999px;
    background: var(--surface-3);
    color: var(--text-muted);
    font-size: 11px;
  }
  code {
    background: var(--surface-2);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--primary);
  }
</style>

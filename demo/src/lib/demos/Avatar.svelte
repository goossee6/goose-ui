<script lang="ts">
  import {Card, Page, Avatar, AspectRatio, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const avatarProps: PropsTableItem[] = [
    { name: "src", desc: "头像图片地址", type: "string", default: "''" },
    { name: "alt", desc: "图片 alt / 无障碍名", type: "string", default: "''" },
    { name: "name", desc: "无图时生成首字母缩写", type: "string", default: "''" },
    { name: "size", desc: "尺寸档或自定义 px", type: "'small' | 'middle' | 'large' | number", default: "'middle'" },
    { name: "shape", desc: "形状", type: "'circle' | 'square'", default: "'circle'" },
    { name: "status", desc: "右下角状态点", type: "'online' | 'offline' | 'busy' | 'away'", default: "—" },
    { name: "children", desc: "自定义内容（snippet）", type: "Snippet", default: "—" },
  ];

  const ratioProps: PropsTableItem[] = [
    { name: "ratio", desc: "宽高比，同 CSS aspect-ratio", type: "string | number", default: "'16 / 9'" },
    { name: "children", desc: "内容（图片/视频自动填满）", type: "Snippet", default: "—" },
  ];
</script>

<Page title="Avatar 头像 / AspectRatio 比例框" description="头像展示与固定宽高比容器">
  <Card title="头像 Avatar">
    <div style="display:flex;flex-direction:column;gap:16px">
      <Row>
        <Avatar size="small" name="Goose UI" />
        <Avatar name="Goose UI" />
        <Avatar size="large" name="Goose UI" />
        <Avatar size={64} shape="square" name="Goose UI" />
      </Row>
      <Row>
        <Avatar src="https://api.dicebear.com/9.x/thumbs/svg?seed=goose1" alt="goose" />
        <Avatar name="Misaka" status="online" />
        <Avatar name="Kuroko" status="busy" />
        <Avatar name="Index" status="away" />
        <Avatar name="Touma" status="offline" />
      </Row>
      <Row>
        <Avatar style="background:var(--primary-soft);color:var(--primary)"><span style="font-size:14px">自定义</span></Avatar>
      </Row>
    </div>
  </Card>

  <Card title="比例框 AspectRatio">
    <Row>
      <div style="width:220px">
        <AspectRatio ratio="16 / 9">
          <div class="ratio-fill">16 : 9</div>
        </AspectRatio>
      </div>
      <div style="width:160px">
        <AspectRatio ratio={1}>
          <div class="ratio-fill">1 : 1</div>
        </AspectRatio>
      </div>
      <div style="width:220px">
        <AspectRatio ratio="4 / 3">
          <div class="ratio-fill">4 : 3</div>
        </AspectRatio>
      </div>
    </Row>
  </Card>

  <Card title="Props — Avatar">
    <PropsTable items={avatarProps} />
  </Card>
  <Card title="Props — AspectRatio">
    <PropsTable items={ratioProps} />
  </Card>
</Page>

<style>
  .ratio-fill {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-2);
    color: var(--text-muted);
    font-size: 13px;
    border-radius: var(--radius-md);
  }
</style>

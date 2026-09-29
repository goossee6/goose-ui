<script lang="ts">
  import {Button, Card, Page, Tooltip, Row} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const tooltipProps: PropsTableItem[] = [
    { name: "title", desc: "提示内容（必填）", type: "string | Snippet" },
    { name: "children", desc: "触发元素（必填）", type: "Snippet" },
    { name: "placement", desc: "出现方向", type: "'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end'", default: "'top'" },
    { name: "trigger", desc: "触发方式", type: "'hover' | 'focus' | 'click'", default: "'hover'" },
    { name: "maxWidth", desc: "最大宽度", type: "number | string" },
  ];
</script>

<Page title="Tooltip 气泡提示" description="悬浮提示信息，支持 12 方向、三种触发方式、自动翻转" >
  <Card title="基础用法">
    <Row>
      <Tooltip title="这是一条提示信息">
        <Button>Hover 我</Button>
      </Tooltip>
    </Row>
  </Card>

  <Card title="12 个方向 Placement">
    <div class="placement-ring">
      <div class="ring-row">
        <Tooltip title="top-start" placement="top-start"><Button size="small">top-start</Button></Tooltip>
        <Tooltip title="top" placement="top"><Button size="small">top</Button></Tooltip>
        <Tooltip title="top-end" placement="top-end"><Button size="small">top-end</Button></Tooltip>
      </div>
      <div class="ring-row">
        <Tooltip title={"这是左侧提示\n第二行内容\n第三行内容"} placement="left-start"><Button size="small">left-start</Button></Tooltip>
        <div class="ring-center">center</div>
        <Tooltip title={"这是右侧提示\n第二行内容\n第三行内容"} placement="right-start"><Button size="small">right-start</Button></Tooltip>
      </div>
      <div class="ring-row">
        <Tooltip title={"这是左侧提示\n第二行内容\n第三行内容"} placement="left"><Button size="small">left</Button></Tooltip>
        <div class="ring-center"></div>
        <Tooltip title={"这是右侧提示\n第二行内容\n第三行内容"} placement="right"><Button size="small">right</Button></Tooltip>
      </div>
      <div class="ring-row">
        <Tooltip title={"这是左侧提示\n第二行内容\n第三行内容"} placement="left-end"><Button size="small">left-end</Button></Tooltip>
        <div class="ring-center"></div>
        <Tooltip title={"这是右侧提示\n第二行内容\n第三行内容"} placement="right-end"><Button size="small">right-end</Button></Tooltip>
      </div>
      <div class="ring-row">
        <Tooltip title="bottom-start" placement="bottom-start"><Button size="small">bottom-start</Button></Tooltip>
        <Tooltip title="bottom" placement="bottom"><Button size="small">bottom</Button></Tooltip>
        <Tooltip title="bottom-end" placement="bottom-end"><Button size="small">bottom-end</Button></Tooltip>
      </div>
    </div>
  </Card>

  <Card title="触发方式 Trigger">
    <Row>
      <Tooltip title="Hover 悬浮触发（默认）" trigger="hover">
        <Button>Hover</Button>
      </Tooltip>
      <Tooltip title="Click 点击触发" trigger="click">
        <Button>Click</Button>
      </Tooltip>
      <Tooltip title="Focus 聚焦触发" trigger="focus">
        <input class="focus-input" placeholder="点击聚焦" />
      </Tooltip>
    </Row>
  </Card>

  <Card title="多行内容">
    <Row>
      <Tooltip title={"第一行\n第二行\n第三行"}>
        <Button>多行文本</Button>
      </Tooltip>
    </Row>
  </Card>

  <Card title="长文本自动换行">
    <Row>
      <Tooltip title="这是一段很长的提示文本，当内容超过最大宽度时会自动换行显示，适合用于需要详细说明的场景。" maxWidth={240}>
        <Button>长文本 (240px)</Button>
      </Tooltip>
      <Tooltip title="限制更窄的最大宽度，文本会更早触发换行，用于空间紧凑的场景。" maxWidth={160}>
        <Button>窄文本 (160px)</Button>
      </Tooltip>
    </Row>
  </Card>
  <Card title="Props">
    <PropsTable items={tooltipProps} />
  </Card>
</Page>

<style>
  .placement-ring {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 0;
  }
  .ring-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ring-center {
    width: 80px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--border);
    border-radius: var(--radius-md);
    font-size: 11px;
    color: var(--text-muted);
    user-select: none;
  }
  .focus-input {
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 13px;
    outline: none;
  }
  .focus-input:focus {
    border-color: var(--primary);
  }
</style>

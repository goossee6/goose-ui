<script lang="ts">
  import {Card, Page, Countdown, Row, Button, Notification} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const props: PropsTableItem[] = [
    { name: "duration", desc: "倒计时长（ms），target 缺省时生效", type: "number", default: "0" },
    { name: "target", desc: "目标时间戳（ms），优先生效", type: "number", default: "0" },
    { name: "showDays", desc: "超过 1 天时拆出 DD 段", type: "boolean", default: "true" },
    { name: "separator", desc: "分隔符", type: "string", default: "':'" },
    { name: "autostart", desc: "挂载即开始", type: "boolean", default: "true" },
    { name: "paused", desc: "暂停状态（双向绑定）", type: "boolean", default: "false" },
    { name: "onfinish", desc: "归零回调", type: "() => void", default: "—" },
    { name: "onchange", desc: "剩余时间变化回调", type: "(remaining: number) => void", default: "—" },
  ];

  let paused = $state(false);
  const target = Date.now() + 1000 * 60 * 60 * 26;
</script>

<Page title="Countdown 倒计时" description="duration / target 双模式，可暂停，归零回调">
  <Card title="固定时长 + 暂停控制">
    <Row>
      <Countdown duration={1000 * 60 * 5 + 32000} bind:paused />
      <Button size="small" variant={paused ? "primary" : "default"} onclick={() => (paused = !paused)}>
        {paused ? "继续" : "暂停"}
      </Button>
    </Row>
    <p class="note">5 分 32 秒起始；paused 为双向绑定 prop。</p>
  </Card>

  <Card title="目标时间（26 小时后）">
    <Countdown {target} onfinish={() => Notification.info("倒计时结束：target 已到点")} />
    <p class="note">超过一天自动拆出「DD」段；归零时触发 onfinish。</p>
  </Card>

  <Card title="自定义分隔 / 不显示天">
    <Row>
      <Countdown duration={1000 * 60 * 60 * 30} separator="-" />
      <Countdown duration={1000 * 60 * 60 * 30} showDays={false} />
    </Row>
  </Card>

  <Card title="Props">
    <PropsTable items={props} />
  </Card>
</Page>

<style>
  .note { font-size: 12px; color: var(--text-muted); margin: var(--sp-sm) 0 0; }
</style>

<script lang="ts">
  import {Card, Page, Form, FormItem, Input, Button, RadioGroup, Notification} from "goose-ui";
  import PropsTable, { type PropsTableItem } from "../PropsTable.svelte";

  const formProps: PropsTableItem[] = [
    { name: "layout", desc: "排列方向（label 与控件）", type: "'horizontal' | 'vertical'", default: "'vertical'" },
    { name: "labelWidth", desc: "horizontal 模式 label 宽度", type: "string", default: "'96px'" },
    { name: "disabled", desc: "整表禁用（经 context 下发）", type: "boolean", default: "false" },
    { name: "onsubmit", desc: "提交回调（已 preventDefault）", type: "(e: SubmitEvent) => void", default: "—" },
  ];

  const itemProps: PropsTableItem[] = [
    { name: "label", desc: "标签文案", type: "string", default: "''" },
    { name: "required", desc: "必填星号", type: "boolean", default: "false" },
    { name: "error", desc: "错误文案（红字 + has-error 样式）", type: "string", default: "''" },
    { name: "hint", desc: "帮助文案（无 error 时显示）", type: "string", default: "''" },
    { name: "htmlFor", desc: "label 的 for 属性", type: "string", default: "''" },
  ];

  let name = $state("");
  let role = $state("dev");
  let email = $state("");
  let errors = $state<Record<string, string>>({});

  const roleOptions = [
    { value: "dev", label: "开发" },
    { value: "design", label: "设计" },
    { value: "pm", label: "产品" },
  ];

  function submit() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "姓名不能为空";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = "邮箱格式不正确";
    errors = next;
    if (Object.keys(next).length === 0) {
      const roleLabel = roleOptions.find((o) => o.value === role)?.label ?? role;
      Notification.success(`提交成功：${name}（${roleLabel}）`);
    }
  }
</script>

<Page title="Form 表单" description="Form 提供布局 context，FormItem 消费 label/必填/错误状态">
  <Card title="横向布局 + 校验">
    <Form layout="horizontal" labelWidth="80px" onsubmit={submit}>
      <FormItem label="姓名" required error={errors.name} htmlFor="f-name">
        <Input id="f-name" bind:value={name} placeholder="请输入姓名" />
      </FormItem>
      <FormItem label="邮箱" required error={errors.email} htmlFor="f-email">
        <Input id="f-email" bind:value={email} placeholder="you@example.com" />
      </FormItem>
      <FormItem label="角色" hint="通过 context 读取 Form 的 layout/disabled">
        <RadioGroup options={roleOptions} bind:value={role} />
      </FormItem>
      <FormItem label="">
        <Button type="submit" variant="primary">提交</Button>
      </FormItem>
    </Form>
  </Card>

  <Card title="纵向布局">
    <Form>
      <FormItem label="项目名称" required>
        <Input placeholder="纵向布局（默认）" />
      </FormItem>
      <FormItem label="备注" hint="hint 在无 error 时显示">
        <Input placeholder="选填" />
      </FormItem>
      <FormItem label="用户名" error="该用户名已被占用">
        <Input value="goossee" />
      </FormItem>
    </Form>
  </Card>

  <Card title="Props — Form">
    <PropsTable items={formProps} />
  </Card>
  <Card title="Props — FormItem">
    <PropsTable items={itemProps} />
  </Card>
</Page>

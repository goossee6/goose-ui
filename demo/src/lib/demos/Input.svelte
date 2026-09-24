<script lang="ts">
  import { Card, Input, PresetInput, PageHeader, Notification } from 'goose-ui';
  import { Search, User, Mail, Lock } from '@lucide/svelte';

  let text = $state('');
  let email = $state('');
  let amount = $state('');
  let search = $state('');
  let preset = $state('');
  let multiline = $state('');

  let prevPreset = $state(preset);
  $effect(() => { if (preset !== prevPreset) { prevPreset = preset; if (preset) Notification.success(`已选择「${preset}」`); } });
</script>

<PageHeader title="输入框 Input" description="普通输入、前后缀图标、清空按钮、错误/警告状态、预设输入" />

<div class="demo-grid">
  <Card title="状态 Status">
    <div class="demo-row">
      <div class="demo-col">
        <Input name="error" placeholder="错误状态" status="error" />
      </div>
      <div class="demo-col">
        <Input name="warning" placeholder="警告状态" status="warning" />
      </div>
    </div>
  </Card>

  <Card title="图标 Icons">
    <div class="demo-row">
      <div class="demo-col">
        <Input name="prefix-icon" placeholder="前缀图标" prefix={Search} />
      </div>
      <div class="demo-col">
        <Input name="suffix-icon" placeholder="后缀图标" suffix={Mail} />
      </div>
      <div class="demo-col">
        <Input name="both-icon" placeholder="前缀 + 后缀" prefix={User} suffix={Lock} />
      </div>
      <div class="demo-col">
        <Input name="icon-clear" placeholder="图标 + 清空" prefix={Search} />
      </div>
    </div>
  </Card>

  <Card title="清空 Clearable">
    <div class="demo-row">
      <div class="demo-col">
        <Input name="search" placeholder="可清空（默认）" bind:value={search} />
      </div>
      <div class="demo-col">
        <Input name="no-clear" placeholder="禁用清空" clearable={false} />
      </div>
    </div>
  </Card>

  <Card title="禁用 Disabled">
    <div class="demo-row">
      <div class="demo-col">
        <Input name="disabled" placeholder="禁用状态" disabled value="不能编辑" />
      </div>
    </div>
  </Card>

  <Card title="只读 Readonly">
    <div class="demo-row">
      <div class="demo-col">
        <Input name="readonly" placeholder="只读状态" readonly value="只读值" />
      </div>
    </div>
  </Card>

  <Card title="纯数字 digitsOnly">
    <div class="demo-row">
      <div class="demo-col">
        <Input name="digits" placeholder="只能输入数字" digitsOnly bind:value={amount} />
      </div>
      <span class="demo-val">值: "{amount}"</span>
    </div>
  </Card>

  <Card title="回车事件 onenter">
    <div class="demo-row">
      <div class="demo-col">
        <Input name="enter-submit" placeholder="输入后按回车" onenter={() => Notification.success(`回车提交: ${text}`)} bind:value={text} />
      </div>
    </div>
  </Card>

  <Card title="预设输入 PresetInput">
    <div class="demo-col" style="max-width:360px">
      <PresetInput
        name="preset"
        placeholder="选择预设或手动输入"
        presets={['选项一', '选项二', '选项三']}
        bind:value={preset}
      />
      <span class="demo-val">值: "{preset}"</span>
    </div>
  </Card>

  <Card title="预设输入（多行）">
    <div class="demo-col" style="max-width:360px">
      <PresetInput
        name="multiline"
        placeholder="多行文本，rows >= 2 时渲染为 textarea"
        rows={4}
        bind:value={multiline}
      />
      <span class="demo-val">值: "{multiline}"</span>
    </div>
  </Card>
</div>

<style>
  .demo-grid { display: flex; flex-direction: column; gap: var(--gap-2xl); }
  .demo-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: var(--gap-xl);
  }
  .demo-col { width: 260px; display: flex; flex-direction: column; gap: 8px; }
  .demo-val { font-size: 13px; color: var(--text-muted); padding-top: 10px; }
</style>

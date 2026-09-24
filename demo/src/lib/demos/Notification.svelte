<script lang="ts">
  import { Card, Button, PageHeader, Notification } from 'goose-ui';
  import Star from '@lucide/svelte/icons/star';
  import Heart from '@lucide/svelte/icons/heart';
  import Bookmark from '@lucide/svelte/icons/bookmark';
  import Zap from '@lucide/svelte/icons/zap';

  let keyDemoCount = $state(0);
</script>

<PageHeader title="通知 Notification" description="4 种类型、6 个位置、标题+描述、操作按钮、进度条、悬停暂停" />

<div class="demo-grid">
  <Card title="标题 + 描述">
    <div class="demo-row">
      <Button variant="primary" onclick={() => Notification.success({ title: '操作成功', description: '你的数据已保存到服务器，可以在列表中查看。' })}>带描述 Success</Button>
      <Button onclick={() => Notification.info({ title: '系统通知', description: '系统将于今晚 22:00 进行维护，预计持续 30 分钟。' })}>带描述 Info</Button>
      <Button variant="danger" onclick={() => Notification.warning({ title: '磁盘空间不足', description: '当前剩余空间不足 1GB，请及时清理。' })}>带描述 Warning</Button>
      <Button variant="danger" onclick={() => Notification.error({ title: '连接失败', description: '无法连接到服务器，请检查网络后重试。错误码: ERR_NETWORK_TIMEOUT' })}>带描述 Error</Button>
    </div>
  </Card>

  <Card title="类型 Types">
    <div class="demo-row">
      <Button variant="primary" onclick={() => Notification.success('操作成功！')}>Success</Button>
      <Button onclick={() => Notification.info('这是一条消息')}>Info</Button>
      <Button variant="danger" onclick={() => Notification.warning('请注意！')}>Warning</Button>
      <Button variant="danger" onclick={() => Notification.error('操作失败！')}>Error</Button>
    </div>
  </Card>

  <Card title="位置 Positions">
    <div class="demo-row">
      <Button onclick={() => Notification.success({ title: '左上通知', position: 'top-left' })}>左上</Button>
      <Button onclick={() => Notification.success({ title: '顶部居中', position: 'top' })}>顶部居中</Button>
      <Button onclick={() => Notification.success({ title: '右上通知', position: 'top-right' })}>右上</Button>
    </div>
    <div class="demo-row" style="margin-top:8px">
      <Button onclick={() => Notification.success({ title: '左下通知', position: 'bottom-left' })}>左下</Button>
      <Button onclick={() => Notification.success({ title: '底部居中', position: 'bottom' })}>底部居中</Button>
      <Button onclick={() => Notification.success({ title: '右下通知', position: 'bottom-right' })}>右下</Button>
    </div>
  </Card>

  <Card title="自定义 Duration">
    <div class="demo-row">
      <Button onclick={() => Notification.info({ title: '3 秒后关闭',showProgress: true, duration: 3000 })}>3 秒</Button>
      <Button onclick={() => Notification.info({ title: '10 秒后关闭',showProgress: true, duration: 10000 })}>10 秒</Button>
      <Button onclick={() => Notification.warning({ title: '不会自动关闭', description: '点击 X 关闭', duration: 0 })}>不自动关闭</Button>
    </div>
  </Card>

  <Card title="自定义图标 icon">
    <div class="demo-row">
      <Button onclick={() => Notification.success({ title: '收藏成功', icon: Star })}>Star 图标</Button>
      <Button onclick={() => Notification.info({ title: '已添加到书签', icon: Bookmark })}>Bookmark 图标</Button>
      <Button onclick={() => Notification.warning({ title: '小心操作', icon: Zap })}>Zap 图标</Button>
      <Button onclick={() => Notification.error({ title: '取消成功', icon: Heart })}>Heart 图标</Button>
    </div>
  </Card>

  <Card title="按 key 更新/关闭">
    <div class="demo-row">
      <Button
        variant="primary"
        onclick={() => {
          keyDemoCount++;
          Notification.success({
            key: 'key-demo',
            title: `更新 #${keyDemoCount}`,
            description: `这是第 ${keyDemoCount} 次调用，同 key 会更新而非新增`,
          });
        }}
      >
        同 key 更新通知
      </Button>
      <Button variant="ghost" onclick={() => Notification.destroy('key-demo')}>按 key 关闭</Button>
    </div>
  </Card>

  <Card title="点击回调 onClick">
    <div class="demo-row">
      <Button onclick={() => Notification.info({ title: '点击这条通知', onClick: () => Notification.success('通知被点击了！') })}>点击通知触发回调</Button>
    </div>
  </Card>

  <Card title="关闭回调 onClose">
    <div class="demo-row">
      <Button onclick={() => Notification.info({ title: '关闭后触发回调', duration: 3000, onClose: () => Notification.success('通知已关闭！') })}>关闭时触发回调</Button>
    </div>
  </Card>

  <Card title="自定义关闭图标 closeIcon">
    <div class="demo-row">
      <Button onclick={() => Notification.info({ title: 'Bookmark 关闭图标', closeIcon: Bookmark, duration: 0 })}>Bookmark 关闭</Button>
      <Button onclick={() => Notification.warning({ title: 'Heart 关闭图标', closeIcon: Heart, duration: 0 })}>Heart 关闭</Button>
    </div>
  </Card>

  <Card title="悬停暂停 pauseOnHover">
    <div class="demo-row">
      <Button onclick={() => Notification.info({ title: '悬停暂停计时', description: '鼠标悬停时暂停自动关闭，移开后继续倒计时', duration: 8000, showProgress: true, pauseOnHover: true })}>悬停暂停（默认开启）</Button>
      <Button onclick={() => Notification.warning({ title: '悬停不暂停', description: '即使悬停也会自动关闭', duration: 8000, showProgress: true, pauseOnHover: false })}>悬停不暂停</Button>
    </div>
  </Card>

  <Card title="进度条 showProgress">
    <div class="demo-row">
      <Button onclick={() => Notification.success({ title: '带进度条', description: '底部显示自动关闭进度', duration: 6000, showProgress: true })}>Success + 进度条</Button>
      <Button onclick={() => Notification.info({ title: '带进度条', description: '底部显示自动关闭进度', duration: 6000, showProgress: true })}>Info + 进度条</Button>
      <Button onclick={() => Notification.warning({ title: '带进度条', description: '底部显示自动关闭进度', duration: 6000, showProgress: true })}>Warning + 进度条</Button>
      <Button onclick={() => Notification.error({ title: '带进度条', description: '底部显示自动关闭进度', duration: 6000, showProgress: true })}>Error + 进度条</Button>
    </div>
  </Card>

  <Card title="连续弹出">
    <div class="demo-row">
      <Button
        variant="primary"
        onclick={() => {
          for (let i = 1; i <= 5; i++) {
            setTimeout(() => Notification.success(`第 ${i} 条消息`), i * 200);
          }
        }}
      >
        连续弹出 5 条
      </Button>
      <Button variant="ghost" onclick={() => Notification.destroyAll()}>清除全部</Button>
    </div>
  </Card>

</div>

<style>
  .demo-grid { display: flex; flex-direction: column; gap: var(--gap-2xl); }
  .demo-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--gap-md);
  }
  .hint { font-size: 12px; color: var(--text-muted); margin: 8px 0 0; }
</style>

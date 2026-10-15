# CodePreview 迁移规范（供批量执行参考，务必逐条遵守）

## 目标
把每个 demo 里的「组件用法」`<Card title="...">` 改成 `<CodePreview title="..." code={xxxSource}>`，
让每张卡都能 效果/源码 切换并一键复制。

## 必须遵守
1. **只改用法卡**：`<Card title="Props">`、`<Card title="...Props">`、`<Card title="...参数">`、
   `<Card title="...API">` 一律**保持 `<Card>` 不动**。
2. **`<Page>` 不动**，仍是每页最外层。
3. **源码是「复制即用」的最小可用片段**，规则：
   - 第一行必须是 `import { 用到的组件 } from "goose-ui";`（组件名从该卡的预览里真实出现的使用推断）
   - 如果该卡还用到 `$state` 等 rune，`<script>` 里带上
   - **不要**带 demo 自用的 class（如 `.demo-text`、`.panel`）、不要带 demo 的 `<style>` 块
   - 内联样式若只是 demo 排版噪声（如 `display:flex;flex-direction:column;gap:16px` 只为堆叠多个示例），
     可精简；若样式是组件用法的一部分（如给竖向 Separator 的父容器加高度）则保留并说明
   - 用语义化内容替换 demo 的占位文案（如「上一段内容」可保留，因为可读性好）
4. **模板字符串转义**：源码字符串用反引号包裹，内部的 `</script>` 必须写成 `<\/script>`。
5. **每个常量名以 `Source` 结尾**，用该卡语义命名：`basicSource`、`sizeSource`、`disabledSource` 等。
   同一文件内不可重名。
6. **保持原有的预览内容完全不变**（只把外层 `<Card>` 换成 `<CodePreview>` 并加 `code`）。
7. 文件顶部 import 加：`import CodePreview from "../CodePreview.svelte";`
8. 原来 import 里的 `Card`：**只有当该文件已无任何 `<Card>` 用法时才可移除**，否则保留。
9. 缩进与引号风格沿用该文件原有风格（多数 demo 用 2 空格 + 双引号）。

## CodePreview 用法
```svelte
<CodePreview title="基础用法" code={basicSource}>
  ...原 Card 里的预览内容，原样保留...
</CodePreview>
```
可选 `language`（默认 svelte）；一般不用传。

## 参考实现（已完成，照此风格）
demo/src/lib/demos/Separator.svelte

## 完成后自检
- 该文件里 `Card` 与 `CodePreview` 的 import 都存在且被用到
- 每个 `code={xxx}` 引用的常量都已在 `<script>` 里定义
- 模板字符串里的 `</script>` 都是 `<\/script>`

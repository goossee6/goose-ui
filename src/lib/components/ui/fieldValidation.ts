/**
 * 输入校验：控件在失焦时调用 `checkField`，返回非空文案即视为不合法，
 * 由控件负责把值回滚到本次编辑前的值并标红。
 *
 * 校验函数返回 `true` / `null` / `undefined` 表示合法，返回字符串作为错误文案，
 * 返回 `false` 用默认文案。抛错按「校验失败」处理：一个写错的规则不该让整个输入框失去响应。
 */
export type FieldValidator = (value: string) => string | boolean | null | void;

export function checkField(validator: FieldValidator | undefined, value: string): string | null {
	if (!validator) return null;
	try {
		const r = validator(value);
		if (r === false) return '格式不正确';
		if (r === null || r === undefined || r === true || r === '') return null;
		return r;
	} catch {
		return '校验失败';
	}
}

/**
 * goose-ui 版本号 —— 唯一来源。
 *
 * 升版本只改这里这一个字符串，然后同步 package.json（pnpm test 会校验两者一致，
 * 不一致直接失败）。语义化版本：主.次.修订。
 */
export const VERSION = "0.3.0";

/**
 * 「用户是否要求减少动效」的唯一判断点。
 *
 * 原先这段 `matchMedia` 在菜单过渡、Button、Tooltip、通知、PillTrack 里各写了一份，
 * 其中 Button 还因为漏了 `.matches` 让整段动画恒不生效过。凡是「JS 驱动的动画要不要关」
 * 一律走这里，别在组件里重新 query 一遍。
 */
export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

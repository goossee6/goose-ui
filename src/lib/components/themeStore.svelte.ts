export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'goose-ui-theme';

let initialized = false;

export const themeStore = $state<{ theme: Theme }>({ theme: 'light' });

function readSaved(): Theme | null {
	if (typeof window === 'undefined') return null;
	try {
		const v = window.localStorage.getItem(STORAGE_KEY);
		return v === 'dark' || v === 'light' ? v : null;
	} catch {
		return null;
	}
}

/** 幂等：读取持久化偏好/系统偏好并应用到 <html>，SSR 下安全空操作；启动后继续跟随系统（仅用户未手动设置时） */
export function initTheme(): void {
	if (initialized || typeof window === 'undefined') return;
	initialized = true;
	const initial =
		readSaved() ??
		(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
	themeStore.theme = initial;
	document.documentElement.classList.toggle('dark', initial === 'dark');
	// 跟随系统主题变化：用户手动设置过（存储非空）则不再覆盖
	const mq = window.matchMedia('(prefers-color-scheme: dark)');
	mq.addEventListener('change', () => {
		if (readSaved()) return;
		const t = mq.matches ? 'dark' : 'light';
		themeStore.theme = t;
		document.documentElement.classList.toggle('dark', t === 'dark');
	});
}

/** 显式设置主题：同步所有实例 + 持久化 */
export function setTheme(theme: Theme): void {
	initTheme();
	themeStore.theme = theme;
	if (typeof window === 'undefined') return;
	document.documentElement.classList.toggle('dark', theme === 'dark');
	try {
		window.localStorage.setItem(STORAGE_KEY, theme);
	} catch {
		/* localStorage 不可用时仅内存生效 */
	}
}

/**
 * 切换主题。传入 pos 时使用圆形扩散 View Transition。
 * 返回切换后的主题（状态在 transition 回调内落地，此返回值为预期结果）。
 */
export function toggleTheme(pos?: { x: number; y: number }): Theme {
	initTheme();
	const next: Theme = themeStore.theme === 'light' ? 'dark' : 'light';
	const run = () => setTheme(next);

	if (!pos || typeof document === 'undefined' || !document.startViewTransition) {
		run();
		return next;
	}

	const { x, y } = pos;
	const radius = Math.hypot(
		Math.max(x, window.innerWidth - x),
		Math.max(y, window.innerHeight - y)
	);
	const root = document.documentElement;
	root.style.setProperty('--tv-x', `${x}px`);
	root.style.setProperty('--tv-y', `${y}px`);
	root.style.setProperty('--tv-r', `${radius}px`);
	document.startViewTransition(run);
	return next;
}

/**
 * 主题切换按钮的 onThemeToggle 回调：以按钮中心为圆心做圆形扩散。
 * 直接作 TitleBar/ThemeToggle 的 onThemeToggle 传入即可。
 */
export function toggleThemeFromEvent(e: MouseEvent): Theme {
	const btn = e.currentTarget as HTMLElement | null;
	const rect = btn?.getBoundingClientRect();
	return toggleTheme(
		rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined
	);
}

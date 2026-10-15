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
	// 主题色相与亮暗主题一起恢复（initHues 自身幂等）
	initHues();
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

/* ────────────────────────────────────────────────────────────────────────────
 * 主题色（色相旋钮）
 *
 * 只暴露「色相」一个自由度，明度/彩度由 theme.css 按亮暗主题派生，
 * 因此不可能配出对比度崩掉的主题。色相写入 <html> 内联 style，
 * 优先级高于 :root 规则，天然全局生效（含所有组件与 portal 出去的浮层）。
 * ──────────────────────────────────────────────────────────────────────────── */

/** 可配置的色彩角色 */
export type HueRole =
	| 'accent'
	| 'complement'
	| 'danger'
	| 'success'
	| 'warning'
	| 'info';

export type HueMap = Record<HueRole, number>;

/** 默认色相（与 theme.css 中 :root 的初始值一致） */
export const DEFAULT_HUES: HueMap = {
	accent: 264,
	complement: 160,
	danger: 25,
	success: 145,
	warning: 75,
	info: 250,
};

export const HUE_ROLES: HueRole[] = ['accent', 'complement', 'danger', 'success', 'warning', 'info'];

const HUE_STORAGE_KEY = 'goose-ui-hues';

/** 当前各角色色相（响应式，设置页可双向绑定） */
export const hueStore = $state<{ hues: HueMap }>({ hues: { ...DEFAULT_HUES } });

let huesInitialized = false;

/** 规范化：任意数值折到 [0,360) */
function normHue(h: number): number {
	if (!Number.isFinite(h)) return 0;
	return ((Math.round(h) % 360) + 360) % 360;
}

function applyHues(): void {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	for (const role of HUE_ROLES) {
		root.style.setProperty(`--hue-${role}`, String(hueStore.hues[role]));
	}
}

function saveHues(): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(HUE_STORAGE_KEY, JSON.stringify(hueStore.hues));
	} catch {
		/* localStorage 不可用时仅内存生效 */
	}
}

function readSavedHues(): Partial<HueMap> | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = window.localStorage.getItem(HUE_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		const out: Partial<HueMap> = {};
		for (const role of HUE_ROLES) {
			const v = parsed[role];
			if (typeof v === 'number' && Number.isFinite(v)) out[role] = normHue(v);
		}
		return out;
	} catch {
		return null;
	}
}

/** 幂等：读取持久化色相并应用；initTheme() 会一并调用 */
export function initHues(): void {
	if (huesInitialized) return;
	huesInitialized = true;
	const saved = readSavedHues();
	if (saved) hueStore.hues = { ...DEFAULT_HUES, ...saved };
	applyHues();
}

/** 读取当前色相副本 */
export function getHues(): HueMap {
	return { ...hueStore.hues };
}

/** 设置单个角色色相并持久化 */
export function setHue(role: HueRole, hue: number): void {
	if (!HUE_ROLES.includes(role)) return;
	initHues();
	hueStore.hues = { ...hueStore.hues, [role]: normHue(hue) };
	applyHues();
	saveHues();
}

/** 批量设置色相并持久化 */
export function setHues(next: Partial<HueMap>): void {
	initHues();
	const merged = { ...hueStore.hues };
	for (const role of HUE_ROLES) {
		const v = next[role];
		if (typeof v === 'number' && Number.isFinite(v)) merged[role] = normHue(v);
	}
	hueStore.hues = merged;
	applyHues();
	saveHues();
}

/** 恢复默认色相并清除持久化记录 */
export function resetHues(): void {
	initHues();
	hueStore.hues = { ...DEFAULT_HUES };
	applyHues();
	if (typeof window !== 'undefined') {
		try {
			window.localStorage.removeItem(HUE_STORAGE_KEY);
		} catch {
			/* 忽略 */
		}
	}
}


export function formatNum(n: number): string {
	if (!Number.isFinite(n)) return '0';
	// 负数按绝对值分档后再补回符号，否则 -1500 原样输出、与 1500 → 1.5K 不一致
	const sign = n < 0 ? '-' : '';
	const abs = Math.abs(n);
	if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
	if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
	return String(n);
}

export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes === 0) return '0 B';
	const sign = bytes < 0 ? '-' : '';
	const abs = Math.abs(bytes);
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	// abs < 1 时 log 为负、floor 得到 -1（sizes[-1] === undefined → "NaN undefined"），此处夹到 0
	const i = Math.max(0, Math.min(Math.floor(Math.log(abs) / Math.log(k)), sizes.length - 1));
	return `${sign}${parseFloat((abs / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../src/lib/version.ts';

// 版本号唯一来源是 src/lib/version.ts；此测试保证 package.json 不会漂移，
// 升版本时只改 version.ts，忘了同步 package.json 这里会红。
test('package.json 版本与 VERSION 一致', () => {
	const pkg = JSON.parse(
		readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
	);
	assert.equal(pkg.version, VERSION);
});

test('VERSION 符合语义化版本格式', () => {
	assert.match(VERSION, /^\d+\.\d+\.\d+$/);
});

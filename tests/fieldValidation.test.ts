import test from 'node:test';
import assert from 'node:assert/strict';
import { checkField } from '../src/lib/components/ui/fieldValidation.ts';

test('未提供校验函数时一律合法', () => {
	assert.equal(checkField(undefined, '任意值'), null);
});

test('true / null / undefined / 空串视为合法', () => {
	assert.equal(checkField(() => true, 'x'), null);
	assert.equal(checkField(() => null, 'x'), null);
	assert.equal(checkField(() => undefined, 'x'), null);
	assert.equal(checkField(() => '', 'x'), null);
});

test('返回字符串即为错误文案', () => {
	assert.equal(checkField(() => '邮箱格式不正确', 'x'), '邮箱格式不正确');
});

test('返回 false 用默认文案', () => {
	assert.equal(checkField(() => false, 'x'), '格式不正确');
});

test('校验函数抛错按不合法处理', () => {
	assert.equal(
		checkField(() => {
			throw new Error('boom');
		}, 'x'),
		'校验失败'
	);
});

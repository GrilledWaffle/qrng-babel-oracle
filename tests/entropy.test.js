import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entropy, info, bitBalance } from '../src/lib/entropy.js';
import { xorBits } from '../src/lib/bits.js';
import { deriveBabelAddress, babelUrl } from '../src/lib/babel-address.js';

test('uniform binary has entropy 1', () => {
  const xs = '0101010101010101';
  assert.ok(Math.abs(entropy(xs) - 1) < 1e-9);
});

test('all-same has entropy 0', () => {
  assert.equal(entropy('aaaaaaa'), 0);
});

test('uniform 4-symbol distribution has entropy 2', () => {
  const xs = 'abcdabcdabcd';
  assert.ok(Math.abs(entropy(xs) - 2) < 1e-9);
});

test('info(0.5) = 1 bit', () => {
  assert.equal(info(0.5), 1);
});

test('XOR with self is zero', () => {
  const a = '10101100';
  assert.equal(xorBits(a, a), '00000000');
});

test('bit balance of perfectly even string is 0', () => {
  assert.equal(bitBalance('0101'), 0);
});

test('babel address fields are in legal ranges', () => {
  // Use a deterministic bit pattern long enough for the full address.
  const bits = '10110001'.repeat(64);
  const a = deriveBabelAddress(bits);
  assert.ok(a.wall >= 1 && a.wall <= 4);
  assert.ok(a.shelf >= 1 && a.shelf <= 5);
  assert.ok(a.volume >= 1 && a.volume <= 32);
  assert.ok(a.page >= 1 && a.page <= 410);
  assert.match(babelUrl(a), /^https:\/\/libraryofbabel\.info\/book\.cgi\?[0-9a-f]+-w\d-s\d-v\d{2}:\d+$/);
});

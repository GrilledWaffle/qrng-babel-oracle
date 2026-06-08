import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entropy, info, bitBalance } from '../src/lib/entropy.js';
import { xorBits, bitsToAlphabet, bytesToBitString } from '../src/lib/bits.js';
import { deriveBabelAddress, babelUrl } from '../src/lib/babel-address.js';
import { BABEL_ALPHABET } from '../src/lib/babel-alphabet.js';

test('uniform binary has entropy 1', () => {
  assert.ok(Math.abs(entropy('0101010101010101') - 1) < 1e-9);
});

test('all-same has entropy 0', () => {
  assert.equal(entropy('aaaaaaa'), 0);
});

test('uniform 4-symbol distribution has entropy 2', () => {
  assert.ok(Math.abs(entropy('abcdabcdabcd') - 2) < 1e-9);
});

test('info(0.5) = 1 bit', () => {
  assert.equal(info(0.5), 1);
});

test('XOR with self is zero', () => {
  assert.equal(xorBits('10101100', '10101100'), '00000000');
});

test('XOR is involutive: (A xor Q) xor Q == A', () => {
  const a = '11001010';
  const q = '01101001';
  assert.equal(xorBits(xorBits(a, q), q), a);
});

test('bit balance of perfectly even string is 0', () => {
  assert.equal(bitBalance('0101'), 0);
});

test('babel address fields are in legal ranges', () => {
  const bits = '10110001'.repeat(64);
  const a = deriveBabelAddress(bits);
  assert.ok(a.wall >= 1 && a.wall <= 4);
  assert.ok(a.shelf >= 1 && a.shelf <= 5);
  assert.ok(a.volume >= 1 && a.volume <= 32);
  assert.ok(a.page >= 1 && a.page <= 410);
  assert.match(babelUrl(a), /^https:\/\/libraryofbabel\.info\/book\.cgi\?[0-9a-f]+-w\d-s\d-v\d{2}:\d+$/);
});

test('babel address page can reach values above 256 (no modulo bias)', () => {
  // Drive with uniform random bytes; over many trials we must see page > 256.
  let sawHighPage = false;
  for (let i = 0; i < 200 && !sawHighPage; i++) {
    const bytes = new Uint8Array(64);
    for (let j = 0; j < bytes.length; j++) bytes[j] = Math.floor(Math.random() * 256);
    const bits = bytesToBitString(bytes);
    const a = deriveBabelAddress(bits);
    if (a.page > 256) sawHighPage = true;
  }
  assert.ok(sawHighPage, 'page field must reach 257..410');
});

test('bitsToAlphabet rejection sampling yields ~uniform distribution', () => {
  // Build a long uniform bit stream and verify each Babel symbol appears at
  // roughly the same frequency (within 1% absolute of 1/29 over 100k symbols).
  const TARGET = 100_000;
  const counts = new Map();
  let symbols = '';
  const buf = new Uint8Array(8192);
  while (symbols.length < TARGET) {
    for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
    symbols += bitsToAlphabet(bytesToBitString(buf), BABEL_ALPHABET);
  }
  symbols = symbols.slice(0, TARGET);
  for (const c of symbols) counts.set(c, (counts.get(c) || 0) + 1);
  const expected = TARGET / BABEL_ALPHABET.length;
  for (const ch of BABEL_ALPHABET) {
    const c = counts.get(ch) || 0;
    const dev = Math.abs(c - expected) / expected;
    assert.ok(dev < 0.05, `${JSON.stringify(ch)} count=${c} expected≈${expected} dev=${dev.toFixed(3)}`);
  }
});

test('bitsToAlphabet drops rejected bytes (output shorter than input bytes)', () => {
  // 256 / 29 = 8.83, cutoff = 232. About 24/256 = 9.4% of bytes are dropped.
  // For a 10000-byte uniform stream, expect ~9060 symbols ±2%.
  const buf = new Uint8Array(10000);
  for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
  const out = bitsToAlphabet(bytesToBitString(buf), BABEL_ALPHABET);
  assert.ok(out.length > 8800 && out.length < 9300, `got ${out.length}`);
});

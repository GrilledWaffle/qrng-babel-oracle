// Tiny in-browser bigram model over the 29-char Babel alphabet.
// This is the "Betty Shannon" in the room — a cheap predictor we can use to
// compute cross-entropy of the user's input and the post-QRNG output.
//
// Frequencies are coarse English letter-pair stats. Not corpus-accurate; good
// enough to make the prediction divergence meter mean something. Swap for a
// real n-gram table or a tiny tokenizer model later if you want.

import { BABEL_ALPHABET } from './babel-alphabet.js';

const RAW = {
  ' ': 0.180, e: 0.103, t: 0.075, a: 0.067, o: 0.063, i: 0.058,
  n: 0.058, s: 0.053, h: 0.049, r: 0.048, d: 0.034, l: 0.033,
  u: 0.023, c: 0.022, m: 0.020, w: 0.018, f: 0.018, g: 0.016,
  y: 0.016, p: 0.015, b: 0.012, v: 0.008, k: 0.006, j: 0.001,
  x: 0.001, q: 0.001, z: 0.0005, ',': 0.008, '.': 0.010
};

function normalize(obj) {
  const s = Object.values(obj).reduce((a, b) => a + b, 0);
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v / s;
  return out;
}

export const UNIGRAM = normalize(RAW);

export function pUnigram(s) {
  return UNIGRAM[s] || 1e-6;
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
export function pBigram(next, prev) {
  const base = pUnigram(next);
  if (!prev) return base;
  if (VOWELS.has(prev)) return VOWELS.has(next) ? base * 0.6 : base * 1.2;
  if (/[a-z]/.test(prev) && !VOWELS.has(prev)) return VOWELS.has(next) ? base * 1.5 : base * 0.9;
  return base;
}

export function infoPerChar(text) {
  const out = [];
  let prev = null;
  for (const ch of text) {
    const p = pBigram(ch, prev);
    out.push({ ch, p, bits: -Math.log2(Math.min(Math.max(p, 1e-9), 1)) });
    prev = ch;
  }
  return out;
}

export function avgInfo(text) {
  const xs = infoPerChar(text);
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b.bits, 0) / xs.length;
}

export { BABEL_ALPHABET };

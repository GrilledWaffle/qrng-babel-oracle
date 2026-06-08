// Bit-level utilities. Everything is big-endian-within-a-byte for legibility
// (most-significant bit of each byte appears first in the string).

/** Uint8Array -> string of '0'/'1', MSB first. */
export function bytesToBitString(bytes) {
  let out = '';
  for (const b of bytes) out += b.toString(2).padStart(8, '0');
  return out;
}

/** UTF-8 encode a string -> Uint8Array. */
export function strToBytes(s) {
  return new TextEncoder().encode(s);
}

/** XOR two bit strings; result length = min(a,b). */
export function xorBits(a, b) {
  const n = Math.min(a.length, b.length);
  let out = '';
  for (let i = 0; i < n; i++) out += (a[i] === b[i] ? '0' : '1');
  return out;
}

/** Bit string -> Uint8Array (truncates to whole bytes). */
export function bitStringToBytes(bits) {
  const n = Math.floor(bits.length / 8);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return out;
}

/**
 * Map a bit stream to a sequence of symbols in `alphabet`, using rejection
 * sampling so the output is provably uniform when the input is uniform.
 *
 * Why rejection sampling matters: with alphabet size N=29, doing `byte % 29`
 * is biased because 256 is not a multiple of 29. Symbols 0..23 appear 9
 * times in 0..255 while symbols 24..28 appear only 8 times. So the naive
 * mapping skews ~12% in favor of early letters even from perfect QRNG.
 *
 * The fix: discard any byte >= floor(256 / N) * N. This costs us ~9% of
 * our input bits but guarantees a uniform output distribution.
 */
export function bitsToAlphabet(bits, alphabet) {
  const N = alphabet.length;
  const cutoff = Math.floor(256 / N) * N;   // largest multiple of N <= 256
  let out = '';
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const byte = parseInt(bits.slice(i, i + 8), 2);
    if (byte < cutoff) out += alphabet[byte % N];
    // else: skip — keeps the output uniform over the alphabet
  }
  return out;
}

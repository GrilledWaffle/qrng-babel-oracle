// Bit-level utilities. Everything is little-endian-within-a-byte for legibility.

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

/** Convert bit string to an arbitrary alphabet using base conversion in chunks. */
export function bitsToAlphabet(bits, alphabet) {
  const base = alphabet.length;
  // Chunk size: how many bits we consume to emit one symbol.
  // log2(29) ~= 4.858 — use 8 bits then take mod base to stay simple & reversible-ish.
  let out = '';
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    const byte = parseInt(bits.slice(i, i + 8), 2);
    out += alphabet[byte % base];
  }
  return out;
}

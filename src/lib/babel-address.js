// Library of Babel address mapping.
//
// The site addresses each page as:
//   <hex room id>-w<wall 1-4>-s<shelf 1-5>-v<volume 1-32>:<page 1-410>
//
// We derive a deterministic address from a bit stream so the user can click
// through and see the literal page corresponding to their fused signal.
//
// Bias note: for fields whose range is NOT a power of two (shelf=5, page=410),
// naive `bits % range` is biased. We use rejection sampling to keep the
// projection mathematically uniform when the input bits are uniform.

import { bitStringToBytes } from './bits.js';

const ROOM_HEX_BITS = 256;        // 64 hex chars

function bytesToHex(bytes) {
  let h = '';
  for (const b of bytes) h += b.toString(16).padStart(2, '0');
  return h;
}

/**
 * Pull a uniform integer in [0, range) from `bits` starting at `cursor`,
 * using rejection sampling over `width`-bit windows. Returns:
 *   { value, cursor }  with cursor advanced past whatever was consumed.
 *
 * `width` is chosen as the smallest k with 2^k >= range so we have at
 * least 50% acceptance per draw.
 */
function uniformFromBits(bits, cursor, range) {
  if ((range & (range - 1)) === 0) {
    // Power of two: clean mod, no rejection needed.
    const width = Math.log2(range);
    const slice = bits.slice(cursor, cursor + width);
    return { value: parseInt(slice, 2), cursor: cursor + width };
  }
  let width = 1;
  while ((1 << width) < range) width++;
  const cutoff = Math.floor((1 << width) / range) * range;
  while (cursor + width <= bits.length) {
    const v = parseInt(bits.slice(cursor, cursor + width), 2);
    cursor += width;
    if (v < cutoff) return { value: v % range, cursor };
  }
  // Ran out of bits — fall back to last-window mod (rare; only on tiny inputs).
  const v = parseInt(bits.slice(cursor - width, cursor), 2);
  return { value: v % range, cursor };
}

export function deriveBabelAddress(fusedBits) {
  let bits = fusedBits;
  // Guarantee enough material. 256 (room) + ~5 * 12 (fields w/ rejection slack).
  const minBits = ROOM_HEX_BITS + 80;
  if (bits.length < minBits) {
    while (bits.length < minBits) bits += bits;
  }

  const roomBits = bits.slice(0, ROOM_HEX_BITS);
  const room = bytesToHex(bitStringToBytes(roomBits));

  let cursor = ROOM_HEX_BITS;
  let r;

  r = uniformFromBits(bits, cursor, 4);   cursor = r.cursor; const wall   = r.value + 1;
  r = uniformFromBits(bits, cursor, 5);   cursor = r.cursor; const shelf  = r.value + 1;
  r = uniformFromBits(bits, cursor, 32);  cursor = r.cursor; const volume = r.value + 1;
  r = uniformFromBits(bits, cursor, 410); cursor = r.cursor; const page   = r.value + 1;

  return { room, wall, shelf, volume, page };
}

export function babelUrl({ room, wall, shelf, volume, page }) {
  const id = `${room}-w${wall}-s${shelf}-v${volume.toString().padStart(2, '0')}`;
  return `https://libraryofbabel.info/book.cgi?${id}:${page}`;
}

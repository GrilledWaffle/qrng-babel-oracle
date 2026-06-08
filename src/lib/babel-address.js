// Library of Babel address mapping.
//
// The site addresses each page as:
//   <hex room id>-w<wall 1-4>-s<shelf 1-5>-v<volume 1-32>:<page 1-410>
// We derive a *deterministic* address from a bit stream so the user can
// click through and see the literal page corresponding to their fused
// quantum+input signal.

import { bitStringToBytes } from './bits.js';

const ROOM_HEX_BITS = 256;        // 64 hex chars
const FIELD_BITS = 8;

function bytesToHex(bytes) {
  let h = '';
  for (const b of bytes) h += b.toString(16).padStart(2, '0');
  return h;
}

export function deriveBabelAddress(fusedBits) {
  let bits = fusedBits;
  if (bits.length < ROOM_HEX_BITS + 4 * FIELD_BITS) {
    while (bits.length < ROOM_HEX_BITS + 4 * FIELD_BITS) bits += bits;
  }
  const roomBits = bits.slice(0, ROOM_HEX_BITS);
  const room = bytesToHex(bitStringToBytes(roomBits));

  let cursor = ROOM_HEX_BITS;
  const take = () => {
    const b = bits.slice(cursor, cursor + FIELD_BITS);
    cursor += FIELD_BITS;
    return parseInt(b, 2);
  };

  const wall   = (take() % 4) + 1;
  const shelf  = (take() % 5) + 1;
  const volume = (take() % 32) + 1;
  const page   = (take() % 410) + 1;

  return { room, wall, shelf, volume, page };
}

export function babelUrl({ room, wall, shelf, volume, page }) {
  const id = `${room}-w${wall}-s${shelf}-v${volume.toString().padStart(2, '0')}`;
  return `https://libraryofbabel.info/book.cgi?${id}:${page}`;
}

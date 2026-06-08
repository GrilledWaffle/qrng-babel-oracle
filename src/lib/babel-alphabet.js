// The Library of Babel uses a 29-symbol alphabet:
//   a-z (26 letters), space, comma, period.
// Every page is exactly 3200 characters drawn from this set.
// Source: https://libraryofbabel.info/theory1.html

export const BABEL_ALPHABET = 'abcdefghijklmnopqrstuvwxyz ,.';
export const BABEL_BASE = BABEL_ALPHABET.length;        // 29
export const BABEL_PAGE_LENGTH = 3200;

/** Map any char to a Babel-legal char, lowercasing letters and dropping others. */
export function toBabelChar(ch) {
  const c = ch.toLowerCase();
  if (BABEL_ALPHABET.includes(c)) return c;
  // Coerce digits to lowercase-letter neighborhood so QRNG output stays legible.
  if (/[0-9]/.test(c)) return BABEL_ALPHABET[c.charCodeAt(0) % BABEL_BASE];
  return ' ';
}

/** Sanitize an arbitrary string into Babel-legal text. */
export function toBabelText(s) {
  return Array.from(s).map(toBabelChar).join('');
}

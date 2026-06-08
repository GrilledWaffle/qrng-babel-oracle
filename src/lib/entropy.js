// Shannon information / entropy primitives.
// All values are in bits. log2(0) is treated as 0 contribution.
//
// See 3Blue1Brown's framing:
//   info(p) = -log2(p)           bits, the "surprise" of an event of probability p
//   H(P)    = -Σ p_i log2(p_i)   expected bits per symbol under distribution P
//   H(P,Q)  = -Σ p_i log2(q_i)   cross-entropy: bits/symbol if we coded P with codes for Q
// Cross-entropy is the loss LLMs minimize. If Q == P, it equals H(P).

const EPS = 1e-12;

/** Information content of a single event of probability p. */
export function info(p) {
  if (p <= 0) return Infinity;
  return -Math.log2(p);
}

/** Empirical Shannon entropy of an iterable of symbols (bits/symbol). */
export function entropy(symbols) {
  const counts = new Map();
  let n = 0;
  for (const s of symbols) {
    counts.set(s, (counts.get(s) || 0) + 1);
    n++;
  }
  if (n === 0) return 0;
  let h = 0;
  for (const c of counts.values()) {
    const p = c / n;
    h -= p * Math.log2(p);
  }
  return h;
}

/** Cross-entropy of empirical distribution of `symbols` against model probs `q(s)`. */
export function crossEntropy(symbols, qFn) {
  let h = 0, n = 0;
  for (const s of symbols) {
    const q = Math.max(qFn(s), EPS);
    h -= Math.log2(q);
    n++;
  }
  return n === 0 ? 0 : h / n;
}

/** Bit-balance: |frac of 1s - 0.5|. Lower = closer to ideal incompressible noise. */
export function bitBalance(bitString) {
  if (!bitString.length) return 0;
  let ones = 0;
  for (const c of bitString) if (c === '1') ones++;
  return Math.abs(ones / bitString.length - 0.5);
}

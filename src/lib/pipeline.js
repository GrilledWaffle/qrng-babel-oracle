// The full fusion pipeline. Pure functions over byte/bit data.
//
// Step 1. Encode user input as UTF-8 bytes -> bit string A.
// Step 2. Fetch QRNG bytes of equal length -> bit string Q.
// Step 3. Fused bits F = A XOR Q.
//         (XOR is mathematically clean: F has the *joint* surprise.
//          If A is highly predictable and Q is maximally entropic,
//          F inherits Q's entropy. Where A is itself random, F shows
//          only the *delta* between the two streams.)
// Step 4. Map F to Babel-alphabet text by chunking bytes mod 29.
// Step 5. Derive a Babel hex address from F.
// Step 6. Score: empirical entropy of F, bigram cross-entropy of A,
//         bigram cross-entropy of decoded output. The interesting
//         number is (H_output - H_input): how much "predictability"
//         the quantum stream dissolved.

import { strToBytes, bytesToBitString, xorBits, bitsToAlphabet } from './bits.js';
import { fetchQRNGBytes } from './qrng.js';
import { BABEL_ALPHABET, toBabelText } from './babel-alphabet.js';
import { entropy, bitBalance } from './entropy.js';
import { avgInfo } from './bigram-model.js';
import { deriveBabelAddress, babelUrl } from './babel-address.js';

export async function runOracle({ question, apiKey, minBytes = 64 }) {
  const inputBytes = strToBytes(question);
  // Pad input to at least minBytes so we always have enough material for a
  // full Babel address. Padding bytes are zeros — they don't add bias because
  // the XOR with QRNG will randomize them anyway.
  const padded = new Uint8Array(Math.max(inputBytes.length, minBytes));
  padded.set(inputBytes);

  const { bytes: qBytes, source, fallbackReason } = await fetchQRNGBytes(padded.length, apiKey);

  const inputBits = bytesToBitString(padded);
  const qBits     = bytesToBitString(qBytes);
  const fusedBits = xorBits(inputBits, qBits);

  // Surface signal: decode all three to Babel-alphabet text for side-by-side view.
  const inputText  = toBabelText(question);
  const qText      = bitsToAlphabet(qBits, BABEL_ALPHABET);
  const outputText = bitsToAlphabet(fusedBits, BABEL_ALPHABET);

  // Measurements
  const measurements = {
    source,
    fallbackReason: fallbackReason || null,
    bytesUsed: padded.length,
    // Per-bit balance: how close each stream is to ideal incompressible noise.
    inputBitBalance: bitBalance(inputBits),
    qBitBalance:     bitBalance(qBits),
    fusedBitBalance: bitBalance(fusedBits),
    // Empirical character entropies (bits/char) of each stream as Babel text.
    inputCharEntropy:  entropy(inputText),
    qCharEntropy:      entropy(qText),
    outputCharEntropy: entropy(outputText),
    // Cross-entropy against the toy bigram predictor.
    // High = the predictor was surprised; low = the predictor expected it.
    // Input is usually low; quantum/output should be ~log2(29) ≈ 4.86.
    inputBigramBits:  avgInfo(inputText),
    qBigramBits:      avgInfo(qText),
    outputBigramBits: avgInfo(outputText)
  };

  const address = deriveBabelAddress(fusedBits);
  const url = babelUrl(address);

  return {
    inputBits, qBits, fusedBits,
    inputText, qText, outputText,
    address, url,
    measurements
  };
}

// The full fusion pipeline. Pure functions over byte/bit data.
//
// Step 1. Encode user input as UTF-8 bytes -> bit string A.
// Step 2. Fetch QRNG bytes of equal length -> bit string Q.
// Step 3. Fused bits F = A XOR Q.
//         XOR is invertible and entropy-preserving when Q is independent
//         of A: H(F) >= max(H(A), H(Q)). If Q is maxent, F is maxent.
//         Where A was already random, F shows the delta between the two.
// Step 4. Map F to Babel-alphabet text by uniform rejection sampling
//         (so the output distribution is provably flat — see bits.js).
// Step 5. Derive a Babel hex address from F.
// Step 6. Measure each stream three ways:
//         - bit balance:  |frac(1s) - 0.5|, lower = closer to uniform
//         - naive char H: empirical Shannon entropy of the babel-mapped text
//                         (finite-sample, ignores context; meaningful only
//                          for long streams)
//         - bigram H(P,Q):cross-entropy of the text against our toy bigram
//                         predictor. Low = the predictor was right.
//                         High = the predictor was surprised.
//                         For maxent text this ~= log2(29) - log_model_skew.

import { strToBytes, bytesToBitString, xorBits } from './bits.js';
import { fetchQRNGBytes } from './qrng.js';
import { BABEL_ALPHABET, toBabelText } from './babel-alphabet.js';
import { bitsToAlphabet } from './bits.js';
import { entropy, bitBalance } from './entropy.js';
import { avgInfo } from './bigram-model.js';
import { deriveBabelAddress, babelUrl } from './babel-address.js';

export async function runOracle({ question, apiKey, minBytes = 64 }) {
  const inputBytesRaw = strToBytes(question);

  // Pad with zeros so we always have at least minBytes for a full address.
  // The XOR with QRNG randomizes the padding region anyway, so the FUSED
  // stream stays uniform. But we measure input metrics on the unpadded
  // bytes so the meters honestly reflect what the user typed.
  const padded = new Uint8Array(Math.max(inputBytesRaw.length, minBytes));
  padded.set(inputBytesRaw);

  const { bytes: qBytes, source, fallbackReason } = await fetchQRNGBytes(padded.length, apiKey);

  const inputBitsRaw = bytesToBitString(inputBytesRaw);   // unpadded, for honest metrics
  const inputBits    = bytesToBitString(padded);          // padded, for XOR
  const qBits        = bytesToBitString(qBytes);
  const fusedBits    = xorBits(inputBits, qBits);

  // Visible side-by-side text views.
  const inputText  = toBabelText(question);
  const qText      = bitsToAlphabet(qBits, BABEL_ALPHABET);
  const outputText = bitsToAlphabet(fusedBits, BABEL_ALPHABET);

  const measurements = {
    source,
    fallbackReason: fallbackReason || null,
    bytesUsed: padded.length,
    inputBytesRaw: inputBytesRaw.length,

    // Bit-balance: distance from 50/50. Lower = closer to ideal noise.
    inputBitBalance: bitBalance(inputBitsRaw),    // measured on real input
    qBitBalance:     bitBalance(qBits),
    fusedBitBalance: bitBalance(fusedBits),

    // Naive empirical char entropy of the babel-mapped text.
    // Beware: for short text this is a finite-sample artifact (=log2(unique chars)).
    inputCharEntropy:  entropy(inputText),
    qCharEntropy:      entropy(qText),
    outputCharEntropy: entropy(outputText),

    // Cross-entropy H(text, bigram_model), in bits/char.
    // For uniform text over 29 symbols, lower-bounded by ~log2(29) = 4.858
    // minus the bigram model's own skew.
    inputBigramBits:  avgInfo(inputText),
    qBigramBits:      avgInfo(qText),
    outputBigramBits: avgInfo(outputText)
  };

  const address = deriveBabelAddress(fusedBits);
  const url = babelUrl(address);

  return {
    inputBits: inputBitsRaw,   // surface the honest one in the UI
    qBits,
    fusedBits,
    inputText, qText, outputText,
    address, url,
    measurements
  };
}

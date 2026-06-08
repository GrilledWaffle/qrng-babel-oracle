# Method

## Goal
Build a browser-only instrument that lets a user fuse a typed question with
**live quantum entropy** from the ANU QRNG, measure both streams against an
explicit predictor, and project the fused signal onto the **Library of Babel**
as a clickable hex address.

## Information-theory backbone

This follows the framing in the 3Blue1Brown compression/entropy trilogy:

- **Information of an event**: `I(p) = -log₂(p)` — the "surprise" of an event
  of probability `p`, in bits.
- **Shannon entropy**: `H(P) = -Σ p_i log₂(p_i)` — expected bits/symbol under
  distribution `P`. Lower bound on average compressed size.
- **Cross-entropy**: `H(P, Q) = -Σ p_i log₂(q_i)` — bits/symbol you'd spend
  encoding samples from `P` using codes optimized for `Q`. This is the loss
  LLMs minimize.

Two empirical facts drive the design:

1. **Quantum noise is maximally entropic.** A well-calibrated QRNG produces
   bits whose distribution is indistinguishable from `Bernoulli(0.5)` and
   whose joint entropy is `n` bits for `n` bits drawn. Compression can't help.
2. **Natural language is highly predictable.** Shannon estimated ~1 bit/char
   for English with ≥100 characters of context, against a per-character
   alphabet limit of ~5 bits.

The **difference** between those two — i.e., the *predictability* of the
input minus the rawness of the QRNG output — is the substrate the app is
built to make visible.

## Pipeline

```
question (string)
  ├─► UTF-8 bytes ────► input bit stream A
  ├─► [predict]   ────► bigram surprise per char (bits)
  │
ANU QRNG (uint8) ────► quantum bit stream Q   (or crypto fallback)
  ├─► [predict]   ────► bigram surprise per char (≈ log₂(29) ≈ 4.86)

  F = A XOR Q   (joint surprise; if Q is maxent, F is maxent)

F ──► output bytes ──► output Babel-alphabet text
F ──► first 256 bits ──► hex room id
       next 4 × 8 bits  ──► wall, shelf, volume, page
       └► Library of Babel URL
```

XOR is the cleanest fusion for this question because it's invertible
(`A = F XOR Q`) and entropy-preserving: `H(A ⊕ Q) ≥ max(H(A), H(Q))` when
`Q` is independent of `A`. With a true QRNG, `Q` is independent of *anything*,
so the output inherits the QRNG's entropy floor.

## Measurements surfaced in the UI

| Meter                  | Meaning                                                 |
| ---------------------- | ------------------------------------------------------- |
| input bit-bias         | `|frac(1s) − 0.5|` of the input bit stream              |
| qrng  bit-bias         | same, for the quantum bits — should be very near 0      |
| fused bit-bias         | same, after XOR                                         |
| input/qrng/output H    | empirical char entropy in the Babel alphabet (bits/char)|
| input bigram surprise  | avg `-log₂ p(c\|prev)` under the included bigram model   |
| qrng bigram surprise   | should be ≈ `log₂(29) ≈ 4.86`                           |
| Δ predictability       | output − input — how much QRNG washed away predictability|

## Library of Babel mapping

`libraryofbabel.info` accepts URLs of the form

```
https://libraryofbabel.info/book.cgi?<hex>-w<1-4>-s<1-5>-v<01-32>:<1-410>
```

We take the first 256 bits of `F` as a 64-char hex room id and the next four
bytes (mod 4, 5, 32, 410) to fill wall/shelf/volume/page. The mapping is
deterministic given `(question, QRNG draw)` and changes wildly with every
new draw — which is the point.

## What this is *not*

- Not cryptographically secure (XOR with a per-session quantum pad is, in
  theory, a one-time pad, but the UI shows everything and the key isn't
  kept secret).
- Not an oracle in any literal sense. It's an instrument for *feeling*
  entropy and prediction at human scale.
- Not corpus-trained. The bigram model is a toy. Swap in a real n-gram
  table from a corpus (or a tiny WASM tokenizer + LLM) to push closer to
  Shannon's ~1 bit/char estimate.

## Possible next steps

- **Arithmetic-coding view**: implement the algorithm 3B1B teases in part 3
  and visualize the per-character bit budget under the model.
- **Real predictor**: drop in `gpt-tokenizer` + a tiny ONNX-runtime model
  for actual next-token probabilities and compute real cross-entropy.
- **Compare draws**: run N consultations with the same question, plot the
  distribution of fused entropies and resulting Babel addresses.
- **Reverse mode**: given a Babel page URL and the original question,
  reconstruct the QRNG draw that produced it (XOR-invertibility).

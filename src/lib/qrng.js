// ANU Quantum Random Number Generator client.
// API docs: https://quantumnumbers.anu.edu.au/
//
// Returns { bytes: Uint8Array, source: 'qrng' | 'crypto' }
// If the QRNG call fails for ANY reason we fall back to crypto.getRandomValues
// and clearly label the source so the UI can show it honestly.

const ENDPOINT = 'https://api.quantumnumbers.anu.edu.au';

export async function fetchQRNGBytes(nBytes, apiKey) {
  if (!apiKey) return cryptoFallback(nBytes, 'no-key');

  // The API caps `length` at 1024. Chunk if we need more.
  const chunks = [];
  let remaining = nBytes;
  try {
    while (remaining > 0) {
      const take = Math.min(remaining, 1024);
      const url = `${ENDPOINT}?length=${take}&type=uint8`;
      const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
      if (!res.ok) throw new Error(`QRNG HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(`QRNG payload: ${JSON.stringify(json)}`);
      chunks.push(...json.data);
      remaining -= take;
    }
    return { bytes: new Uint8Array(chunks), source: 'qrng' };
  } catch (err) {
    console.warn('[qrng] falling back to crypto.getRandomValues:', err.message);
    return cryptoFallback(nBytes, err.message);
  }
}

function cryptoFallback(n, reason) {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return { bytes, source: 'crypto', fallbackReason: reason };
}

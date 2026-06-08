import { runOracle } from '../lib/pipeline.js';

const $ = (id) => document.getElementById(id);

const keyInput = $('apikey');
const questionInput = $('question');
const runBtn = $('run');
const metersEl = $('meters');
const streamsEl = $('streams');
const babelEl = $('babel');

const STORED_KEY = 'qrng-babel-oracle:apikey';
keyInput.value = localStorage.getItem(STORED_KEY) || (import.meta.env.VITE_ANU_QRNG_KEY || '');
keyInput.addEventListener('change', () => {
  localStorage.setItem(STORED_KEY, keyInput.value.trim());
});

runBtn.addEventListener('click', async () => {
  const question = questionInput.value.trim();
  if (!question) { questionInput.focus(); return; }
  runBtn.disabled = true;
  runBtn.textContent = 'fetching quantum noise…';
  try {
    const apiKey = keyInput.value.trim();
    if (apiKey) localStorage.setItem(STORED_KEY, apiKey);
    const result = await runOracle({ question, apiKey });
    render(result);
  } catch (err) {
    metersEl.innerHTML = `<p style="color:var(--warn)">error: ${err.message}</p>`;
    streamsEl.innerHTML = '';
    babelEl.innerHTML = '';
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = 'consult the room';
  }
});

function meter(label, value, unit = '', cls = '') {
  return `<div class="meter ${cls}">
    <div class="label">${label}</div>
    <div class="value">${value}<span class="unit">${unit}</span></div>
  </div>`;
}

function render({ inputBits, qBits, fusedBits, inputText, qText, outputText, address, url, measurements: m }) {
  const sourceBadge = m.source === 'qrng'
    ? `<span class="qrng-badge">live quantum</span>`
    : `<span class="fallback-badge">fallback: ${m.fallbackReason}</span>`;

  metersEl.innerHTML = `
    <div class="meter"><div class="label">source</div><div class="value">${sourceBadge}</div></div>
    <div class="meter"><div class="label">bytes used</div><div class="value">${m.bytesUsed}</div></div>
    ${meter('input bit-bias',  (m.inputBitBalance * 100).toFixed(2), '%', m.inputBitBalance > 0.05 ? 'bad' : 'good')}
    ${meter('qrng bit-bias',   (m.qBitBalance * 100).toFixed(2),     '%', m.qBitBalance     > 0.05 ? 'bad' : 'good')}
    ${meter('fused bit-bias',  (m.fusedBitBalance * 100).toFixed(2), '%', m.fusedBitBalance > 0.05 ? 'bad' : 'good')}
    ${meter('input char H',  m.inputCharEntropy.toFixed(3),  'bits/c')}
    ${meter('qrng char H',   m.qCharEntropy.toFixed(3),      'bits/c')}
    ${meter('output char H', m.outputCharEntropy.toFixed(3), 'bits/c')}
    ${meter('input bigram surprise',  m.inputBigramBits.toFixed(3),  'bits/c')}
    ${meter('qrng  bigram surprise',  m.qBigramBits.toFixed(3),      'bits/c')}
    ${meter('output bigram surprise', m.outputBigramBits.toFixed(3), 'bits/c')}
    ${meter('Δ predictability', (m.outputBigramBits - m.inputBigramBits).toFixed(3), 'bits/c')}
  `;

  const cap = (s, n = 320) => s.length > n ? s.slice(0, n) + '…' : s;

  streamsEl.innerHTML = `
    <div class="stream"><h3>input · bits</h3><pre>${cap(inputBits)}</pre></div>
    <div class="stream"><h3>qrng · bits</h3><pre>${cap(qBits)}</pre></div>
    <div class="stream"><h3>fused (input ⊕ qrng) · bits</h3><pre>${cap(fusedBits)}</pre></div>
    <div class="stream"><h3>input · babel chars</h3><pre>${cap(inputText)}</pre></div>
    <div class="stream"><h3>qrng · babel chars</h3><pre>${cap(qText)}</pre></div>
    <div class="stream"><h3>output · babel chars (the oracle reply)</h3><pre>${cap(outputText)}</pre></div>
  `;

  babelEl.innerHTML = `
    <h2 style="margin:0 0 .5rem;font-size:1rem;letter-spacing:.05em;">Library of Babel address</h2>
    <div class="addr">room <code>${address.room.slice(0, 32)}…</code></div>
    <div class="addr">wall ${address.wall} · shelf ${address.shelf} · volume ${address.volume} · page ${address.page}</div>
    <p><a href="${url}" target="_blank" rel="noopener">${url}</a></p>
    <small>The Library claims to contain every possible page of 3200 characters. This address is a deterministic projection of your question fused with the live quantum stream.</small>
  `;
}

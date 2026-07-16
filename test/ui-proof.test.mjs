import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const proofUrl = new URL('../examples/identity-proof/index.html', import.meta.url);
const scriptUrl = new URL('../examples/identity-proof/proof.js', import.meta.url);
const uiCssUrl = new URL('../packages/ui/generated/components.css', import.meta.url);

test('proof is offline and consumes only governed package-relative resources', async () => {
  const html = await readFile(proofUrl, 'utf8');
  assert.match(html, /packages\/tokens\/generated\/tokens\.css/);
  assert.match(html, /packages\/assets\/generated\/fonts\/bizarre-fonts\.css/);
  assert.match(html, /packages\/ui\/generated\/components\.css/);
  assert.match(html, /packages\/ui\/generated\/motion\.css/);
  assert.match(html, /packages\/ui\/generated\/rtl\.css/);
  assert.match(html, /packages\/atlas\/generated\/atlas-contours-dark\.svg/);
  assert.match(html, /packages\/atlas\/generated\/capture-sequence\.svg/);
  assert.match(html, /src="\.\/proof\.js"/);
  assert.doesNotMatch(html, /https?:\/\/|fonts\.googleapis|fonts\.gstatic/);
  assert.doesNotMatch(html, /<svg\b|<path\b/i, 'proof must not fake governed visual assets inline');
  assert.doesNotMatch(html, /--bzr-[\w-]+\s*:/, 'proof must not redefine canonical tokens');
  for (const [, path] of html.matchAll(/(?:href|src|data)="([^"]+)"/g)) await access(new URL(path, proofUrl));
});

test('proof uses native controls and complete semantic state fixtures', async () => {
  const html = await readFile(proofUrl, 'utf8');
  assert.match(html, /<html[^>]*data-bizarre-theme="void"/);
  assert.match(html, /<label[^>]*for="theme-control"/);
  assert.match(html, /<select[^>]*id="theme-control"/);
  for (const theme of ['void', 'paper', 'void-hicontrast', 'workshop', 'bone']) {
    assert.match(html, new RegExp(`<option value="${theme}"`));
  }
  assert.match(html, /<button[^>]*data-bzr-component="signal-action"[^>]*>/);
  assert.match(html, /<button[^>]*aria-pressed="false"/);
  assert.match(html, /<button[^>]*disabled/);
  assert.match(html, /<button[^>]*aria-busy="true"/);
  assert.match(html, /<input[^>]*type="range"/);
  assert.match(html, /<output[^>]*data-bzr-component="status-indicator"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html, /data-bzr-component="status-indicator"[^>]*data-state="(?:active|captured|fault)"/);
  assert.match(html, /data-state="success"/);
  assert.match(html, /data-state="error"/);
  for (const [, , contents] of html.matchAll(/<(button|a)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    assert.doesNotMatch(contents, /<(?:button|a|input|select|textarea)\b/i, 'interactive elements must not be nested');
  }
  for (const tag of html.matchAll(/<([a-z][\w-]*)\b([^>]*)aria-label="[^"]+"[^>]*>/gi)) {
    assert.match(tag[2], /\brole="[^"]+"|\b(?:button|input|select|textarea|a)\b/i,
      `generic aria-label requires an explicit/native role: ${tag[0]}`);
  }
});

test('proof exposes honest Atlas provenance plus equal-priority English and Arabic data', async () => {
  const html = await readFile(proofUrl, 'utf8');
  const script = await readFile(scriptUrl, 'utf8');
  assert.match(html, /data-bzr-component="atlas-panel"/);
  assert.match(html, /data-bzr-provenance-field="source"/);
  assert.match(html, /data-bzr-provenance-field="algorithm"/);
  assert.match(html, /data-bzr-provenance-field="configurationHash"/);
  assert.doesNotMatch(html, /\bseed\b/i, 'a seed must not appear when the renderer does not consume one');
  assert.match(script, /DOMParser/);
  assert.match(script, /bizarre-atlas-provenance/);
  assert.match(script, /source\s*!==\s*['"]synthetic['"]/);
  assert.match(script, /data-layer="capture-phase"/);
  assert.match(script, /configuration\.capture\.phases/);
  assert.match(script, /\.animate\(/);
  assert.doesNotMatch(script, /\b0\.(?:32|55|72|88)\b/, 'proof must consume governed phase timing instead of duplicating it');
  assert.match(html, /lang="en"[^>]*dir="ltr"/);
  assert.match(html, /lang="ar"[^>]*dir="rtl"/);
  assert.match(html, /data-bzr-coordinate-space="physical"[^>]*dir="ltr"/);
});

test('capture interaction respects native keyboard behavior and reduced motion completes immediately', async () => {
  const script = await readFile(scriptUrl, 'utf8');
  assert.match(script, /addEventListener\(['"]click['"]/);
  assert.match(script, /matchMedia\(['"]\(prefers-reduced-motion:\s*reduce\)['"]\)/);
  assert.match(script, /getComputedStyle/);
  assert.match(script, /--bzr-capture-duration-ceremonial/);
  assert.doesNotMatch(script, /--bzr-capture-duration-standard/);
  assert.match(script, /data-state['"],\s*['"]captured['"]/);
  assert.doesNotMatch(script, /\.onkey(?:down|up|press)|addEventListener\(['"]key/, 'native controls own keyboard activation');
  assert.doesNotMatch(script, /innerHTML|insertAdjacentHTML|document\.write/);
});

test('UI styling meets the 44px target and visible-focus contract used by the proof', async () => {
  const css = await readFile(uiCssUrl, 'utf8');
  const tokens = await readFile(new URL('../packages/tokens/generated/tokens.css', import.meta.url), 'utf8');
  assert.match(tokens, /--bzr-space-12:\s*48px;/);
  assert.match(tokens, /--bzr-capture-duration-fast-min:\s*var\(--bzr-motion-duration-mid\);/);
  assert.match(tokens, /--bzr-capture-duration-fast-max:\s*var\(--bzr-motion-duration-slow\);/);
  assert.match(tokens, /--bzr-capture-duration-ceremonial:\s*var\(--bzr-motion-duration-epic\);/);
  assert.match(tokens, /--bzr-capture-duration-installation:\s*2400ms;/);
  assert.doesNotMatch(tokens, /--bzr-capture-duration-standard:/);
  assert.match(css, /min-block-size:\s*var\(--bzr-space-12\)/);
  assert.match(css, /:focus-visible[\s\S]*outline:[^;]*var\(--bzr-focus-ring\)/);
});

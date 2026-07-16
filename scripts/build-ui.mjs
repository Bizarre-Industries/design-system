import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { canonicalJson } from './lib/canonical-json.mjs';

const SOURCE = 'packages/ui/src/';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function assertContract(contract) {
  if (contract?.schemaVersion !== 2 || contract?.package !== '@bizarre/ui') {
    throw new TypeError('UI contract must identify @bizarre/ui schema version 2');
  }
  if (contract.integration?.principle !== 'integrate-not-replace'
    || contract.integration?.auditBeforeStyling !== true
    || contract.integration?.conflictResolution !== 'host-convention-wins'
    || contract.integration?.identityModel !== 'single-identity'
    || contract.integration?.identityOwner !== 'Bizarre Industries'
    || contract.integration?.hostVisualLanguageOwner !== 'host-product-and-platform'
    || contract.integration?.bizarreExpression !== 'restrained-recognition-layer'
    || contract.integration?.adapterSurface !== 'opt-in-html-css') {
    throw new TypeError('UI contract must preserve the single-identity native-integration boundary');
  }
  if (contract.infrastructure?.behaviorOwner !== 'host-application'
    || contract.infrastructure?.browserBehaviorOwner !== 'browser-and-host-application'
    || contract.infrastructure?.hostComponentSystemRequired !== true
    || contract.infrastructure?.semanticHtmlRequired !== true
    || contract.infrastructure?.globalResetAllowed !== false
    || contract.infrastructure?.hostRootStyleOverrideAllowed !== false) {
    throw new TypeError('UI behavior must remain owned by the host application');
  }
  const prohibited = new Set(contract.infrastructure?.prohibitedRuntime);
  for (const runtime of ['component-runtime', 'dialog-system', 'focus-manager', 'form-engine', 'router']) {
    if (!prohibited.has(runtime)) throw new TypeError(`UI contract must prohibit a competing ${runtime}`);
  }
  if (contract.accessibility?.minimumTargetPx < 44 || contract.accessibility?.targetToken !== 'space.12') {
    throw new TypeError('UI contract must require a token-backed target of at least 44px');
  }
  if (contract.motion?.reducedMotionState !== 'captured') {
    throw new TypeError('Reduced motion must resolve to the captured state');
  }
}

function assertCss(css, path, tokenCss) {
  if (/--bzr-[\w-]+\s*:/.test(css)) throw new TypeError(`${path} must not redefine canonical tokens`);
  if (/#[0-9a-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i.test(css)) throw new TypeError(`${path} must not contain raw colors`);
  if (/https?:\/\/|url\(\s*['"]?data:/i.test(css)) throw new TypeError(`${path} must not embed remote or data assets`);
  if (path === 'generated/components.css'
    && (/(?:^|,)\s*\*(?=\s*(?:,|\{))/m.test(css)
      || /(?:^|\})\s*(?:html|body|:root|\[data-bzr-ui\])(?:\b|\s|\{|:)/m.test(css))) {
    throw new TypeError(`${path} must remain opt-in and must not reset or restyle the host root`);
  }
  for (const [, token] of css.matchAll(/var\((--bzr-[\w-]+)/g)) {
    if (!tokenCss.includes(`${token}:`)) throw new TypeError(`${path} references unknown canonical token ${token}`);
  }
}

export async function buildExpectedUi(rootUrl) {
  const contract = JSON.parse(await readFile(new URL(`${SOURCE}contract.json`, rootUrl), 'utf8'));
  assertContract(contract);
  const tokenCss = await readFile(new URL('packages/tokens/generated/tokens.css', rootUrl), 'utf8');
  const payload = new Map([
    ['generated/components.css', await readFile(new URL(`${SOURCE}components.css`, rootUrl))],
    ['generated/contract.json', Buffer.from(canonicalJson(contract))],
    ['generated/motion.css', await readFile(new URL(`${SOURCE}motion.css`, rootUrl))],
    ['generated/rtl.css', await readFile(new URL(`${SOURCE}rtl.css`, rootUrl))]
  ]);
  for (const [path, bytes] of payload) {
    if (path.endsWith('.css')) assertCss(bytes.toString('utf8'), path, tokenCss);
  }
  const files = Object.fromEntries([...payload].map(([path, bytes]) => [path, { sha256: sha256(bytes) }]));
  payload.set('generated/manifest.json', Buffer.from(canonicalJson({
    schemaVersion: 2,
    package: '@bizarre/ui',
    files
  })));
  return new Map([...payload].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0));
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  const rootUrl = new URL('../', import.meta.url);
  const { writePackage } = await import('./lib/package-writer.mjs');
  await writePackage(new URL('../packages/ui/', import.meta.url), await buildExpectedUi(rootUrl));
}

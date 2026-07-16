const root = document.documentElement;
const themeControl = document.querySelector('#theme-control');
const directionControl = document.querySelector('#direction-control');
const bilingualPanel = document.querySelector('#bilingual-panel');
const dial = document.querySelector('#compression-dial');
const dialOutput = document.querySelector('#compression-value');
const captureModule = document.querySelector('#capture-module');
const captureAction = document.querySelector('#capture-action');
const captureStatus = document.querySelector('#capture-status');
const captureVisual = document.querySelector('#capture-visual');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let captureTimer;
let captureMetadata;
let captureAnimations = [];

themeControl.addEventListener('change', () => {
  root.setAttribute('data-bizarre-theme', themeControl.value);
});

directionControl.addEventListener('change', () => {
  if (directionControl.value === 'native') bilingualPanel.removeAttribute('dir');
  else bilingualPanel.setAttribute('dir', directionControl.value);
});

dial.addEventListener('input', () => {
  dialOutput.textContent = (Number(dial.value) / 100).toFixed(2);
});

function durationInMilliseconds(element, property) {
  const value = getComputedStyle(element).getPropertyValue(property).trim();
  if (value.endsWith('ms')) return Number.parseFloat(value);
  if (value.endsWith('s')) return Number.parseFloat(value) * 1000;
  return 0;
}

function finishCapture() {
  window.clearTimeout(captureTimer);
  showFinalCaptureVisual();
  captureModule.setAttribute('data-state', 'captured');
  captureAction.setAttribute('aria-pressed', 'true');
  captureAction.setAttribute('data-state', 'success');
  captureAction.removeAttribute('aria-busy');
  captureAction.textContent = 'Captured';
  captureStatus.setAttribute('data-state', 'captured');
  captureStatus.textContent = 'Capture complete. Final state held.';
}

function captureGroups() {
  return [...(captureVisual.contentDocument?.querySelectorAll('[data-layer="capture-phase"]') ?? [])];
}

function showFinalCaptureVisual() {
  for (const animation of captureAnimations) animation.cancel();
  captureAnimations = [];
  for (const group of captureGroups()) group.style.opacity = group.dataset.phase === 'release' ? '1' : '0';
}

function readCaptureMetadata() {
  const record = captureVisual.contentDocument?.getElementById('bizarre-atlas-provenance');
  if (!record) return;
  const metadata = JSON.parse(record.textContent);
  if (!metadata.configuration?.capture?.phases) return;
  captureMetadata = metadata;
}

function playCaptureVisual(duration) {
  readCaptureMetadata();
  if (!captureMetadata || reducedMotion.matches) {
    showFinalCaptureVisual();
    return;
  }
  const phases = captureMetadata.configuration.capture.phases;
  const easing = getComputedStyle(captureModule).getPropertyValue('--bzr-motion-easing-out').trim();
  captureAnimations = captureGroups().map((group) => {
    const timing = phases[group.dataset.phase];
    if (!timing) throw new Error(`Missing governed timing for ${group.dataset.phase}`);
    return group.animate(
      [{ opacity: 0 }, { opacity: 1 }, { opacity: group.dataset.phase === 'release' ? 1 : 0 }],
      {
        delay: duration * timing.start,
        duration: Math.max(1, duration * (timing.end - timing.start)),
        easing,
        fill: 'forwards'
      }
    );
  });
}

captureVisual.addEventListener('load', readCaptureMetadata);

captureAction.addEventListener('click', () => {
  if (captureModule.getAttribute('data-state') === 'capturing') return;
  captureModule.setAttribute('data-state', 'capturing');
  captureAction.setAttribute('aria-busy', 'true');
  captureStatus.setAttribute('data-state', 'active');
  captureStatus.textContent = 'Capture sequence in progress.';
  if (reducedMotion.matches) {
    finishCapture();
    return;
  }
  const duration = durationInMilliseconds(captureModule, '--bzr-capture-duration-ceremonial');
  playCaptureVisual(duration);
  captureTimer = window.setTimeout(finishCapture, duration);
});

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches && captureModule.getAttribute('data-state') === 'capturing') finishCapture();
});

function metadataValue(metadata, field) {
  if (field === 'source') return metadata.sourceType;
  if (field === 'model') return `${metadata.model.name}/${metadata.model.version}`;
  if (field === 'algorithm') return `${metadata.algorithm.name}/${metadata.algorithm.version}`;
  return metadata[field];
}

async function loadAtlasMetadata() {
  const image = document.querySelector('#atlas-field');
  const status = document.querySelector('#metadata-status');
  try {
    const response = await fetch(image.getAttribute('src'));
    if (!response.ok) throw new Error('Atlas asset was not readable');
    const xml = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
    const record = xml.getElementById('bizarre-atlas-provenance');
    if (!record) throw new Error('Atlas provenance record is missing');
    const metadata = JSON.parse(record.textContent);
    const source = metadata.sourceType;
    if (source !== 'synthetic') throw new Error('Proof accepts the governed synthetic Atlas fixture only');
    for (const node of document.querySelectorAll('[data-bzr-provenance-field]')) {
      const value = metadataValue(metadata, node.dataset.bzrProvenanceField);
      if (typeof value !== 'string' || value.length === 0) throw new Error(`Missing ${node.dataset.bzrProvenanceField}`);
      node.textContent = value;
    }
    status.setAttribute('data-state', 'captured');
    status.textContent = 'Governed provisional Atlas metadata loaded from the displayed nonpublishable asset.';
  } catch {
    status.setAttribute('data-state', 'fault');
    status.textContent = 'Governed metadata is unavailable in this local viewing context.';
  }
}

loadAtlasMetadata();

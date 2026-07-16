import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const runRoot = new URL('../outputs/imagegen/atlas-representation-studies/v2.0.0/', import.meta.url);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('Continuous Lens v2 ImageGen run is complete, source-hashed, and nonpublishable', async () => {
  const manifest = JSON.parse(await readFile(new URL('MANIFEST.json', runRoot), 'utf8'));
  const jobsBytes = await readFile(new URL('jobs.jsonl', runRoot));
  const jobs = jobsBytes.toString('utf8').trim().split('\n').map(JSON.parse);

  assert.equal(manifest.runId, 'atlas-representation-studies/v2.0.0');
  assert.equal(manifest.generator.method, 'built-in-imagegen');
  assert.equal(manifest.generator.jobsSha256, sha256(jobsBytes));
  assert.equal(manifest.authority, false);
  assert.equal(manifest.publishable, false);
  assert.equal(manifest.supersedesForActiveReconstruction, 'atlas-representation-studies/v1.0.0');
  assert.equal(manifest.preservesHistoricalRun, true);
  assert.deepEqual(jobs.map(({ subjectId }) => subjectId), ['07.05', '07.08', '07.09', '07.10']);
  assert.equal(manifest.outputs.length, 4);

  for (const output of manifest.outputs) {
    assert.equal(sha256(await readFile(new URL(output.path, runRoot))), output.sha256, `${output.id} hash drift`);
    assert.match(output.path, /continuous-lens-v2\.png$/);
  }
  for (const reference of manifest.references) {
    assert.equal(sha256(await readFile(new URL(reference.path, runRoot))), reference.sha256, `${reference.path} hash drift`);
  }
});

test('v2 reconstruction prompts forbid the rejected sharp aperture and simplistic field shortcuts', async () => {
  const jobs = (await readFile(new URL('jobs.jsonl', runRoot), 'utf8')).trim().split('\n').map(JSON.parse);

  for (const job of jobs) {
    assert.match(job.prompt, /smooth tangent-continuous asymmetric oval/i);
    assert.match(job.prompt, /no sharp edge.*chamfer.*wedge.*notch.*key cut.*straight segment/i);
    assert.match(job.prompt, /(?:exactly one|one singular)/i);
    assert.match(job.prompt, /simplistic horizontal S-curves/i);
    assert.doesNotMatch(job.prompt, /preserve.*Calibrated Aperture v1|one chamfer/i);
  }
});

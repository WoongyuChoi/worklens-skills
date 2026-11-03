'use strict';
// Development checks use Node built-ins. Reading the skill needs no Node installation.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const folder = path.join(root, 'skills/source-sink-review');
const flow = require(path.join(folder, 'assets/demo-flow.cjs'));
const { runDemo } = require(path.join(folder, 'scripts/local-demo.cjs'));
const review = require('./fixtures/security-source/RequestHandlers.cjs');

function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'worklens-source-test-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const allowed = path.join(base, 'public');
  fs.mkdirSync(allowed);
  fs.mkdirSync(path.join(base, 'public-backup'));
  fs.writeFileSync(path.join(allowed, 'manual-0012.txt'), '0012');
  fs.writeFileSync(path.join(base, 'canary.txt'), 'SYNTHETIC_CANARY');
  return { base, allowed };
}

test('SQL witness distinguishes raw structure from a fixed key mapping without executing SQL', () => {
  const raw = 'display_name DESC';
  assert.equal(flow.queryVulnerable(raw), 'SELECT id, display_name FROM demo_users ORDER BY display_name DESC');
  assert.throws(() => flow.queryFixed(raw, 'desc'), /정렬 키/);
  assert.equal(flow.queryFixed('name', 'desc'), 'SELECT id, display_name FROM demo_users ORDER BY display_name DESC');
  for (const key of ['__proto__', 'constructor', 'name ', 'NAME']) assert.throws(() => flow.queryFixed(key, 'asc'));
  assert.throws(() => flow.queryFixed('name', 'DESC'), /정렬 방향/);
});

test('string validation preserves identifiers and rejects coercion', () => {
  for (const value of [null, 12, true, '', 'x'.repeat(257)]) assert.throws(() => flow.queryVulnerable(value));
  assert.equal(flow.requestPlanFixed('/catalog/0012').url, flow.BASE_URL + 'catalog/0012');
});

test('temporary sibling read is observed, then blocked while valid file access remains', t => {
  const { allowed } = fixture(t);
  assert.equal(flow.readVulnerable(allowed, '../canary.txt').content, 'SYNTHETIC_CANARY');
  assert.throws(() => flow.readFixed(allowed, '../canary.txt'), /루트 밖/);
  assert.equal(flow.readFixed(allowed, 'manual-0012.txt').content, '0012');
});

test('component containment rejects sibling prefixes and absolute input', t => {
  const { base, allowed } = fixture(t);
  assert.equal(flow.isWithin(allowed, path.join(base, 'public-backup', 'file.txt')), false);
  assert.equal(flow.isWithin(allowed, path.join(allowed, 'nested', 'file.txt')), true);
  assert.throws(() => flow.readFixed(allowed, path.join(allowed, 'manual-0012.txt')), /상대 파일명/);
});

test('existing target symlink escape is rejected, with platform privilege limits explicit', t => {
  const { base, allowed } = fixture(t);
  try { fs.symlinkSync(path.join(base, 'canary.txt'), path.join(allowed, 'linked.txt')); }
  catch (error) { if (['EPERM', 'EACCES', 'ENOSYS'].includes(error.code)) { t.skip('플랫폼에서 symlink 생성 권한 없음'); return; } throw error; }
  assert.equal(flow.readVulnerable(allowed, 'linked.txt').content, 'SYNTHETIC_CANARY');
  assert.throws(() => flow.readFixed(allowed, 'linked.txt'), /심볼릭 링크/);
});

test('URL policy uses parsed origin and rejects credentials, sibling hosts and non-HTTPS schemes', () => {
  const other = 'https://external.example.invalid/preview';
  assert.equal(flow.requestPlanVulnerable(other).url, other);
  for (const value of [other, '//external.example.invalid/x', 'https://inventory.example.invalid.evil.invalid/x',
    'https://user@inventory.example.invalid/x', 'http://inventory.example.invalid/x',
    'https://inventory.example.invalid:444/x', '/catalog/0012#fragment']) {
    assert.throws(() => flow.requestPlanFixed(value));
  }
  assert.equal(flow.requestPlanFixed('/catalog/0012').url, flow.BASE_URL + 'catalog/0012');
});

test('independent source fixture keeps generated values distinct from executed effects', () => {
  const request = { query: { sort: 'name', file: '../canary.txt' } };
  assert.equal(review.listRequest(request).sql, 'SELECT id FROM demo_records ORDER BY name');
  assert.equal(review.mappedListRequest(request).sql, 'SELECT id FROM demo_records ORDER BY display_name');
  assert.equal(review.listRequest(request).executed, false);
  assert.equal(review.downloadPlan(request, path.resolve('public')).opened, false);
});

test('demo emits truthful shared-contract findings and removes every temporary fixture', t => {
  const { base } = fixture(t);
  const before = fs.readdirSync(base).sort();
  const report = runDemo({ tempParent: base });
  assert.deepEqual(fs.readdirSync(base).sort(), before);
  assert.equal(report.schema, 'worklens-security-report/v1');
  assert.equal(report.mode, 'local-demo');
  assert.equal(report.skill, 'source-sink-review');
  assert.equal(report.findings.length, 3);
  for (const finding of report.findings) {
    assert.equal(finding.status, 'confirmed');
    assert.equal(finding.severity, 'info');
    for (const key of ['evidence', 'conditions', 'fix', 'retest', 'flow']) assert(finding[key].length > 0);
    assert(finding.evidence.some(item => item.kind === 'runtime'));
  }
  assert(report.scope.limitations.some(value => value.includes('CVE')));
  assert(report.coverage.some(value => value.status === 'not-executed'));
  assert(!JSON.stringify(report).includes(base));
});

test('CLI writes a new JSON file and preserves an existing output verbatim', t => {
  const { base } = fixture(t);
  const cli = path.join(folder, 'scripts/local-demo.cjs');
  const output = path.join(base, 'report.json');
  const first = spawnSync(process.execPath, [cli, '--out', output], { encoding: 'utf8' });
  assert.equal(first.status, 0, first.stderr);
  assert.equal(JSON.parse(fs.readFileSync(output, 'utf8')).mode, 'local-demo');
  fs.writeFileSync(output, 'KEEP_EXISTING_0012');
  const second = spawnSync(process.execPath, [cli, '--out', output], { encoding: 'utf8' });
  assert.equal(second.status, 2);
  assert.equal(fs.readFileSync(output, 'utf8'), 'KEEP_EXISTING_0012');
  const bad = spawnSync(process.execPath, [cli, '--target', base], { encoding: 'utf8' });
  assert.equal(bad.status, 2);
});

test('unexpected runtime failures do not become successful boundary denials and leave no temporary files', t => {
  const { base } = fixture(t);
  const before = fs.readdirSync(base).sort();
  const original = flow.queryFixed;
  flow.queryFixed = () => { throw new Error('UNEXPECTED_RUNTIME_FAILURE'); };
  try { assert.throws(() => runDemo({ tempParent: base }), /UNEXPECTED_RUNTIME_FAILURE/); }
  finally { flow.queryFixed = original; }
  assert.deepEqual(fs.readdirSync(base).sort(), before);
});

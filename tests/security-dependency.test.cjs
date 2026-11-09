'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const skill = path.resolve(__dirname, '../skills/dependency-advisory-triage');
const { triage, matchVersion } = require(path.join(skill, 'scripts/triage.cjs'));
const snapshot = JSON.parse(fs.readFileSync(path.join(skill, 'assets/advisory-snapshot.json'), 'utf8'));
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/security-dependency/input.json'), 'utf8'));
const AS_OF = '2026-11-03T12:00:00Z';
const clone = value => structuredClone(value);
const run = (input = clone(fixture), snap = clone(snapshot), asOf = AS_OF) => triage(input, snap, { asOf });
const by = (report, id, dependencyId) => report.findings.find(finding => finding.advisoryId === id
  && (!dependencyId || finding.dependency.id === dependencyId));
const freemarker = input => input.assessments.find(item => item.advisoryId === 'CVE-2026-59280');
const advisory = id => clone(snapshot.advisories.find(item => item.id === id));
const localEvidence = (detail = '합성 관찰') => [{ kind: 'source', location: 'synthetic-fixture:1', detail }];

test('six-record curated fixture separates static impact, rebuttal, version-only and omitted branches', () => {
  const report = run();
  assert.equal(report.schema, 'worklens-security-report/v1');
  assert.equal(report.mode, 'static');
  assert.equal(report.snapshot.advisoryCount, 6);
  assert.equal(report.snapshot.curated, true);
  const affected = by(report, 'CVE-2026-59280');
  assert.equal(affected.triageState, 'AFFECTED');
  assert.equal(affected.status, 'suspected');
  assert.ok(affected.evidence.some(item => item.location === 'SyntheticViews.java:5'));
  assert.equal(by(report, 'CVE-2026-23864').triageState, 'REACHABILITY_REBUTTED');
  assert.equal(by(report, 'CVE-2026-47849').triageState, 'VERSION_MATCH');
  for (const id of ['CVE-2026-59270', 'CVE-2026-47841']) {
    assert.equal(by(report, id).triageState, 'VERSION_UNKNOWN');
    assert.equal(by(report, id).versionMatch.reason, 'UNVERIFIED_BRANCH');
  }
});

test('numeric version matching checks both ends and a same-branch fix', () => {
  const record = advisory('CVE-2026-59280');
  assert.equal(matchVersion('6.1.0', record).state, 'match');
  assert.equal(matchVersion('6.1.28', record).state, 'match');
  assert.equal(matchVersion('6.1.29', record).state, 'outside');
  assert.equal(matchVersion('6.1.30', record).state, 'outside');
  assert.equal(matchVersion('6.3.0', record).state, 'unknown');
});

test('an overlapping fixed boundary and affected range is held, never reported clean', () => {
  const record = advisory('CVE-2026-59280');
  record.affected.numericRanges.find(range => range.from === '6.1.0').through = '6.1.35';
  assert.equal(matchVersion('6.1.29', record).reason, 'ADVISORY_CONFLICT');
  assert.equal(matchVersion('6.1.30', record).reason, 'ADVISORY_CONFLICT');
});

test('qualifiers, prereleases, request ranges and unsupported integer sizes are not coerced', () => {
  const record = advisory('CVE-2026-59280');
  for (const version of ['6.1.1.Final', '6.1.1-SNAPSHOT', '6.1.1-rc.1', '6.1.1+vendor',
    'v6.1.1', '^6.1.1', '[6.1.0,6.2.0)', '6.01.1', '999999999999999999.1.0', '6.1.1.9']) {
    assert.equal(matchVersion(version, record).state, 'unknown', version);
  }
  assert.equal(matchVersion('7.0.8.1', record).reason, 'EXACT_FIXED_VERSION');
  assert.equal(matchVersion('7.0.8.2', record).state, 'unknown');
});

test('product prefix is only a candidate; wrong product-version evidence does not unlock matching', () => {
  const input = clone(fixture);
  delete input.dependencies[0].productEvidence;
  let found = by(run(input), 'CVE-2026-59280');
  assert.equal(found.triageState, 'PRODUCT_CANDIDATE');
  assert.equal(found.versionMatch.reason, 'UNPROVEN_PRODUCT');
  input.dependencies[0].productEvidence = [{ product: 'spring-framework', version: '3.2.1', evidence: localEvidence() }];
  found = by(run(input), 'CVE-2026-59280');
  assert.equal(found.triageState, 'PRODUCT_CANDIDATE');
});

test('declared dependencies or advisory-only local evidence cannot prove selected runtime versions', () => {
  const input = clone(fixture);
  input.dependencies[0].basis = 'declared';
  assert.equal(by(run(input), 'CVE-2026-59280').triageState, 'UNPROVEN_DEPENDENCY');
  input.dependencies[0].basis = 'selected';
  input.dependencies[0].evidence = [{ kind: 'advisory', location: 'https://example.invalid/advisory', detail: '공식 제품 범위' }];
  assert.equal(by(run(input), 'CVE-2026-59280').triageState, 'UNPROVEN_DEPENDENCY');
});

test('missing conditions and unsupported truth strings remain unknown', () => {
  const input = clone(fixture);
  const assessment = freemarker(input);
  delete assessment.conditions.spring_template_loader;
  assert.equal(by(run(input), 'CVE-2026-59280').triageState, 'REACHABILITY_UNKNOWN');
  assessment.conditions.untrusted_view_name.value = 'false';
  assert.equal(by(run(input), 'CVE-2026-59280').triageState, 'REACHABILITY_UNKNOWN');
});

test('an evidenced false prerequisite rebuts this deployment, but an unsupported assertion does not', () => {
  const input = clone(fixture);
  freemarker(input).conditions.untrusted_view_name = { value: false, evidence: [] };
  assert.equal(by(run(input), 'CVE-2026-59280').triageState, 'REACHABILITY_UNKNOWN');
  freemarker(input).conditions.untrusted_view_name.evidence = localEvidence('배포된 controller는 고정 allowlist의 view만 반환');
  const result = by(run(input), 'CVE-2026-59280');
  assert.equal(result.triageState, 'REACHABILITY_REBUTTED');
  assert.equal(result.status, 'not-applicable');
});

test('static claims cannot become confirmed without explicitly typed supplied runtime evidence', () => {
  const input = clone(fixture);
  freemarker(input).runtime = { outcome: 'reproduced', evidence: localEvidence('정적 검토') };
  assert.equal(by(run(input), 'CVE-2026-59280').status, 'suspected');
  freemarker(input).runtime.evidence = [{ kind: 'runtime', location: 'synthetic-authorized-lab.log:10',
    detail: '합성 실행 관찰 fixture; 실제 서비스 접속은 하지 않음' }];
  const result = by(run(input), 'CVE-2026-59280');
  assert.equal(result.status, 'confirmed');
  assert.equal(result.triageState, 'AFFECTED');
  assert.ok(result.evidence.some(item => item.kind === 'runtime'));
});

test('failed reproduction retains supported static impact and never implies a patch', () => {
  const input = clone(fixture);
  freemarker(input).runtime = { outcome: 'not-reproduced', evidence: [{ kind: 'runtime',
    location: 'synthetic-lab.log:20', detail: '합성 제한 범위에서 관찰되지 않음' }] };
  const result = by(run(input), 'CVE-2026-59280');
  assert.equal(result.status, 'not-reproduced');
  assert.equal(result.triageState, 'AFFECTED');
});

test('contradictory runtime observations are retained and cannot be suppressed by a static rebuttal or fix', () => {
  const input = clone(fixture);
  freemarker(input).runtime = { outcome: 'reproduced', evidence: [{ kind: 'runtime',
    location: 'synthetic-conflict.log:1', detail: '정적 자료와 다른 합성 실행 관찰' }] };
  freemarker(input).conditions.untrusted_view_name.value = false;
  let result = by(run(input), 'CVE-2026-59280');
  assert.equal(result.triageState, 'EVIDENCE_CONFLICT');
  assert.equal(result.status, 'unknown');
  assert.ok(result.evidence.some(item => item.location === 'synthetic-conflict.log:1'));
  freemarker(input).conditions.untrusted_view_name.value = true;
  input.dependencies[0].version = '6.1.29';
  input.dependencies[0].productEvidence[0].version = '6.1.29';
  result = by(run(input), 'CVE-2026-59280');
  assert.equal(result.triageState, 'EVIDENCE_CONFLICT');
});

test('fixed-version channels are retained instead of promising public availability', () => {
  const report = run();
  const result = by(report, 'CVE-2026-59280');
  assert.deepEqual(result.sameBranchFixes, [{ version: '6.1.29', channel: 'enterprise-only' }]);
  assert.match(result.fix.join(' '), /enterprise-only/);
  const rest = by(report, 'CVE-2026-47849');
  assert.deepEqual(rest.sameBranchFixes, []);
  assert.ok(rest.availableFixes.some(fix => fix.version === '4.4.16' && fix.channel === 'enterprise-only'));
});

test('withdrawn advisories preserve their identity/history but are not active findings', () => {
  const snap = clone(snapshot);
  snap.advisories.find(item => item.id === 'CVE-2026-59280').withdrawnAt = '2026-10-01';
  const result = by(run(clone(fixture), snap), 'CVE-2026-59280');
  assert.equal(result.triageState, 'ADVISORY_WITHDRAWN');
  assert.equal(result.status, 'not-applicable');
  assert.equal(result.withdrawnAt, '2026-10-01');
});

test('identical aliased records are deduplicated; related CVEs are not aliases', () => {
  const snap = clone(snapshot);
  const duplicate = advisory('CVE-2026-59280');
  duplicate.id = 'GHSA-synthetic-alias';
  duplicate.aliases = ['CVE-2026-59280'];
  snap.advisories.push(duplicate);
  const report = run(clone(fixture), snap);
  assert.equal(report.snapshot.advisoryCount, 7);
  assert.equal(report.snapshot.deduplicatedCount, 6);
  const matches = report.findings.filter(item => item.dependency.id === 'freemarker-runtime');
  assert.equal(matches.length, 1);
  assert.ok(matches[0].aliases.includes('GHSA-synthetic-alias'));
  assert.equal(matches[0].triageState, 'AFFECTED');
  assert.deepEqual(by(report, 'CVE-2026-23864').aliases, []);
});

test('conflicting active/withdrawn alias records require reconciliation', () => {
  const snap = clone(snapshot);
  const duplicate = advisory('CVE-2026-59280');
  duplicate.id = 'GHSA-synthetic-conflict';
  duplicate.aliases = ['CVE-2026-59280'];
  duplicate.withdrawnAt = '2026-10-01';
  snap.advisories.push(duplicate);
  const result = by(run(clone(fixture), snap), 'CVE-2026-59280');
  assert.equal(result.triageState, 'ADVISORY_CONFLICT');
  assert.equal(result.status, 'unknown');
});

test('conflicting assessments through aliases are not silently selected', () => {
  const snap = clone(snapshot);
  snap.advisories.find(item => item.id === 'CVE-2026-59280').aliases = ['GHSA-synthetic'];
  const input = clone(fixture);
  const additional = clone(freemarker(input));
  additional.advisoryId = 'GHSA-synthetic';
  additional.conditions.freemarker_used.value = false;
  input.assessments.push(additional);
  assert.equal(by(run(input, snap), 'CVE-2026-59280').triageState, 'ADVISORY_CONFLICT');
});

test('RSC amendment preserves its historical date and disputed 19.1.4 version', () => {
  const record = advisory('CVE-2026-23864');
  assert.equal(record.publishedAt, '2026-01-26');
  assert.equal(record.sources[0].publishedAt, '2025-12-11');
  assert.equal(matchVersion('19.1.4', record).reason, 'ADVISORY_CONFLICT');
  assert.equal(matchVersion('19.1.5', record).state, 'outside');
  assert.equal(matchVersion('19.3.0', record).state, 'unknown');
});

test('malware applicability cannot be rebutted solely by a missing runtime call', () => {
  const snap = clone(snapshot);
  const record = snap.advisories.find(item => item.id === 'CVE-2026-59280');
  record.kind = 'malware'; // Synthetic behavior fixture, not a claim about the real CVE.
  record.conditions = [{ id: 'runtime_called', label: '런타임 호출', phase: 'runtime' },
    { id: 'install_executed', label: '설치 단계 코드 실행', phase: 'install' }];
  const input = clone(fixture);
  freemarker(input).conditions = { runtime_called: { value: false, evidence: localEvidence('합성 런타임 경로 부재') },
    install_executed: { value: 'unknown', evidence: [] } };
  let result = by(run(input, snap), 'CVE-2026-59280');
  assert.equal(result.triageState, 'REACHABILITY_UNKNOWN');
  freemarker(input).conditions.install_executed = { value: false, evidence: localEvidence('합성 설치 기록으로 해당 실행 전제 불성립 확인') };
  result = by(run(input, snap), 'CVE-2026-59280');
  assert.equal(result.triageState, 'REACHABILITY_REBUTTED');
});

test('stale snapshots and uncovered dependencies are visible, without fabricated source hashes', () => {
  const input = clone(fixture);
  input.dependencies.push({ id: 'uncovered', ecosystem: 'npm', name: 'synthetic-unlisted-package',
    version: '1.0.0', basis: 'selected', evidence: localEvidence() });
  const report = run(input, clone(snapshot), '2027-03-01T00:00:00Z');
  assert.equal(report.snapshot.stale, true);
  assert.match(report.scope.limitations.join(' '), /스냅샷 수집 후/);
  assert.equal(report.coverage.find(item => item.target === 'uncovered').status, 'unknown');
  assert.ok(report.sources.every(source => source.contentSha256 === null));
});

test('invalid generalized ranges and duplicate records fail with a useful input error', () => {
  const snap = clone(snapshot);
  snap.advisories[0].affected.numericRanges[0].from = '^5.1.0';
  assert.throws(() => run(clone(fixture), snap), /숫자 3자리/);
  const input = clone(fixture);
  input.dependencies.push(clone(input.dependencies[0]));
  assert.throws(() => run(input), /중복 없는 id/);
});

test('real CLI writes a common report offline, refuses overwrite, and writes finished Markdown', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'worklens-dependency-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const input = path.join(dir, 'input.json');
  const output = path.join(dir, 'report.json');
  const markdown = path.join(dir, 'report.md');
  fs.writeFileSync(input, JSON.stringify(fixture));
  const args = [path.join(skill, 'scripts/triage.cjs'), '--input', input, '--out', output, '--as-of', AS_OF];
  const result = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(fs.readFileSync(output, 'utf8'));
  assert.equal(by(report, 'CVE-2026-59280').status, 'suspected');
  const original = fs.readFileSync(output, 'utf8');
  const rerun = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(rerun.status, 2);
  assert.equal(fs.readFileSync(output, 'utf8'), original);
  const rendered = spawnSync(process.execPath, [path.join(skill, 'scripts/write-report.cjs'), output, markdown], { encoding: 'utf8' });
  assert.equal(rendered.status, 0, rendered.stderr);
  const document = fs.readFileSync(markdown, 'utf8');
  assert.match(document, /CVE-2026-59280/);
  assert.match(document, /REACHABILITY.*REBUTTED/);
  assert.doesNotMatch(document, /<script[^>]+src\s*=/i);
  assert.doesNotMatch(document, /<link[^>]+href\s*=\s*["']https?:/i);
});
test('supplied runtime evidence renders as evidence review, without implying this helper ran an attack', () => {
  const input = JSON.parse(fs.readFileSync(path.join(__dirname, '../skills/dependency-advisory-triage/assets/example-input.json'), 'utf8'));
  const item = input.assessments.find(item => item.advisoryId === 'CVE-2026-59280');
  item.runtime = {outcome:'reproduced',evidence:[{kind:'runtime',location:'synthetic-lab:1',detail:'합성된 제공 기록; 실제 서비스 실행 아님'}]};
  const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, '../skills/dependency-advisory-triage/assets/advisory-snapshot.json'), 'utf8'));
  const report = triage(input, snapshot);
  assert.equal(report.mode, 'evidence-review');
  const renderer = require('../skills/dependency-advisory-triage/scripts/write-report.cjs');
  assert(renderer.render(report).includes('제공된 실행 기록 검토'));
});

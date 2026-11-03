#!/usr/bin/env node
'use strict';

// Local JSON in, evidence-preserving report out. No package manager or network.
const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');

const DEFAULT_SNAPSHOT = path.join(__dirname, '..', 'assets', 'advisory-snapshot.json');
const EVIDENCE_KINDS = new Set(['source', 'runtime', 'trace', 'advisory']);
const BASES = new Set(['selected', 'packaged', 'runtime', 'declared']);
const TRI = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const EXACT_NUMERIC = /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){2,3}$/;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const list = value => Array.isArray(value) ? value : [];

function triplet(version) {
  if (typeof version !== 'string' || !TRI.test(version)) return null;
  const parts = version.split('.').map(Number);
  return parts.every(Number.isSafeInteger) ? parts : null;
}

function compare(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  return 0;
}

function evidence(items) {
  return list(items).filter(item => isObject(item) && EVIDENCE_KINDS.has(item.kind)
    && nonempty(item.location) && nonempty(item.detail));
}

function hasLocalEvidence(items) {
  return evidence(items).some(item => item.kind !== 'advisory');
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function validate(input, snapshot) {
  assert(isObject(input) && input.schema === 'worklens-dependency-input/v1', '입력 schema가 worklens-dependency-input/v1이어야 합니다.');
  assert(Array.isArray(input.dependencies) && input.dependencies.length <= 2000, 'dependencies 배열은 최대 2000건입니다. 큰 프로젝트는 module/configuration별로 나누세요.');
  assert(isObject(snapshot) && snapshot.schema === 'worklens-advisory-snapshot/v1', '지원하지 않는 스냅샷 schema입니다. OSV 원문을 이 입력으로 직접 넣지 마세요.');
  assert(snapshot.curated === true && validDate(snapshot.collectedAt), '스냅샷의 curated=true와 collectedAt 날짜가 필요합니다.');
  assert(nonempty(snapshot.coverageNote), '스냅샷 coverageNote가 필요합니다.');
  assert(Array.isArray(snapshot.advisories) && snapshot.advisories.length <= 1000, 'advisories 배열은 최대 1000건입니다.');
  const ids = new Set();
  for (const dep of input.dependencies) {
    assert(isObject(dep) && nonempty(dep.id) && !ids.has(dep.id), '각 dependency에는 중복 없는 id가 필요합니다.');
    ids.add(dep.id);
    assert(nonempty(dep.ecosystem) && nonempty(dep.name) && nonempty(dep.version), `${dep.id}: ecosystem/name/version 문자열이 필요합니다.`);
    assert(BASES.has(dep.basis), `${dep.id}: basis는 declared/selected/packaged/runtime 중 하나입니다.`);
  }
  const assessments = new Set();
  assert(input.assessments === undefined || Array.isArray(input.assessments), 'assessments는 배열이어야 합니다.');
  for (const item of list(input.assessments)) {
    assert(isObject(item) && ids.has(item.dependencyId) && nonempty(item.advisoryId), 'assessment에는 존재하는 dependencyId와 advisoryId가 필요합니다.');
    const key = `${item.dependencyId}\u0000${item.advisoryId}`;
    assert(!assessments.has(key), '같은 dependency/advisory assessment가 중복됐습니다.');
    assessments.add(key);
    assert(item.conditions === undefined || isObject(item.conditions), 'assessment.conditions는 객체여야 합니다.');
  }
  for (const advisory of snapshot.advisories) {
    assert(isObject(advisory) && nonempty(advisory.id) && nonempty(advisory.title) && nonempty(advisory.product), '권고의 id/title/product가 필요합니다.');
    assert(['vulnerability', 'malware'].includes(advisory.kind), `${advisory.id}: kind는 vulnerability 또는 malware입니다.`);
    assert(validDate(advisory.publishedAt), `${advisory.id}: publishedAt이 필요합니다.`);
    assert(advisory.modifiedAt === null || validDate(advisory.modifiedAt), `${advisory.id}: modifiedAt은 날짜 또는 null입니다.`);
    assert(advisory.withdrawnAt === null || validDate(advisory.withdrawnAt), `${advisory.id}: withdrawnAt은 날짜 또는 null입니다.`);
    assert(['critical', 'high', 'medium', 'low', 'info'].includes(advisory.severity), `${advisory.id}: severity 값이 잘못됐습니다.`);
    assert(Array.isArray(advisory.conditions), `${advisory.id}: conditions 배열이 필요합니다.`);
    for (const alias of list(advisory.aliases)) assert(nonempty(alias), `${advisory.id}: alias는 문자열이어야 합니다.`);
    for (const fix of list(advisory.fixedVersions)) {
      assert(nonempty(fix.version) && ['OSS', 'enterprise-only', 'vendor-only', 'unknown'].includes(fix.channel), `${advisory.id}: fixedVersions의 version/channel을 확인하세요.`);
    }
    const conditionIds = new Set();
    for (const condition of advisory.conditions) {
      assert(nonempty(condition.id) && !conditionIds.has(condition.id) && nonempty(condition.label), `${advisory.id}: 조건 id/label 또는 중복을 확인하세요.`);
      assert(['runtime', 'install', 'build', 'deployment'].includes(condition.phase), `${advisory.id}: 조건 phase가 잘못됐습니다.`);
      conditionIds.add(condition.id);
    }
    assert(isObject(advisory.affected), `${advisory.id}: affected 객체가 필요합니다.`);
    for (const range of list(advisory.affected.numericRanges)) {
      const from = triplet(range.from), through = triplet(range.through);
      assert(from && through && compare(from, through) <= 0, `${advisory.id}: 숫자 3자리의 닫힌 범위(from/through)만 지원합니다.`);
    }
    for (const version of [...list(advisory.affected.exactVersions), ...list(advisory.affected.disputedVersions)]) {
      assert(typeof version === 'string' && EXACT_NUMERIC.test(version), `${advisory.id}: 명시 버전도 숫자 3~4자리만 지원합니다.`);
    }
    for (const branch of list(advisory.affected.knownBranches)) assert(/^\d+\.\d+$/.test(branch), `${advisory.id}: knownBranches는 major.minor입니다.`);
    assert(list(advisory.sources).length > 0, `${advisory.id}: source가 필요합니다.`);
    for (const source of advisory.sources) {
      assert(nonempty(source.title) && /^https:\/\//.test(source.url) && validDate(source.retrievedAt), `${advisory.id}: 출처 title/HTTPS URL/retrievedAt을 확인하세요.`);
    }
    for (const mapping of list(advisory.packageMappings)) {
      assert(nonempty(mapping.ecosystem) && nonempty(mapping.name) && nonempty(mapping.sourceUrl), `${advisory.id}: package mapping은 출처와 정확한 좌표가 필요합니다.`);
    }
  }
}

// Alias groups are deduplicated, but disagreeing records are never silently merged.
function groupAdvisories(records) {
  const groups = [];
  for (const record of records) {
    const tokens = new Set([record.id, ...list(record.aliases)]);
    const matches = groups.filter(group => [...tokens].some(token => group.tokens.has(token)));
    const group = { records: [record], tokens };
    for (const match of matches) {
      group.records.push(...match.records);
      for (const token of match.tokens) group.tokens.add(token);
      groups.splice(groups.indexOf(match), 1);
    }
    groups.push(group);
  }
  return groups.map(group => {
    group.records.sort((a, b) => a.id.localeCompare(b.id));
    const signature = item => ({ product: item.product, kind: item.kind, affected: item.affected,
      packageMappings: list(item.packageMappings), conditions: item.conditions,
      withdrawn: Boolean(item.withdrawnAt), fixedVersions: list(item.fixedVersions) });
    return { ...group, primary: group.records[0], conflict: group.records.some(record =>
      !isDeepStrictEqual(signature(record), signature(group.records[0]))) };
  });
}

function matchProduct(dep, advisory) {
  if (list(advisory.packageMappings).some(mapping => mapping.ecosystem === dep.ecosystem && mapping.name === dep.name)) {
    return { level: 'mapped', evidence: [], reason: '권고에 출처가 있는 정확한 package mapping과 일치합니다.' };
  }
  const supplied = list(dep.productEvidence).find(item => item.product === advisory.product
    && item.version === dep.version && hasLocalEvidence(item.evidence));
  if (supplied) return { level: 'mapped', evidence: evidence(supplied.evidence), reason: '동일 버전의 제품 귀속을 제공된 로컬 근거로 연결했습니다.' };
  const hinted = list(dep.productCandidates).includes(advisory.product)
    || list(dep.productEvidence).some(item => item.product === advisory.product)
    || list(advisory.candidatePackages).some(hint => hint.ecosystem === dep.ecosystem && dep.name.startsWith(hint.prefix));
  return { level: hinted ? 'candidate' : 'unmatched', evidence: [], reason: '제품 후보만 확인됐으며 정확한 package/product 귀속 근거가 없습니다.' };
}

function matchVersion(version, advisory) {
  const affected = advisory.affected;
  // Qualifiers, prereleases, ranges and leading v are not generic SemVer/Maven inputs.
  if (!EXACT_NUMERIC.test(version)) return { state: 'unknown', reason: 'UNSUPPORTED_VERSION', detail: `미지원 버전 표현: ${version}` };
  if (list(affected.disputedVersions).includes(version)) return { state: 'unknown', reason: 'ADVISORY_CONFLICT', detail: '원문에서 버전 정보가 상충하는 값입니다.' };
  const exactAffected = list(affected.exactVersions).includes(version);
  const exactFix = list(advisory.fixedVersions).find(fix => fix.version === version);
  const parts = triplet(version);
  const branch = parts?.slice(0, 2).join('.');
  const knownBranch = list(affected.knownBranches).includes(branch);
  const inRange = parts && knownBranch && list(affected.numericRanges).some(range =>
    compare(parts, triplet(range.from)) >= 0 && compare(parts, triplet(range.through)) <= 0);
  const numericFix = parts && knownBranch && list(advisory.fixedVersions).find(fix => {
    const value = triplet(fix.version);
    return value && value[0] === parts[0] && value[1] === parts[1] && compare(parts, value) >= 0;
  });
  if ((exactAffected || inRange) && (exactFix || numericFix)) return { state: 'unknown', reason: 'ADVISORY_CONFLICT', detail: '이 버전의 영향 범위와 수정 근거가 상충합니다.' };
  if (exactAffected) return { state: 'match', reason: 'EXACT_VERSION', detail: '명시된 영향 버전과 정확히 일치합니다.' };
  if (exactFix) return { state: 'outside', reason: 'EXACT_FIXED_VERSION', detail: `명시된 수정 버전입니다. 제공 채널: ${exactFix.channel}` };
  if (!parts) return { state: 'unknown', reason: 'UNSUPPORTED_VERSION', detail: '숫자 4자리 버전은 명시 목록의 정확한 일치만 지원합니다.' };
  if (!knownBranch) return { state: 'unknown', reason: 'UNVERIFIED_BRANCH', detail: `${branch} 브랜치의 영향 여부를 이 선별 스냅샷으로 확인할 수 없습니다.` };
  if (inRange) {
    return { state: 'match', reason: 'NUMERIC_RANGE', detail: '명시적으로 지원한 숫자 3자리 범위에 포함됩니다.' };
  }
  if (numericFix) return { state: 'outside', reason: 'AT_OR_AFTER_BRANCH_FIX', detail: `같은 브랜치의 공식 수정 ${numericFix.version} 이상입니다. 수정 제공 채널: ${numericFix.channel}` };
  // An exact affected list is not proof that every other version is fixed.
  return { state: 'unknown', reason: 'UNLISTED_VERSION', detail: '알려진 브랜치이지만 영향 범위/수정 근거로 판정되지 않는 버전입니다.' };
}

function normalizeConditions(advisory, assessment) {
  const supplied = isObject(assessment?.conditions) ? assessment.conditions : {};
  return advisory.conditions.map(condition => {
    const item = supplied[condition.id];
    const refs = evidence(item?.evidence);
    const suppliedTruth = item?.value === true || item?.value === false;
    const value = suppliedTruth && hasLocalEvidence(refs) ? item.value : 'unknown';
    return { ...condition, value, evidence: refs,
      note: suppliedTruth && value === 'unknown' ? '값은 제출됐지만 로컬 근거가 없어 보류했습니다.' : '' };
  });
}

function assess(dep, group, assessments) {
  const advisory = group.primary;
  const mappings = group.records.map(record => matchProduct(dep, record));
  const mapping = mappings.find(item => item.level === 'mapped') || mappings.find(item => item.level === 'candidate');
  if (!mapping) return null;
  const candidates = assessments.filter(item => item.dependencyId === dep.id && group.tokens.has(item.advisoryId));
  const assessmentConflict = candidates.length > 1 && candidates.some(item =>
    !isDeepStrictEqual(item.conditions, candidates[0].conditions) || !isDeepStrictEqual(item.runtime, candidates[0].runtime));
  const assessment = candidates[0];
  const conditions = normalizeConditions(advisory, assessment);
  const runtimeRefs = evidence(assessment?.runtime?.evidence).filter(item => item.kind === 'runtime');
  const runtimeReproduced = runtimeRefs.length > 0 && assessment?.runtime?.outcome === 'reproduced';
  const refs = [...evidence(dep.evidence), ...mapping.evidence, ...conditions.flatMap(item => item.evidence), ...runtimeRefs,
    ...group.records.flatMap(record => record.sources.map(source => ({ kind: 'advisory', location: source.url,
      detail: `${record.id}; 게시 ${record.publishedAt}; 갱신 ${record.modifiedAt || '미제공'}; 조회 ${source.retrievedAt}` })))];
  const versionMatch = mapping.level === 'mapped' ? matchVersion(dep.version, advisory)
    : { state: 'unknown', reason: 'UNPROVEN_PRODUCT', detail: '제품 귀속이 확인되기 전에는 버전 범위 매칭을 적용하지 않습니다.' };
  let triageState, status = 'unknown', summary;
  if (group.conflict || assessmentConflict) {
    triageState = 'ADVISORY_CONFLICT'; summary = '동일 ID/alias의 기록 또는 평가가 상충하여 자동 판정을 보류했습니다.';
  } else if (runtimeReproduced && (advisory.withdrawnAt || versionMatch.state === 'outside'
    || conditions.some(item => item.value === false))) {
    triageState = 'EVIDENCE_CONFLICT'; summary = '제공된 실행 재현 근거가 정적 반증·수정 버전 또는 철회 정보와 상충합니다. 배포 시점·버전·재현 범위를 재확인하세요.';
  } else if (advisory.withdrawnAt) {
    triageState = 'ADVISORY_WITHDRAWN'; status = 'not-applicable'; summary = `권고가 ${advisory.withdrawnAt} 철회됐습니다. 이 기록을 활성 취약점으로 집계하지 않습니다.`;
  } else if (mapping.level === 'candidate') {
    triageState = 'PRODUCT_CANDIDATE'; summary = '제품 후보입니다. 정확한 패키지 귀속과 실제 버전 근거를 먼저 확인해야 합니다.';
  } else if (dep.basis === 'declared' || !hasLocalEvidence(dep.evidence)) {
    triageState = 'UNPROVEN_DEPENDENCY'; summary = '선언만 있거나 선택/패키징/실행 버전의 로컬 근거가 없습니다.';
  } else if (versionMatch.state === 'unknown') {
    triageState = versionMatch.reason === 'ADVISORY_CONFLICT' ? 'ADVISORY_CONFLICT' : 'VERSION_UNKNOWN'; summary = versionMatch.detail;
  } else if (versionMatch.state === 'outside') {
    triageState = 'VERSION_OUTSIDE_KNOWN_RANGE'; status = 'not-applicable'; summary = `${versionMatch.detail} 이 권고에 한정한 결과입니다.`;
  } else if (!assessment || !advisory.conditions.length) {
    triageState = 'VERSION_MATCH'; summary = '영향 버전에 일치합니다. 기능·설정·배포 전제의 검토가 아직 없습니다.';
  } else {
    const falseConditions = conditions.filter(item => item.value === false);
    const validRebuttals = advisory.kind === 'malware'
      ? falseConditions.filter(item => item.phase === 'install' || item.phase === 'build') : falseConditions;
    if (validRebuttals.length) {
      triageState = 'REACHABILITY_REBUTTED'; status = 'not-applicable'; summary = '필수 영향 조건이 로컬 근거에서 불성립합니다. 확인한 배포·시점에만 적용되는 반증입니다.';
    } else if (conditions.every(item => item.value === true)) {
      triageState = 'AFFECTED'; status = 'suspected'; summary = '정적 근거에서 권고의 영향 조건이 충족됩니다. 실제 공격 재현을 뜻하지 않습니다.';
      if (runtimeRefs.length && assessment.runtime?.outcome === 'reproduced') {
        status = 'confirmed'; summary = '영향 조건과 제공된 실행 재현 근거를 확인했습니다. 이 스크립트는 네트워크 시험을 수행하지 않았습니다.';
      } else if (runtimeRefs.length && assessment.runtime?.outcome === 'not-reproduced') {
        status = 'not-reproduced'; summary = '정적 영향 조건은 충족되지만 제공된 실행 범위에서 재현되지 않았습니다. 패치 완료나 비영향 판정이 아닙니다.';
      }
    } else {
      triageState = 'REACHABILITY_UNKNOWN'; summary = advisory.kind === 'malware' && falseConditions.length
        ? '런타임 미사용만으로 악성 패키지의 설치·빌드 단계 영향을 배제할 수 없습니다.'
        : '버전은 일치하지만 필수 영향 조건의 근거가 부족합니다.';
    }
  }
  const branch = triplet(dep.version)?.slice(0, 2).join('.');
  const sameBranchFixes = list(advisory.fixedVersions).filter(fix => branch && fix.version.startsWith(`${branch}.`));
  const fix = sameBranchFixes.length
    ? sameBranchFixes.map(item => `공식 수정 후보 ${item.version} (${item.channel}). BOM/호환성/사내 반입 가능 여부를 검토하세요.`)
    : ['현재 브랜치의 검증된 수정 후보가 없습니다. 제품 버전·지원 범위·호환되는 업그레이드 경로를 확인하세요.',
      `다른 브랜치의 공식 수정 목록: ${list(advisory.fixedVersions).map(item => `${item.version} (${item.channel})`).join(', ') || '미제공'}. 현재 브랜치에 바로 적용할 수 있는 패치를 뜻하지 않습니다.`];
  if (advisory.withdrawnAt) fix.splice(0, fix.length, '철회 사유와 관련 후속 권고를 검토하고 활성 취약점 집계에서 분리하세요.');
  return {
    id: `${advisory.id}::${dep.id}`, title: `${advisory.id} · ${advisory.title}`,
    severity: status === 'not-applicable' ? 'info' : advisory.severity === 'critical' ? 'high' : advisory.severity,
    status, triageState, summary, evidence: refs,
    conditions: conditions.map(item => `${item.label}: ${item.value === true ? '충족' : item.value === false ? '불성립' : '확인 못 함'}${item.note ? ` (${item.note})` : ''}`),
    conditionEvidence: conditions, fix,
    retest: ['변경 후 같은 module/configuration의 실제 선택·패키징 버전을 다시 확보하세요.',
      '관련 기능·설정·배포 근거를 갱신하고 기존 사내 테스트로 동작을 검증하세요.',
      '권고의 수정·철회 또는 스냅샷 변경 시 이 판정을 다시 검토하세요.'],
    flow: [{ label: '의존성', detail: `${dep.ecosystem}:${dep.name}@${dep.version} (${dep.basis})` },
      { label: '제품 귀속', detail: mapping.reason }, { label: '버전', detail: versionMatch.detail },
      { label: '판정', detail: `${triageState} / ${status}` }],
    advisoryId: advisory.id, aliases: [...group.tokens].filter(id => id !== advisory.id),
    advisorySeverity: advisory.severity, advisoryKind: advisory.kind,
    publishedAt: advisory.publishedAt, modifiedAt: advisory.modifiedAt, withdrawnAt: advisory.withdrawnAt,
    versionMatch, dependency: { id: dep.id, ecosystem: dep.ecosystem, name: dep.name, version: dep.version,
      basis: dep.basis, configuration: dep.configuration || null },
    sameBranchFixes, availableFixes: list(advisory.fixedVersions), advisoryLimits: list(advisory.limitations)
  };
}

function triage(input, snapshot, options = {}) {
  validate(input, snapshot);
  const generatedAt = options.asOf || new Date().toISOString();
  assert(validDate(generatedAt), 'as-of 날짜가 잘못됐습니다.');
  const maxAge = input.maxSnapshotAgeDays ?? 90;
  assert(Number.isInteger(maxAge) && maxAge >= 0 && maxAge <= 3650, 'maxSnapshotAgeDays는 0~3650 정수입니다.');
  const ageDays = Math.floor((Date.parse(generatedAt) - Date.parse(snapshot.collectedAt)) / 86400000);
  const groups = groupAdvisories(snapshot.advisories);
  const findings = [], coverage = [];
  for (const dep of input.dependencies) {
    const results = groups.map(group => assess(dep, group, list(input.assessments))).filter(Boolean);
    findings.push(...results);
    coverage.push({ target: dep.id, status: results.length ? 'reviewed' : 'unknown',
      detail: results.length ? `${results.length}개 권고/제품 후보와 대조했습니다. 실제 런타임 존재는 basis와 근거를 별도로 확인하세요.`
        : '선별 스냅샷에서 대응 권고를 찾지 못했습니다. 무취약 또는 전체 검사 완료를 뜻하지 않습니다.' });
  }
  assert(findings.length <= 1000, '발견/후보가 1000건을 넘습니다. module/configuration 또는 권고 묶음으로 나눠 판정하세요.');
  const limits = [snapshot.coverageNote, '범용 SemVer/Maven 비교기와 전체 CVE 데이터베이스가 아닙니다.',
    '제품 후보 prefix는 패키지 귀속 증거가 아닙니다. 선언·선택·패키징·실행 버전을 구분합니다.',
    '소스/조건/실행 증거는 입력의 기록을 사용하며 스크립트가 원본 진위 또는 실제 서비스를 독립 검증하지 않습니다.',
    ...list(input.scope?.limitations)];
  if (ageDays > maxAge) limits.push(`스냅샷 수집 후 ${ageDays}일이 지났습니다(기준 ${maxAge}일). 새 권고·범위·철회 정보가 누락될 수 있습니다.`);
  if (ageDays < 0) limits.push('스냅샷 수집 시점이 평가 시점보다 미래입니다. 날짜 근거를 확인하세요.');
  const allSources = snapshot.advisories.flatMap(item => item.sources);
  const sources = [...new Map(allSources.map(source => [source.url, source])).values()];
  return { schema: 'worklens-security-report/v1', title: input.title || '의존성 보안 권고 영향 판정',
    skill: 'dependency-advisory-triage', generatedAt, mode: findings.some(item => ['confirmed', 'not-reproduced'].includes(item.status)) ? 'evidence-review' : 'static',
    scope: { description: input.scope?.description || input.project || '제공된 로컬 의존성 자료',
      targets: list(input.scope?.targets).length ? input.scope.targets : input.dependencies.map(dep => dep.id),
      vantage: input.scope?.vantage || '제공된 로컬 자료와 반입한 권고 스냅샷', limitations: limits },
    findings, coverage, sources, snapshot: { schema: snapshot.schema, collectedAt: snapshot.collectedAt,
      curated: true, advisoryCount: snapshot.advisories.length, deduplicatedCount: groups.length,
      coverageNote: snapshot.coverageNote, ageDays, maxAgeDays: maxAge, stale: ageDays > maxAge,
      provenance: snapshot.provenance || null } };
}

function readJson(file) {
  const stat = fs.statSync(file);
  assert(stat.isFile() && stat.size <= 20 * 1024 * 1024, 'JSON 입력은 20 MiB 이하 일반 파일이어야 합니다.');
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { throw new Error('JSON 파일을 읽거나 해석하지 못했습니다. 입력 내용은 출력하지 않습니다.'); }
}

function main(args) {
  if (args.includes('--help')) {
    process.stdout.write('사용법: node scripts/triage.cjs --input 입력.json [--snapshot 권고.json] [--out 새결과.json] [--as-of ISO날짜]\n로컬 JSON만 읽습니다. 네트워크/패키지 설치/서비스 시험을 수행하지 않습니다.\n');
    return;
  }
  const opts = {};
  for (let i = 0; i < args.length; i += 2) {
    assert(['--input', '--snapshot', '--out', '--as-of'].includes(args[i]) && nonempty(args[i + 1]), '지원하지 않는 옵션 또는 값 누락입니다. --help를 확인하세요.');
    assert(opts[args[i]] === undefined, '옵션이 중복됐습니다.');
    opts[args[i]] = args[i + 1];
  }
  assert(opts['--input'], '--input이 필요합니다. Agent가 기존 로컬 자료에서 입력 초안을 작성하세요.');
  const snapshotPath = opts['--snapshot'] || DEFAULT_SNAPSHOT;
  const report = triage(readJson(opts['--input']), readJson(snapshotPath), { asOf: opts['--as-of'] });
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (opts['--out']) {
    const out = path.resolve(opts['--out']);
    assert(out !== path.resolve(opts['--input']) && out !== path.resolve(snapshotPath), '입력 또는 스냅샷을 덮어쓸 수 없습니다.');
    fs.writeFileSync(out, json, { encoding: 'utf8', flag: 'wx' });
    process.stdout.write(`보고서 저장: ${out}\n`);
  } else process.stdout.write(json);
}

if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { process.stderr.write(`판정 중단: ${error.message}\n`); process.exitCode = 2; }
}

module.exports = { triage, matchVersion, groupAdvisories, DEFAULT_SNAPSHOT };

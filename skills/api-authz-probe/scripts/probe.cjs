#!/usr/bin/env node
'use strict';

// Node 22+, standard libraries only. Never follow redirects or use ambient proxies.
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const {setTimeout: delay} = require('node:timers/promises');
const {performance} = require('node:perf_hooks');

const SCHEMA = 'worklens-api-probe/v1';
const REPORT_SCHEMA = 'worklens-security-report/v1';
const DEFAULT_LIMITS = Object.freeze({maxRequests:30, minIntervalMs:500, timeoutMs:3000, maxBodyBytes:32768, maxDurationMs:60000});
const SAFE_ID = /^[a-z][a-z0-9-]{0,63}$/;
const SAFE_ENV = /^[A-Z][A-Z0-9_]{0,63}$/;
const SYNTHETIC = /^WL_SYNTHETIC_[A-Za-z0-9_-]{1,100}$/;
const METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
const READ_METHODS = new Set(['GET', 'HEAD']);
const DENIALS = new Set([401, 403, 404]);
const CREDENTIAL_HEADERS = new Set(['Authorization', 'Cookie', 'X-API-Key']);

class ProbeError extends Error {
  constructor(code, message) { super(message); this.name = 'ProbeError'; this.code = code; }
}
function fail(code, message) { throw new ProbeError(code, message); }
function object(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) fail(code, '객체 형식이 필요합니다.');
}
function keys(value, allowed, code) {
  object(value, code);
  if (Object.keys(value).some(key => !allowed.includes(key))) fail(code, '지원하지 않는 필드가 있습니다. 문서의 매니페스트 형식을 확인하세요.');
}
function id(value) { if (typeof value !== 'string' || !SAFE_ID.test(value)) fail('INVALID_ID', 'ID는 소문자로 시작하는 영문·숫자·하이픈 1–64자여야 합니다.'); }
function textField(value, max, code) { if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail(code, '텍스트 필드의 형식 또는 길이가 잘못되었습니다.'); }
function originOf(value) {
  if (typeof value !== 'string' || value.length > 1024) fail('INVALID_ORIGIN', '정확한 HTTP(S) origin이 필요합니다.');
  let url;
  try { url = new URL(value); } catch { fail('INVALID_ORIGIN', 'origin을 해석할 수 없습니다.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash || url.origin !== value) fail('INVALID_ORIGIN', 'origin에는 정규화된 스킴·호스트·포트만 넣으세요. 사용자정보·경로·쿼리·끝 슬래시는 허용하지 않습니다.');
  return url;
}
function exactPath(path, origin) {
  if (typeof path !== 'string' || path.length < 1 || path.length > 2048 || !path.startsWith('/') || path.startsWith('//') || /[\s\\#\u0000-\u001f\u007f]/.test(path)) fail('INVALID_PATH', '경로는 절대 URL이 아닌 명시적인 /경로와 선택적 쿼리여야 합니다.');
  const pathname = path.split('?')[0];
  if (pathname.includes('//') || /%(?:2e|2f|5c|25|0[0-9a-f]|1[0-9a-f]|7f)/i.test(pathname) || /%(?![0-9a-f]{2})/i.test(path)) fail('INVALID_PATH', '모호한 인코딩·중복 슬래시·제어문자가 있는 경로는 허용하지 않습니다.');
  let url;
  try { url = new URL(path, origin); } catch { fail('INVALID_PATH', '경로를 해석할 수 없습니다.'); }
  if (url.origin !== origin || url.pathname + url.search !== path || url.hash || url.username || url.password) fail('INVALID_PATH', '정규화로 바뀌는 경로 또는 origin 밖의 경로는 허용하지 않습니다.');
  return path;
}
function markerOf(marker) {
  if (marker === undefined) return null;
  keys(marker, ['pointer', 'header', 'equals'], 'INVALID_MARKER');
  if (typeof marker.equals !== 'string' || !SYNTHETIC.test(marker.equals)) fail('INVALID_MARKER', '합성 데이터 마커는 WL_SYNTHETIC_ 접두어가 있는 문자열이어야 합니다.');
  if ((marker.pointer !== undefined) === (marker.header !== undefined)) fail('INVALID_MARKER', 'JSON pointer 또는 합성 마커 헤더 중 하나만 지정하세요.');
  if (marker.header !== undefined) {
    if (marker.header !== 'x-worklens-synthetic-marker') fail('INVALID_MARKER', 'HEAD 검사용 마커 헤더는 x-worklens-synthetic-marker만 지원합니다.');
    return {header:marker.header, equals:marker.equals};
  }
  if (typeof marker.pointer !== 'string' || !marker.pointer.startsWith('/') || marker.pointer.length > 256 || /~(?![01])/.test(marker.pointer) || /[\u0000-\u001f]/.test(marker.pointer)) fail('INVALID_MARKER', '마커에는 올바른 JSON pointer가 필요합니다.');
  const parts = marker.pointer.slice(1).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'));
  if (parts.some(part => ['__proto__', 'prototype', 'constructor'].includes(part))) fail('INVALID_MARKER', '지원하지 않는 JSON pointer 항목입니다.');
  return {pointer:marker.pointer, equals:marker.equals};
}
function sourceOf(source) {
  if (source === undefined) return null;
  keys(source, ['path', 'line'], 'INVALID_SOURCE');
  if (typeof source.path !== 'string' || source.path.length > 256 || /[\u0000-\u001f\u007f\\]/.test(source.path) || source.path.startsWith('/') || source.path.split('/').some(part => part === '..' || part === '.')) fail('INVALID_SOURCE', '소스 위치는 비밀정보 없는 프로젝트 상대 경로여야 합니다.');
  if (!Number.isSafeInteger(source.line) || source.line < 1) fail('INVALID_SOURCE', '소스 행 번호가 필요합니다.');
  return {path:source.path, line:source.line};
}
function validateManifest(input) {
  keys(input, ['schema', 'mode', 'scope', 'limits', 'principals', 'calibrations', 'routes'], 'INVALID_MANIFEST');
  if (input.schema !== SCHEMA) fail('INVALID_SCHEMA', '지원하지 않는 매니페스트 버전입니다.');
  if (!['local-demo', 'authorized-live'].includes(input.mode)) fail('INVALID_MODE', 'mode는 local-demo 또는 authorized-live여야 합니다.');
  keys(input.scope, ['origin', 'authorizationConfirmed', 'description', 'vantage'], 'INVALID_SCOPE');
  const origin = originOf(input.scope.origin);
  if (typeof input.scope.authorizationConfirmed !== 'boolean') fail('INVALID_SCOPE', 'scope.authorizationConfirmed를 true 또는 false로 명시하세요.');
  if (input.scope.description !== undefined) textField(input.scope.description, 500, 'INVALID_SCOPE');
  if (input.scope.vantage !== undefined && !['loopback', 'internal', 'external', 'unknown'].includes(input.scope.vantage)) fail('INVALID_SCOPE', 'vantage는 loopback/internal/external/unknown 중 하나여야 합니다.');
  if (input.mode === 'local-demo' && !['127.0.0.1', '[::1]'].includes(origin.hostname)) fail('INVALID_DEMO_ORIGIN', 'local-demo는 숫자 loopback 주소만 허용합니다.');
  const limits = {...DEFAULT_LIMITS};
  if (input.limits !== undefined) {
    keys(input.limits, Object.keys(DEFAULT_LIMITS), 'INVALID_LIMITS');
    Object.assign(limits, input.limits);
  }
  const ranges = {maxRequests:[1,100], minIntervalMs:[100,10000], timeoutMs:[100,30000], maxBodyBytes:[256,262144], maxDurationMs:[100,300000]};
  for (const [key, [min, max]] of Object.entries(ranges)) if (!Number.isSafeInteger(limits[key]) || limits[key] < min || limits[key] > max) fail('INVALID_LIMITS', '요청수·간격·시간·본문 크기 제한이 허용 범위를 벗어났습니다.');
  if (!Array.isArray(input.principals) || input.principals.length < 2 || input.principals.length > 12) fail('INVALID_PRINCIPALS', '익명과 테스트 계정을 포함한 2–12개의 principal이 필요합니다.');
  const principals = new Map();
  for (const principal of input.principals) {
    keys(principal, ['id', 'kind', 'credential'], 'INVALID_PRINCIPAL'); id(principal.id);
    if (principals.has(principal.id)) fail('DUPLICATE_ID', 'principal ID가 중복됩니다.');
    if (principal.kind === 'anonymous') {
      if (principal.credential !== undefined) fail('INVALID_CREDENTIAL', '익명 principal에는 인증정보를 지정할 수 없습니다.');
      principals.set(principal.id, {id:principal.id, kind:'anonymous'});
    } else if (principal.kind === 'authenticated') {
      keys(principal.credential, ['header', 'env'], 'INVALID_CREDENTIAL');
      if (!CREDENTIAL_HEADERS.has(principal.credential.header) || typeof principal.credential.env !== 'string' || !SAFE_ENV.test(principal.credential.env)) fail('INVALID_CREDENTIAL', '인증정보에는 허용된 헤더명과 환경변수 이름만 지정하세요.');
      principals.set(principal.id, {id:principal.id, kind:'authenticated', credential:{...principal.credential}});
    } else fail('INVALID_PRINCIPAL', 'principal.kind가 잘못되었습니다.');
  }
  const anonymous = [...principals.values()].filter(principal => principal.kind === 'anonymous');
  if (anonymous.length !== 1) fail('INVALID_PRINCIPALS', '익명 principal은 정확히 하나여야 합니다.');
  const routeIds = new Set();
  function routesOf(items, calibration) {
    if (!Array.isArray(items) || items.length < 1 || items.length > 100) fail('INVALID_ROUTES', '각 경로 목록에는 1–100개의 항목이 필요합니다.');
    return items.map(route => {
      keys(route, ['id', 'method', 'path', 'sideEffectFreeConfirmed', 'source', 'policyNote', 'baselineCaseId', 'cases'], 'INVALID_ROUTE'); id(route.id);
      if (routeIds.has(route.id)) fail('DUPLICATE_ID', '경로 ID가 중복됩니다.');
      routeIds.add(route.id);
      if (!METHODS.has(route.method)) fail('INVALID_METHOD', '지원하지 않는 HTTP 메서드입니다.');
      exactPath(route.path, origin.origin);
      if (typeof route.sideEffectFreeConfirmed !== 'boolean') fail('INVALID_ROUTE', 'sideEffectFreeConfirmed를 true 또는 false로 명시하세요.');
      if (route.policyNote !== undefined) textField(route.policyNote, 500, 'INVALID_POLICY');
      const source = sourceOf(route.source);
      if (!Array.isArray(route.cases) || route.cases.length < 1 || route.cases.length > 30) fail('INVALID_CASES', '경로당 1–30개의 검증 사례가 필요합니다.');
      const caseIds = new Set();
      const cases = route.cases.map(item => {
        keys(item, ['id', 'principal', 'expect', 'policyConfirmed', 'marker', 'deniedStatuses'], 'INVALID_CASE'); id(item.id);
        if (caseIds.has(item.id)) fail('DUPLICATE_ID', '같은 경로의 사례 ID가 중복됩니다.');
        caseIds.add(item.id);
        if (!principals.has(item.principal) || !['allow', 'deny', 'unknown'].includes(item.expect) || typeof item.policyConfirmed !== 'boolean') fail('INVALID_CASE', '사례의 principal·기대 결과·정책 확인 여부를 확인하세요.');
        const marker = markerOf(item.marker);
        const deniedStatuses = item.deniedStatuses === undefined ? [401,403] : item.deniedStatuses;
        if (!Array.isArray(deniedStatuses) || !deniedStatuses.length || deniedStatuses.some(status => !DENIALS.has(status)) || new Set(deniedStatuses).size !== deniedStatuses.length) fail('INVALID_DENIALS', '차단 상태는 401·403·404 중 중복 없이 지정하세요.');
        if (item.expect === 'allow' && !marker) fail('INVALID_CASE', '허용 기준 요청에는 합성 데이터 마커가 필요합니다.');
        return {id:item.id, principal:item.principal, expect:item.expect, policyConfirmed:item.policyConfirmed, marker, deniedStatuses};
      });
      if (calibration) {
        if (route.baselineCaseId !== undefined) fail('INVALID_CALIBRATION', '교정 경로에는 baselineCaseId를 넣지 마세요.');
        if (cases.some(item => principals.get(item.principal).kind === 'anonymous' ? item.expect !== 'deny' : item.expect !== 'allow')) fail('INVALID_CALIBRATION', '교정은 익명 차단과 인증 계정별 신원 마커를 확인해야 합니다.');
      } else {
        const baseline = cases.find(item => item.id === route.baselineCaseId);
        if (!baseline || baseline.expect !== 'allow' || principals.get(baseline.principal).kind !== 'authenticated') fail('INVALID_BASELINE', '각 업무 경로에는 인증 계정의 허용 baselineCaseId가 필요합니다.');
        if (cases.some(item => item.expect === 'deny' && item.marker && (item.marker.equals !== baseline.marker.equals || item.marker.pointer !== baseline.marker.pointer || item.marker.header !== baseline.marker.header))) fail('INVALID_MARKER_BASELINE', '차단 사례는 같은 객체의 정상 baseline과 동일한 합성 마커 위치·값을 확인해야 합니다.');
      }
      return {id:route.id, method:route.method, path:route.path, sideEffectFreeConfirmed:route.sideEffectFreeConfirmed, source, cases, baselineCaseId:route.baselineCaseId, calibration};
    });
  }
  const calibrations = routesOf(input.calibrations, true);
  const routes = routesOf(input.routes, false);
  const allCalibrationCases = calibrations.flatMap(route => route.cases);
  for (const principal of principals.values()) if (!allCalibrationCases.some(item => item.principal === principal.id)) fail('MISSING_CALIBRATION', '모든 principal의 교정 사례가 필요합니다.');
  const identities = new Map();
  for (const item of allCalibrationCases.filter(item => principals.get(item.principal).kind === 'authenticated')) {
    if (identities.has(item.marker.equals) && identities.get(item.marker.equals) !== item.principal) fail('INVALID_CALIBRATION', '서로 다른 계정의 신원 교정 마커는 달라야 합니다.');
    identities.set(item.marker.equals, item.principal);
  }
  return {schema:SCHEMA, mode:input.mode, scope:{origin:origin.origin, authorizationConfirmed:input.scope.authorizationConfirmed, vantage:input.scope.vantage || 'unknown'}, limits, principals, calibrations, routes, anonymous:anonymous[0].id};
}
function markerMatches(json, marker) {
  if (!marker || !marker.pointer) return false;
  let value = json;
  for (const part of marker.pointer.slice(1).split('/').map(item => item.replace(/~1/g, '/').replace(/~0/g, '~'))) {
    if (!value || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, part)) return false;
    value = value[part];
  }
  return typeof value === 'string' && value === marker.equals;
}
function contentKind(value) {
  if (typeof value !== 'string') return 'other';
  const type = value.split(';')[0].trim().toLowerCase();
  if (type === 'application/json' || /^application\/[a-z0-9!#$&^_.+-]+\+json$/.test(type)) return 'json';
  return type === 'text/html' ? 'html' : 'other';
}
function requestOnce(manifest, route, item, credential, timeoutMs) {
  // Construct from validated, exact allowlisted components only; no URL from responses.
  exactPath(route.path, manifest.scope.origin);
  const url = new URL(manifest.scope.origin);
  const transport = url.protocol === 'https:' ? https : http;
  const headers = {Accept:'application/json', 'Accept-Encoding':'identity', 'Cache-Control':'no-store', Pragma:'no-cache', 'User-Agent':'Worklens-API-Authz-Probe/1'};
  const principal = manifest.principals.get(item.principal);
  if (credential !== null) headers[principal.credential.header] = credential;
  return new Promise(resolve => {
    let finished = false, req, timer, bytesRead = 0, status = null, kind = 'other';
    const finish = result => {
      if (finished) return;
      finished = true; clearTimeout(timer);
      resolve({sent:true, status, bytesRead, contentKind:kind, markerMatched:false, error:null, ...result});
    };
    try {
      req = transport.request({protocol:url.protocol, hostname:url.hostname.replace(/^\[|\]$/g, ''), port:url.port || undefined, path:route.path, method:route.method, headers, agent:false, rejectUnauthorized:true, maxHeaderSize:16384}, res => {
        status = res.statusCode; kind = contentKind(res.headers['content-type']);
        if (status >= 300 && status < 400) {
          finish({error:'REDIRECT_BLOCKED'}); res.destroy(); req.destroy(); return;
        }
        const headerMarker = item.marker && item.marker.header ? res.headers[item.marker.header] === item.marker.equals : false;
        const chunks = [];
        res.on('data', chunk => {
          if (finished) return;
          if (bytesRead + chunk.length > manifest.limits.maxBodyBytes) {
            bytesRead = manifest.limits.maxBodyBytes;
            finish({error:'BODY_LIMIT'}); res.destroy(); req.destroy(); return;
          }
          bytesRead += chunk.length;
          // Only bounded JSON bodies need storage. Never emit or persist bodies/headers.
          if (kind === 'json' && item.marker && item.marker.pointer) chunks.push(chunk);
        });
        res.on('end', () => {
          if (finished) return;
          let matched = headerMarker;
          if (kind === 'json' && item.marker && item.marker.pointer) {
            try { matched = markerMatches(JSON.parse(Buffer.concat(chunks).toString('utf8')), item.marker); } catch { matched = false; }
          }
          finish({markerMatched:matched});
        });
        res.on('aborted', () => finish({error:'INCOMPLETE_RESPONSE'}));
        res.on('error', () => finish({error:'NETWORK_ERROR'}));
      });
      // A wall-clock deadline includes DNS, connection, TLS and response streaming.
      timer = setTimeout(() => { finish({error:'TIMEOUT'}); req.destroy(); }, timeoutMs);
      req.on('error', () => finish({error:'NETWORK_ERROR'}));
      req.end();
    } catch { if (req) req.destroy(); finish({error:'REQUEST_ERROR'}); }
  });
}
function coverageCounts(report) {
  const counts = {total:report.coverage.length, tested:0, skipped:0, unknown:0};
  for (const row of report.coverage) counts[row.status]++;
  return counts;
}
const REASONS = Object.freeze({
  PLAN:'계획만 생성함. HTTP 요청 0건.',
  WRITE_METHOD:'자동 실행 제외: GET/HEAD 외 메서드. 별도 승인된 샌드박스 절차가 필요함.',
  SIDE_EFFECT_UNKNOWN:'자동 실행 제외: 사용자 맥락에서 부작용 없음이 확인되지 않음.',
  POLICY_UNKNOWN:'기대 권한 정책이 확인되지 않아 요청하지 않음.',
  CREDENTIAL_MISSING:'테스트 계정 환경변수가 없거나 안전한 헤더 값 형식이 아님. 값은 출력하지 않음.',
  CALIBRATION_FAILED:'익명/유효 계정 교정이 충족되지 않아 요청하지 않음.',
  BASELINE_FAILED:'같은 객체의 정상 허용 baseline이 성립하지 않아 요청하지 않음.',
  REQUEST_LIMIT:'설정된 총 요청수에 도달하여 요청하지 않음.',
  DURATION_LIMIT:'설정된 총 실행 시간에 도달하여 요청하지 않음.',
  REDIRECT_BLOCKED:'리다이렉트 응답을 차단함. Location을 사용하거나 기록하지 않음.',
  BODY_LIMIT:'응답 본문 제한에 도달하여 연결을 종료함. 본문은 기록하지 않음.',
  TIMEOUT:'요청 전체 제한 시간에 도달함. 재시도하지 않음.',
  NETWORK_ERROR:'네트워크/TLS 오류. 상세 메시지·인증정보는 기록하지 않음.',
  REQUEST_ERROR:'요청 생성 오류. 입력 값은 기록하지 않음.',
  INCOMPLETE_RESPONSE:'응답이 완전히 수신되지 않아 판정하지 않음.'
});
async function run(input, options = {}) {
  const manifest = validateManifest(input);
  const execute = options.execute === true;
  if (execute && !manifest.scope.authorizationConfirmed) fail('SCOPE_NOT_AUTHORIZED', '현재 사용자 맥락에서 대상·범위가 승인되지 않았습니다. 계획 보고서까지만 생성하세요.');
  const env = options.env || process.env;
  const observations = new Map(), credentials = new Map();
  let requestsSent = 0, lastStart = -Infinity;
  const started = performance.now();
  const keyOf = (route, item) => route.id + '/' + item.id;
  const allRoutes = [...manifest.calibrations, ...manifest.routes];
  function pending(route, item, error, skipped = false) { observations.set(keyOf(route,item), {sent:false, error, skipped, status:null, markerMatched:false, bytesRead:0, contentKind:'other'}); }
  function runnable(route, item) {
    if (!READ_METHODS.has(route.method)) return ['WRITE_METHOD', true];
    if (!route.sideEffectFreeConfirmed) return ['SIDE_EFFECT_UNKNOWN', true];
    if (item.expect === 'unknown' || !item.policyConfirmed) return ['POLICY_UNKNOWN', false];
    return null;
  }
  function credentialFor(principal) {
    if (principal.kind === 'anonymous') return {valid:true, value:null};
    if (!credentials.has(principal.id)) {
      const value = env[principal.credential.env];
      const valid = typeof value === 'string' && value.length > 0 && value.length <= 8192 && !/[\u0000-\u001f\u007f-\uffff]/.test(value);
      credentials.set(principal.id, {valid, value:valid ? value : null});
    }
    return credentials.get(principal.id);
  }
  async function executeCase(route, item) {
    const blocked = runnable(route, item);
    if (blocked) { pending(route, item, ...blocked); return; }
    const credential = credentialFor(manifest.principals.get(item.principal));
    if (!credential.valid) { pending(route,item,'CREDENTIAL_MISSING'); return; }
    if (requestsSent >= manifest.limits.maxRequests) { pending(route,item,'REQUEST_LIMIT',true); return; }
    const waitMs = Math.max(0, manifest.limits.minIntervalMs - (performance.now() - lastStart));
    if (performance.now() - started + waitMs >= manifest.limits.maxDurationMs) { pending(route,item,'DURATION_LIMIT',true); return; }
    // Timers may round down; enforce the minimum against the monotonic clock.
    while (performance.now() - lastStart < manifest.limits.minIntervalMs) await delay(Math.ceil(manifest.limits.minIntervalMs - (performance.now() - lastStart)));
    const remaining = manifest.limits.maxDurationMs - (performance.now() - started);
    if (remaining < 1) { pending(route,item,'DURATION_LIMIT',true); return; }
    requestsSent++; lastStart = performance.now();
    observations.set(keyOf(route,item), await requestOnce(manifest,route,item,credential.value,Math.max(1, Math.min(manifest.limits.timeoutMs, remaining))));
  }
  function accepted(route, item) {
    const observation = observations.get(keyOf(route,item));
    if (!observation || !observation.sent || observation.error) return false;
    return item.expect === 'allow'
      ? observation.status >= 200 && observation.status < 300 && observation.markerMatched
      : item.deniedStatuses.includes(observation.status) && !observation.markerMatched;
  }
  function calibrated(principalId) {
    const checks = manifest.calibrations.flatMap(route => route.cases.filter(item => item.principal === principalId).map(item => [route,item]));
    return checks.length > 0 && checks.every(([route,item]) => accepted(route,item));
  }
  if (!execute) {
    for (const route of allRoutes) for (const item of route.cases) {
      const blocked = runnable(route,item);
      pending(route,item,blocked ? blocked[0] : 'PLAN', Boolean(blocked && blocked[1]));
    }
  } else {
    for (const route of manifest.calibrations) for (const item of route.cases) await executeCase(route,item);
    for (const route of manifest.routes) {
      const baseline = route.cases.find(item => item.id === route.baselineCaseId);
      for (const item of [baseline, ...route.cases.filter(item => item !== baseline)]) {
        const blocked = runnable(route,item);
        if (blocked) { pending(route,item,...blocked); continue; }
        if (!calibrated(manifest.anonymous) || !calibrated(item.principal) || !calibrated(baseline.principal)) { pending(route,item,'CALIBRATION_FAILED'); continue; }
        if (item !== baseline && !accepted(route,baseline)) { pending(route,item,'BASELINE_FAILED'); continue; }
        await executeCase(route,item);
      }
    }
  }
  const coverage = [], findings = [];
  for (const route of allRoutes) for (const item of route.cases) {
    const observation = observations.get(keyOf(route,item));
    const location = keyOf(route,item);
    const stats = observation.sent ? `HTTP ${observation.status === null ? '미수신' : observation.status}; 본문 ${observation.bytesRead}바이트 이내; 형식 ${observation.contentKind}; 합성 마커 ${observation.markerMatched ? '일치' : '불일치/없음'}. 원문·헤더 값은 저장하지 않음.` : 'HTTP 요청하지 않음.';
    const isConfirmed = !route.calibration && item.expect === 'deny' && item.policyConfirmed && item.marker && observation.sent && !observation.error && observation.markerMatched;
    const isAccepted = accepted(route,item);
    const resolved = isConfirmed || isAccepted;
    const detail = [REASONS[observation.error] || '', stats, !observation.error && !resolved ? '권한 결과를 확정할 증거가 부족함. 200·로그인 HTML·마커 부재만으로 취약/안전을 판정하지 않음.' : ''].filter(Boolean).join(' ');
    coverage.push({target:location, status:observation.skipped ? 'skipped' : resolved ? 'tested' : 'unknown', detail});
    if (!route.calibration && item.expect !== 'allow') {
      const status = isConfirmed ? 'confirmed' : isAccepted && item.expect === 'deny' ? 'not-reproduced' : 'unknown';
      const evidence = [{kind:observation.sent ? 'runtime' : 'trace', location, detail}];
      if (isConfirmed) {
        evidence.unshift({kind:'runtime', location:route.id + '/' + route.baselineCaseId, detail:'유효 계정 신원 교정과 동일 객체의 정상 허용 baseline에서 합성 마커 일치를 확인함.'});
        evidence.unshift({kind:'runtime', location:'calibration', detail:'익명 차단 및 관련 인증 계정의 서로 다른 신원 마커 교정을 완료함.'});
      }
      if (route.source) evidence.push({kind:'source',location:route.source.path + ':' + route.source.line,detail:'매니페스트에 선언된 소스 위치. 이 HTTP 러너는 소스를 재분석하지 않음.'});
      findings.push({id:'authz-' + route.id + '-' + item.id, title:isConfirmed ? '차단 대상에 합성 객체 정보 노출' : status === 'not-reproduced' ? '이번 테스트 사례에서 접근 차단 확인' : '접근 권한 판정 미확정', severity:isConfirmed ? 'high' : 'info', status, summary:isConfirmed ? '사용자가 확인한 차단 정책과 달리 지정한 합성 데이터가 응답에서 확인됨. 실제 개인정보는 수집하지 않음.' : status === 'not-reproduced' ? '지정한 계정·객체·메서드·시점에서 차단 결과를 확인함. 다른 경로나 입력의 안전성을 보증하지 않음.' : '현재 증거로 취약 또는 안전을 확정하지 않음.', evidence,
        conditions:['사용자가 확인한 범위와 테스트 객체에만 해당함.', '인가 정책·메서드·조직·객체 소유권 조건은 매니페스트 작성 근거와 함께 검토해야 함.'],
        fix:isConfirmed ? ['Controller 인증 설정과 서비스의 객체·조직·역할별 권한 검사를 함께 보완하세요.', '권한 없는 응답의 민감 필드 노출을 차단하고 같은 테스트 데이터를 유지하세요.'] : [],
        retest:['같은 principal·테스트 객체·메서드·정책으로 익명/유효 계정 교정부터 다시 수행하세요.', '새 요청에 대한 승인 범위와 부작용 없음이 유지되는지 확인하세요.'],
        flow:[{label:'정책',detail:'테스트 사례의 기대 허용/차단과 합성 마커를 선언함.'},{label:'교정',detail:'익명 차단과 계정별 신원 및 정상 baseline을 확인함.'},{label:'관측',detail:stats},{label:'판정',detail:status}]
      });
    }
  }
  const report = {schema:REPORT_SCHEMA,title:'API 인증·권한 검증 보고서',skill:'api-authz-probe',generatedAt:new Date().toISOString(),mode:execute ? manifest.mode : 'static',scope:{description:execute ? '명시한 단일 origin과 정확한 경로·메서드·테스트 계정에 대한 제한 검증' : '네트워크 요청 없이 매니페스트와 미검증 범위를 정리한 계획',targets:manifest.routes.map(route=>route.id),vantage:execute ? manifest.scope.vantage : 'unknown',limitations:['외부 노출 여부는 이 보고서만으로 확정하지 않음.', '리다이렉트·변경 메서드·미확인 부작용 API·임의 ID 탐색은 자동 실행하지 않음.', '응답 원문, 인증정보, Cookie, 토큰, 합성 마커 값은 출력하거나 저장하지 않음.', '문서에 없는 경로·계정·객체·Content-Type은 검증 범위 밖임.']},findings,coverage,sources:[]};
  const counts = coverageCounts(report);
  report.scope.limitations.push(`커버리지 분모 ${counts.total}건: tested ${counts.tested}, skipped ${counts.skipped}, unknown ${counts.unknown}; 실제 HTTP 요청 ${requestsSent}건. 교정과 업무 사례를 모두 포함함.`);
  // Credentials never enter the report; do not serialize observations or manifests.
  credentials.clear();
  return report;
}
function cliArgs(argv) {
  const args = {execute:false};
  for (let index=0; index<argv.length; index++) {
    const arg = argv[index];
    if (arg === '--help') return {help:true};
    if (arg === '--plan' || arg === '--execute') {
      if (args.action) fail('INVALID_ARGUMENT', '--plan과 --execute 중 하나만 지정하세요.');
      args.action = arg; args.execute = arg === '--execute';
    } else if (arg === '--manifest' || arg === '--out') {
      const key = arg === '--manifest' ? 'manifest' : 'out';
      if (args[key] || !argv[index+1] || argv[index+1].startsWith('--')) fail('INVALID_ARGUMENT', '파일 인자가 누락되었거나 중복되었습니다.');
      args[key] = argv[++index];
    } else fail('INVALID_ARGUMENT', '지원하지 않는 실행 인자입니다.');
  }
  if (!args.manifest || !args.out) fail('INVALID_ARGUMENT', '--manifest와 --out을 지정하세요. 기본 동작은 계획 생성입니다.');
  return args;
}
async function main(argv = process.argv.slice(2)) {
  let outputFd = null, reservedPath = null;
  try {
    const args = cliArgs(argv);
    if (args.help) { process.stdout.write('사용법: node probe.cjs --manifest manifest.json --plan|--execute --out report.json\n기본값: --plan, HTTP 요청 0건. 실행: 명시적 --execute와 승인된 scope 필요.\n'); return 0; }
    let input;
    try {
      if (fs.statSync(args.manifest).size > 1048576) fail('MANIFEST_SIZE', '매니페스트는 1 MiB 이하여야 합니다.');
      input = JSON.parse(fs.readFileSync(args.manifest,'utf8'));
    } catch (error) { if (error instanceof ProbeError) throw error; fail('MANIFEST_READ', '매니페스트를 읽거나 JSON을 해석하지 못했습니다. 내용은 출력하지 않습니다.'); }
    validateManifest(input);
    // Reserve a new destination before sending any request: a failed export must not trigger a repeat probe.
    try { outputFd = fs.openSync(args.out,'wx',0o600); reservedPath = args.out; }
    catch { fail('REPORT_WRITE', '새 보고서 파일을 준비하지 못했습니다. 기존 파일을 덮어쓰지 않는 새 경로를 사용하세요. HTTP 요청은 보내지 않았습니다.'); }
    const report = await run(input,{execute:args.execute});
    try { fs.writeFileSync(outputFd, JSON.stringify(report,null,2) + '\n'); fs.closeSync(outputFd); outputFd = null; reservedPath = null; }
    catch { fail('REPORT_WRITE', '보고서를 저장하지 못했습니다. 이미 수행된 요청이 있을 수 있으므로 자동 재실행하지 마세요.'); }
    process.stdout.write(JSON.stringify({mode:report.mode,coverage:coverageCounts(report),confirmed:report.findings.filter(item=>item.status === 'confirmed').length}) + '\n');
    return 0;
  } catch (error) {
    if (outputFd !== null) { try { fs.closeSync(outputFd); } catch {} }
    if (reservedPath !== null) { try { fs.unlinkSync(reservedPath); } catch {} }
    const safe = error instanceof ProbeError ? error : new ProbeError('UNEXPECTED_ERROR','실행을 완료하지 못했습니다. 비밀정보 보호를 위해 상세 오류는 출력하지 않습니다.');
    process.stderr.write(JSON.stringify({error:safe.code,message:safe.message}) + '\n'); return 1;
  }
}
module.exports = {validateManifest, run, coverageCounts, markerMatches, main, DEFAULT_LIMITS};
if (require.main === module) main().then(code => {process.exitCode = code;});

'use strict';

// Original, inert teaching fixture. Never use the vulnerable functions in an application.
// The local-demo runner supplies only its own fixed inputs and temporary files.
const fs = require('node:fs');
const path = require('node:path');
const BASE_URL = 'https://inventory.example.invalid/';
const SORT_COLUMNS = Object.freeze({ id: 'id', name: 'display_name', created: 'created_at' });

function deny(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function text(value, label) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 256) {
    throw new TypeError(label + ': 1~256자의 문자열이 필요합니다.');
  }
  return value;
}

function queryVulnerable(sort) {
  return 'SELECT id, display_name FROM demo_users ORDER BY ' + text(sort, '정렬값');
}

function queryFixed(sortKey, direction) {
  text(sortKey, '정렬 키');
  if (!Object.prototype.hasOwnProperty.call(SORT_COLUMNS, sortKey)) {
    deny('SORT_KEY_DENIED', '허용하지 않은 정렬 키입니다.');
  }
  if (direction !== 'asc' && direction !== 'desc') {
    deny('SORT_DIRECTION_DENIED', '정렬 방향은 asc 또는 desc만 허용합니다.');
  }
  return 'SELECT id, display_name FROM demo_users ORDER BY ' +
    SORT_COLUMNS[sortKey] + ' ' + direction.toUpperCase();
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (relative !== '..' &&
    !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
}

function readVulnerable(root, relativeName) {
  const candidate = path.resolve(root, text(relativeName, '파일명'));
  return { path: candidate, content: fs.readFileSync(candidate, 'utf8') };
}

function readFixed(root, relativeName) {
  text(relativeName, '파일명');
  if (path.isAbsolute(relativeName)) deny('FILE_ABSOLUTE_DENIED', '상대 파일명만 허용합니다.');
  const canonicalRoot = fs.realpathSync(root);
  const candidate = path.resolve(canonicalRoot, relativeName);
  if (!isWithin(canonicalRoot, candidate)) deny('FILE_ROOT_DENIED', '허용 루트 밖의 경로입니다.');
  const canonicalTarget = fs.realpathSync(candidate);
  if (!isWithin(canonicalRoot, canonicalTarget)) deny('FILE_SYMLINK_DENIED', '심볼릭 링크가 허용 루트를 벗어납니다.');
  // This fixture has no concurrent writers. This check does not prove TOCTOU safety.
  return { path: canonicalTarget, content: fs.readFileSync(canonicalTarget, 'utf8') };
}

function requestPlanVulnerable(destination) {
  return { method: 'GET', url: new URL(text(destination, '요청 위치'), BASE_URL).href };
}

function requestPlanFixed(destination) {
  const parsed = new URL(text(destination, '요청 위치'), BASE_URL);
  if (parsed.origin !== new URL(BASE_URL).origin || parsed.username || parsed.password) {
    deny('URL_ORIGIN_DENIED', '고정된 HTTPS 출처만 허용합니다.');
  }
  if (parsed.hash) deny('URL_FRAGMENT_DENIED', '요청 위치에 fragment를 허용하지 않습니다.');
  // No HTTP request is made. DNS, redirects and proxy policy are outside this fixture.
  return { method: 'GET', url: parsed.href };
}

module.exports = { BASE_URL, queryVulnerable, queryFixed, isWithin,
  readVulnerable, readFixed, requestPlanVulnerable, requestPlanFixed };

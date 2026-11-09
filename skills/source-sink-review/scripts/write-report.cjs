#!/usr/bin/env node
'use strict';
const fs = require('node:fs'), path = require('node:path');
const { normalizeBundle, STATES, MODES, SEVERITIES } = require('./report-core.cjs');
const LIMIT = 4 * 1024 * 1024;

// Reviewed content is text, including URLs. Never turn supplied evidence into HTML,
// images, links, code fences or executable report instructions.
function literal(value) {
  const clean = String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
  // Code spans also suppress GFM bare-URL/email autolinking. Choose delimiters
  // from the content so embedded backticks cannot close the span.
  if (/(?:https?:|ftp:|www\.|@)/i.test(clean)) return clean.split(/\r\n?|\n/).map(line => {
    if (!line) return '';
    const runs = line.match(/`+/g) || [];
    const fence = '`'.repeat(Math.max(0, ...runs.map(run => run.length)) + 1);
    return fence + ' ' + line.replace(/\|/g, '\\|') + ' ' + fence;
  }).join('<br>');
  return clean.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_{}\[\]()#!|~:]/g, '\\$&').replace(/\r\n?|\n/g, '<br>')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
}
function bullets(lines, title, values) {
  lines.push('', '### ' + title, '');
  if (!values.length) lines.push('미기록');
  else for (const value of values) lines.push('- ' + literal(value));
}
function render(raw) {
  const reports = normalizeBundle(raw), lines = ['# 보안 점검 결과', '', '> 실제 실행 수준과 미검증 범위는 각 보고서에 표시합니다. 발견 0건은 전체 안전을 뜻하지 않습니다.'];
  for (const r of reports) {
    lines.push('', '## ' + literal(r.title), '', '- 스킬: ' + literal(r.skill), '- 작성 시각: ' + literal(r.generatedAt), '- 근거 수준: ' + MODES[r.mode], '- 범위: ' + literal(r.scope.description), '- 관찰 위치: ' + literal(r.scope.vantage), '- 발견 항목: ' + r.findings.length);
    bullets(lines, '대상', r.scope.targets);
    bullets(lines, '확인하지 못한 범위와 한계', r.scope.limitations);
    lines.push('', '### 전체 검사 범위', '', '| 대상 | 상태 | 근거·제한 |', '|---|---|---|');
    if (!r.coverage.length) lines.push('| 미기록 | 확인 못 함 | 검사 범위가 제공되지 않았습니다. |');
    for (const c of r.coverage) lines.push('| ' + [c.target, c.status, c.detail].map(literal).join(' | ') + ' |');
    if (!r.findings.length) lines.push('', '### 발견 항목', '', '기록된 발견 항목은 없습니다. 위 검사 범위·누락·실행 수준을 함께 확인하세요.');
    for (const f of r.findings) {
      lines.push('', '### ' + literal(f.id) + ' · ' + literal(f.title), '', '- 판정: ' + STATES[f.status], '- 심각도: ' + SEVERITIES[f.severity]);
      if (f.triageState) lines.push('- 조건 판정: ' + literal(f.triageState));
      if (f.boundaryState) lines.push('- 경계 판정: ' + literal(f.boundaryState));
      lines.push('', literal(f.summary), '', '| 증거 유형 | 위치 | 관측한 사실 |', '|---|---|---|');
      if (!f.evidence.length) lines.push('| 미기록 | 미기록 | 실행 사실을 추정하지 않습니다. |');
      for (const e of f.evidence) lines.push('| ' + [e.kind, e.location, e.detail].map(literal).join(' | ') + ' |');
      bullets(lines, '성립 조건', f.conditions);
      bullets(lines, '수정', f.fix);
      bullets(lines, '동일 사례·변형·정상 경로 재검증', f.retest);
      if (f.flow.length) {
        lines.push('', '#### 근거 경로', '', '| 순서 | 경계 | 사실 |', '|---|---|---|');
        f.flow.forEach((v, i) => lines.push('| ' + (i + 1) + ' | ' + literal(v.label) + ' | ' + literal(v.detail) + ' |'));
      }
    }
    lines.push('', '### 출처', '', '| 자료 | 주소 | 공개·갱신일 | 조회일 |', '|---|---|---|---|');
    if (!r.sources.length) lines.push('| 미기록 | — | — | — |');
    for (const s of r.sources) lines.push('| ' + [s.title, s.url, s.publishedAt, s.retrievedAt].map(literal).join(' | ') + ' |');
  }
  return lines.join('\n') + '\n';
}
function readInput(filename) {
  let fd;
  try {
    fd = fs.openSync(filename, 'r');
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > LIMIT) throw Error('limit');
    const buffer = Buffer.alloc(LIMIT + 1);
    let size = 0;
    while (size < buffer.length) {
      const n = fs.readSync(fd, buffer, size, buffer.length - size, null);
      if (!n) break;
      size += n;
    }
    if (size > LIMIT) throw Error('limit');
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, size)));
  } catch {
    throw Error('4MB 이하의 UTF-8 보고서 JSON을 읽거나 해석하지 못했습니다. 입력 내용은 출력하지 않습니다.');
  } finally { if (fd !== undefined) fs.closeSync(fd); }
}
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 2 || !/\.md$/i.test(args[1])) throw Error('사용법: node scripts/write-report.cjs report.json new-report.md');
    if (path.resolve(args[0]) === path.resolve(args[1])) throw Error('입력 파일을 덮어쓸 수 없습니다.');
    const report = render(readInput(args[0]));
    fs.writeFileSync(args[1], report, { flag: 'wx' });
    console.log('Markdown 보고서를 저장했습니다.');
  } catch (e) { console.error(e.code === 'EEXIST' ? '기존 출력 파일을 덮어쓰지 않습니다.' : e.message); process.exitCode = 1; }
}
module.exports = { render, literal };

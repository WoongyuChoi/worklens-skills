/* BEGIN WORKLENS CORE */
const Worklens = (() => {
  'use strict';
  const MAX_BYTES = 2 * 1024 * 1024;
  const need = (ok, message) => { if (!ok) throw new Error(message); };
  function keys(value, allowed, label) {
    need(value !== null && typeof value === 'object' && !Array.isArray(value), label + ': 객체가 필요합니다.');
    for (const key of Object.keys(value)) need(allowed.includes(key), label + ': 알 수 없는 필드 ' + key);
    for (const key of allowed) need(Object.hasOwn(value, key), label + ': 필요한 필드 ' + key);
  }
  function string(value, label, max = 2000, empty = false) {
    need(typeof value === 'string' && value.length <= max && (empty || value.trim().length > 0), label + ': 문자열 길이를 확인하세요.');
    return value;
  }
  function parseJSON(raw, maxBytes = MAX_BYTES) {
    need(typeof raw === 'string' && new TextEncoder().encode(raw).length <= maxBytes, '입력은 UTF-8 기준 허용 용량(일반 JSON 2 MiB) 이하여야 합니다.');
    let i = 0, nodes = 0;
    const ws = () => { while (/[\t\n\r ]/.test(raw[i] || 'x')) i++; };
    function quoted() {
      const start = i++;
      for (; i < raw.length; i++) {
        if (raw[i] === '\\') { i++; continue; }
        if (raw[i] === '"') { i++; return JSON.parse(raw.slice(start, i)); }
      }
      throw new Error('닫히지 않은 JSON 문자열입니다.');
    }
    function read(depth) {
      need(depth < 24 && ++nodes <= 30000, 'JSON 구조가 너무 큽니다.'); ws();
      if (raw[i] === '"') return quoted();
      if (raw[i] === '{' || raw[i] === '[') {
        const obj = raw[i++] === '{', end = obj ? '}' : ']', out = obj ? Object.create(null) : [], seen = new Set(); ws();
        if (raw[i] === end) { i++; return out; }
        while (true) {
          ws();
          if (obj) {
            need(raw[i] === '"', 'JSON 키가 필요합니다.'); const key = quoted();
            need(!seen.has(key), '중복 JSON 키: ' + key); seen.add(key); ws(); need(raw[i++] === ':', 'JSON 콜론이 필요합니다.'); out[key] = read(depth + 1);
          } else out.push(read(depth + 1));
          ws(); if (raw[i] === end) { i++; return out; }
          need(raw[i++] === ',', 'JSON 구분자를 확인하세요.');
        }
      }
      for (const [word, value] of [['true', true], ['false', false], ['null', null]]) if (raw.startsWith(word, i)) { i += word.length; return value; }
      const m = raw.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
      need(m, 'JSON 값이 올바르지 않습니다.'); i += m[0].length; return Number(m[0]);
    }
    const value = read(0); ws(); need(i === raw.length, 'JSON 뒤에 불필요한 문자가 있습니다.'); return value;
  }
  function sourceLines(code) {
    const lines = code.split(/\r\n|\n|\r/);
    if (lines.at(-1) === '') lines.pop(); return lines;
  }
  function run(input) {
    const q = typeof input === 'string' ? parseJSON(input) : input;
    keys(q, ['schemaVersion', 'title', 'scope', 'provenance', 'revision', 'entryStep', 'steps'], '안내');
    need(q.schemaVersion === 1, 'schemaVersion 1만 지원합니다.');
    string(q.title, 'title', 200); string(q.scope, 'scope', 4000); string(q.revision, 'revision', 500); string(q.entryStep, 'entryStep', 80);
    need(['source', 'synthetic'].includes(q.provenance), 'provenance는 source 또는 synthetic입니다.');
    need(Array.isArray(q.steps) && q.steps.length >= 1 && q.steps.length <= 100, '단계는 1~100개여야 합니다.');
    const ids = new Set(); let edgeCount = 0;
    const steps = q.steps.map(s => {
      keys(s, ['id', 'title', 'path', 'startLine', 'endLine', 'symbol', 'code', 'explanation', 'evidence', 'links'], '단계');
      string(s.id, '단계 id', 80); need(!ids.has(s.id), '중복 단계 id: ' + s.id); ids.add(s.id);
      string(s.title, '단계 title', 200); string(s.symbol, 'symbol', 500); string(s.explanation, 'explanation', 6000);
      string(s.path, 'path', 500, true); string(s.code, 'code', 20000, true);
      need(['observed', 'inferred', 'gap'].includes(s.evidence), '단계 evidence는 observed, inferred, gap입니다.');
      if (s.evidence === 'gap') {
        need(s.path === '' && s.code === '' && s.startLine === null && s.endLine === null, 'gap 단계는 경로·코드를 비우고 줄 번호를 null로 두세요.');
      } else {
        need(s.path.length > 0 && !/^(?:[a-zA-Z][a-zA-Z\d+.-]*:|[/\\])/.test(s.path) && !s.path.split(/[/\\]/).includes('..') && !/[\u0000-\u001f]/.test(s.path), '코드 경로는 URL·절대 경로·상위 이동 없는 상대 경로여야 합니다.');
        need(Number.isSafeInteger(s.startLine) && Number.isSafeInteger(s.endLine) && s.startLine >= 1 && s.endLine >= s.startLine && s.endLine <= 10000000, '실제 줄 범위를 정수로 지정하세요.');
        need(s.code.length > 0 && sourceLines(s.code).length === s.endLine - s.startLine + 1, '발췌 줄 수와 startLine/endLine이 다릅니다: ' + s.id);
      }
      need(Array.isArray(s.links) && s.links.length <= 20, '단계별 연결은 20개 이하여야 합니다.'); edgeCount += s.links.length;
      const links = s.links.map(link => {
        keys(link, ['to', 'label', 'evidence', 'reason'], '연결'); string(link.to, '연결 to', 80); string(link.label, '연결 label', 300); string(link.reason, '연결 reason', 3000);
        need(['observed', 'inferred'].includes(link.evidence), '연결 evidence는 observed 또는 inferred입니다.');
        return {to: link.to, label: link.label, evidence: link.evidence, reason: link.reason};
      });
      return {id: s.id, title: s.title, path: s.path, startLine: s.startLine, endLine: s.endLine, symbol: s.symbol, code: s.code, explanation: s.explanation, evidence: s.evidence, links};
    });
    need(edgeCount <= 500, '전체 연결은 500개 이하여야 합니다.'); need(ids.has(q.entryStep), 'entryStep이 존재하지 않습니다.');
    for (const step of steps) for (const link of step.links) need(ids.has(link.to), '연결 대상이 없습니다: ' + step.id + ' → ' + link.to);
    const byId = new Map(steps.map(s => [s.id, s])), reachable = new Set(), queue = [q.entryStep];
    while (queue.length) { const id = queue.pop(); if (reachable.has(id)) continue; reachable.add(id); for (const link of byId.get(id).links) queue.push(link.to); }
    const stats = {stepCount: steps.length, edgeCount, observedCount: steps.filter(s => s.evidence === 'observed').length, inferredCount: steps.filter(s => s.evidence === 'inferred').length, gapCount: steps.filter(s => s.evidence === 'gap').length, inferredEdgeCount: steps.reduce((n, s) => n + s.links.filter(l => l.evidence === 'inferred').length, 0), unreachableIds: steps.filter(s => !reachable.has(s.id)).map(s => s.id)};
    const tour = {schemaVersion: 1, title: q.title, scope: q.scope, provenance: q.provenance, revision: q.revision, entryStep: q.entryStep, steps};
    const warnings = ['입력 자료의 구조만 확인했습니다. 실제 파일·현재 줄 번호·실행 결과는 별도 확인이 필요합니다.'];
    if (q.provenance === 'synthetic') warnings.unshift('합성 예시입니다. 실제 사내 코드나 실행 결과가 아닙니다.');
    if (stats.unreachableIds.length) warnings.push('진입 단계에서 연결되지 않은 단계: ' + stats.unreachableIds.join(', '));
    if (stats.gapCount || stats.inferredCount || stats.inferredEdgeCount) warnings.push('추론 또는 자료 공백이 있습니다. 연결 근거를 읽고 해석하세요.');
    return {tour, stats, warnings};
  }
  function matches(tour, query) {
    const term = String(query).trim().toLowerCase();
    return tour.steps.filter(s => !term || [s.id, s.title, s.path, s.symbol, s.code, s.explanation, ...s.links.flatMap(l => [l.label, l.reason])].join('\n').toLowerCase().includes(term)).map(s => s.id);
  }
  function safeEmbed(value) {
    return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, c => ({'<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029'})[c]);
  }
  function exportHTML(template, tour) {
    const opening = '<script type="application/json" id="embedded-tour">', closing = '<' + '/script>';
    need(typeof template === 'string', 'HTML 템플릿이 필요합니다.');
    const at = template.indexOf(opening), start = at + opening.length, end = template.indexOf(closing, start);
    need(at >= 0 && end >= start, 'HTML의 내장 자료 위치를 찾지 못했습니다.');
    const validated = run(tour).tour;
    need(new TextEncoder().encode(JSON.stringify(validated)).length <= MAX_BYTES, '내장할 자료 JSON은 2 MiB 이하여야 합니다.');
    return template.slice(0, start) + safeEmbed(validated) + template.slice(end);
  }
  function readEmbedded(raw) {
    // HTML-safe escaping may expand each '<' to six ASCII bytes.
    const value = parseJSON(raw, MAX_BYTES * 6);
    need(new TextEncoder().encode(JSON.stringify(value)).length <= MAX_BYTES, '내장 자료의 원래 JSON은 2 MiB 이하여야 합니다.');
    return run(value);
  }
  return {run, parseJSON, sourceLines, matches, safeEmbed, exportHTML, readEmbedded};
})();
/* END WORKLENS CORE */

if (typeof module !== 'undefined') module.exports = Worklens;
if (typeof require !== 'undefined' && require.main === module) {
  try {
    const fs=require('node:fs'),args=process.argv.slice(2);
    if(args.length!==0&&args.length!==2)throw new Error('사용법: node tool.cjs 요청.json 새결과.json (또는 표준입력/출력)');
    const raw=new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(args.length?args[0]:0));
    const output=JSON.stringify(Worklens.run(raw),null,2)+'\n';
    if(args.length)fs.writeFileSync(args[1],output,{flag:'wx'});else process.stdout.write(output);
  }
  catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1; }
}

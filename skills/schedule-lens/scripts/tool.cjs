/* BEGIN WORKLENS CORE */
const Worklens = (() => {
  'use strict';
  const DAY = 86400000, MAX_BYTES = 102400, MAX_TOTAL = 10000, MAX_COLLISIONS = 2000;
  const need = (ok, message) => { if (!ok) throw new Error(message); };
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  function keys(v, allowed, label) {
    need(object(v), label + ': 객체가 필요합니다.');
    for (const key of Object.keys(v)) need(allowed.includes(key), label + ': 알 수 없는 필드 ' + key);
  }
  function string(v, label, max = 500) {
    need(typeof v === 'string' && v.length > 0 && v.length <= max, label + ': 문자열 길이를 확인하세요.');
    return v;
  }
  function integer(v, min, max, label) {
    need(Number.isSafeInteger(v) && v >= min && v <= max, label + ': ' + min + '~' + max + ' 정수가 필요합니다.');
    return v;
  }
  // Deliberately reject duplicate keys rather than accepting a hidden last value.
  function parseJSON(raw) {
    need(typeof raw === 'string' && new TextEncoder().encode(raw).length <= MAX_BYTES, '입력은 UTF-8 기준 100 KiB 이하여야 합니다.');
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
      need(depth < 20 && ++nodes <= 10000, 'JSON 구조가 너무 큽니다.'); ws();
      if (raw[i] === '"') return quoted();
      if (raw[i] === '{' || raw[i] === '[') {
        const obj = raw[i++] === '{', end = obj ? '}' : ']', out = obj ? Object.create(null) : [], seen = new Set(); ws();
        if (raw[i] === end) { i++; return out; }
        while (true) {
          ws();
          if (obj) {
            need(raw[i] === '"', 'JSON 키가 필요합니다.'); const key = quoted();
            need(!seen.has(key), '중복 JSON 키: ' + key); seen.add(key); ws();
            need(raw[i++] === ':', 'JSON 콜론이 필요합니다.'); out[key] = read(depth + 1);
          } else out.push(read(depth + 1));
          ws(); if (raw[i] === end) { i++; return out; }
          need(raw[i++] === ',', 'JSON 구분자를 확인하세요.');
        }
      }
      for (const [word, value] of [['true', true], ['false', false], ['null', null]]) {
        if (raw.startsWith(word, i)) { i += word.length; return value; }
      }
      const m = raw.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
      need(m, 'JSON 값이 올바르지 않습니다.'); i += m[0].length; return Number(m[0]);
    }
    const result = read(0); ws(); need(i === raw.length, 'JSON 뒤에 불필요한 문자가 있습니다.'); return result;
  }
  function field(raw, min, max, label, question = false) {
    need(typeof raw === 'string' && raw.length <= 100, label + ': 식이 너무 깁니다.');
    if (question && raw === '?') raw = '*';
    const values = new Set();
    for (const part of raw.split(',')) {
      need(part.length > 0, label + ': 빈 목록 항목입니다.');
      const m = part.match(/^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/);
      need(m, label + ': 숫자·목록·증가 범위·*/n·a-b/n만 지원합니다.');
      const step = m[2] === undefined ? 1 : Number(m[2]);
      need(Number.isSafeInteger(step) && step >= 1 && step <= max - min + 1, label + ': 증분 범위를 확인하세요.');
      let from, to;
      if (m[1] === '*') { from = min; to = max; }
      else if (m[1].includes('-')) [from, to] = m[1].split('-').map(Number);
      else { need(m[2] === undefined, label + ': n/step은 미지원입니다. 범위를 명시하세요.'); from = to = Number(m[1]); }
      need(Number.isSafeInteger(from) && Number.isSafeInteger(to) && from >= min && to <= max && from <= to, label + ': 범위는 ' + min + '~' + max + '이며 역방향은 미지원입니다.');
      for (let n = from; n <= to; n += step) values.add(n);
    }
    return [...values].sort((a, b) => a - b);
  }
  function parseCron(expression) {
    string(expression, 'cron', 600); const f = expression.trim().split(/\s+/);
    need(f.length === 6, 'Spring 부분집합은 초 분 시 일 월 요일의 6필드가 필요합니다. Unix 5필드·Quartz 연도 필드는 미지원입니다.');
    need(['*', '?'].includes(f[3]) || ['*', '?'].includes(f[5]), '일과 요일을 동시에 제한한 식은 미지원입니다. 하나는 * 또는 ?여야 합니다.');
    return {
      seconds: field(f[0], 0, 59, '초'), minutes: field(f[1], 0, 59, '분'), hours: field(f[2], 0, 23, '시'),
      days: new Set(field(f[3], 1, 31, '일', true)), months: new Set(field(f[4], 1, 12, '월')),
      weekdays: new Set(field(f[5], 0, 7, '요일', true).map(v => v % 7))
    };
  }
  function offsetMinutes(raw) {
    need(typeof raw === 'string', 'utcOffset 문자열이 필요합니다.');
    const m = raw.match(/^([+-])(\d{2}):(\d{2})$/);
    need(m && Number(m[3]) <= 59 && raw !== '-00:00', '고정 오프셋은 +09:00 형태이며 -00:00은 미지원입니다.');
    const n = (Number(m[2]) * 60 + Number(m[3])) * (m[1] === '-' ? -1 : 1);
    need(n >= -720 && n <= 840, '고정 오프셋 범위는 -12:00~+14:00입니다.'); return n;
  }
  function localStart(raw) {
    need(typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(raw), 'start는 오프셋 없는 YYYY-MM-DDTHH:mm:ss 형식입니다.');
    const values = raw.match(/\d+/g).map(Number), [y, mo, d, h, mi, s] = values;
    need(y >= 1970 && y <= 2099 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && h <= 23 && mi <= 59 && s <= 59, '시작 날짜·시각 범위를 확인하세요.');
    const ms = Date.UTC(y, mo - 1, d, h, mi, s);
    need(new Date(ms).toISOString().slice(0, 19) === raw, '존재하지 않는 날짜입니다.'); return ms;
  }
  const display = (localMs, offset) => new Date(localMs).toISOString().slice(0, 19) + offset;
  function generate(job, cron, start, end, offset, cap) {
    const runs = [], base = Math.floor(start / DAY) * DAY;
    for (let day = base; day < end; day += DAY) {
      const d = new Date(day);
      if (!cron.months.has(d.getUTCMonth() + 1) || !cron.days.has(d.getUTCDate()) || !cron.weekdays.has(d.getUTCDay())) continue;
      for (const h of cron.hours) for (const m of cron.minutes) for (const s of cron.seconds) {
        const local = day + (h * 3600 + m * 60 + s) * 1000;
        if (local < start || local >= end) continue;
        if (runs.length === cap) return {runs, complete: false};
        runs.push({jobId: job.id, start: display(local, offset), startUtc: new Date(local - offsetMinutes(offset) * 60000).toISOString(), localMs: local, durationSeconds: job.durationSeconds, end: job.durationSeconds === null ? null : display(local + job.durationSeconds * 1000, offset)});
      }
    }
    return {runs, complete: true};
  }
  function collisions(runs, offset) {
    const found = []; let active = [];
    for (const right of runs) {
      active = active.filter(left => left.localMs === right.localMs || (left.durationSeconds > 0 && left.localMs + left.durationSeconds * 1000 > right.localMs));
      for (const left of active) {
        const simultaneous = left.localMs === right.localMs;
        if (!simultaneous && !(left.durationSeconds > 0 && right.durationSeconds > 0)) continue;
        if (found.length === MAX_COLLISIONS) return {items: found, complete: false};
        const known = left.durationSeconds > 0 && right.durationSeconds > 0;
        found.push({kind: known ? '수행시간 기준 중첩 가능' : '동시 시작', leftJob: left.jobId, rightJob: right.jobId, leftStart: left.start, rightStart: right.start, from: right.start, until: known ? display(Math.min(left.localMs + left.durationSeconds * 1000, right.localMs + right.durationSeconds * 1000), offset) : right.start, sameJob: left.jobId === right.jobId});
      }
      active.push(right);
    }
    return {items: found, complete: true};
  }
  function run(input) {
    const q = typeof input === 'string' ? parseJSON(input) : input;
    keys(q, ['dialect', 'start', 'utcOffset', 'days', 'maxRunsPerJob', 'jobs'], '입력');
    need(q.dialect === 'spring6-fixed-offset', 'dialect는 spring6-fixed-offset만 지원합니다. 다른 방언을 추측하지 않습니다.');
    const start = localStart(q.start), minutes = offsetMinutes(q.utcOffset), days = integer(q.days, 1, 93, 'days'), cap = integer(q.maxRunsPerJob, 1, 5000, 'maxRunsPerJob'), end = start + days * DAY;
    need(Array.isArray(q.jobs) && q.jobs.length > 0 && q.jobs.length <= 20, '작업은 1~20개여야 합니다.');
    const seen = new Set(), prepared = q.jobs.map(job => {
      keys(job, ['id', 'cron', 'durationSeconds', 'source'], '작업'); string(job.id, '작업 id', 80);
      need(!seen.has(job.id), '중복 작업 id: ' + job.id); seen.add(job.id); string(job.source, 'source', 1000);
      need(job.durationSeconds === null || (Number.isSafeInteger(job.durationSeconds) && job.durationSeconds >= 0 && job.durationSeconds <= 604800), 'durationSeconds는 null 또는 0~604800 정수입니다.');
      return {job, cron: parseCron(job.cron)};
    });
    const all = [], jobs = [];
    for (const {job, cron} of prepared) {
      const result = generate(job, cron, start, end, q.utcOffset, Math.min(cap, Math.max(0, MAX_TOTAL - all.length)));
      all.push(...result.runs); jobs.push({id: job.id, cron: job.cron, source: job.source, durationSeconds: job.durationSeconds, runCount: result.runs.length, complete: result.complete});
    }
    all.sort((a, b) => a.localMs - b.localMs || a.jobId.localeCompare(b.jobId));
    const collisionResult = collisions(all, q.utcOffset), runsComplete = jobs.every(j => j.complete);
    return {
      dialect: q.dialect, window: {start: display(start, q.utcOffset), endExclusive: display(end, q.utcOffset), utcOffset: q.utcOffset, startUtc: new Date(start - minutes * 60000).toISOString()},
      runsComplete, collisionsComplete: runsComplete && collisionResult.complete, collisionLimitReached: !collisionResult.complete,
      limits: {maxRunsPerJob: cap, maxTotalRuns: MAX_TOTAL, maxCollisions: MAX_COLLISIONS}, jobs,
      runs: all.map(({localMs, ...value}) => value), collisions: collisionResult.items,
      notes: ['고정 오프셋만 계산했습니다. DST·휴일·misfire·락·실제 실행 여부는 확인하지 않습니다.', '창 안에서 시작한 실행만 비교합니다. 창 이전부터 이어진 실행은 제외합니다.', '수행시간이 없는 작업은 동시 시작만 비교합니다. 수행시간 가정과 직렬화 여부를 별도 확인하세요.', ...(!runsComplete || !collisionResult.complete ? ['상한으로 결과가 불완전합니다. 중첩이 없다는 결론을 내리지 마세요.'] : [])]
    };
  }
  return {run, parseJSON, parseCron, offsetMinutes};
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

// Repository development tests only; the HTML tools need no Node installation.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const schedule = require('../skills/schedule-lens/scripts/tool.cjs');
const tour = require('../skills/code-path-tour/scripts/tool.cjs');
const root = path.resolve(__dirname, '..');
const file = p => fs.readFileSync(path.join(root, p), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const exampleTour = () => JSON.parse(file('skills/code-path-tour/assets/example-tour.json'));
const job = (id, cron, durationSeconds = null) => ({id, cron, durationSeconds, source: '합성 검증 자료'});
const query = (jobs, overrides = {}) => ({dialect: 'spring6-fixed-offset', start: '2026-11-01T00:00:00', utcOffset: '+09:00', days: 1, maxRunsPerJob: 5000, jobs, ...overrides});

test('month-end does not turn November 31 into December 1', () => {
  const r = schedule.run(query([job('001', '0 0 1 28-31 * ?')], {start: '2026-11-28T00:00:00', days: 5}));
  assert.deepEqual(r.runs.map(v => v.start), ['2026-11-28T01:00:00+09:00', '2026-11-29T01:00:00+09:00', '2026-11-30T01:00:00+09:00']);
  assert.equal(r.runsComplete, true);
});

test('leap day exists in 2028 and not in 2027', () => {
  for (const [year, expected] of [[2028, 1], [2027, 0]]) {
    const r = schedule.run(query([job('윤년', '0 0 0 29 2 ?')], {start: `${year}-02-01T00:00:00`, days: 31}));
    assert.equal(r.runs.length, expected);
    if (expected) assert.equal(r.runs[0].start, '2028-02-29T00:00:00+09:00');
  }
});

test('Sunday 0 and 7 agree; duplicates from lists do not duplicate runs', () => {
  const a = schedule.run(query([job('일', '0 0 0 ? * 0,7')], {days: 8}));
  assert.deepEqual(a.runs.map(v => v.start.slice(0, 10)), ['2026-11-01', '2026-11-08']);
  const b = schedule.run(query([job('월', '0 0 0 ? * 1')], {days: 8}));
  assert.equal(b.runs[0].start.slice(0, 10), '2026-11-02');
});

test('fixed offsets correctly cross UTC date boundaries', () => {
  const a = schedule.run(query([job('0009007199254740993', '0 0 0 * * ?')]));
  assert.equal(a.runs[0].startUtc, '2026-10-31T15:00:00.000Z');
  assert.equal(a.runs[0].jobId, '0009007199254740993');
  const b = schedule.run(query([job('서쪽', '0 30 23 * * ?')], {utcOffset: '-05:30'}));
  assert.equal(b.runs[0].startUtc, '2026-11-02T05:00:00.000Z');
});

test('preview uses inclusive start and exclusive end, including non-midnight starts', () => {
  const r = schedule.run(query([job('경계', '0 15 1 * * ?')], {start: '2026-11-01T01:15:00'}));
  assert.equal(r.runs.length, 1);
  assert.equal(r.runs[0].start, '2026-11-01T01:15:00+09:00');
  assert.equal(r.window.endExclusive, '2026-11-02T01:15:00+09:00');
});

test('lists, ranges, and increments produce the intended numeric times', () => {
  const r = schedule.run(query([job('간격', '0 0,15,15,30 9-10 * * ?')]));
  assert.equal(r.runs.length, 6);
  assert.deepEqual(r.runs.map(v => v.start.slice(11, 16)), ['09:00', '09:15', '09:30', '10:00', '10:15', '10:30']);
  const stepped = schedule.run(query([job('초간격', '*/20 0 0 * * ?')]));
  assert.deepEqual(stepped.runs.map(v => v.start.slice(17, 19)), ['00', '20', '40']);
});

test('duration overlap excludes touching endpoints', () => {
  const r = schedule.run(query([job('A', '0 0 0 * * ?', 1800), job('B', '0 30 0 * * ?', 60)]));
  assert.equal(r.collisions.length, 0);
  const overlap = schedule.run(query([job('A', '0 0 0 * * ?', 1801), job('B', '0 30 0 * * ?', 60)]));
  assert.equal(overlap.collisions.length, 1);
  assert.equal(overlap.collisions[0].until, '2026-11-01T00:30:01+09:00');
});

test('unknown and zero durations compare only simultaneous starts', () => {
  const r = schedule.run(query([job('A', '0 0 0 * * ?', 3600), job('B', '0 30 0 * * ?', null), job('C', '0 0 0 * * ?', 0)]));
  assert.equal(r.collisions.length, 1);
  assert.equal(r.collisions[0].kind, '동시 시작');
  assert.deepEqual(new Set([r.collisions[0].leftJob, r.collisions[0].rightJob]), new Set(['A', 'C']));
});

test('repeated runs of the same job can overlap and are marked', () => {
  const r = schedule.run(query([job('한작업', '0 0 * * * ?', 3601)]));
  assert.equal(r.collisions.length, 23);
  assert(r.collisions.every(c => c.sameJob));
});

test('exactly-at-cap can be complete; one extra run makes it incomplete', () => {
  const a = schedule.run(query([job('정확히', '0 0 0,1 * * ?')], {maxRunsPerJob: 2}));
  assert.equal(a.runsComplete, true);
  const b = schedule.run(query([job('초과', '0 0 0,1,2 * * ?')], {maxRunsPerJob: 2}));
  assert.equal(b.runs.length, 2);
  assert.equal(b.runsComplete, false);
  assert.equal(b.collisionsComplete, false);
});

test('global run cap and independent collision cap are explicit', () => {
  const all = schedule.run(query([job('A', '* * * * * ?'), job('B', '* * * * * ?'), job('C', '0 0 0 * * ?')]));
  assert.equal(all.runs.length, 10000);
  assert.equal(all.jobs[2].runCount, 0);
  assert.equal(all.jobs[2].complete, false);
  const many = schedule.run(query([job('A', '0 * 0 * * ?', 3600), job('B', '0 * 0 * * ?', 3600)]));
  assert.equal(many.runsComplete, true);
  assert.equal(many.collisions.length, 2000);
  assert.equal(many.collisionLimitReached, true);
  assert.equal(many.collisionsComplete, false);
});

test('unsupported dialects and cron semantics are rejected rather than guessed', () => {
  for (const cron of ['0 0 * * *', '0 0 0 * * ? 2026', '0 0 0 L * ?', '0 0 0 ? * MON', '0 0 0 1 * 1', '5/10 * * * * ?', '0 0 22-2 * * ?', '0 0 0 * * 1#2', '0 0 0 15W * ?', '60 * * * * ?', '*/0 * * * * ?', '0 0 0 ? * ?/2']) {
    assert.throws(() => schedule.run(query([job('오류', cron)])), undefined, cron);
  }
  assert.throws(() => schedule.run(query([job('오류', '0 0 0 * * ?')], {dialect: 'quartz'})), /dialect/);
});

test('invalid dates, offsets, unsafe numeric values and duplicate JSON keys fail', () => {
  for (const start of ['2026-02-30T00:00:00', '2026-13-01T00:00:00', '2026-11-01T24:00:00', '2026-11-01T00:00:60', '2026-11-01T00:00:00Z']) assert.throws(() => schedule.run(query([job('A', '0 0 0 * * ?')], {start})));
  for (const utcOffset of ['Asia/Seoul', '+14:01', '-12:01', '-00:00', '+09:99']) assert.throws(() => schedule.run(query([job('A', '0 0 0 * * ?')], {utcOffset})));
  assert.throws(() => schedule.run(query([job(9007199254740993, '0 0 0 * * ?')])), /문자열/);
  assert.throws(() => schedule.parseJSON('{"days":1,"days":2}'), /중복/);
  assert.throws(() => schedule.parseJSON(' '.repeat(102401)), /100 KiB/);
});

test('tour example preserves string identifiers and distinguishes inferred edges', () => {
  const result = tour.run(JSON.stringify(exampleTour()));
  assert.equal(result.tour.steps[0].id, '001');
  assert.equal(result.stats.stepCount, 4);
  assert.equal(result.stats.edgeCount, 3);
  assert.equal(result.stats.observedCount, 3);
  assert.equal(result.stats.inferredCount, 1);
  assert.equal(result.stats.inferredEdgeCount, 1);
  assert(result.warnings.some(v => v.includes('합성')));
});

test('line counts preserve CRLF and terminal newline semantics', () => {
  assert.deepEqual(tour.sourceLines('a\r\nb\r\n'), ['a', 'b']);
  const q = exampleTour(); q.steps[0].code = '첫째\r\n둘째\r\n'; q.steps[0].endLine = q.steps[0].startLine + 1;
  assert.equal(tour.run(q).tour.steps[0].code, '첫째\r\n둘째\r\n');
  q.steps[0].endLine++;
  assert.throws(() => tour.run(q), /줄 수/);
});

test('a gap must not carry fabricated path or line anchors', () => {
  const q = exampleTour(), s = q.steps[3];
  Object.assign(s, {evidence: 'gap', path: '', startLine: null, endLine: null, code: ''});
  assert.equal(tour.run(q).stats.gapCount, 1);
  s.path = 'made-up.java';
  assert.throws(() => tour.run(q), /gap/);
});

test('tour rejects bad targets, duplicate IDs, numeric identifiers, and arbitrary fields', () => {
  const badTarget = exampleTour(); badTarget.steps[0].links[0].to = 'missing'; assert.throws(() => tour.run(badTarget), /대상/);
  const duplicate = exampleTour(); duplicate.steps[1].id = '001'; assert.throws(() => tour.run(duplicate), /중복/);
  const numeric = exampleTour(); numeric.steps[0].id = 1; assert.throws(() => tour.run(numeric), /문자열/);
  const extra = exampleTour(); extra.remoteUrl = 'https://invalid.example/'; assert.throws(() => tour.run(extra), /알 수 없는/);
  assert.throws(() => tour.parseJSON('{"entryStep":"001","entryStep":"002"}'), /중복/);
  assert.throws(() => tour.parseJSON(' '.repeat(2 * 1024 * 1024 + 1)), /2 MiB/);
});

test('tour requires repository-relative anchors and bounded snippets', () => {
  for (const value of ['https://example.test/a', '/absolute.java', '../other.java', 'src/../../other.java', 'C:\\source.java']) {
    const q = exampleTour(); q.steps[0].path = value; assert.throws(() => tour.run(q), /상대 경로/);
  }
  const long = exampleTour(); long.steps[0].code = 'x'.repeat(20001); assert.throws(() => tour.run(long), /문자열 길이/);
});

test('graph cycles terminate and disconnected steps are reported', () => {
  const q = exampleTour(); q.steps[2].links[0].to = '001';
  const r = tour.run(q);
  assert.deepEqual(r.stats.unreachableIds, ['004']);
  assert(r.warnings.some(v => v.includes('연결되지')));
});

test('search spans source text and connection evidence without changing identifiers', () => {
  const q = exampleTour();
  assert.deepEqual(tour.matches(q, 'WHERE ORG_ID'), ['004']);
  assert.deepEqual(tour.matches(q, 'namespace'), ['004']);
  assert.deepEqual(tour.matches(q, 'mapper 인터페이스'), ['003']);
  assert.deepEqual(tour.matches(q, '001'), ['001']);
  assert.equal(tour.matches(q, '없는내용').length, 0);
});

test('exported HTML safely embeds hostile code text and reopens the same JSON', () => {
  const q = exampleTour();
  q.steps[0].code = '</script><img src=x onerror="globalThis.pwned=1">\u2028&';
  q.steps[0].endLine = q.steps[0].startLine;
  q.title = '<script>alert("x")</script>';
  const original = file('skills/code-path-tour/assets/tool.html');
  const output = tour.exportHTML(original, q);
  const embedded = output.match(/<script type="application\/json" id="embedded-tour">([\s\S]*?)<\/script>/)[1];
  assert(!embedded.includes('<'));
  assert.deepEqual(JSON.parse(embedded), q);
  assert.deepEqual(tour.run(embedded).tour, q);
  assert.equal((output.match(/<script>/g) || []).length, (original.match(/<script>/g) || []).length);
  assert.throws(() => tour.exportHTML('<html></html>', q), /내장 자료/);
});

test('HTML escaping expansion does not prevent a valid large tour from reopening', () => {
  const q = exampleTour(); q.steps = [];
  for (let i = 0; i < 20; i++) q.steps.push({id: String(i), title: '긴 예시', path: 'example.txt', startLine: 1, endLine: 1, symbol: 'text', code: '<'.repeat(20000), explanation: '합성 자료', evidence: 'observed', links: []});
  q.entryStep = '0';
  const embedded = tour.safeEmbed(q);
  assert(new TextEncoder().encode(embedded).length > 2 * 1024 * 1024);
  assert.equal(tour.readEmbedded(embedded).tour.steps[0].code, q.steps[0].code);
});

for (const [name, core, samplePath] of [['schedule-lens', schedule, 'example-request.json'], ['code-path-tour', tour, 'example-tour.json']]) {
  test(name + ': browser and CLI contain identical tested core and parse without external dependencies', () => {
    const source = file(`skills/${name}/scripts/tool.cjs`), html = file(`skills/${name}/assets/tool.html`);
    const begin = '/* BEGIN WORKLENS CORE */', end = '/* END WORKLENS CORE */';
    const extract = s => s.slice(s.indexOf(begin), s.indexOf(end) + end.length);
    assert.equal(extract(source), extract(html));
    assert(html.includes('lang="ko"'));
    assert(html.includes("connect-src 'none'"));
    assert(!/<script[^>]+src=|<link[^>]+href=|@import|fetch\s*\(|XMLHttpRequest|WebSocket|innerHTML\s*=|eval\s*\(/i.test(html));
    for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
    const context = vm.createContext({TextEncoder});
    vm.runInContext(extract(html) + '\nglobalThis.engine = Worklens;', context);
    const sample = file(`skills/${name}/assets/${samplePath}`);
    assert.deepEqual(clone(context.engine.run(sample)), clone(core.run(sample)));
  });
}

// Maintainer-only minimum DOM adapter, not a real browser.
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const html = fs.readFileSync(process.argv[2] || path.join(__dirname, '../skills/async-state-guard/assets/race-lab.html'), 'utf8');
const ids = new Map();
let activeElement = null;
const blobs = [];
class Element {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.events = {}; this.dataset = {}; this.value = ''; this.disabled = false; this.hidden = false; this._text = ''; this.attributes = {}; }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this._text = ''; this.children = nodes; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  addEventListener(type, fn) { (this.events[type] ||= []).push(fn); }
  click() { if (!this.disabled) for (const fn of this.events.click || []) fn(); }
  focus() { activeElement = this; }
  querySelector(selector) { return descendants(this).find(node => node.tagName.toLowerCase() === selector) || null; }
}
function descendants(node) { return node.children.flatMap(child => [child, ...descendants(child)]); }
for (const match of html.matchAll(/<([a-z0-9-]+)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)) {
  const el = new Element(match[1]);
  const value = match[2].match(/\bvalue="([^"]*)"/); if (value) el.value = value[1];
  ids.set(match[3], el);
}
const document = { getElementById: id => { assert(ids.has(id), 'Missing element: ' + id); return ids.get(id); }, createElement: tag => new Element(tag) };
const sandbox = { document, Blob, URL: { createObjectURL(blob) { blobs.push(blob); return 'blob:local-test'; }, revokeObjectURL() {} }, setTimeout: fn => fn() };
const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n');
vm.runInNewContext(code, sandbox, { filename: 'race-lab.html', timeout: 1000 });
const el = id => ids.get(id);
const click = id => el(id).click();
const text = (id, value) => assert.equal(el(id).textContent, value, id);
function settle(id, kind) {
  const button = descendants(el('requests')).find(node => node.dataset.request === String(id) && node.dataset.kind === kind);
  assert(button, 'Missing request completion: ' + id + '/' + kind); button.click();
}
let count = 0;
click('prepare'); click('reverse'); text('bad-data', '조직 A / 2026-10 조회 결과'); text('good-data', '조직 B / 2026-10 조회 결과'); assert.equal(activeElement, el('result-title')); count++;
click('prepare'); settle(2, 'success'); settle(1, 'error'); text('good-error', '없음'); text('bad-error', '요청 #1 실패'); text('good-loading', '아니요'); count++;
click('prepare'); settle(1, 'success'); text('bad-loading', '아니요'); text('good-loading', '진행 중'); count++;
click('reset'); click('issue'); click('issue'); el('payload').value = '새 응답'; settle(2, 'success'); el('payload').value = '오래된 응답'; settle(1, 'success'); text('good-data', '새 응답'); text('bad-data', '오래된 응답'); count++;
click('reset'); click('issue'); el('organization').value = '조직 B'; click('change'); settle(1, 'success'); text('good-data', '—'); text('bad-data', '조직 A / 2026-10 조회 결과'); count++;
click('reset'); click('issue'); click('lifecycle'); assert(el('issue').disabled); settle(1, 'success'); text('good-data', '—'); text('bad-data', '조직 A / 2026-10 조회 결과'); click('lifecycle'); click('issue'); settle(2, 'success'); text('good-data', '조직 A / 2026-10 조회 결과'); count++;
click('reset'); const hostile = '<img src=x onerror="window.pwned=1">001'; el('organization').value = hostile; click('issue'); el('payload').value = hostile; settle(1, 'success'); text('good-data', hostile); assert.equal(el('good-data').children.length, 0); count++;
click('export');
(async () => {
  const record = JSON.parse(await blobs.at(-1).text()); assert.equal(record.state.good.data, hostile); assert.equal(record.kind, '설명용 로컬 이벤트'); count++;
  click('reset'); for (let n = 0; n < 60; n++) click('issue'); click('issue'); assert(el('announcement').textContent.includes('60개 한도')); assert.equal(el('requests').children.length, 60); count++;
  click('reset'); el('organization').value = '  '; click('issue'); assert(el('announcement').textContent.includes('입력하세요')); assert.equal(el('requests').children.length, 0); count++;
  click('reset'); for (let n = 0; n < 220; n++) click('lifecycle'); click('export'); const bounded = JSON.parse(await blobs.at(-1).text()); assert.equal(bounded.state.events.length, 200); assert.equal(bounded.state.events.at(-1).sequence, 220); count++;
  console.log('PASS ' + count + ' actual inline-script event scenarios in minimal DOM adapter; NOT browser/rendering/keyboard verification.');
})().catch(error => { console.error(error); process.exitCode = 1; });

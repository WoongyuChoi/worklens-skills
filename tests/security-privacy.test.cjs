'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const exec=promisify(execFile);
const audit=require('../skills/privacy-log-audit/scripts/check-logs.cjs');
const demo=require('../skills/privacy-log-audit/scripts/demo.cjs');
const reportCore=require('../skills/privacy-log-audit/scripts/report-core.cjs');
const cli=path.resolve(__dirname,'../skills/privacy-log-audit/scripts/check-logs.cjs');
async function fixture(content,fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'worklens-privacy-'));const file=path.join(dir,'input.log');fs.writeFileSync(file,content);try{return await fn(file,dir);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
function baseRecord(extra={}){return {traceId:'trace-fixture',errorCode:'OK',service:'sample-service',duration:0,...extra};}
function jsonline(record){return JSON.stringify(record)+'\n';}
function assertNoValues(value){const text=JSON.stringify(value);for(const raw of ['WL_SYNTHETIC_NAME_A','WL_SYNTHETIC_PHONE_A','WL_SYNTHETIC_TOKEN_A','PRIVATE_VALUE_CANARY','PRIVATE_PATH_CANARY','synthetic-trace-1'])assert(!text.includes(raw),'result contains input value');}

test('current synthetic emission finds original leaks, removes fields at source, and preserves observability',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'worklens-privacy-demo-'));
  try{
    const resultDir=path.join(dir,'results'),checks=await demo.runDemo(resultDir);
    assert.equal(checks.beforeCanaryRows,7);assert.equal(checks.afterCanaryRows,0);assert.equal(checks.afterExcludedFieldRows,0);
    assert.equal(checks.beforeRequiredValid,12);assert.equal(checks.afterRequiredValid,12);assert.equal(checks.afterRequiredMissing,0);
    const reports=JSON.parse(fs.readFileSync(path.join(resultDir,'reports.json'),'utf8'));
    assert.equal(reports[0].findings.filter(item=>item.status==='confirmed').length,3);
    assert.equal(reports[1].findings.length,0);assertNoValues(reports);
    for(const report of reports)assert.doesNotThrow(()=>reportCore.normalizeReport(report));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('field names without confirmed policy remain suspected and do not establish actual personal data',async()=>fixture(jsonline(baseRecord({customer:{name:'PRIVATE_VALUE_CANARY'}})),async file=>{
  const policy=demo.demoPolicy();delete policy.policySource;for(const field of policy.fields)field.policyConfirmed=false;
  const scan=await audit.scanFile(file,policy);const report=audit.toReport(scan);
  assert.equal(report.mode,'evidence-review');assert.equal(report.findings[0].status,'suspected');assertNoValues(scan);assertNoValues(report);
}));

test('exact JSON selectors avoid interpreting an unrelated service name or numeric shape as personal data',async()=>fixture(jsonline(baseRecord({unrelated:{name:'PRIVATE_VALUE_CANARY'},randomCode:'01012345678'})),async file=>{
  const scan=await audit.scanFile(file,demo.demoPolicy());
  assert(scan.fields.every(field=>field.presentRows===0&&field.canaryRows===0));assert.equal(audit.toReport(scan).findings.length,0);
}));

test('known canary hidden in a serialized DTO message is found without printing the string',async()=>fixture(jsonline(baseRecord({message:'Exception '+JSON.stringify({phone:'WL_SYNTHETIC_PHONE_A'})})),async file=>{
  const scan=await audit.scanFile(file,demo.demoPolicy());
  const row=scan.fields.find(field=>field.id==='phone');assert.equal(row.presentRows,0);assert.equal(row.canaryRows,1);assert.deepEqual(row.lines,[1]);assertNoValues(scan);
}));

test('Unicode JSON escapes and array selectors are handled without copying values or changing IDs',async()=>fixture('{"traceId":"trace-fixture","errorCode":"OK","service":"sample-service","duration":0,"items":[{"phone":"\\u0057L_SYNTHETIC_PHONE_A","id":"90071992547409931234"}]}\n',async file=>{
  const policy=demo.demoPolicy();policy.fields[1].jsonPointers=['/items/*/phone'];
  const original=fs.readFileSync(file);const scan=await audit.scanFile(file,policy);
  assert.equal(scan.fields[1].presentRows,1);assert.equal(scan.fields[1].canaryRows,1);assert.deepEqual(fs.readFileSync(file),original);
  assert(!JSON.stringify(scan).includes('90071992547409931234'));assertNoValues(scan);
}));

test('empty or masked sensitive fields are not represented as raw-value disclosure or removed output',async()=>fixture(jsonline(baseRecord({customer:{name:'[REDACTED]',phone:null}})),async file=>{
  const scan=await audit.scanFile(file,demo.demoPolicy());const report=audit.toReport(scan);
  assert.equal(scan.fields[0].presentRows,1);assert.equal(scan.fields[0].nonEmptyRows,0);assert.equal(scan.fields[0].redactedOrEmptyRows,1);
  assert(report.findings.every(item=>item.status==='suspected'));assert.equal(report.findings.length,2);
}));

test('multiline and malformed JSON retain unknown coverage without leaking parser input or values',async()=>fixture('{\n"customer":{"name":"PRIVATE_VALUE_CANARY"}\n}\nnot-json PRIVATE_VALUE_CANARY\n',async file=>{
  const scan=await audit.scanFile(file,demo.demoPolicy());const report=audit.toReport(scan);
  assert.equal(scan.summary.physicalLines,4);assert.equal(scan.summary.parsedLines,0);assert.equal(scan.summary.unknownLines,4);
  assert.equal(report.coverage[0].status,'unknown');assertNoValues(scan);assertNoValues(report);
}));

test('duplicate JSON keys and excessive depth are not accepted as a clean masked record',async()=>fixture('{"customer":{"phone":"WL_SYNTHETIC_PHONE_A","phone":"[REDACTED]"}}\n'+jsonline({a:{b:{c:{d:1}}}}),async file=>{
  const policy=demo.demoPolicy();policy.limits.maxDepth=3;const scan=await audit.scanFile(file,policy);
  assert.equal(scan.summary.parsedLines,0);assert(scan.unknown.some(item=>item.reason==='duplicate-keys'));assert(scan.unknown.some(item=>item.reason==='depth-limit'));assertNoValues(scan);
}));

test('bounded bytes, line size and physical line count leave uncovered input unknown',async()=>{
  await fixture(jsonline(baseRecord({message:'PRIVATE_VALUE_CANARY'.repeat(200)})),async file=>{
    const policy=demo.demoPolicy();policy.limits.maxLineBytes=128;const scan=await audit.scanFile(file,policy);
    assert.equal(scan.summary.unknownLines,1);assert(scan.unknown.some(item=>item.reason==='oversize-line'));assertNoValues(scan);
  });
  await fixture(jsonline(baseRecord()).repeat(10),async file=>{
    const policy=demo.demoPolicy();policy.limits.maxBytes=256;const scan=await audit.scanFile(file,policy);
    assert(scan.summary.bytesRead<=256);assert.equal(scan.summary.fileFullyRead,false);assert(scan.unknown.some(item=>item.reason==='input-limit'));
    policy.limits.maxBytes=1048576;policy.limits.maxLines=1;const lines=await audit.scanFile(file,policy);assert.equal(lines.summary.physicalLines,1);assert.equal(lines.summary.fileFullyRead,false);
  });
});

test('strict key/value records support quoted values but classify prefixes and duplicate keys as unknown',async()=>fixture('traceId=t1 errorCode=OK service=sample-service duration=0 phone="WL_SYNTHETIC_PHONE_A"\n2026-01-01 INFO phone=PRIVATE_VALUE_CANARY\nphone=WL_SYNTHETIC_PHONE_A phone=redacted\n',async file=>{
  const scan=await audit.scanFile(file,demo.demoPolicy(),{format:'kv',label:'kv-fixture'});
  assert.equal(scan.summary.parsedLines,1);assert.equal(scan.summary.unknownLines,2);assert.equal(scan.fields[1].canaryRows,1);
  assert(scan.required.every(field=>field.validRows===1));assertNoValues(scan);
}));

test('invalid UTF-8 is unknown instead of silently replacing bytes',async()=>fixture(Buffer.from([0xff,0xfe,0x7b,0x7d,0x0a]),async file=>{
  const scan=await audit.scanFile(file,demo.demoPolicy());assert.equal(scan.summary.unknownLines,1);assert(scan.unknown.some(item=>item.reason==='invalid-utf8'));
}));

test('removing mandatory correlation fields is detected rather than counted as a successful privacy fix',async()=>fixture(jsonline({event:'lookup.completed'}),async file=>{
  const scan=await audit.scanFile(file,demo.demoPolicy());const report=audit.toReport(scan);
  assert(scan.required.every(field=>field.missingRows===1));assert.equal(report.findings.filter(item=>item.id.startsWith('observability-')).length,4);
}));

test('raw personal values cannot be provided as synthetic canaries and conflicting field policies fail safely',()=>{
  const policy=demo.demoPolicy();policy.canaries[0].value='PRIVATE_VALUE_CANARY';
  assert.throws(()=>audit.validatePolicy(policy),error=>!error.message.includes('PRIVATE_VALUE_CANARY'));
  const conflict=demo.demoPolicy();conflict.fields[0].jsonPointers=['/traceId'];assert.throws(()=>audit.validatePolicy(conflict),/동시에/);
});

test('CLI writes a sanitized evidence-review report and only counts to stdout',async()=>fixture(jsonline(baseRecord({customer:{phone:'WL_SYNTHETIC_PHONE_A'}})),async(file,dir)=>{
  const rules=path.join(dir,'policy.json'),out=path.join(dir,'report.json');fs.writeFileSync(rules,JSON.stringify(demo.demoPolicy()));
  const result=await exec(process.execPath,[cli,'--rules',rules,'--input',file,'--out',out,'--label','sample-input']);
  assert.equal(JSON.parse(result.stdout).parsedLines,1);assert.equal(result.stderr,'');
  const report=JSON.parse(fs.readFileSync(out,'utf8'));assert.equal(report.mode,'evidence-review');assertNoValues(report);assertNoValues(result);
  assert(!JSON.stringify(report).includes(file));
}));

test('CLI error paths do not echo malformed rules, private paths, excerpts, partial values or hashes',async()=>fixture('',async(file,dir)=>{
  const rules=path.join(dir,'rules.json'),out=path.join(dir,'out.json');fs.writeFileSync(rules,'{"PRIVATE_VALUE_CANARY":');
  await assert.rejects(()=>exec(process.execPath,[cli,'--rules',rules,'--input',file,'--out',out]),error=>{assert(!error.stderr.includes('PRIVATE_VALUE_CANARY'));assert(!error.stderr.includes(dir));return true;});
  fs.writeFileSync(rules,JSON.stringify(demo.demoPolicy()));
  await assert.rejects(()=>exec(process.execPath,[cli,'--rules',rules,'--input',path.join(dir,'PRIVATE_PATH_CANARY'),'--out',out]),error=>{assert(!error.stderr.includes('PRIVATE_PATH_CANARY'));assert(!error.stderr.includes(dir));return true;});
}));

test('existing output cannot overwrite the input log, and input bytes stay unchanged',async()=>fixture(jsonline(baseRecord({customer:{phone:'WL_SYNTHETIC_PHONE_A'}})),async(file,dir)=>{
  const rules=path.join(dir,'rules.json');fs.writeFileSync(rules,JSON.stringify(demo.demoPolicy()));const before=fs.readFileSync(file);
  await assert.rejects(()=>exec(process.execPath,[cli,'--rules',rules,'--input',file,'--out',file]),error=>error.stderr.includes('OUTPUT_OPEN'));
  assert.deepEqual(fs.readFileSync(file),before);
}));

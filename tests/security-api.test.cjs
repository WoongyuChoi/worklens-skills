'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const exec=promisify(execFile);
const probe=require('../skills/api-authz-probe/scripts/probe.cjs');
const {createDemoServer,demoManifest,DEMO_ENV,send}=require('../skills/api-authz-probe/scripts/demo.cjs');

async function withDemo(fn,options={}) {const demo=await createDemoServer(options);try{return await fn(demo,demoManifest(demo.origin));}finally{await demo.close();}}
function compact(manifest) {
  manifest.principals=manifest.principals.slice(0,2);
  manifest.calibrations[0].cases=manifest.calibrations[0].cases.slice(0,2);
  manifest.routes=manifest.routes.slice(0,1);
  manifest.routes[0].cases=manifest.routes[0].cases.slice(0,2);
  return manifest;
}
function finding(report,route='vulnerable',id='anonymous-denied') {return report.findings.find(item=>item.id==='authz-'+route+'-'+id);}

test('plan is network-free and does not even read credential environment values',async()=>withDemo(async(demo,manifest)=>{
  const env=new Proxy({}, {get(){throw new Error('plan read a credential');}});
  const report=await probe.run(manifest,{execute:false,env});
  assert.equal(demo.state.requests,0);
  assert.equal(report.mode,'static');
  assert.deepEqual(probe.coverageCounts(report),{total:12,tested:0,skipped:0,unknown:12});
  assert(report.findings.every(item=>item.status==='unknown'));
}));

test('real loopback HTTP demonstrates vulnerable and fixed routes without mutations or body/credential output',async()=>withDemo(async(demo,manifest)=>{
  const report=await probe.run(manifest,{execute:true,env:DEMO_ENV});
  assert.equal(demo.state.requests,12);
  assert.equal(demo.state.mutations,0);
  assert(demo.unchanged());
  assert(demo.state.methods.every(method=>method==='GET'));
  assert.equal(report.findings.filter(item=>item.status==='confirmed').length,3);
  assert.equal(report.findings.filter(item=>item.status==='not-reproduced').length,3);
  assert.deepEqual(probe.coverageCounts(report),{total:12,tested:12,skipped:0,unknown:0});
  const serialized=JSON.stringify(report);
  for(const secret of [...Object.values(DEMO_ENV),'WL_SYNTHETIC_RECORD_A','synthetic-record-a-0001','합성 테스트 자료'])assert(!serialized.includes(secret));
  for(const item of report.findings.filter(item=>item.status==='confirmed'))assert(item.evidence.some(e=>e.kind==='runtime'));
  // Server arrival times include variable local socket scheduling; check the whole burst budget.
  assert(demo.state.starts.at(-1)-demo.state.starts[0]>=(demo.state.starts.length-2)*manifest.limits.minIntervalMs,'bounded request rate');
}));

test('missing or wrong valid-account calibration never confirms target vulnerability',async()=>withDemo(async(demo,manifest)=>{
  compact(manifest);
  const missing=await probe.run(manifest,{execute:true,env:{}});
  assert.equal(demo.state.requests,1);
  assert.equal(finding(missing).status,'unknown');
  const wrong=await probe.run(manifest,{execute:true,env:{WL_OWNER_AUTH:'Bearer incorrect'}});
  assert.equal(demo.state.requests,3);
  assert.equal(finding(wrong).status,'unknown');
}));

test('authenticated peer identity must differ; a token for the baseline owner cannot stand in for another account',async()=>withDemo(async(demo,manifest)=>{
  manifest.routes=manifest.routes.slice(0,1);
  const report=await probe.run(manifest,{execute:true,env:{...DEMO_ENV,WL_PEER_AUTH:DEMO_ENV.WL_OWNER_AUTH}});
  assert.equal(finding(report,'vulnerable','peer-denied').status,'unknown');
  assert.equal(finding(report).status,'confirmed');
  const duplicate=structuredClone(manifest);
  duplicate.calibrations[0].cases[2].marker.equals=duplicate.calibrations[0].cases[1].marker.equals;
  assert.throws(()=>probe.validateManifest(duplicate),/서로 다른 계정/);
}));

test('HTTP 200 login HTML and JSON without the supplied marker remain unknown',async()=>{
  for(const html of [true,false])await withDemo(async(demo,manifest)=>{
    compact(manifest);
    const report=await probe.run(manifest,{execute:true,env:DEMO_ENV});
    assert.equal(finding(report).status,'unknown');
    assert.equal(demo.state.requests,4);
  },{handler(req,res,principal){if(req.url.startsWith('/demo/vulnerable/')&&!principal){res.writeHead(200,{'Content-Type':html?'text/html':'application/json'});res.end(html?'<p>Login WL_SYNTHETIC_RECORD_A</p>':JSON.stringify({login:true}));return true;}}});
});

test('a denied status leaking the synthetic record is still confirmed',async()=>withDemo(async(demo,manifest)=>{
  compact(manifest);
  const report=await probe.run(manifest,{execute:true,env:DEMO_ENV});
  assert.equal(finding(report).status,'confirmed');
}, {handler(req,res,principal){if(req.url.startsWith('/demo/vulnerable/')&&!principal){send(res,403,{record:{marker:'WL_SYNTHETIC_RECORD_A'}});return true;}}}));

test('redirects are never followed, including another local origin, and Location values are omitted',async()=>{
  let sinkRequests=0;
  const sink=http.createServer((req,res)=>{sinkRequests++;res.end('unexpected');});
  await new Promise(resolve=>sink.listen(0,'127.0.0.1',resolve));
  const destination='http://127.0.0.1:'+sink.address().port+'/never-call?token=PRIVATE_LOCATION_CANARY';
  try{await withDemo(async(demo,manifest)=>{
    compact(manifest);
    const report=await probe.run(manifest,{execute:true,env:DEMO_ENV});
    assert.equal(sinkRequests,0);
    assert.equal(finding(report).status,'unknown');
    assert(!JSON.stringify(report).includes('PRIVATE_LOCATION_CANARY'));
  },{handler(req,res,principal){if(req.url.startsWith('/demo/vulnerable/')&&!principal){res.writeHead(302,{Location:destination,'Set-Cookie':'secret=COOKIE_CANARY'});res.end();return true;}}});}
  finally{await new Promise(resolve=>sink.close(resolve));}
});

test('write methods and side-effect-unconfirmed reads are counted as skipped and never sent',async()=>withDemo(async(demo,manifest)=>{
  manifest.routes[0].method='DELETE';
  manifest.routes[0].sideEffectFreeConfirmed=true;
  manifest.routes[1].sideEffectFreeConfirmed=false;
  const report=await probe.run(manifest,{execute:true,env:DEMO_ENV});
  assert.equal(demo.state.requests,4);
  assert.equal(demo.state.mutations,0);
  assert(demo.unchanged());
  assert.deepEqual(probe.coverageCounts(report),{total:12,tested:4,skipped:8,unknown:0});
}));

test('strict origin/path/schema validation rejects boundary escapes before any HTTP request',async()=>withDemo(async(demo,manifest)=>{
  for(const bad of ['//localhost/escape','https://example.invalid/escape','/a/../b','/a/%2e%2e/b','/a/%252e%252e/b','/a/%2f/b','/a\\b','/a\r\nHost:x','/a#fragment','/a//b']){
    const copy=structuredClone(manifest);copy.routes[0].path=bad;
    await assert.rejects(()=>probe.run(copy,{execute:true,env:DEMO_ENV}));
  }
  for(const bad of ['http://user:secret@127.0.0.1','http://127.0.0.1/path','http://127.0.0.1/','file:///tmp/a','http://localhost:80']){
    const copy=structuredClone(manifest);copy.scope.origin=bad;
    await assert.rejects(()=>probe.run(copy,{execute:true,env:DEMO_ENV}));
  }
  const headers=structuredClone(manifest);headers.routes[0].headers={Host:'unexpected'};
  await assert.rejects(()=>probe.run(headers,{execute:true,env:DEMO_ENV}));
  assert.equal(demo.state.requests,0);
}));

test('explicit authorization, policy and credential-header validation prevent accidental execution',async()=>withDemo(async(demo,manifest)=>{
  manifest.scope.authorizationConfirmed=false;
  await assert.rejects(()=>probe.run(manifest,{execute:true,env:DEMO_ENV}),/승인되지/);
  assert.equal(demo.state.requests,0);
  manifest.scope.authorizationConfirmed=true;compact(manifest);
  manifest.routes[0].cases[1].policyConfirmed=false;
  const report=await probe.run(manifest,{execute:true,env:DEMO_ENV});
  assert.equal(demo.state.requests,3);
  assert.equal(finding(report).status,'unknown');
  const bad=structuredClone(manifest);bad.principals[1].credential.header='Host';
  assert.throws(()=>probe.validateManifest(bad),/인증정보/);
}));

test('a denied case cannot confirm an unrelated error or identity marker instead of the protected object',async()=>withDemo(async(demo,manifest)=>{
  compact(manifest);
  manifest.routes[0].cases[1].marker={pointer:'/error',equals:'WL_SYNTHETIC_UNRELATED_ERROR'};
  await assert.rejects(()=>probe.run(manifest,{execute:true,env:DEMO_ENV}),/동일한 합성 마커/);
  assert.equal(demo.state.requests,0);
}));

test('request budget stops exactly at the configured count and retains the full coverage denominator',async()=>withDemo(async(demo,manifest)=>{
  manifest.limits.maxRequests=5;
  const report=await probe.run(manifest,{execute:true,env:DEMO_ENV});
  assert.equal(demo.state.requests,5);
  assert.equal(probe.coverageCounts(report).total,12);
  assert(report.coverage.some(item=>item.status==='skipped'));
  assert.equal(report.findings.filter(item=>item.status==='confirmed').length,0);
}));

test('bounded response size and wall-clock timeout yield unknown without retries or response content',async()=>{
  for(const mode of ['oversized','timeout'])await withDemo(async(demo,manifest)=>{
    compact(manifest);manifest.limits.timeoutMs=100;manifest.limits.maxBodyBytes=256;
    const report=await probe.run(manifest,{execute:true,env:DEMO_ENV});
    assert.equal(finding(report).status,'unknown');
    assert.equal(demo.state.requests,4);
    assert(!JSON.stringify(report).includes('RESPONSE_SECRET_CANARY'));
  },{handler(req,res,principal){if(req.url.startsWith('/demo/vulnerable/')&&!principal){if(mode==='oversized')send(res,200,{record:{marker:'WL_SYNTHETIC_RECORD_A'},secret:'RESPONSE_SECRET_CANARY'.repeat(500)});else{res.writeHead(200,{'Content-Type':'application/json'});res.write('{');}return true;}}});
});

test('HEAD checks use only an explicitly provided synthetic header marker and do not rely on an empty body',async()=>withDemo(async(demo,manifest)=>{
  compact(manifest);
  manifest.calibrations[0].method='HEAD';
  manifest.calibrations[0].cases[1].marker={header:'x-worklens-synthetic-marker',equals:'WL_SYNTHETIC_IDENTITY_OWNER_A'};
  manifest.routes[0].method='HEAD';
  for(const item of manifest.routes[0].cases)item.marker={header:'x-worklens-synthetic-marker',equals:'WL_SYNTHETIC_RECORD_A'};
  const report=await probe.run(manifest,{execute:true,env:DEMO_ENV});
  assert.equal(finding(report).status,'confirmed');
  assert(demo.state.methods.every(method=>method==='HEAD'));
}));

test('CLI defaults to plan and prints counts, not origins, credentials or response bodies',async()=>withDemo(async(demo,manifest)=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'worklens-api-test-'));
  try{
    const manifestFile=path.join(dir,'manifest.json'),out=path.join(dir,'report.json');
    fs.writeFileSync(manifestFile,JSON.stringify(manifest));
    const result=await exec(process.execPath,[path.resolve(__dirname,'../skills/api-authz-probe/scripts/probe.cjs'),'--manifest',manifestFile,'--out',out]);
    assert.equal(demo.state.requests,0);
    assert.equal(JSON.parse(result.stdout).mode,'static');
    assert(!result.stdout.includes(demo.origin));
    assert.equal(JSON.parse(fs.readFileSync(out,'utf8')).coverage.length,12);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
}));

test('standalone local demo creates reviewable results and proves zero plan traffic and zero changes',async()=>{
  const parent=fs.mkdtempSync(path.join(os.tmpdir(),'worklens-demo-test-'));
  try{
    const out=path.join(parent,'results');
    const result=await exec(process.execPath,[path.resolve(__dirname,'../skills/api-authz-probe/scripts/demo.cjs'),'--out-dir',out]);
    const checks=JSON.parse(result.stdout);
    assert.equal(checks.planRequests,0);assert.equal(checks.mutationRequests,0);assert(checks.recordUnchanged);
    assert.equal(checks.confirmed,3);assert.equal(checks.notReproduced,3);
    assert.equal(JSON.parse(fs.readFileSync(path.join(out,'report.json'),'utf8')).mode,'local-demo');
  }finally{fs.rmSync(parent,{recursive:true,force:true});}
});
test('source evidence preserves Korean paths and rejects traversal or control characters',()=>{
 const manifest=demoManifest('http://127.0.0.1:8080');
 manifest.routes[0].source={path:'src/고객 조회/Controller.java',line:12};
 assert.equal(probe.validateManifest(manifest).routes[0].source.path,'src/고객 조회/Controller.java');
 for(const path of ['../secret.java','src/../secret.java','src/\nsecret.java']){manifest.routes[0].source.path=path;assert.throws(()=>probe.validateManifest(manifest));}
});
test('CLI refuses an occupied output before sending any live request',async()=>withDemo(async(demo,manifest)=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'worklens-probe-output-'));
 try{const input=path.join(dir,'manifest.json'),out=path.join(dir,'existing.json');fs.writeFileSync(input,JSON.stringify(manifest));fs.writeFileSync(out,'preserve');
  await assert.rejects(exec(process.execPath,[path.resolve(__dirname,'../skills/api-authz-probe/scripts/probe.cjs'),'--manifest',input,'--execute','--out',out],{env:{...process.env,...DEMO_ENV}}),e=>e.stderr.includes('REPORT_WRITE'));
  assert.equal(demo.state.requests,0);assert.equal(fs.readFileSync(out,'utf8'),'preserve');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}));

#!/usr/bin/env node
'use strict';

// Isolated demonstration: two business endpoints and one identity calibration endpoint.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const {run, coverageCounts} = require('./probe.cjs');

const DEMO_ENV = Object.freeze({WL_OWNER_AUTH:'Bearer local-demo-owner', WL_PEER_AUTH:'Bearer local-demo-peer', WL_OTHER_ORG_AUTH:'Bearer local-demo-other-org'});
const PRINCIPALS = Object.freeze({
  'Bearer local-demo-owner':{id:'owner-a',org:'org-a',marker:'WL_SYNTHETIC_IDENTITY_OWNER_A'},
  'Bearer local-demo-peer':{id:'peer-b',org:'org-a',marker:'WL_SYNTHETIC_IDENTITY_PEER_B'},
  'Bearer local-demo-other-org':{id:'other-org',org:'org-b',marker:'WL_SYNTHETIC_IDENTITY_OTHER_ORG'}
});
const RECORD = Object.freeze({id:'synthetic-record-a-0001',owner:'owner-a',org:'org-a',marker:'WL_SYNTHETIC_RECORD_A',sample:'합성 테스트 자료'});
function send(res,status,body,headers={}) { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...headers}); res.end(JSON.stringify(body)); }
async function createDemoServer(options={}) {
  const state = {requests:0, mutations:0, methods:[],starts:[], before:crypto.createHash('sha256').update(JSON.stringify(RECORD)).digest('hex')};
  const server = http.createServer((req,res) => {
    state.requests++; state.methods.push(req.method); state.starts.push(performance.now());
    if (!['GET','HEAD'].includes(req.method)) { state.mutations++; send(res,405,{error:'method-not-allowed'}); return; }
    const principal = PRINCIPALS[req.headers.authorization] || null;
    if (options.handler && options.handler(req,res,principal,state) === true) return;
    if (req.url === '/demo/session') {
      if (!principal) send(res,401,{error:'authentication-required'});
      else send(res,200,{identity:principal.marker},{'x-worklens-synthetic-marker':principal.marker});
    } else if (req.url === '/demo/vulnerable/records/synthetic-record-a-0001') {
      send(res,200,{record:RECORD},{'x-worklens-synthetic-marker':RECORD.marker});
    } else if (req.url === '/demo/fixed/records/synthetic-record-a-0001') {
      if (!principal) send(res,401,{error:'authentication-required'});
      else if (principal.id !== RECORD.owner || principal.org !== RECORD.org) send(res,403,{error:'access-denied'});
      else send(res,200,{record:RECORD},{'x-worklens-synthetic-marker':RECORD.marker});
    } else send(res,404,{error:'not-found'});
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return {server,state,origin:'http://127.0.0.1:'+server.address().port,unchanged:()=>state.before===crypto.createHash('sha256').update(JSON.stringify(RECORD)).digest('hex'),close:()=>new Promise(resolve=>server.close(resolve))};
}
function demoManifest(origin) {
  const marker={pointer:'/record/marker',equals:'WL_SYNTHETIC_RECORD_A'};
  const cases = [
    {id:'owner-baseline',principal:'owner-a',expect:'allow',policyConfirmed:true,marker},
    {id:'anonymous-denied',principal:'anonymous',expect:'deny',policyConfirmed:true,marker},
    {id:'peer-denied',principal:'peer-b',expect:'deny',policyConfirmed:true,marker},
    {id:'other-org-denied',principal:'other-org',expect:'deny',policyConfirmed:true,marker}
  ];
  return {schema:'worklens-api-probe/v1',mode:'local-demo',scope:{origin,authorizationConfirmed:true,description:'합성 객체와 테스트 계정으로만 동작하는 loopback 데모',vantage:'loopback'},limits:{maxRequests:20,minIntervalMs:100,timeoutMs:1000,maxBodyBytes:8192,maxDurationMs:10000},principals:[
    {id:'anonymous',kind:'anonymous'},
    {id:'owner-a',kind:'authenticated',credential:{header:'Authorization',env:'WL_OWNER_AUTH'}},
    {id:'peer-b',kind:'authenticated',credential:{header:'Authorization',env:'WL_PEER_AUTH'}},
    {id:'other-org',kind:'authenticated',credential:{header:'Authorization',env:'WL_OTHER_ORG_AUTH'}}
  ],calibrations:[{id:'identity',method:'GET',path:'/demo/session',sideEffectFreeConfirmed:true,cases:[
    {id:'anonymous',principal:'anonymous',expect:'deny',policyConfirmed:true},
    {id:'owner',principal:'owner-a',expect:'allow',policyConfirmed:true,marker:{pointer:'/identity',equals:'WL_SYNTHETIC_IDENTITY_OWNER_A'}},
    {id:'peer',principal:'peer-b',expect:'allow',policyConfirmed:true,marker:{pointer:'/identity',equals:'WL_SYNTHETIC_IDENTITY_PEER_B'}},
    {id:'other-org',principal:'other-org',expect:'allow',policyConfirmed:true,marker:{pointer:'/identity',equals:'WL_SYNTHETIC_IDENTITY_OTHER_ORG'}}
  ]}],routes:['vulnerable','fixed'].map(id=>({id,method:'GET',path:'/demo/'+id+'/records/synthetic-record-a-0001',sideEffectFreeConfirmed:true,policyNote:'레코드는 소유자와 동일 조직에만 공개하는 합성 업무 정책',baselineCaseId:'owner-baseline',cases:structuredClone(cases)}))};
}
async function main(argv=process.argv.slice(2)) {
  if (argv.length !== 2 || argv[0] !== '--out-dir') { process.stderr.write('사용법: node demo.cjs --out-dir 새결과폴더\n'); return 1; }
  let demo;
  try {
    // A new directory prevents silently replacing a previous demonstration result.
    fs.mkdirSync(argv[1],{recursive:false,mode:0o700});
    demo = await createDemoServer();
    const manifest = demoManifest(demo.origin);
    const plan = await run(manifest,{execute:false,env:DEMO_ENV});
    const planRequests = demo.state.requests;
    const report = await run(manifest,{execute:true,env:DEMO_ENV});
    const checks = {mode:'local-demo',planRequests,executionRequests:demo.state.requests,mutationRequests:demo.state.mutations,recordUnchanged:demo.unchanged(),confirmed:report.findings.filter(item=>item.status==='confirmed').length,notReproduced:report.findings.filter(item=>item.status==='not-reproduced').length,coverage:coverageCounts(report)};
    for (const [name,value] of [['plan.json',plan],['report.json',report],['checks.json',checks],['manifest.json',manifest]]) fs.writeFileSync(path.join(argv[1],name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
    process.stdout.write(JSON.stringify(checks)+'\n');
    return 0;
  } catch { process.stderr.write('로컬 데모를 완료하지 못했습니다. 새 출력 폴더와 Node 22+ 실행 권한을 확인하세요. 상세 값은 출력하지 않습니다.\n'); return 1; }
  finally { if (demo) await demo.close(); }
}
module.exports={createDemoServer,demoManifest,DEMO_ENV,send};
if(require.main===module)main().then(code=>{process.exitCode=code;});

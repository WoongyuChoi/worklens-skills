#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {scanFile,toReport}=require('./check-logs.cjs');

function demoPolicy(){return {
  schema:'worklens-privacy-policy/v1',policySource:{path:'assets/demo-policy.md',line:3},
  fields:[
    {id:'customer-name',classification:'personal',decision:'exclude',policyConfirmed:true,jsonPointers:['/customer/name'],kvKeys:['customerName']},
    {id:'phone',classification:'personal',decision:'exclude',policyConfirmed:true,jsonPointers:['/customer/phone'],kvKeys:['phone']},
    {id:'access-token',classification:'credential',decision:'exclude',policyConfirmed:true,jsonPointers:['/customer/accessToken','/mdc/accessToken'],kvKeys:['accessToken']}
  ],requiredFields:[
    {id:'traceId',type:'string',jsonPointers:['/traceId'],kvKeys:['traceId']},
    {id:'errorCode',type:'string',jsonPointers:['/errorCode'],kvKeys:['errorCode']},
    {id:'service',type:'string',jsonPointers:['/service'],kvKeys:['service']},
    {id:'duration',type:'number',jsonPointers:['/duration'],kvKeys:['duration']}
  ],canaries:[
    {field:'customer-name',value:'WL_SYNTHETIC_NAME_A'},
    {field:'phone',value:'WL_SYNTHETIC_PHONE_A'},
    {field:'access-token',value:'WL_SYNTHETIC_TOKEN_A'}
  ],limits:{maxBytes:1048576,maxLineBytes:16384,maxLines:1000,maxDepth:12,maxNodesPerLine:2048,maxEvidenceLines:20}
};}
function records(fixed){
  const customer={name:'WL_SYNTHETIC_NAME_A',phone:'WL_SYNTHETIC_PHONE_A',accessToken:'WL_SYNTHETIC_TOKEN_A'};
  const events=[
    {traceId:'synthetic-trace-1',errorCode:'OK',service:'sample-service',duration:12},
    {traceId:'synthetic-trace-2',errorCode:'VALIDATION_REJECTED',service:'sample-service',duration:0},
    {traceId:'synthetic-trace-3',errorCode:'ACCESS_DENIED',service:'sample-service',duration:7}
  ];
  if(fixed)return events.map((event,index)=>({...event,event:index===0?'lookup.completed':index===1?'validation.rejected':'access.denied'}));
  return [
    {...events[0],customer},
    {...events[1],message:'request rejected: '+JSON.stringify(customer)},
    {...events[2],mdc:{accessToken:customer.accessToken}}
  ];
}
function emitLogs(file,fixed){
  const fd=fs.openSync(file,'wx',0o600);
  try{for(const record of records(fixed))fs.writeSync(fd,JSON.stringify(record)+'\n');}finally{fs.closeSync(fd);}
}
async function runDemo(directory){
  fs.mkdirSync(directory,{recursive:false,mode:0o700});
  const policy=demoPolicy(),beforeFile=path.join(directory,'before.jsonl'),afterFile=path.join(directory,'after.jsonl');
  emitLogs(beforeFile,false);emitLogs(afterFile,true);
  const before=await scanFile(beforeFile,policy,{format:'jsonl',label:'synthetic-before'});
  const after=await scanFile(afterFile,policy,{format:'jsonl',label:'synthetic-after'});
  const reports=[toReport(before,{mode:'local-demo'}),toReport(after,{mode:'local-demo'})];
  const checks={mode:'local-demo',beforeCanaryRows:before.fields.reduce((sum,item)=>sum+item.canaryRows,0),afterCanaryRows:after.fields.reduce((sum,item)=>sum+item.canaryRows,0),afterExcludedFieldRows:after.fields.reduce((sum,item)=>sum+item.presentRows,0),beforeRequiredValid:before.required.reduce((sum,item)=>sum+item.validRows,0),afterRequiredValid:after.required.reduce((sum,item)=>sum+item.validRows,0),afterRequiredMissing:after.required.reduce((sum,item)=>sum+item.missingRows,0),beforeUnknown:before.summary.unknownLines,afterUnknown:after.summary.unknownLines};
  for(const [name,value]of [['policy.json',policy],['before-report.json',reports[0]],['after-report.json',reports[1]],['reports.json',reports],['checks.json',checks]])fs.writeFileSync(path.join(directory,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  return checks;
}
async function main(argv=process.argv.slice(2)){
  if(argv.length!==2||argv[0]!=='--out-dir'){process.stderr.write('사용법: node demo.cjs --out-dir 새결과폴더\n');return 1;}
  try{const checks=await runDemo(argv[1]);process.stdout.write(JSON.stringify(checks)+'\n');return 0;}
  catch{process.stderr.write('합성 로그 데모를 완료하지 못했습니다. 새 출력 폴더와 로컬 실행 권한을 확인하세요. 경로·내용·예외 값은 출력하지 않습니다.\n');return 1;}
}
module.exports={demoPolicy,records,emitLogs,runDemo};
if(require.main===module)main().then(code=>{process.exitCode=code;});

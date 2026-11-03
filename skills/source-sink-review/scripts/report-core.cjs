'use strict';
(function(root){
 const STATES={'confirmed':'실행 근거 있음','suspected':'정적 근거·의심','not-reproduced':'해당 사례 미재현','unknown':'확인 못 함','not-applicable':'적용 조건 불성립'};
 const MODES={'local-demo':'로컬 합성 예제','static':'정적 검토','authorized-live':'지정 범위 직접 실행','evidence-review':'제공된 실행 기록 검토'};
 const SEVERITIES={'critical':'심각','high':'높음','medium':'중간','low':'낮음','info':'정보'};
 function obj(x,label){if(!x||typeof x!=='object'||Array.isArray(x))throw Error(label+'는 객체여야 합니다.');return x;}
 function str(x,label,max=12000){if(typeof x!=='string'||x.length>max)throw Error(label+'는 길이가 제한된 문자열이어야 합니다.');return x;}
 function arr(x,label,max=2000){if(!Array.isArray(x)||x.length>max)throw Error(label+' 배열이 없거나 너무 큽니다.');return x;}
 function strings(x,label){return arr(x||[],label,100).map(v=>str(v,label));}
 function normalizeReport(raw){
  obj(raw,'보고서');if(raw.schema!=='worklens-security-report/v1')throw Error('지원 형식: worklens-security-report/v1');
  const title=str(raw.title,'title',500),skill=str(raw.skill,'skill',100),generatedAt=str(raw.generatedAt,'generatedAt',100);
  if(!Object.hasOwn(MODES,raw.mode))throw Error('mode가 올바르지 않습니다.');
  const scope=obj(raw.scope,'scope');
  const ids=new Set();const findings=arr(raw.findings,'findings',1000).map(f=>{
   obj(f,'finding');const id=str(f.id,'finding.id',150);if(!id||ids.has(id))throw Error('finding ID가 비어 있거나 중복입니다.');ids.add(id);
   if(!Object.hasOwn(STATES,f.status)||!Object.hasOwn(SEVERITIES,f.severity))throw Error('finding 상태/심각도가 올바르지 않습니다.');
   const evidence=arr(f.evidence||[],'evidence',1000).map(e=>{obj(e,'evidence');return {kind:str(e.kind,'evidence.kind',100),location:str(e.location,'evidence.location',1000),detail:str(e.detail,'evidence.detail')};});
   if(f.status==='confirmed'&&(raw.mode==='static'||!evidence.some(e=>['runtime','trace'].includes(e.kind))))throw Error('실행 근거 있음에는 실행 모드와 runtime/trace 근거가 필요합니다.');
   return {...f,id,title:str(f.title,'finding.title',1000),severity:f.severity,status:f.status,summary:str(f.summary,'finding.summary'),evidence,conditions:strings(f.conditions,'conditions'),fix:strings(f.fix,'fix'),retest:strings(f.retest,'retest'),flow:arr(f.flow||[],'flow',20).map(v=>({label:str(v.label,'flow.label',200),detail:str(v.detail,'flow.detail',2000)})),triageState:typeof f.triageState==='string'?str(f.triageState,'triageState',100):'',boundaryState:typeof f.boundaryState==='string'?str(f.boundaryState,'boundaryState',100):''};
  });
  const sources=arr(raw.sources||[],'sources',200).map(s=>({title:str(s.title,'source.title',1000),url:str(s.url,'source.url',2000),publishedAt:str(s.publishedAt||'','source.publishedAt',100),retrievedAt:str(s.retrievedAt||'','source.retrievedAt',100)}));
  return {...raw,schema:raw.schema,title,skill,generatedAt,mode:raw.mode,scope:{...scope,description:str(scope.description,'scope.description'),vantage:str(scope.vantage||'미기록','scope.vantage',1000),targets:strings(scope.targets,'scope.targets'),limitations:strings(scope.limitations,'scope.limitations')},findings,coverage:arr(raw.coverage||[],'coverage').map(c=>({target:str(c.target,'coverage.target',1000),status:str(c.status,'coverage.status',150),detail:str(c.detail,'coverage.detail')})),sources};
 }
 function normalizeBundle(raw){const list=Array.isArray(raw)?raw:[raw];if(!list.length||list.length>20)throw Error('보고서는 1~20개까지 함께 열 수 있습니다.');return list.map(normalizeReport);}
 function safeJSON(data){return JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
 const api={normalizeReport,normalizeBundle,safeJSON,STATES,MODES,SEVERITIES};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WorklensSecurity=api;
})(typeof globalThis==='undefined'?this:globalThis);

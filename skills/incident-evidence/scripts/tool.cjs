/* Offline timeline extraction. Chronology is not a cause analysis. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WorklensTool=factory();})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
function fail(m){throw new Error(m);}
const stamp=/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:[.,](\d{1,3}))?(Z|[+-]\d{2}:\d{2})?(?=\s|\]|$)/;
function timeOf(raw,offsetMinutes){
 const m=raw.match(stamp);if(!m)return null;
 const [,Y,M,D,h,mi,s,frac,zone]=m,year=+Y,month=+M,day=+D,hour=+h,minute=+mi,second=+s,ms=+(frac||'').padEnd(3,'0');
 const local=new Date(0);local.setUTCFullYear(year,month-1,day);local.setUTCHours(hour,minute,second,ms);
 if(year<1||month<1||month>12||day<1||hour>23||minute>59||second>59||local.getUTCFullYear()!==year||local.getUTCMonth()!==month-1||local.getUTCDate()!==day)return {original:m[0],epochMs:null,reason:'유효하지 않은 날짜/시간'};
 let offset=null,basis='명시 오프셋';
 if(zone==='Z')offset=0;
 else if(zone){const zh=+zone.slice(1,3),zm=+zone.slice(4,6);if(zh>14||zm>59||(zh===14&&zm!==0))return {original:m[0],epochMs:null,reason:'지원 범위를 벗어난 UTC 오프셋'};offset=(zone[0]==='-'?-1:1)*(zh*60+zm);}
 else if(Number.isInteger(offsetMinutes)){offset=offsetMinutes;basis='사용자가 지정한 소스 고정 오프셋';}
 if(offset===null)return {original:m[0],epochMs:null,reason:'UTC 오프셋 미지정'};
 return {original:m[0],epochMs:local.getTime()-offset*60000,offsetMinutes:offset,basis,reason:null};
}
function run(req){
 if(!req||!Array.isArray(req.sources)||req.sources.length<1||req.sources.length>8)fail('sources에 1~8개 로그/조치 기록을 넣으세요.');
 const names=new Set(),events=[],unresolved=[],untimed=[];let total=0;
 for(const source of req.sources){
  if(!source||typeof source.name!=='string'||!source.name.trim()||source.name.length>200||names.has(source.name)||typeof source.text!=='string')fail('소스에는 서로 다른 이름과 원문 text가 필요합니다.');
  names.add(source.name);total+=source.text.length;if(total>2*1024*1024)fail('전체 원문은 최대 2 MiB 문자입니다.');
  if(source.offsetMinutes!==undefined&&source.offsetMinutes!==null&&(!Number.isInteger(source.offsetMinutes)||Math.abs(source.offsetMinutes)>840))fail('소스 오프셋은 -840~840 사이 정수 또는 null이어야 합니다.');
  const lines=source.text.split(/\r?\n/);if(lines.length>20000)fail('한 소스는 최대 20000줄입니다.');let current=null;
  for(let i=0;i<lines.length;i++){
   const line=lines[i],start=line.startsWith('[')?line.slice(1):line,t=timeOf(start,source.offsetMinutes);
   if(t){
    current={source:source.name,lineStart:i+1,lineEnd:i+1,originalTimestamp:t.original,epochMs:t.epochMs,utc:t.epochMs===null?null:new Date(t.epochMs).toISOString(),offsetMinutes:t.offsetMinutes??null,timeBasis:t.basis||null,unresolvedReason:t.reason,raw:line};
    (t.epochMs===null?unresolved:events).push(current);
    if(events.length+unresolved.length>10000)fail('시간이 있는 기록은 최대 10000개입니다.');
   }else{
    // A timestamp-looking but unsupported new record must not become a prior event's stack trace.
    const looksTimestamp=/^\[?\d{4}[-/]\d{2}[-/]\d{2}[T ]/.test(line);
    if(looksTimestamp){current=null;untimed.push({source:source.name,lineStart:i+1,lineEnd:i+1,raw:line,reason:'지원하지 않는 시간 형식'});}
    else if(current){current.raw+='\n'+line;current.lineEnd=i+1;}
    else if(line.trim())untimed.push({source:source.name,lineStart:i+1,lineEnd:i+1,raw:line,reason:'시간을 연결하지 못한 원문'});
   }
  }
 }
 events.sort((a,b)=>a.epochMs-b.epochMs||a.source.localeCompare(b.source)||a.lineStart-b.lineStart);
 const collisions=[];for(let i=0;i<events.length;){let j=i+1;while(j<events.length&&events[j].epochMs===events[i].epochMs)j++;if(j-i>1)collisions.push({utc:events[i].utc,records:events.slice(i,j).map(e=>({source:e.source,line:e.lineStart}))});i=j;}
 if(req.query!==undefined&&typeof req.query!=='string')fail('검색어는 문자열이어야 합니다. 식별자의 앞자리 0을 보존하세요.');
 const query=req.query||'';
 return {tool:'incident-evidence',verification:'원문 시간표 정적 추출',sourceCount:req.sources.length,parsedCount:events.length,events:query?events.filter(e=>e.raw.includes(query)):events,unresolved,untimed,sameTimestamp:collisions,filter:query,limits:['정렬은 로그에 적힌 시간/지정한 오프셋을 기준으로 합니다. 서버 간 시계 오차·수집 지연을 보정하지 않습니다.','같은 시각의 소스명/줄 번호 정렬은 화면 표시용입니다. 인과 순서나 전역 실행 순서를 뜻하지 않습니다.','시간이 불명확한 기록은 미해결 영역에 남깁니다. 원문을 수정하거나 원인·담당자·복구 성공을 자동 추론하지 않습니다.','첫 위치의 YYYY-MM-DD[T 또는 공백]HH:mm:ss[.또는 , 1~3자리][Z 또는 ±HH:mm]만 지원합니다. 선택적 앞 대괄호는 허용합니다.']};
}
function csv(result){const cell=v=>'"'+String(v??'').replace(/^[\t\r\n]|^\s*[=+\-@]/,"'$&").replace(/"/g,'""')+'"';return '\uFEFF'+[['UTC','소스','시작 줄','끝 줄','원래 시각','시간 근거','원문'],...result.events.map(e=>[e.utc,e.source,e.lineStart,e.lineEnd,e.originalTimestamp,e.timeBasis,e.raw])].map(row=>row.map(cell).join(',')).join('\r\n');}
return {run,timeOf,csv};
});
if(typeof require==='function'&&typeof module==='object'&&require.main===module){try{const fs=require('node:fs');if(process.argv.length!==4)throw new Error('사용법: node tool.cjs 요청.json 새결과.json');const result=module.exports.run(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(process.argv[2]))));fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n',{flag:'wx'});}catch(e){console.error(e.message);process.exitCode=1;}}

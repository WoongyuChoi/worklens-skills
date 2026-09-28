#!/usr/bin/env node
'use strict';
const Worklens=(()=>{
// Original Worklens helpers; embedded into each independently portable tool.
const MAX_BYTES=2*1024*1024, MAX_ROWS=10000;
function need(ok,message){if(!ok)throw new Error(message);}
function textInput(value){need(typeof value==='string','텍스트 입력이 필요합니다.');need(new TextEncoder().encode(value).length<=MAX_BYTES,'입력 하나는 UTF-8 기준 2 MiB 이하여야 합니다.');return value.replace(/^\uFEFF/,'');}
function parseCSV(raw,delimiter=','){
 const text=textInput(raw);need([',','\t',';','|'].includes(delimiter),'지원하지 않는 구분자입니다.');
 let rows=[],row=[],value='',quoted=false,closed=false,start=true;
 const field=()=>{row.push(value);value='';closed=false;start=true;};
 const record=()=>{field();rows.push(row);row=[];need(rows.length<=MAX_ROWS+1,'데이터는 10,000행 이하여야 합니다.');};
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}}else value+=c;continue;}
  if(c===delimiter){field();continue;}if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;record();continue;}
  need(!closed,'닫는 따옴표 뒤에는 구분자 또는 줄바꿈이 필요합니다.');
  if(c==='"'){need(start,'CSV 따옴표 위치를 확인하세요.');quoted=true;start=false;}else{value+=c;start=false;}
 }
 need(!quoted,'닫히지 않은 CSV 따옴표가 있습니다.');if(value!==''||row.length||closed)record();
 need(rows.length>0,'입력이 비어 있습니다.');const headers=rows.shift();
 need(headers.length<=200,'열은 200개 이하여야 합니다.');need(headers.every(h=>h.trim()!==''),'빈 열 이름이 있습니다.');need(new Set(headers).size===headers.length,'중복 열 이름이 있습니다.');
 rows.forEach((r,i)=>need(r.length===headers.length,(i+2)+'번째 레코드의 열 수가 다릅니다.'));
 return {headers,rows};
}
// Lossless JSON AST: duplicate keys and excessive nesting are rejected.
function jsonTree(raw){
 const text=textInput(raw);let i=0,nodes=0;const ws=()=>{while(/[\t\n\r ]/.test(text[i]||'x'))i++;};
 function string(){const begin=i++;for(;i<text.length;i++){if(text[i]==='\\'){i++;continue;}if(text[i]==='"'){i++;try{return JSON.parse(text.slice(begin,i));}catch{throw Error('JSON 문자열을 확인하세요.');}}}throw Error('닫히지 않은 JSON 문자열입니다.');}
 function read(depth){need(depth<=64&&++nodes<=150000,'JSON 구조가 너무 큽니다.');ws();const c=text[i];
  if(c==='"')return {kind:'string',value:string()};
  if(c==='{'||c==='['){const obj=c==='{',end=obj?'}':']';i++;ws();const values=[],seen=new Set();if(text[i]===end){i++;return {kind:obj?'object':'array',value:values};}
   while(true){ws();if(obj){need(text[i]==='"','JSON 객체 키가 필요합니다.');const k=string();need(!seen.has(k),'중복 JSON 키가 있습니다: '+k);seen.add(k);ws();need(text[i++]===':','JSON 콜론이 필요합니다.');values.push([k,read(depth+1)]);}else values.push(read(depth+1));ws();if(text[i]===end){i++;break;}need(text[i++ ]===',','JSON 구분자를 확인하세요.');}
   return {kind:obj?'object':'array',value:values};
  }
  for(const [literal,kind,value] of [['true','boolean',true],['false','boolean',false],['null','null',null]])if(text.startsWith(literal,i)){i+=literal.length;return {kind,value};}
  const m=text.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);need(m,'JSON 값이 올바르지 않습니다.');i+=m[0].length;return {kind:'number',value:m[0]};
 }
 const value=read(0);ws();need(i===text.length,'JSON 뒤에 불필요한 문자가 있습니다.');return value;
}
function canonical(v){if(v.kind==='object')return '{'+v.value.slice().sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0).map(([k,x])=>JSON.stringify(k)+':'+canonical(x)).join(',')+'}';if(v.kind==='array')return '['+v.value.map(canonical).join(',')+']';return v.kind==='number'?v.value:JSON.stringify(v.value);}
function scalarDisplay(v){return v.kind==='string'?v.value:canonical(v);}
function table(raw,format='csv',delimiter=','){
 if(format==='csv'||format==='tsv'){const t=parseCSV(raw,format==='tsv'?'\t':delimiter);return {...t,rows:t.rows.map(r=>r.map(value=>({kind:'string',value}))) };}
 need(format==='json','형식은 CSV, TSV, JSON 중에서 선택하세요.');const a=jsonTree(raw);need(a.kind==='array'&&a.value.every(v=>v.kind==='object'),'JSON은 객체 배열이어야 합니다.');need(a.value.length<=MAX_ROWS,'데이터는 10,000행 이하여야 합니다.');
 const headers=[...new Set(a.value.flatMap(v=>v.value.map(([k])=>k)))];need((headers.length>0||a.value.length===0)&&headers.length<=200,'JSON 열 수는 1~200개여야 합니다.');
 return {headers,rows:a.value.map(v=>{const m=new Map(v.value);return headers.map(k=>m.get(k));})};
}
function shown(v){return v===undefined?'[필드 없음]':canonical(v);}
function atom(v){return v===undefined?'missing':v.kind+':'+canonical(v);}
function decimal(value){const s=String(value);need(/^[+-]?\d+(?:\.\d+)?$/.test(s)&&s.replace(/[^0-9]/g,'').length<=100,'일반 십진수 문자열이 필요합니다: '+s.slice(0,40));let [a,b='']=s.replace(/^[+-]/,'').split('.');return {n:BigInt(a+b)*(s.startsWith('-')?-1n:1n),scale:b.length};}
function atScale(d,scale){return d.n*10n**BigInt(scale-d.scale);}
function formatDecimal(n,scale){const sign=n<0n?'-':'';let s=(n<0n?-n:n).toString().padStart(scale+1,'0');return sign+(scale?s.slice(0,-scale)+'.'+s.slice(-scale):s);}
function csvExport(headers,rows){const safe=v=>{let s=v===undefined?'':String(v);if(/^[\s]*[=+@-]|^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};return [headers,...rows].map(r=>r.map(safe).join(',')).join('\r\n');}
function result(summary,headers,rows,extra={}){return {summary,headers,rows,csv:csvExport(headers,rows),...extra};}

function config(raw,format){
 const out=new Map();if(format==='json'){
  const root=jsonTree(raw);need(root.kind==='object','설정 JSON은 객체여야 합니다.');
  function walk(v,path){out.set(path,{value:v,branch:['object','array'].includes(v.kind)&&v.value.length>0});if(v.kind==='object')for(const [k,x] of v.value)walk(x,path+'/'+k.replace(/~/g,'~0').replace(/\//g,'~1'));else if(v.kind==='array')v.value.forEach((x,i)=>walk(x,path+'/'+i));}walk(root,'');return out;
 }
 need(format==='properties','JSON 또는 단순 properties만 지원합니다.');
 const lines=textInput(raw).split(/\r\n|\n|\r/);if(lines.at(-1)==='')lines.pop();need(lines.length<=10000,'설정은 10,000행 이하여야 합니다.');
 for(let i=0;i<lines.length;i++){const line=lines[i];if(!line.trim()||/^[ \t]*[#!]/.test(line))continue;
  need(!line.includes('\\'),'properties의 이스케이프·이어쓰기 문법은 지원하지 않습니다.');
  const m=line.match(/^[ \t]*([^=:\s]+)[ \t]*[=:][ \t]*(.*)$/);need(m,(i+1)+'행은 단순 key=value 형식이 아닙니다.');need(!out.has(m[1]),'중복 설정 키가 있습니다: '+m[1]);out.set(m[1],{value:{kind:'string',value:m[2]},branch:false});
 }return out;
}
function run(q){
 const a=config(q.left,q.format||'json'),b=config(q.right,q.format||'json');const rows=[];
 const publicKeys=new Set(Array.isArray(q.publicKeys)?q.publicKeys:[]);
 const expose=(path,v)=>v===undefined?'[키 없음]':publicKeys.has(path)&&!/pass|secret|token|credential|api.?key|private.?key|authorization|cookie/i.test(path)?canonical(v):'[값 숨김]';
 for(const path of new Set([...a.keys(),...b.keys()])){const av=a.get(path),bv=b.get(path);
  if((['object','array'].includes(av?.value.kind)||['object','array'].includes(bv?.value.kind))&&av?.value.kind!==bv?.value.kind){rows.push(['구조 다름',path||'/',av?.value.kind||'[키 없음]',bv?.value.kind||'[키 없음]']);continue;}
  if(av?.branch&&bv?.branch&&av.value.kind===bv.value.kind)continue;
  if(av?.branch||bv?.branch){if(!av||!bv||av.value.kind!==bv.value.kind)rows.push(['구조 다름',path||'/',av?.value.kind||'[키 없음]',bv?.value.kind||'[키 없음]']);continue;}
  if(atom(av?.value)!==atom(bv?.value))rows.push([!av?'비교에만 있음':!bv?'기준에만 있음':'값 다름',path||'/',expose(path,av?.value),expose(path,bv?.value)]);
  if((av?.value?.kind==='string'&&/\$\{[^}]+\}/.test(av.value.value))||(bv?.value?.kind==='string'&&/\$\{[^}]+\}/.test(bv.value.value)))rows.push(['변수 미해결',path||'/','값을 평가하지 않음','값을 평가하지 않음']);
 }
 return result('확인 항목 '+rows.length+'개 · 설정 파일 대조 · 기본값은 모두 숨김',['구분','키 경로','기준','비교'],rows,{note:'최종 적용값·환경변수·프로필 우선순위는 평가하지 않습니다. 공개 키를 지정해도 비밀정보로 보이는 키는 숨깁니다.'});
}

return {run,csvExport};
})();

if(typeof module!=='undefined')module.exports=Worklens;
if(require.main===module){
 const fs=require('node:fs');try{
  const [input,output]=process.argv.slice(2);
  if(!input||!output)throw Error('사용법: node tool.cjs 요청.json 결과.json — 입력과 결과는 서로 다른 새 파일이어야 합니다.');
  if(fs.statSync(input).size>6*1024*1024)throw Error('요청 파일은 6 MiB 이하여야 합니다.');
  const request=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(input)).replace(/^\uFEFF/,''));
  const result=Worklens.run(request);
  fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{encoding:'utf8',flag:'wx'});
  process.stdout.write(result.summary+'\n');
 }catch(error){process.stderr.write('처리 실패: '+error.message+'\n');process.exitCode=1;}
}

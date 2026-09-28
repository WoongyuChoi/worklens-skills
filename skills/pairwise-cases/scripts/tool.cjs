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

function run(q){
 need(q&&typeof q.factors==='object'&&!Array.isArray(q.factors)&&q.factors!==null,'조건 객체가 필요합니다.');const names=Object.keys(q.factors);need(names.length>=2&&names.length<=8,'조건은 2~8개여야 합니다.');
 let product=1;const values=names.map(k=>{const a=q.factors[k];need(Array.isArray(a)&&a.length>=1&&a.length<=12&&a.every(x=>typeof x==='string'&&x.length<=200),'각 조건은 길이 200자 이하의 문자열 값 1~12개여야 합니다.');need(new Set(a).size===a.length,'중복 조건 값이 있습니다.');product*=a.length;return a;});need(product<=50000,'전체 조합이 50,000개를 초과합니다. 범위를 나누세요.');
 const excludes=q.excludes===undefined?[]:q.excludes;need(Array.isArray(excludes)&&excludes.length<=100,'제외 조건은 100개 이하 배열이어야 합니다.');
 const normalized=excludes.map(rule=>{need(rule&&typeof rule==='object'&&!Array.isArray(rule)&&Object.keys(rule).length,'빈 제외 조건은 허용하지 않습니다.');return Object.entries(rule).map(([k,v])=>{const i=names.indexOf(k);need(i>=0&&values[i].includes(v),'제외 조건의 이름 또는 값이 잘못됐습니다.');return [i,v];});});
 const valid=[];function expand(row){if(row.length===names.length){if(!normalized.some(rule=>rule.every(([i,v])=>row[i]===v)))valid.push(row);return;}for(const v of values[row.length])expand([...row,v]);}expand([]);need(valid.length,'제외 조건 적용 후 유효한 조합이 없습니다.');
 // Compact ordinal pair IDs avoid storing long labels for every valid assignment.
 const indexes=values.map(a=>new Map(a.map((v,i)=>[v,i]))),specs=[];let offset=0;for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){specs.push({i,j,offset,width:values[j].length});offset+=values[i].length*values[j].length;}
 const pairKeys=row=>specs.map(s=>s.offset+indexes[s.i].get(row[s.i])*s.width+indexes[s.j].get(row[s.j]));
 const all=new Set(),pairs=valid.map(r=>{const p=pairKeys(r);p.forEach(k=>all.add(k));return p;});
 const mandatory=q.mandatory===undefined?[]:q.mandatory;need(Array.isArray(mandatory)&&mandatory.length<=500,'필수 조합은 500개 이하 배열이어야 합니다.');const chosen=new Set(),remaining=new Set(all);
 for(const row of mandatory){need(row&&typeof row==='object'&&!Array.isArray(row)&&Object.keys(row).length===names.length&&Object.keys(row).every(k=>names.includes(k)),'필수 조합에는 모든 조건을 정확히 지정하세요.');const index=valid.findIndex(r=>names.every((n,i)=>r[i]===row[n]));need(index>=0,'허용되지 않는 필수 조합입니다.');chosen.add(index);pairs[index].forEach(k=>remaining.delete(k));}
 let budget=0;while(remaining.size){let best=-1,score=0;for(let i=0;i<pairs.length;i++){if(chosen.has(i))continue;let n=0;for(const key of pairs[i]){need(++budget<=15000000,'조합 선택 연산 한도를 초과했습니다. 조건 범위를 나누세요.');if(remaining.has(key))n++;}if(n>score){score=n;best=i;}}need(best>=0,'조합을 선택하지 못했습니다.');chosen.add(best);pairs[best].forEach(k=>remaining.delete(k));}
 // Recompute coverage from selected rows, independently of the greedy state.
 const output=[...chosen].map(i=>valid[i]),verified=new Set(output.flatMap(pairKeys));need([...all].every(k=>verified.has(k)),'조건 쌍 커버리지 검산 실패');
 const excludedValues=names.flatMap((name,i)=>values[i].filter(v=>!valid.some(row=>row[i]===v)).map(value=>({factor:name,value})));
 return result('유효 전체 '+valid.length+'개 → 선택 '+output.length+'개 · 조건 쌍 '+all.size+'/'+all.size+' 검산',['번호',...names],output.map((r,i)=>[String(i+1),...r]),{coverage:{cartesian:product,valid:valid.length,selected:output.length,pairs:all.size,covered:verified.size},excludedValues,note:'2개 조건 값의 상호작용만 보장합니다. 전체 조합 검사나 최소 개수·결함 없음을 보장하지 않습니다. 고위험 조합은 필수 조합으로 추가하세요.'+(excludedValues.length?' 유효한 조합이 없는 조건 값: '+excludedValues.map(x=>x.factor+'='+x.value).join(', '):'')});
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

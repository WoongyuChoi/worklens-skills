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
 const left=table(q.left,q.format||'csv',q.delimiter||','),right=table(q.right,q.format||'csv',q.delimiter||',');
 if(!left.headers.length)left.headers=right.headers.slice();if(!right.headers.length)right.headers=left.headers.slice();
 need(left.headers.length&&right.headers.length,'양쪽 JSON이 빈 배열이면 키 구조를 확인할 수 없습니다. 열 이름이 있는 CSV로 내보내세요.');
 need(Array.isArray(q.keys)&&q.keys.length&&new Set(q.keys).size===q.keys.length,'비교할 키 열을 지정하세요.');
 for(const k of q.keys)need(left.headers.includes(k)&&right.headers.includes(k),'양쪽에 없는 키 열입니다: '+k);
 const columns=[...new Set([...left.headers,...right.headers])];let rows=[],counts={matched:0,changed:0,leftOnly:0,rightOnly:0,duplicateKeys:0,invalidRows:0};
 const map=(t,side)=>{const m=new Map();t.rows.forEach((r,index)=>{const vals=q.keys.map(k=>r[t.headers.indexOf(k)]);
  if(vals.some(v=>v===undefined||v.kind==='null'||(v.kind==='string'&&!v.value.trim())||['object','array'].includes(v.kind))){counts.invalidRows++;rows.push(['키 확인 필요',side+' 레코드 '+(index+2),'','','']);return;}
  const key=JSON.stringify(vals.map(atom));if(!m.has(key))m.set(key,[]);m.get(key).push({row:r,label:vals.map(shown).join(' / ')});
 });return m;};
 const a=map(left,'기준'),b=map(right,'비교');
 for(const key of new Set([...a.keys(),...b.keys()])){const aa=a.get(key)||[],bb=b.get(key)||[],label=(aa[0]||bb[0]).label;
  if(aa.length>1||bb.length>1){counts.duplicateKeys++;rows.push(['중복 키',label,'레코드 수',String(aa.length),String(bb.length)]);continue;}
  if(!aa.length){counts.rightOnly++;rows.push(['비교에만 있음',label,'', '', JSON.stringify(Object.fromEntries(right.headers.map((h,i)=>[h,shown(bb[0].row[i])])))]);continue;}
  if(!bb.length){counts.leftOnly++;rows.push(['기준에만 있음',label,'', JSON.stringify(Object.fromEntries(left.headers.map((h,i)=>[h,shown(aa[0].row[i])]))),'']);continue;}
  let changed=false;for(const c of columns){const av=aa[0].row[left.headers.indexOf(c)],bv=bb[0].row[right.headers.indexOf(c)];if(atom(av)!==atom(bv)){changed=true;rows.push(['값 다름',label,c,shown(av),shown(bv)]);need(rows.length<=100000,'차이 항목이 100,000개를 초과합니다. 비교 범위를 줄이세요.');}}
  if(changed)counts.changed++;else counts.matched++;
 }
 need(rows.length<=100000,'차이 항목이 100,000개를 초과합니다. 비교 열이나 파일 범위를 줄이세요.');
 return result('일치 '+counts.matched+' / 값 차이 '+counts.changed+' / 기준에만 '+counts.leftOnly+' / 비교에만 '+counts.rightOnly+' / 중복 키 '+counts.duplicateKeys+' / 키 확인 필요 '+counts.invalidRows,['구분','키','열','기준','비교'],rows,{counts,leftRows:left.rows.length,rightRows:right.rows.length,schema:{leftOnly:left.headers.filter(x=>!right.headers.includes(x)),rightOnly:right.headers.filter(x=>!left.headers.includes(x))},comparison:'값과 자료형 및 숫자 표기를 그대로 비교합니다. 중복 키와 빈 키는 일치 판정에서 제외합니다.'});
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

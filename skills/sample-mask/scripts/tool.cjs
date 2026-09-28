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
 const source=textInput(q.text);need(source.length>0,'처리할 텍스트가 없습니다.');const literals=q.literals===undefined?[]:q.literals;
 need(Array.isArray(literals)&&literals.length<=200&&literals.every(x=>typeof x==='string'&&x.length>0&&x.length<=500),'직접 지정 값은 길이 1~500자의 문자열 200개 이하 배열이어야 합니다.');
 const matches=[];for(const value of new Set(literals)){let index=0;while((index=source.indexOf(value,index))>=0){matches.push({start:index,end:index+value.length,type:'지정값',value});index+=value.length;need(matches.length<=20000,'검출 항목이 너무 많습니다.');}}
 // Tokenize once, then anchor email validation to avoid quadratic suffix retries.
 if(q.patterns!==false)for(const m of source.matchAll(/[A-Z0-9._%+@-]+/gi)){const at=m[0].indexOf('@');if(at<1||at!==m[0].lastIndexOf('@'))continue;let end=m[0].length;while(m[0][end-1]==='.')end--;const value=m[0].slice(0,end);if(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)){matches.push({start:m.index,end:m.index+value.length,type:'전자우편',value});need(matches.length<=20000,'검출 항목이 너무 많습니다.');}}
 const patterns=[['휴대전화',/(?<!\d)01[016789][- ]?\d{3,4}[- ]?\d{4}(?!\d)/g],['식별번호후보',/(?<!\d)\d{6}-[1-8]\d{6}(?!\d)/g]];
 if(q.patterns!==false)for(const [type,re] of patterns)for(const m of source.matchAll(re)){matches.push({start:m.index,end:m.index+m[0].length,type,value:m[0]});need(matches.length<=20000,'검출 항목이 너무 많습니다.');}
 // Longest match wins at the same start; manual values have priority on ties.
 matches.sort((a,b)=>a.start-b.start||b.end-a.end||(a.type==='지정값'?-1:b.type==='지정값'?1:0));
 const used=new Set([...source.matchAll(/\[가림\d*_/g)].map(m=>m[0]));let prefix='[가림_',suffix=0;while(used.has(prefix))prefix='[가림'+(++suffix)+'_';
 const tokens=new Map(),counts=new Map();let position=0,output='',occurrences=0;
 for(const m of matches){if(m.start<position)continue;const key=m.value;if(!tokens.has(key))tokens.set(key,prefix+String(tokens.size+1)+']');const token=tokens.get(key);output+=source.slice(position,m.start)+token;position=m.end;occurrences++;counts.set(m.type,(counts.get(m.type)||0)+1);}
 output+=source.slice(position);const rows=[...counts].map(([type,n])=>[type,String(n)]);
 return result('치환 '+occurrences+'회 / 서로 다른 값 '+tokens.size+'개 · 이름·주소·비밀키 등은 별도 확인 필요',['종류','치환 횟수'],rows,{text:output,distinct:tokens.size,occurrences,note:'형식 기반 후보와 직접 지정한 문자열만 가립니다. 완전 익명화나 공유 승인을 뜻하지 않습니다. 원문과 복원 매핑은 결과에 포함하지 않습니다.'});
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

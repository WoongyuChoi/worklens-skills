// Maintainer-only builder. Generated skill folders have no dependency on this file.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const common=fs.readFileSync(path.join(__dirname,'tool-sources/common.js'),'utf8');
const configs={
 'data-reconcile':{title:'데이터 대조',lead:'두 파일의 누락, 중복 키, 값 차이를 비교합니다. 숫자와 식별자의 원문을 보존합니다.',left:'기준 데이터',right:'비교 데이터',formats:[['csv','CSV'],['tsv','TSV'],['json','JSON 객체 배열']],fields:[['keys','키 열 이름','id','comma']],sample:{left:'id,name,amount\n001,샘플A,100\n002,샘플B,200',right:'id,name,amount\n002,샘플B,250\n003,샘플C,300',format:'csv',keys:['id']},help:'CSV/TSV 첫 행은 중복 없는 열 이름입니다. 키 열은 쉼표로 구분합니다. 공백·자료형·숫자 표기 차이는 그대로 비교합니다.'},
 'config-compare':{title:'환경설정 대조',lead:'설정 키의 차이를 비교합니다. 기본적으로 모든 값은 숨기고 지정한 공개 키만 표시합니다.',left:'기준 설정',right:'비교 설정',formats:[['json','JSON'],['properties','단순 properties']],fields:[['publicKeys','공개해도 되는 키 경로','/timeout','comma']],sample:{left:'{"timeout":30,"db":{"password":"예시값-A"}}',right:'{"timeout":60,"db":{"password":"예시값-B"},"host":"${HOST}"}',format:'json',publicKeys:['/timeout']},help:'JSON 키 경로는 /db/timeout 형식입니다. properties는 key=value만 지원하며 이스케이프·이어쓰기는 거부합니다. 런타임 최종값은 평가하지 않습니다.'},
 'variance-bridge':{title:'숫자 변동 분해',lead:'같은 단위의 금액이나 건수를 비교하고 항목별 증감과 전체 합계를 검산합니다.',left:'기준 표',right:'비교 표',fields:[['key','항목 열','항목','text'],['value','값 열','금액','text']],sample:{left:'항목,금액\n유형A,100.50\n유형B,200.00',right:'항목,금액\n유형A,120.50\n유형B,180.00\n유형C,10.00',key:'항목',value:'금액'},help:'CSV 첫 행은 열 이름입니다. 한 항목은 한 행이어야 합니다. 소수는 정확하게 계산하며 천 단위 쉼표·지수 표기·비율·평균은 입력하지 마세요.'},
 'pairwise-cases':{title:'조건 조합 압축',lead:'허용된 조건 쌍을 포함하는 시험 조합을 만들고 커버리지를 다시 계산합니다.',json:true,sample:{factors:{권한:['일반','관리자'],상태:['신규','수정','완료'],입력:['정상','빈값']},excludes:[{권한:'일반',상태:'완료'}],mandatory:[]},help:'조건 2~8개, 조건마다 문자열 값 1~12개, 전체 조합 50,000개 이하입니다. excludes는 함께 성립하면 제외할 조건, mandatory는 반드시 넣을 완전한 조합입니다. 전체 조합 검증을 대신하지 않습니다.'},
 'sample-mask':{title:'로그와 샘플 가명처리',lead:'같은 식별값을 같은 토큰으로 바꿉니다. 원문과 복원 매핑을 결과에 넣지 않습니다.',single:true,fields:[['literals','직접 가릴 문자열 — 한 줄에 하나','샘플고객A','lines']],sample:{text:'샘플고객A / sample@example.com / 010-0000-0000\n다시 조회: 샘플고객A / sample@example.com',literals:['샘플고객A']},help:'전자우편, 국내 휴대전화, 주민번호처럼 보이는 형식과 직접 지정 문자열만 처리합니다. 이름·주소·토큰·업무 식별자는 별도로 지정하고 결과를 확인하세요. 완전 익명화를 보장하지 않습니다.'}
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const [name,c] of Object.entries(configs)){
 const engine=common+'\n'+fs.readFileSync(path.join(__dirname,'tool-sources/'+name+'.js'),'utf8');
 const api='const Worklens=(()=>{\n'+engine+'\nreturn {run,csvExport};\n})();\n';
 const dir=path.join(root,'skills',name);fs.mkdirSync(path.join(dir,'assets'),{recursive:true});fs.mkdirSync(path.join(dir,'scripts'),{recursive:true});
 const cli="#!/usr/bin/env node\n'use strict';\n"+api+`
if(typeof module!=='undefined')module.exports=Worklens;
if(require.main===module){
 const fs=require('node:fs');try{
  const [input,output]=process.argv.slice(2);
  if(!input||!output)throw Error('사용법: node tool.cjs 요청.json 결과.json — 입력과 결과는 서로 다른 새 파일이어야 합니다.');
  if(fs.statSync(input).size>6*1024*1024)throw Error('요청 파일은 6 MiB 이하여야 합니다.');
  const request=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(input)).replace(/^\\uFEFF/,''));
  const result=Worklens.run(request);
  fs.writeFileSync(output,JSON.stringify(result,null,2)+'\\n',{encoding:'utf8',flag:'wx'});
  process.stdout.write(result.summary+'\\n');
 }catch(error){process.stderr.write('처리 실패: '+error.message+'\\n');process.exitCode=1;}
}
`;
 fs.writeFileSync(path.join(dir,'scripts/tool.cjs'),cli);
 fs.writeFileSync(path.join(dir,'assets/example-request.json'),JSON.stringify(c.sample,null,2)+'\n');
 const field=(id,label,file=true)=>`<label for="${id}">${esc(label)}</label>${file?`<input id="${id}-file" type="file" aria-label="${esc(label)} 파일 열기">`:''}<textarea id="${id}" spellcheck="false"></textarea>`;
 const inputs=c.json?field('request','조건 설정 JSON'):c.single?field('text','원본 텍스트'):field('left',c.left)+field('right',c.right);
 const fields=(c.fields||[]).map(([id,label,placeholder,mode])=>`<label for="${id}">${esc(label)}</label>${mode==='lines'?`<textarea id="${id}" placeholder="${esc(placeholder)}"></textarea>`:`<input id="${id}" type="text" placeholder="${esc(placeholder)}">`}`).join('');
 const select=c.formats?`<label for="format">형식</label><select id="format">${c.formats.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select>`:'';
 const options=c.single?'<label class="check"><input id="patterns" type="checkbox" checked>전자우편·휴대전화·식별번호 후보도 가리기</label>':(!c.json?'<label for="delimiter">CSV 구분자</label><select id="delimiter"><option value=",">쉼표</option><option value="tab">탭</option><option value=";">세미콜론</option><option value="|">세로선</option></select>':'');
 const safeSample=JSON.stringify(c.sample).replace(/</g,'\\u003c'),safeFields=JSON.stringify(c.fields||[]);
 const ui=`
const $=id=>document.getElementById(id);let current=null,generation=0;const fileTickets={};
const sample=${safeSample},fields=${safeFields};
function clearOutput(){current=null;generation++;$('summary').textContent='입력을 확인한 뒤 실행하세요.';$('note').textContent='';$('result').replaceChildren();$('masked').textContent='';for(const id of ['json-save','csv-save','text-save'])$(id).disabled=true;}
function render(r){current=r;$('summary').textContent=r.summary;$('note').textContent=r.note||r.comparison||'';
 const table=document.createElement('table'),head=document.createElement('thead'),hr=document.createElement('tr');for(const h of r.headers){const cell=document.createElement('th');cell.scope='col';cell.textContent=h;hr.append(cell);}head.append(hr);table.append(head);const body=document.createElement('tbody');
 for(const row of r.rows.slice(0,200)){const tr=document.createElement('tr');for(const value of row){const cell=document.createElement('td');cell.textContent=String(value);tr.append(cell);}body.append(tr);}table.append(body);$('result').replaceChildren(table);
 if(r.rows.length>200)$('note').textContent+=' 화면은 처음 200개 항목입니다. 전체 결과는 파일로 저장하세요.';
 if(r.schema){const extra=document.createElement('p');extra.textContent='기준에만 있는 열: '+(r.schema.leftOnly.join(', ')||'없음')+' / 비교에만 있는 열: '+(r.schema.rightOnly.join(', ')||'없음');$('result').append(extra);}
 $('masked').textContent=r.text===undefined?'':r.text;
 $('json-save').disabled=false;$('csv-save').disabled=false;$('text-save').disabled=r.text===undefined;
}
function request(){if($('request'))return JSON.parse($('request').value);const q={};for(const id of ['left','right','text','format'])if($(id))q[id]=$(id).value;
 for(const [id,label,placeholder,mode] of fields){const raw=$(id).value;q[id]=mode==='comma'?raw.split(',').map(v=>v.trim()).filter(Boolean):mode==='lines'?raw.split(/\\r?\\n/).filter(v=>v.length):raw;}
 if($('delimiter'))q.delimiter=$('delimiter').value==='tab'?'\\t':$('delimiter').value;if($('patterns'))q.patterns=$('patterns').checked;return q;
}
for(const control of document.querySelectorAll('textarea,input,select'))control.addEventListener('input',()=>{fileTickets[control.id]=(fileTickets[control.id]||0)+1;clearOutput();});
for(const id of ['left','right','text','request'])if($(id+'-file'))$(id+'-file').addEventListener('change',async()=>{clearOutput();const version=fileTickets[id]=(fileTickets[id]||0)+1,f=$(id+'-file').files[0];if(!f)return;$(id).value='';try{if(f.size>2*1024*1024)throw Error('파일 하나는 2 MiB 이하여야 합니다.');const content=new TextDecoder('utf-8',{fatal:true}).decode(await f.arrayBuffer());if(version!==fileTickets[id])return;$(id).value=content;clearOutput();}catch(e){if(version===fileTickets[id])$('summary').textContent='파일 열기 실패: UTF-8 파일인지 확인하세요. '+e.message;}});
function fill(){clearOutput();for(const id of ['left','right','text','request']){fileTickets[id]=(fileTickets[id]||0)+1;if($(id+'-file'))$(id+'-file').value='';}if($('request'))$('request').value=JSON.stringify(sample,null,2);else {for(const id of ['left','right','text','format'])if($(id))$(id).value=sample[id]||'';for(const [id,label,placeholder,mode] of fields)$(id).value=Array.isArray(sample[id])?sample[id].join(mode==='lines'?'\\n':','):sample[id]||'';if($('delimiter'))$('delimiter').value=',';if($('patterns'))$('patterns').checked=true;}}
function save(content,extension,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='${name}-result.'+extension;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.querySelector('form').addEventListener('submit',event=>{event.preventDefault();clearOutput();try{render(Worklens.run(request()));}catch(e){$('summary').textContent='처리 실패: '+e.message;}});
$('example').addEventListener('click',fill);
$('json-save').addEventListener('click',()=>{if(current)save(JSON.stringify(current,null,2),'json','application/json;charset=utf-8');});
$('csv-save').addEventListener('click',()=>{if(current)save('\\uFEFF'+current.csv,'csv','text/csv;charset=utf-8');});
$('text-save').addEventListener('click',()=>{if(current?.text!==undefined)save(current.text,'txt','text/plain;charset=utf-8');});
clearOutput();
`;
 const html=`<!doctype html>
<html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src data:; base-uri 'none'; form-action 'none'">
<title>${esc(c.title)} · Worklens</title><style>
*{box-sizing:border-box}body{margin:0;background:#f4f6f8;color:#162638;font-family:system-ui,"Malgun Gothic",sans-serif;font-size:17px;line-height:1.65}main{max-width:1100px;margin:auto;padding:32px 22px}h1{font-size:30px;line-height:1.3;margin:0 0 12px}h2{font-size:23px}p{margin:10px 0 20px}.panel{background:white;border:1px solid #cdd5dd;border-radius:12px;padding:24px;margin-top:20px}label{display:block;font-weight:650;margin:16px 0 7px}input,textarea,select,button{font:inherit}input[type=text],textarea,select{width:100%;border:1px solid #8597a8;border-radius:6px;padding:10px;background:#fff;color:#162638}textarea{min-height:145px;resize:vertical;font-family:ui-monospace,"Malgun Gothic",monospace;font-size:15px}input[type=file]{max-width:100%;margin-bottom:8px}button{border:1px solid #526579;border-radius:6px;padding:9px 18px;cursor:pointer;background:white;color:#19334d;margin:8px 8px 0 0}button[type=submit]{background:#164f80;color:white;border-color:#164f80}button:disabled{opacity:.5;cursor:default}:focus-visible{outline:3px solid #ce7414;outline-offset:3px}.help{font-size:15px;color:#40556a}.check{font-weight:400}.scroll{overflow:auto}table{width:100%;border-collapse:collapse;font-size:15px}th,td{text-align:left;padding:12px;border-bottom:1px solid #ccd5df;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}th{background:#eaf0f6}#summary{font-weight:700}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-family:ui-monospace,"Malgun Gothic",monospace;font-size:15px}pre:empty{display:none}@media(max-width:600px){main{padding:22px 12px}.panel{padding:16px}h1{font-size:26px}}
</style><main><h1>${esc(c.title)}</h1><p>${esc(c.lead)}</p><p class="help">파일 하나당 2 MiB · UTF-8 · 외부 전송 없음 · 원본 변경 없음</p>
<form class="panel">${select}${inputs}${fields}${options}<p class="help">${esc(c.help)}</p><button type="submit">실행</button><button id="example" type="button">합성 예시 넣기</button></form>
<section class="panel" aria-labelledby="output-title"><h2 id="output-title">결과</h2><p id="summary" role="status" aria-live="polite"></p><p id="note" class="help"></p><div id="result" class="scroll"></div><pre id="masked"></pre><button id="json-save" type="button" disabled>전체 JSON 저장</button><button id="csv-save" type="button" disabled>표 CSV 저장</button><button id="text-save" type="button" disabled>처리한 텍스트 저장</button><p class="help">CSV는 수식으로 해석될 수 있는 셀 앞에 작은따옴표를 붙입니다. 정확한 결과 값은 JSON을 사용하세요. 입력을 바꾸면 기존 결과는 무효화됩니다.</p></section></main>
<script>
${api}
${ui}
</script></html>
`;
 fs.writeFileSync(path.join(dir,'assets/tool.html'),html);
}
console.log('Built 5 portable tools: browser HTML, optional Node CLI, synthetic example requests.');

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

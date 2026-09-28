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

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

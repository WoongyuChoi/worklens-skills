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

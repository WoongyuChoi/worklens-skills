function run(q){
 const a=parseCSV(q.left,q.delimiter||','),b=parseCSV(q.right,q.delimiter||',');need(typeof q.key==='string'&&typeof q.value==='string'&&q.key!==q.value,'항목 열과 금액/건수 열을 지정하세요.');
 for(const t of [a,b])need(t.headers.includes(q.key)&&t.headers.includes(q.value),'지정한 열을 찾을 수 없습니다.');
 let scale=0;const load=t=>{const m=new Map();for(const r of t.rows){const key=r[t.headers.indexOf(q.key)];need(key.trim()!=='','빈 항목 이름이 있습니다.');need(!m.has(key),'중복 항목은 먼저 집계해야 합니다: '+key);const d=decimal(r[t.headers.indexOf(q.value)]);scale=Math.max(scale,d.scale);m.set(key,d);}return m;};
 const left=load(a),right=load(b);let start=0n,end=0n,total=0n;const entries=[];
 for(const key of new Set([...left.keys(),...right.keys()])){const x=left.has(key)?atScale(left.get(key),scale):0n,y=right.has(key)?atScale(right.get(key),scale):0n;start+=x;end+=y;total+=y-x;entries.push({key,x,y,d:y-x,presence:!left.has(key)?'신규 항목':!right.has(key)?'제외 항목':'양쪽 있음'});}
 need(start+total===end,'합계 검산에 실패했습니다.');entries.sort((a,b)=>{const x=a.d<0n?-a.d:a.d,y=b.d<0n?-b.d:b.d;return x>y?-1:x<y?1:a.key<b.key?-1:a.key>b.key?1:0;});
 const f=n=>formatDecimal(n,scale),rows=entries.map(e=>[e.key,f(e.x),f(e.y),f(e.d),e.presence]);
 return result('기준 '+f(start)+' + 증감 '+f(total)+' = 비교 '+f(end)+' · 검산 일치',['항목','기준','비교','증감','상태'],rows,{totals:{start:f(start),delta:f(total),end:f(end)},note:'항목별 수학적 기여도입니다. 실제 업무 원인을 추정하지 않습니다. 같은 단위의 가산 값만 입력하세요. 비율·평균은 직접 합산하지 마세요.'});
}

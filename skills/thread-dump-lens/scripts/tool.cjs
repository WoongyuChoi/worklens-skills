/* Traditional HotSpot text dumps only. Does not collect dumps or contact a JVM. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WorklensTool=factory();})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
function fail(m){throw new Error(m);}
function parse(snapshot){
 if(!snapshot||typeof snapshot.name!=='string'||!snapshot.name.trim()||snapshot.name.length>200||typeof snapshot.text!=='string')fail('각 덤프에 짧은 이름과 원문 text가 필요합니다.');
 if(snapshot.text.length>2*1024*1024)fail('덤프 하나는 최대 2 MiB 문자입니다.');
 const lines=snapshot.text.split(/\r?\n/);if(lines.length>40000)fail('덤프 하나는 최대 40000줄입니다.');
 const threads=[],unrecognized=[],seen=new Set();let t=null;
 for(let i=0;i<lines.length;i++){
  const line=lines[i],head=line.match(/^"([^"]+)"\s+(.*)$/);
  if(head){
   const rest=head[2];
   // The explicit Java-level deadlock summary repeats quoted names; it is not a second thread.
   if(!/(?:\btid=|\bnid=|#\d+\b)/.test(rest)){t=null;continue;}
   if(threads.length>=2000)fail('덤프 하나는 최대 2000개 스레드입니다.');
   const id=(rest.match(/\btid=(0x[\da-f]+)/i)||[])[1]||null,javaId=(rest.match(/#(\d+)\b/)||[])[1]||null;
   const identity=id?'tid:'+id.toLowerCase():javaId?'id:'+javaId:null;
   t={name:head[1],identity,javaId,line:i+1,header:line,state:'UNKNOWN',frames:[],framesTruncated:false,waiting:[],owned:[],rawLines:[line]};
   if(identity&&seen.has(identity))fail('한 입력에서 같은 스레드 ID가 반복됩니다. 시점별 덤프를 별도 입력으로 나누세요.');
   if(identity)seen.add(identity);threads.push(t);continue;
  }
  if(!t){if(line.trim()&&unrecognized.length<30)unrecognized.push({line:i+1,text:line});continue;}
  if(/^(?:JNI global|Found \d+ deadlock|Found one Java-level deadlock|Java stack information for)/.test(line)){t=null;continue;}
  t.rawLines.push(line);
  const state=line.match(/java\.lang\.Thread\.State:\s+(\w+)/);if(state)t.state=['NEW','RUNNABLE','BLOCKED','WAITING','TIMED_WAITING','TERMINATED'].includes(state[1])?state[1]:'UNKNOWN';
  if(/^\s+at\s+/.test(line)){if(t.frames.length<150)t.frames.push(line.trim());else t.framesTruncated=true;}
  const wait=line.match(/-\s+(waiting to lock|waiting on|parking to wait for|waiting to re-lock in wait\(\))\s+<(0x[\da-f]+)>/i);
  if(wait)t.waiting.push({kind:wait[1].toLowerCase(),lock:wait[2].toLowerCase(),line:i+1});
  const owned=line.match(/-\s+locked\s+<(0x[\da-f]+)>/i);if(owned)t.owned.push({lock:owned[1].toLowerCase(),line:i+1});
 }
 if(!threads.length)fail('지원하는 플랫폼 스레드 텍스트 헤더가 없습니다. JSON/가상 스레드 덤프는 수동으로 검토하세요.');
 // Object.wait releases the waited-on monitor even when an enclosing frame says "locked".
 for(const thread of threads){const released=new Set(thread.waiting.filter(w=>w.kind==='waiting on'||w.kind==='waiting to re-lock in wait()').map(w=>w.lock));thread.owned=thread.owned.filter(o=>!released.has(o.lock));}
 const owners=new Map();threads.forEach((thread,index)=>thread.owned.forEach(o=>{if(!owners.has(o.lock))owners.set(o.lock,new Set());owners.get(o.lock).add(index);}));
 const edges=[],unknownOwners=[];
 threads.forEach((thread,index)=>thread.waiting.filter(w=>w.kind==='waiting to lock'||w.kind==='waiting to re-lock in wait()').forEach(w=>{
  const set=owners.get(w.lock);if(set&&set.size===1){const to=[...set][0];if(to!==index)edges.push({from:index,to,lock:w.lock,line:w.line});else unknownOwners.push({thread:index,lock:w.lock,line:w.line,reason:'대기자와 소유자가 같아 판정하지 않음'});}
  else unknownOwners.push({thread:index,lock:w.lock,line:w.line,reason:set?'복수 소유 표시':'소유 표시 없음'});
 }));
 const adjacency=new Map();for(const edge of edges){if(!adjacency.has(edge.from))adjacency.set(edge.from,[]);adjacency.get(edge.from).push(edge.to);}
 const cycles=[],cycleKeys=new Set();
 // A wait graph is bounded to 2000 nodes; iterative DFS avoids call-stack exhaustion.
 const color=new Map();
 for(let start=0;start<threads.length;start++){
  if(color.get(start))continue;const stack=[{node:start,next:0}],active=new Map([[start,0]]);color.set(start,1);
  while(stack.length){const frame=stack[stack.length-1],nexts=adjacency.get(frame.node)||[];
   if(frame.next>=nexts.length){color.set(frame.node,2);active.delete(frame.node);stack.pop();continue;}
   const next=nexts[frame.next++];
   if(active.has(next)){const nodes=stack.slice(active.get(next)).map(f=>f.node),key=nodes.slice().sort((a,b)=>a-b).join(',');if(!cycleKeys.has(key)){cycleKeys.add(key);cycles.push({threads:nodes,locks:edges.filter(e=>nodes.includes(e.from)&&nodes.includes(e.to)).map(e=>e.lock)});}}
   else if(!color.get(next)){color.set(next,1);active.set(next,stack.length);stack.push({node:next,next:0});}
  }
 }
 const states={};for(const thread of threads)states[thread.state]=(states[thread.state]||0)+1;
 return {name:snapshot.name,totalLines:lines.length,threadCount:threads.length,states,threads,monitorEdges:edges,monitorCycles:cycles,unknownOwners,unrecognizedPreview:unrecognized,explicitDeadlockReport:/Found (?:one Java-level|\d+) deadlock/i.test(snapshot.text)};
}
function run(req){
 if(!req||!Array.isArray(req.snapshots)||req.snapshots.length<1||req.snapshots.length>5)fail('snapshots에 1~5개 시점의 덤프를 넣으세요.');
 const snapshots=req.snapshots.map(parse),persistent=[];
 const names=snapshots.map(s=>s.name);if(new Set(names).size!==names.length)fail('각 덤프의 이름은 달라야 합니다.');
 if(snapshots.length>1)for(const first of snapshots[0].threads){
  if(!first.identity||!first.frames.length||first.framesTruncated)continue;
  const all=snapshots.map(s=>s.threads.find(t=>t.identity===first.identity&&t.name===first.name));
  if(all.every(Boolean)&&all.every(t=>!t.framesTruncated&&t.state===first.state&&t.frames.join('\n')===first.frames.join('\n')))persistent.push({identity:first.identity,name:first.name,state:first.state,frames:first.frames,sources:all.map((t,i)=>({snapshot:snapshots[i].name,line:t.line}))});
 }
 return {tool:'thread-dump-lens',verification:'전통적 HotSpot 텍스트 정적 분석',snapshots,persistent,limits:['WAITING/TIMED_WAITING이나 같은 스택은 단독으로 장애를 뜻하지 않습니다. CPU·시간 간격·처리량과 함께 확인하세요.','교착 후보는 명시된 intrinsic monitor 소유·대기의 순환만 계산합니다. AQS/ReentrantLock/조건 변수/가상 스레드는 자동 판정하지 않습니다.','반복 비교는 입력 순서의 모든 덤프에서 ID와 이름·상태·프레임이 같은 경우입니다. JVM 재시작/ID 재사용 여부는 별도 확인해야 합니다.','수집 시각·경과 시간·CPU 사용량은 이 도구가 추정하지 않습니다. 덤프에 비밀번호·SQL·업무 값이 있으면 공유 범위를 확인하세요.']};
}
return {run,parse};
});
if(typeof require==='function'&&typeof module==='object'&&require.main===module){try{const fs=require('node:fs');if(process.argv.length!==4)throw new Error('사용법: node tool.cjs 요청.json 새결과.json');const result=module.exports.run(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(fs.readFileSync(process.argv[2]))));fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n',{flag:'wx'});}catch(e){console.error(e.message);process.exitCode=1;}}
